"""Verify DB rows exist for each backend operation. Run from backend/ using the venv."""
import sys
from pathlib import Path

root = Path(__file__).resolve().parent
sys.path.insert(0, str(root / "backend"))

from sqlalchemy import create_engine, text

DB = root / "backend" / "ielts_dev.db"
engine = create_engine(f"sqlite:///{DB.as_posix()}", connect_args={"check_same_thread": False})

TABLES = [
    "users", "student_profiles", "settings", "reading_sessions", "listening_sessions",
    "writing_sessions", "speaking_sessions", "questions", "answers", "band_scores",
    "weaknesses", "recommendations", "learning_history", "mock_tests", "achievements",
    "password_reset_tokens", "diagnostic_tests",
]

ok = True
with engine.connect() as c:
    rows = c.execute(text("SELECT name FROM sqlite_master WHERE type='table'")).fetchall()
    existing = {r[0] for r in rows}
    for t in TABLES:
        if t not in existing:
            print(f"FAIL missing table: {t}")
            ok = False
            continue
        n = c.execute(text(f"SELECT COUNT(*) FROM {t}")).scalar()
        status = ""
        if n == 0:
            ok = False
            status = "  <= EMPTY (no rows written during STEP13 API exercise)"
        print(f"{t}: {n}{status}")
    print("---- evidence checks ----")
    pairs = [
        ("users>0 & profiles==users", "SELECT (SELECT COUNT(*) FROM users), (SELECT COUNT(*) FROM student_profiles)"),
        ("answers written by evaluate", "SELECT COUNT(*) FROM answers"),
        ("band_scores written by evaluate/mock", "SELECT COUNT(*) FROM band_scores"),
        ("learning_history events", "SELECT COUNT(*) FROM learning_history"),
        ("sessions stored with items_json", "SELECT SUM(n) FROM (SELECT COUNT(*) n FROM reading_sessions UNION ALL SELECT COUNT(*) FROM listening_sessions UNION ALL SELECT COUNT(*) FROM writing_sessions UNION ALL SELECT COUNT(*) FROM speaking_sessions)"),
        ("questions persisted", "SELECT COUNT(*) FROM questions"),
        ("reset tokens present", "SELECT COUNT(*) FROM password_reset_tokens"),
        ("recommendations persisted", "SELECT COUNT(*) FROM recommendations"),
        ("mock tests persisted", "SELECT COUNT(*) FROM mock_tests"),
        ("weaknesses tracked", "SELECT COUNT(*) FROM weaknesses"),
    ]
    for label, q in pairs:
        v = c.execute(text(q)).scalar()
        print(f"{label}: {v}")

print("\nresult:", "ALL TABLES POPULATED" if ok else "SOME TABLES EMPTY")