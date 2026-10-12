"""SQLite Database schema and connection management for ScholarForge."""
from __future__ import annotations

import sqlite3
import threading

from app.config import settings

_local = threading.local()


def get_db_connection() -> sqlite3.Connection:
    """Return a thread-local SQLite connection with foreign keys and WAL mode enabled."""
    if not hasattr(_local, "conn") or _local.conn is None:
        db_path = settings.db_path
        db_path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        # Optimize performance with WAL mode and synchronous=NORMAL
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        _local.conn = conn
    return _local.conn


def init_db() -> None:
    """Create all required tables for persistent caching and state."""
    conn = get_db_connection()
    with conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS papers (
                paper_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                abstract TEXT,
                year INTEGER,
                venue TEXT,
                citation_count INTEGER,
                url TEXT,
                external_ids_json TEXT,
                authors_json TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS search_cache (
                query_hash TEXT PRIMARY KEY,
                query_text TEXT NOT NULL,
                response_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS recommendations_cache (
                seed_key TEXT PRIMARY KEY,
                response_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS embeddings_cache (
                text_hash TEXT PRIMARY KEY,
                text_prefix TEXT,
                embedding_blob BLOB NOT NULL,
                dimension INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS uniqueness_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                abstract TEXT NOT NULL,
                score REAL NOT NULL,
                calibrated_rating REAL NOT NULL,
                response_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_papers_title ON papers(title);
            CREATE INDEX IF NOT EXISTS idx_search_created ON search_cache(created_at);
            """
        )


# Ensure DB tables exist on import
init_db()
