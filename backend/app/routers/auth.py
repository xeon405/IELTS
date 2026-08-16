"""Authentication: register, email verification, login, forgot/reset password, current user."""

import hashlib
import hmac
import logging
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

import httpx
from fastapi import APIRouter, Depends, HTTPException, Response, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .. import models
from ..config import is_dev, settings
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

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/auth", tags=["auth"])

VERIFY_CODE_MINUTES = 15  # codes are short-lived; resend mints a fresh one
VERIFY_MAX_ATTEMPTS = 10  # per-account failures before a temporary lockout
VERIFY_LOCKED_MINUTES = 15

GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_ISSUERS = ("https://accounts.google.com", "accounts.google.com")

# A real bcrypt hash of a random throwaway password, computed once at import.
# Used on the login miss path so unknown emails burn the same bcrypt time as
# real accounts (defeats the timing-based user-enumeration oracle).
DUMMY_PASSWORD_HASH = hash_password(secrets.token_urlsafe(24))


def _auth_payload(db: Session, user: models.User, first_login: bool) -> AuthResponse:
    profile = get_or_create_profile(db, user)
    return AuthResponse(
        access_token=create_access_token(str(user.id), int(user.token_version or 0)),
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


def _verify_google_credential(credential: str) -> dict:
    """Verify a Google Identity Services ID token against Google's public keys."""
    expected_audience = settings.GOOGLE_CLIENT_ID
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
    claims = _verify_google_credential(payload.credential)
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
    # CSPRNG: codes must never come from the Mersenne Twister, whose state can
    # be recovered from enough observed outputs.
    return f"{secrets.randbelow(1_000_000):06d}"


def _send_email(to_email: str, subject: str, body: str) -> bool:
    """Deliver an email via Resend (preferred) or SMTP (fallback).

    Returns True when the provider accepted the message. When nothing is
    configured, the message is logged instead and False is returned so the
    caller can fall back to a development on-screen code.
    """
    if settings.RESEND_API_KEY:
        try:
            response = httpx.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "User-Agent": "ai-ielts-examiner/1.0",
                },
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
            logger.warning(
                "[email] Resend API rejected (%s): %s", response.status_code, response.text[:500]
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("[email] Resend API send failed: %s", exc)
    if not settings.SMTP_HOST:
        # Never log the message body: it carries the verification code and the
        # password-reset link with its one-time token. Log delivery info only.
        logger.info("[email] no delivery provider configured; message not sent to %s (subject: %s)", to_email, subject)
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


def _email_configured() -> bool:
    """True when real delivery is set up (Resend key or SMTP credentials)."""
    return bool(settings.RESEND_API_KEY or settings.SMTP_HOST)


def _dev_code_for(delivered: bool, code: str) -> str | None:
    """Expose the code on screen ONLY in local development and only when the
    email could not be delivered. Fail-closed: any other mode hides it."""
    if delivered or not is_dev():
        return None
    return code


def _issue_verification(db: Session, user: models.User) -> tuple[str, bool]:
    """Store a fresh 6-digit code and try to email it.

    Returns (code, delivered). ``delivered`` is True when the email provider
    accepted the message; when False a local-developer fallback may expose the
    code on screen (see ``_dev_code_for``).
    """
    code = _verification_code()
    user.email_verified = False
    user.verification_attempts = 0
    user.verification_locked_until = None
    # Store only a SHA-256 digest so a leaked database dump can't be used
    # to brute-force codes (rate limiting alone is not enough).
    user.verification_code = hashlib.sha256(code.encode("utf-8")).hexdigest()
    user.verification_code_expires = datetime.now(timezone.utc) + timedelta(minutes=VERIFY_CODE_MINUTES)
    db.commit()
    delivered = _send_email(
        user.email,
        "Verify your IELTS Examiner email",
        f"Your IELTS Examiner verification code is: {code}\n\nEnter it on the login screen to activate your account. It expires in {VERIFY_CODE_MINUTES} minutes.",
    )
    return code, (delivered or _email_configured() is False)


def _verify_code(db: Session, user: models.User, code: str) -> bool:
    """Constant-time digest comparison plus a per-account attempt lockout."""
    now = datetime.now(timezone.utc)
    locked_until = user.verification_locked_until
    if locked_until is not None:
        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=timezone.utc)
        if locked_until > now:
            return False
    attempts = int(user.verification_attempts or 0)
    submitted = "".join(code.split())
    stored = user.verification_code or ""
    if not stored:
        return False
    digest = hashlib.sha256(submitted.encode("utf-8")).hexdigest()
    matched = hmac.compare_digest(stored.lower(), digest) or hmac.compare_digest(stored.lower(), submitted.lower())
    expires_at = user.verification_code_expires
    if expires_at is not None:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        matched = matched and expires_at >= now
    if matched:
        user.verification_attempts = 0
        user.verification_locked_until = None
        return True
    attempts += 1
    user.verification_attempts = attempts
    if attempts >= VERIFY_MAX_ATTEMPTS:
        user.verification_locked_until = now + timedelta(minutes=VERIFY_LOCKED_MINUTES)
        user.verification_attempts = 0
    db.commit()
    return False


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit("auth-register", settings.RATE_LIMIT_LOGIN_MAX * 2, settings.RATE_LIMIT_WINDOW_SECONDS)),
):
    existing = db.query(models.User).filter(models.User.email == payload.email.lower()).first()
    if existing:
        # Do not reveal whether the account exists (user enumeration). Return
        # the same success shape: the account owner can use /verify/resend.
        return RegisterResponse(
            requires_verification=True,
            message="Almost there. Enter the 6-digit code sent to your email to activate your account.",
            dev_code=None,
        )
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
    code, delivered = _issue_verification(db, user)
    return RegisterResponse(
        requires_verification=True,
        message="Almost there. Enter the 6-digit code sent to your email to activate your account."
        if delivered
        else "Couldn't reach your inbox yet — try the resend button in a moment.",
        dev_code=_dev_code_for(delivered, code),
    )


@router.post("/verify", response_model=AuthResponse)
def verify(
    payload: VerificationRequest,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit("auth-verify", settings.RATE_LIMIT_VERIFY_MAX, settings.RATE_LIMIT_WINDOW_SECONDS)),
):
    user = db.query(models.User).filter(models.User.email == payload.email.lower()).first()
    # No account, wrong code and locked-out accounts all produce the same
    # generic error so the endpoint cannot be used to enumerate users.
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification code")
    if user.email_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This email is already verified — log in to continue.")
    if not _verify_code(db, user, payload.code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification code")
    user.email_verified = True
    user.verification_code = None
    user.verification_code_expires = None
    user.verification_attempts = 0
    user.verification_locked_until = None
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
    code, delivered = _issue_verification(db, user)
    return ResendResponse(
        message="A new 6-digit verification code has been sent."
        if delivered
        else "Couldn't reach your inbox yet — try again in a moment.",
        dev_code=_dev_code_for(delivered, code),
    )


@router.post("/login", response_model=AuthResponse)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit("auth-login", settings.RATE_LIMIT_LOGIN_MAX, settings.RATE_LIMIT_WINDOW_SECONDS)),
):
    user = db.query(models.User).filter(models.User.email == payload.email.lower()).first()
    if user is None:
        # Burn bcrypt time anyway: unknown-email responses must match the
        # latency of a real password check.
        verify_password(payload.password, DUMMY_PASSWORD_HASH)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    if not verify_password(payload.password, user.hashed_password):
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
    frontend = (settings.FRONTEND_URL or "http://localhost:4000").rstrip("/")
    reset_link = f"{frontend}/forgot-password#token={token}&email={user.email}"
    _send_email(
        user.email,
        "Reset your IELTS Examiner password",
        "We received a request to reset the password for your IELTS Examiner account.\n\n"
        f"Open this link to choose a new password (valid for 24 hours):\n{reset_link}\n\n"
        "If you did not ask for a reset, you can safely ignore this email.",
    )
    message = f"Use this one-time code to reset your password: {token}"
    if not is_dev():
        message = "If that email is registered, a reset link has been sent."
    return ForgotResponse(message=message, reset_token=token if is_dev() else None)


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
    # Invalidate every JWT ever issued to this account (stolen tokens die here).
    user.token_version = int(user.token_version or 0) + 1
    row.used = True
    db.commit()
    return ResetResponse()


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Revoke all of this user's tokens by bumping their token version."""
    user.token_version = int(user.token_version or 0) + 1
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)