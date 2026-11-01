import React, { useState } from 'react'
import { FileEdit, ArrowUpRight, Copy, Check, Code2, RefreshCw } from 'lucide-react'
import { NavView } from './Sidebar'
import { PaperDraft, Paper } from '../types'
import { apiDraftFullPaper } from '../api'

interface PaperWorkspaceViewProps {
  onNavigate: (view: NavView) => void
  draft: PaperDraft | null
  setDraft?: (d: PaperDraft) => void
  title?: string
  abstract?: string
  userNotes?: string
  papers?: Paper[]
  venue?: string
  setVenue?: (v: string) => void
  targetPages?: number
  setTargetPages?: (p: number) => void
}

export const PaperWorkspaceView: React.FC<PaperWorkspaceViewProps> = ({
  onNavigate,
  draft,
  setDraft,
  title = '',
  abstract = '',
  userNotes = '',
  papers = [],
  venue = 'ieee',
  setVenue,
  targetPages = 6,
  setTargetPages,
}) => {
  const [activeSection, setActiveSection] = useState(0)
  const [copied, setCopied] = useState(false)
  const [rescaling, setRescaling] = useState(false)

  const sections = draft?.sections || []
  const verifiedRefCount =
    draft?.bibtex_entries?.length ||
    draft?.citation_verifications?.length ||
    (draft?.bibtex_content ? (draft.bibtex_content.match(/@\w+\s*\{/g) || []).length : 0)
  const effectivePages = targetPages || draft?.target_pages || 6

  const handleCopy = () => {
    if (!sections[activeSection]) return
    const text = sections[activeSection].latex_content
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRescaleDraft = async () => {
    if (!setDraft) return
    setRescaling(true)
    try {
      const updated = await apiDraftFullPaper({
        title: title || draft?.title || 'Conference Paper Submission',
        abstract: abstract || draft?.abstract || '',
        venue: venue || 'ieee',
        user_notes: userNotes,
        retrieved_papers: papers,
        target_pages: effectivePages,
      })
      setDraft(updated)
      setActiveSection(0)
    } catch (err) {
      console.error('Failed to rescale draft:', err)
    } finally {
      setRescaling(false)
    }
  }

  if (!draft || sections.length === 0) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto font-sans">
        <div className="border-b border-[#E6DDD0] pb-6">
          <div className="text-[11px] tracking-[0.18em] text-[#8C6B4F] font-semibold uppercase mb-1.5">
            Grounded Manuscript Drafting
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-normal text-[#261C16] tracking-tight">
            Paper Workspace
          </h1>
          <p className="text-sm text-[#6E6055] mt-2 max-w-3xl leading-relaxed">
            Interactive section-by-section manuscript editor conditioned on retrieved literature
            and your target page count.
          </p>
        </div>

        <div className="rounded-3xl bg-white border border-dashed border-[#DFD3C3] p-12 text-center max-w-2xl mx-auto space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-[#EADFD2] text-[#3D281D] flex items-center justify-center mx-auto">
            <FileEdit className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-display font-semibold text-[#261C16]">
            No Manuscript Draft Generated Yet
          </h3>
          <p className="text-xs text-[#6E6055] max-w-md mx-auto leading-relaxed">
            Open Project Setup to define your research topic, target page count, and conference
            venue. The writing engine will synthesize grounded LaTeX sections and verified
            citations.
          </p>
          <div className="pt-2 inline-flex items-center gap-1.5">
            <button
              onClick={() => onNavigate('project')}
              className="px-6 py-3 rounded-full text-xs font-semibold text-[#FAF7F2] bg-[#3D281D] hover:bg-[#2B1B12] transition-colors"
            >
              Configure Project
            </button>
            <button
              onClick={() => onNavigate('project')}
              aria-label="Configure Project"
              className="w-10 h-10 rounded-full bg-[#EADFD2] text-[#3D281D] flex items-center justify-center"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto font-sans">
      {/* Editorial Header */}
      <div className="border-b border-[#E6DDD0] pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] tracking-[0.18em] text-[#8C6B4F] font-semibold uppercase mb-1.5">
            Grounded Manuscript Drafting
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-normal text-[#261C16] tracking-tight">
            Paper Workspace
          </h1>
          <p className="text-sm text-[#6E6055] mt-2 max-w-2xl leading-relaxed">
            Inspect each synthesized section below, or adjust your target venue and page budget on
            the fly.
          </p>
        </div>

        {/* Quick Page & Venue Controls in Workspace */}
        <div className="flex flex-wrap items-center gap-3 bg-[#F3ECE2] px-4 py-3 rounded-full border border-[#E6DDD0]">
          {setVenue && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6E6055] font-medium">Venue:</span>
              <select
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="px-3 py-1.5 rounded-full bg-white border border-[#DFD3C3] text-xs font-medium text-[#261C16] focus:outline-none focus:border-[#8C6B4F]"
              >
                <option value="ieee">IEEE (2-Col)</option>
                <option value="acl">ACL (2-Col Anon)</option>
                <option value="acm">ACM (sigconf)</option>
                <option value="lncs">Springer LNCS (1-Col)</option>
                <option value="generic">arXiv Preprint (1-Col)</option>
              </select>
            </div>
          )}

          {setTargetPages && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6E6055] font-medium">Pages:</span>
              <input
                type="number"
                min={1}
                max={30}
                value={effectivePages}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10)
                  if (!isNaN(val)) {
                    setTargetPages(Math.max(1, Math.min(30, val)))
                  }
                }}
                className="w-16 px-2.5 py-1 rounded-full bg-white border border-[#DFD3C3] text-xs font-bold text-[#3D281D] text-center focus:outline-none"
              />
            </div>
          )}

          {setDraft && (
            <button
              onClick={handleRescaleDraft}
              disabled={rescaling}
              className="px-4 py-1.5 rounded-full text-xs font-semibold text-[#FAF7F2] bg-[#3D281D] hover:bg-[#2B1B12] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${rescaling ? 'animate-spin' : ''}`} />
              <span>{rescaling ? 'Rescaling...' : `Rescale to ${effectivePages}pp`}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sections Sidebar */}
        <div className="lg:col-span-1 rounded-3xl bg-[#F3ECE2] border border-[#E6DDD0] p-5 space-y-3">
          <div className="text-[10px] tracking-[0.16em] text-[#8C7D70] uppercase font-semibold px-2">
            Manuscript Sections ({sections.length})
          </div>

          <div className="space-y-1.5">
            {sections.map((sec, idx) => {
              const active = activeSection === idx
              return (
                <button
                  key={idx}
                  onClick={() => setActiveSection(idx)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs transition-all flex items-center justify-between ${
                    active
                      ? 'bg-[#3D281D] text-[#FAF7F2] font-semibold shadow-2xs'
                      : 'text-[#4A3728] hover:bg-[#EADFD2]/70 hover:text-[#261C16]'
                  }`}
                >
                  <span className="truncate">{sec.title}</span>
                  <span
                    className={`text-[10px] font-mono ${
                      active ? 'text-[#EADFD2]' : 'text-[#8C7D70]'
                    }`}
                  >
                    {sec.word_count}w
                  </span>
                </button>
              )
            })}
          </div>

          <div className="pt-4 mt-4 border-t border-[#DFD3C3] text-xs text-[#6E6055] space-y-2 px-1">
            <div className="flex justify-between">
              <span>Target Length</span>
              <span className="text-[#3D281D] font-semibold">
                {effectivePages} {effectivePages === 1 ? 'Page' : 'Pages'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Word Count</span>
              <span className="text-[#261C16] font-semibold">
                {sections.reduce((acc, s) => acc + s.word_count, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Verified References</span>
              <span className="text-[#8C6B4F] font-semibold">{verifiedRefCount}</span>
            </div>
          </div>
        </div>

        {/* Section Editor / View */}
        <div className="lg:col-span-3 rounded-3xl bg-white border border-[#E6DDD0] p-6 sm:p-8 flex flex-col justify-between space-y-5 shadow-2xs">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E6DDD0] mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#EADFD2] text-[#3D281D] flex items-center justify-center">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#8C6B4F] font-semibold block">
                    Synthesized LaTeX Section
                  </span>
                  <h3 className="font-display text-2xl font-semibold text-[#261C16]">
                    {sections[activeSection]?.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={handleCopy}
                className="px-4 py-2 rounded-full text-xs font-medium text-[#3D281D] bg-[#F3ECE2] hover:bg-[#EADFD2] border border-[#E6DDD0] transition-colors flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#3D281D]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#8C6B4F]" />
                    <span>Copy Section LaTeX</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={15}
              readOnly
              value={sections[activeSection]?.latex_content}
              className="w-full font-mono text-xs text-[#261C16] bg-[#FAF7F2] border border-[#E6DDD0] p-5 rounded-2xl focus:outline-none leading-relaxed resize-none"
            />
          </div>

          <div className="pt-4 border-t border-[#E6DDD0] flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[#8C7D70]">
              Section length: <strong className="text-[#261C16]">{sections[activeSection]?.word_count}</strong> words
            </span>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onNavigate('final-check')}
                className="px-5 py-2.5 rounded-full text-xs font-medium text-[#3D281D] bg-[#F3ECE2] hover:bg-[#EADFD2] border border-[#E6DDD0] transition-colors"
              >
                Audit Novelty &amp; Citations &rarr;
              </button>
              <div className="inline-flex items-center gap-1.5">
                <button
                  onClick={() => onNavigate('final-report')}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#FAF7F2] bg-[#3D281D] hover:bg-[#2B1B12] transition-colors"
                >
                  Format &amp; Export ({venue.toUpperCase()}, {effectivePages}pp)
                </button>
                <button
                  onClick={() => onNavigate('final-report')}
                  aria-label="Format and Export"
                  className="w-9 h-9 rounded-full bg-[#EADFD2] text-[#3D281D] flex items-center justify-center"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
