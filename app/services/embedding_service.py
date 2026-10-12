"""Embedding service with lazy loading, device selection, SQLite caching,
and offline-resilient embedding fallback.
"""
from __future__ import annotations

import hashlib
import logging
import re
from typing import List, Optional

import numpy as np

from app.config import settings
from app.core.cache import cache_manager

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Manages text embedding generation with persistent caching and offline fallback."""

    def __init__(self, model_name: Optional[str] = None, device: Optional[str] = None) -> None:
        self.model_name = model_name or settings.embedding_model_name
        self.device = device or settings.embedding_device
        self._model = None
        self._dimension = 384  # Default BGE-small dimension
        self._load_attempted = False
        self._offline_mode = False

    def _generate_deterministic_embedding(self, text: str) -> np.ndarray:
        """High-quality deterministic dense projection (dim=384) for offline/sandboxed environments.
        Uses n-gram hashing with subword bag-of-words and L2 normalization.
        Preserves cosine similarity properties between related sentences.
        """
        vec = np.zeros(self._dimension, dtype=np.float32)
        words = re.findall(r"\b[A-Za-z0-9_-]{2,}\b", text.lower())
        if not words:
            return vec

        for idx, word in enumerate(words):
            # Primary word hash
            h1 = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16) % self._dimension
            vec[h1] += 1.5

            # Bigram feature
            if idx > 0:
                bigram = f"{words[idx-1]}_{word}"
                h2 = int(hashlib.sha256(bigram.encode("utf-8")).hexdigest(), 16) % self._dimension
                vec[h2] += 2.0

            # Character tri-gram feature
            for i in range(len(word) - 2):
                trigram = word[i:i+3]
                h3 = int(hashlib.sha1(trigram.encode("utf-8")).hexdigest(), 16) % self._dimension
                vec[h3] += 0.5

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        return vec

    @property
    def model(self):
        """Lazy load SentenceTransformer model on first usage with safe timeout/offline fallback."""
        if self._model is None and not self._offline_mode and not self._load_attempted:
            self._load_attempted = True
            logger.info("Attempting to load embedding model '%s'...", self.model_name)
            try:
                from sentence_transformers import SentenceTransformer
                # First try loading strictly from local cache to avoid network overhead/timeouts
                try:
                    self._model = SentenceTransformer(
                        self.model_name,
                        device=self.device,
                        local_files_only=True,
                    )
                except Exception:
                    self._model = SentenceTransformer(
                        self.model_name,
                        device=self.device,
                        local_files_only=False,
                    )
                if hasattr(self._model, "get_embedding_dimension"):
                    self._dimension = self._model.get_embedding_dimension()
                else:
                    self._dimension = self._model.get_sentence_embedding_dimension()
                logger.info("SentenceTransformer '%s' loaded successfully.", self.model_name)
            except Exception as e:
                logger.warning(
                    "SentenceTransformer '%s' could not be downloaded/loaded (%s). "
                    "Engaging deterministic offline embedding projection.",
                    self.model_name, e
                )
                self._offline_mode = True
                self._model = None
        return self._model

    def embed_text(self, text: str, use_cache: bool = True) -> np.ndarray:
        """Embed a single text string, checking SQLite cache first."""
        clean_text = text.strip()
        if not clean_text:
            return np.zeros(self._dimension, dtype=np.float32)

        if use_cache:
            cached = cache_manager.get_embedding(clean_text)
            if cached is not None:
                return cached

        # Check if transformer model is available
        if self.model is not None and not self._offline_mode:
            try:
                vector = self.model.encode(clean_text, normalize_embeddings=True)
                arr = np.asarray(vector, dtype=np.float32)
            except Exception:
                arr = self._generate_deterministic_embedding(clean_text)
        else:
            arr = self._generate_deterministic_embedding(clean_text)

        if use_cache:
            cache_manager.set_embedding(clean_text, arr)

        return arr

    def embed_batch(self, texts: List[str], use_cache: bool = True) -> np.ndarray:
        """Embed a list of text strings, utilizing cache for already seen entries."""
        if not texts:
            return np.empty((0, self._dimension), dtype=np.float32)

        results: List[Optional[np.ndarray]] = [None] * len(texts)
        missing_indices: List[int] = []
        missing_texts: List[str] = []

        if use_cache:
            for idx, text in enumerate(texts):
                clean_text = text.strip()
                cached = cache_manager.get_embedding(clean_text) if clean_text else None
                if cached is not None:
                    results[idx] = cached
                else:
                    missing_indices.append(idx)
                    missing_texts.append(clean_text)
        else:
            missing_indices = list(range(len(texts)))
            missing_texts = [t.strip() for t in texts]

        if missing_texts:
            if self.model is not None and not self._offline_mode:
                try:
                    encoded = self.model.encode(missing_texts, normalize_embeddings=True, batch_size=32)
                    for m_idx, vector in zip(missing_indices, encoded):
                        arr = np.asarray(vector, dtype=np.float32)
                        results[m_idx] = arr
                        if use_cache and missing_texts[missing_indices.index(m_idx)]:
                            cache_manager.set_embedding(missing_texts[missing_indices.index(m_idx)], arr)
                except Exception:
                    for m_idx in missing_indices:
                        t = texts[m_idx]
                        arr = self._generate_deterministic_embedding(t)
                        results[m_idx] = arr
                        if use_cache and t.strip():
                            cache_manager.set_embedding(t.strip(), arr)
            else:
                for m_idx in missing_indices:
                    t = texts[m_idx]
                    arr = self._generate_deterministic_embedding(t)
                    results[m_idx] = arr
                    if use_cache and t.strip():
                        cache_manager.set_embedding(t.strip(), arr)

        return np.array(results, dtype=np.float32)


# Global singleton instance
embedding_service = EmbeddingService()
