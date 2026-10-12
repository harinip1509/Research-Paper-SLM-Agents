"""Authentication service for ScholarForge.
Handles user registration, password hashing (PBKDF2-HMAC-SHA256 with salt),
session tokens, and demo accounts.
"""
from __future__ import annotations

import hashlib
import hmac
import logging
import secrets
import uuid
from typing import Any, Dict, Optional, Tuple

from app.core.database import get_db_connection

logger = logging.getLogger(__name__)


def hash_password(password: str, salt: Optional[str] = None) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with a secure random salt."""
    if salt is None:
        salt = secrets.token_hex(16)
    iterations = 100_000
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations,
    )
    return f"{salt}${iterations}${key.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against stored hash using constant-time comparison."""
    try:
        salt, iter_str, key_hex = password_hash.split("$", 2)
        iterations = int(iter_str)
        test_key = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            iterations,
        )
        return hmac.compare_digest(test_key.hex(), key_hex)
    except Exception as e:
        logger.warning("Password verification error: %s", e)
        return False


class AuthService:
    """User and session management service."""

    def __init__(self) -> None:
        self._ensure_demo_user()

    def _ensure_demo_user(self) -> None:
        """Seed a standard demo researcher account if not exists."""
        try:
            conn = get_db_connection()
            with conn:
                cur = conn.execute("SELECT id FROM users WHERE email = ?", ("demo@scholarforge.ai",))
                if not cur.fetchone():
                    user_id = str(uuid.uuid4())
                    pwd_hash = hash_password("DemoScholar2025!")
                    conn.execute(
                        """
                        INSERT INTO users (id, name, email, password_hash, institution)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                        (user_id, "Dr. Alex Vance", "demo@scholarforge.ai", pwd_hash, "MIT CSAIL / Stanford NLP"),
                    )
                    logger.info("Demo account seeded: demo@scholarforge.ai / DemoScholar2025!")
        except Exception as e:
            logger.warning("Could not seed demo account: %s", e)

    def signup(self, name: str, email: str, password: str, institution: Optional[str] = "") -> Tuple[Dict[str, Any], str]:
        """Register a new user and generate a session token."""
        email_clean = email.strip().lower()
        if not name.strip():
            raise ValueError("Name cannot be empty.")
        if len(password) < 6:
            raise ValueError("Password must be at least 6 characters.")

        conn = get_db_connection()
        with conn:
            cur = conn.execute("SELECT id FROM users WHERE email = ?", (email_clean,))
            if cur.fetchone():
                raise ValueError("An account with this email already exists.")

            user_id = str(uuid.uuid4())
            pwd_hash = hash_password(password)
            inst = (institution or "").strip()
            conn.execute(
                """
                INSERT INTO users (id, name, email, password_hash, institution)
                VALUES (?, ?, ?, ?, ?)
                """,
                (user_id, name.strip(), email_clean, pwd_hash, inst),
            )

            token = secrets.token_hex(32)
            conn.execute("INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, user_id))

        user_data = {
            "id": user_id,
            "name": name.strip(),
            "email": email_clean,
            "institution": inst,
        }
        return user_data, token

    def login(self, email: str, password: str) -> Optional[Tuple[Dict[str, Any], str]]:
        """Authenticate user and generate session token."""
        email_clean = email.strip().lower()
        conn = get_db_connection()
        cur = conn.execute("SELECT id, name, email, password_hash, institution FROM users WHERE email = ?", (email_clean,))
        row = cur.fetchone()
        if not row:
            return None

        if not verify_password(password, row["password_hash"]):
            return None

        token = secrets.token_hex(32)
        with conn:
            conn.execute("INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, row["id"]))

        user_data = {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"],
            "institution": row["institution"] or "",
        }
        return user_data, token

    def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Validate token and return user profile."""
        if not token:
            return None
        conn = get_db_connection()
        cur = conn.execute(
            """
            SELECT u.id, u.name, u.email, u.institution
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = ?
            """,
            (token.strip(),),
        )
        row = cur.fetchone()
        if not row:
            return None
        return {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"],
            "institution": row["institution"] or "",
        }

    def logout(self, token: str) -> None:
        """Invalidate session token."""
        if not token:
            return
        conn = get_db_connection()
        with conn:
            conn.execute("DELETE FROM sessions WHERE token = ?", (token.strip(),))


auth_service = AuthService()
