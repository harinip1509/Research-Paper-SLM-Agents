"""Semantic Scholar Graph API and Recommendations Client.
Implements API-key authentication, exponential backoff, rate-limiting resilience,
disk-backed caching, and graceful fallback to local index.
"""
from __future__ import annotations

import asyncio
import logging
import random
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings
from app.core.cache import cache_manager
from app.models.schemas import Paper

logger = logging.getLogger(__name__)

S2_BASE_URL = "https://api.semanticscholar.org"
S2_FIELDS = "paperId,title,abstract,year,authors,venue,citationCount,url,externalIds"


class SemanticScholarClient:
    """Robust client for Semantic Scholar Graph API."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = S2_BASE_URL,
        timeout: float = 4.0,
        max_retries: int = 2,
    ) -> None:
        self.api_key = api_key or settings.s2_api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries

    def set_api_key(self, api_key: str) -> None:
        """Update Semantic Scholar API key dynamically."""
        self.api_key = (api_key or "").strip()

    def _get_headers(self) -> Dict[str, str]:
        headers = {"User-Agent": "ScholarForge-Assistant/1.0"}
        if self.api_key and self.api_key.strip():
            headers["x-api-key"] = self.api_key.strip()
        return headers

    def _parse_paper_dict(self, item: Dict[str, Any]) -> Paper:
        paper_id = item.get("paperId") or item.get("id") or ""
        title = item.get("title") or ""
        abstract = item.get("abstract") or ""
        year = item.get("year")
        venue = item.get("venue") or ""
        citation_count = item.get("citationCount") or 0
        url = item.get("url") or f"https://www.semanticscholar.org/paper/{paper_id}" if paper_id else ""
        external_ids = item.get("externalIds") or {}

        authors = []
        for a in item.get("authors") or []:
            if isinstance(a, dict) and "name" in a:
                authors.append(a["name"])
            elif isinstance(a, str):
                authors.append(a)

        return Paper(
            paper_id=paper_id,
            title=title,
            abstract=abstract,
            year=year,
            authors=authors,
            venue=venue,
            citation_count=citation_count,
            url=url,
            external_ids=external_ids,
        )

    async def search_papers(
        self,
        query: str,
        limit: int = 10,
        use_cache: bool = True,
    ) -> List[Paper]:
        """Search papers via Semantic Scholar Graph API search endpoint with backoff and cache."""
        clean_query = query.strip()
        if not clean_query:
            return []

        # Check disk cache
        if use_cache:
            cached_data = cache_manager.get_search(clean_query)
            if cached_data is not None:
                logger.info("Semantic Scholar search cache hit for: '%s'", clean_query)
                return [self._parse_paper_dict(item) for item in cached_data]

        url = f"{self.base_url}/graph/v1/paper/search"
        params = {
            "query": clean_query,
            "limit": limit,
            "fields": S2_FIELDS,
        }

        papers: List[Paper] = []
        raw_items: List[Dict[str, Any]] = []

        for attempt in range(self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.get(url, params=params, headers=self._get_headers())
                    if resp.status_code == 200:
                        data = resp.json()
                        raw_items = data.get("data", [])
                        papers = [self._parse_paper_dict(item) for item in raw_items if item.get("title")]
                        if use_cache and raw_items:
                            cache_manager.set_search(clean_query, raw_items)
                            cache_manager.set_papers(papers)
                        return papers
                    elif resp.status_code == 429:
                        wait_sec = (1.5 ** attempt) + random.uniform(0.1, 0.3)
                        logger.warning("S2 Rate Limit (429). Retrying in %.2f seconds...", wait_sec)
                        await asyncio.sleep(wait_sec)
                    else:
                        logger.warning("S2 Search API returned HTTP %s: %s", resp.status_code, resp.text[:200])
                        break
            except (httpx.ConnectError, httpx.NetworkError) as e:
                # Network unreachable / offline / DNS error: immediately gracefully degrade
                logger.info("Semantic Scholar API network unreachable (%s); gracefully falling back to local index.", e)
                break
            except Exception as e:
                logger.warning("S2 Search error on attempt %d: %s", attempt + 1, str(e))
                if attempt < self.max_retries:
                    await asyncio.sleep(0.5)

        return papers

    async def get_recommendations(
        self,
        positive_paper_ids: List[str],
        limit: int = 5,
        use_cache: bool = True,
    ) -> List[Paper]:
        """Retrieve related paper recommendations from S2 Recommendations API."""
        valid_ids = [pid for pid in positive_paper_ids if pid and not pid.startswith("local_")]
        if not valid_ids:
            return []

        cache_key = ",".join(sorted(valid_ids))
        if use_cache:
            cached_data = cache_manager.get_recommendations(cache_key)
            if cached_data is not None:
                logger.info("Semantic Scholar recommendations cache hit for: '%s'", cache_key)
                return [self._parse_paper_dict(item) for item in cached_data]

        url = f"{self.base_url}/recommendations/v1/papers"
        payload = {
            "positivePaperIds": valid_ids[:5],
            "negativePaperIds": [],
        }
        params = {"fields": S2_FIELDS, "limit": limit}

        for attempt in range(self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(
                        url,
                        params=params,
                        json=payload,
                        headers=self._get_headers(),
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        recommended_items = data.get("recommendedPapers", [])
                        papers = [self._parse_paper_dict(item) for item in recommended_items if item.get("title")]
                        if use_cache and recommended_items:
                            cache_manager.set_recommendations(cache_key, recommended_items)
                            cache_manager.set_papers(papers)
                        return papers
                    elif resp.status_code == 429:
                        wait_sec = (1.5 ** attempt) + random.uniform(0.1, 0.3)
                        await asyncio.sleep(wait_sec)
                    else:
                        break
            except (httpx.ConnectError, httpx.NetworkError) as e:
                logger.info("Semantic Scholar Recommendations network unreachable (%s); gracefully falling back.", e)
                break
            except Exception as e:
                logger.warning("S2 Recommendations error on attempt %d: %s", attempt + 1, str(e))
                if attempt < self.max_retries:
                    await asyncio.sleep(0.5)

        return []

    async def get_paper_details(self, paper_id: str) -> Optional[Paper]:
        """Fetch individual paper details by paper ID or DOI."""
        if not paper_id:
            return None

        # Check local DB cache
        cached_paper = cache_manager.get_paper(paper_id)
        if cached_paper:
            return cached_paper

        url = f"{self.base_url}/graph/v1/paper/{paper_id}"
        params = {"fields": S2_FIELDS}

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url, params=params, headers=self._get_headers())
                if resp.status_code == 200:
                    paper = self._parse_paper_dict(resp.json())
                    cache_manager.set_papers([paper])
                    return paper
        except Exception as e:
            logger.warning("Failed to fetch paper details for %s: %s", paper_id, e)

        return None


# Global singleton instance
s2_client = SemanticScholarClient()
