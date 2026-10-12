"""Unit tests for Semantic Scholar client, rate limiting, and caching using standard unittest.mock."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from httpx import Response

from app.clients.semantic_scholar import SemanticScholarClient
from app.core.cache import cache_manager


@pytest.fixture
def s2_client_fixture():
    return SemanticScholarClient(api_key="mock-s2-key", base_url="https://api.semanticscholar.org")


@pytest.mark.asyncio
async def test_search_papers_success(s2_client_fixture):
    mock_payload = {
        "data": [
            {
                "paperId": "mock123",
                "title": "Scalable Reasoning with LLM Agents",
                "abstract": "We present an agent architecture for multi-step reasoning.",
                "year": 2024,
                "authors": [{"name": "Jane Doe"}, {"name": "John Smith"}],
                "venue": "ACL",
                "citationCount": 42,
                "url": "https://www.semanticscholar.org/paper/mock123",
                "externalIds": {"DOI": "10.1234/test.mock"},
            }
        ]
    }

    mock_resp = Response(200, json=mock_payload)
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp

        papers = await s2_client_fixture.search_papers("reasoning agents", limit=5, use_cache=False)
        assert len(papers) == 1
        assert papers[0].paper_id == "mock123"
        assert papers[0].title == "Scalable Reasoning with LLM Agents"
        assert papers[0].citation_count == 42
        assert "Jane Doe" in papers[0].authors
        assert papers[0].external_ids.get("DOI") == "10.1234/test.mock"


@pytest.mark.asyncio
async def test_search_papers_rate_limit_backoff(s2_client_fixture):
    mock_payload = {
        "data": [
            {
                "paperId": "rate_limit_recovered",
                "title": "Recovered from 429",
                "abstract": "Abstract text here",
                "year": 2023,
                "authors": [],
                "venue": "NeurIPS",
                "citationCount": 10,
                "url": "",
                "externalIds": {},
            }
        ]
    }

    resp_429 = Response(429, json={"message": "Too Many Requests"})
    resp_200 = Response(200, json=mock_payload)

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = [resp_429, resp_200]

        papers = await s2_client_fixture.search_papers("test rate limit", limit=1, use_cache=False)
        assert len(papers) == 1
        assert papers[0].paper_id == "rate_limit_recovered"
        assert mock_get.call_count == 2


@pytest.mark.asyncio
async def test_search_caching(s2_client_fixture):
    query = "unique cache test query 999"
    mock_data = [
        {
            "paperId": "cached_pid",
            "title": "Cached Title",
            "abstract": "Cached abstract",
            "year": 2022,
            "authors": [{"name": "Alice"}],
            "venue": "ICML",
            "citationCount": 15,
            "url": "http://example.com",
            "externalIds": {},
        }
    ]

    # Pre-populate cache directly
    cache_manager.set_search(query, mock_data)

    # Search should hit cache without making HTTP requests
    papers = await s2_client_fixture.search_papers(query, use_cache=True)
    assert len(papers) == 1
    assert papers[0].paper_id == "cached_pid"
    assert papers[0].title == "Cached Title"


@pytest.mark.asyncio
async def test_recommendations_endpoint(s2_client_fixture):
    mock_rec_payload = {
        "recommendedPapers": [
            {
                "paperId": "rec_001",
                "title": "Recommended Complementary Paper",
                "abstract": "Aspect summarization details.",
                "year": 2024,
                "authors": [{"name": "Dr. Researcher"}],
                "venue": "EMNLP",
                "citationCount": 8,
                "url": "https://www.semanticscholar.org/paper/rec_001",
                "externalIds": {},
            }
        ]
    }

    mock_resp = Response(200, json=mock_rec_payload)
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        recs = await s2_client_fixture.get_recommendations(["mock123"], limit=3, use_cache=False)
        assert len(recs) == 1
        assert recs[0].paper_id == "rec_001"
        assert recs[0].venue == "EMNLP"
