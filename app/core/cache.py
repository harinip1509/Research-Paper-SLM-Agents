"""Caching layer for Semantic Scholar responses, paper metadata, and vector embeddings."""
from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, List, Optional

import numpy as np

from app.core.database import get_db_connection
from app.models.schemas import Paper


def compute_hash(text: str) -> str:
    """Compute sha256 hex digest for a given string."""
    return hashlib.sha256(text.strip().lower().encode("utf-8")).hexdigest()


class CacheManager:
    """Thread-safe persistent SQLite cache for API responses and vector embeddings."""

    @staticmethod
    def get_search(query: str) -> Optional[List[Dict[str, Any]]]:
        conn = get_db_connection()
        query_hash = compute_hash(query)
        cur = conn.cursor()
        cur.execute(
            "SELECT response_json FROM search_cache WHERE query_hash = ?",
            (query_hash,),
        )
        row = cur.fetchone()
        if row:
            try:
                return json.loads(row["response_json"])
            except Exception:
                return None
        return None

    @staticmethod
    def set_search(query: str, data: List[Dict[str, Any]]) -> None:
        conn = get_db_connection()
        query_hash = compute_hash(query)
        with conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO search_cache (query_hash, query_text, response_json)
                VALUES (?, ?, ?)
                """,
                (query_hash, query, json.dumps(data)),
            )

    @staticmethod
    def get_recommendations(seed_keys: str) -> Optional[List[Dict[str, Any]]]:
        conn = get_db_connection()
        cache_key = compute_hash(seed_keys)
        cur = conn.cursor()
        cur.execute(
            "SELECT response_json FROM recommendations_cache WHERE seed_key = ?",
            (cache_key,),
        )
        row = cur.fetchone()
        if row:
            try:
                return json.loads(row["response_json"])
            except Exception:
                return None
        return None

    @staticmethod
    def set_recommendations(seed_keys: str, data: List[Dict[str, Any]]) -> None:
        conn = get_db_connection()
        cache_key = compute_hash(seed_keys)
        with conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO recommendations_cache (seed_key, response_json)
                VALUES (?, ?)
                """,
                (cache_key, json.dumps(data)),
            )

    @staticmethod
    def get_paper(paper_id: str) -> Optional[Paper]:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM papers WHERE paper_id = ?", (paper_id,))
        row = cur.fetchone()
        if row:
            try:
                return Paper(
                    paper_id=row["paper_id"],
                    title=row["title"],
                    abstract=row["abstract"] or "",
                    year=row["year"],
                    venue=row["venue"] or "",
                    citation_count=row["citation_count"] or 0,
                    url=row["url"] or "",
                    external_ids=json.loads(row["external_ids_json"] or "{}"),
                    authors=json.loads(row["authors_json"] or "[]"),
                )
            except Exception:
                return None
        return None

    @staticmethod
    def set_papers(papers: List[Paper]) -> None:
        conn = get_db_connection()
        with conn:
            for p in papers:
                conn.execute(
                    """
                    INSERT OR REPLACE INTO papers (
                        paper_id, title, abstract, year, venue, citation_count,
                        url, external_ids_json, authors_json
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        p.paper_id,
                        p.title,
                        p.abstract,
                        p.year,
                        p.venue,
                        p.citation_count,
                        p.url,
                        json.dumps(p.external_ids),
                        json.dumps(p.authors),
                    ),
                )

    @staticmethod
    def get_embedding(text: str) -> Optional[np.ndarray]:
        conn = get_db_connection()
        text_hash = compute_hash(text)
        cur = conn.cursor()
        cur.execute(
            "SELECT embedding_blob, dimension FROM embeddings_cache WHERE text_hash = ?",
            (text_hash,),
        )
        row = cur.fetchone()
        if row:
            blob = row["embedding_blob"]
            dim = row["dimension"]
            arr = np.frombuffer(blob, dtype=np.float32)
            if len(arr) == dim:
                return arr
        return None

    @staticmethod
    def set_embedding(text: str, embedding: np.ndarray) -> None:
        conn = get_db_connection()
        text_hash = compute_hash(text)
        arr = np.asarray(embedding, dtype=np.float32)
        blob = arr.tobytes()
        dim = int(arr.shape[0])
        with conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO embeddings_cache (text_hash, text_prefix, embedding_blob, dimension)
                VALUES (?, ?, ?, ?)
                """,
                (text_hash, text[:100], blob, dim),
            )


cache_manager = CacheManager()
