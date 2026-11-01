"""FastAPI API routes for ScholarForge covering all 7 specialized agents."""
from __future__ import annotations

import json
import logging
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel

from app.agents.formatting_agent import formatting_agent
from app.agents.literature_agent import literature_agent
from app.agents.planning_agent import planning_agent
from app.agents.review_agent import review_agent
from app.agents.similarity_agent import similarity_citation_agent
from app.agents.uniqueness_agent import uniqueness_agent
from app.agents.writing_agent import writing_agent
from app.clients.groq_client import groq_client
from app.clients.semantic_scholar import s2_client
from app.config import ENV_FILE, settings
from app.core.database import get_db_connection
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
    ProjectSaveRequest,
    ProjectSummary,
    ReviewCritique,
    SettingsKeysResponse,
    SettingsKeysUpdateRequest,
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
    paper_title: Optional[str] = None
    title: Optional[str] = None
    paper_abstract: Optional[str] = None
    abstract: Optional[str] = None
    user_notes: str = ""
    verified_papers: List[Paper] = []
    retrieved_papers: List[Paper] = []
    target_words: int = 600


@router.post("/draft/section", response_model=PaperDraftSection)
async def draft_section(req: DraftSectionRequest) -> PaperDraftSection:
    """Draft an individual paper section grounded only in user notes and verified literature."""
    try:
        t = req.paper_title or req.title or "Conference Paper Submission"
        a = req.paper_abstract or req.abstract or ""
        p = req.verified_papers or req.retrieved_papers or []
        return await writing_agent.draft_section(
            section_title=req.section_title,
            paper_title=t,
            paper_abstract=a,
            user_notes=req.user_notes,
            verified_papers=p,
            target_words=req.target_words,
        )
    except Exception as e:
        logger.exception("Draft section error: %s", e)
        raise HTTPException(status_code=500, detail=f"Section drafting failed: {str(e)}")


class DraftFullPaperRequest(BaseModel):
    paper_title: Optional[str] = None
    title: Optional[str] = None
    paper_abstract: Optional[str] = None
    abstract: Optional[str] = None
    user_notes: str = ""
    verified_papers: List[Paper] = []
    retrieved_papers: List[Paper] = []
    section_titles: Optional[List[str]] = None
    venue: Optional[str] = None
    target_pages: Optional[int] = 6


@router.post("/draft/full", response_model=PaperDraft)
async def draft_full_paper(req: DraftFullPaperRequest) -> PaperDraft:
    """Draft full academic paper section-by-section with verified BibTeX scaled to target pages."""
    try:
        t = req.paper_title or req.title or "Conference Paper Submission"
        a = req.paper_abstract or req.abstract or ""
        p = req.verified_papers or req.retrieved_papers or []
        pages = req.target_pages or 6
        return await writing_agent.draft_full_paper(
            paper_title=t,
            paper_abstract=a,
            user_notes=req.user_notes,
            verified_papers=p,
            section_titles=req.section_titles,
            target_pages=pages,
        )
    except Exception as e:
        logger.exception("Full paper drafting error: %s", e)
        raise HTTPException(status_code=500, detail=f"Full drafting failed: {str(e)}")


@router.get("/venues")
@router.get("/format/venues")
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
    is_anonymized: Optional[bool] = None
    target_pages: Optional[int] = None


@router.post("/format/check", response_model=FormatConstraintReport)
async def check_venue_constraints(req: CheckConstraintsRequest) -> FormatConstraintReport:
    """Verify paper compliance against venue limits (words, abstract, keywords, anonymization)."""
    venue_cfg = formatting_agent.get_venue(req.venue_id)
    is_anon = req.is_anonymized if req.is_anonymized is not None else venue_cfg.get("anonymization_required", False)
    return formatting_agent.check_constraints(
        venue_id=req.venue_id,
        title=req.title,
        abstract=req.abstract,
        sections=req.sections,
        keywords=req.keywords,
        authors=req.authors,
        is_anonymized=is_anon,
        target_pages=req.target_pages,
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
    """Compile paper to venue-specific PDF calibrated to target_pages and return download file."""
    try:
        latex_src = formatting_agent.render_latex(req)
        pdf_path = formatting_agent.compile_pdf(
            latex_src,
            req.bibtex,
            target_pages=req.target_pages,
            request=req,
        )
        return FileResponse(
            path=str(pdf_path),
            filename=f"paper_{req.venue_id}_{req.target_pages or 6}pp.pdf",
            media_type="application/pdf",
        )
    except Exception as e:
        logger.exception("PDF compilation error: %s", e)
        raise HTTPException(status_code=500, detail=f"PDF compilation failed: {str(e)}")


@router.post("/format/compile/docx")
async def export_paper_docx(req: FormatExportRequest):
    """Export paper to venue-specific styled DOCX document calibrated to target_pages."""
    try:
        docx_path = formatting_agent.export_docx(req)
        return FileResponse(
            path=str(docx_path),
            filename=f"paper_{req.venue_id}_{req.target_pages or 6}pp.docx",
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
    except Exception as e:
        logger.exception("DOCX export error: %s", e)
        raise HTTPException(status_code=500, detail=f"DOCX export failed: {str(e)}")


@router.post("/format/compile/tex")
async def export_paper_tex(req: FormatExportRequest):
    """Export paper to complete Jinja2 venue-formatted LaTeX (.tex) document."""
    try:
        latex_src = formatting_agent.render_latex(req)
        return Response(
            content=latex_src,
            media_type="application/x-tex; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="paper_{req.venue_id}_{req.target_pages or 6}pp.tex"'
            },
        )
    except Exception as e:
        logger.exception("LaTeX export error: %s", e)
        raise HTTPException(status_code=500, detail=f"LaTeX export failed: {str(e)}")


@router.post("/format/compile/markdown")
async def export_paper_markdown(req: FormatExportRequest):
    """Export paper to structured Markdown (.md) document calibrated to target_pages."""
    try:
        md_src = formatting_agent.render_markdown(req)
        return Response(
            content=md_src,
            media_type="text/markdown; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="paper_{req.venue_id}_{req.target_pages or 6}pp.md"'
            },
        )
    except Exception as e:
        logger.exception("Markdown export error: %s", e)
        raise HTTPException(status_code=500, detail=f"Markdown export failed: {str(e)}")


@router.post("/format/compile/html")
async def export_paper_html(req: FormatExportRequest):
    """Export paper to standalone conference-styled HTML (.html) document."""
    try:
        html_src = formatting_agent.render_html(req)
        return Response(
            content=html_src,
            media_type="text/html; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="paper_{req.venue_id}_{req.target_pages or 6}pp.html"'
            },
        )
    except Exception as e:
        logger.exception("HTML export error: %s", e)
        raise HTTPException(status_code=500, detail=f"HTML export failed: {str(e)}")


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
    paper_title: Optional[str] = None
    title: Optional[str] = None
    paper_abstract: Optional[str] = None
    abstract: Optional[str] = None
    sections: Optional[List[Dict[str, str]]] = None
    draft_text: Optional[str] = None
    cited_papers: List[Paper] = []
    target_venue: str = "ieee"


@router.post("/review", response_model=ReviewCritique)
async def review_paper(req: ReviewRequest) -> ReviewCritique:
    """Perform multi-criteria rubric peer critique."""
    try:
        t = req.paper_title or req.title or "Conference Paper Submission"
        a = req.paper_abstract or req.abstract or ""
        secs = req.sections or [{"title": "Main Draft", "content": req.draft_text or ""}]
        return await review_agent.review_paper(
            paper_title=t,
            paper_abstract=a,
            sections=secs,
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


# =====================================================================
# Research Project Management (State & History)
# =====================================================================

@router.get("/projects", response_model=List[ProjectSummary])
async def list_projects(authorization: Optional[str] = Header(None)) -> List[ProjectSummary]:
    """List research projects for current user or recent active projects."""
    user_id = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ", 1)[1].strip()
        user = auth_service.get_user_by_token(token)
        if user:
            user_id = user["id"]

    conn = get_db_connection()
    query = "SELECT id, title, abstract, venue, uniqueness_score, calibrated_rating, papers_json, created_at, updated_at FROM projects"
    params: tuple[Any, ...] = ()
    if user_id:
        query += " WHERE user_id = ? OR user_id IS NULL"
        params = (user_id,)
    query += " ORDER BY updated_at DESC LIMIT 20"

    rows = conn.execute(query, params).fetchall()
    results: List[ProjectSummary] = []
    for r in rows:
        papers_count = 0
        if r["papers_json"]:
            try:
                p_list = json.loads(r["papers_json"])
                papers_count = len(p_list)
            except Exception:
                pass
        results.append(
            ProjectSummary(
                id=r["id"],
                title=r["title"],
                abstract=r["abstract"],
                venue=r["venue"] or "ieee",
                uniqueness_score=r["uniqueness_score"],
                calibrated_rating=r["calibrated_rating"],
                papers_count=papers_count,
                created_at=str(r["created_at"]),
                updated_at=str(r["updated_at"]),
            )
        )
    return results


@router.post("/projects")
async def save_project(req: ProjectSaveRequest, authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Save or update a research project state."""
    user_id = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ", 1)[1].strip()
        user = auth_service.get_user_by_token(token)
        if user:
            user_id = user["id"]

    project_id = req.id or str(uuid.uuid4())[:8]
    conn = get_db_connection()

    uniqueness_score = req.uniqueness.uniqueness_score if req.uniqueness else None
    calibrated_rating = req.uniqueness.calibrated_novelty_rating if req.uniqueness else None
    overlap_meter_json = req.uniqueness.overlap_meter.model_dump_json() if req.uniqueness else None
    draft_json = req.draft.model_dump_json() if req.draft else None
    papers_json = json.dumps([p.model_dump() for p in (req.papers or [])]) if req.papers else None

    with conn:
        conn.execute(
            """
            INSERT INTO projects (id, user_id, title, abstract, user_notes, venue, uniqueness_score, calibrated_rating, overlap_meter_json, draft_json, papers_json, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
                title=excluded.title,
                abstract=excluded.abstract,
                user_notes=excluded.user_notes,
                venue=excluded.venue,
                uniqueness_score=excluded.uniqueness_score,
                calibrated_rating=excluded.calibrated_rating,
                overlap_meter_json=excluded.overlap_meter_json,
                draft_json=excluded.draft_json,
                papers_json=excluded.papers_json,
                updated_at=CURRENT_TIMESTAMP
            """,
            (
                project_id,
                user_id,
                req.title,
                req.abstract,
                req.user_notes,
                req.venue or "ieee",
                uniqueness_score,
                calibrated_rating,
                overlap_meter_json,
                draft_json,
                papers_json,
            ),
        )

    return {"id": project_id, "status": "saved"}


@router.get("/projects/{project_id}")
async def get_project(project_id: str) -> Dict[str, Any]:
    """Retrieve full research project state."""
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")

    d = dict(row)
    if d.get("papers_json"):
        try:
            d["papers"] = json.loads(d["papers_json"])
        except Exception:
            d["papers"] = []
    if d.get("draft_json"):
        try:
            d["draft"] = json.loads(d["draft_json"])
        except Exception:
            d["draft"] = None
    if d.get("overlap_meter_json"):
        try:
            d["overlap_meter"] = json.loads(d["overlap_meter_json"])
        except Exception:
            d["overlap_meter"] = None
    return d


@router.delete("/projects/{project_id}")
async def delete_project(project_id: str) -> Dict[str, str]:
    """Delete a research project."""
    conn = get_db_connection()
    with conn:
        conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    return {"message": "Project deleted successfully"}


# =====================================================================
# Settings & API Keys Management
# =====================================================================

def _mask_key(key: Optional[str]) -> str:
    if not key or not key.strip():
        return "Not Configured"
    k = key.strip()
    if k.startswith("mock-"):
        return f"{k[:10]}... (mock)"
    if len(k) <= 8:
        return "********"
    return f"{k[:4]}...{k[-4:]}"


def _update_env_var(key: str, value: str) -> None:
    content = ""
    if ENV_FILE.exists():
        content = ENV_FILE.read_text(encoding="utf-8")
    lines = content.splitlines()
    found = False
    new_lines = []
    for line in lines:
        if line.startswith(f"{key}="):
            new_lines.append(f"{key}={value}")
            found = True
        else:
            new_lines.append(line)
    if not found:
        new_lines.append(f"{key}={value}")
    ENV_FILE.write_text("\n".join(new_lines) + "\n", encoding="utf-8")


@router.get("/settings/keys", response_model=SettingsKeysResponse)
async def get_settings_keys() -> SettingsKeysResponse:
    """Retrieve masked status of Groq and Semantic Scholar API keys and SQLite DB details."""
    db_connected = False
    try:
        conn = get_db_connection()
        conn.execute("SELECT 1").fetchone()
        db_connected = True
    except Exception:
        db_connected = False

    groq_configured = bool(settings.groq_api_key and not settings.groq_api_key.startswith("mock-"))
    s2_configured = bool(settings.s2_api_key and settings.s2_api_key.strip())

    return SettingsKeysResponse(
        groq_api_key_configured=groq_configured,
        groq_api_key_masked=_mask_key(settings.groq_api_key),
        s2_api_key_configured=s2_configured,
        s2_api_key_masked=_mask_key(settings.s2_api_key),
        db_path=str(settings.db_path),
        db_connected=db_connected,
        groq_model_writing=settings.groq_model_writing,
        groq_model_review=settings.groq_model_review,
    )


@router.post("/settings/keys", response_model=SettingsKeysResponse)
async def update_settings_keys(req: SettingsKeysUpdateRequest) -> SettingsKeysResponse:
    """Update Groq and/or Semantic Scholar API keys dynamically and persist to .env."""
    if req.groq_api_key is not None:
        new_groq = req.groq_api_key.strip()
        settings.groq_api_key = new_groq
        groq_client.set_api_key(new_groq)
        _update_env_var("GROQ_API_KEY", new_groq)
        logger.info("Updated GROQ_API_KEY (configured=%s)", bool(new_groq and not new_groq.startswith("mock-")))

    if req.s2_api_key is not None:
        new_s2 = req.s2_api_key.strip()
        settings.s2_api_key = new_s2
        s2_client.set_api_key(new_s2)
        _update_env_var("S2_API_KEY", new_s2)
        logger.info("Updated S2_API_KEY (configured=%s)", bool(new_s2))

    return await get_settings_keys()


