import os

from docx import Document
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_paper_docx(output_path):
    doc = Document()

    # Set page margins (1 inch on all sides)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Base style font
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(0x22, 0x22, 0x22)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(6)

    # 1. Document Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(6)
    r_title = p_title.add_run("Multi-Agent SLM Frameworks for Research Paper Writing")
    r_title.font.name = 'Times New Roman'
    r_title.font.size = Pt(18)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0x11, 0x11, 0x11)

    # Authors
    p_authors = doc.add_paragraph()
    p_authors.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_authors.paragraph_format.space_after = Pt(3)
    r_auth = p_authors.add_run("Anonymous1, Anonymous2, Anonymous3, Anonymous4")
    r_auth.font.name = 'Times New Roman'
    r_auth.font.size = Pt(11)
    r_auth.font.bold = True

    # Affiliations
    p_affil = doc.add_paragraph()
    p_affil.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_affil.paragraph_format.space_after = Pt(16)
    r_affil = p_affil.add_run("Independent Research, Vidyalankar Institute of Technology, Mumbai, India")
    r_affil.font.name = 'Times New Roman'
    r_affil.font.size = Pt(10)
    r_affil.font.italic = True
    r_affil.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

    # Abstract Box
    p_abs_title = doc.add_paragraph()
    p_abs_title.paragraph_format.space_before = Pt(6)
    p_abs_title.paragraph_format.space_after = Pt(4)
    r_abs_h = p_abs_title.add_run("Abstract")
    r_abs_h.font.name = 'Times New Roman'
    r_abs_h.font.size = Pt(11)
    r_abs_h.font.bold = True

    p_abs = doc.add_paragraph()
    p_abs.paragraph_format.left_indent = Inches(0.25)
    p_abs.paragraph_format.right_indent = Inches(0.25)
    p_abs.paragraph_format.space_after = Pt(14)
    r_abs = p_abs.add_run(
        "In recent times, Large Language Models (LLMs) have been applied to specific academic tasks, such as scientific paper summarization, "
        "information retrieval, question answering, and research assistance. Nevertheless, academic research involves multiple interrelated tasks—spanning "
        "literature search, information extraction, gap detection, planning, manuscript drafting, peer-style critique, semantic similarity verification, and "
        "publication formatting. In this work, we propose a modular multi-agent architecture grounded in Small Language Models (SLMs) to address these "
        "interconnected steps. Our architecture decomposes the research workflow into seven specialized agents: the Topic Uniqueness Agent, Literature Agent, "
        "Planning Agent, Writing Agent, Review Agent, Similarity and Citation Agent, and Formatting Agent. Agents responsible for generative tasks employ "
        "Qwen2.5-1.5B-Instruct adapted via parameter-efficient fine-tuning (LoRA), while similarity and verification tasks utilize Sentence-BERT (SBERT) and "
        "dense embeddings. On public benchmarks, decomposing research planning into an explicit requirements checklist and outline raises the rubric score "
        "of a 1.5B model from 0.233 to 0.365 (+0.132) without any training, while dense retrieval (BGE-small) outperforms BM25 on LitSearch (Recall@20 0.655 "
        "vs. 0.568). LoRA adaptation provides a targeted lexical gain for structured literature extraction on ACLSum (+0.045 ROUGE-L) but yields no reliable "
        "improvement on semantic similarity or plan generation, and a LoRA-tuned novelty classifier collapses to the majority class on RINoBench. Finally, "
        "because the best retriever misses approximately one-third of relevant literature, we show that retrieval recall inherently bounds automated novelty assessment."
    )
    r_abs.font.name = 'Times New Roman'
    r_abs.font.size = Pt(10)
    r_abs.font.italic = True

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0x11, 0x11, 0x11)
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0x22, 0x22, 0x22)
        return p

    def add_p(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11)
        return p

    # 1. Introduction
    add_h1("1. Introduction")
    add_p("The rapid development of language models has opened new avenues for automating research workflows such as literature review, summarization, methodological planning, and scientific writing. However, scholarly research consists of heterogeneous, interdependent tasks; forcing a single monolithic language model to handle all stages simultaneously introduces severe task interference, hallucinated references, and poor adherence to publication constraints.")
    add_p("Multi-agent systems provide an effective alternative by distributing complex workflows across specialized, collaborating agents. Existing frameworks such as CAMEL and AutoGen demonstrate the utility of inter-agent collaboration; however, they largely target general-domain software or open-ended dialogue rather than the rigorous constraints of academic publishing. In parallel, the emergence of capable Small Language Models (SLMs) provides an attractive foundation for resource-efficient, domain-specialized agents that operate locally without prohibitive compute overhead.")
    add_p("In this paper, we propose a modular multi-agent SLM framework designed specifically for scientific paper writing and validation. The proposed architecture consists of seven specialized agents dedicated to literature analysis, topic uniqueness estimation, structured research planning, manuscript composition, automated peer review, semantic similarity verification, and venue-compliant formatting. Rather than exchanging unstructured, open-ended natural language, agents communicate through typed, schema-validated intermediate representations (such as extracted aspect dictionaries, requirements checklists, and citation provenance tables).")
    add_p("Our contributions are threefold:\n"
          "1. A modular seven-agent framework where specialized SLM agents perform distinct research phases and exchange structured intermediate outputs;\n"
          "2. An empirical study across public benchmarks evaluating where parameter adaptation is required: task decomposition improves a 1.5B model by +0.132 rubric points without any training, and dense retrieval outperforms BM25, whereas LoRA fine-tuning provides modest lexical gains on literature extraction and fails to reliably improve plan generation or novelty classification; and\n"
          "3. Empirical evidence that retrieval recall bounds automatic novelty judgment, demonstrating that automated novelty modules must serve as evidence-surfacing tools rather than definitive originality arbiters.")

    # 2. Background and Related Work
    add_h1("2. Background and Related Work")
    add_h2("Scientific Literature Understanding")
    add_p("Scientific literature conveys information across multiple levels of granularity, including research problems, hypotheses, architectures, experimental benchmarks, and reported limitations. Consequently, scientific summarization differs substantially from standard open-domain summarization. SciTLDR formulated extreme scientific summarization, compressing full conference papers into concise TLDR summaries while preserving the core scientific contribution (Cachola et al., 2020). Beyond extreme summarization, recent benchmarks such as ACLSum evaluate aspect-based summarization, requiring models to independently extract research problems, methods, and outcomes (Takeshita et al., 2024). This provides the methodological foundation for our Literature Agent.")

    add_h2("Scientific Literature Retrieval and Research Assistance")
    add_p("Locating relevant prior work is foundational to establishing research context and novelty. While sparse lexical baselines like BM25 remain competitive, dense neural retrievers map queries and documents into shared continuous vector spaces. The LitSearch benchmark demonstrates that scientific retrieval remains challenging for modern dense models and that dense semantic embeddings substantially improve candidate recall over keyword matching (Ajith et al., 2024). Recent multi-agent research environments, such as ResearchArena (Kang and Xiong, 2025) and Agent Laboratory (Schmidgall et al., 2025), integrate retrieval with iterative reasoning, finding that structured decomposition and human-in-the-loop oversight are critical to maintaining scientific validity.")

    add_h2("Multi-Agent Language Model Systems")
    add_p("Distributing complex problem-solving across collaborative agents has received substantial attention. CAMEL introduced role-playing agents for cooperative exploration (Li et al., 2023), and AutoGen established a multi-agent conversation infrastructure supporting tool use and human intervention (Wu et al., 2023). Task specialization has proven particularly effective in domain-specific workflows: ChatDev decomposes software development into distinct design, implementation, and testing phases (Qian et al., 2024), while MetaGPT standardizes agent interactions using standard operating procedures (Hong et al., 2024). We adopt this principle of structured, task-oriented decomposition and apply it systematically to academic paper construction.")

    add_h2("Agents for Scientific Work")
    add_p("Applying language models to academic research requires rigorous domain grounding, as research questions allow multiple valid approaches yet require verifiable factual provenance. BLADE benchmarks language model agents on data-driven scientific tasks against human expert ground truth, showing that agents benefit from direct interaction with verifiable data sources (Gu et al., 2024). ResearchArena models academic workflows as discovery, selection, and organization (Kang and Xiong, 2025). Our framework builds on these insights but extends beyond literature curation to include empirical novelty estimation, outline planning, grounded drafting, automated rubric-based critique, sentence-level overlap auditing, and deterministic publication formatting.")

    add_h2("Small Language Models and Parameter-Efficient Adaptation")
    add_p("While frontier models demonstrate high reasoning capacity, Small Language Models (SLMs) offer decisive advantages in deployment cost, execution latency, and local execution privacy. The Qwen2.5 series provides strong instruction-following capabilities at compact parameter scales, making Qwen2.5-1.5B-Instruct a well-suited base model for our generative agents (Qwen Team, 2024). For task-specific adaptation, Low-Rank Adaptation (LoRA) freezes the pre-trained weights and introduces low-rank decomposition matrices into attention and MLP projections, substantially reducing trainable parameters and training memory (Hu et al., 2022).")

    # 3. Research Gap
    add_h1("3. Research Gap")
    add_p("Previous literature provides isolated solutions for individual facets of automated research: SciTLDR and ACLSum focus on summarization, LitSearch evaluates retrieval, and frameworks like AutoGen and MetaGPT demonstrate cooperative agent communication. More recently, scientific agent benchmarks like BLADE have explored autonomous hypothesis generation.")
    add_p("However, existing frameworks exhibit a notable architectural gap: they typically treat paper generation as an unconstrained, end-to-end generative task, resulting in frequent citation hallucinations, unverified originality claims, and non-compliant document layouts. Our framework addresses this gap through explicit seven-stage task decomposition. Rather than relying on a single generative prompt, the scientific workflow is partitioned into dedicated agents communicating through typed schemas, allowing researchers to audit intermediate representations at each stage.")

    # 4. Proposed Multi-Agent SLM Framework
    add_h1("4. Proposed Multi-Agent SLM Framework")
    add_p("The proposed framework comprises seven specialized agents: the Topic Uniqueness Agent, Literature Agent, Planning Agent, Writing Agent, Review Agent, Similarity and Citation Agent, and Formatting Agent. Each agent is assigned a single responsibility and produces structured representations consumed by downstream agents. Generative tasks use Qwen2.5-1.5B-Instruct adapted via parameter-efficient LoRA, while retrieval and semantic comparison rely on BGE-small and Sentence-BERT (SBERT).")

    add_h2("4.1 Topic Uniqueness Agent")
    add_p("The Topic Uniqueness Agent receives a proposed research topic and preliminary notes alongside candidate literature retrieved via dense embeddings. It identifies existing work, highlights conceptual overlap, and computes an initial empirical novelty assessment. The agent is intended to support early-stage topic evaluation and should not be considered a definitive originality checker, since novelty ultimately depends on the completeness of retrieved literature and human assessment.")

    add_h2("4.2 Literature Agent")
    add_p("The Literature Agent converts retrieved scientific papers into structured schema representations containing the research question, proposed methodology, benchmark datasets, empirical results, stated limitations, and identified research gaps. This structured representation allows multi-paper literature to be systematically compared and provides clean, factual context for subsequent planning and writing stages without re-reading full unstructured text.")

    add_h2("4.3 Planning Agent")
    add_p("The Planning Agent utilizes extracted literature representations and identified research gaps to synthesize a structured research plan. It formulates research objectives, concrete research questions, evaluation methodologies, and expected outcomes. Operating as an intermediate reasoning stage between literature analysis and academic writing, this plan provides a transparent checklist that researchers can inspect, modify, or approve before manuscript drafting commences.")

    add_h2("4.4 Writing Agent")
    add_p("The Writing Agent produces academic prose based strictly on the approved research plan and structured literature context. It synthesizes publication sections—including the introduction, related work, methodology, and experimental discussion. Because the Writing Agent receives pre-processed, grounded context from prior stages, it focuses entirely on coherent content synthesis without needing to execute retrieval or gap analysis simultaneously.")

    add_h2("4.5 Review Agent")
    add_p("The Review Agent acts as an automated quality-control module, evaluating the generated manuscript across four standard criteria: structural soundness, technical clarity, conceptual consistency, and unsupported statements. It outputs numerical scores and actionable feedback to guide revision, serving as an automated diagnostic tool prior to human submission.")

    add_h2("4.6 Similarity and Citation Agent")
    add_p("The Similarity and Citation Agent carries out semantic comparison of generated text against retrieved literature using Sentence-BERT (SBERT) embeddings and cosine similarity. It detects potential verbatim or near-verbatim overlaps and resolves in-text citations against verified Semantic Scholar metadata. For two sentence embeddings u and v, cosine similarity is computed as:")

    # Equation Paragraph
    p_eq = doc.add_paragraph()
    p_eq.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_eq.paragraph_format.space_before = Pt(6)
    p_eq.paragraph_format.space_after = Pt(6)
    r_eq = p_eq.add_run("sim(u, v) = (u · v) / ( ||u|| ||v|| )")
    r_eq.font.name = 'Times New Roman'
    r_eq.font.size = Pt(11.5)
    r_eq.font.bold = True

    add_p("Segments exhibiting similarity above threshold τ = 0.82 are flagged for review. Importantly, elevated similarity values serve as indicative indicators for citation insertion rather than conclusive evidence of plagiarism, acknowledging legitimate conceptual alignment between related studies.")

    add_h2("4.7 Formatting Agent")
    add_p("The Formatting Agent organizes the reviewed manuscript according to the specific layout, typographic, and citation standards of the target conference or journal (e.g., IEEE two-column, ACL double-blind with line numbers, ACM SIGCONF, Springer LNCS, or standard preprint). It manages section hierarchy, equations, author anonymization, bibliography rendering, and closed-loop page calibration, ensuring the final output conforms strictly to venue length limits.")

    # 5. Agent Coordination and Workflow
    add_h1("5. Agent Coordination and Workflow")
    add_p("In our framework, workflow execution is sequential with structured intermediate handoffs: the output of each specialized agent forms the validated input to the subsequent agent. Beginning with user topic inputs, the pipeline proceeds through novelty evaluation, literature aspect extraction, research planning, grounded section drafting, peer review critique, sentence-level similarity auditing, and deterministic manuscript formatting.")

    add_h2("5.1 Prototype Implementation")
    add_p("We implemented and evaluated the core components of the proposed architecture using Qwen2.5-1.5B-Instruct as the base model for generative modules and SBERT/BGE-small for vector embeddings. The Literature Agent was fine-tuned on scientific paper abstracts using LoRA to extract standardized aspect schemas (research_problem, method, dataset, results, limitations, research_gap). The Topic Uniqueness Agent was evaluated using dense vector similarity coupled with human novelty annotations. The Similarity and Citation Agent was implemented using SBERT embeddings to compute dense cosine similarity matrices between generated text and source abstracts without task-specific LoRA parameters.")

    add_h2("5.2 Prototype Results")
    add_p("The Literature Agent demonstrated successful task adaptation under LoRA fine-tuning, with training and validation loss steadily converging across training steps. When evaluated on unseen abstracts, it reliably structured titles and abstracts into predefined category fields, eliminating unstructured hallucination. The Topic Uniqueness Agent successfully generated structured novelty and gap summaries; however, our benchmark evaluation in Section 5.4 demonstrates that relying solely on SLM generation for novelty discrimination remains challenging. The Similarity and Citation Agent reliably surfaced continuous semantic similarity distributions across candidate papers, accurately distinguishing closely related conceptual baselines from orthogonal literature. Across the broader framework, the Planning, Writing, Review, and Formatting agents build on these grounded representations to complete the multi-agent pipeline.")

    add_h2("5.3 Structured Agent Communication")
    add_p("A primary architectural principle is the enforcement of structured intermediate schemas over free-form conversational text. By restricting inter-agent communication to validated JSON structures and typed checklists, intermediate outputs remain human-interpretable. If an erroneous claim appears in a draft, a researcher can directly trace whether the error originated in literature extraction (Agent 4.2), planning requirements (Agent 4.3), or drafting synthesis (Agent 4.4).")

    add_h2("5.4 Benchmark Evaluation")
    add_p("We evaluated four critical components on public academic benchmarks using Qwen2.5-1.5B-Instruct with 4-bit quantization; intervals denote 95% bootstrap confidence intervals over test items.")
    add_p("• Planning: Evaluated on 60 goals from the arXiv split of research-plan-gen (Goel et al., 2025) using a Qwen2.5-3B rubric judge. We compared a single-prompt baseline, decompose-then-plan (where the model first extracts requirements into a checklist, then plans against it), and a LoRA planner trained on 88 reference plans.\n"
          "• Retrieval: Evaluated BM25, SBERT MiniLM, and BGE-small (Xiao et al., 2024) on the LitSearch benchmark (Ajith et al., 2024; 597 queries across ~64K papers) using Recall@k.\n"
          "• Literature Extraction: Evaluated on ACLSum (Takeshita et al., 2024; 60 test papers) for challenge/approach/outcome JSON extraction, comparing zero-shot prompting with LoRA adaptation trained on 100 papers, scored via ROUGE-L and SBERT similarity.\n"
          "• Novelty Judgment: Evaluated on 150 RINoBench ideas (Schopf and Färber, 2026) scored 1–5, comparing a LoRA model trained on 300 ideas against a majority-class baseline.")
    add_p("Table 1 summarizes the empirical findings. Decompose-then-plan significantly improves the planning rubric score by +0.132 without any parameter fine-tuning, whereas the LoRA planner provides no statistically significant gain (+0.057, 95% CI contains zero) and combining both methods degrades performance (0.228). For retrieval, BGE-small outperforms BM25 by +0.080 on Recall@5 and +0.087 on Recall@20; however, even hybrid BM25+BGE fusion recovers only 66.9% of relevant papers at k=20. On ACLSum, LoRA fine-tuning provides a modest lexical improvement (+0.045 ROUGE-L) but negligible semantic gain (+0.012 SBERT). On RINoBench, the LoRA classifier achieves an apparent accuracy of 0.313 merely by predicting the majority rating for 145 of 150 instances, remaining functionally indistinguishable from the majority baseline (macro-F1 0.111 vs. 0.092).")

    # Table 1
    table_data = [
        ("Comparison Component", "Baseline (Base)", "Variant (Var.)", "Paired Difference [95% CI]"),
        ("Rubric Score: Single vs. Decompose-then-Plan", "0.233", "0.365", "+0.132 [0.053, 0.213]"),
        ("Rubric Score: Single vs. LoRA Planner", "0.233", "0.290", "+0.057 [−0.007, 0.125]"),
        ("LitSearch Recall@5: BM25 vs. BGE-small", "0.430", "0.510", "+0.080 [0.040, 0.121]"),
        ("LitSearch Recall@20: BM25 vs. BGE-small", "0.568", "0.655", "+0.087 [0.050, 0.126]"),
        ("ACLSum ROUGE-L: Zero-Shot vs. LoRA", "0.238", "0.283", "+0.045 [0.022, 0.069]"),
        ("ACLSum SBERT: Zero-Shot vs. LoRA", "0.592", "0.604", "+0.012 [−0.017, 0.044]"),
        ("RINoBench Accuracy: Majority Baseline vs. LoRA", "0.300", "0.313", "+0.013 [0.000, 0.033]"),
        ("RINoBench MAE: Majority Baseline vs. LoRA", "0.887", "0.880", "−0.007 [−0.033, 0.020]"),
    ]

    p_tbl_caption = doc.add_paragraph()
    p_tbl_caption.paragraph_format.space_before = Pt(8)
    p_tbl_caption.paragraph_format.space_after = Pt(4)
    r_tc = p_tbl_caption.add_run("Table 1. Benchmark results: baseline (Base) and variant (Var.) means, and paired difference (variant minus baseline with 95% bootstrap confidence intervals).")
    r_tc.font.name = 'Times New Roman'
    r_tc.font.size = Pt(10)
    r_tc.font.bold = True

    table = doc.add_table(rows=len(table_data), cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    col_widths = [Inches(2.8), Inches(1.0), Inches(1.0), Inches(1.7)]

    for row_idx, row in enumerate(table_data):
        for col_idx, text in enumerate(row):
            cell = table.cell(row_idx, col_idx)
            cell.width = col_widths[col_idx]
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)

            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.0

            if row_idx == 0:
                set_cell_background(cell, "EAE6E1")
                r = p.add_run(text)
                r.font.name = 'Times New Roman'
                r.font.size = Pt(9.5)
                r.font.bold = True
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER if col_idx > 0 else WD_ALIGN_PARAGRAPH.LEFT
            else:
                if row_idx % 2 == 1:
                    set_cell_background(cell, "FBF9F7")
                r = p.add_run(text)
                r.font.name = 'Times New Roman'
                r.font.size = Pt(9.5)
                if col_idx in [1, 2]:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                elif col_idx == 3:
                    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
                else:
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT

    p_post_tbl = doc.add_paragraph()
    p_post_tbl.paragraph_format.space_after = Pt(6)

    add_h2("5.5 Implementation Details")
    add_p("LoRA adapters (r=16, alpha=32, dropout 0.05) were applied to all attention projections (q_proj, k_proj, v_proj, o_proj) and MLP projections (gate_proj, up_proj, down_proj) of the 4-bit (NF4) base model. Models were optimized with AdamW using a learning rate of 2e-4 under a cosine decay schedule, an effective batch size of 8, and three training epochs (two for planning). Greedy decoding was employed across all evaluations, and the 3B judge evaluated individual rubric items in an isolated Yes/No verification format.")

    # 6. Discussion and Findings
    add_h1("6. Discussion and Findings")
    add_p("Our empirical results yield several critical design insights for scientific multi-agent systems:\n"
          "1. Workflow Structure Outperforms Parameter Adaptation in Planning: Explicit decompose-then-plan prompting improved planning rubric scores by +0.132 on a 1.5B model without updating a single weight, whereas LoRA fine-tuning yielded negligible, high-variance gains. Enforcing structured intermediate reasoning is more effective than attempting to encode complex planning behaviors into compact parameter weights.\n"
          "2. Retrieval Recall Inherently Bounds Novelty Assessment: Because even dense retrieval (BGE-small) fails to recover approximately one-third of relevant literature at k=20 (Recall@20 = 0.655), an automated system cannot reliably prove global originality from retrieved literature alone. The absence of matching papers in a local retrieval corpus must not be conflated with genuine scientific novelty. Consequently, the Topic Uniqueness Agent must surface overlapping literature and conceptual differentials rather than issue definitive novelty verdicts.\n"
          "3. Novelty Classification Suffers from Representation Collapse: Supervised LoRA classification on RINoBench collapsed to majority-label prediction (score 3.0), failing to discriminate subtle research distinctions. Continuous embedding distance combined with monotonic calibration (e.g., non-parametric isotonic regression) provides a more stable foundation for novelty indicators than discrete classification.\n"
          "4. Heterogeneous Model Selection: Different research sub-tasks require different architectural paradigms. Generative structuring benefits from instruction-tuned SLMs (Qwen2.5-1.5B), literature retrieval demands specialized dense bi-encoders (BGE-small), similarity auditing is best handled via metric embeddings (SBERT), and final typesetting requires deterministic templating (Jinja2) rather than generative text.")

    # 7. Limitations and Future Work
    add_h1("7. Limitations and Future Work")
    add_p("Several limitations should be noted. First, while literature extraction, novelty calibration, retrieval, and planning have been empirically evaluated on public benchmarks, full end-to-end multi-agent trials involving human authors remain ongoing. Second, the training datasets for specialized adaptation (88–300 examples) are compact; expanding corpus diversity across non-CS domains is necessary to assess cross-disciplinary generalization. Third, automatic novelty scoring remains constrained by retrieval recall limits on open-web academic corpora.")
    add_p("Future work will expand retrieval scale via hybrid sparse-dense indices, evaluate frontier writing agents within the decomposed pipeline, integrate automated citation provenance validation against live bibliographic APIs, and conduct full human-in-the-loop writing studies.")

    # 8. Conclusion
    add_h1("8. Conclusion")
    add_p("We presented a modular multi-agent framework grounded in Small Language Models to assist researchers across the academic writing lifecycle. By decomposing the scientific workflow into seven specialized agents—Topic Uniqueness, Literature, Planning, Writing, Review, Similarity and Citation, and Formatting—our architecture replaces monolithic end-to-end prompting with transparent, structured intermediate representations. Empirical benchmarks demonstrate that structured task decomposition improves planning by +0.132 rubric points without training, that dense retrieval reliably outperforms sparse lexical search, and that retrieval limits fundamentally bound automatic novelty evaluation. This modular design establishes a practical foundation for transparent, verifiable, and resource-efficient academic writing assistance.")

    # References
    add_h1("References")
    refs = [
        "Ajith, A., Xia, M., Chevalier, A., Goyal, T., Chen, D., and Gao, T. 2024. LitSearch: A retrieval benchmark for scientific literature search. In Proceedings of the 2024 Conference on Empirical Methods in Natural Language Processing (EMNLP).",
        "Cachola, I., Lo, K., Cohan, A., and Weld, D. S. 2020. TLDR: Extreme summarization of scientific documents. In Findings of the Association for Computational Linguistics: EMNLP 2020, pages 4766–4777.",
        "Goel, S., Hazra, R., Jayalath, D., Willi, T., Jain, P., Shen, W. F., Leontiadis, I., Barbieri, F., Bachrach, Y., Geiping, J., and Whitehouse, C. 2025. Training AI co-scientists using rubric rewards. arXiv preprint arXiv:2512.23707.",
        "Gu, K., Shang, R., Jiang, R., Kuang, K., Lin, R.-J., Lyu, D., Mao, Y., Pan, Y., Wu, T., Yu, J., Zhang, Y., Zhang, T. M., Zhu, L., Merrill, M. A., Heer, J., and Althoff, T. 2024. BLADE: Benchmarking language model agents for data-driven science. In Findings of EMNLP 2024.",
        "Hong, S., Zhuge, M., Chen, J., Zheng, X., Cheng, Y., Wang, J., Zhang, C., Wang, Z., Yau, S. K. S., Lin, Z., Zhou, L., Ran, C., Xiao, L., Wu, C., and Schmidhuber, J. 2024. MetaGPT: Meta programming for a multi-agent collaborative framework. In International Conference on Learning Representations (ICLR).",
        "Hu, E. J., Shen, Y., Wallis, P., Allen-Zhu, Z., Li, Y., Wang, S., Wang, L., and Chen, W. 2022. LoRA: Low-rank adaptation of large language models. In International Conference on Learning Representations (ICLR).",
        "Kang, H. and Xiong, C. 2025. ResearchArena: Benchmarking large language models’ ability to collect and organize information as research agents. arXiv preprint arXiv:2406.10291.",
        "Li, G., Hammoud, H. A. A. K., Itani, H., Khizbullin, D., and Ghanem, B. 2023. CAMEL: Communicative agents for “mind” exploration of large language model society. In Advances in Neural Information Processing Systems (NeurIPS), volume 36.",
        "Qian, C., Liu, W., Liu, H., Chen, N., Dang, Y., Li, J., Yang, C., Chen, W., Su, Y., Cong, X., Xu, J., Li, D., Liu, Z., and Sun, M. 2024. ChatDev: Communicative agents for software development. In Proceedings of the 62nd Annual Meeting of the Association for Computational Linguistics (ACL).",
        "Qwen Team. 2024. Qwen2.5 technical report. arXiv preprint arXiv:2412.15115.",
        "Reimers, N. and Gurevych, I. 2019. Sentence-BERT: Sentence embeddings using Siamese BERT-networks. In Proceedings of EMNLP-IJCNLP 2019, pages 3982–3992.",
        "Robertson, S. and Zaragoza, H. 2009. The probabilistic relevance framework: BM25 and beyond. Foundations and Trends in Information Retrieval, 3(4):333–389.",
        "Schmidgall, S., Su, Y., Wang, Z., Sun, X., Wu, J., Yu, X., Liu, J., Liu, Z., and Barsoum, E. 2025. Agent Laboratory: Using LLM agents as research assistants. arXiv preprint arXiv:2501.04227.",
        "Schopf, T. and Färber, M. 2026. Is this idea novel? An automated benchmark for judgment of research ideas. In Proceedings of the Fifteenth Language Resources and Evaluation Conference (LREC 2026), pages 4716–4727.",
        "Takeshita, S., Green, T., Reinig, I., Eckert, K., and Ponzetto, S. P. 2024. ACLSum: A new dataset for aspect-based summarization of scientific publications. In Proceedings of NAACL 2024.",
        "Wu, Q., Bansal, G., Zhang, J., Wu, Y., Li, B., Zhu, E., Jiang, L., Zhang, X., Zhang, S., Liu, J., Awadallah, A. H., White, R. W., Burger, D., and Wang, C. 2023. AutoGen: Enabling next-gen LLM applications via multi-agent conversation framework. arXiv preprint arXiv:2308.08155.",
        "Xiao, S., Liu, Z., Zhang, P., Muennighoff, N., Lian, D., and Nie, J.-Y. 2024. C-Pack: Packed resources for general Chinese embeddings. In Proceedings of the 47th International ACM SIGIR Conference."
    ]

    for ref in refs:
        p_ref = doc.add_paragraph()
        p_ref.paragraph_format.left_indent = Inches(0.25)
        p_ref.paragraph_format.first_line_indent = Inches(-0.25)
        p_ref.paragraph_format.space_after = Pt(4)
        p_ref.paragraph_format.line_spacing = 1.10
        r_r = p_ref.add_run(ref)
        r_r.font.name = 'Times New Roman'
        r_r.font.size = Pt(9.5)

    doc.save(output_path)
    print(f"Successfully generated DOCX at: {output_path}")

if __name__ == '__main__':
    out_dir = r"c:\Users\Harini\Downloads\research_agents_nlp"
    out_file = os.path.join(out_dir, "Multi_Agent_SLM_Frameworks_Paper.docx")
    create_paper_docx(out_file)
