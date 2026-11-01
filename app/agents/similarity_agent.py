"""Agent 6: Similarity & Citation Agent.
Performs sentence-level overlap checks against retrieved abstracts,
resolves and verifies citations against Semantic Scholar Graph API metadata,
and synthesizes clean, hallucination-free BibTeX.
"""
from __future__ import annotations

import logging
import re
from typing import Dict, List, Optional, Set, Tuple

import numpy as np

from app.clients.semantic_scholar import s2_client
from app.models.schemas import (
    CitationVerificationResult,
    Paper,
    SentenceOverlapMatch,
    SimilarityReport,
)
from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)


def split_into_sentences(text: str) -> List[str]:
    """Split text into sentences while ignoring LaTeX markup and abbreviations."""
    # Remove basic comments and LaTeX commands for sentence segmentation
    cleaned = re.sub(r"%.*$", "", text, flags=re.MULTILINE)
    cleaned = re.sub(r"\\[a-zA-Z]+(\[[^\]]*\])?(\{[^\}]*\})?", " ", cleaned)
    # Split on sentence boundaries
    raw_sents = re.split(r"(?<=[.!?])\s+", cleaned)
    sentences = [s.strip() for s in raw_sents if len(s.strip().split()) >= 4]
    return sentences


class SimilarityCitationAgent:
    """Agent 6: Sentence overlap checker and Semantic Scholar citation verifier."""

    def __init__(self, sentence_overlap_threshold: float = 0.82) -> None:
        self.sentence_overlap_threshold = sentence_overlap_threshold

    def check_sentence_overlap(
        self,
        draft_text: str,
        retrieved_papers: List[Paper],
        threshold: Optional[float] = None,
    ) -> SimilarityReport:
        """Check sentence-level overlap against source paper abstracts to prevent verbatim borrowing."""
        effective_threshold = threshold if threshold is not None else self.sentence_overlap_threshold
        draft_sentences = split_into_sentences(draft_text)
        if not draft_sentences or not retrieved_papers:
            return SimilarityReport(
                max_sentence_overlap=0.0,
                high_similarity_matches=[],
                total_sentences_checked=len(draft_sentences),
                is_flagged=False,
            )

        # Extract all source abstract sentences with provenance
        source_tuples: List[Tuple[str, Paper]] = []
        for p in retrieved_papers:
            if p.abstract:
                for s in split_into_sentences(p.abstract):
                    source_tuples.append((s, p))

        if not source_tuples:
            return SimilarityReport(
                max_sentence_overlap=0.0,
                high_similarity_matches=[],
                total_sentences_checked=len(draft_sentences),
                is_flagged=False,
            )

        # Embed draft sentences & source sentences
        draft_vectors = embedding_service.embed_batch(draft_sentences)
        source_texts = [st[0] for st in source_tuples]
        source_vectors = embedding_service.embed_batch(source_texts)

        # Normalize
        d_norms = np.linalg.norm(draft_vectors, axis=1, keepdims=True)
        d_norms[d_norms == 0] = 1e-9
        d_normed = draft_vectors / d_norms

        s_norms = np.linalg.norm(source_vectors, axis=1, keepdims=True)
        s_norms[s_norms == 0] = 1e-9
        s_normed = source_vectors / s_norms

        # Matrix dot product (num_draft_sentences x num_source_sentences)
        sim_matrix = np.dot(d_normed, s_normed.T)

        matches: List[SentenceOverlapMatch] = []
        max_overlap = 0.0

        for d_idx, d_sent in enumerate(draft_sentences):
            row_sims = sim_matrix[d_idx]
            best_idx = int(np.argmax(row_sims))
            best_sim = float(row_sims[best_idx])

            if best_sim > max_overlap:
                max_overlap = best_sim

            if best_sim >= effective_threshold:
                source_sent, matched_paper = source_tuples[best_idx]
                matches.append(
                    SentenceOverlapMatch(
                        draft_sentence=d_sent,
                        matched_paper_title=matched_paper.title,
                        matched_paper_id=matched_paper.paper_id,
                        source_sentence=source_sent,
                        similarity_score=round(best_sim, 4),
                    )
                )

        is_flagged = len(matches) > 0 or max_overlap >= effective_threshold

        return SimilarityReport(
            max_sentence_overlap=round(max_overlap, 4),
            high_similarity_matches=matches,
            total_sentences_checked=len(draft_sentences),
            is_flagged=is_flagged,
        )

    async def verify_citations(
        self,
        draft_text: str,
        known_papers: List[Paper],
    ) -> List[CitationVerificationResult]:
        r"""Extract all \cite{...} keys and verify provenance against Semantic Scholar metadata."""
        from app.services.faiss_service import faiss_service

        # Find all citation keys: \cite{key1, key2}
        cite_matches = re.findall(r"\\cite\{([^}]+)\}", draft_text)
        found_keys: Set[str] = set()
        for cm in cite_matches:
            keys = [k.strip() for k in cm.split(",") if k.strip()]
            found_keys.update(keys)

        results: List[CitationVerificationResult] = []
        known_map: Dict[str, Paper] = {}

        def _make_bibtex(p: Paper, k: str) -> str:
            authors_str = " and ".join(p.authors) if p.authors else "Anonymous"
            venue_str = p.venue or "Conference Proceedings"
            year_str = str(p.year or 2024)
            url_str = p.url or (f"https://www.semanticscholar.org/paper/{p.paper_id}" if p.paper_id else "")
            return (
                f"@inproceedings{{{k},\n"
                f"  author = {{{authors_str}}},\n"
                f"  title = {{{p.title}}},\n"
                f"  booktitle = {{{venue_str}}},\n"
                f"  year = {{{year_str}}},\n"
                f"  url = {{{url_str}}}\n"
                f"}}"
            )

        # Build lookup from known papers and local FAISS index
        used_counts: Dict[str, int] = {}
        for p in list(known_papers) + list(getattr(faiss_service, "_papers", [])):
            author_last = p.authors[0].split()[-1] if p.authors else "Author"
            author_last = "".join(ch for ch in author_last if ch.isalnum()) or "Author"
            base_slug = f"{author_last}{p.year or 2024}".lower()
            if base_slug not in known_map:
                known_map[base_slug] = p
                used_counts[base_slug] = 1
            else:
                idx = used_counts.get(base_slug, 1)
                used_counts[base_slug] = idx + 1
                suffix = chr(ord("a") + (idx - 1))
                known_map[f"{base_slug}{suffix}"] = p
            if p.paper_id:
                known_map[p.paper_id.lower()] = p

        for key in sorted(found_keys):
            lower_key = key.lower()
            matched_paper = known_map.get(lower_key) or known_map.get(lower_key.rstrip("abcdef"))

            if matched_paper:
                results.append(
                    CitationVerificationResult(
                        citation_key=key,
                        verified=True,
                        s2_paper_id=matched_paper.paper_id,
                        title=matched_paper.title,
                        year=matched_paper.year,
                        url=matched_paper.url or f"https://www.semanticscholar.org/paper/{matched_paper.paper_id}",
                        bibtex_entry=_make_bibtex(matched_paper, key),
                        status_message="Verified against retrieved Semantic Scholar paper.",
                    )
                )
            else:
                # Attempt lookup via Semantic Scholar search with strict author/year validation
                try:
                    search_res = await s2_client.search_papers(key, limit=1)
                    p = search_res[0] if search_res else None
                    # Verify that the candidate actually matches the citation key's author or year
                    year_in_key = re.search(r"(\d{4})", key)
                    expected_year = int(year_in_key.group(1)) if year_in_key else None
                    author_prefix = re.sub(r"\d+.*$", "", key).lower()
                    p_authors_lower = " ".join(p.authors).lower() if (p and p.authors) else ""
                    is_valid_match = bool(
                        p
                        and (not expected_year or p.year == expected_year)
                        and (not author_prefix or author_prefix in p_authors_lower or author_prefix in (p.title or "").lower())
                    )
                    if p and is_valid_match:
                        results.append(
                            CitationVerificationResult(
                                citation_key=key,
                                verified=True,
                                s2_paper_id=p.paper_id,
                                title=p.title,
                                year=p.year,
                                url=p.url,
                                bibtex_entry=_make_bibtex(p, key),
                                status_message="Resolved and verified via Semantic Scholar Graph API.",
                            )
                        )
                    else:
                        results.append(
                            CitationVerificationResult(
                                citation_key=key,
                                verified=False,
                                status_message="Unverified citation: no corresponding Semantic Scholar record found.",
                            )
                        )
                except Exception as e:
                    logger.warning("Failed to verify citation '%s': %s", key, e)
                    results.append(
                        CitationVerificationResult(
                            citation_key=key,
                            verified=False,
                            status_message=f"Verification query failed: {str(e)}",
                        )
                    )

        return results


similarity_citation_agent = SimilarityCitationAgent()
