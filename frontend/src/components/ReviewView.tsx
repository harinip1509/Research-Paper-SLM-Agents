import React, { useState } from 'react'
import { Award, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react'
import { apiReviewDraft, apiCheckSimilarity } from '../api'
import { ReviewCritique, SimilarityReport, PaperDraft, Paper } from '../types'

interface ReviewViewProps {
  title: string
  abstract: string
  venue: string
  draft: PaperDraft | null
  papers: Paper[]
  review: ReviewCritique | null
  setReview: (r: ReviewCritique) => void
  similarity: SimilarityReport | null
  setSimilarity: (s: SimilarityReport) => void
  onProceedToExport: () => void
}

export const ReviewView: React.FC<ReviewViewProps> = ({
  title,
  abstract,
  venue,
  draft,
  papers,
  review,
  setReview,
  similarity,
  setSimilarity,
  onProceedToExport,
}) => {
  const [loadingReview, setLoadingReview] = useState(false)
  const [loadingSim, setLoadingSim] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRunReview = async () => {
    if (!draft) return
    setLoadingReview(true)
    setError(null)
    const fullText = draft.sections.map((s) => `${s.title}\n${s.latex_content}`).join('\n\n')
    try {
      const res = await apiReviewDraft({
        title,
        abstract,
        draft_text: fullText,
        target_venue: venue,
      })
      setReview(res)
    } catch (err: any) {
      setError(err.message || 'Review failed.')
    } finally {
      setLoadingReview(false)
    }
  }

  const handleRunSimilarity = async () => {
    if (!draft) return
    setLoadingSim(true)
    setError(null)
    const fullText = draft.sections.map((s) => `${s.title}\n${s.latex_content}`).join('\n\n')
    try {
      const res = await apiCheckSimilarity({
        draft_text: fullText,
        retrieved_papers: papers,
      })
      setSimilarity(res)
    } catch (err: any) {
      setError(err.message || 'Similarity check failed.')
    } finally {
      setLoadingSim(false)
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-display font-semibold text-[#F1F5F2] flex items-center gap-2.5">
          <Award className="w-6 h-6 text-[#22C55E]" />
          <span>Agents 5 & 6: Rubric Review & Similarity Audit</span>
        </h2>
        <p className="text-sm text-[#A6B5AB] mt-1">
          Automated multi-criteria critique (Novelty, Clarity, Soundness) and sentence-level similarity checking.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleRunReview}
          disabled={loadingReview || !draft}
          className="px-5 py-2.5 rounded font-semibold text-xs text-[#0D1713] bg-[#22C55E] hover:bg-[#16a34a] transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {loadingReview ? (
            <span className="w-4 h-4 border-2 border-[#0D1713]/25 border-t-[#0D1713] rounded-full animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{review ? 'Re-run Rubric Review' : 'Run Rubric Review (Agent 5)'}</span>
        </button>

        <button
          onClick={handleRunSimilarity}
          disabled={loadingSim || !draft}
          className="px-5 py-2.5 rounded font-semibold text-xs text-[#F1F5F2] bg-[#1B2D24] hover:bg-[#14532D] border border-[#2A3D32] transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {loadingSim ? (
            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-[#86EFAC]" />
          )}
          <span>{similarity ? 'Re-run Similarity Check' : 'Audit Sentence Plagiarism (Agent 6)'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded bg-rose-950/50 border border-rose-800/50 text-xs text-rose-300">
          {error}
        </div>
      )}

      {review && (
        <div className="p-6 rounded-lg bg-[#14221B] border border-[#2A3D32] space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#2A3D32]">
            <h3 className="text-sm font-semibold text-[#F1F5F2] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#22C55E]" />
              <span>Rubric Assessment Scores</span>
            </h3>
            <span className="text-[11px] text-[#86EFAC] bg-[#14532D]/50 border border-[#22C55E]/40 px-2 py-0.5 rounded">
              {review.disclaimer}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(review.rubric_scores).map(([category, score]) => (
              <div key={category} className="p-4 rounded bg-[#0D1713] border border-[#2A3D32] text-center">
                <div className="text-xs text-[#81958A] capitalize">{category.replace('_', ' ')}</div>
                <div className="text-2xl font-mono font-bold text-[#22C55E] my-1">{score} / 5</div>
                <div className="text-[10px] text-[#86EFAC]">{'★'.repeat(score)}</div>
              </div>
            ))}
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#A6B5AB] uppercase tracking-wider mb-3">
              Actionable Review Suggestions
            </h4>
            <div className="space-y-3">
              {review.suggestions.map((s, idx) => (
                <div key={idx} className="p-3.5 rounded bg-[#0D1713] border border-[#2A3D32] text-xs space-y-1">
                  <div className="font-semibold text-[#86EFAC]">[{s.category}] Critique:</div>
                  <div className="text-[#F1F5F2]">{s.critique}</div>
                  <div className="text-[#22C55E] pt-1 text-[11px]">
                    <span className="font-semibold">Actionable Fix:</span> {s.actionable_fix}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {similarity && (
        <div className="p-6 rounded-lg bg-[#14221B] border border-[#2A3D32] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2A3D32]">
            <h3 className="text-sm font-semibold text-[#F1F5F2] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
              <span>Sentence-Level Similarity Audit</span>
            </h3>
            <span
              className={`text-xs px-2.5 py-0.5 rounded font-semibold ${
                similarity.is_flagged
                  ? 'bg-rose-950/50 text-rose-300 border border-rose-800/40'
                  : 'bg-[#14532D]/50 text-[#86EFAC] border border-[#22C55E]/40'
              }`}
            >
              {similarity.is_flagged ? 'Potential Overlap Flagged' : 'Sentence Similarity Clean'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded bg-[#0D1713] border border-[#2A3D32]">
              <div className="text-xs text-[#81958A]">Mean Overlap</div>
              <div className="text-lg font-bold text-[#F1F5F2] mt-1">
                {(similarity.mean_sentence_overlap * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-3 rounded bg-[#0D1713] border border-[#2A3D32]">
              <div className="text-xs text-[#81958A]">Max Sentence Overlap</div>
              <div className="text-lg font-bold text-[#22C55E] mt-1">
                {(similarity.max_sentence_overlap * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-3 rounded bg-[#0D1713] border border-[#2A3D32]">
              <div className="text-xs text-[#81958A]">Sentences Checked</div>
              <div className="text-lg font-bold text-[#86EFAC] mt-1">
                {similarity.total_sentences_checked}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onProceedToExport}
          className="px-5 py-2.5 rounded font-semibold text-xs text-[#0D1713] bg-[#22C55E] hover:bg-[#16a34a] flex items-center gap-2 transition-all"
        >
          <span>Proceed to Multi-Venue Export & Constraint Checker (Agent 7)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
