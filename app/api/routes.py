"""FastAPI API routes for ScholarForge covering all 7 specialized agents."""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.agents.formatting_agent import formatting_agent
from app.agents.literature_agent import literature_agent
from app.agents.planning_agent import planning_agent
from app.agents.review_agent import review_agent
from app.agents.similarity_agent import similarity_citation_agent
from app.agents.uniqueness_agent import uniqueness_agent
from app.agents.writing_agent import writing_agent
from app.clients.semantic_scholar import s2_client
from app.models.schemas import (
    AuthResponse,
    CitationVerificationResult,
    FormatConstraintReport,
    FormatExportRequest,
    LiteratureExtractRequest,
    LiteratureExtractResponse,
    Paper,
    PaperDraft,
    PaperDraftSection,
    PaperPlan,
    ReviewCritique,
    SimilarityReport,
    TopicUniquenessRequest,
    TopicUniquenessResponse,
    UserLoginRequest,
    UserProfile,
    UserSignupRequest,
)
from app.services.auth_service import auth_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["ScholarForge"])


# =====================================================================
# Milestone 1: Topic Uniqueness & Search (Agent 1)
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
# Milestone 2: Writing & Multi-Venue Formatting (Agents 4 & 7)
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
# Milestone 3: Literature Aspect Summarizer (Agent 2)
# =====================================================================

@router.post("/literature/extract", response_model=LiteratureExtractResponse)
async def extract_literature_aspects(req: LiteratureExtractRequest) -> LiteratureExtractResponse:
    """Extract research problem, method, dataset, results, and limitations into JSON."""
    try:
        return await literature_agent.extract_aspects(req)
    except Exception as e:
        logger.exception("Aspect extraction error: %s", e)
        raise HTTPException(status_code=500, detail=f"Aspect extraction failed: {str(e)}")


# =====================================================================
# Milestone 4: Planning, Review, and Citation Verification (Agents 3, 5, 6)
# =====================================================================

class PlanRequest(BaseModel):
    paper_title: str
    research_goals: List[str] = []
    user_notes: str = ""
    target_venue: str = "ieee"


@router.post("/plan", response_model=PaperPlan)
async def generate_paper_plan(req: PlanRequest) -> PaperPlan:
    """Decompose-then-plan: generate requirements checklist and map paper sections."""
    try:
        return await planning_agent.generate_plan(
            paper_title=req.paper_title,
            research_goals=req.research_goals,
            user_notes=req.user_notes,
            target_venue=req.target_venue,
        )
    except Exception as e:
        logger.exception("Planning Agent error: %s", e)
        raise HTTPException(status_code=500, detail=f"Paper planning failed: {str(e)}")


class ReviewRequest(BaseModel):
    paper_title: str
    paper_abstract: str
    sections: List[Dict[str, str]]
    cited_papers: List[Paper] = []
    target_venue: str = "ieee"


@router.post("/review", response_model=ReviewCritique)
async def review_paper(req: ReviewRequest) -> ReviewCritique:
    """Perform multi-criteria rubric peer critique."""
    try:
        return await review_agent.review_paper(
            paper_title=req.paper_title,
            paper_abstract=req.paper_abstract,
            sections=req.sections,
            cited_papers=req.cited_papers,
            target_venue=req.target_venue,
        )
    except Exception as e:
        logger.exception("Review Agent error: %s", e)
        raise HTTPException(status_code=500, detail=f"Review failed: {str(e)}")


class SentenceOverlapRequest(BaseModel):
    draft_text: str
    retrieved_papers: List[Paper] = []


@router.post("/similarity/sentence", response_model=SimilarityReport)
async def check_sentence_similarity(req: SentenceOverlapRequest) -> SimilarityReport:
    """Perform sentence-level overlap checks against retrieved abstracts."""
    try:
        return similarity_citation_agent.check_sentence_overlap(
            draft_text=req.draft_text,
            retrieved_papers=req.retrieved_papers,
        )
    except Exception as e:
        logger.exception("Similarity check error: %s", e)
        raise HTTPException(status_code=500, detail=f"Similarity check failed: {str(e)}")


class CitationVerifyRequest(BaseModel):
    draft_text: str
    known_papers: List[Paper] = []


@router.post("/citations/verify", response_model=List[CitationVerificationResult])
async def verify_citations(req: CitationVerifyRequest) -> List[CitationVerificationResult]:
    """Verify all cite keys in draft against Semantic Scholar Graph API metadata."""
    try:
        return await similarity_citation_agent.verify_citations(
             draft_text=req.draft_text,
             known_papers=req.known_papers,
         )
    except Exception as e:
        logger.exception("Citation verify error: %s", e)
        raise HTTPException(status_code=500, detail=f"Citation verification failed: {str(e)}")


# =====================================================================
# Authentication & User Management
# =====================================================================

@router.post("/auth/signup", response_model=AuthResponse)
async def auth_signup(req: UserSignupRequest) -> AuthResponse:
    """Register a new researcher account."""
    try:
        user_data, token = auth_service.signup(
            name=req.name,
            email=req.email,
            password=req.password,
            institution=req.institution,
        )
        return AuthResponse(
            user=UserProfile(**user_data),
            token=token,
            message="Account created successfully",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Signup error: %s", e)
        raise HTTPException(status_code=500, detail="Failed to create account")


@router.post("/auth/login", response_model=AuthResponse)
async def auth_login(req: UserLoginRequest) -> AuthResponse:
    """Authenticate researcher and return session token."""
    res = auth_service.login(email=req.email, password=req.password)
    if not res:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user_data, token = res
    return AuthResponse(
        user=UserProfile(**user_data),
        token=token,
        message="Login successful",
    )


@router.get("/auth/me", response_model=UserProfile)
async def auth_me(authorization: Optional[str] = Header(None)) -> UserProfile:
    """Get current authenticated user profile."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authentication token")
    token = authorization.split("Bearer ", 1)[1].strip()
    user = auth_service.get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    return UserProfile(**user)


@router.post("/auth/logout")
async def auth_logout(authorization: Optional[str] = Header(None)) -> Dict[str, str]:
    """Logout current session."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ", 1)[1].strip()
        auth_service.logout(token)
    return {"message": "Logged out successfully"}

