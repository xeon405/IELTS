"""Authentication: register, email verification, login, forgot/reset password, current user."""

import hashlib
import logging
import random
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..deps import get_current_user, get_or_create_profile
from ..schemas import (
    AuthResponse,
    ForgotPasswordRequest,
    ForgotResponse,
    GoogleLoginRequest,
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
    ResetResponse,
    ResendResponse,
    ResendVerificationRequest,
    UserOut,
    VerificationRequest,
)
from ..security import create_access_token, hash_password, verify_password
from ..services.adaptive import serialize_profile
from ..services.ratelimit import rate_limit
from ..config import settings

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/auth", tags=["auth"])

VERIFY_CODE_MINUTES = 1440  # 24 hours

GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_ISSUERS = ("https://accounts.google.com", "accounts.google.com")


def _auth_payload(db: Session, user: models.User, first_login: bool) -> AuthResponse:
    profile = get_or_create_profile(db, user)
    return AuthResponse(
        access_token=create_access_token(str(user.id)),
        token_type="bearer",
        user=UserOut.model_validate(user),
        profile=serialize_profile(db, profile),
        requires_diagnostic=not profile.diagnostic_completed,
        first_login=first_login,
    )


def _complete_login(db: Session, user: models.User) -> AuthResponse:
    """Mark first-login redirect, then return the auth payload."""
    profile = get_or_create_profile(db, user)
    first_login = not profile.first_login_redirected
    if first_login:
        profile.first_login_redirected = True
        db.commit()
    return _auth_payload(db, user, first_login=first_login)


def _verify_google_credential(credential: str, client_id: str | None) -> dict:
    """Verify a Google Identity Services ID token against Google's public keys."""
    expected_audience = client_id or settings.GOOGLE_CLIENT_ID
    if not expected_audience:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Google Sign-In is not configured on this server yet.")
    try:
        unverified = jwt.get_unverified_header(credential)
        kid = unverified.get("kid")
        with httpx.Client(timeout=10) as client:
            response = client.get(GOOGLE_JWKS_URL)
            response.raise_for_status()
        keys = response.json().get("keys", [])
        key = next((entry for entry in keys if entry.get("kid") == kid), None)
        if key is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google token could not be verified (key not found).")
        claims = jwt.decode(
            credential,
            key,
            algorithms=["RS256"],
            audience=expected_audience,
            issuer=GOOGLE_ISSUERS,
        )
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google token is invalid or expired.") from exc
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.warning("[google] token verification failed: %s", exc)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google token could not be verified.") from exc
    if not claims.get("email"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google account has no verified email address.")
    return claims


@router.post("/google", response_model=AuthResponse)
def google_login(
    payload: GoogleLoginRequest,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit("auth-google", settings.RATE_LIMIT_LOGIN_MAX, settings.RATE_LIMIT_WINDOW_SECONDS)),
):
    """Sign in or sign up with a Google ID token (Google Identity Services)."""
    claims = _verify_google_credential(payload.credential, payload.client_id)
    email = str(claims.get("email") or "").strip().lower()
    google_sub = str(claims.get("sub") or "")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google account has no email address.")

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        name = str(claims.get("name") or "").strip() or email.split("@")[0]
        user = models.User(
            email=email,
            full_name=name,
            hashed_password=hash_password(secrets.token_urlsafe(24)),
            google_sub=google_sub,
            email_verified=True,
        )
        db.add(user)
        db.flush()
        db.add(models.StudentProfile(user_id=user.id))
        db.add(models.Settings(user_id=user.id))
        db.commit()
        logger.info("[google] new user created: %s", email)
    else:
        user.email_verified = True
        user.google_sub = google_sub
        db.commit()
    return _complete_login(db, user)


def _verification_code() -> str:
    return f"{random.randint(0, 999999):06d}"


def _is_prod() -> bool:
    return (settings.APP_ENV or "development").lower() == "production"


def _send_email(to_email: str, subject: str, body: str) -> bool:
    if settings.RESEND_API_KEY:
        try:
            response = httpx.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                json={
                    "from": settings.RESEND_FROM,
                    "to": [to_email],
                    "subject": subject,
                    "text": body,
                },
                timeout=15,
            )
            if response.status_code < 400:
                return True
            logger.warning("[email] Resend API rejected: %s %s", response.status_code, response.text[:300])
        except Exception as exc:  # noqa: BLE001
            logger.warning("[email] Resend API send failed: %s", exc)
    if not settings.SMTP_HOST:
        logger.info(f"[dev] email to {to_email} ({subject}):\n{body}")
        return False
    try:
        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = settings.SMTP_FROM
        message["To"] = to_email
        message.set_content(body)
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.ehlo()
            if settings.SMTP_USER:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
        return True
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"[email] SMTP send failed: {exc}")
        return False


def _issue_verification(db: Session, user: models.User) -> str:
    code = _verification_code()
    user.email_verified = False
    user.verification_code = code
    user.verification_code_expires = datetime.now(timezone.utc) + timedelta(hours=24)
    db.commit()
    _send_email(
        user.email,
        "Verify your IELTS Examiner email",
        f"Your IELTS Examiner verification code is: {code}\n\nEnter it on the login screen to activate your account. It expires in 24 hours.",
    )
    return code


def _verify_code(user: models.User, code: str) -> bool:
    stored = user.verification_code or ""
    if stored and stored.lower() == "".join(code.split()).lower():
        expires_at = user.verification_code_expires
        if expires_at is not None:
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            return expires_at >= datetime.now(timezone.utc)
        return True
    return False


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit("auth-register", settings.RATE_LIMIT_LOGIN_MAX * 2, settings.RATE_LIMIT_WINDOW_SECONDS)),
):
    existing = db.query(models.User).filter(models.User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")
    user = models.User(
        email=payload.email.lower(),
        full_name=payload.full_name.strip(),
        hashed_password=hash_password(payload.password),
        email_verified=False,
    )
    db.add(user)
    db.flush()
    db.add(models.StudentProfile(user_id=user.id))
    db.add(models.Settings(user_id=user.id))
    db.commit()
    code = _issue_verification(db, user)
    return RegisterResponse(
        requires_verification=True,
        message="Almost there. Enter the 6-digit code sent to your email to activate your account.",
        dev_code=None if _is_prod() else code,
    )


@router.post("/verify", response_model=AuthResponse)
def verify(
    payload: VerificationRequest,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit("auth-verify", settings.RATE_LIMIT_VERIFY_MAX, settings.RATE_LIMIT_WINDOW_SECONDS)),
):
    user = db.query(models.User).filter(models.User.email == payload.email.lower()).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No account found for that email")
    if user.email_verified:
        profile = get_or_create_profile(db, user)
        return _auth_payload(db, user, first_login=not profile.first_login_redirected)
    if not _verify_code(user, payload.code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification code")
    user.email_verified = True
    user.verification_code = None
    user.verification_code_expires = None
    db.commit()
    profile = get_or_create_profile(db, user)
    first_login = not profile.first_login_redirected
    if first_login:
        profile.first_login_redirected = True
        db.commit()
    return _auth_payload(db, user, first_login=first_login)


@router.post("/verify/resend", response_model=ResendResponse)
def resend_verification(
    payload: ResendVerificationRequest,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit("auth-verify", settings.RATE_LIMIT_VERIFY_MAX, settings.RATE_LIMIT_WINDOW_SECONDS)),
):
    user = db.query(models.User).filter(models.User.email == payload.email.lower()).first()
    if user is None:
        return ResendResponse(message="If that email is registered, a new code has been sent.")
    if user.email_verified:
        return ResendResponse(message="This email is already verified — log in to continue.")
    code = _issue_verification(db, user)
    return ResendResponse(
        message="A new 6-digit verification code has been sent.",
        dev_code=None if _is_prod() else code,
    )


@router.post("/login", response_model=AuthResponse)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit("auth-login", settings.RATE_LIMIT_LOGIN_MAX, settings.RATE_LIMIT_WINDOW_SECONDS)),
):
    user = db.query(models.User).filter(models.User.email == payload.email.lower()).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your inbox for the verification code.",
        )
    return _complete_login(db, user)


@router.get("/me", response_model=AuthResponse)
def me(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(db, user)
    return _auth_payload(db, user, first_login=False)


@router.post("/forgot-password", response_model=ForgotResponse)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit("auth-forgot", settings.RATE_LIMIT_LOGIN_MAX, settings.RATE_LIMIT_WINDOW_SECONDS)),
):
    user = db.query(models.User).filter(models.User.email == payload.email.lower()).first()
    if user is None:
        return ForgotResponse(message="If that email is registered, a reset link has been sent.")
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    db.add(models.PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
    ))
    db.commit()
    message = f"Use this one-time code to reset your password: {token}"
    if _is_prod():
        message = "If that email is registered, a reset link has been sent."
    return ForgotResponse(message=message, reset_token=None if _is_prod() else token)


@router.post("/reset-password", response_model=ResetResponse)
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit("auth-reset", settings.RATE_LIMIT_LOGIN_MAX, settings.RATE_LIMIT_WINDOW_SECONDS)),
):
    token_hash = hashlib.sha256(payload.token.encode("utf-8")).hexdigest()
    row = db.query(models.PasswordResetToken).filter(models.PasswordResetToken.token_hash == token_hash).first()
    if row is None or row.used:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")
    expires_at = row.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")
    user = db.get(models.User, row.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")
    user.hashed_password = hash_password(payload.password)
    row.used = True
    db.commit()
    return ResetResponse()