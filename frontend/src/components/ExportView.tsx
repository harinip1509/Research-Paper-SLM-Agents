import React, { useState, useEffect } from 'react'
import {
  FileCheck,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileText,
  FileCode,
  ShieldCheck,
} from 'lucide-react'
import { apiCheckConstraints, apiExportFormat, apiGetVenues } from '../api'
import { PaperDraft, FormatConstraintReport } from '../types'

interface ExportViewProps {
  title: string
  abstract: string
  venue: string
  setVenue: (v: string) => void
  draft: PaperDraft | null
}

export const ExportView: React.FC<ExportViewProps> = ({
  title,
  abstract,
  venue,
  setVenue,
  draft,
}) => {
  const [venues, setVenues] = useState<Record<string, any>>({})
  const [report, setReport] = useState<FormatConstraintReport | null>(null)
  const [loadingCheck, setLoadingCheck] = useState(false)
  const [loadingExport, setLoadingExport] = useState(false)
  const [exportSuccess, setExportSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiGetVenues()
      .then(setVenues)
      .catch((err) => console.error('Venues error:', err))
  }, [])

  const handleCheckConstraints = async () => {
    if (!draft) return
    setLoadingCheck(true)
    setError(null)
    setExportSuccess(null)
    try {
      const rep = await apiCheckConstraints({
        venue_id: venue,
        title,
        authors: [{ name: 'Anonymous Researcher', affiliation: 'Anonymous Lab', email: 'anon@conference.org' }],
        abstract,
        keywords: ['Deep Learning', 'Natural Language Processing', 'Topic Uniqueness'],
        sections: draft.sections.map((s) => ({ title: s.title, content: s.latex_content })),
        bibtex: draft.bibtex_entries.join('\n\n'),
      })
      setReport(rep)
    } catch (err: any) {
      setError(err.message || 'Constraint check failed.')
    } finally {
      setLoadingCheck(false)
    }
  }

  const handleExport = async (formatType: 'pdf' | 'docx') => {
    if (!draft) return
    setLoadingExport(true)
    setError(null)
    setExportSuccess(null)
    try {
      const res = await apiExportFormat({
        venue_id: venue,
        title,
        authors: [{ name: 'Anonymous Researcher', affiliation: 'Anonymous Lab', email: 'anon@conference.org' }],
        abstract,
        keywords: ['Deep Learning', 'Natural Language Processing', 'Topic Uniqueness'],
        sections: draft.sections.map((s) => ({ title: s.title, content: s.latex_content })),
        bibtex: draft.bibtex_entries.join('\n\n'),
      })

      if (formatType === 'pdf') {
        window.open(res.pdf_download_url, '_blank')
        setExportSuccess(`Compiled ${venue.toUpperCase()} PDF ready!`)
      } else {
        window.open(res.docx_download_url, '_blank')
        setExportSuccess(`Generated ${venue.toUpperCase()} DOCX ready!`)
      }
    } catch (err: any) {
      setError(err.message || 'Export compilation failed.')
    } finally {
      setLoadingExport(false)
    }
  }

  const handleDownloadLatex = () => {
    if (!draft) return
    const blob = new Blob([draft.sections.map((s) => s.latex_content).join('\n\n')], {
      type: 'text/plain',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.slice(0, 20).replace(/\s+/g, '_')}_${venue}.tex`
    a.click()
  }

  const handleDownloadBib = () => {
    if (!draft) return
    const blob = new Blob([draft.bibtex_entries.join('\n\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'references.bib'
    a.click()
  }

  const activeProfile = venues[venue] || {}

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-display font-semibold text-[#F1F5F2] flex items-center gap-2.5">
          <FileCheck className="w-6 h-6 text-[#22C55E]" />
          <span>Agent 7: Venue Constraints & Deterministic Export</span>
        </h2>
        <p className="text-sm text-[#A6B5AB] mt-1">
          Verify page limits, word budgets, anonymization, and render deterministic LaTeX Jinja2 templates.
        </p>
      </div>

      <div className="p-6 rounded-lg bg-[#14221B] border border-[#2A3D32] space-y-4">
        <label className="block text-xs font-semibold text-[#A6B5AB] uppercase tracking-wider">
          Select Conference Venue Profile
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { id: 'ieee', name: 'IEEE', desc: 'Two-column, 6-8 pages' },
            { id: 'acl', name: 'ACL', desc: 'Two-column, anonymized' },
            { id: 'acm', name: 'ACM', desc: 'acmart sigconf' },
            { id: 'lncs', name: 'LNCS', desc: 'Springer single-col' },
            { id: 'generic', name: 'Plain', desc: 'Standard preprint' },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => {
                setVenue(v.id)
                setReport(null)
              }}
              className={`p-3 rounded border text-left transition-all ${
                venue === v.id
                  ? 'bg-[#14532D]/60 text-[#F1F5F2] border-[#22C55E]'
                  : 'bg-[#0D1713] border-[#2A3D32] text-[#A6B5AB] hover:border-[#81958A]'
              }`}
            >
              <div className="font-semibold text-xs">{v.name}</div>
              <div className={`text-[10px] mt-0.5 ${venue === v.id ? 'text-[#86EFAC]' : 'text-[#81958A]'}`}>
                {v.desc}
              </div>
            </button>
          ))}
        </div>

        {activeProfile.name && (
          <div className="p-3.5 rounded bg-[#0D1713] border border-[#2A3D32] text-xs text-[#A6B5AB] grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <span className="text-[#81958A]">Max Pages:</span> {activeProfile.page_limit_main || 'Unlimited'}
            </div>
            <div>
              <span className="text-[#81958A]">Max Abstract:</span> {activeProfile.abstract_word_limit || 250} words
            </div>
            <div>
              <span className="text-[#81958A]">Double-Blind:</span>{' '}
              {activeProfile.anonymization_required ? 'Required' : 'Optional'}
            </div>
            <div>
              <span className="text-[#81958A]">AI Disclosure:</span>{' '}
              {activeProfile.ai_use_disclosure_required ? 'Required' : 'Optional'}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleCheckConstraints}
            disabled={loadingCheck || !draft}
            className="px-5 py-2.5 rounded font-semibold text-xs text-[#0D1713] bg-[#22C55E] hover:bg-[#16a34a] transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loadingCheck ? (
              <span className="w-4 h-4 border-2 border-[#0D1713]/25 border-t-[#0D1713] rounded-full animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>Verify Venue Constraints</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded bg-rose-950/50 border border-rose-800/50 text-xs text-rose-300">
          {error}
        </div>
      )}

      {exportSuccess && (
        <div className="p-3 rounded bg-[#14532D]/50 border border-[#22C55E]/40 text-xs text-[#86EFAC] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
          <span>{exportSuccess}</span>
        </div>
      )}

      {report && (
        <div className="p-6 rounded-lg bg-[#14221B] border border-[#2A3D32] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2A3D32]">
            <h3 className="text-sm font-semibold text-[#F1F5F2] flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#22C55E]" />
              <span>Constraint Audit: {report.venue_name}</span>
            </h3>
            <span
              className={`text-xs px-2.5 py-0.5 rounded font-semibold ${
                report.passed
                  ? 'bg-[#14532D]/50 text-[#86EFAC] border border-[#22C55E]/40'
                  : 'bg-rose-950/50 text-rose-300 border border-rose-800/40'
              }`}
            >
              {report.passed ? 'All Venue Constraints Satisfied' : 'Violations Flagged'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded bg-[#0D1713] border border-[#2A3D32]">
              <div className="text-xs text-[#81958A]">Total Words</div>
              <div className="text-lg font-bold text-[#F1F5F2] mt-1">{report.word_count}</div>
            </div>
            <div className="p-3 rounded bg-[#0D1713] border border-[#2A3D32]">
              <div className="text-xs text-[#81958A]">Abstract Words</div>
              <div className="text-lg font-bold text-[#86EFAC] mt-1">{report.abstract_words}</div>
            </div>
            <div className="p-3 rounded bg-[#0D1713] border border-[#2A3D32]">
              <div className="text-xs text-[#81958A]">Estimated Pages</div>
              <div className="text-lg font-bold text-[#22C55E] mt-1">{report.estimated_pages}</div>
            </div>
          </div>

          {report.violations.length > 0 && (
            <div className="space-y-2 mt-3">
              <div className="text-xs font-semibold text-[#A6B5AB]">Flagged Constraint Violations:</div>
              {report.violations.map((v, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded border text-xs flex items-start gap-2.5 ${
                    v.severity === 'error'
                      ? 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                      : 'bg-amber-950/30 border-amber-800/40 text-amber-300'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold uppercase tracking-wider text-[10px]">[{v.constraint_type}] </span>
                    <span>{v.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="p-6 rounded-lg bg-[#14221B] border border-[#2A3D32] space-y-4">
        <h3 className="text-sm font-semibold text-[#F1F5F2] flex items-center gap-2">
          <Download className="w-4 h-4 text-[#22C55E]" />
          <span>Export Camera-Ready Files</span>
        </h3>
        <p className="text-xs text-[#A6B5AB]">
          Rendered deterministically through Jinja2 LaTeX templates and compiled using pdflatex.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => handleExport('pdf')}
            disabled={loadingExport || !draft}
            className="p-3.5 rounded font-semibold text-xs text-[#0D1713] bg-[#22C55E] hover:bg-[#16a34a] flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={() => handleExport('docx')}
            disabled={loadingExport || !draft}
            className="p-3.5 rounded font-semibold text-xs text-[#F1F5F2] bg-[#0D1713] hover:bg-[#1B2D24] border border-[#2A3D32] flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            <FileText className="w-4 h-4 text-[#86EFAC]" />
            <span>Download DOCX</span>
          </button>

          <button
            onClick={handleDownloadLatex}
            disabled={!draft}
            className="p-3.5 rounded font-semibold text-xs text-[#F1F5F2] bg-[#0D1713] hover:bg-[#1B2D24] border border-[#2A3D32] flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            <FileCode className="w-4 h-4 text-[#22C55E]" />
            <span>Export LaTeX (.tex)</span>
          </button>

          <button
            onClick={handleDownloadBib}
            disabled={!draft}
            className="p-3.5 rounded font-semibold text-xs text-[#F1F5F2] bg-[#0D1713] hover:bg-[#1B2D24] border border-[#2A3D32] flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            <FileText className="w-4 h-4 text-[#86EFAC]" />
            <span>Export BibTeX (.bib)</span>
          </button>
        </div>
      </div>
    </div>
  )
}
