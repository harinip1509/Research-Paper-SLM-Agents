"""Agent 1: Topic Uniqueness Agent.
Embeds query with BGE-small, queries local FAISS + Semantic Scholar Graph API,
merges, deduplicates, reranks, calculates novelty score, generates grounded
recommendations, and applies calibrated isotonic regression.
"""
from __future__ import annotations

import logging
import re
import time
from typing import Dict, List, Tuple

import numpy as np

from app.agents.calibration import novelty_calibrator
from app.clients.semantic_scholar import s2_client
from app.config import settings
from app.models.schemas import (
    OverlapMeter,
    Paper,
    TopicUniquenessRequest,
    TopicUniquenessResponse,
)
from app.services.embedding_service import embedding_service
from app.services.faiss_service import faiss_service

logger = logging.getLogger(__name__)

TOP_5_WEIGHTS = np.array([0.35, 0.25, 0.18, 0.13, 0.09], dtype=np.float32)
TOP_5_WEIGHTS = TOP_5_WEIGHTS / np.sum(TOP_5_WEIGHTS)


def extract_keywords_from_text(text: str, max_words: int = 6) -> str:
    """Extract informative keywords from title/abstract for S2 Graph API search."""
    stopwords = {
        "a", "an", "the", "and", "or", "of", "in", "for", "with", "on", "at",
        "to", "from", "by", "as", "is", "are", "was", "were", "we", "our", "this",
        "that", "these", "those", "using", "proposed", "paper", "presents", "study",
        "approach", "method", "results", "show", "showed", "can", "could", "novel"
    }
    words = re.findall(r"\b[A-Za-z]{3,}\b", text.lower())
    filtered = [w for w in words if w not in stopwords]
    unique_words: List[str] = []
    for w in filtered:
        if w not in unique_words:
            unique_words.append(w)
        if len(unique_words) >= max_words:
            break
    return " ".join(unique_words) if unique_words else text[:60]


def generate_grounded_reason(user_title: str, user_abstract: str, paper: Paper) -> str:
    """Generate a 1-line grounded explanation for why this paper overlaps with user work."""
    venue_str = f" in {paper.venue}" if paper.venue else ""
    citations_str = f" ({paper.citation_count:,} citations)" if paper.citation_count else ""

    # Check for specific overlapping concepts
    paper_content = f"{paper.title} {paper.abstract}".lower()
    user_content = f"{user_title} {user_abstract}".lower()

    concepts = []
    if "agent" in paper_content and "agent" in user_content:
        concepts.append("autonomous multi-agent reasoning")
    if "retriev" in paper_content and "retriev" in user_content:
        concepts.append("retrieval-augmented generation")
    if "reason" in paper_content and "reason" in user_content:
        concepts.append("step-by-step reasoning decomposition")
    if "lora" in paper_content or "fine-tun" in paper_content:
        concepts.append("parameter-efficient fine-tuning")
    if "evaluat" in paper_content or "benchmark" in paper_content:
        concepts.append("empirical benchmarking and evaluation")

    if concepts:
        matched = " & ".join(concepts[:2])
        return f"Directly overlaps on {matched}{venue_str}{citations_str}."

    return f"Investigates closely related problem formulation with high structural overlap{venue_str}{citations_str}."


def generate_differentiation_suggestions(
    user_title: str,
    top_papers: List[Paper],
) -> List[str]:
    """Generate actionable, publication-grade suggestions for differentiating the work."""
    suggestions = [
        "Position the contribution as an orthogonal improvement: clearly contrast your specific mechanism vs. baseline methods in the Introduction.",
        "Emphasize unique evaluation axes: report wall-clock latency, parameter-efficiency, or out-of-domain robustness where previous work does not generalize.",
        "Include rigorous ablation studies: isolate the individual gain of each proposed agent/component with confidence intervals to demonstrate non-trivial novelty.",
    ]

    # Contextual suggestions
    has_retrieval = any("retrieval" in (p.title + p.abstract).lower() for p in top_papers[:3])
    if has_retrieval:
        suggestions.append(
            "Benchmark against hybrid retrieval baselines (BM25 + dense embedding) to demonstrate why your retrieval formulation achieves higher recall."
        )

    has_agents = any("agent" in (p.title + p.abstract).lower() for p in top_papers[:3])
    if has_agents:
        suggestions.append(
            "Measure coordination overhead and token consumption: multi-agent systems often incur high compute costs, so showing cost-effectiveness provides a compelling advantage."
        )

    return suggestions[:4]


class TopicUniquenessAgent:
    """Agent 1: End-to-end Topic Uniqueness and Paper Recommendation Pipeline."""

    def __init__(self) -> None:
        pass

    async def compute_uniqueness(
        self,
        request: TopicUniquenessRequest,
    ) -> TopicUniquenessResponse:
        """Run full hybrid retrieval, score calculation, overlap classification, and calibration."""
        start_time = time.perf_counter()
        threshold = request.overlap_threshold if request.overlap_threshold is not None else settings.uniqueness_overlap_threshold

        query_text = f"{request.title}. {request.abstract}".strip()
        if request.user_notes:
            query_text += f" Notes: {request.user_notes.strip()}"

        # 1. Embed query text using BGE-small
        query_vec = embedding_service.embed_text(query_text)

        # 2. Hybrid Retrieval:
        # (a) Local FAISS search
        faiss_hits = faiss_service.search(query_vec, top_k=settings.top_k_papers_retrieval)

        # (b) Semantic Scholar Graph API search
        keyword_query = extract_keywords_from_text(f"{request.title} {request.abstract}")
        s2_hits: List[Paper] = []
        try:
            s2_hits = await s2_client.search_papers(keyword_query, limit=10)
        except Exception as e:
            logger.warning("S2 API search encountered issue, relying on local FAISS: %s", e)

        # (c) Semantic Scholar Recommendations from top hits
        s2_rec_hits: List[Paper] = []
        seed_ids = [p.paper_id for p in s2_hits if p.paper_id and not p.paper_id.startswith("local_")][:3]
        if seed_ids:
            try:
                s2_rec_hits = await s2_client.get_recommendations(seed_ids, limit=5)
            except Exception as e:
                logger.warning("S2 Recommendations endpoint failed: %s", e)

        # 3. Merge and Deduplicate Candidates
        candidate_dict: Dict[str, Paper] = {}
        for paper, _ in faiss_hits:
            candidate_dict[paper.paper_id or paper.title.lower()] = paper

        for paper in s2_hits + s2_rec_hits:
            key = paper.paper_id or paper.title.lower()
            if key not in candidate_dict:
                candidate_dict[key] = paper

        candidates = list(candidate_dict.values())

        # If candidates are empty (e.g. completely offline with no index), initialize and search
        if not candidates:
            faiss_service.initialize_index()
            faiss_hits = faiss_service.search(query_vec, top_k=5)
            candidates = [p for p, _ in faiss_hits]

        # 4. Re-rank Candidates using Cosine Similarity against query_vec
        candidate_texts = [f"{p.title}. {p.abstract}".strip() for p in candidates]
        candidate_embeddings = embedding_service.embed_batch(candidate_texts)

        # Normalize and compute dot product
        c_norms = np.linalg.norm(candidate_embeddings, axis=1, keepdims=True)
        c_norms[c_norms == 0] = 1e-9
        normed_candidates = candidate_embeddings / c_norms

        q_norm = np.linalg.norm(query_vec)
        q_norm = q_norm if q_norm > 0 else 1e-9
        normed_q = query_vec / q_norm

        sim_scores = np.dot(normed_candidates, normed_q)

        # Attach similarity scores and sort descending
        scored_papers: List[Tuple[Paper, float]] = []
        for paper, score in zip(candidates, sim_scores):
            paper_copy = paper.model_copy()
            clamped_score = float(max(0.0, min(1.0, score)))
            paper_copy.similarity_score = round(clamped_score, 4)
            scored_papers.append((paper_copy, clamped_score))

        scored_papers.sort(key=lambda x: x[1], reverse=True)

        # 5. Calculate Uniqueness Score:
        # uniqueness = 1 - weighted mean of the top-5 similarities, shown as 0-100
        top_5_sims = [s for _, s in scored_papers[:5]]
        if len(top_5_sims) < 5:
            # Pad with minimum score or 0.0 if fewer than 5
            pad_val = top_5_sims[-1] if top_5_sims else 0.0
            top_5_sims.extend([pad_val] * (5 - len(top_5_sims)))

        raw_overlap = float(np.sum(np.array(top_5_sims, dtype=np.float32) * TOP_5_WEIGHTS))
        raw_overlap = max(0.0, min(1.0, raw_overlap))

        uniqueness_score = float(round((1.0 - raw_overlap) * 100.0, 2))

        # 6. Overlap Classification
        is_high_overlap = raw_overlap > threshold
        if is_high_overlap:
            status_text = "High overlap warning"
        elif raw_overlap > (threshold - 0.20):
            status_text = "Moderate overlap"
        else:
            status_text = "High novelty"

        overlap_meter = OverlapMeter(
            score=uniqueness_score,
            raw_overlap=round(raw_overlap, 4),
            threshold=threshold,
            is_high_overlap=is_high_overlap,
            status=status_text,
        )

        # 7. Select Recommended Papers:
        # High overlap -> top 5 to 10 papers with grounded reason + differentiation suggestions
        # Below threshold -> closest 3 papers anyway
        target_k = 8 if is_high_overlap else 3
        recommended_papers: List[Paper] = []
        for p, _ in scored_papers[:target_k]:
            p.grounded_reason = generate_grounded_reason(request.title, request.abstract, p)
            recommended_papers.append(p)

        # 8. Calibration via RINoBench Isotonic Regression
        calibrated_rating = novelty_calibrator.calibrate(uniqueness_score)

        # 9. Differentiation suggestions
        suggestions: List[str] = []
        if is_high_overlap:
            suggestions = generate_differentiation_suggestions(request.title, recommended_papers)

        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        return TopicUniquenessResponse(
            title=request.title,
            uniqueness_score=uniqueness_score,
            overlap_meter=overlap_meter,
            calibrated_novelty_rating=calibrated_rating,
            coverage_caveat=(
                "Coverage caveat: Literature retrieval misses relevant papers (estimated LitSearch Recall@20 is ~0.66). "
                "This score is an empirical estimate, not a novelty verdict."
            ),
            recommended_papers=recommended_papers,
            differentiation_suggestions=suggestions,
            latency_ms=elapsed_ms,
            cache_hit=False,
        )


uniqueness_agent = TopicUniquenessAgent()
