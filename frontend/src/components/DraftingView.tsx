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
        <h2 className="text-2xl font-display font-semibold text-[#F1F5F2] flex items-center gap-2.5">
          <FileText className="w-6 h-6 text-[#22C55E]" />
          <span>Agent 4: Section-by-Section Grounded Writing</span>
        </h2>
        <p className="text-sm text-[#A6B5AB] mt-1">
          Two-stage academic drafting grounded strictly in researcher notes and retrieved Semantic Scholar papers.
        </p>
      </div>

      <div className="p-6 rounded-lg bg-[#14221B] border border-[#2A3D32] space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <label className="block text-xs font-medium text-[#A6B5AB] mb-1">Target Venue Format</label>
            <div className="flex rounded bg-[#0D1713] p-1 border border-[#2A3D32]">
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
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                    venue === v.id
                      ? 'bg-[#14532D] text-[#F1F5F2] border border-[#22C55E]/40'
                      : 'text-[#81958A] hover:text-[#F1F5F2]'
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
            className="w-full sm:w-auto px-6 py-2.5 rounded font-semibold text-xs text-[#0D1713] bg-[#22C55E] hover:bg-[#16a34a] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-[#0D1713]/25 border-t-[#0D1713] rounded-full animate-spin" />
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
          <div className="p-3 rounded bg-rose-950/50 border border-rose-800/50 text-xs text-rose-300">
            {error}
          </div>
        )}
      </div>

      {draft && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-2">
            <div className="text-xs font-semibold text-[#81958A] uppercase tracking-wider px-2 mb-2">
              Sections ({draft.sections.length})
            </div>
            {draft.sections.map((sec, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSectionIdx(idx)}
                className={`w-full p-3 rounded text-left transition-all flex items-center justify-between text-xs border ${
                  activeSectionIdx === idx
                    ? 'bg-[#1B2D24] text-[#F1F5F2] border-[#22C55E]/50 font-semibold'
                    : 'bg-[#14221B] border-[#2A3D32] text-[#A6B5AB] hover:bg-[#1B2D24]/60'
                }`}
              >
                <span className="truncate">{sec.title}</span>
                <span className="text-[10px] opacity-75 font-mono">{sec.word_count}w</span>
              </button>
            ))}

            <div className="p-4 rounded bg-[#0D1713] border border-[#2A3D32] text-xs text-[#81958A] mt-4 space-y-1.5">
              <div>
                <span className="text-[#F1F5F2]">Total Words:</span> {draft.total_word_count}
              </div>
              <div>
                <span className="text-[#F1F5F2]">Citations:</span> {draft.bibtex_entries.length} references
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="p-6 rounded-lg bg-[#14221B] border border-[#2A3D32]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#2A3D32]">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-[#22C55E]" />
                  <span className="text-sm font-semibold text-[#F1F5F2]">
                    {draft.sections[activeSectionIdx]?.title}
                  </span>
                </div>
                <button
                  onClick={handleCopyLatex}
                  className="px-3 py-1.5 rounded text-xs font-medium text-[#F1F5F2] bg-[#1B2D24] hover:bg-[#14532D] border border-[#2A3D32] flex items-center gap-1.5 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#86EFAC]" />
                      <span>Copy LaTeX</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 rounded bg-[#0D1713] border border-[#2A3D32] font-mono text-xs text-[#F1F5F2] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[400px]">
                {draft.sections[activeSectionIdx]?.latex_content}
              </pre>

              {draft.sections[activeSectionIdx]?.cited_keys.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#2A3D32] flex items-center gap-2 text-xs text-[#81958A]">
                  <BookOpen className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>Cited keys in section:</span>
                  <div className="flex flex-wrap gap-1">
                    {draft.sections[activeSectionIdx].cited_keys.map((k, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-[#0D1713] border border-[#2A3D32] text-[11px] font-mono text-[#86EFAC]"
                      >
                        {`\\cite{${k}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={onProceedToReview}
                className="px-5 py-2.5 rounded font-semibold text-xs text-[#0D1713] bg-[#22C55E] hover:bg-[#16a34a] flex items-center gap-2 transition-all"
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
