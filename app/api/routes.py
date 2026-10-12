"""FastAPI API routes for ScholarForge."""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.agents.formatting_agent import formatting_agent
from app.agents.literature_agent import literature_agent
from app.agents.uniqueness_agent import uniqueness_agent
from app.agents.writing_agent import writing_agent
from app.clients.semantic_scholar import s2_client
from app.models.schemas import (
    FormatConstraintReport,
    FormatExportRequest,
    LiteratureExtractRequest,
    LiteratureExtractResponse,
    Paper,
    PaperDraft,
    PaperDraftSection,
    TopicUniquenessRequest,
    TopicUniquenessResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["ScholarForge"])


# =====================================================================
# Milestone 1: Topic Uniqueness & Search
# =====================================================================

@router.post("/uniqueness", response_model=TopicUniquenessResponse)
async def compute_topic_uniqueness(request: TopicUniquenessRequest) -> TopicUniquenessResponse:
    """Analyze paper topic/abstract and compute Topic Uniqueness score, overlap meter, and recommendations."""
    try:
        response = await uniqueness_agent.compute_uniqueness(request)
        return response
    except Exception as e:
        logger.exception("Error computing uniqueness score: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to compute topic uniqueness: {str(e)}")


@router.get("/search", response_model=List[Paper])
async def search_literature(
    query: str = Query(..., min_length=2, description="Search query keywords"),
    limit: int = Query(10, ge=1, le=50, description="Max results"),
) -> List[Paper]:
    """Search literature directly using Semantic Scholar Graph API with local caching."""
    try:
        papers = await s2_client.search_papers(query=query, limit=limit)
        return papers
    except Exception as e:
        logger.exception("Search literature error: %s", e)
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/recommendations", response_model=List[Paper])
async def get_paper_recommendations(
    paper_ids: str = Query(..., description="Comma-separated positive paper IDs"),
    limit: int = Query(5, ge=1, le=20),
) -> List[Paper]:
    """Retrieve related papers from Semantic Scholar recommendations endpoint."""
    try:
        id_list = [p.strip() for p in paper_ids.split(",") if p.strip()]
        papers = await s2_client.get_recommendations(id_list, limit=limit)
        return papers
    except Exception as e:
        logger.exception("Recommendations error: %s", e)
        raise HTTPException(status_code=500, detail=f"Recommendations failed: {str(e)}")


# =====================================================================
# Milestone 2: Writing & Multi-Venue Formatting
# =====================================================================

class DraftSectionRequest(BaseModel):
    section_title: str
    paper_title: str
    paper_abstract: str
    user_notes: str = ""
    verified_papers: List[Paper] = []
    target_words: int = 600


@router.post("/draft/section", response_model=PaperDraftSection)
async def draft_section(req: DraftSectionRequest) -> PaperDraftSection:
    """Draft an individual paper section grounded only in user notes and verified literature."""
    try:
        return await writing_agent.draft_section(
            section_title=req.section_title,
            paper_title=req.paper_title,
            paper_abstract=req.paper_abstract,
            user_notes=req.user_notes,
            verified_papers=req.verified_papers,
            target_words=req.target_words,
        )
    except Exception as e:
        logger.exception("Draft section error: %s", e)
        raise HTTPException(status_code=500, detail=f"Section drafting failed: {str(e)}")


class DraftFullPaperRequest(BaseModel):
    paper_title: str
    paper_abstract: str
    user_notes: str = ""
    verified_papers: List[Paper] = []
    section_titles: Optional[List[str]] = None


@router.post("/draft/full", response_model=PaperDraft)
async def draft_full_paper(req: DraftFullPaperRequest) -> PaperDraft:
    """Draft full academic paper section-by-section with verified BibTeX."""
    try:
        return await writing_agent.draft_full_paper(
            paper_title=req.paper_title,
            paper_abstract=req.paper_abstract,
            user_notes=req.user_notes,
            verified_papers=req.verified_papers,
            section_titles=req.section_titles,
        )
    except Exception as e:
        logger.exception("Full paper drafting error: %s", e)
        raise HTTPException(status_code=500, detail=f"Full drafting failed: {str(e)}")


@router.get("/venues")
async def list_venues() -> Dict[str, Any]:
    """Return all declarative venue profiles from venues.yaml."""
    return formatting_agent.venues


class CheckConstraintsRequest(BaseModel):
    venue_id: str
    title: str
    abstract: str
    sections: List[Dict[str, str]]
    keywords: List[str] = []
    authors: List[Dict[str, str]] = []
    is_anonymized: bool = False


@router.post("/format/check", response_model=FormatConstraintReport)
async def check_venue_constraints(req: CheckConstraintsRequest) -> FormatConstraintReport:
    """Verify paper compliance against venue limits (words, abstract, keywords, anonymization)."""
    return formatting_agent.check_constraints(
        venue_id=req.venue_id,
        title=req.title,
        abstract=req.abstract,
        sections=req.sections,
        keywords=req.keywords,
        authors=req.authors,
        is_anonymized=req.is_anonymized,
    )


@router.post("/format/render")
async def render_latex_source(req: FormatExportRequest) -> Dict[str, str]:
    """Render complete Jinja2 LaTeX source code for the requested venue."""
    try:
        latex_src = formatting_agent.render_latex(req)
        return {"venue_id": req.venue_id, "latex_source": latex_src}
    except Exception as e:
        logger.exception("LaTeX render error: %s", e)
        raise HTTPException(status_code=500, detail=f"LaTeX rendering failed: {str(e)}")


@router.post("/format/compile/pdf")
async def compile_paper_pdf(req: FormatExportRequest):
    """Compile paper to PDF and return download file."""
    try:
        latex_src = formatting_agent.render_latex(req)
        pdf_path = formatting_agent.compile_pdf(latex_src, req.bibtex)
        return FileResponse(
            path=str(pdf_path),
            filename=f"paper_{req.venue_id}.pdf",
            media_type="application/pdf",
        )
    except Exception as e:
        logger.exception("PDF compilation error: %s", e)
        raise HTTPException(status_code=500, detail=f"PDF compilation failed: {str(e)}")


@router.post("/format/compile/docx")
async def export_paper_docx(req: FormatExportRequest):
    """Export paper to styled DOCX document."""
    try:
        docx_path = formatting_agent.export_docx(req)
        return FileResponse(
            path=str(docx_path),
            filename=f"paper_{req.venue_id}.docx",
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
    except Exception as e:
        logger.exception("DOCX export error: %s", e)
        raise HTTPException(status_code=500, detail=f"DOCX export failed: {str(e)}")


class CondenseRequest(BaseModel):
    section_text: str
    target_words: int


@router.post("/format/condense")
async def condense_section(req: CondenseRequest) -> Dict[str, Any]:
    """Use LLM rewriter to condense verbose section to satisfy venue length budget."""
    words = len(req.section_text.split())
    condensed = await formatting_agent.condense_section_to_budget(
        section_text=req.section_text,
        current_words=words,
        target_words=req.target_words,
    )
    return {
        "original_words": words,
        "condensed_words": len(condensed.split()),
        "condensed_text": condensed,
    }


# =====================================================================
# Milestone 3: Literature Aspect Summarizer
# =====================================================================

@router.post("/literature/extract", response_model=LiteratureExtractResponse)
async def extract_literature_aspects(req: LiteratureExtractRequest) -> LiteratureExtractResponse:
    """Extract research problem, method, dataset, results, and limitations into JSON."""
    try:
        return await literature_agent.extract_aspects(req)
    except Exception as e:
        logger.exception("Aspect extraction error: %s", e)
        raise HTTPException(status_code=500, detail=f"Aspect extraction failed: {str(e)}")
