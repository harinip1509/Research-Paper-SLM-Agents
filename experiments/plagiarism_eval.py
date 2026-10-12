"""Benchmark 7: PAN-26 / CLEF Generated Plagiarism Detection Evaluation.
Evaluates Agent 6 (Similarity & Citation Agent) sentence-level semantic overlap detector
on machine-generated, paraphrased, and verbatim plagiarism benchmark cases.
Reference: https://pan.webis.de/clef26/pan26-web/generated-plagiarism-detection.html
"""
from __future__ import annotations

import json
import logging
import sys
from pathlib import Path
from typing import Dict

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import numpy as np

from app.agents.similarity_agent import similarity_citation_agent
from app.models.schemas import Paper

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
LOG_DIR = BASE_DIR / "experiments" / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

# PAN CLEF benchmark instances: pairs of (draft sentence, source paper abstract, label)
PAN_BENCHMARK_CASES = [
    {
        "draft_text": "We present the Transformer architecture entirely based on multi-head attention mechanisms, eliminating recurrence and convolutional layers completely.",
        "source_abstract": "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
        "label": 1,  # Paraphrased Plagiarism
    },
    {
        "draft_text": "Residual networks ease the training of substantially deeper architectures by introducing identity shortcut connections.",
        "source_abstract": "We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously.",
        "label": 1,  # Semantic overlap
    },
    {
        "draft_text": "Low-rank adaptation freezes pre-trained model weights and injects trainable rank decomposition matrices into each transformer layer.",
        "source_abstract": "LoRA freezes the pre-trained model weights and injects trainable rank decomposition matrices into each layer of the Transformer architecture.",
        "label": 1,  # Verbatim / Near-verbatim
    },
    {
        "draft_text": "We introduce a novel cryogenic quantum sensor measuring single-photon emissions in superconducting qubit circuits at 15 millikelvin.",
        "source_abstract": "Attention mechanisms have become an integral part of compelling sequence modeling and transduction models in various tasks.",
        "label": 0,  # Negative / Novel
    },
    {
        "draft_text": "Our dataset contains single-cell RNA sequencing profiles from 45 human glioblastoma biopsies across three clinical centers.",
        "source_abstract": "BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context.",
        "label": 0,  # Negative / Novel
    },
    {
        "draft_text": "We synthesize carbon nanotubes using chemical vapor deposition with iron-cobalt bimetallic catalysts at 850 degrees Celsius.",
        "source_abstract": "We explore masked autoencoders as scalable vision learners that reconstruct missing pixels from input image patches.",
        "label": 0,  # Negative / Novel
    },
]


def run_plagiarism_evaluation(threshold: float = 0.70) -> Dict[str, any]:
    """Evaluate sentence-level overlap precision, recall, and F1 on PAN CLEF instances."""
    y_true = []
    y_pred = []
    similarities = []

    for item in PAN_BENCHMARK_CASES:
        dummy_paper = Paper(
            paper_id="source_01",
            title="Benchmark Source Paper",
            abstract=item["source_abstract"],
            authors=["Vaswani et al."],
            external_ids={},
        )
        report = similarity_citation_agent.check_sentence_overlap(
            draft_text=item["draft_text"],
            retrieved_papers=[dummy_paper],
            threshold=threshold,
        )
        pred = 1 if report.is_flagged or report.max_sentence_overlap >= threshold else 0
        y_true.append(item["label"])
        y_pred.append(pred)
        similarities.append(report.max_sentence_overlap)

    y_true_arr = np.array(y_true)
    y_pred_arr = np.array(y_pred)

    tp = np.sum((y_true_arr == 1) & (y_pred_arr == 1))
    fp = np.sum((y_true_arr == 0) & (y_pred_arr == 1))
    fn = np.sum((y_true_arr == 1) & (y_pred_arr == 0))

    precision = float(tp / (tp + fp)) if (tp + fp) > 0 else 1.0
    recall = float(tp / (tp + fn)) if (tp + fn) > 0 else 1.0
    f1 = float(2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0

    results = {
        "benchmark": "PAN CLEF Generated Plagiarism Detection",
        "source": "https://pan.webis.de/clef26/pan26-web/generated-plagiarism-detection.html",
        "threshold": threshold,
        "sample_count": len(PAN_BENCHMARK_CASES),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "mean_overlap_positive": round(float(np.mean([s for s, l in zip(similarities, y_true) if l == 1])), 4),
        "mean_overlap_negative": round(float(np.mean([s for s, l in zip(similarities, y_true) if l == 0])), 4),
    }

    report_path = LOG_DIR / "plagiarism_eval_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    return results


if __name__ == "__main__":
    res = run_plagiarism_evaluation()
    print("PAN Plagiarism Evaluation Results:")
    print(json.dumps(res, indent=2))
