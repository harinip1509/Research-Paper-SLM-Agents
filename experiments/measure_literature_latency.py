"""Benchmark script to measure Literature Agent cold-start and warm query latency."""
from __future__ import annotations

import asyncio
import time

from app.agents.literature_agent import literature_agent
from app.models.schemas import LiteratureExtractRequest


async def run_benchmark():
    request = LiteratureExtractRequest(
        paper_id="latency_bench_01",
        title="Chain-of-Thought Prompting Elicits Reasoning in Large Language Models",
        abstract="We explore how generating a chain of thought—a series of intermediate reasoning steps—significantly improves the ability of large language models to perform complex reasoning. In particular, we show how such reasoning abilities emerge naturally in sufficiently large language models via a simple method called chain of thought prompting.",
    )

    # 1. Cold Start Latency
    t0 = time.perf_counter()
    res1 = await literature_agent.extract_aspects(request)
    cold_latency_ms = (time.perf_counter() - t0) * 1000.0

    # 2. Warm Latency
    warm_latencies = []
    for _ in range(5):
        t_start = time.perf_counter()
        _ = await literature_agent.extract_aspects(request)
        warm_latencies.append((time.perf_counter() - t_start) * 1000.0)

    avg_warm_ms = sum(warm_latencies) / len(warm_latencies)
    min_warm_ms = min(warm_latencies)

    print("================ LITERATURE AGENT LATENCY REPORT ================")
    print(f"Cold Start Latency:     {cold_latency_ms:.2f} ms ({cold_latency_ms/1000.0:.3f} s)")
    print(f"Warm Latency (Mean):    {avg_warm_ms:.2f} ms ({avg_warm_ms/1000.0:.3f} s)")
    print(f"Warm Latency (Min):     {min_warm_ms:.2f} ms ({min_warm_ms/1000.0:.3f} s)")
    print(f"Serving Model:          {res1.source_model}")
    print("Extracted Aspects:      Problem, Method, Dataset, Results, Limitations")
    print("================================================================")


if __name__ == "__main__":
    asyncio.run(run_benchmark())
