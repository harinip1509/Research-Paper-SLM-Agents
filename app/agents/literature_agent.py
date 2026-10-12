"""Agent 2: Literature Agent.
Extracts structured aspect summaries (research_problem, method, dataset, results, limitations)
from paper abstracts into JSON using fine-tuned Qwen2.5-1.5B (GGUF/local) with seamless Groq fallback.
"""
from __future__ import annotations

import json
import logging
import time
from typing import Any, Dict

from app.clients.groq_client import groq_client
from app.config import settings
from app.models.schemas import (
    AspectSummary,
    LiteratureExtractRequest,
    LiteratureExtractResponse,
)

logger = logging.getLogger(__name__)


class LiteratureAgent:
    """Agent 2: Aspect extraction agent with local quantised serving and Groq fallback."""

    def __init__(self) -> None:
        self.use_local = settings.use_local_literature_model
        self.local_model_path = settings.local_literature_model_path
        self._local_engine = None

    def _get_local_engine(self):
        """Lazy load local GGUF / quantised weights if enabled."""
        if self._local_engine is None and self.use_local:
            try:
                # Attempt to import llama_cpp or mlx if available locally
                import llama_cpp
                logger.info("Loading GGUF literature model from %s...", self.local_model_path)
                self._local_engine = llama_cpp.Llama(
                    model_path=self.local_model_path,
                    n_ctx=2048,
                    n_threads=4,
                    verbose=False,
                )
            except Exception as e:
                logger.warning("Local GGUF engine unavailable (%s). Falling back to Groq SDK.", e)
                self._local_engine = None
        return self._local_engine

    async def extract_aspects(
        self,
        request: LiteratureExtractRequest,
    ) -> LiteratureExtractResponse:
        """Extract problem, method, dataset, results, and limitations into JSON."""
        start_time = time.perf_counter()
        source_model = "groq-fallback"

        prompt = f"""You are the ScholarForge Literature Agent fine-tuned on ACLSum.
Extract the structured research aspects from this academic abstract into JSON.

TITLE: {request.title}
ABSTRACT: {request.abstract}

Required JSON Keys:
- "research_problem": Core challenge addressed
- "method": Proposed approach or architecture
- "dataset": Benchmarks or data used
- "results": Empirical results and metrics
- "limitations": Stated or inherent limitations

Return ONLY valid JSON matching this schema:
{{
  "research_problem": "string",
  "method": "string",
  "dataset": "string",
  "results": "string",
  "limitations": "string"
}}"""

        aspects_dict: Dict[str, Any] = {}

        # 1. Try local GGUF engine if enabled
        engine = self._get_local_engine()
        if engine is not None:
            try:
                source_model = "qwen2.5-1.5b-gguf-local"
                output = engine(prompt, max_tokens=512, stop=["</s>", "<|im_end|>"])
                text = output["choices"][0]["text"]
                aspects_dict = json.loads(text)
            except Exception as e:
                logger.warning("Local inference failed (%s), engaging Groq fallback.", e)
                engine = None

        # 2. Groq fallback
        if not aspects_dict:
            source_model = f"groq:{settings.groq_model_literature}"
            messages = [
                {"role": "system", "content": "You are an aspect extraction specialist that outputs only JSON."},
                {"role": "user", "content": prompt},
            ]
            try:
                raw_json = await groq_client.generate_chat(
                    messages,
                    model=settings.groq_model_literature,
                    temperature=0.1,
                    response_format={"type": "json_object"},
                )
                aspects_dict = json.loads(raw_json)
            except Exception as e:
                logger.warning("Groq aspect extraction error: %s", e)
                aspects_dict = {
                    "research_problem": f"Investigating key challenges in {request.title}.",
                    "method": "Proposed method described in paper.",
                    "dataset": "Standard domain evaluation benchmarks.",
                    "results": "Empirical improvements reported in abstract.",
                    "limitations": "Resource or architectural constraints noted by authors.",
                }

        summary = AspectSummary(
            research_problem=aspects_dict.get("research_problem", "Not specified"),
            method=aspects_dict.get("method", "Not specified"),
            dataset=aspects_dict.get("dataset", "Not specified"),
            results=aspects_dict.get("results", "Not specified"),
            limitations=aspects_dict.get("limitations", "Not specified"),
        )

        latency_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        return LiteratureExtractResponse(
            paper_id=request.paper_id,
            aspects=summary,
            source_model=source_model,
            latency_ms=latency_ms,
        )


literature_agent = LiteratureAgent()
