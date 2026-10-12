import React, { useState } from 'react'
import { FileEdit, CheckCircle2, ArrowRight, Copy, Check, Code2, AlertCircle } from 'lucide-react'
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

  const sections = draft?.sections || []

  const handleCopy = () => {
    if (!sections[activeSection]) return
    const text = sections[activeSection].latex_content
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!draft || sections.length === 0) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto font-sans">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-[#2563eb] font-semibold uppercase mb-1.5">
            Stage 5 — Paper Workspace
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-slate-900 tracking-tight">
            Paper Workspace
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-3xl leading-relaxed">
            Interactive section-by-section draft editor conditioned on analyzed literature and decomposed requirements.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center mx-auto">
            <FileEdit className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold font-serif text-slate-900">
            No Paper Draft Generated Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Go to Stage 1 (Research Topic) to define your paper scope and launch the Writing Agent. The agent will synthesize structured outline claims and produce grounded LaTeX body paragraphs.
          </p>
          <button
            onClick={() => onNavigate('project')}
            className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#0f1f3d] hover:bg-[#162a52] transition-colors inline-flex items-center gap-2 shadow-sm"
          >
            <span>Go to Stage 1 (Research Topic)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
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
          Interactive section-by-section draft editor conditioned on analyzed literature and decomposed requirements.
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
            <div className="flex justify-between">
              <span>Verified Refs:</span>
              <span className="text-slate-900 font-semibold">
                {draft.bibtex_entries?.length || 0}
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
              rows={14}
              readOnly
              value={sections[activeSection]?.latex_content}
              className="w-full font-mono text-xs text-slate-800 bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-lg focus:outline-none leading-relaxed resize-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              Word count: {sections[activeSection]?.word_count} words
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('final-check')}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Audit Similarity & Novelty &rarr;
              </button>
              <button
                onClick={() => onNavigate('final-report')}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#0f1f3d] hover:bg-[#162a52] transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span>Export Paper</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
