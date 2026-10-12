import React, { useState, useEffect } from 'react'
import {
  FileCheck,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileText,
  FileCode,
  ShieldCheck,
  Sparkles,
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
        <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <FileCheck className="w-6 h-6 text-purple-400" />
          <span>Agent 7: Venue Constraints & Deterministic Export</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Verify page limits, word budgets, anonymization, and render deterministic LaTeX Jinja2 templates.
        </p>
      </div>

      {/* Venue Selector */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
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
              className={`p-3 rounded-xl border text-left transition-all ${
                venue === v.id
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-xs">{v.name}</div>
              <div className={`text-[10px] mt-0.5 ${venue === v.id ? 'text-indigo-200' : 'text-slate-500'}`}>
                {v.desc}
              </div>
            </button>
          ))}
        </div>

        {activeProfile.name && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <span className="text-slate-500">Max Pages:</span> {activeProfile.page_limit_main || 'Unlimited'}
            </div>
            <div>
              <span className="text-slate-500">Max Abstract:</span> {activeProfile.abstract_word_limit || 250} words
            </div>
            <div>
              <span className="text-slate-500">Double-Blind:</span>{' '}
              {activeProfile.anonymization_required ? 'Required' : 'Optional'}
            </div>
            <div>
              <span className="text-slate-500">AI Disclosure:</span>{' '}
              {activeProfile.ai_use_disclosure_required ? 'Required' : 'Optional'}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleCheckConstraints}
            disabled={loadingCheck || !draft}
            className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loadingCheck ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>Verify Venue Constraints</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
          {error}
        </div>
      )}

      {exportSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{exportSuccess}</span>
        </div>
      )}

      {/* Constraints Report */}
      {report && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-purple-400" />
              <span>Constraint Audit: {report.venue_name}</span>
            </h3>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                report.passed
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {report.passed ? 'All Venue Constraints Satisfied' : 'Violations Flagged'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">Total Words</div>
              <div className="text-lg font-bold text-white mt-1">{report.word_count}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">Abstract Words</div>
              <div className="text-lg font-bold text-cyan-400 mt-1">{report.abstract_words}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">Estimated Pages</div>
              <div className="text-lg font-bold text-indigo-400 mt-1">{report.estimated_pages}</div>
            </div>
          </div>

          {report.violations.length > 0 && (
            <div className="space-y-2 mt-3">
              <div className="text-xs font-semibold text-slate-300">Flagged Constraint Violations:</div>
              {report.violations.map((v, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    v.severity === 'error'
                      ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                      : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
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

      {/* Export Action Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Download className="w-4 h-4 text-indigo-400" />
          <span>Export Camera-Ready Files</span>
        </h3>
        <p className="text-xs text-slate-400">
          Rendered deterministically through Jinja2 LaTeX templates and compiled using tectonic / pandoc.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => handleExport('pdf')}
            disabled={loadingExport || !draft}
            className="p-3.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={() => handleExport('docx')}
            disabled={loadingExport || !draft}
            className="p-3.5 rounded-xl font-semibold text-xs text-slate-200 bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Download DOCX</span>
          </button>

          <button
            onClick={handleDownloadLatex}
            disabled={!draft}
            className="p-3.5 rounded-xl font-semibold text-xs text-slate-200 bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span>Export LaTeX (.tex)</span>
          </button>

          <button
            onClick={handleDownloadBib}
            disabled={!draft}
            className="p-3.5 rounded-xl font-semibold text-xs text-slate-200 bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Export BibTeX (.bib)</span>
          </button>
        </div>
      </div>
    </div>
  )
}
