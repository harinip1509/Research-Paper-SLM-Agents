"""Integration tests for FastAPI endpoints."""
from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_health_check_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["app"] == "ScholarForge"


@pytest.mark.asyncio
async def test_uniqueness_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "title": "Autonomous Multi-Agent Paper Writing Systems",
            "abstract": "We explore decomposing paper composition into planning, literature review, and drafting agents.",
            "overlap_threshold": 0.75,
        }
        resp = await client.post("/api/uniqueness", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "uniqueness_score" in data
        assert "overlap_meter" in data
        assert "recommended_papers" in data
        assert "coverage_caveat" in data
        assert "calibrated_novelty_rating" in data
        assert 0.0 <= data["uniqueness_score"] <= 100.0
