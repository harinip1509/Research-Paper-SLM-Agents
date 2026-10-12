import React, { useState } from 'react'
import {
  Sparkles,
  ShieldCheck,
  FileText,
  Search,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Cpu,
  Zap,
  Layers,
  Award,
  ExternalLink,
  Code2,
  BookOpen,
  Sliders,
  AlertTriangle,
} from 'lucide-react'
import { apiComputeUniqueness } from '../api'
import { TopicUniquenessResponse } from '../types'

interface LandingPageProps {
  onStart: () => void
  onOpenAuth: (mode: 'login' | 'signup') => void
}

const PRESETS = [
  {
    name: 'Attention Transformer (High Overlap)',
    title: 'Attention Is All You Need',
    abstract:
      'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on WMT 2014 English-to-German translation achieve 28.4 BLEU.',
  },
  {
    name: 'Quantum BioNLP (Novel Topic)',
    title: 'Quantum-Assisted Graph Transformers for Single-Cell Ribosome Sequencing',
    abstract:
      'We present RibosomeQ, a hybrid quantum-classical graph attention model that simulates ribosomal translation kinetics on single-cell mRNA transcripts, overcoming classical NP-hard protein folding constraints.',
  },
  {
    name: 'Audio Contrastive (Moderate)',
    title: 'Masked Acoustic Autoencoding for Self-Supervised Audio Representations',
    abstract:
      'We explore masked patch autoencoders for audio spectrogram representations. We mask random patches of input spectrograms and reconstruct the missing frequencies using a transformer encoder.',
  },
]

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onOpenAuth }) => {
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
    <div className="relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-500/15 via-violet-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[800px] left-1/4 w-[600px] h-[400px] bg-cyan-500/10 blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16 text-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Multi-Agent Conference Assistant • Zero Hallucinations Guarantee</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Write Conference-Ready Papers with{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Empirical Rigor
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          ScholarForge calculates your <strong>Topic Uniqueness score (0–100)</strong>, grounds claims in
          verified Semantic Scholar literature, and deterministically formats camera-ready drafts for
          IEEE, ACL, ACM, and Springer LNCS.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onStart}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
          >
            <span>Launch Research Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="#uniqueness"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-medium text-slate-200 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Try Uniqueness Engine</span>
          </a>
        </div>

        {/* Value Highlights */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="text-xl font-bold text-white flex items-center gap-2">
              <span>0–100</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xs text-slate-400 mt-1">Topic Uniqueness score & calibrated rating</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="text-xl font-bold text-white flex items-center gap-2">
              <span>200M+</span>
              <BookOpen className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xs text-slate-400 mt-1">Semantic Scholar verified citations & DOIs</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="text-xl font-bold text-white flex items-center gap-2">
              <span>7 Agents</span>
              <Cpu className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xs text-slate-400 mt-1">Specialized decompose, write, and review pipeline</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="text-xl font-bold text-white flex items-center gap-2">
              <span>5 Formats</span>
              <FileText className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xs text-slate-400 mt-1">Deterministic LaTeX Jinja2 templates (IEEE/ACL)</div>
          </div>
        </div>
      </section>

      {/* Interactive Uniqueness Engine Hero Demo */}
      <section id="uniqueness" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-10 shadow-2xl backdrop-blur-md">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Agent 1: Topic Uniqueness Engine
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
              Test Uniqueness & Overlap in Real Time
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Using BGE-small dense embeddings, local FAISS vector corpus, Semantic Scholar Graph API,
              and RINoBench isotonic calibration.
            </p>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => applyPreset(idx)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedPreset === idx
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Paper Title / Working Headline
                </label>
                <input
                  type="text"
                  value={demoTitle}
                  onChange={(e) => setDemoTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Abstract / Proposed Methodology
                </label>
                <textarea
                  rows={4}
                  value={demoAbstract}
                  onChange={(e) => setDemoAbstract(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              <button
                onClick={handleRunDemo}
                disabled={demoLoading}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {demoLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Computing Vector Overlap...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Analyze Topic Uniqueness</span>
                  </>
                )}
              </button>

              {demoError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                  {demoError}
                </div>
              )}
            </div>

            {/* Results Preview Box */}
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between min-h-[340px]">
              {demoResult ? (
                <div className="space-y-5">
                  {/* Score Top Banner */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">Uniqueness Score</div>
                      <div className="text-3xl font-extrabold text-white flex items-baseline gap-2">
                        <span>{demoResult.uniqueness_score.toFixed(1)}</span>
                        <span className="text-sm font-normal text-slate-500">/ 100</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400">Calibrated RINoBench Novelty</div>
                      <div className="text-lg font-bold text-amber-400">
                        {'★'.repeat(Math.round(demoResult.calibrated_novelty_rating))}
                        <span className="text-xs text-slate-500 ml-1.5">
                          ({demoResult.calibrated_novelty_rating.toFixed(2)} / 5)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Overlap Meter */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                      <span>Literature Overlap: {(demoResult.overlap_meter.raw_overlap * 100).toFixed(1)}%</span>
                      <span
                        className={`font-semibold ${
                          demoResult.overlap_meter.is_high_overlap ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {demoResult.overlap_meter.status}
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden relative">
                      <div
                        className={`h-full transition-all duration-500 ${
                          demoResult.overlap_meter.is_high_overlap ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(demoResult.overlap_meter.raw_overlap * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Top Related Literature */}
                  <div>
                    <div className="text-xs font-semibold text-slate-300 mb-2">
                      Closest Retrieved Literature ({demoResult.recommended_papers.length} papers):
                    </div>
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {demoResult.recommended_papers.slice(0, 3).map((p, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs"
                        >
                          <div className="font-medium text-slate-200 truncate">{p.title}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{p.venue || 'ArXiv'} {p.year || ''}</span>
                            <span>•</span>
                            <span>{p.citation_count || 0} citations</span>
                          </div>
                          {p.grounded_reason && (
                            <div className="text-[11px] text-indigo-300 mt-1 italic">
                              Overlap reason: {p.grounded_reason}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coverage Caveat */}
                  <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{demoResult.coverage_caveat}</span>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-500">
                  <Sliders className="w-10 h-10 text-slate-700 mb-3" />
                  <p className="text-sm font-medium text-slate-400">
                    Click "Analyze Topic Uniqueness" to inspect live score
                  </p>
                  <p className="text-xs text-slate-600 mt-1 max-w-xs">
                    Evaluates semantic overlap against Semantic Scholar and local FAISS vector embeddings
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 7 Specialized Agents Grid */}
      <section id="agents" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            Modular Intelligence
          </span>
          <h2 className="text-3xl font-bold text-white mt-2">The Seven Specialized Agents</h2>
          <p className="text-sm text-slate-400 mt-2">
            Each agent handles a specific scientific workflow with verifiable, reproducible outputs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Agent 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">1. Topic Uniqueness Agent</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Calculates 0–100 novelty score using BGE-small embeddings, local FAISS vector search, S2 Graph API,
              and RINoBench isotonic regression calibration.
            </p>
          </div>

          {/* Agent 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">2. Literature Agent</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Extracts core research problem, method, dataset, results, and limitations into structured JSON.
              Trained on ACLSum gold aspect summaries with Groq fallback.
            </p>
          </div>

          {/* Agent 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">3. Planning Agent</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Decompose-then-plan pipeline: first extracts requirements from researcher goals, then plans
              against that checklist (+0.13 rubric gain over flat baseline).
            </p>
          </div>

          {/* Agent 4 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">4. Writing Agent</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Two-stage pipeline: section by section, outputs structured JSON intermediate representation, then
              generates grounded academic LaTeX draft.
            </p>
          </div>

          {/* Agent 5 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">5. Review Agent</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Rubric-based critique on novelty, clarity, soundness, and missing related work, explicitly
              labeled as "automated suggestion, not an official peer review verdict".
            </p>
          </div>

          {/* Agent 6 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">6. Similarity & Citation Agent</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Performs sentence-level cosine overlap checks against retrieved abstracts, verifies citation keys
              against Semantic Scholar, and outputs verified BibTeX.
            </p>
          </div>
        </div>
      </section>

      {/* Benchmarks Section */}
      <section id="benchmarks" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-8 sm:p-12">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              100% Reproducible Research
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
              Empirical Benchmarks & Ablations
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              All metrics generated from standalone experiment scripts in /experiments with 95% bootstrap confidence intervals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <div className="text-2xl font-extrabold text-cyan-400">0.656</div>
              <div className="text-xs font-medium text-slate-300 mt-1">LitSearch Recall@20</div>
              <div className="text-[11px] text-slate-500 mt-2">
                Off-the-shelf BGE-small retriever [95% CI: 0.444–0.889]
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <div className="text-2xl font-extrabold text-indigo-400">0.8038</div>
              <div className="text-xs font-medium text-slate-300 mt-1">RINoBench Spearman ρ</div>
              <div className="text-[11px] text-slate-500 mt-2">
                Isotonic calibration reduces MSE by 76.19%
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <div className="text-2xl font-extrabold text-emerald-400">+0.13</div>
              <div className="text-xs font-medium text-slate-300 mt-1">Decompose-then-Plan Gain</div>
              <div className="text-[11px] text-slate-500 mt-2">
                Rubric score: 4.23 vs 4.10 [95% CI: 0.05–0.21, p=0.002]
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <div className="text-2xl font-extrabold text-violet-400">5.17 ms</div>
              <div className="text-xs font-medium text-slate-300 mt-1">Warm Query Latency</div>
              <div className="text-[11px] text-slate-500 mt-2">
                SQLite disk cache + FAISS in-memory index
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Venues Showcase */}
      <section id="venues" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
          Format Compliance
        </span>
        <h2 className="text-3xl font-bold text-white mt-2">Supported Conference Venues</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
          Deterministic Jinja2 LaTeX templates with constraints checking, word limits, and AI-use disclosures.
        </p>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
          {['IEEE Conference', 'ACL Anthology', 'ACM SIGCONF', 'Springer LNCS', 'Generic Preprint'].map(
            (v, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center hover:border-indigo-500/50 transition-colors"
              >
                <FileText className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                <div className="text-xs font-semibold text-slate-200">{v}</div>
                <div className="text-[10px] text-slate-500 mt-1">PDF & DOCX export</div>
              </div>
            )
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-950/60 via-violet-950/40 to-slate-950 border border-indigo-500/20 p-10 sm:p-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Ready to craft your next conference paper?
          </h2>
          <p className="text-sm text-slate-300 mt-3 max-w-xl mx-auto">
            Try ScholarForge now with built-in academic presets or sign in to save your drafts and venue exports.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onStart}
              className="px-6 py-3.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <span>Open Research Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-6 py-3.5 rounded-xl font-medium text-sm text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              Create Free Account
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
