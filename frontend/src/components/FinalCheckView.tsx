import React from 'react'
import { TrendingUp, AlertTriangle, ExternalLink, ArrowRight, BookOpen } from 'lucide-react'
import { NavView } from './Sidebar'
import { Paper, TopicUniquenessResponse } from '../types'

interface FinalCheckViewProps {
  onNavigate: (view: NavView) => void
  uniqueness: TopicUniquenessResponse | null
  papers: Paper[]
}

export const FinalCheckView: React.FC<FinalCheckViewProps> = ({
  onNavigate,
  uniqueness,
  papers,
}) => {
  if (!uniqueness) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto font-sans">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-[#2563eb] font-semibold uppercase mb-1.5">
            Stage 6 — Final Check
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-slate-900 tracking-tight">
            Quality & Integrity Audit
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-3xl leading-relaxed">
            Empirical Topic Uniqueness verification against Semantic Scholar, sentence-level overlap auditing,
            and peer review rubric evaluation.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center mx-auto">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold font-serif text-slate-900">
            No Topic Uniqueness Audit Run Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Configure your paper title and research abstract in Stage 1 to calculate your Topic Uniqueness score (0–100), overlap meter, and RINoBench calibrated novelty.
          </p>
          <button
            onClick={() => onNavigate('project')}
            className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#0f1f3d] hover:bg-[#162a52] transition-colors inline-flex items-center gap-2 shadow-sm"
          >
            <span>Go to Stage 1 (Research Topic)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  const scoreVal = uniqueness.uniqueness_score
  const rawOverlap = uniqueness.overlap_meter?.raw_overlap || (100 - scoreVal) / 100
  const ratingVal = uniqueness.calibrated_novelty_rating || 4.0
  const paperList = (uniqueness.recommended_papers && uniqueness.recommended_papers.length > 0)
    ? uniqueness.recommended_papers
    : papers

  return (
    <div className="space-y-8 max-w-6xl mx-auto font-sans">
      {/* Header */}
      <div>
        <div className="text-[11px] font-mono tracking-widest text-[#2563eb] font-semibold uppercase mb-1.5">
          Stage 6 — Final Check
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-slate-900 tracking-tight">
          Quality & Integrity Audit
        </h1>
        <p className="text-sm text-slate-500 mt-2 max-w-3xl leading-relaxed">
          Empirical Topic Uniqueness verification against Semantic Scholar, sentence-level overlap auditing,
          and peer review rubric evaluation.
        </p>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-xs text-center flex flex-col justify-between">
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
            Topic Originality Score
          </div>
          <div className="my-2">
            <span className="text-4xl font-bold font-serif text-slate-900">
              {(scoreVal / 100).toFixed(3)}
            </span>
            <span className="text-xs text-slate-400 font-mono ml-1.5">/ 1.000</span>
          </div>
          <div className={`text-xs font-semibold font-mono ${scoreVal >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {scoreVal >= 70 ? 'High Empirical Novelty' : 'Moderate Literature Overlap'}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-xs flex flex-col justify-between">
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
            Literature Overlap Meter
          </div>
          <div className="my-2">
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-600">Mean Similarity:</span>
              <span className="font-semibold text-slate-900">{(rawOverlap * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${rawOverlap > 0.75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(rawOverlap * 100, 100)}%` }}
              />
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Threshold: 75.0% • {rawOverlap > 0.75 ? 'High Overlap Warning' : 'Within Tolerance'}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-xs text-center flex flex-col justify-between">
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
            Calibrated RINoBench Novelty
          </div>
          <div className="my-2">
            <span className="text-3xl font-bold font-serif text-amber-500">
              {ratingVal.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-mono ml-1">/ 5.0</span>
            <div className="text-amber-400 text-sm mt-0.5">
              {'★'.repeat(Math.min(5, Math.max(1, Math.round(ratingVal))))}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Isotonic Regression Calibration
          </div>
        </div>
      </div>

      {/* Grounded Literature List */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 font-serif">
            Retrieved Literature & Overlap Grounding ({paperList.length} Papers)
          </h3>
          <span className="text-[10px] font-mono text-slate-400 uppercase">
            Semantic Scholar Graph API
          </span>
        </div>

        {paperList.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4">No overlapping papers detected.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {paperList.map((p, idx) => (
              <div key={idx} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-900 hover:text-[#2563eb]">
                    {p.title}
                  </span>
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-[#2563eb] shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                  <span>{p.venue || 'Conference Proceedings'} {p.year || ''}</span>
                  <span>•</span>
                  <span>{p.citation_count || 0} citations</span>
                  {p.similarity_score != null && (
                    <>
                      <span>•</span>
                      <span>Cosine sim: {(p.similarity_score * 100).toFixed(1)}%</span>
                    </>
                  )}
                </div>

                {p.grounded_reason && (
                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-100 italic">
                    "{p.grounded_reason}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coverage Caveat */}
      <div className="p-3.5 rounded-lg bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <span>
          {uniqueness.coverage_caveat}
        </span>
      </div>

      {/* Action */}
      <div className="flex justify-end">
        <button
          onClick={() => onNavigate('final-report')}
          className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#0f1f3d] hover:bg-[#162a52] transition-colors flex items-center gap-2 shadow-sm"
        >
          <span>Proceed to Final Paper Export</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
