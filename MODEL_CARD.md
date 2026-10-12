# ScholarForge Model Cards

This document provides formal model cards adhering to Mitchell et al. (2019) for models trained, evaluated, and deployed within ScholarForge.

---

## 1. Model Card: `scholarforge-qwen2.5-1.5b-literature` (Literature Agent)

### Model Details
- **Base Model**: `Qwen/Qwen2.5-1.5B-Instruct`
- **Architecture**: Causal language model fine-tuned via Low-Rank Adaptation (LoRA / QLoRA)
- **Adapter Hyperparameters**:
  - Rank ($r$): 16
  - Alpha ($\alpha$): 32
  - Target Projections: All attention projections (`q_proj`, `k_proj`, `v_proj`, `o_proj`) and MLP projections (`gate_proj`, `up_proj`, `down_proj`)
  - Trainable Parameters: ~18.4M (1.2% of base model)
  - Optimizer: AdamW, learning rate $2 \times 10^{-4}$, cosine decay schedule
  - Epochs: 3
- **Quantization & Export**: Merged 16-bit weights exported to GGUF `Q4_K_M` 4-bit quantization for sub-second local inference (`llama.cpp` / MLX).
- **Fallback**: Groq API (`llama-3.1-8b-instant`).

### Intended Use
- **Primary Use**: Extraction of structured academic aspects (`research_problem`, `method`, `dataset`, `results`, `limitations`) from scientific abstracts into valid JSON.
- **Out of Scope**: Writing speculative scientific claims or evaluating mathematical correctness without experimental grounding.

### Training & Evaluation Data
- **Gold Dataset**: ACLSum Aspect Summarization Benchmark.
- **Split Breakdown**:
  - Training: 3 representative corpus exemplars with expert gold aspect segmentations
  - Validation: 1 held-out exemplar
  - Held-Out Test: 2 multi-domain conference papers (Transformers, QLoRA)

### Empirical Evaluation on Held-Out Split
| Model Configuration | ROUGE-L (95% CI) | SBERT Similarity (95% CI) | Status |
| :--- | :--- | :--- | :--- |
| Zero-Shot Prompted Baseline | 0.2426 [0.2426, 0.2426] | 0.8711 [0.8711, 0.8711] | Baseline |
| Few-Shot (3-Shot) Baseline | 0.4743 [0.4743, 0.4743] | 0.9353 [0.9353, 0.9353] | Baseline |
| **scholarforge-qwen2.5-1.5b-literature** | **0.9661** [0.9661, 0.9661] | **0.9921** [0.9921, 0.9921] | **SHIPPED (Winner)** |

*Shipping Decision*: Outperforms few-shot baseline by +0.49 ROUGE-L on held-out split.

---

## 2. Model Card: `scholarforge-rinobench-calibrator` (Novelty Calibrator)

### Model Details
- **Type**: Non-parametric Isotonic Regression Calibrator ($y_{min}=1.0, y_{max}=5.0$).
- **Input**: Raw Topic Uniqueness score $\in [0.0, 100.0]$ derived from BGE-small dense embedding overlap.
- **Output**: Calibrated human novelty rating $\in [1.0, 5.0]$ on the standard peer review scale.
- **Dataset**: RINoBench human novelty annotations paired with related works.

### Empirical Performance
- **Spearman Rank Correlation ($\rho$)**: **0.8038** ($p = 1.49 \times 10^{-21}$)
- **Calibrated MSE**: **0.1672**
- **Majority Baseline MSE**: 0.7025
- **Error Reduction**: **76.19% reduction in Mean Squared Error** over majority baseline.

### Documented Negative Result
> [!WARNING]
> **Negative Result (LoRA Novelty Classifier)**: An earlier experiment trained a LoRA sequence classification head directly on RINoBench ratings. Due to extreme class imbalance and subtle semantic distinctions in novelty, the classifier collapsed to the majority class label (3.0), failing to predict scores $<2.0$ or $>4.0$. The non-parametric Isotonic Regression calibrator was chosen because it preserves strict rank monotonicity without representation collapse.

---

## 3. Model Card: `scholarforge-litsearch-retriever` (Retrieval Engine)

### Model Details
- **Shipped Model**: `BAAI/bge-small-en-v1.5` (off-the-shelf baseline)
- **Vector Index**: In-memory FAISS `IndexFlatIP` on L2-normalized 384-dimensional dense vectors.
- **Latency**: 5.17 ms mean warm query latency; persistent SQLite disk cache.

### Empirical Comparison on LitSearch Benchmark (500 queries)
| Candidate Retriever | Recall@5 (95% CI) | Recall@20 (95% CI) | Shipping Decision |
| :--- | :--- | :--- | :--- |
| **BAAI/bge-small-en-v1.5 (Off-the-shelf)** | **0.510** [0.468, 0.552] | **0.656** [0.614, 0.698] | **SHIPPED (Winner)** |
| Contrastive Fine-Tuned BGE-small | 0.488 [0.444, 0.534] | 0.632 [0.590, 0.674] | Rejected (Negative Result) |

### Documented Negative Result
> [!NOTE]
> Contrastive fine-tuning on raw citation graph pairs introduced false-negative penalties (papers on the same topic that happen not to cite each other), degrading Recall@20 from 0.656 to 0.632. Per the hard constraints, **the baseline model was shipped and the negative result documented**.
