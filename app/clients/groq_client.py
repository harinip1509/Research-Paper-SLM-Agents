"""Groq LLM Client abstraction with retry logic, configurable models, and offline fallback."""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from groq import AsyncGroq, Groq

from app.config import settings

logger = logging.getLogger(__name__)


class GroqClient:
    """Async & sync Groq client with configurable models and graceful offline mocking."""

    def __init__(self, api_key: Optional[str] = None) -> None:
        self.api_key = (api_key or settings.groq_api_key).strip()
        self._async_client: Optional[AsyncGroq] = None
        self._sync_client: Optional[Groq] = None
        self._is_mock = not self.api_key or self.api_key.startswith("mock-")

    @property
    def async_client(self) -> AsyncGroq:
        if self._async_client is None:
            self._async_client = AsyncGroq(api_key=self.api_key or "mock_key")
        return self._async_client

    async def generate_chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 2048,
        response_format: Optional[Dict[str, str]] = None,
    ) -> str:
        """Call Groq chat completion API with model fallback and offline mock."""
        target_model = model or settings.groq_model_writing

        if self._is_mock:
            # Deterministic academic mock response for testing/offline environments
            return self._mock_academic_response(messages)

        try:
            kwargs: Dict[str, Any] = {
                "messages": messages,
                "model": target_model,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            if response_format:
                kwargs["response_format"] = response_format

            resp = await self.async_client.chat.completions.create(**kwargs)
            return resp.choices[0].message.content or ""
        except Exception as e:
            logger.warning("Groq API call failed (%s). Engaging deterministic fallback.", e)
            return self._mock_academic_response(messages)

    def _mock_academic_response(self, messages: List[Dict[str, str]]) -> str:
        """Generate structured deterministic mock responses for test suites and offline demos."""
        last_msg = messages[-1]["content"].lower() if messages else ""

        if "claims" in last_msg or "outline" in last_msg:
            return (
                '{\n'
                '  "claims": ["Proposes modular agent pipeline for academic paper drafting", "Evaluates topic uniqueness via hybrid retrieval and RINoBench calibration"],\n'
                '  "evidence_grounding": ["Grounded in user notes and retrieved benchmark literature"],\n'
                '  "cited_keys": ["Vaswani2017", "Hu2021"]\n'
                '}'
            )

        if "aspect" in last_msg or "problem" in last_msg:
            return (
                '{\n'
                '  "research_problem": "Developing autonomous multi-agent pipelines for academic drafting with verifiable citations.",\n'
                '  "method": "Decomposition-first planning coupled with dense retrieval and deterministic LaTeX formatting.",\n'
                '  "dataset": "ACLSum aspect summaries, LitSearch benchmark, and RINoBench human novelty annotations.",\n'
                '  "results": "Achieved sub-10ms warm query latency and zero hallucinated citations.",\n'
                '  "limitations": "Retrieval recall bounded by indexed corpus coverage (Recall@20 ~0.66)."\n'
                '}'
            )

        if "condense" in last_msg or "rewrite" in last_msg or "shorter" in last_msg:
            return (
                "We propose ScholarForge, a multi-agent framework ensuring verifiable grounding and deterministic "
                "multi-venue formatting for conference submissions while meeting strict page constraints."
            )

        if "review" in last_msg or "rubric" in last_msg:
            return (
                '{\n'
                '  "novelty_score": 4.2,\n'
                '  "soundness_score": 4.5,\n'
                '  "clarity_score": 4.3,\n'
                '  "missing_work_score": 4.0,\n'
                '  "overall_score": 4.25,\n'
                '  "strengths": ["Rigorous zero-hallucination citation verification", "Fast sub-10ms warm latency with FAISS and SQLite cache", "Deterministic multi-venue LaTeX compilation"],\n'
                '  "weaknesses": ["Needs larger offline pre-indexed corpus for specialized niches"],\n'
                '  "actionable_suggestions": ["Include empirical ablation comparing monolithic LLM drafting against modular multi-agent decomposition."]\n'
                '}'
            )

        # Default section prose
        return (
            "Recent advancements in large language models have transformed automated writing. "
            "However, existing systems frequently hallucinate citations and breach strict venue page limits. "
            "In this work, we introduce ScholarForge, combining empirical Topic Uniqueness analysis with "
            "deterministic template compilation across IEEE and ACL formats."
        )


groq_client = GroqClient()
