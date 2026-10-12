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


@pytest.mark.asyncio
async def test_projects_crud_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Save project
        save_payload = {
            "title": "Quantum Variational ANSATZ for Drug Discovery",
            "abstract": "Investigating parameterized quantum circuits for molecular docking and ligand affinity.",
            "user_notes": "Tested on ChEMBL benchmark.",
            "venue": "ieee",
        }
        resp = await client.post("/api/projects", json=save_payload)
        assert resp.status_code == 200
        p_data = resp.json()
        assert "id" in p_data
        project_id = p_data["id"]

        # 2. List projects
        list_resp = await client.get("/api/projects")
        assert list_resp.status_code == 200
        projects = list_resp.json()
        assert any(p["id"] == project_id for p in projects)

        # 3. Get single project
        get_resp = await client.get(f"/api/projects/{project_id}")
        assert get_resp.status_code == 200
        proj = get_resp.json()
        assert proj["title"] == "Quantum Variational ANSATZ for Drug Discovery"

        # 4. Delete project
        del_resp = await client.delete(f"/api/projects/{project_id}")
        assert del_resp.status_code == 200

