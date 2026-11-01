"""Unit and integration tests for Formatting Agent, venue constraints, and compilation."""
from __future__ import annotations

import tempfile
from pathlib import Path

import pytest

from app.agents.formatting_agent import formatting_agent
from app.models.schemas import FormatExportRequest


def test_venue_profiles_loaded():
    """Verify that all five required venues exist in venues.yaml."""
    venues = formatting_agent.venues
    for vid in ["ieee", "acl", "acm", "lncs", "generic"]:
        assert vid in venues
        assert "page_limit" in venues[vid]
        assert "max_words" in venues[vid]
        assert "abstract_word_limit" in venues[vid]


def test_constraints_checker_valid_paper():
    """Verify that a compliant paper passes all constraints."""
    report = formatting_agent.check_constraints(
        venue_id="ieee",
        title="Valid Paper Title",
        abstract="This is a succinct abstract within the venue word budget.",
        sections=[{"title": "Intro", "content": "Short intro paragraph."}],
        keywords=["AI", "Agents", "NLP"],
        authors=[{"name": "Alice Researcher"}],
        is_anonymized=False,
    )
    assert report.passed is True
    assert len(report.violations) == 0


def test_constraints_checker_flags_overlength_paper():
    """Verify acceptance criterion: constraints checker flags a deliberately over-length test paper."""
    # Deliberately over-length abstract (>200 words) and massive body (>5000 words)
    long_abstract = "word " * 350
    long_body = "section content " * 3000

    report = formatting_agent.check_constraints(
        venue_id="ieee",
        title="Deliberately Overlength Submission",
        abstract=long_abstract,
        sections=[{"title": "Massive Section", "content": long_body}],
        keywords=["AI", "NLP"],  # only 2 keywords, requires min 3
        authors=[{"name": "Alice Researcher"}],
        is_anonymized=False,
    )

    assert report.passed is False
    violation_types = [v.constraint_type for v in report.violations]
    assert "abstract_word_limit" in violation_types
    assert "max_words" in violation_types
    assert "page_limit" in violation_types
    assert "min_keywords" in violation_types


def test_constraints_checker_anonymization_requirement():
    """Verify that ACL flags identified authors when double-blind review is required."""
    report = formatting_agent.check_constraints(
        venue_id="acl",
        title="Identified ACL Submission",
        abstract="Valid abstract text.",
        sections=[{"title": "Intro", "content": "Content."}],
        keywords=["NLP", "AI", "Agents"],
        authors=[{"name": "Revealed Name"}],
        is_anonymized=False,
    )

    assert report.passed is False
    assert any(v.constraint_type == "anonymization_required" for v in report.violations)


@pytest.mark.parametrize("venue_id", ["ieee", "acl", "acm", "lncs", "generic"])
def test_render_latex_templates_all_venues(venue_id: str):
    """Verify acceptance criterion: templates render cleanly for every listed format."""
    req = FormatExportRequest(
        venue_id=venue_id,
        title="ScholarForge Architecture",
        authors=[{"name": "Jane Doe", "email": "jane@university.edu"}],
        abstract="Test abstract for multi-venue rendering.",
        keywords=["Multi-Agent Systems", "Natural Language Processing", "Machine Learning"],
        sections=[
            {"title": "Introduction", "content": "LaTeX content with \\cite{Vaswani2017}."},
            {"title": "Conclusion", "content": "Summary of contributions."},
        ],
        bibtex="@inproceedings{Vaswani2017, author={Vaswani, A.}, title={Attention Is All You Need}, year={2017}}",
    )

    latex_src = formatting_agent.render_latex(req)
    assert "\\begin{document}" in latex_src
    assert "\\end{document}" in latex_src
    assert "ScholarForge Architecture" in latex_src
    assert "Introduction" in latex_src


def test_compile_pdf_output():
    """Verify PDF compilation generates a non-empty PDF file."""
    latex_code = r"""\documentclass{article}
\begin{document}
\title{Minimal Test}
\author{ScholarForge Test}
\maketitle
Test compilation output.
\end{document}
"""
    with tempfile.TemporaryDirectory() as tmpdir:
        pdf_path = formatting_agent.compile_pdf(latex_code, output_dir=Path(tmpdir))
        assert pdf_path.exists()
        assert pdf_path.stat().st_size > 0


def test_export_docx_output():
    """Verify DOCX export creates a valid non-empty .docx file."""
    req = FormatExportRequest(
        venue_id="generic",
        title="DOCX Export Test Paper",
        authors=[{"name": "Alice Researcher"}],
        abstract="This is an abstract exported directly to DOCX format.",
        keywords=["DOCX", "Word", "Formatting"],
        sections=[
            {"title": "Introduction", "content": "This is introductory text."},
            {"title": "Method", "content": "Methodology prose here."},
        ],
        bibtex="",
        ai_disclosure_statement="The authors used ScholarForge for formatting.",
    )

    with tempfile.TemporaryDirectory() as tmpdir:
        out_docx = Path(tmpdir) / "test.docx"
        result_path = formatting_agent.export_docx(req, output_path=out_docx)
        assert result_path.exists()
        assert result_path.stat().st_size > 0


def test_generate_ai_disclosure():
    """Verify AI-use disclosure generator produces venue-compliant ethical statement."""
    disclosure = formatting_agent.generate_ai_disclosure("ieee", "ScholarForge Paper")
    assert "ScholarForge" in disclosure
    assert "IEEE" in disclosure
    assert "independently developed and verified" in disclosure


@pytest.mark.parametrize("target_pages", [2, 4, 6, 8])
def test_compile_pdf_exact_target_pages(target_pages: int):
    """Verify that PDF compilation produces the exact number of pages requested by the user."""
    from pypdf import PdfReader

    req = FormatExportRequest(
        venue_id="ieee",
        title="Empirical Scaling of Multi-Agent Research Pipelines",
        authors=[{"name": "Jane Researcher", "affiliation": "CS Lab", "email": "jane@lab.edu"}],
        abstract="We investigate multi-agent orchestration for scientific paper composition and citation verification across benchmarks.",
        keywords=["Multi-Agent Systems", "Natural Language Processing", "Academic Writing"],
        sections=[
            {
                "title": "Introduction and Motivation",
                "content": ("Recent advances in language modeling have transformed scientific workflows ~\\cite{Vaswani2017}. " * 18).strip(),
            },
            {
                "title": "Methodology and Architecture",
                "content": ("Our architecture integrates dense retrieval with calibrated generation ~\\cite{Vaswani2017}. " * 18).strip(),
            },
            {
                "title": "Empirical Evaluation",
                "content": ("Quantitative experiments demonstrate consistent improvements across all metrics ~\\cite{Vaswani2017}. " * 18).strip(),
            },
        ],
        bibtex="@inproceedings{Vaswani2017, author={Vaswani, Ashish}, title={Attention Is All You Need}, booktitle={NeurIPS}, year={2017}}",
        target_pages=target_pages,
    )

    with tempfile.TemporaryDirectory() as tmpdir:
        latex_src = formatting_agent.render_latex(req)
        pdf_path = formatting_agent.compile_pdf(
            latex_src,
            req.bibtex,
            output_dir=Path(tmpdir),
            target_pages=target_pages,
            request=req,
        )
        assert pdf_path.exists()
        reader = PdfReader(str(pdf_path))
        assert len(reader.pages) == target_pages


def test_multi_venue_pdf_and_docx_differentiation():
    """Verify that IEEE, ACL, ACM, LNCS, and Generic produce distinct PDF, DOCX, Markdown, and HTML outputs."""
    base_kwargs = dict(
        title="Cross-Venue Formatting Differentiation Study",
        authors=[{"name": "Alice Smith", "affiliation": "AI Institute", "email": "alice@ai.org"}],
        abstract="We evaluate deterministic multi-venue formatting across conference templates.",
        keywords=["Formatting", "LaTeX", "Conferences"],
        sections=[
            {"title": "Introduction", "content": "Foundational analysis of conference formatting ~\\cite{Vaswani2017}. " * 12},
            {"title": "Conclusion", "content": "Summary of multi-venue findings. " * 12},
        ],
        bibtex="@inproceedings{Vaswani2017, author={Vaswani, Ashish}, title={Attention Is All You Need}, booktitle={NeurIPS}, year={2017}}",
        target_pages=3,
    )

    pdf_sizes = {}
    md_outputs = {}
    html_outputs = {}

    with tempfile.TemporaryDirectory() as tmpdir:
        for vid in ["ieee", "acl", "acm", "lncs", "generic"]:
            req = FormatExportRequest(venue_id=vid, **base_kwargs)
            latex_src = formatting_agent.render_latex(req)
            pdf_p = formatting_agent.compile_pdf(
                latex_src,
                req.bibtex,
                output_dir=Path(tmpdir) / vid,
                target_pages=3,
                request=req,
            )
            docx_p = formatting_agent.export_docx(req, output_path=Path(tmpdir) / f"paper_{vid}.docx")
            assert pdf_p.exists() and pdf_p.stat().st_size > 1000
            assert docx_p.exists() and docx_p.stat().st_size > 1000
            pdf_sizes[vid] = pdf_p.read_bytes()
            md_outputs[vid] = formatting_agent.render_markdown(req)
            html_outputs[vid] = formatting_agent.render_html(req)

    # Verify IEEE uses Roman numerals while ACL uses Double-Blind Anonymization and Author-Year citations
    assert "## I. INTRODUCTION" in md_outputs["ieee"]
    assert "Anonymous Submission" in md_outputs["acl"]
    assert "(Vaswani, 2017)" in md_outputs["acl"]
    assert "column-count: 2" in html_outputs["ieee"]
    assert "column-count: 2" not in html_outputs["lncs"]

