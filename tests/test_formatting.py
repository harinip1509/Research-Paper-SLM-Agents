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
