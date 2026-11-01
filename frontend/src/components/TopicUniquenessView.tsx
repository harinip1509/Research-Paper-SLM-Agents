import React, { useState } from 'react'
import {
  Sliders,
  Zap,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { apiComputeUniqueness } from '../api'
import { TopicUniquenessResponse, Paper } from '../types'

interface TopicUniquenessViewProps {
  title: string
  setTitle: (t: string) => void
  abstract: string
  setAbstract: (a: string) => void
  userNotes: string
  setUserNotes: (n: string) => void
  onProceedToPlanning: (papers: Paper[]) => void
}

const PRESETS = [
  {
    name: 'Attention Transformer (High Overlap)',
    title: 'Attention Is All You Need',
    abstract:
      'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on WMT 2014 English-to-German translation achieve 28.4 BLEU.',
    notes: 'Comparison against seq2seq LSTM baselines with Bahdanau attention.',
  },
  {
    name: 'Quantum BioNLP (Novel Topic)',
    title: 'Quantum-Assisted Graph Transformers for Single-Cell Ribosome Sequencing',
    abstract:
      'We present RibosomeQ, a hybrid quantum-classical graph attention model that simulates ribosomal translation kinetics on single-cell mRNA transcripts, overcoming classical NP-hard protein folding constraints.',
    notes: 'Novel combination of QAOA quantum circuits and sparse graph attention for codon bias.',
  },
  {
    name: 'Audio Contrastive (Moderate Overlap)',
    title: 'Masked Acoustic Autoencoding for Self-Supervised Audio Representations',
    abstract:
      'We explore masked patch autoencoders for audio spectrogram representations. We mask random patches of input spectrograms and reconstruct the missing frequencies using a transformer encoder.',
    notes: 'Evaluated on AudioSet and ESC-50 benchmarks.',
  },
]

export const TopicUniquenessView: React.FC<TopicUniquenessViewProps> = ({
  title,
  setTitle,
  abstract,
  setAbstract,
  userNotes,
  setUserNotes,
  onProceedToPlanning,
}) => {
  const [threshold, setThreshold] = useState(0.75)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TopicUniquenessResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCompute = async () => {
    if (!title.trim() || !abstract.trim()) {
      setError('Please provide both paper title and abstract.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await apiComputeUniqueness({
        title,
        abstract,
        user_notes: userNotes,
        overlap_threshold: threshold,
      })
      setResult(res)
    } catch (err: any) {
      setError(err.message || 'Scoring failed.')
    } finally {
      setLoading(false)
    }
  }

  const applyPreset = (p: (typeof PRESETS)[0]) => {
    setTitle(p.title)
    setAbstract(p.abstract)
    setUserNotes(p.notes)
    setResult(null)
    setError(null)
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-display font-semibold text-[#F1F5F2] flex items-center gap-2.5">
          <TrendingUp className="w-6 h-6 text-[#22C55E]" />
          <span>Topic Uniqueness & Literature Discovery</span>
        </h2>
        <p className="text-sm text-[#A6B5AB] mt-1">
          Compute empirical novelty scores, inspect Semantic Scholar overlap, and receive grounded differentiation strategies.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-[#81958A] mr-2">Quick Presets:</span>
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => applyPreset(p)}
            className="px-3 py-1.5 rounded bg-[#14221B] hover:bg-[#1B2D24] border border-[#2A3D32] text-xs text-[#A6B5AB] hover:text-[#F1F5F2] transition-colors"
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#A6B5AB] mb-1.5">
              Working Paper Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Robust Contrastive Decoding for Hallucination Reduction in LLMs"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded bg-[#14221B] border border-[#2A3D32] text-sm text-[#F1F5F2] focus:outline-none focus:border-[#22C55E] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A6B5AB] mb-1.5">
              Abstract / Topic Description *
            </label>
            <textarea
              rows={4}
              required
              placeholder="State the core research problem, proposed method, and primary experimental claims..."
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded bg-[#14221B] border border-[#2A3D32] text-sm text-[#F1F5F2] focus:outline-none focus:border-[#22C55E] transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A6B5AB] mb-1.5">
              Researcher Notes & Specific Innovations (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Evaluated on GSM8K and HumanEval; uses temperature decay 0.8; compared against CD baseline..."
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded bg-[#14221B] border border-[#2A3D32] text-sm text-[#F1F5F2] focus:outline-none focus:border-[#22C55E] transition-colors resize-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded bg-rose-950/50 border border-rose-800/50 text-xs text-rose-300">
              {error}
            </div>
          )}

          <button
            onClick={handleCompute}
            disabled={loading}
            className="w-full py-3 rounded font-semibold text-xs text-[#0D1713] bg-[#22C55E] hover:bg-[#16a34a] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-[#0D1713]/25 border-t-[#0D1713] rounded-full animate-spin" />
                <span>Querying Semantic Scholar & Local FAISS...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Calculate Topic Uniqueness & Literature</span>
              </>
            )}
          </button>
        </div>

        <div className="p-5 rounded-lg bg-[#14221B] border border-[#2A3D32] space-y-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#F1F5F2]">
            <Sliders className="w-4 h-4 text-[#22C55E]" />
            <span>Retrieval & Scoring Parameters</span>
          </div>

          <div>
            <div className="flex justify-between text-xs text-[#A6B5AB] mb-1.5">
              <span>Overlap Alert Threshold:</span>
              <span className="font-mono text-[#86EFAC] font-semibold">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.50"
              max="0.90"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-[#22C55E]"
            />
            <p className="text-[11px] text-[#81958A] mt-1">
              Warns researcher if weighted similarity exceeds {threshold.toFixed(2)}.
            </p>
          </div>

          <div className="pt-4 border-t border-[#2A3D32] text-xs text-[#81958A] space-y-2">
            <div>
              <span className="text-[#F1F5F2] font-medium">Embedding:</span> BAAI/bge-small-en-v1.5
            </div>
            <div>
              <span className="text-[#F1F5F2] font-medium">Calibration:</span> RINoBench Isotonic Reg.
            </div>
            <div>
              <span className="text-[#F1F5F2] font-medium">Literature Source:</span> Semantic Scholar Graph API
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className="space-y-6 pt-4 border-t border-[#2A3D32]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg bg-[#14221B] border border-[#2A3D32] text-center flex flex-col items-center justify-center">
              <span className="text-xs font-medium text-[#81958A] mb-1">Topic Uniqueness Score</span>
              <div className="text-4xl font-mono font-bold text-[#F1F5F2] flex items-baseline gap-1 my-2">
                <span>{result.uniqueness_score.toFixed(1)}</span>
                <span className="text-sm font-normal text-[#81958A]">/ 100</span>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded font-semibold ${
                  result.uniqueness_score > 50
                    ? 'bg-[#14532D]/50 text-[#86EFAC] border border-[#22C55E]/40'
                    : 'bg-rose-950/50 text-rose-300 border border-rose-800/40'
                }`}
              >
                {result.uniqueness_score > 50 ? 'High Uniqueness' : 'High Overlap Detected'}
              </span>
            </div>

            <div className="p-6 rounded-lg bg-[#14221B] border border-[#2A3D32] flex flex-col justify-center">
              <span className="text-xs font-medium text-[#81958A] mb-2">Literature Overlap Meter</span>
              <div className="flex justify-between text-xs text-[#A6B5AB] mb-1.5">
                <span>Mean Top-5 Similarity:</span>
                <span className="font-mono font-bold text-[#F1F5F2]">
                  {(result.overlap_meter.raw_overlap * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-[#0D1713] overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-700 ${
                    result.overlap_meter.is_high_overlap ? 'bg-rose-500' : 'bg-[#22C55E]'
                  }`}
                  style={{ width: `${Math.min(result.overlap_meter.raw_overlap * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-[#81958A] mt-1.5">
                <span>Threshold: {(threshold * 100).toFixed(0)}%</span>
                <span>Latency: {result.latency_ms.toFixed(1)} ms</span>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-[#14221B] border border-[#2A3D32] text-center flex flex-col items-center justify-center">
              <span className="text-xs font-medium text-[#81958A] mb-1">Calibrated RINoBench Novelty</span>
              <div className="text-3xl font-mono font-bold text-[#86EFAC] my-2">
                {'★'.repeat(Math.round(result.calibrated_novelty_rating))}
                <span className="text-sm font-normal text-[#81958A] ml-2">
                  ({result.calibrated_novelty_rating.toFixed(2)} / 5.0)
                </span>
              </div>
              <p className="text-[11px] text-[#81958A]">
                Mapped via Isotonic Regression on human reviewer benchmarks
              </p>
            </div>
          </div>

          {result.overlap_meter.is_high_overlap && (
            <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800/50 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-rose-300">
                  High Overlap Warning: Significant literature overlap detected
                </h4>
                <p className="text-xs text-rose-200/80 mt-1 leading-relaxed">
                  The weighted cosine similarity of top-5 retrieved papers exceeds your threshold of{' '}
                  {(threshold * 100).toFixed(0)}%. Review the grounded differentiation suggestions below before writing.
                </p>
              </div>
            </div>
          )}

          {result.differentiation_suggestions.length > 0 && (
            <div className="p-5 rounded-lg bg-[#14221B] border border-[#2A3D32]">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#86EFAC] mb-3">
                <Sparkles className="w-4 h-4 text-[#22C55E]" />
                <span>Actionable Differentiation Strategies</span>
              </div>
              <ul className="space-y-2">
                {result.differentiation_suggestions.map((sug, i) => (
                  <li key={i} className="text-xs text-[#F1F5F2] flex items-start gap-2">
                    <span className="text-[#22C55E] font-bold">•</span>
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#F1F5F2] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#22C55E]" />
                <span>Verified Semantic Scholar Literature ({result.recommended_papers.length} Papers)</span>
              </h3>
              <button
                onClick={() => onProceedToPlanning(result.recommended_papers)}
                className="px-4 py-2 rounded text-xs font-semibold text-[#0D1713] bg-[#22C55E] hover:bg-[#16a34a] flex items-center gap-2 transition-colors"
              >
                <span>Proceed to Decompose & Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.recommended_papers.map((p, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-[#14221B] border border-[#2A3D32] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-[#F1F5F2] leading-snug line-clamp-2">
                        {p.title}
                      </h4>
                      {p.url && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#81958A] hover:text-[#22C55E] shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    <div className="text-[11px] text-[#81958A] flex items-center gap-2 mt-1">
                      <span>{p.venue || 'ArXiv'} {p.year || ''}</span>
                      <span>•</span>
                      <span>{p.citation_count || 0} citations</span>
                      {p.similarity_score !== undefined && (
                        <>
                          <span>•</span>
                          <span className="text-[#86EFAC] font-mono">
                            sim: {p.similarity_score.toFixed(3)}
                          </span>
                        </>
                      )}
                    </div>

                    {p.grounded_reason && (
                      <p className="text-[11px] text-[#A6B5AB] mt-2 bg-[#0D1713] p-2 rounded border border-[#2A3D32] italic">
                        "{p.grounded_reason}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded bg-[#14221B] border border-[#2A3D32] text-xs text-[#A6B5AB] flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#86EFAC] shrink-0 mt-0.5" />
            <span>{result.coverage_caveat}</span>
          </div>
        </div>
      )}
    </div>
  )
}
