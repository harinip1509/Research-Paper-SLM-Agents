"""Unit tests for Topic Uniqueness Agent scoring, overlap meter, and calibration."""
from __future__ import annotations

import numpy as np
import pytest

from app.agents.calibration import novelty_calibrator
from app.agents.uniqueness_agent import (
    TOP_5_WEIGHTS,
    TopicUniquenessAgent,
    generate_differentiation_suggestions,
    generate_grounded_reason,
)
from app.models.schemas import Paper, TopicUniquenessRequest


def test_top_5_weights_normalized():
    """Verify that top-5 weights sum to 1.0 and are monotonically decreasing."""
    assert np.isclose(np.sum(TOP_5_WEIGHTS), 1.0)
    assert TOP_5_WEIGHTS[0] > TOP_5_WEIGHTS[1] > TOP_5_WEIGHTS[2] > TOP_5_WEIGHTS[3] > TOP_5_WEIGHTS[4]


def test_isotonic_calibration_monotonicity():
    """Ensure calibrated novelty rating strictly increases as uniqueness score increases."""
    scores = [10.0, 30.0, 50.0, 70.0, 90.0]
    calibrated = [novelty_calibrator.calibrate(s) for s in scores]
    for i in range(len(calibrated) - 1):
        assert calibrated[i] <= calibrated[i + 1]
    # Bound checks
    assert all(1.0 <= c <= 5.0 for c in calibrated)


def test_grounded_reason_generation():
    """Check that grounded reason extracts meaningful overlap context."""
    paper = Paper(
        paper_id="test1",
        title="Reasoning with Multi-Agent Architectures",
        abstract="We study cooperative agents for complex problem decomposition.",
        year=2023,
        venue="NeurIPS",
        citation_count=150,
        url="http://example.com",
    )
    reason = generate_grounded_reason("Agent-based Scientific Writing", "We develop multi-agent workflows.", paper)
    assert "agent" in reason.lower()
    assert "NeurIPS" in reason
    assert "150" in reason


def test_differentiation_suggestions():
    """Verify suggestions for differentiating research work."""
    papers = [
        Paper(
            paper_id="p1",
            title="Retrieval-Augmented Generation for NLP",
            abstract="Dense retrieval for open QA.",
        )
    ]
    suggestions = generate_differentiation_suggestions("Our System", papers)
    assert len(suggestions) >= 3
    assert any("retrieval" in s.lower() for s in suggestions)


@pytest.mark.asyncio
async def test_compute_uniqueness_high_overlap():
    """Test when input topic directly copies an existing benchmark paper (high overlap)."""
    agent = TopicUniquenessAgent()
    # Prompt identical to Attention Is All You Need
    request = TopicUniquenessRequest(
        title="Attention Is All You Need",
        abstract="The dominant sequence transduction models are based on complex recurrent neural networks. We propose the Transformer based solely on attention mechanisms.",
        overlap_threshold=0.70,
    )
    result = await agent.compute_uniqueness(request)

    assert result.overlap_meter.raw_overlap > 0.65
    assert result.uniqueness_score < 40.0
    assert result.overlap_meter.is_high_overlap is True
    assert result.overlap_meter.status == "High overlap warning"
    # Should recommend at least 5 papers when overlap is high
    assert len(result.recommended_papers) >= 5
    assert len(result.differentiation_suggestions) >= 2
    # Verify coverage caveat
    assert "Coverage caveat" in result.coverage_caveat
    assert "Recall@20" in result.coverage_caveat


@pytest.mark.asyncio
async def test_compute_uniqueness_low_overlap():
    """Test when input topic is completely novel / unrelated to benchmark corpus."""
    agent = TopicUniquenessAgent()
    request = TopicUniquenessRequest(
        title="Cryogenic Enzymatic Synthesis of Bio-Degradable Superconductors",
        abstract="We synthesize organic enzymes operating at liquid helium temperatures to achieve room pressure zero electrical resistance in non-silicon biopolymers.",
        overlap_threshold=0.75,
    )
    result = await agent.compute_uniqueness(request)

    assert result.overlap_meter.raw_overlap < 0.75
    assert result.uniqueness_score > 40.0
    assert result.overlap_meter.is_high_overlap is False
    assert result.overlap_meter.status != "High overlap warning"
    # When low overlap, should recommend closest 3 papers anyway
    assert len(result.recommended_papers) == 3
    assert result.calibrated_novelty_rating >= 2.5
