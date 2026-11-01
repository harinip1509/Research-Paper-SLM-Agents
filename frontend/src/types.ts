export interface User {
  id: string
  name: string
  email: string
  institution?: string
}

export interface Paper {
  paper_id: string
  title: string
  abstract?: string
  year?: number
  authors: string[]
  venue?: string
  citation_count?: number
  url?: string
  external_ids: Record<string, string>
  similarity_score?: number
  grounded_reason?: string
  differentiation_suggestion?: string
}

export interface OverlapMeter {
  score: number
  raw_overlap: number
  threshold: number
  is_high_overlap: boolean
  status: string
}

export interface TopicUniquenessResponse {
  title: string
  uniqueness_score: number
  overlap_meter: OverlapMeter
  calibrated_novelty_rating: number
  coverage_caveat: string
  recommended_papers: Paper[]
  differentiation_suggestions: string[]
  latency_ms: float
  cache_hit: boolean
}

type float = number

export interface PlanRequirementItem {
  id: string
  description: string
  category: string
  addressed_in_section: string
}

export interface PaperPlan {
  goal: string
  requirements_checklist: PlanRequirementItem[]
  outline: {
    section_name: string
    target_words: number
    key_points: string[]
  }[]
  estimated_word_count: number
}

export interface PaperDraftSection {
  title: string
  latex_content: string
  word_count: number
  cited_keys: string[]
}

export interface CitationVerificationResult {
  citation_key: string
  verified: boolean
  s2_paper_id?: string | null
  title?: string | null
  year?: number | null
  url?: string | null
  bibtex_entry?: string | null
  status_message: string
}

export interface SentenceOverlapMatch {
  draft_sentence: string
  matched_paper_title?: string
  matched_abstract_title?: string
  matched_paper_id?: string
  source_sentence?: string
  matched_sentence?: string
  similarity_score: number
}

export interface SimilarityReport {
  mean_sentence_overlap?: number
  max_sentence_overlap: number
  high_similarity_matches: SentenceOverlapMatch[]
  total_sentences_checked: number
  is_flagged: boolean
}

export interface PaperDraft {
  title: string
  venue?: string
  abstract: string
  sections: PaperDraftSection[]
  bibtex_content?: string
  bibtex_entries?: string[]
  citation_verifications?: CitationVerificationResult[]
  similarity_report?: SimilarityReport | null
  total_word_count: number
  target_pages?: number
}

export interface ReviewCritique {
  rubric_scores: {
    novelty: number
    clarity: number
    soundness: number
    related_work: number
  }
  suggestions: {
    category: string
    critique: string
    actionable_fix: string
  }[]
  overall_assessment: string
  disclaimer: string
}

export interface FormatConstraintViolation {
  constraint_type: string
  limit: any
  actual: any
  severity: 'warning' | 'error'
  message: string
}

export interface FormatConstraintReport {
  venue_id: string
  venue_name: string
  passed: boolean
  violations: FormatConstraintViolation[]
  word_count: number
  abstract_words: number
  estimated_pages: number
}

export interface ProjectSummary {
  id: string
  title: string
  abstract: string
  venue: string
  uniqueness_score: number | null
  calibrated_rating: number | null
  papers_count: number
  created_at: string
  updated_at: string
}

