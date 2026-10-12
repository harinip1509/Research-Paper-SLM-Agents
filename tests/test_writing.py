"""Unit tests for Writing Agent grounding and structured generation."""
from __future__ import annotations

import pytest

from app.agents.writing_agent import (
    format_bibtex_entry,
    generate_bibtex_key,
    writing_agent,
)
from app.models.schemas import Paper


def test_bibtex_key_and_entry_generation():
    """Verify clean BibTeX key generation from author and year."""
    paper = Paper(
        paper_id="test_vaswani",
        title="Attention Is All You Need",
        abstract="Transformers without recurrence.",
        year=2017,
        authors=["Ashish Vaswani", "Noam Shazeer"],
        venue="NeurIPS",
        citation_count=100000,
        url="https://semanticscholar.org/paper/test",
        external_ids={"DOI": "10.1234/vaswani"},
    )

    key = generate_bibtex_key(paper)
    assert key == "Vaswani2017"

    entry = format_bibtex_entry(paper, key)
    assert "@inproceedings{Vaswani2017," in entry
    assert "author = {Ashish Vaswani and Noam Shazeer}" in entry
    assert "doi = {10.1234/vaswani}" in entry


@pytest.mark.asyncio
async def test_draft_section_two_stage():
    """Verify that draft_section produces structured JSON and LaTeX prose."""
    papers = [
        Paper(
            paper_id="p1",
            title="Language Models are Few-Shot Learners",
            abstract="GPT-3 few shot capabilities.",
            year=2020,
            authors=["Tom Brown"],
            venue="NeurIPS",
        )
    ]

    sec = await writing_agent.draft_section(
        section_title="Introduction",
        paper_title="ScholarForge Architecture",
        paper_abstract="Multi-agent paper drafting.",
        user_notes="We evaluate on ACLSum benchmark.",
        verified_papers=papers,
        target_words=100,
    )

    assert sec.title == "Introduction"
    assert "claims" in sec.structured_json
    assert sec.word_count > 0
    assert len(sec.latex_content) > 0


@pytest.mark.asyncio
async def test_draft_full_paper():
    """Verify full paper drafting compiles all sections and valid BibTeX."""
    papers = [
        Paper(
            paper_id="p_lora",
            title="LoRA: Low-Rank Adaptation of Large Language Models",
            abstract="Parameter efficient fine tuning.",
            year=2021,
            authors=["Edward J. Hu"],
            venue="ICLR",
        )
    ]

    draft = await writing_agent.draft_full_paper(
        paper_title="Parameter-Efficient Academic Writing",
        paper_abstract="Adapting compact LLMs for scientific paper composition.",
        user_notes="Experiments performed on Qwen 1.5B with r=16.",
        verified_papers=papers,
        section_titles=["Introduction", "Methodology"],
    )

    assert len(draft.sections) == 2
    assert "@inproceedings{Hu2021," in draft.bibtex_content
    assert draft.total_word_count > 0
