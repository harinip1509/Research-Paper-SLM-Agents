"""Local FAISS Index Service for cached and benchmark papers corpus."""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import faiss
import numpy as np

from app.core.database import get_db_connection
from app.models.schemas import Paper
from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)

BENCHMARK_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "corpus" / "benchmark_papers.json"


class FAISSService:
    """In-memory FAISS vector index of cached and benchmark literature."""

    def __init__(self, dimension: int = 384) -> None:
        self.dimension = dimension
        self.index: Optional[faiss.IndexFlatIP] = None
        self.papers_store: Dict[int, Paper] = {}
        self.paper_id_to_idx: Dict[str, int] = {}
        self._is_initialized = False

    def initialize_index(self) -> None:
        """Load benchmark corpus and SQLite cached papers into FAISS index."""
        if self._is_initialized:
            return

        logger.info("Initializing FAISS local index...")
        papers_to_index: List[Paper] = []

        # 1. Load benchmark papers
        if BENCHMARK_PATH.exists():
            try:
                with open(BENCHMARK_PATH, "r", encoding="utf-8") as f:
                    benchmarks = json.load(f)
                    for item in benchmarks:
                        papers_to_index.append(Paper(**item))
            except Exception as e:
                logger.error("Failed to load benchmark papers into FAISS: %s", e)

        # 2. Load cached papers from SQLite
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM papers LIMIT 500")
        for row in cur.fetchall():
            pid = row["paper_id"]
            if not any(p.paper_id == pid for p in papers_to_index):
                papers_to_index.append(
                    Paper(
                        paper_id=pid,
                        title=row["title"],
                        abstract=row["abstract"] or "",
                        year=row["year"],
                        venue=row["venue"] or "",
                        citation_count=row["citation_count"] or 0,
                        url=row["url"] or "",
                        external_ids=json.loads(row["external_ids_json"] or "{}"),
                        authors=json.loads(row["authors_json"] or "[]"),
                    )
                )

        if not papers_to_index:
            logger.warning("No papers available to build FAISS index.")
            self.index = faiss.IndexFlatIP(self.dimension)
            self._is_initialized = True
            return

        # Prepare texts: Title + Abstract
        texts = [f"{p.title}. {p.abstract}".strip() for p in papers_to_index]
        raw_embeddings = embedding_service.embed_batch(texts)
        embeddings = np.ascontiguousarray(raw_embeddings, dtype=np.float32)

        # Normalize with numpy safely, then add to FAISS
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        norms[norms == 0] = 1e-9
        embeddings = np.ascontiguousarray(embeddings / norms, dtype=np.float32)

        self.index = faiss.IndexFlatIP(embeddings.shape[1])
        self.index.add(embeddings)

        for idx, paper in enumerate(papers_to_index):
            self.papers_store[idx] = paper
            self.paper_id_to_idx[paper.paper_id] = idx

        self._is_initialized = True
        logger.info("FAISS index initialized with %d papers.", len(papers_to_index))

    def search(self, query_vector: np.ndarray, top_k: int = 10) -> List[Tuple[Paper, float]]:
        """Search local index for top-k closest papers."""
        if not self._is_initialized or self.index is None:
            self.initialize_index()

        if self.index is None or self.index.ntotal == 0:
            return []

        q_vec = np.ascontiguousarray(query_vector, dtype=np.float32).reshape(1, -1)
        q_norm = np.linalg.norm(q_vec)
        q_norm = q_norm if q_norm > 0 else 1e-9
        q_vec = np.ascontiguousarray(q_vec / q_norm, dtype=np.float32)

        k = min(top_k, self.index.ntotal)
        scores, indices = self.index.search(q_vec, k)

        results: List[Tuple[Paper, float]] = []
        for score, idx in zip(scores[0], indices[0]):
            if idx != -1 and idx in self.papers_store:
                paper = self.papers_store[idx]
                sim = float(max(0.0, min(1.0, score)))
                results.append((paper, sim))

        return results

    def add_papers(self, papers: List[Paper]) -> None:
        """Dynamically add newly retrieved papers to the local FAISS index."""
        if not self._is_initialized:
            self.initialize_index()

        new_papers = [p for p in papers if p.paper_id not in self.paper_id_to_idx]
        if not new_papers or self.index is None:
            return

        texts = [f"{p.title}. {p.abstract}".strip() for p in new_papers]
        raw_embeddings = embedding_service.embed_batch(texts)
        embeddings = np.ascontiguousarray(raw_embeddings, dtype=np.float32)

        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        norms[norms == 0] = 1e-9
        embeddings = np.ascontiguousarray(embeddings / norms, dtype=np.float32)

        start_idx = self.index.ntotal
        self.index.add(embeddings)

        for offset, paper in enumerate(new_papers):
            idx = start_idx + offset
            self.papers_store[idx] = paper
            self.paper_id_to_idx[paper.paper_id] = idx


faiss_service = FAISSService()
