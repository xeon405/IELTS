from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    """A Google Identity Services credential (encoded JWT ID token)."""

    credential: str = Field(min_length=20)
    client_id: str | None = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(min_length=8, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    current_band: float
    target_band: float
    test_type: str
    reading_band: float
    listening_band: float
    writing_band: float
    speaking_band: float
    grammar_level: str
    vocabulary_level: str
    confidence: float
    fluency: float
    coherence: float
    learning_speed: float
    study_streak: int
    weekly_goal_hours: float
    completed_hours: float
    diagnostic_completed: bool
    weak_question_types: list[str]
    weak_topics: list[str]
    strong_signals: list[str]
    vocab_mastered: list[str]


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    created_at: datetime


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    profile: dict[str, Any]
    requires_diagnostic: bool
    first_login: bool


class ResetResponse(BaseModel):
    message: str = "Password reset successfully"


class ForgotResponse(BaseModel):
    message: str
    reset_token: str | None = None


class VerificationRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=12)


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class RegisterResponse(BaseModel):
    requires_verification: bool
    message: str
    dev_code: str | None = None


class ResendResponse(BaseModel):
    message: str
    dev_code: str | None = None


class BrainRequest(BaseModel):
    profile: dict[str, Any] | None = None
    module: str | None = None
    mode: str | None = None
    questionType: str | None = None
    vocabSeen: list[str] = Field(default_factory=list)


class SessionRequest(BaseModel):
    profile: dict[str, Any] | None = None
    session: dict[str, Any] | None = None
    answers: dict[str, str] = Field(default_factory=dict)
    timing: dict[str, Any] | None = None


class MockRequest(BaseModel):
    profile: dict[str, Any] | None = None
    answers: dict[str, str] = Field(default_factory=dict)
    timing: dict[str, Any] | None = None


class TutorRequest(BaseModel):
    profile: dict[str, Any] | None = None
    question: str
    history: list[dict[str, str]] = Field(default_factory=list)


class DiagnosticAnswerItem(BaseModel):
    id: str
    answer: str


class DiagnosticSubmitRequest(BaseModel):
    answers: dict[str, str] = Field(default_factory=dict)


class SettingsUpdate(BaseModel):
    theme: str | None = None
    notifications_enabled: bool | None = None
    daily_goal_hours: float | None = None
    weekly_goal_hours: float | None = None
    reminder_enabled: bool | None = None
    reminder_time: str | None = None


class OnboardingUpdate(BaseModel):
    test_type: str | None = Field(default=None, pattern="^(academic|general)$")
    target_band: float | None = Field(default=None, ge=4.0, le=9.0)
