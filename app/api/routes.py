"""FastAPI API routes for ScholarForge."""
from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, HTTPException, Query

from app.agents.uniqueness_agent import uniqueness_agent
from app.clients.semantic_scholar import s2_client
from app.models.schemas import (
    Paper,
    TopicUniquenessRequest,
    TopicUniquenessResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["ScholarForge"])


@router.post("/uniqueness", response_model=TopicUniquenessResponse)
async def compute_topic_uniqueness(request: TopicUniquenessRequest) -> TopicUniquenessResponse:
    """Analyze paper topic/abstract and compute Topic Uniqueness score, overlap meter, and recommendations."""
    try:
        response = await uniqueness_agent.compute_uniqueness(request)
        return response
    except Exception as e:
        logger.exception("Error computing uniqueness score: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to compute topic uniqueness: {str(e)}")


@router.get("/search", response_model=List[Paper])
async def search_literature(
    query: str = Query(..., min_length=2, description="Search query keywords"),
    limit: int = Query(10, ge=1, le=50, description="Max results"),
) -> List[Paper]:
    """Search literature directly using Semantic Scholar Graph API with local caching."""
    try:
        papers = await s2_client.search_papers(query=query, limit=limit)
        return papers
    except Exception as e:
        logger.exception("Search literature error: %s", e)
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/recommendations", response_model=List[Paper])
async def get_paper_recommendations(
    paper_ids: str = Query(..., description="Comma-separated positive paper IDs"),
    limit: int = Query(5, ge=1, le=20),
) -> List[Paper]:
    """Retrieve related papers from Semantic Scholar recommendations endpoint."""
    try:
        id_list = [p.strip() for p in paper_ids.split(",") if p.strip()]
        papers = await s2_client.get_recommendations(id_list, limit=limit)
        return papers
    except Exception as e:
        logger.exception("Recommendations error: %s", e)
        raise HTTPException(status_code=500, detail=f"Recommendations failed: {str(e)}")
