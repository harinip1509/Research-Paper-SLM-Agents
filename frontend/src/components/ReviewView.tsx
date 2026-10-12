import React, { useState } from 'react'
import { Award, ShieldCheck, AlertCircle, ArrowRight, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react'
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
        <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Award className="w-6 h-6 text-amber-400" />
          <span>Agents 5 & 6: Rubric Review & Similarity Audit</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Automated multi-criteria critique (Novelty, Clarity, Soundness) and sentence-level similarity checking.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleRunReview}
          disabled={loadingReview || !draft}
          className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {loadingReview ? (
            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{review ? 'Re-run Rubric Review' : 'Run Rubric Review (Agent 5)'}</span>
        </button>

        <button
          onClick={handleRunSimilarity}
          disabled={loadingSim || !draft}
          className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {loadingSim ? (
            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
          <span>{similarity ? 'Re-run Similarity Check' : 'Audit Sentence Plagiarism (Agent 6)'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Review Results */}
      {review && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Rubric Assessment Scores</span>
            </h3>
            <span className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
              {review.disclaimer}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(review.rubric_scores).map(([category, score]) => (
              <div key={category} className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-xs text-slate-400 capitalize">{category.replace('_', ' ')}</div>
                <div className="text-2xl font-bold text-amber-400 my-1">{score} / 5</div>
                <div className="text-[10px] text-slate-500">{'★'.repeat(score)}</div>
              </div>
            ))}
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Actionable Review Suggestions
            </h4>
            <div className="space-y-3">
              {review.suggestions.map((s, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="font-semibold text-amber-300">[{s.category}] Critique:</div>
                  <div className="text-slate-300">{s.critique}</div>
                  <div className="text-emerald-400 pt-1 text-[11px]">
                    <span className="font-semibold">Actionable Fix:</span> {s.actionable_fix}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sentence Similarity Audit */}
      {similarity && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>Sentence-Level Similarity Audit</span>
            </h3>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                similarity.is_flagged
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {similarity.is_flagged ? 'Potential Overlap Flagged' : 'Sentence Similarity Clean'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">Mean Overlap</div>
              <div className="text-lg font-bold text-white mt-1">
                {(similarity.mean_sentence_overlap * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">Max Sentence Overlap</div>
              <div className="text-lg font-bold text-rose-400 mt-1">
                {(similarity.max_sentence_overlap * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">Sentences Checked</div>
              <div className="text-lg font-bold text-cyan-400 mt-1">
                {similarity.total_sentences_checked}
              </div>
            </div>
          </div>

          {similarity.high_similarity_matches.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-xs font-semibold text-slate-300">
                High Overlap Sentences ({similarity.high_similarity_matches.length}):
              </div>
              {similarity.high_similarity_matches.map((m, i) => (
                <div key={i} className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 text-xs space-y-1">
                  <div className="text-slate-200">
                    <span className="font-semibold text-rose-300">Draft Sentence:</span> "{m.draft_sentence}"
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    <span className="font-semibold text-slate-300">Matched Abstract ({m.matched_abstract_title}):</span> "{m.matched_sentence}"
                  </div>
                  <div className="text-rose-400 font-mono text-[10px]">
                    Similarity: {(m.similarity_score * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-end">
        <button
          onClick={onProceedToExport}
          className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2 shadow-md transition-all"
        >
          <span>Proceed to Multi-Venue Export & Constraint Checker (Agent 7)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
