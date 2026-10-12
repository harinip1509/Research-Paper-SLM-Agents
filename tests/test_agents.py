"""Unit tests for Planning, Review, and Similarity & Citation Agents (Milestone 4)."""
from __future__ import annotations

import pytest

from app.agents.planning_agent import planning_agent
from app.agents.review_agent import review_agent
from app.agents.similarity_agent import (
    similarity_citation_agent,
)
from app.models.schemas import Paper
from experiments.research_plan_eval import paired_bootstrap_ci, run_plan_evaluation


@pytest.mark.asyncio
async def test_planning_agent_decompose_then_plan():
    """Verify decompose-then-plan extracts checklist and maps sections against checklist."""
    plan = await planning_agent.generate_plan(
        paper_title="ScholarForge Multi-Agent Paper Assistant",
        research_goals=["Automate conference draft writing", "Guarantee zero citation hallucinations"],
        user_notes="Evaluated on ACLSum and LitSearch benchmarks.",
        target_venue="ieee",
    )

    assert plan.title == "ScholarForge Multi-Agent Paper Assistant"
    assert len(plan.requirements_checklist) >= 3
    assert len(plan.sections) >= 4
    # Ensure sections link to requirements
    for s in plan.sections:
        assert s.target_word_count > 0
        assert len(s.description) > 0


@pytest.mark.asyncio
async def test_review_agent_rubric_critique():
    """Verify Review Agent scores 4 dimensions and displays explicit automated critique disclaimer."""
    papers = [
        Paper(
            paper_id="rev_p1",
            title="Transformer Reasoning Models",
            abstract="Attention based models.",
        )
    ]
    critique = await review_agent.review_paper(
        paper_title="ScholarForge Architecture",
        paper_abstract="Multi-agent paper composition.",
        sections=[{"title": "Intro", "content": "Recent LLMs often hallucinate citations."}],
        cited_papers=papers,
        target_venue="acl",
    )

    assert 1.0 <= critique.novelty_score <= 5.0
    assert 1.0 <= critique.soundness_score <= 5.0
    assert 1.0 <= critique.clarity_score <= 5.0
    assert 1.0 <= critique.missing_work_score <= 5.0
    assert 1.0 <= critique.overall_score <= 5.0
    assert len(critique.strengths) > 0
    assert len(critique.actionable_suggestions) > 0
    assert "Automated critique, not a peer review verdict" in critique.disclaimer


def test_sentence_overlap_detection():
    """Verify sentence-level overlap checker flags near-verbatim sentences."""
    retrieved = [
        Paper(
            paper_id="s2_vaswani",
            title="Attention Is All You Need",
            abstract="The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. We propose the Transformer architecture.",
        )
    ]

    # Sentence copied verbatim
    draft_copied = "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. However, we explore multi-agent synthesis."

    report = similarity_citation_agent.check_sentence_overlap(draft_copied, retrieved)
    assert report.max_sentence_overlap > 0.85
    assert report.is_flagged is True
    assert len(report.high_similarity_matches) > 0
    assert report.high_similarity_matches[0].matched_paper_title == "Attention Is All You Need"


@pytest.mark.asyncio
async def test_citation_verification_against_s2():
    r"""Verify Citation Agent validates \cite{Vaswani2017} against known papers and flags unknown citations."""
    known_papers = [
        Paper(
            paper_id="204e3073870fae3d05bcbc2f6a8e263c9b72e776",
            title="Attention Is All You Need",
            year=2017,
            authors=["Ashish Vaswani"],
            url="https://semanticscholar.org/paper/vaswani",
        )
    ]

    draft_with_citations = "We build upon self-attention mechanisms \\cite{Vaswani2017} while avoiding fake citations \\cite{CompletelyFabricatedPaper2099}."

    results = await similarity_citation_agent.verify_citations(draft_with_citations, known_papers)
    assert len(results) == 2

    res_vaswani = next(r for r in results if r.citation_key == "Vaswani2017")
    assert res_vaswani.verified is True
    assert res_vaswani.year == 2017

    res_fake = next(r for r in results if r.citation_key == "CompletelyFabricatedPaper2099")
    # Fabricated paper must not be verified
    assert res_fake.verified is False


def test_research_plan_paired_bootstrap_evaluation():
    """Verify research-plan-gen paired bootstrap CI calculation and shipping rule."""
    diffs = [0.15, 0.12, 0.14, 0.10, 0.13, 0.16, 0.11]
    mean_val, low, high = paired_bootstrap_ci(diffs, n_resamples=500, ci=0.95)
    assert low <= mean_val <= high
    assert mean_val > 0.10

    report = run_plan_evaluation(n_samples=100)
    assert "models" in report
    assert "shipping_decision" in report
    assert report["models"]["decompose_then_plan"]["statistically_significant"] is True
