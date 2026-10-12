import React, { useState } from 'react'
import { Download, FileText, FileCode, CheckCircle2, ArrowRight } from 'lucide-react'
import { PaperDraft, TopicUniquenessResponse } from '../types'
import { apiDownloadPdf, apiDownloadDocx } from '../api'

interface FinalReportViewProps {
  title: string
  abstract: string
  venue: string
  draft: PaperDraft | null
  uniqueness: TopicUniquenessResponse | null
  onNavigate?: (view: any) => void
}

export const FinalReportView: React.FC<FinalReportViewProps> = ({
  title,
  abstract,
  venue,
  draft,
  uniqueness,
  onNavigate,
}) => {
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [loadingDocx, setLoadingDocx] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  if (!draft || !title.trim()) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto font-sans">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-[#2563eb] font-semibold uppercase mb-1.5">
            Stage 7 — Final Paper
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-slate-900 tracking-tight">
            Final Paper Export
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-3xl leading-relaxed">
            Deterministic Jinja2 compilation across IEEE, ACL, ACM, and Springer LNCS templates.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold font-serif text-slate-900">
            No Paper Draft Ready for Export
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Complete the literature search and section drafting workflow in Stage 1 before exporting conference PDFs or Word documents.
          </p>
          {onNavigate && (
            <button
              onClick={() => onNavigate('project')}
              className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#0f1f3d] hover:bg-[#162a52] transition-colors inline-flex items-center gap-2 shadow-sm"
            >
              <span>Go to Stage 1 (Research Topic)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    )
  }

  const paperTitle = title
  const paperAbstract = abstract
  const wordCount = draft.total_word_count
  const sectionCount = draft.sections.length
  const refCount = draft.bibtex_entries?.length || 0

  const handleExport = async (type: 'pdf' | 'docx') => {
    if (type === 'pdf') setLoadingPdf(true)
    else setLoadingDocx(true)
    setToast(null)

    try {
      const sectionsData = draft.sections.map((s) => ({
        title: s.title,
        content: s.latex_content,
      }))

      const payload = {
        venue_id: venue || 'ieee',
        title: paperTitle,
        authors: [
          {
            name: 'Researcher Author',
            affiliation: 'Department of Computer Science',
            email: 'author@conference.org',
          },
        ],
        abstract: paperAbstract,
        keywords: ['Machine Learning', 'Natural Language Processing', 'Multi-Agent Systems'],
        sections: sectionsData,
        bibtex: draft.bibtex_entries?.join('\n\n') || '',
        target_pages: draft.target_pages || 6,
      }

      if (type === 'pdf') {
        const blob = await apiDownloadPdf(payload)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `paper_${venue || 'ieee'}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        a.remove()
        setToast('PDF compiled and downloaded successfully!')
      } else {
        const blob = await apiDownloadDocx(payload)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `paper_${venue || 'ieee'}.docx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        a.remove()
        setToast('DOCX generated and downloaded successfully!')
      }
    } catch (e: any) {
      setToast(e.message || 'Export generation failed.')
    } finally {
      setLoadingPdf(false)
      setLoadingDocx(false)
      setTimeout(() => setToast(null), 4000)
    }
  }

  const handleExportBibtex = () => {
    const bibContent = draft.bibtex_entries?.join('\n\n') || ''
    if (!bibContent) {
      setToast('No BibTeX citations found.')
      return
    }

    const blob = new Blob([bibContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'references.bib'
    a.click()
    setToast('BibTeX references downloaded!')
    setTimeout(() => setToast(null), 4000)
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans">
      {/* Header */}
      <div>
        <div className="text-[11px] font-mono tracking-widest text-[#2563eb] font-semibold uppercase mb-1.5">
          Stage 7 — Final Paper
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-slate-900 tracking-tight">
          Final Paper Export
        </h1>
        <p className="text-sm text-slate-500 mt-2 max-w-3xl leading-relaxed">
          Deterministic Jinja2 compilation across IEEE, ACL, ACM, and Springer LNCS templates.
          All citations verified with zero hallucinations.
        </p>
      </div>

      {toast && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Paper Metadata Summary Card */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 sm:p-8 space-y-6 shadow-xs">
        <div>
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold mb-1">
            Generated Paper Title
          </div>
          <h2 className="text-2xl font-bold font-serif text-slate-900 leading-snug">
            {paperTitle}
          </h2>
        </div>

        <div>
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold mb-1.5">
            Abstract
          </div>
          <p className="text-xs text-slate-600 leading-relaxed bg-[#f8fafc] p-4 rounded-lg border border-slate-100">
            {paperAbstract}
          </p>
        </div>

        {/* 4 Metadata Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-mono uppercase text-slate-400">Target Venue</div>
            <div className="text-sm font-bold font-mono text-slate-900 mt-1 uppercase">
              {venue}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-mono uppercase text-slate-400">Total Words</div>
            <div className="text-sm font-bold font-mono text-slate-900 mt-1">
              {wordCount.toLocaleString()}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-mono uppercase text-slate-400">Sections</div>
            <div className="text-sm font-bold font-mono text-slate-900 mt-1">
              {sectionCount}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-mono uppercase text-slate-400">Verified Refs</div>
            <div className="text-sm font-bold font-mono text-slate-900 mt-1">
              {refCount}
            </div>
          </div>
        </div>

        {/* Export Buttons Row */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleExport('pdf')}
            disabled={loadingPdf}
            className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#0f1f3d] hover:bg-[#162a52] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{loadingPdf ? 'Compiling PDF...' : 'Download Conference PDF'}</span>
          </button>

          <button
            onClick={() => handleExport('docx')}
            disabled={loadingDocx}
            className="px-5 py-2.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-[#e2e8f0] transition-colors flex items-center gap-2 shadow-2xs disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>{loadingDocx ? 'Generating DOCX...' : 'Export DOCX (Pandoc)'}</span>
          </button>

          <button
            onClick={handleExportBibtex}
            className="px-5 py-2.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-[#e2e8f0] transition-colors flex items-center gap-2 shadow-2xs"
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download references.bib ({refCount})</span>
          </button>
        </div>
      </div>
    </div>
  )
}
