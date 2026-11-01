import React, { useState } from 'react'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { NavView } from './Sidebar'
import { apiComputeUniqueness, apiDraftFullPaper, apiSaveProject } from '../api'
import { Paper, TopicUniquenessResponse, PaperDraft } from '../types'

interface ResearchProjectViewProps {
  onNavigate: (view: NavView) => void
  projectId: string | null
  title: string
  setTitle: (t: string) => void
  abstract: string
  setAbstract: (a: string) => void
  userNotes: string
  setUserNotes: (n: string) => void
  venue: string
  setVenue: (v: string) => void
  targetPages?: number
  setTargetPages?: (p: number) => void
  setPapers: (p: Paper[]) => void
  setUniqueness: (u: TopicUniquenessResponse) => void
  setDraft: (d: PaperDraft) => void
  onProjectSaved?: (id: string) => void
}

const PRESETS = [
  {
    title: 'Quantum Neural Networks for Molecular Docking',
    abstract:
      'We formulate parameterized quantum circuits for predicting non-covalent binding affinity and molecular docking conformations, evaluating variational ansatz architectures against classical baselines on the ChEMBL benchmark.',
    notes: 'Grounding in variational eigensolvers; evaluates binding energy and RMSD.',
    venue: 'ieee',
    pages: 6,
  },
  {
    title: 'Transformer Models for Clinical NLP and EHR Summarization',
    abstract:
      'We examine pre-trained transformer representations adapted for clinical narrative electronic health records, addressing domain terminology and tokenization bottlenecks.',
    notes: 'Compared on MIMIC-III benchmark; evaluates BioBERT and ClinicalBERT baselines.',
    venue: 'acl',
    pages: 8,
  },
  {
    title: 'Differential Privacy in Federated Healthcare Optimization',
    abstract:
      'A differential-privacy aware federated optimization framework across hospital silos, maintaining strict patient data confidentiality while achieving centralized AUC parity.',
    notes: 'Non-IID distribution across 5 synthetic hospital nodes; epsilon=1.2 DP guarantee.',
    venue: 'acm',
    pages: 6,
  },
]

export const ResearchProjectView: React.FC<ResearchProjectViewProps> = ({
  onNavigate,
  projectId,
  title,
  setTitle,
  abstract,
  setAbstract,
  userNotes,
  setUserNotes,
  venue,
  setVenue,
  targetPages: propTargetPages,
  setTargetPages: propSetTargetPages,
  setPapers,
  setUniqueness,
  setDraft,
  onProjectSaved,
}) => {
  const [localTargetPages, setLocalTargetPages] = useState<number>(6)
  const targetPages = propTargetPages ?? localTargetPages
  const setTargetPages = propSetTargetPages ?? setLocalTargetPages
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLaunchWorkflow = async () => {
    if (!title.trim() || !abstract.trim()) {
      setError('Please provide your paper title and research scope/abstract.')
      return
    }
    setError(null)
    setLoading(true)

    try {
      // 1. Run Uniqueness & Literature Retrieval (Agents 1 & 2)
      const uRes = await apiComputeUniqueness({
        title,
        abstract,
        user_notes: userNotes,
        overlap_threshold: 0.75,
      })
      setUniqueness(uRes)
      setPapers(uRes.recommended_papers)

      // 2. Run Section Drafting (Agent 4) scaled to user-selected page length
      const dRes = await apiDraftFullPaper({
        title,
        abstract,
        venue,
        user_notes: userNotes,
        retrieved_papers: uRes.recommended_papers,
        target_pages: targetPages,
      })
      setDraft(dRes)

      // 3. Save project to SQLite DB
      try {
        const saved = await apiSaveProject({
          id: projectId || undefined,
          title,
          abstract,
          user_notes: userNotes,
          venue,
          uniqueness: uRes,
          draft: dRes,
          papers: uRes.recommended_papers,
        })
        if (onProjectSaved) {
          onProjectSaved(saved.id)
        }
      } catch (saveErr) {
        console.warn('Auto-save error:', saveErr)
      }

      onNavigate('workspace')
    } catch (err: any) {
      setError(err.message || 'Pipeline execution failed.')
    } finally {
      setLoading(false)
    }
  }

  const applyPreset = (p: (typeof PRESETS)[0]) => {
    setTitle(p.title)
    setAbstract(p.abstract)
    setUserNotes(p.notes)
    setVenue(p.venue)
    setTargetPages(p.pages)
    setError(null)
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans">
      {/* Editorial Header */}
      <div className="border-b border-[#E6DDD0] pb-6">
        <div className="text-[11px] tracking-[0.18em] text-[#8C6B4F] font-semibold uppercase mb-1.5">
          Manuscript Scope &amp; Parameters
        </div>
        <h1 className="text-3xl sm:text-5xl font-display font-normal text-[#261C16] tracking-tight">
          Research Project Setup
        </h1>
        <p className="text-sm text-[#6E6055] mt-2 max-w-3xl leading-relaxed">
          Define your research inquiry, preliminary experimental notes, exact page length (1–30
          pages), and target conference venue to initiate literature synthesis.
        </p>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[#8C7D70] mr-1 font-medium">Sample Topics:</span>
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => applyPreset(p)}
            className="px-4 py-1.5 rounded-full bg-[#F3ECE2] hover:bg-[#EADFD2] border border-[#E6DDD0] text-xs font-medium text-[#4A3728] transition-colors"
          >
            {p.title}
          </button>
        ))}
      </div>

      {/* Main Form Box */}
      <div className="rounded-3xl bg-white border border-[#E6DDD0] p-6 sm:p-10 space-y-7 shadow-2xs">
        <div>
          <label className="block text-xs tracking-wider uppercase text-[#6E6055] font-semibold mb-2">
            Paper Title / Research Scope *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Robust Contrastive Decoding for Hallucination Reduction in LLMs"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-[#FAF7F2] border border-[#E6DDD0] text-sm text-[#261C16] placeholder-[#8C7D70] focus:outline-none focus:border-[#8C6B4F] focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-xs tracking-wider uppercase text-[#6E6055] font-semibold mb-2">
            Abstract / Topic Description *
          </label>
          <textarea
            rows={4}
            required
            placeholder="Describe the research problem, proposed methodology, benchmark datasets, and expected findings..."
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-[#FAF7F2] border border-[#E6DDD0] text-sm text-[#261C16] placeholder-[#8C7D70] focus:outline-none focus:border-[#8C6B4F] focus:bg-white transition-all resize-none"
          />
        </div>

        <div>
          <label className="block text-xs tracking-wider uppercase text-[#6E6055] font-semibold mb-2">
            Researcher Experimental Notes (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="Key numbers, ablation results, baseline models, hyperparameters, or specific citations to ground..."
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-[#FAF7F2] border border-[#E6DDD0] text-sm text-[#261C16] placeholder-[#8C7D70] focus:outline-none focus:border-[#8C6B4F] focus:bg-white transition-all resize-none"
          />
        </div>

        {/* Target Page Length Selector */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF7F2] border border-[#E6DDD0] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <label className="text-xs tracking-wider uppercase text-[#6E6055] font-semibold block">
                Target Manuscript Length:{' '}
                <span className="text-[#3D281D] font-bold">
                  {targetPages} {targetPages === 1 ? 'Page' : 'Pages'}
                </span>{' '}
                (~{(targetPages * 680).toLocaleString()} words)
              </label>
              <p className="text-[11px] text-[#8C7D70] mt-0.5">
                Both the writing engine and formatting compiler calibrate content density to match
                this exact page count.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-[#DFD3C3]">
              <span className="text-xs text-[#6E6055]">Exact Pages (1–30):</span>
              <input
                type="number"
                min={1}
                max={30}
                value={targetPages}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10)
                  if (!isNaN(val)) {
                    setTargetPages(Math.max(1, Math.min(30, val)))
                  }
                }}
                className="w-16 px-2 py-0.5 rounded-full bg-[#F3ECE2] text-xs font-bold text-[#3D281D] text-center focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
            {[
              { pages: 2, label: '2 Pages', sub: 'Extended Abstract' },
              { pages: 4, label: '4 Pages', sub: 'Workshop / Short' },
              { pages: 6, label: '6 Pages', sub: 'IEEE Standard' },
              { pages: 8, label: '8 Pages', sub: 'ACL / Full Paper' },
              { pages: 10, label: '10 Pages', sub: 'ACM / Extended' },
              { pages: 12, label: '12 Pages', sub: 'LNCS / Monograph' },
            ].map((p) => (
              <button
                key={p.pages}
                type="button"
                onClick={() => setTargetPages(p.pages)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  targetPages === p.pages
                    ? 'border-[#3D281D] bg-[#3D281D] text-[#FAF7F2]'
                    : 'border-[#E6DDD0] bg-white text-[#4A3728] hover:border-[#C8B29B]'
                }`}
              >
                <div className="font-semibold text-xs">{p.label}</div>
                <div
                  className={`text-[10px] mt-0.5 ${
                    targetPages === p.pages ? 'text-[#EADFD2]' : 'text-[#8C7D70]'
                  }`}
                >
                  {p.sub}
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 px-1">
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={Math.min(20, targetPages)}
              onChange={(e) => setTargetPages(Number(e.target.value))}
              className="flex-1 h-1.5 bg-[#E6DDD0] rounded-lg appearance-none cursor-pointer accent-[#3D281D]"
            />
            <span className="text-xs font-semibold text-[#3D281D] w-20 text-right">
              {targetPages} {targetPages === 1 ? 'Page' : 'Pages'}
            </span>
          </div>
        </div>

        {/* Venue Profile Selection */}
        <div>
          <label className="block text-xs tracking-wider uppercase text-[#6E6055] font-semibold mb-3">
            Target Conference Venue Format (Applies Distinct Layout, Typography &amp; Citations)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { id: 'ieee', name: 'IEEE', desc: '2-Col • Roman I, II • [1]' },
              { id: 'acl', name: 'ACL', desc: '2-Col • Anon + Line# • (Author, Yr)' },
              { id: 'acm', name: 'ACM', desc: '2-Col • sigconf • CCS + Rights' },
              { id: 'lncs', name: 'Springer LNCS', desc: '1-Col • Wide Margin • Book' },
              { id: 'generic', name: 'arXiv Preprint', desc: '1-Col • Rule Banner • Report' },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVenue(v.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  venue === v.id
                    ? 'border-[#3D281D] bg-[#3D281D] text-[#FAF7F2] shadow-2xs'
                    : 'border-[#E6DDD0] bg-[#FAF7F2] text-[#4A3728] hover:border-[#C8B29B] hover:bg-white'
                }`}
              >
                <div className="font-display text-base font-semibold">{v.name}</div>
                <div
                  className={`text-[10px] mt-0.5 leading-snug ${
                    venue === v.id ? 'text-[#EADFD2]' : 'text-[#8C7D70]'
                  }`}
                >
                  {v.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {error}
          </div>
        )}

        <div className="pt-2 flex items-center gap-2">
          <button
            onClick={handleLaunchWorkflow}
            disabled={loading}
            className="flex-1 py-4 px-6 rounded-full font-semibold text-xs text-[#FAF7F2] bg-[#3D281D] hover:bg-[#2B1B12] transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-[#FAF7F2]/30 border-t-[#FAF7F2] rounded-full animate-spin" />
                <span>Synthesizing {targetPages}-Page Manuscript &amp; Verifying Citations...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#EADFD2]" />
                <span>
                  Retrieve Literature &amp; Synthesize {targetPages}-Page {venue.toUpperCase()}{' '}
                  Manuscript
                </span>
              </>
            )}
          </button>
          <button
            onClick={handleLaunchWorkflow}
            disabled={loading}
            aria-label="Launch Synthesis"
            className="w-12 h-12 rounded-full bg-[#EADFD2] hover:bg-[#DFD0BE] text-[#3D281D] flex items-center justify-center transition-colors shrink-0 disabled:opacity-50"
          >
            <ArrowUpRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
