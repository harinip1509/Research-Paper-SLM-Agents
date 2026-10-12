import React, { useState } from 'react'
import { FileText, Sparkles, BookOpen, ArrowRight, Copy, Check, Code2 } from 'lucide-react'
import { apiDraftFullPaper } from '../api'
import { PaperDraft, Paper } from '../types'

interface DraftingViewProps {
  title: string
  venue: string
  setVenue: (v: string) => void
  userNotes: string
  papers: Paper[]
  draft: PaperDraft | null
  setDraft: (d: PaperDraft) => void
  onProceedToReview: () => void
}

export const DraftingView: React.FC<DraftingViewProps> = ({
  title,
  venue,
  setVenue,
  userNotes,
  papers,
  draft,
  setDraft,
  onProceedToReview,
}) => {
  const [activeSectionIdx, setActiveSectionIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleDraftFull = async () => {
    setLoading(true)
    setError(null)
    try {
      const generated = await apiDraftFullPaper({
        title: title || 'Conference Paper Submission',
        venue: venue || 'ieee',
        user_notes: userNotes,
        retrieved_papers: papers,
      })
      setDraft(generated)
    } catch (err: any) {
      setError(err.message || 'Draft generation failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLatex = () => {
    if (!draft) return
    const fullLatex = draft.sections.map((s) => `% --- ${s.title} ---\n${s.latex_content}`).join('\n\n')
    navigator.clipboard.writeText(fullLatex)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <FileText className="w-6 h-6 text-emerald-400" />
          <span>Agent 4: Section-by-Section Grounded Writing</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Two-stage academic drafting grounded strictly in researcher notes and retrieved Semantic Scholar papers.
        </p>
      </div>

      {/* Target Venue & Draft Controls */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Target Venue Format</label>
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              {[
                { id: 'ieee', label: 'IEEE' },
                { id: 'acl', label: 'ACL' },
                { id: 'acm', label: 'ACM' },
                { id: 'lncs', label: 'Springer LNCS' },
                { id: 'generic', label: 'Plain' },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVenue(v.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    venue === v.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleDraftFull}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Synthesizing Academic Draft...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{draft ? 'Regenerate Draft' : 'Draft Full Paper (All Sections)'}</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            {error}
          </div>
        )}
      </div>

      {/* Draft Viewer */}
      {draft && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
          {/* Section Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
              Sections ({draft.sections.length})
            </div>
            {draft.sections.map((sec, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSectionIdx(idx)}
                className={`w-full p-3 rounded-xl text-left transition-all flex items-center justify-between text-xs ${
                  activeSectionIdx === idx
                    ? 'bg-indigo-600 text-white font-semibold shadow-md'
                    : 'bg-slate-900 border border-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="truncate">{sec.title}</span>
                <span className="text-[10px] opacity-75 font-mono">{sec.word_count}w</span>
              </button>
            ))}

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 mt-4 space-y-1.5">
              <div>
                <span className="text-slate-300">Total Words:</span> {draft.total_word_count}
              </div>
              <div>
                <span className="text-slate-300">Citations:</span> {draft.bibtex_entries.length} references
              </div>
            </div>
          </div>

          {/* Section Content & Code View */}
          <div className="lg:col-span-3 space-y-4">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-white">
                    {draft.sections[activeSectionIdx]?.title}
                  </span>
                </div>
                <button
                  onClick={handleCopyLatex}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy LaTeX</span>
                    </>
                  )}
                </button>
              </div>

              {/* LaTeX content display */}
              <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[400px]">
                {draft.sections[activeSectionIdx]?.latex_content}
              </pre>

              {/* Cited keys */}
              {draft.sections[activeSectionIdx]?.cited_keys.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Cited keys in section:</span>
                  <div className="flex flex-wrap gap-1">
                    {draft.sections[activeSectionIdx].cited_keys.map((k, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-cyan-300"
                      >
                        {`\\cite{${k}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Next Step */}
            <div className="flex justify-end">
              <button
                onClick={onProceedToReview}
                className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2 shadow-md transition-all"
              >
                <span>Proceed to Review & Similarity Check (Agents 5 & 6)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
