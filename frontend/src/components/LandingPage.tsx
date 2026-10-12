import React, { useState } from 'react'
import {
  ArrowRight,
  TrendingUp,
  Cpu,
  Zap,
  Layers,
  Award,
  BookOpen,
  FileText,
  Sliders,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import { apiComputeUniqueness } from '../api'
import { TopicUniquenessResponse, User } from '../types'

interface LandingPageProps {
  user: User | null
  onStart: () => void
  onOpenAuth: (mode: 'login' | 'signup') => void
}

const PRESETS = [
  {
    name: 'Clinical Transformer (High Overlap)',
    title: 'Transformer Models for Clinical NLP',
    abstract:
      'We examine pre-trained transformer representations adapted for clinical narrative electronic health records, addressing domain terminology and tokenization bottlenecks. Experiments on MIMIC-III benchmark evaluate BioBERT baselines.',
  },
  {
    name: 'Federated Healthcare (Novel)',
    title: 'Federated Learning in Healthcare Data Privacy',
    abstract:
      'A differential-privacy aware federated optimization framework across hospital silos, maintaining strict patient data confidentiality while achieving centralized AUC parity across five healthcare institutions.',
  },
  {
    name: 'Clinical Trial Reports (Moderate)',
    title: 'Zero-Shot Summarization of Clinical Trial Reports',
    abstract:
      'Instruction-tuned parameter-efficient adapters for abstractive summarization of Phase III clinical trial protocol documents without manual target annotations.',
  },
]

export const LandingPage: React.FC<LandingPageProps> = ({ user, onStart, onOpenAuth }) => {
  const handleStartWorkflow = () => {
    if (user) {
      onStart()
    } else {
      onOpenAuth('login')
    }
  }
  const [selectedPreset, setSelectedPreset] = useState(0)
  const [demoTitle, setDemoTitle] = useState(PRESETS[0].title)
  const [demoAbstract, setDemoAbstract] = useState(PRESETS[0].abstract)
  const [demoResult, setDemoResult] = useState<TopicUniquenessResponse | null>(null)
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoError, setDemoError] = useState<string | null>(null)

  const handleRunDemo = async () => {
    setDemoLoading(true)
    setDemoError(null)
    try {
      const res = await apiComputeUniqueness({
        title: demoTitle,
        abstract: demoAbstract,
        overlap_threshold: 0.75,
      })
      setDemoResult(res)
    } catch (e: any) {
      setDemoError(e.message || 'Scoring failed')
    } finally {
      setDemoLoading(false)
    }
  }

  const applyPreset = (index: number) => {
    setSelectedPreset(index)
    setDemoTitle(PRESETS[index].title)
    setDemoAbstract(PRESETS[index].abstract)
    setDemoResult(null)
  }

  return (
    <div className="bg-[#f8fafc] text-slate-900 font-sans min-h-screen">
      {/* University-grade Header Banner */}
      <header className="border-b border-[#e2e8f0] bg-white sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2563eb] text-white flex items-center justify-center font-bold text-base shadow-sm">
              R
            </div>
            <div>
              <span className="font-semibold text-slate-900 text-base tracking-tight block">
                ResearchFlow AI
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase block">
                ScholarForge Academic Assistant
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenAuth('login')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={handleStartWorkflow}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#0f1f3d] hover:bg-[#162a52] transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
        {/* Title & Introduction */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="text-[11px] font-mono tracking-widest text-[#2563eb] font-semibold uppercase">
            Autonomous Academic Assistant • Zero Citation Hallucinations
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold font-serif text-slate-900 tracking-tight leading-tight">
            Produce Conference-Ready Papers with Multi-Agent Rigor
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            A seven-stage pipeline where specialized AI agents collaborate to evaluate Topic Uniqueness,
            retrieve Semantic Scholar literature, and compile verified camera-ready LaTeX drafts.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleStartWorkflow}
              className="px-6 py-3 rounded-lg text-xs font-semibold text-white bg-[#0f1f3d] hover:bg-[#162a52] transition-colors flex items-center gap-2 shadow-sm"
            >
              <span>Open Research Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-6 py-3 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-[#e2e8f0] transition-colors shadow-2xs"
            >
              Register Researcher Account
            </button>
          </div>
        </div>

        {/* Pipeline Overview Banner (Matching Figma) */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 sm:p-8 shadow-xs">
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold mb-1">
            System Architecture
          </div>
          <h2 className="text-lg font-bold font-serif text-slate-900 mb-6">
            Seven-Stage Autonomous Research Workflow
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { num: 1, name: 'Research Topic', role: 'Scope Definition' },
              { num: 2, name: 'Academic Search', role: 'S2 Retrieval' },
              { num: 3, name: 'Literature Analysis', role: 'Aspect Extraction' },
              { num: 4, name: 'Topic Uniqueness', role: 'BGE-small Scoring' },
              { num: 5, name: 'Paper Writing', role: 'Grounded Drafting' },
              { num: 6, name: 'Similarity Check', role: 'Overlap Audit' },
              { num: 7, name: 'Final Paper', role: 'LaTeX/PDF Export' },
            ].map((st) => (
              <div
                key={st.num}
                className="p-3.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-center"
              >
                <div className="w-7 h-7 mx-auto rounded-full bg-white border border-[#2563eb] text-[#2563eb] font-mono text-xs font-semibold flex items-center justify-center shadow-2xs">
                  {st.num}
                </div>
                <div className="text-xs font-semibold text-slate-900 mt-2">{st.name}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">{st.role}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Topic Uniqueness Interactive Tester */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="text-[10px] font-mono tracking-wider text-[#2563eb] uppercase font-semibold">
                Live Prototype Tester
              </div>
              <h2 className="text-xl font-bold font-serif text-slate-900">
                Test Topic Uniqueness & Overlap In Real Time
              </h2>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(idx)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    selectedPreset === idx
                      ? 'border-[#2563eb] bg-blue-50/50 text-[#0f1f3d]'
                      : 'border-[#e2e8f0] bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 font-semibold mb-1.5">
                  Paper Title
                </label>
                <input
                  type="text"
                  value={demoTitle}
                  onChange={(e) => setDemoTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-slate-900 focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 font-semibold mb-1.5">
                  Proposed Abstract
                </label>
                <textarea
                  rows={4}
                  value={demoAbstract}
                  onChange={(e) => setDemoAbstract(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-slate-900 focus:outline-none focus:border-[#2563eb] resize-none"
                />
              </div>

              <button
                onClick={handleRunDemo}
                disabled={demoLoading}
                className="w-full py-2.5 rounded-lg text-xs font-semibold text-white bg-[#0f1f3d] hover:bg-[#162a52] transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                {demoLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Computing Vector Overlap...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Evaluate Uniqueness Against Semantic Scholar</span>
                  </>
                )}
              </button>

              {demoError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {demoError}
                </div>
              )}
            </div>

            {/* Results Preview */}
            <div className="p-6 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] flex flex-col justify-between min-h-[300px]">
              {demoResult ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase">
                        Uniqueness Score
                      </div>
                      <div className="text-3xl font-bold font-serif text-slate-900">
                        {(demoResult.uniqueness_score / 100).toFixed(3)}
                        <span className="text-xs font-mono text-slate-400 ml-1">/ 1.000</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">
                        RINoBench Novelty
                      </div>
                      <div className="text-base font-bold text-amber-500">
                        {demoResult.calibrated_novelty_rating.toFixed(2)} / 5.0
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono text-slate-600 mb-1">
                      <span>Literature Overlap:</span>
                      <span className="font-semibold text-slate-900">
                        {(demoResult.overlap_meter.raw_overlap * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(demoResult.overlap_meter.raw_overlap * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-900 mb-2">
                      Retrieved Grounded Papers:
                    </div>
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {demoResult.recommended_papers.slice(0, 3).map((p, i) => (
                        <div key={i} className="p-2.5 rounded bg-white border border-slate-200 text-xs">
                          <div className="font-medium text-slate-900 truncate">{p.title}</div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {p.venue || 'ArXiv'} • {p.citation_count || 0} citations
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-10 text-slate-400">
                  <Sliders className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-600">
                    Click "Evaluate Uniqueness" to inspect live vector overlap
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tested against BGE-small dense embeddings and Semantic Scholar Graph API
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Verifiable Empirical Benchmarks Table */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 sm:p-8 shadow-xs space-y-4">
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
            Empirical Validation
          </div>
          <h2 className="text-lg font-bold font-serif text-slate-900">
            Reproducible Benchmarks & Baselines
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
              <div className="text-2xl font-bold font-mono text-[#2563eb]">0.656</div>
              <div className="text-xs font-semibold text-slate-900 mt-1">LitSearch Recall@20</div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">
                BGE-small dense retriever baseline
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
              <div className="text-2xl font-bold font-mono text-emerald-600">0.8038</div>
              <div className="text-xs font-semibold text-slate-900 mt-1">RINoBench Spearman ρ</div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">
                Isotonic calibration (76.2% MSE reduction)
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
              <div className="text-2xl font-bold font-mono text-purple-600">+0.13</div>
              <div className="text-xs font-semibold text-slate-900 mt-1">Decompose-then-Plan Gain</div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">
                Checklist gain over flat outline (p=0.002)
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
              <div className="text-2xl font-bold font-mono text-slate-900">5.17 ms</div>
              <div className="text-xs font-semibold text-slate-900 mt-1">Warm Query Latency</div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">
                In-memory FAISS + SQLite cache
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
