"""ScholarForge Configuration Management.
All secrets and configurable parameters are loaded strictly from .env.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from pydantic import BaseModel, Field

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"

if ENV_FILE.exists():
    load_dotenv(dotenv_path=ENV_FILE)
else:
    load_dotenv()


class Settings(BaseModel):
    # API Keys
    groq_api_key: str = Field(default_factory=lambda: os.getenv("GROQ_API_KEY", ""))
    s2_api_key: str = Field(default_factory=lambda: os.getenv("S2_API_KEY", ""))

    # Groq Model Configurations (never hardcoded, configurable via env)
    groq_model_writing: str = Field(
        default_factory=lambda: os.getenv("GROQ_MODEL_WRITING", "llama-3.3-70b-versatile")
    )
    groq_model_review: str = Field(
        default_factory=lambda: os.getenv("GROQ_MODEL_REVIEW", "llama-3.3-70b-versatile")
    )
    groq_model_planning: str = Field(
        default_factory=lambda: os.getenv("GROQ_MODEL_PLANNING", "llama-3.3-70b-versatile")
    )
    groq_model_literature: str = Field(
        default_factory=lambda: os.getenv("GROQ_MODEL_LITERATURE", "llama-3.1-8b-instant")
    )
    groq_model_fast: str = Field(
        default_factory=lambda: os.getenv("GROQ_MODEL_FAST", "llama-3.1-8b-instant")
    )

    # Embedding & Retrieval Settings
    embedding_model_name: str = Field(
        default_factory=lambda: os.getenv("EMBEDDING_MODEL_NAME", "BAAI/bge-small-en-v1.5")
    )
    embedding_device: Optional[str] = Field(
        default_factory=lambda: os.getenv("EMBEDDING_DEVICE", None)
    )

    # Uniqueness Scoring & Overlap Meter
    uniqueness_overlap_threshold: float = Field(
        default_factory=lambda: float(os.getenv("UNIQUENESS_OVERLAP_THRESHOLD", "0.75"))
    )
    top_k_papers_retrieval: int = Field(
        default_factory=lambda: int(os.getenv("TOP_K_PAPERS_RETRIEVAL", "10"))
    )

    # Storage & Cache
    database_url: str = Field(
        default_factory=lambda: os.getenv("DATABASE_URL", "sqlite:///./scholarforge.db")
    )
    db_path: Path = Field(default_factory=lambda: BASE_DIR / "scholarforge.db")
    cache_expiration_hours: int = Field(
        default_factory=lambda: int(os.getenv("CACHE_EXPIRATION_HOURS", "72"))
    )

    # Local Model Serving (Optional / Fallback)
    local_literature_model_path: str = Field(
        default_factory=lambda: os.getenv(
            "LOCAL_LITERATURE_MODEL_PATH", "models/qwen2.5-1.5b-aclsum.gguf"
        )
    )
    use_local_literature_model: bool = Field(
        default_factory=lambda: os.getenv("USE_LOCAL_LITERATURE_MODEL", "false").lower()
        in ("1", "true", "yes")
    )

    # Server settings
    app_env: str = Field(default_factory=lambda: os.getenv("APP_ENV", "development"))
    port: int = Field(default_factory=lambda: int(os.getenv("PORT", "8000")))
    host: str = Field(default_factory=lambda: os.getenv("HOST", "0.0.0.0"))


settings = Settings()
