import React, { useState } from 'react'
import { ArrowRight, Sparkles, Sliders, BookOpen } from 'lucide-react'
import { NavView } from './Sidebar'
import { apiComputeUniqueness, apiDraftFullPaper } from '../api'
import { Paper, TopicUniquenessResponse, PaperDraft } from '../types'

interface ResearchProjectViewProps {
  onNavigate: (view: NavView) => void
  title: string
  setTitle: (t: string) => void
  abstract: string
  setAbstract: (a: string) => void
  userNotes: string
  setUserNotes: (n: string) => void
  venue: string
  setVenue: (v: string) => void
  setPapers: (p: Paper[]) => void
  setUniqueness: (u: TopicUniquenessResponse) => void
  setDraft: (d: PaperDraft) => void
}

const PRESETS = [
  {
    title: 'Transformer Models for Clinical NLP',
    abstract:
      'We examine pre-trained transformer representations adapted for clinical narrative electronic health records, addressing domain terminology and tokenization bottlenecks.',
    notes: 'Compared on MIMIC-III benchmark; evaluates BioBERT and ClinicalBERT baselines.',
    venue: 'acl',
  },
  {
    title: 'Federated Learning in Healthcare Data Privacy',
    abstract:
      'A differential-privacy aware federated optimization framework across hospital silos, maintaining strict patient data confidentiality while achieving centralized AUC parity.',
    notes: 'Non-IID distribution across 5 synthetic hospital nodes; epsilon=1.2 DP guarantee.',
    venue: 'ieee',
  },
  {
    title: 'Zero-Shot Summarization of Clinical Trial Reports',
    abstract:
      'Instruction-tuned parameter-efficient adapters for abstractive summarization of Phase III clinical trial protocol documents without manual target annotations.',
    notes: 'Evaluated against ROUGE-L and expert human rubrics.',
    venue: 'acm',
  },
]

export const ResearchProjectView: React.FC<ResearchProjectViewProps> = ({
  onNavigate,
  title,
  setTitle,
  abstract,
  setAbstract,
  userNotes,
  setUserNotes,
  venue,
  setVenue,
  setPapers,
  setUniqueness,
  setDraft,
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLaunchWorkflow = async () => {
    if (!title.trim() || !abstract.trim()) {
      setError('Please provide paper title and research scope/abstract.')
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

      // 2. Run Section Drafting (Agent 4)
      const dRes = await apiDraftFullPaper({
        title,
        abstract,
        venue,
        user_notes: userNotes,
        retrieved_papers: uRes.recommended_papers,
      })
      setDraft(dRes)

      // Navigate to Agent Status view to show completed pipeline!
      onNavigate('agent-status')
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
    setError(null)
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans">
      {/* Header */}
      <div>
        <div className="text-[11px] font-mono tracking-widest text-[#2563eb] font-semibold uppercase mb-1.5">
          Stage 1 — Project Configuration
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-slate-900 tracking-tight">
          Research Project Setup
        </h1>
        <p className="text-sm text-slate-500 mt-2 max-w-3xl leading-relaxed">
          Define your research question, preliminary notes, and target conference format to launch the
          autonomous multi-agent pipeline.
        </p>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-slate-400 mr-2 uppercase">Presets:</span>
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => applyPreset(p)}
            className="px-3 py-1 rounded-lg bg-white border border-[#e2e8f0] text-xs font-medium text-slate-700 hover:border-[#2563eb] hover:text-[#2563eb] transition-colors shadow-2xs"
          >
            {p.title}
          </button>
        ))}
      </div>

      {/* Main Form Box */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 sm:p-8 space-y-6 shadow-xs">
        <div>
          <label className="block text-xs font-mono tracking-wider uppercase text-slate-500 font-semibold mb-2">
            Paper Title / Research Scope *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Robust Contrastive Decoding for Hallucination Reduction in LLMs"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-slate-900 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-mono tracking-wider uppercase text-slate-500 font-semibold mb-2">
            Abstract / Topic Description *
          </label>
          <textarea
            rows={4}
            required
            placeholder="Describe the research problem, proposed methodology, benchmark datasets, and expected findings..."
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-slate-900 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-mono tracking-wider uppercase text-slate-500 font-semibold mb-2">
            Researcher Experimental Notes (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="Key numbers, ablation results, baseline models, hyperparameters, or specific citations to ground..."
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-slate-900 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all resize-none"
          />
        </div>

        {/* Venue Profile Selection */}
        <div>
          <label className="block text-xs font-mono tracking-wider uppercase text-slate-500 font-semibold mb-2">
            Target Conference Venue Format
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { id: 'ieee', name: 'IEEE', desc: 'Two-column, 6-8pp' },
              { id: 'acl', name: 'ACL', desc: 'Anonymized, 8pp' },
              { id: 'acm', name: 'ACM', desc: 'acmart sigconf' },
              { id: 'lncs', name: 'LNCS', desc: 'Springer llncs' },
              { id: 'generic', name: 'Plain', desc: 'Standard tech report' },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVenue(v.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  venue === v.id
                    ? 'border-[#2563eb] bg-blue-50/50 text-[#0f1f3d]'
                    : 'border-[#e2e8f0] bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="font-semibold text-xs">{v.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{v.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        <button
          onClick={handleLaunchWorkflow}
          disabled={loading}
          className="w-full py-3 rounded-lg font-semibold text-xs text-white bg-[#0f1f3d] hover:bg-[#162a52] transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Coordinating Multi-Agent Pipeline...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Launch Literature Search & Paper Synthesis Pipeline</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
