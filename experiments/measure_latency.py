"""Benchmark script to measure Topic Uniqueness cold-start and warm query latency."""
from __future__ import annotations

import asyncio
import time

from app.agents.uniqueness_agent import uniqueness_agent
from app.models.schemas import TopicUniquenessRequest


async def run_benchmark():
    request = TopicUniquenessRequest(
        title="Scalable Multi-Agent Workflows for Scientific Synthesis",
        abstract="We investigate multi-agent coordination topologies for scientific literature synthesis, rubric-based automated critique, and multi-venue LaTeX compilation.",
        overlap_threshold=0.75,
    )

    # Measurement 1: Cold start (first request in this process)
    t0 = time.perf_counter()
    res1 = await uniqueness_agent.compute_uniqueness(request)
    cold_latency_ms = (time.perf_counter() - t0) * 1000.0

    # Measurement 2: Warm queries (subsequent requests)
    warm_latencies = []
    for _ in range(5):
        t_start = time.perf_counter()
        _ = await uniqueness_agent.compute_uniqueness(request)
        warm_latencies.append((time.perf_counter() - t_start) * 1000.0)

    avg_warm_ms = sum(warm_latencies) / len(warm_latencies)
    min_warm_ms = min(warm_latencies)

    print("=================== LATENCY BENCHMARK REPORT ===================")
    print(f"Cold Start Latency:     {cold_latency_ms:.2f} ms ({cold_latency_ms/1000.0:.3f} s)")
    print(f"Warm Latency (Mean):    {avg_warm_ms:.2f} ms ({avg_warm_ms/1000.0:.3f} s)")
    print(f"Warm Latency (Min):     {min_warm_ms:.2f} ms ({min_warm_ms/1000.0:.3f} s)")
    print(f"Computed Uniqueness:    {res1.uniqueness_score:.2f} / 100.0")
    print(f"Overlap Status:         {res1.overlap_meter.status}")
    print(f"Recommended Papers:     {len(res1.recommended_papers)}")
    print("================================================================")


if __name__ == "__main__":
    asyncio.run(run_benchmark())
