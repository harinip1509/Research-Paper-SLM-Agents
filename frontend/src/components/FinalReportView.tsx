import React, { useState, useEffect } from 'react'
import {
  Download,
  FileText,
  FileCode,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Eye,
  Copy,
  Check,
  Globe,
  BookOpen,
} from 'lucide-react'
import { PaperDraft, TopicUniquenessResponse, FormatConstraintReport } from '../types'
import {
  apiDownloadPdf,
  apiDownloadDocx,
  apiDownloadTex,
  apiDownloadMarkdown,
  apiDownloadHtml,
  apiCheckConstraints,
  apiRenderLatex,
} from '../api'

interface FinalReportViewProps {
  title: string
  abstract: string
  venue: string
  setVenue?: (v: string) => void
  draft: PaperDraft | null
  uniqueness: TopicUniquenessResponse | null
  targetPages?: number
  setTargetPages?: (p: number) => void
  onNavigate?: (view: any) => void
}

const VENUE_SPECS: Record<
  string,
  {
    id: string
    name: string
    fullName: string
    docClass: string
    columns: string
    sectionStyle: string
    citationStyle: string
    blindMode: string
    distinctFeatures: string
  }
> = {
  ieee: {
    id: 'ieee',
    name: 'IEEE',
    fullName: 'IEEE Conference Proceedings',
    docClass: '\\documentclass[conference]{IEEEtran}',
    columns: 'Two-Column (US Letter, 0.62in margins)',
    sectionStyle: 'Roman Numerals (I. INTRODUCTION, A. Subsection)',
    citationStyle: 'Numeric Brackets [1], [2]',
    blindMode: 'Single-Blind (Full Author Block & Affiliations)',
    distinctFeatures: 'Inline Bold-Italic "Abstract—" & "Index Terms—", Center Column Rule',
  },
  acl: {
    id: 'acl',
    name: 'ACL / EMNLP',
    fullName: 'Association for Computational Linguistics',
    docClass: '\\documentclass[11pt,a4paper,twocolumn]{article}',
    columns: 'Two-Column (A4, 0.72in margins)',
    sectionStyle: 'Arabic Numerals (1 Introduction, 1.1 Subsection)',
    citationStyle: 'Author-Year (Vaswani et al., 2017)',
    blindMode: 'Mandatory Double-Blind (Anonymous ACL Submission)',
    distinctFeatures: 'Confidential Review Line Numbers (001–090), Mandatory Limitations & Ethics Section',
  },
  acm: {
    id: 'acm',
    name: 'ACM SIGCONF',
    fullName: 'ACM International Conference Proceeding Series',
    docClass: '\\documentclass[sigconf,nonacm]{acmart}',
    columns: 'Two-Column sigconf (US Letter, 0.68in margins)',
    sectionStyle: 'Uppercase Sans-Serif (1 INTRODUCTION, 1.1 Subsection)',
    citationStyle: 'Numeric Brackets [1], [2]',
    blindMode: 'Mandatory Double-Blind (Anonymous Author(s) #SF-ACM)',
    distinctFeatures: 'CCS Concepts Block, ACM Running Header, Generative AI Disclosure Policy',
  },
  lncs: {
    id: 'lncs',
    name: 'Springer LNCS',
    fullName: 'Lecture Notes in Computer Science (Springer)',
    docClass: '\\documentclass[runningheads]{llncs}',
    columns: 'Single-Column (Wide 1.25in LNCS Margins)',
    sectionStyle: 'Bold Numbered (1  Introduction, 1.1  Subsection)',
    citationStyle: 'Numeric Brackets [1], [2]',
    blindMode: 'Single-Blind (Superscript Institute Affiliations)',
    distinctFeatures: 'Alternating Running Heads, Indented "Abstract." & Middle-Dot Keywords (·)',
  },
  generic: {
    id: 'generic',
    name: 'arXiv Preprint',
    fullName: 'Standard Academic Preprint / Technical Report',
    docClass: '\\documentclass[11pt,a4paper]{article}',
    columns: 'Single-Column (0.90in Preprint Margins)',
    sectionStyle: 'Standard Numbered (1. Introduction, 1.1. Subsection)',
    citationStyle: 'Numeric Brackets [1], [2]',
    blindMode: 'Open Preprint (Full Author & Institution Block)',
    distinctFeatures: 'Horizontal Rule Title Banner, Framed Abstract, Methodology Disclosure',
  },
}

export const FinalReportView: React.FC<FinalReportViewProps> = ({
  title,
  abstract,
  venue: propVenue,
  setVenue: propSetVenue,
  draft,
  uniqueness,
  targetPages: propTargetPages,
  setTargetPages: propSetTargetPages,
  onNavigate,
}) => {
  const [localVenue, setLocalVenue] = useState(propVenue || 'ieee')
  const [localPages, setLocalPages] = useState(propTargetPages || draft?.target_pages || 6)

  const venue = propVenue || localVenue
  const setVenue = (v: string) => {
    setLocalVenue(v)
    if (propSetVenue) propSetVenue(v)
  }

  const effectivePages = propTargetPages ?? localPages
  const setTargetPages = (p: number) => {
    const clamped = Math.max(1, Math.min(30, p))
    setLocalPages(clamped)
    if (propSetTargetPages) propSetTargetPages(clamped)
  }

  const [loadingFormat, setLoadingFormat] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [constraintReport, setConstraintReport] = useState<FormatConstraintReport | null>(null)
  const [checkingConstraints, setCheckingConstraints] = useState(false)
  const [latexPreview, setLatexPreview] = useState<string>('')
  const [showPreview, setShowPreview] = useState<boolean>(false)
  const [copiedLatex, setCopiedLatex] = useState<boolean>(false)

  const paperTitle = title || draft?.title || 'Conference Paper Submission'
  const paperAbstract = abstract || draft?.abstract || ''
  const bibContent = draft?.bibtex_content || draft?.bibtex_entries?.join('\n\n') || ''

  const buildExportPayload = () => {
    const sectionsData = (draft?.sections || []).map((s) => ({
      title: s.title,
      content: s.latex_content,
    }))
    return {
      venue_id: venue || 'ieee',
      title: paperTitle,
      authors: [
        {
          name: 'Researcher Author',
          affiliation: 'Department of Computer Science',
          institution: 'Research University',
          email: 'author@conference.org',
        },
      ],
      abstract: paperAbstract,
      keywords: [
        'Machine Learning',
        'Natural Language Processing',
        'Multi-Agent Systems',
        'Empirical Evaluation',
      ],
      sections: sectionsData,
      bibtex: bibContent,
      target_pages: effectivePages,
    }
  }

  useEffect(() => {
    if (!draft || !showPreview) return
    let active = true
    apiRenderLatex(buildExportPayload())
      .then((res) => {
        if (active) setLatexPreview(res.latex_source)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [venue, effectivePages, showPreview, draft])

  if (!draft || !paperTitle.trim()) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto font-sans">
        <div className="border-b border-[#E6DDD0] pb-6">
          <div className="text-[11px] tracking-[0.18em] text-[#8C6B4F] font-semibold uppercase mb-1.5">
            Typesetting &amp; Multi-Format Compilation
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-normal text-[#261C16] tracking-tight">
            Venue Formatting &amp; Export
          </h1>
          <p className="text-sm text-[#6E6055] mt-2 max-w-3xl leading-relaxed">
            Deterministic compilation across IEEE, ACL, ACM, Springer LNCS, and arXiv Preprint
            templates calibrated to your exact page target.
          </p>
        </div>

        <div className="rounded-3xl bg-white border border-dashed border-[#DFD3C3] p-12 text-center max-w-2xl mx-auto space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-[#EADFD2] text-[#3D281D] flex items-center justify-center mx-auto">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-display font-semibold text-[#261C16]">
            No Manuscript Ready for Export
          </h3>
          <p className="text-xs text-[#6E6055] max-w-md mx-auto leading-relaxed">
            Complete the literature search and section drafting workflow in Project Setup before
            exporting conference PDFs or Word documents.
          </p>
          {onNavigate && (
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
          )}
        </div>
      </div>
    )
  }

  const wordCount = draft.total_word_count
  const sectionCount = draft.sections.length
  const refCount =
    draft.bibtex_entries?.length ||
    draft.citation_verifications?.length ||
    (bibContent ? (bibContent.match(/@\w+\s*\{/g) || []).length : 0)

  const currentSpec = VENUE_SPECS[venue] || VENUE_SPECS.ieee

  const triggerBlobDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    a.remove()
  }

  const handleExport = async (type: 'pdf' | 'docx' | 'tex' | 'md' | 'html' | 'bib') => {
    setLoadingFormat(type)
    setToast(null)
    setErrorMsg(null)

    try {
      const payload = buildExportPayload()
      const vTag = (venue || 'ieee').toLowerCase()

      if (type === 'pdf') {
        const blob = await apiDownloadPdf(payload)
        triggerBlobDownload(blob, `paper_${vTag}_${effectivePages}pp.pdf`)
        setToast(
          `Compiled ${currentSpec.name} PDF (${effectivePages} ${
            effectivePages === 1 ? 'page' : 'pages'
          }, ${currentSpec.columns.split(' ')[0]}) downloaded!`
        )
      } else if (type === 'docx') {
        const blob = await apiDownloadDocx(payload)
        triggerBlobDownload(blob, `paper_${vTag}_${effectivePages}pp.docx`)
        setToast(
          `Exported ${currentSpec.name} Word DOCX (${effectivePages} ${
            effectivePages === 1 ? 'page' : 'pages'
          }) downloaded!`
        )
      } else if (type === 'tex') {
        const blob = await apiDownloadTex(payload)
        triggerBlobDownload(blob, `paper_${vTag}_${effectivePages}pp.tex`)
        setToast(`Exported ${currentSpec.name} Jinja2 LaTeX source (.tex) downloaded!`)
      } else if (type === 'md') {
        const blob = await apiDownloadMarkdown(payload)
        triggerBlobDownload(blob, `paper_${vTag}_${effectivePages}pp.md`)
        setToast(`Exported ${currentSpec.name} Markdown manuscript (.md) downloaded!`)
      } else if (type === 'html') {
        const blob = await apiDownloadHtml(payload)
        triggerBlobDownload(blob, `paper_${vTag}_${effectivePages}pp.html`)
        setToast(`Exported ${currentSpec.name} styled HTML document (.html) downloaded!`)
      } else if (type === 'bib') {
        const blob = new Blob([bibContent || '% No BibTeX references'], {
          type: 'text/plain;charset=utf-8',
        })
        triggerBlobDownload(blob, `references_${vTag}.bib`)
        setToast(`BibTeX bibliography (${refCount} verified references) downloaded!`)
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Export generation failed.')
    } finally {
      setLoadingFormat(null)
      setTimeout(() => setToast(null), 5000)
    }
  }

  const handleVerifyConstraints = async () => {
    setCheckingConstraints(true)
    setErrorMsg(null)
    try {
      const payload = buildExportPayload()
      const rep = await apiCheckConstraints({
        ...payload,
        is_anonymized: venue === 'acl' || venue === 'acm',
      })
      setConstraintReport(rep)
    } catch (err: any) {
      setErrorMsg(err.message || 'Constraint verification failed.')
    } finally {
      setCheckingConstraints(false)
    }
  }

  const handleToggleLatexPreview = async () => {
    if (showPreview) {
      setShowPreview(false)
      return
    }
    setShowPreview(true)
    try {
      const res = await apiRenderLatex(buildExportPayload())
      setLatexPreview(res.latex_source)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to render LaTeX preview.')
    }
  }

  const handleCopyLatexPreview = () => {
    if (!latexPreview) return
    navigator.clipboard.writeText(latexPreview)
    setCopiedLatex(true)
    setTimeout(() => setCopiedLatex(false), 2000)
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans">
      {/* Header */}
      <div className="border-b border-[#E6DDD0] pb-6">
        <div className="text-[11px] tracking-[0.18em] text-[#8C6B4F] font-semibold uppercase mb-1.5">
          Typesetting &amp; Multi-Format Compilation
        </div>
        <h1 className="text-3xl sm:text-5xl font-display font-normal text-[#261C16] tracking-tight">
          Venue Formatting &amp; Export
        </h1>
        <p className="text-sm text-[#6E6055] mt-2 max-w-3xl leading-relaxed">
          Select your target conference venue (**IEEE**, **ACL**, **ACM**, **Springer LNCS**, or
          **arXiv Preprint**) and exact page count below. Every exported format (**PDF**, **DOCX**,
          **LaTeX**, **HTML**, **Markdown**, **BibTeX**) dynamically applies the venue&apos;s
          layout, typography, citation style, and closed-loop page calibration.
        </p>
      </div>

      {toast && (
        <div className="p-4 rounded-2xl bg-[#EFE6DA] border border-[#C8B29B] text-xs font-semibold text-[#3D281D] flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-[#3D281D] shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Interactive Venue Switcher + Exact Page Count Control */}
      <div className="rounded-3xl bg-white border border-[#E6DDD0] p-6 sm:p-10 space-y-8 shadow-2xs">
        {/* 1. Conference Venue Selector */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <label className="text-xs tracking-wider uppercase text-[#6E6055] font-semibold">
              1. Select Conference Venue Profile (Applies Distinct Layout &amp; Formatting)
            </label>
            <span className="text-xs text-[#3D281D] bg-[#F3ECE2] px-3 py-1 rounded-full font-semibold">
              Active: {currentSpec.fullName}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.values(VENUE_SPECS).map((v) => {
              const active = venue === v.id
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setVenue(v.id)
                    setConstraintReport(null)
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    active
                      ? 'bg-[#3D281D] border-[#3D281D] text-[#FAF7F2] shadow-xs'
                      : 'bg-[#FAF7F2] border-[#E6DDD0] text-[#4A3728] hover:border-[#C8B29B] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-lg font-semibold">{v.name}</span>
                    {active && <span className="w-2 h-2 rounded-full bg-[#EADFD2]" />}
                  </div>
                  <div
                    className={`text-[10px] mt-1 leading-snug ${
                      active ? 'text-[#EADFD2]' : 'text-[#8C7D70]'
                    }`}
                  >
                    {v.columns.split('(')[0].trim()} • {v.citationStyle.split(' ')[0]}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Active Venue Formatting Specification Diff Card */}
          <div className="mt-5 p-5 rounded-2xl bg-[#FAF7F2] border border-[#E6DDD0] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[#8C7D70] block text-[10px] uppercase tracking-wider font-semibold">
                Column &amp; Page Layout
              </span>
              <span className="text-[#261C16] font-medium mt-0.5 block">{currentSpec.columns}</span>
            </div>
            <div>
              <span className="text-[#8C7D70] block text-[10px] uppercase tracking-wider font-semibold">
                Section Heading Format
              </span>
              <span className="text-[#3D281D] font-mono mt-0.5 block">
                {currentSpec.sectionStyle}
              </span>
            </div>
            <div>
              <span className="text-[#8C7D70] block text-[10px] uppercase tracking-wider font-semibold">
                In-Text Citation Style
              </span>
              <span className="text-[#261C16] font-mono mt-0.5 block">
                {currentSpec.citationStyle}
              </span>
            </div>
            <div>
              <span className="text-[#8C7D70] block text-[10px] uppercase tracking-wider font-semibold">
                Author &amp; Blind Review Policy
              </span>
              <span className="text-[#261C16] mt-0.5 block">{currentSpec.blindMode}</span>
            </div>
            <div>
              <span className="text-[#8C7D70] block text-[10px] uppercase tracking-wider font-semibold">
                LaTeX Document Class
              </span>
              <span className="text-[#8C6B4F] font-mono text-[11px] mt-0.5 block">
                {currentSpec.docClass}
              </span>
            </div>
            <div>
              <span className="text-[#8C7D70] block text-[10px] uppercase tracking-wider font-semibold">
                Venue-Specific Elements
              </span>
              <span className="text-[#6E6055] mt-0.5 block">{currentSpec.distinctFeatures}</span>
            </div>
          </div>
        </div>

        {/* 2. Exact Number of Pages Input */}
        <div className="pt-6 border-t border-[#E6DDD0]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <label className="text-xs tracking-wider uppercase text-[#6E6055] font-semibold block">
                2. Target Number of Pages:{' '}
                <span className="text-[#3D281D] font-bold">
                  {effectivePages} {effectivePages === 1 ? 'Page' : 'Pages'}
                </span>
              </label>
              <p className="text-[11px] text-[#8C7D70] mt-0.5">
                Closed-loop calibration scales sections, typography, and spacing to output exactly{' '}
                {effectivePages} {effectivePages === 1 ? 'page' : 'pages'}.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-[#FAF7F2] px-4 py-2 rounded-full border border-[#DFD3C3]">
              <span className="text-xs text-[#6E6055] font-medium">Exact Pages (1–30):</span>
              <input
                type="number"
                min={1}
                max={30}
                value={effectivePages}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10)
                  if (!isNaN(val)) {
                    setTargetPages(val)
                  }
                }}
                className="w-16 px-2.5 py-1 rounded-full bg-white border border-[#C8B29B] text-sm font-bold text-[#3D281D] text-center focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setTargetPages(p)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  effectivePages === p
                    ? 'bg-[#3D281D] text-[#FAF7F2] border-[#3D281D]'
                    : 'bg-[#FAF7F2] text-[#6E6055] border-[#E6DDD0] hover:border-[#C8B29B]'
                }`}
              >
                {p} {p === 1 ? 'Page' : 'Pages'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 px-1">
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={Math.min(20, effectivePages)}
              onChange={(e) => setTargetPages(Number(e.target.value))}
              className="flex-1 h-1.5 bg-[#E6DDD0] rounded-lg appearance-none cursor-pointer accent-[#3D281D]"
            />
            <span className="text-xs font-semibold text-[#3D281D] w-24 text-right">
              {effectivePages} {effectivePages === 1 ? 'Page' : 'Pages'}
            </span>
          </div>
        </div>

        {/* 3. Multi-Format Export Suite */}
        <div className="pt-6 border-t border-[#E6DDD0] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs tracking-wider uppercase text-[#6E6055] font-semibold">
              3. Download Formatted Manuscript ({currentSpec.name} • {effectivePages}{' '}
              {effectivePages === 1 ? 'Page' : 'Pages'})
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleVerifyConstraints}
                disabled={checkingConstraints}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium text-[#3D281D] bg-[#F3ECE2] hover:bg-[#EADFD2] border border-[#E6DDD0] transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#8C6B4F]" />
                <span>{checkingConstraints ? 'Checking...' : 'Verify Venue Constraints'}</span>
              </button>
              <button
                type="button"
                onClick={handleToggleLatexPreview}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium text-[#3D281D] bg-[#F3ECE2] hover:bg-[#EADFD2] border border-[#E6DDD0] transition-colors flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-[#8C6B4F]" />
                <span>
                  {showPreview ? 'Hide LaTeX Template Diff' : 'Preview Venue LaTeX (.tex)'}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* Primary PDF Export */}
            <button
              onClick={() => handleExport('pdf')}
              disabled={loadingFormat !== null}
              className="p-4 rounded-full text-xs font-semibold text-[#FAF7F2] bg-[#3D281D] hover:bg-[#2B1B12] transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Download className="w-4 h-4 shrink-0 text-[#EADFD2]" />
              <span>
                {loadingFormat === 'pdf'
                  ? `Compiling ${currentSpec.name} PDF (${effectivePages}pp)...`
                  : `Download ${currentSpec.name} PDF (${effectivePages} ${
                      effectivePages === 1 ? 'Page' : 'Pages'
                    })`}
              </span>
            </button>

            {/* Primary DOCX Export */}
            <button
              onClick={() => handleExport('docx')}
              disabled={loadingFormat !== null}
              className="p-4 rounded-full text-xs font-semibold text-[#3D281D] bg-[#EADFD2] hover:bg-[#DFD0BE] border border-[#C8B29B] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-[#3D281D] shrink-0" />
              <span>
                {loadingFormat === 'docx'
                  ? `Building ${currentSpec.name} DOCX...`
                  : `Download ${currentSpec.name} Word (.docx, ${effectivePages}pp)`}
              </span>
            </button>

            {/* Venue LaTeX (.tex) Export */}
            <button
              onClick={() => handleExport('tex')}
              disabled={loadingFormat !== null}
              className="p-4 rounded-full text-xs font-medium text-[#261C16] bg-[#FAF7F2] hover:bg-[#F3ECE2] border border-[#E6DDD0] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileCode className="w-4 h-4 text-[#8C6B4F] shrink-0" />
              <span>
                {loadingFormat === 'tex'
                  ? 'Rendering .tex...'
                  : `Export ${currentSpec.name} LaTeX (.tex)`}
              </span>
            </button>

            {/* Styled HTML (.html) Export */}
            <button
              onClick={() => handleExport('html')}
              disabled={loadingFormat !== null}
              className="p-4 rounded-full text-xs font-medium text-[#261C16] bg-[#FAF7F2] hover:bg-[#F3ECE2] border border-[#E6DDD0] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Globe className="w-4 h-4 text-[#8C6B4F] shrink-0" />
              <span>
                {loadingFormat === 'html'
                  ? 'Rendering .html...'
                  : 'Export Styled Web Paper (.html)'}
              </span>
            </button>

            {/* Markdown (.md) Export */}
            <button
              onClick={() => handleExport('md')}
              disabled={loadingFormat !== null}
              className="p-4 rounded-full text-xs font-medium text-[#261C16] bg-[#FAF7F2] hover:bg-[#F3ECE2] border border-[#E6DDD0] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-[#8C6B4F] shrink-0" />
              <span>
                {loadingFormat === 'md'
                  ? 'Rendering .md...'
                  : `Export Markdown (.md, ${effectivePages}pp)`}
              </span>
            </button>

            {/* BibTeX (.bib) Export */}
            <button
              onClick={() => handleExport('bib')}
              disabled={loadingFormat !== null}
              className="p-4 rounded-full text-xs font-medium text-[#261C16] bg-[#FAF7F2] hover:bg-[#F3ECE2] border border-[#E6DDD0] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <BookOpen className="w-4 h-4 text-[#8C6B4F] shrink-0" />
              <span>Download Verified BibTeX (.bib, {refCount} refs)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Venue Constraint Audit Report */}
      {constraintReport && (
        <div className="rounded-3xl bg-[#F3ECE2] border border-[#E6DDD0] p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DFD3C3]">
            <h3 className="font-display text-2xl font-semibold text-[#261C16] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#3D281D]" />
              <span>Venue Compliance Audit: {constraintReport.venue_name}</span>
            </h3>
            <span className="text-xs px-3 py-1 rounded-full font-semibold bg-white text-[#3D281D] border border-[#E6DDD0]">
              {constraintReport.passed
                ? 'Compliant with Venue Guidelines'
                : 'Auto-Calibrated on Export'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-white border border-[#E6DDD0]">
              <div className="text-[11px] text-[#8C7D70]">Draft Words</div>
              <div className="font-display text-2xl font-semibold text-[#261C16] mt-0.5">
                {constraintReport.word_count.toLocaleString()}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#E6DDD0]">
              <div className="text-[11px] text-[#8C7D70]">Abstract Words</div>
              <div className="font-display text-2xl font-semibold text-[#8C6B4F] mt-0.5">
                {constraintReport.abstract_words}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#E6DDD0]">
              <div className="text-[11px] text-[#8C7D70]">Calibrated Output Pages</div>
              <div className="font-display text-2xl font-semibold text-[#3D281D] mt-0.5">
                {effectivePages} {effectivePages === 1 ? 'Page' : 'Pages'}
              </div>
            </div>
          </div>

          {constraintReport.violations.length > 0 && (
            <div className="space-y-2">
              {constraintReport.violations.map((v, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border border-[#DFD3C3] bg-white text-xs text-[#6E6055] flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#8C6B4F]" />
                  <div>
                    <span className="font-mono uppercase text-[10px] font-semibold text-[#3D281D]">
                      [{v.constraint_type}]{' '}
                    </span>
                    <span>
                      {v.message} (Automatically calibrated to {effectivePages} pages during
                      PDF/DOCX compilation.)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Live Venue LaTeX Template Preview */}
      {showPreview && (
        <div className="rounded-3xl bg-white border border-[#E6DDD0] p-6 sm:p-8 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6DDD0]">
            <div>
              <h3 className="font-display text-2xl font-semibold text-[#261C16] flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#8C6B4F]" />
                <span>
                  Live Rendered {currentSpec.name} Jinja2 LaTeX Source ({currentSpec.docClass})
                </span>
              </h3>
              <p className="text-xs text-[#8C7D70] mt-0.5">
                Switch between IEEE, ACL, ACM, LNCS, and Preprint above to inspect the exact
                template differences.
              </p>
            </div>
            <button
              onClick={handleCopyLatexPreview}
              className="px-4 py-1.5 rounded-full text-xs font-medium text-[#3D281D] bg-[#F3ECE2] hover:bg-[#EADFD2] border border-[#E6DDD0] flex items-center gap-1.5"
            >
              {copiedLatex ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#3D281D]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#8C6B4F]" />
                  <span>Copy Full .tex</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E6DDD0] font-mono text-xs text-[#261C16] overflow-x-auto whitespace-pre-wrap max-h-[380px] leading-relaxed">
            {latexPreview || 'Rendering venue LaTeX template...'}
          </pre>
        </div>
      )}

      {/* Paper Metadata Summary Card */}
      <div className="rounded-3xl bg-white border border-[#E6DDD0] p-6 sm:p-10 space-y-6 shadow-2xs">
        <div>
          <div className="text-[10px] tracking-[0.16em] text-[#8C6B4F] uppercase font-semibold mb-1">
            Synthesized Manuscript Title
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-[#261C16] leading-snug">
            {paperTitle}
          </h2>
        </div>

        <div>
          <div className="text-[10px] tracking-[0.16em] text-[#8C6B4F] uppercase font-semibold mb-1.5">
            Abstract
          </div>
          <p className="text-xs text-[#6E6055] leading-relaxed bg-[#FAF7F2] p-5 rounded-2xl border border-[#E6DDD0]">
            {paperAbstract}
          </p>
        </div>

        {/* 5 Metadata Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E6DDD0]">
            <div className="text-[10px] uppercase tracking-wider text-[#8C7D70]">Target Venue</div>
            <div className="font-display text-xl font-semibold text-[#261C16] mt-0.5 uppercase">
              {currentSpec.name}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F3ECE2] border border-[#DFD3C3]">
            <div className="text-[10px] uppercase tracking-wider text-[#8C6B4F] font-semibold">
              Calibrated Pages
            </div>
            <div className="font-display text-xl font-semibold text-[#3D281D] mt-0.5">
              {effectivePages} {effectivePages === 1 ? 'Page' : 'Pages'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E6DDD0]">
            <div className="text-[10px] uppercase tracking-wider text-[#8C7D70]">
              Base Draft Words
            </div>
            <div className="font-display text-xl font-semibold text-[#261C16] mt-0.5">
              {wordCount.toLocaleString()}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E6DDD0]">
            <div className="text-[10px] uppercase tracking-wider text-[#8C7D70]">Sections</div>
            <div className="font-display text-xl font-semibold text-[#261C16] mt-0.5">
              {sectionCount}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F3ECE2] border border-[#DFD3C3]">
            <div className="text-[10px] uppercase tracking-wider text-[#8C6B4F] font-semibold">
              Verified Refs
            </div>
            <div className="font-display text-xl font-semibold text-[#3D281D] mt-0.5">
              {refCount}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
