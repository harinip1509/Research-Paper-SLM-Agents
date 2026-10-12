"""Pydantic data schemas for ScholarForge."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class PaperAuthor(BaseModel):
    name: str


class Paper(BaseModel):
    paper_id: str = Field(description="Semantic Scholar paper ID or local unique ID")
    title: str = Field(description="Paper title")
    abstract: Optional[str] = Field(default="", description="Paper abstract")
    year: Optional[int] = Field(default=None, description="Publication year")
    authors: List[str] = Field(default_factory=list, description="Author names")
    venue: Optional[str] = Field(default="", description="Publication venue or conference")
    citation_count: Optional[int] = Field(default=0, description="Citation count")
    url: Optional[str] = Field(default="", description="Semantic Scholar URL")
    external_ids: Dict[str, str] = Field(default_factory=dict, description="External identifiers such as DOI, ArXiv")
    similarity_score: Optional[float] = Field(default=0.0, description="Cosine similarity score against user topic")
    grounded_reason: Optional[str] = Field(default=None, description="One-line grounded reason for overlap")
    differentiation_suggestion: Optional[str] = Field(default=None, description="Actionable suggestion to differentiate")


class TopicUniquenessRequest(BaseModel):
    title: str = Field(..., min_length=3, description="Paper title")
    abstract: str = Field(..., min_length=10, description="Paper abstract or topic description")
    user_notes: Optional[str] = Field(default="", description="Additional researcher notes or method details")
    overlap_threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Configurable threshold (default 0.75)")


class OverlapMeter(BaseModel):
    score: float = Field(description="Uniqueness score from 0 to 100")
    raw_overlap: float = Field(description="Weighted mean of top 5 similarities (0.0 to 1.0)")
    threshold: float = Field(description="Configured threshold (e.g. 0.75)")
    is_high_overlap: bool = Field(description="True if raw_overlap > threshold")
    status: str = Field(description="'High overlap warning', 'Moderate overlap', or 'High novelty'")


class TopicUniquenessResponse(BaseModel):
    title: str
    uniqueness_score: float = Field(description="0 to 100")
    overlap_meter: OverlapMeter
    calibrated_novelty_rating: float = Field(description="Calibrated rating on 1-5 scale via RINoBench isotonic regression")
    coverage_caveat: str = Field(
        default="Coverage caveat: Literature retrieval misses relevant papers (estimated LitSearch Recall@20 is ~0.66). This score is an empirical estimate, not a novelty verdict."
    )
    recommended_papers: List[Paper] = Field(description="Top 5-10 related papers if high overlap, else top 3 closest")
    differentiation_suggestions: List[str] = Field(default_factory=list, description="Suggestions for differentiating the work")
    latency_ms: float = Field(description="Processing latency in milliseconds")
    cache_hit: bool = Field(default=False, description="Whether retrieval was served from cache")


class AspectSummary(BaseModel):
    research_problem: str = Field(description="Core problem addressed")
    method: str = Field(description="Proposed methodology or model")
    dataset: str = Field(description="Benchmarks and datasets used")
    results: str = Field(description="Key empirical results and metrics")
    limitations: str = Field(description="Stated limitations or failure modes")


class LiteratureExtractRequest(BaseModel):
    paper_id: Optional[str] = None
    title: str
    abstract: str


class LiteratureExtractResponse(BaseModel):
    paper_id: Optional[str] = None
    aspects: AspectSummary
    source_model: str
    latency_ms: float


class PaperPlanSection(BaseModel):
    title: str
    target_word_count: int
    requirements_checklist: List[str]
    description: str


class PaperPlan(BaseModel):
    title: str
    research_goals: List[str]
    requirements_checklist: List[str]
    sections: List[PaperPlanSection]
    rubric_score_estimate: float = Field(default=0.0)


class PaperDraftSection(BaseModel):
    title: str
    structured_json: Dict[str, Any] = Field(default_factory=dict, description="Intermediate representation (claims, evidence, citation IDs)")
    latex_content: str = Field(description="Rendered LaTeX section text")
    word_count: int = Field(default=0)


class PaperDraft(BaseModel):
    title: str
    abstract: str
    sections: List[PaperDraftSection]
    bibtex_content: str
    total_word_count: int


class ReviewCritique(BaseModel):
    novelty_score: float = Field(ge=1.0, le=5.0)
    soundness_score: float = Field(ge=1.0, le=5.0)
    clarity_score: float = Field(ge=1.0, le=5.0)
    missing_work_score: float = Field(ge=1.0, le=5.0)
    overall_score: float = Field(ge=1.0, le=5.0)
    strengths: List[str]
    weaknesses: List[str]
    actionable_suggestions: List[str]
    disclaimer: str = Field(default="Automated critique, not a peer review verdict.")


class CitationVerificationResult(BaseModel):
    citation_key: str
    verified: bool
    s2_paper_id: Optional[str] = None
    title: Optional[str] = None
    year: Optional[int] = None
    url: Optional[str] = None
    bibtex_entry: Optional[str] = None
    status_message: str


class SentenceOverlapMatch(BaseModel):
    draft_sentence: str
    matched_paper_title: str
    matched_paper_id: str
    source_sentence: str
    similarity_score: float


class SimilarityReport(BaseModel):
    max_sentence_overlap: float
    high_similarity_matches: List[SentenceOverlapMatch]
    total_sentences_checked: int
    is_flagged: bool


class FormatExportRequest(BaseModel):
    venue_id: str = Field(description="ieee, acl, acm, lncs, or generic")
    title: str
    authors: List[Dict[str, str]]
    abstract: str
    keywords: List[str]
    sections: List[Dict[str, str]]  # list of {title: ..., content: ...}
    bibtex: str
    ai_disclosure_statement: Optional[str] = None


class FormatConstraintViolation(BaseModel):
    constraint_type: str
    limit: Any
    actual: Any
    severity: str  # "warning" or "error"
    message: str


class FormatConstraintReport(BaseModel):
    venue_id: str
    venue_name: str
    passed: bool
    violations: List[FormatConstraintViolation]
    word_count: int
    abstract_words: int
    estimated_pages: float


class UserSignupRequest(BaseModel):
    name: str
    email: str
    password: str
    institution: Optional[str] = ""


class UserLoginRequest(BaseModel):
    email: str
    password: str


class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    institution: Optional[str] = ""


class AuthResponse(BaseModel):
    user: UserProfile
    token: str
    message: Optional[str] = "Success"

