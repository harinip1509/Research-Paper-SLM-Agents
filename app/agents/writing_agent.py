"""Agent 4: Writing Agent.
Drafts academic paper section by section, strictly grounded in user notes
and retrieved Semantic Scholar literature.
Two-stage pipeline: outputs structured JSON intermediate representation, then LaTeX draft.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

from app.clients.groq_client import groq_client
from app.config import settings
from app.models.schemas import Paper, PaperDraft, PaperDraftSection

logger = logging.getLogger(__name__)


def generate_bibtex_key(paper: Paper) -> str:
    """Generate a clean BibTeX key like Vaswani2017."""
    author_last = "Author"
    if paper.authors:
        first_author = paper.authors[0]
        parts = first_author.strip().split()
        author_last = parts[-1] if parts else "Author"
        # Sanitize non-alphanumeric
        author_last = "".join(ch for ch in author_last if ch.isalnum())
    year_str = str(paper.year) if paper.year else "2024"
    return f"{author_last}{year_str}"


def format_bibtex_entry(paper: Paper, key: str) -> str:
    """Format a verified Semantic Scholar paper into standard BibTeX entry."""
    authors_str = " and ".join(paper.authors) if paper.authors else "Anonymous"
    venue_str = paper.venue or "Conference Proceedings"
    year_str = str(paper.year or 2024)
    doi_str = paper.external_ids.get("DOI", "")
    url_str = paper.url or ""

    entry = f"@inproceedings{{{key},\n"
    entry += f"  author = {{{authors_str}}},\n"
    entry += f"  title = {{{paper.title}}},\n"
    entry += f"  booktitle = {{{venue_str}}},\n"
    entry += f"  year = {{{year_str}}},\n"
    if doi_str:
        entry += f"  doi = {{{doi_str}}},\n"
    if url_str:
        entry += f"  url = {{{url_str}}}\n"
    entry += "}\n"
    return entry


class WritingAgent:
    """Agent 4: Section-by-section grounded academic paper writer."""

    def __init__(self) -> None:
        pass

    async def draft_section(
        self,
        section_title: str,
        paper_title: str,
        paper_abstract: str,
        user_notes: str,
        verified_papers: List[Paper],
        target_words: int = 600,
    ) -> PaperDraftSection:
        """Two-stage draft generation:
        Stage 1: Generates intermediate structured JSON (claims, grounding, citation keys).
        Stage 2: Translates intermediate representation to polished LaTeX text.
        """
        # Build literature context with citation keys
        lit_context_lines = []
        key_map: Dict[str, str] = {}
        for p in verified_papers[:8]:
            cite_key = generate_bibtex_key(p)
            key_map[p.paper_id] = cite_key
            lit_context_lines.append(
                f"- [cite: {cite_key}] {p.title} ({p.year or 'n.d.'}, {p.venue or 'Venue'}). Summary: {p.abstract[:200]}..."
            )
        lit_context = "\n".join(lit_context_lines) if lit_context_lines else "No external papers cited."

        # Stage 1: Generate Structured JSON Intermediate Representation
        stage1_prompt = f"""You are the ScholarForge Writing Agent. Produce a structured JSON outline for section '{section_title}'.
STRICT GROUNDING RULES:
1. Every claim must trace back to the user's notes or the retrieved papers below.
2. Only cite papers from the provided list using their exact citation keys: {[k for k in key_map.values()]}.
3. DO NOT invent citations, numbers, or datasets.

PAPER TITLE: {paper_title}
ABSTRACT: {paper_abstract}
USER NOTES: {user_notes}

AVAILABLE VERIFIED LITERATURE:
{lit_context}

Return ONLY valid JSON matching this schema:
{{
  "claims": ["string"],
  "evidence_grounding": ["string"],
  "cited_keys": ["string"]
}}"""

        stage1_messages = [
            {"role": "system", "content": "You output only valid JSON."},
            {"role": "user", "content": stage1_prompt},
        ]

        structured_json: Dict[str, Any] = {}
        try:
            raw_json = await groq_client.generate_chat(
                stage1_messages,
                model=settings.groq_model_writing,
                temperature=0.1,
                response_format={"type": "json_object"},
            )
            structured_json = json.loads(raw_json)
        except Exception:
            structured_json = {
                "claims": [f"Introduce core concepts of {section_title} based on user notes."],
                "evidence_grounding": ["Grounded directly on notes provided by researcher."],
                "cited_keys": list(key_map.values())[:2],
            }

        # Stage 2: Generate LaTeX Draft Prose from Structured JSON
        stage2_prompt = f"""You are the ScholarForge Academic Writer. Write the complete text for '{section_title}'.
Target length: ~{target_words} words.

STRUCTURED CLAIMS TO DEVELOP:
{json.dumps(structured_json, indent=2)}

USER NOTES:
{user_notes}

AVAILABLE CITATION KEYS:
{', '.join(key_map.values())}

GUIDELINES:
- Output rigorous, publication-grade academic prose in LaTeX.
- Use \\cite{{key}} for citations, ONLY using keys from the list above.
- Never fabricate citations or metrics.
- Output ONLY the body paragraphs of the section (do NOT output \\section{{{section_title}}}, just the paragraphs)."""

        stage2_messages = [
            {"role": "system", "content": "You are a professional academic writing assistant."},
            {"role": "user", "content": stage2_prompt},
        ]

        latex_prose = await groq_client.generate_chat(
            stage2_messages,
            model=settings.groq_model_writing,
            temperature=0.3,
            max_tokens=1500,
        )

        word_count = len(latex_prose.split())

        return PaperDraftSection(
            title=section_title,
            structured_json=structured_json,
            latex_content=latex_prose.strip(),
            word_count=word_count,
        )

    async def draft_full_paper(
        self,
        paper_title: str,
        paper_abstract: str,
        user_notes: str,
        verified_papers: List[Paper],
        section_titles: Optional[List[str]] = None,
    ) -> PaperDraft:
        """Draft complete conference paper section by section with verified BibTeX."""
        sections_to_draft = section_titles or [
            "Introduction",
            "Related Work",
            "System Architecture & Methodology",
            "Empirical Evaluation & Results",
            "Conclusion",
        ]

        drafted_sections: List[PaperDraftSection] = []
        for sec_title in sections_to_draft:
            sec = await self.draft_section(
                section_title=sec_title,
                paper_title=paper_title,
                paper_abstract=paper_abstract,
                user_notes=user_notes,
                verified_papers=verified_papers,
            )
            drafted_sections.append(sec)

        # Generate BibTeX from verified papers
        bibtex_entries = []
        for p in verified_papers:
            key = generate_bibtex_key(p)
            bibtex_entries.append(format_bibtex_entry(p, key))
        bibtex_content = "\n".join(bibtex_entries)

        total_words = sum(s.word_count for s in drafted_sections)

        return PaperDraft(
            title=paper_title,
            abstract=paper_abstract,
            sections=drafted_sections,
            bibtex_content=bibtex_content,
            total_word_count=total_words,
        )


writing_agent = WritingAgent()
