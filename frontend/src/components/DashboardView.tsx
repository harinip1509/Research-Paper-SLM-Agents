import React from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { NavView } from './Sidebar'

interface DashboardViewProps {
  onNavigate: (view: NavView) => void
  currentStageName: string
  papersCount: number
  uniquenessScore: number | null
  citationCount: number
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  currentStageName,
  papersCount,
  uniquenessScore,
  citationCount,
}) => {
  const pipelineSteps = [
    { num: 1, name: 'Research Topic', desc: 'Define your research question and scope', target: 'project' as NavView },
    { num: 2, name: 'Academic Search', desc: 'Semantic Scholar literature search', target: 'agent-status' as NavView },
    { num: 3, name: 'Literature Analysis', desc: 'Extract problem, method, claims', target: 'agent-status' as NavView },
    { num: 4, name: 'Topic Uniqueness', desc: 'BGE-small vector novelty score', target: 'final-check' as NavView },
    { num: 5, name: 'Paper Writing', desc: 'Two-stage grounded drafting', target: 'workspace' as NavView },
    { num: 6, name: 'Similarity Check', desc: 'Sentence-level overlap audit', target: 'final-check' as NavView },
    { num: 7, name: 'Final Paper', desc: 'Conference PDF & DOCX export', target: 'final-report' as NavView },
  ]

  const recentProjects = [
    {
      title: 'Transformer Models for Clinical NLP',
      date: '2025-08-14',
      progress: '100%',
      originality: '0.87',
    },
    {
      title: 'Federated Learning in Healthcare Data Privacy',
      date: '2025-08-11',
      progress: '67%',
      originality: '0.91',
    },
    {
      title: 'Zero-Shot Summarization of Clinical Trial Reports',
      date: '2025-08-08',
      progress: '33%',
      originality: null,
    },
  ]

  return (
    <div className="space-y-8 max-w-6xl mx-auto font-sans">
      {/* Header */}
      <div>
        <div className="text-[11px] font-mono tracking-widest text-[#2563eb] font-semibold uppercase mb-1.5">
          ResearchFlow AI — Dashboard
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-slate-900 tracking-tight">
          Research Workflow
        </h1>
        <p className="text-sm text-slate-500 mt-2 max-w-3xl leading-relaxed">
          A seven-stage pipeline where specialized AI agents work together to produce an original,
          literature-supported research paper.
        </p>
      </div>

      {/* Pipeline Overview */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-xs">
        <h2 className="text-base font-bold font-serif text-slate-900 mb-6">
          Pipeline Overview
        </h2>

        {/* Step Circles Row */}
        <div className="relative flex items-center justify-between">
          {/* Connector Line */}
          <div className="absolute top-5 left-6 right-6 h-0.5 bg-slate-200 -z-0" />

          {pipelineSteps.map((step, idx) => {
            const isActive = step.num === 1
            return (
              <div
                key={step.num}
                onClick={() => onNavigate(step.target)}
                className="relative z-10 flex flex-col items-center cursor-pointer group text-center max-w-[110px]"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm font-semibold transition-all ${
                    isActive
                      ? 'border-2 border-[#2563eb] bg-white text-[#2563eb] shadow-sm'
                      : 'border-2 border-slate-200 bg-white text-slate-400 group-hover:border-slate-400 group-hover:text-slate-600'
                  }`}
                >
                  {step.num}
                </div>

                <div
                  className={`text-xs font-semibold mt-2.5 leading-snug ${
                    isActive ? 'text-[#2563eb]' : 'text-slate-700 group-hover:text-slate-900'
                  }`}
                >
                  {step.name}
                </div>

                {step.desc && (
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-tight hidden lg:block">
                    {step.desc}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
            Current Stage
          </div>
          <div className="text-lg font-bold font-serif text-slate-900 mt-2 truncate">
            {currentStageName || 'Research Topic'}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
            Papers Retrieved
          </div>
          <div className="text-xl font-bold font-serif text-slate-900 mt-2">
            {papersCount > 0 ? papersCount : '—'}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
            Originality Score
          </div>
          <div className="text-xl font-bold font-serif text-slate-900 mt-2">
            {uniquenessScore !== null ? (uniquenessScore / 100).toFixed(3) : '—'}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
            Citation Accuracy
          </div>
          <div className="text-xl font-bold font-serif text-slate-900 mt-2">
            {citationCount > 0 ? '100%' : '—'}
          </div>
        </div>
      </div>

      {/* Bottom Section: Start Project & Recent Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Box: Start New Project */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-lg font-bold font-serif text-slate-900">
              Start a New Research Project
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Enter your research topic to begin the automated literature search and paper generation workflow.
            </p>

            <button
              onClick={() => onNavigate('project')}
              className="mt-4 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#0f1f3d] hover:bg-[#162a52] transition-colors flex items-center gap-2 shadow-sm"
            >
              <span>New Project</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* System Information Box */}
          <div className="rounded-lg bg-[#f8fafc] border border-[#e2e8f0] p-4 text-[11px] font-mono">
            <div className="text-[10px] tracking-wider text-slate-400 uppercase font-semibold mb-2.5">
              System Information
            </div>
            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Literature + Uniqueness</span>
                <span className="text-slate-900 font-medium">Qwen2.5-1.5B-Instruct + LoRA</span>
              </div>
              <div className="flex justify-between">
                <span>Similarity</span>
                <span className="text-slate-900 font-medium">Sentence Transformer + cosine similarity</span>
              </div>
              <div className="flex justify-between">
                <span>Search</span>
                <span className="text-slate-900 font-medium">BM25 + bi-encoder reranking</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Box: Recent Projects */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 space-y-4">
          <h3 className="text-lg font-bold font-serif text-slate-900">
            Recent Projects
          </h3>

          <div className="divide-y divide-slate-100">
            {recentProjects.map((p, idx) => (
              <div key={idx} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-900 hover:text-[#2563eb] cursor-pointer">
                    {p.title}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 shrink-0">
                    {p.date}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-1 text-[11px] font-mono">
                  <span className="text-slate-500">{p.progress}</span>
                  {p.originality && (
                    <span className="text-emerald-600 font-semibold">
                      Originality: {p.originality}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
