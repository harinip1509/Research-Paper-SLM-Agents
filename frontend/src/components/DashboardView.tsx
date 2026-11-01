import React from 'react'
import { ArrowUpRight, Sparkles, FolderPlus, Clock, Trash2, Key } from 'lucide-react'
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
  onOpenSettings?: () => void
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
  onOpenSettings,
}) => {
  const pipelineSteps = [
    { num: '4.1', name: 'Topic Uniqueness Agent', desc: 'Identifies existing work & novelty', target: 'project' as NavView },
    { num: '4.2', name: 'Literature Agent', desc: 'Extracts structured aspect summaries', target: 'agent-status' as NavView },
    { num: '4.3', name: 'Planning Agent', desc: 'Decomposes goals into research plan', target: 'agent-status' as NavView },
    { num: '4.4', name: 'Writing Agent', desc: 'Produces grounded academic content', target: 'workspace' as NavView },
    { num: '4.5', name: 'Review Agent', desc: 'Automated quality control & rubric', target: 'final-check' as NavView },
    { num: '4.6', name: 'Similarity and Citation Agent', desc: 'SBERT cosine overlap & citations', target: 'final-check' as NavView },
    { num: '4.7', name: 'Formatting Agent', desc: 'Journal & conference typesetting', target: 'final-report' as NavView },
  ]

  return (
    <div className="space-y-8 max-w-6xl mx-auto font-sans">
      {/* Warm Espresso Editorial Banner */}
      <div className="bg-espresso-hero rounded-[28px] p-6 sm:p-9 text-[#FAF7F2] shadow-sm">
        <div className="rounded-2xl border border-white/20 bg-white/[0.03] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="text-[11px] tracking-[0.18em] uppercase text-[#EADFD2] font-medium">
              Editorial Research Studio
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-normal tracking-tight text-[#FDFBF7]">
              Scholarly Synthesis &amp; Typesetting
            </h1>
            <p className="text-xs sm:text-sm text-[#E6DDD0]/90 leading-relaxed">
              Coordinate literature discovery, empirical novelty calibration, grounded LaTeX
              drafting, and exact-page conference compilation from a single calm workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="inline-flex items-center gap-1.5">
              <button
                onClick={onNewProject}
                className="px-6 py-3 rounded-full bg-white hover:bg-[#FAF7F2] text-[#261C16] text-xs font-semibold transition-all shadow-xs"
              >
                Start New Manuscript
              </button>
              <button
                onClick={onNewProject}
                aria-label="Start New Manuscript"
                className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#261C16] flex items-center justify-center transition-all"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="px-4 py-3 rounded-full border border-white/30 hover:bg-white/10 text-[#FDFBF7] text-xs font-medium transition-colors inline-flex items-center gap-2"
              >
                <Key className="w-3.5 h-3.5 text-[#EADFD2]" />
                <span>API Keys &amp; DB</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Strip (Warm Linen Card) */}
      <div className="rounded-3xl bg-[#F3ECE2] border border-[#E6DDD0] p-6 grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#DFD3C3] gap-4 sm:gap-0">
        <div className="sm:pr-6">
          <div className="text-[10px] tracking-[0.15em] text-[#8C7D70] uppercase font-semibold">
            Active View
          </div>
          <div className="font-display text-2xl font-semibold text-[#261C16] mt-1 truncate">
            {currentStageName || 'Studio Overview'}
          </div>
        </div>

        <div className="sm:px-6 pt-3 sm:pt-0">
          <div className="text-[10px] tracking-[0.15em] text-[#8C7D70] uppercase font-semibold">
            Literature Retrieved
          </div>
          <div className="font-display text-3xl font-semibold text-[#261C16] mt-1">
            {papersCount > 0 ? `${papersCount} Papers` : '0 Papers'}
          </div>
        </div>

        <div className="sm:px-6 pt-3 sm:pt-0">
          <div className="text-[10px] tracking-[0.15em] text-[#8C7D70] uppercase font-semibold">
            Originality Index
          </div>
          <div className="font-display text-3xl font-semibold text-[#8C6B4F] mt-1">
            {typeof uniquenessScore === 'number' && !isNaN(uniquenessScore)
              ? (uniquenessScore / 100).toFixed(3)
              : '—'}
          </div>
        </div>

        <div className="sm:pl-6 pt-3 sm:pt-0">
          <div className="text-[10px] tracking-[0.15em] text-[#8C7D70] uppercase font-semibold">
            Citation Provenance
          </div>
          <div className="font-display text-3xl font-semibold text-[#3D281D] mt-1">
            {citationCount > 0 ? '100% Verified' : 'Standby'}
          </div>
        </div>
      </div>

      {/* 7-Stage Editorial Pipeline Map */}
      <div className="rounded-3xl bg-white border border-[#E6DDD0] p-6 sm:p-8 shadow-2xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] tracking-[0.16em] uppercase text-[#8C6B4F] font-semibold block">
              Methodological Architecture
            </span>
            <h2 className="font-display text-2xl font-semibold text-[#261C16]">
              Seven-Stage Research Pipeline
            </h2>
          </div>
          <span className="text-xs text-[#8C7D70] hidden sm:inline">
            Select any stage to inspect or configure
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {pipelineSteps.map((step, idx) => {
            const isFirst = idx === 0
            return (
              <div
                key={step.num}
                onClick={() => onNavigate(step.target)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all group flex flex-col justify-between ${
                  isFirst
                    ? 'bg-[#3D281D] text-[#FAF7F2] border-[#3D281D]'
                    : 'bg-[#FAF7F2] text-[#261C16] border-[#E6DDD0] hover:bg-[#F3ECE2] hover:border-[#C8B29B]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`font-display text-sm font-semibold italic ${
                      isFirst ? 'text-[#EADFD2]' : 'text-[#8C6B4F]'
                    }`}
                  >
                    Agent {step.num}
                  </span>
                  <ArrowUpRight
                    className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                      isFirst ? 'text-[#EADFD2]' : 'text-[#8C7D70]'
                    }`}
                  />
                </div>

                <div>
                  <div className="text-xs font-semibold leading-snug">{step.name}</div>
                  <div
                    className={`text-[11px] mt-1 leading-tight ${
                      isFirst ? 'text-[#E6DDD0]/80' : 'text-[#6E6055]'
                    }`}
                  >
                    {step.desc}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Curated Research Presets (Warm Sand Container) */}
      <div className="rounded-3xl bg-[#EFE6DA] border border-[#E2D6C5] p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] tracking-[0.16em] uppercase text-[#8C6B4F] font-semibold block">
              Curated Exemplars
            </span>
            <h3 className="font-display text-2xl font-semibold text-[#261C16]">
              Quick-Start Research Topics
            </h3>
          </div>
          <div className="w-9 h-9 rounded-full bg-white border border-[#E6DDD0] flex items-center justify-center text-[#8C6B4F]">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TEMPLATES.map((tmpl, idx) => (
            <div
              key={idx}
              onClick={() => onApplyPreset(tmpl)}
              className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E6DDD0] hover:border-[#8C6B4F] hover:bg-white cursor-pointer transition-all group flex flex-col justify-between shadow-2xs"
            >
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#EADFD2] text-[#3D281D] text-[10px] uppercase tracking-wider font-semibold mb-2.5">
                  {tmpl.venue.toUpperCase()} Format
                </span>
                <h4 className="font-display text-xl font-semibold text-[#261C16] leading-snug group-hover:text-[#3D281D]">
                  {tmpl.title}
                </h4>
                <p className="text-xs text-[#6E6055] mt-2 line-clamp-3 leading-relaxed">
                  {tmpl.abstract}
                </p>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E6DDD0] text-xs font-medium text-[#3D281D]">
                <span>Load Topic &amp; Notes</span>
                <span className="w-7 h-7 rounded-full bg-[#3D281D] text-[#FAF7F2] flex items-center justify-center group-hover:bg-[#2B1B12] transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section: New Manuscript & Saved Library */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Box: Compose Custom Manuscript */}
        <div className="rounded-3xl bg-white border border-[#E6DDD0] p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-2xs">
          <div className="space-y-3">
            <span className="text-[10px] tracking-[0.16em] uppercase text-[#8C6B4F] font-semibold block">
              Custom Investigation
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[#261C16]">
              Compose a New Manuscript
            </h3>
            <p className="text-xs text-[#6E6055] leading-relaxed">
              Define your research question, preliminary experimental observations, target page
              budget (1–30 pages), and conference formatting profile to begin.
            </p>

            <div className="pt-2 inline-flex items-center gap-1.5">
              <button
                onClick={onNewProject}
                className="px-6 py-3 rounded-full text-xs font-semibold text-[#FAF7F2] bg-[#3D281D] hover:bg-[#2B1B12] transition-colors inline-flex items-center gap-2"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Configure New Project</span>
              </button>
              <button
                onClick={onNewProject}
                aria-label="Configure New Project"
                className="w-10 h-10 rounded-full bg-[#EADFD2] hover:bg-[#DFD0BE] text-[#3D281D] flex items-center justify-center transition-colors"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Engine Summary Box */}
          <div className="rounded-2xl bg-[#FAF7F2] border border-[#E6DDD0] p-4 text-xs space-y-2">
            <div className="text-[10px] tracking-[0.15em] text-[#8C7D70] uppercase font-semibold">
              Studio Capabilities
            </div>
            <div className="space-y-1.5 text-[#6E6055]">
              <div className="flex justify-between">
                <span>Literature &amp; Novelty</span>
                <span className="text-[#261C16] font-medium">Semantic Scholar + BGE-small</span>
              </div>
              <div className="flex justify-between">
                <span>Grounded Synthesis</span>
                <span className="text-[#261C16] font-medium">Llama 3.3 70B + Local Engine</span>
              </div>
              <div className="flex justify-between">
                <span>Multi-Venue Compilation</span>
                <span className="text-[#8C6B4F] font-medium">IEEE, ACL, ACM, LNCS &amp; arXiv</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Box: Saved Manuscripts */}
        <div className="rounded-3xl bg-white border border-[#E6DDD0] p-6 sm:p-8 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] tracking-[0.16em] uppercase text-[#8C6B4F] font-semibold block">
                Local Archive
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[#261C16]">
                Saved Manuscripts
              </h3>
            </div>
            <span className="text-xs text-[#4A3728] bg-[#F3ECE2] px-3 py-1 rounded-full border border-[#E6DDD0] font-medium">
              {Array.isArray(projects) ? projects.length : 0} Saved
            </span>
          </div>

          {!Array.isArray(projects) || projects.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-[#DFD3C3] rounded-2xl bg-[#FAF7F2]">
              <Clock className="w-6 h-6 text-[#8C7D70] mx-auto mb-2" />
              <p className="text-xs text-[#261C16] font-semibold">No saved manuscripts yet</p>
              <p className="text-[11px] text-[#6E6055] mt-1 max-w-xs mx-auto">
                Start a new project or select a curated topic above to generate your first
                manuscript.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E6DDD0] max-h-[300px] overflow-y-auto pr-1">
              {(Array.isArray(projects) ? projects : []).map((p) => (
                <div key={p.id} className="py-3.5 first:pt-0 last:pb-0 group">
                  <div className="flex items-start justify-between gap-2">
                    <div
                      onClick={() => onSelectProject(p.id)}
                      className="text-sm font-display font-semibold text-[#261C16] hover:text-[#8C6B4F] cursor-pointer line-clamp-1 transition-colors"
                    >
                      {p.title || 'Untitled Manuscript'}
                    </div>
                    <div className="text-[11px] text-[#8C7D70] shrink-0">
                      {typeof p.updated_at === 'string' && p.updated_at
                        ? p.updated_at.split(' ')[0].split('T')[0]
                        : 'Recent'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-1.5 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded-full bg-[#F3ECE2] text-[#3D281D] text-[10px] uppercase font-semibold">
                        {p.venue || 'ieee'}
                      </span>
                      {typeof p.papers_count === 'number' && p.papers_count > 0 && (
                        <span className="text-[#6E6055] text-[11px]">{p.papers_count} papers</span>
                      )}
                      {p.uniqueness_score != null && !isNaN(Number(p.uniqueness_score)) && (
                        <span className="text-[#8C6B4F] text-[11px] font-medium">
                          Originality: {(Number(p.uniqueness_score) / 100).toFixed(3)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onSelectProject(p.id)}
                        className="text-xs text-[#3D281D] font-semibold hover:underline"
                      >
                        Open
                      </button>
                      {onDeleteProject && (
                        <button
                          onClick={() => onDeleteProject(p.id)}
                          className="text-[#8C7D70] hover:text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
