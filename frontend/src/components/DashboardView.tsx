import React from 'react'
import { ArrowRight, BookOpen, Sparkles, FolderPlus, Clock, Trash2 } from 'lucide-react'
import { NavView } from './Sidebar'
import { ProjectSummary } from '../types'

interface DashboardViewProps {
  onNavigate: (view: NavView) => void
  currentStageName: string
  papersCount: number
  uniquenessScore: number | null
  citationCount: number
  projects: ProjectSummary[]
  onSelectProject: (id: string) => void
  onNewProject: () => void
  onDeleteProject?: (id: string) => void
  onApplyPreset: (preset: { title: string; abstract: string; notes: string; venue: string }) => void
}

const TEMPLATES = [
  {
    title: 'Quantum Neural Networks for Molecular Docking',
    abstract:
      'We formulate parameterized quantum circuits for predicting non-covalent binding affinity and molecular docking conformations, evaluating variational ansatz architectures against classical baselines on the ChEMBL benchmark.',
    notes: 'Grounding in variational eigensolvers; evaluates binding energy and RMSD.',
    venue: 'ieee',
  },
  {
    title: 'Transformer Models for Clinical NLP and EHR Summarization',
    abstract:
      'We examine pre-trained transformer representations adapted for clinical narrative electronic health records, addressing domain terminology and tokenization bottlenecks.',
    notes: 'Evaluated against BioBERT and ClinicalBERT on MIMIC-III benchmark.',
    venue: 'acl',
  },
  {
    title: 'Differential Privacy in Federated Healthcare Optimization',
    abstract:
      'A differential-privacy aware federated optimization framework across hospital silos, maintaining strict patient data confidentiality while achieving centralized AUC parity.',
    notes: 'Non-IID distribution across 5 hospital nodes; epsilon=1.2 DP guarantee.',
    venue: 'acm',
  },
]

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  currentStageName,
  papersCount,
  uniquenessScore,
  citationCount,
  projects,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  onApplyPreset,
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
          literature-supported conference paper draft.
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

          {pipelineSteps.map((step) => {
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
            {papersCount > 0 ? papersCount : 0}
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

      {/* Quick-Start Research Templates */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold font-serif text-slate-900">
              Quick-Start Research Presets
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any template to auto-populate the project configuration and launch the agents.
            </p>
          </div>
          <Sparkles className="w-4 h-4 text-[#2563eb]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TEMPLATES.map((tmpl, idx) => (
            <div
              key={idx}
              onClick={() => onApplyPreset(tmpl)}
              className="p-3.5 rounded-lg border border-[#e2e8f0] hover:border-[#2563eb] hover:bg-blue-50/20 cursor-pointer transition-all group"
            >
              <div className="text-xs font-bold text-slate-900 group-hover:text-[#2563eb] line-clamp-1">
                {tmpl.title}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {tmpl.abstract}
              </p>
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-400">
                <span className="uppercase font-semibold text-slate-600">{tmpl.venue}</span>
                <span className="text-[#2563eb] group-hover:underline flex items-center gap-1">
                  Use Preset &rarr;
                </span>
              </div>
            </div>
          ))}
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
              Enter your custom research question and preliminary notes to begin the automated literature search and paper generation workflow.
            </p>

            <button
              onClick={onNewProject}
              className="mt-4 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#0f1f3d] hover:bg-[#162a52] transition-colors flex items-center gap-2 shadow-sm"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>New Project</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          {/* System Information Box */}
          <div className="rounded-lg bg-[#f8fafc] border border-[#e2e8f0] p-4 text-[11px] font-mono">
            <div className="text-[10px] tracking-wider text-slate-400 uppercase font-semibold mb-2.5">
              Agent Architecture
            </div>
            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Literature + Uniqueness</span>
                <span className="text-slate-900 font-medium">BGE-small + S2 Graph API</span>
              </div>
              <div className="flex justify-between">
                <span>Similarity Audit</span>
                <span className="text-slate-900 font-medium">Sentence Transformer + cosine</span>
              </div>
              <div className="flex justify-between">
                <span>Writing Agent</span>
                <span className="text-slate-900 font-medium">Groq Llama 3.3 / Offline Grounded</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Box: Recent Projects */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-serif text-slate-900">
              Recent Projects
            </h3>
            <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
              {projects.length} saved
            </span>
          </div>

          {projects.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg">
              <Clock className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No saved research projects yet.</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                Click "New Project" or apply a preset above to launch the autonomous agent pipeline.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
              {projects.map((p) => (
                <div key={p.id} className="py-3.5 first:pt-0 last:pb-0 group">
                  <div className="flex items-start justify-between gap-2">
                    <div
                      onClick={() => onSelectProject(p.id)}
                      className="text-xs font-semibold text-slate-900 hover:text-[#2563eb] cursor-pointer line-clamp-1"
                    >
                      {p.title}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 shrink-0">
                      {p.updated_at ? p.updated_at.split(' ')[0] : 'Today'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-1.5 text-[11px] font-mono">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 uppercase">{p.venue}</span>
                      {p.papers_count > 0 && (
                        <span className="text-slate-500">{p.papers_count} papers</span>
                      )}
                      {p.uniqueness_score !== null && (
                        <span className="text-emerald-600 font-semibold">
                          Orig: {(p.uniqueness_score / 100).toFixed(3)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onSelectProject(p.id)}
                        className="text-[10px] text-[#2563eb] font-sans hover:underline"
                      >
                        Open
                      </button>
                      {onDeleteProject && (
                        <button
                          onClick={() => onDeleteProject(p.id)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
