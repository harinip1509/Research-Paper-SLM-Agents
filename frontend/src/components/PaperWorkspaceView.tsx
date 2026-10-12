import React, { useState } from 'react'
import { FileEdit, CheckCircle2, ArrowRight, Copy, Check, Code2 } from 'lucide-react'
import { NavView } from './Sidebar'
import { PaperDraft } from '../types'

interface PaperWorkspaceViewProps {
  onNavigate: (view: NavView) => void
  draft: PaperDraft | null
}

export const PaperWorkspaceView: React.FC<PaperWorkspaceViewProps> = ({
  onNavigate,
  draft,
}) => {
  const [activeSection, setActiveSection] = useState(0)
  const [copied, setCopied] = useState(false)

  const defaultSections = [
    {
      title: '1. Introduction',
      word_count: 720,
      latex_content:
        '\\section{Introduction}\nAutomated scientific literature synthesis represents a critical bottleneck in the scientific lifecycle. Recent advances in Large Language Models (LLMs) demonstrate high fluency; however, ungrounded generation frequently leads to fabricated citations and non-reproducible empirical assertions \\cite{Vaswani2017}. In this work, we present a multi-agent framework that enforces strict grounding in Semantic Scholar metadata and calibrated topic novelty.',
    },
    {
      title: '2. Related Work',
      word_count: 890,
      latex_content:
        '\\section{Related Work}\nPrevious methodologies in scientific synthesis have focused on extractive summarization or citation graph mining. Unlike monolithic zero-shot prompts, our decompose-then-plan pipeline explicitly constructs a checklist of paper requirements, achieving an empirical +0.13 rubric gain on peer evaluation benchmarks.',
    },
    {
      title: '3. Methodology',
      word_count: 1250,
      latex_content:
        '\\section{Methodology}\nWe formalize the paper generation pipeline as an orchestration of seven specialized agents. The Literature Agent applies instruction-tuned parameter-efficient adapters (LoRA, $r=16$) to extract five canonical aspects: problem, method, dataset, results, and limitations.',
    },
    {
      title: '4. Experimental Evaluation',
      word_count: 1420,
      latex_content:
        '\\section{Experiments and Results}\nWe evaluate our system across LitSearch (Recall@20), ACLSum (ROUGE-L and SBERT similarity), and RINoBench novelty ratings. We observe a Spearman rank correlation of $\\rho = 0.8038$ with human ratings under isotonic regression calibration.',
    },
    {
      title: '5. Conclusion',
      word_count: 450,
      latex_content:
        '\\section{Conclusion}\nWe introduced ResearchFlow/ScholarForge, an end-to-end multi-agent assistant for writing conference-ready papers. By coupling empirical uniqueness scoring with deterministic template formatting, our framework establishes a verifiable standard for AI-assisted scholarship.',
    },
  ]

  const sections = draft?.sections || defaultSections

  const handleCopy = () => {
    const text = sections[activeSection].latex_content
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto font-sans">
      {/* Header */}
      <div>
        <div className="text-[11px] font-mono tracking-widest text-[#2563eb] font-semibold uppercase mb-1.5">
          Stage 5 — Paper Workspace
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-slate-900 tracking-tight">
          Paper Workspace
        </h1>
        <p className="text-sm text-slate-500 mt-2 max-w-3xl leading-relaxed">
          Interactive section-by-section draft editor conditioned on analyzed literature and decomposed
          requirements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sections Sidebar */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-xs space-y-2">
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold px-2 mb-2">
            Sections ({sections.length})
          </div>

          <div className="space-y-1">
            {sections.map((sec, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSection(idx)}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-center justify-between ${
                  activeSection === idx
                    ? 'bg-[#0f1f3d] text-white font-medium shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{sec.title}</span>
                <span
                  className={`text-[10px] font-mono ${
                    activeSection === idx ? 'text-slate-300' : 'text-slate-400'
                  }`}
                >
                  {sec.word_count}w
                </span>
              </button>
            ))}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-[11px] font-mono text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Total Words:</span>
              <span className="text-slate-900 font-semibold">
                {sections.reduce((acc, s) => acc + s.word_count, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Section Editor / View */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#2563eb]" />
                <h3 className="text-sm font-bold text-slate-900">
                  {sections[activeSection]?.title}
                </h3>
              </div>

              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-[#e2e8f0] transition-colors flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy LaTeX</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={12}
              readOnly
              value={sections[activeSection]?.latex_content}
              className="w-full font-mono text-xs text-slate-800 bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-lg focus:outline-none leading-relaxed resize-none"
            />
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={() => onNavigate('final-check')}
              className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#0f1f3d] hover:bg-[#162a52] transition-colors flex items-center gap-2 shadow-sm"
            >
              <span>Proceed to Final Check (Stage 6)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
