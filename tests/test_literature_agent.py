"""Unit tests for Literature Agent aspect extraction and ACLSum evaluation."""
from __future__ import annotations

import pytest

from app.agents.literature_agent import literature_agent
from app.models.schemas import LiteratureExtractRequest
from experiments.aclsum_eval import (
    bootstrap_ci,
    compute_rouge_l,
    compute_sbert_similarity,
    run_evaluation,
)


@pytest.mark.asyncio
async def test_extract_aspects_returns_all_five_keys():
    """Verify that Literature Agent extracts problem, method, dataset, results, limitations."""
    req = LiteratureExtractRequest(
        paper_id="test_aspect_01",
        title="Direct Preference Optimization: Your Language Model is Secretly a Reward Model",
        abstract="We propose Direct Preference Optimization (DPO), a simple training algorithm that implicitly optimizes the same objective as RLHF without explicit reward modeling.",
    )

    resp = await literature_agent.extract_aspects(req)
    assert resp.paper_id == "test_aspect_01"
    assert len(resp.aspects.research_problem) > 5
    assert len(resp.aspects.method) > 5
    assert len(resp.aspects.dataset) > 5
    assert len(resp.aspects.results) > 5
    assert len(resp.aspects.limitations) > 5
    assert resp.latency_ms > 0


def test_rouge_l_metric_properties():
    """Verify ROUGE-L metric: 1.0 on exact match, 0.0 on completely disjoint text."""
    text1 = "Deep bidirectional representations for natural language understanding"
    text2 = "Deep bidirectional representations for natural language understanding"
    text3 = "Completely unrelated words about something else"

    score_match = compute_rouge_l(text1, text2)
    score_disjoint = compute_rouge_l(text1, text3)

    assert pytest.approx(score_match, 0.01) == 1.0
    assert score_disjoint < 0.2


def test_sbert_semantic_similarity():
    """Verify SBERT semantic similarity returns high score for paraphrased concepts."""
    cand = "We introduce Transformer architectures utilizing self-attention mechanisms."
    ref = "The proposed Transformer relies entirely on attention without recurrent units."
    sim = compute_sbert_similarity(cand, ref)
    assert sim > 0.6


def test_bootstrap_ci_coverage():
    """Verify that 95% bootstrap CI brackets the sample mean."""
    scores = [0.45, 0.52, 0.48, 0.55, 0.50, 0.49, 0.53]
    mean_val = sum(scores) / len(scores)
    low, high = bootstrap_ci(scores, n_resamples=500, ci=0.95)
    assert low <= mean_val <= high


def test_aclsum_evaluation_runner():
    """Verify acceptance criterion: ACLSum evaluation script runs end to end and outputs shipping decision."""
    report = run_evaluation()
    assert "results" in report
    assert "zero_shot" in report["results"]
    assert "few_shot_3" in report["results"]
    assert "lora_qwen2.5_1.5b" in report["results"]
    assert "shipping_decision" in report
    # Fine-tuned model must beat baseline on ROUGE-L
    lora_rouge = report["results"]["lora_qwen2.5_1.5b"]["rouge_l_mean"]
    zero_rouge = report["results"]["zero_shot"]["rouge_l_mean"]
    assert lora_rouge > zero_rouge
