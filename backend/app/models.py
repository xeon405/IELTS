from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Index,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


SKILLS = ("reading", "listening", "writing", "speaking")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    google_sub: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("true"), nullable=False)
    verification_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    verification_code_expires: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    verification_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    verification_locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    token_version: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    profile: Mapped["StudentProfile"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    settings: Mapped["Settings"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    reset_tokens: Mapped[list["PasswordResetToken"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)

    current_band: Mapped[float] = mapped_column(Float, default=5.5, nullable=False)
    target_band: Mapped[float] = mapped_column(Float, default=7.0, nullable=False)
    test_type: Mapped[str] = mapped_column(String(20), default="academic", nullable=False)
    reading_band: Mapped[float] = mapped_column(Float, default=5.5, nullable=False)
    listening_band: Mapped[float] = mapped_column(Float, default=5.5, nullable=False)
    writing_band: Mapped[float] = mapped_column(Float, default=5.5, nullable=False)
    speaking_band: Mapped[float] = mapped_column(Float, default=5.5, nullable=False)

    grammar_level: Mapped[str] = mapped_column(String(50), default="Intermediate", nullable=False)
    vocabulary_level: Mapped[str] = mapped_column(String(50), default="Intermediate", nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=50.0, nullable=False)
    fluency: Mapped[float] = mapped_column(Float, default=50.0, nullable=False)
    coherence: Mapped[float] = mapped_column(Float, default=50.0, nullable=False)
    learning_speed: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    study_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    weekly_goal_hours: Mapped[float] = mapped_column(Float, default=10.0, nullable=False)
    completed_hours: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    last_activity_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    diagnostic_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    first_login_redirected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user: Mapped["User"] = relationship(back_populates="profile")
    weak_question_types: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    weak_topics: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    strong_signals: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    vocab_mastered: Mapped[list] = mapped_column(JSON, default=list, nullable=False)


class SessionBase:
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    mode: Mapped[str] = mapped_column(String(80), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    question_count: Mapped[int] = mapped_column(Integer, nullable=False)
    difficulty_band: Mapped[float] = mapped_column(Float, nullable=False)
    question_types: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    examiner_intent: Mapped[str] = mapped_column(Text, default="", nullable=False)
    items_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class ReadingSession(SessionBase, Base):
    __tablename__ = "reading_sessions"


class ListeningSession(SessionBase, Base):
    __tablename__ = "listening_sessions"


class WritingSession(SessionBase, Base):
    __tablename__ = "writing_sessions"


class SpeakingSession(SessionBase, Base):
    __tablename__ = "speaking_sessions"


SESSION_MODELS = {
    "reading": ReadingSession,
    "listening": ListeningSession,
    "writing": WritingSession,
    "speaking": SpeakingSession,
}


class DiagnosticTest(Base):
    __tablename__ = "diagnostic_tests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="in_progress", nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    questions_json: Mapped[dict] = mapped_column(JSON, nullable=True)
    answers_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    results_json: Mapped[dict] = mapped_column(JSON, nullable=True)


class MockTest(Base):
    __tablename__ = "mock_tests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="in_progress", nullable=False)
    listening_band: Mapped[float] = mapped_column(Float, nullable=True)
    reading_band: Mapped[float] = mapped_column(Float, nullable=True)
    writing_band: Mapped[float] = mapped_column(Float, nullable=True)
    speaking_band: Mapped[float] = mapped_column(Float, nullable=True)
    overall_band: Mapped[float] = mapped_column(Float, nullable=True)
    answers_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    results_json: Mapped[dict] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class Question(Base):
    __tablename__ = "questions"
    __table_args__ = (
        Index("ix_questions_user_prompt", "user_id", "prompt"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    skill: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    qtype: Mapped[str] = mapped_column(String(60), nullable=False)
    topic: Mapped[str] = mapped_column(String(120), nullable=False)
    difficulty: Mapped[float] = mapped_column(Float, nullable=False)
    title: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    context: Mapped[str] = mapped_column(Text, default="", nullable=False)
    options_json: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    correct_answer: Mapped[str] = mapped_column(Text, default="", nullable=False)
    source: Mapped[str] = mapped_column(String(20), default="gemini", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"), index=True, nullable=True)
    session_id: Mapped[int] = mapped_column(Integer, index=True, nullable=True)
    session_type: Mapped[str] = mapped_column(String(30), default="practice", nullable=False)
    answer_text: Mapped[str] = mapped_column(Text, default="", nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=True)
    score: Mapped[float] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class BandScore(Base):
    __tablename__ = "band_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    skill: Mapped[str] = mapped_column(String(20), nullable=False)
    band: Mapped[float] = mapped_column(Float, nullable=False)
    accuracy: Mapped[float] = mapped_column(Float, nullable=True)
    source: Mapped[str] = mapped_column(String(30), default="practice", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class Weakness(Base):
    __tablename__ = "weaknesses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(30), default="question_type", nullable=False)
    label: Mapped[str] = mapped_column(String(120), nullable=False)
    severity: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    skill: Mapped[str] = mapped_column(String(20), nullable=False)
    mode: Mapped[str] = mapped_column(String(80), nullable=False)
    priority: Mapped[str] = mapped_column(String(40), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    target_weakness: Mapped[str] = mapped_column(String(120), nullable=False)
    expected_lift: Mapped[str] = mapped_column(String(80), nullable=False)
    difficulty_band: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class LearningHistory(Base):
    __tablename__ = "learning_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    event_type: Mapped[str] = mapped_column(String(40), nullable=False)
    skill: Mapped[str] = mapped_column(String(20), default="", nullable=False)
    details_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    code: Mapped[str] = mapped_column(String(60), nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    unlocked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class Settings(Base):
    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    theme: Mapped[str] = mapped_column(String(20), default="light", nullable=False)
    notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    daily_goal_hours: Mapped[float] = mapped_column(Float, default=2.0, nullable=False)
    weekly_goal_hours: Mapped[float] = mapped_column(Float, default=10.0, nullable=False)
    reminder_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    reminder_time: Mapped[str] = mapped_column(String(10), default="09:00", nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user: Mapped["User"] = relationship(back_populates="settings")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    user: Mapped["User"] = relationship(back_populates="reset_tokens")
