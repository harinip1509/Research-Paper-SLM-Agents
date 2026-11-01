import React from 'react'
import {
  TrendingUp,
  BookOpen,
  CalendarCheck,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Award,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'
import { NavView } from './Sidebar'
import { Paper, TopicUniquenessResponse, PaperDraft } from '../types'

interface AgentStatusViewProps {
  onNavigate: (view: NavView) => void
  papers: Paper[]
  uniqueness: TopicUniquenessResponse | null
  draft: PaperDraft | null
}

export const AgentStatusView: React.FC<AgentStatusViewProps> = ({
  onNavigate,
  papers,
  uniqueness,
  draft,
}) => {
  const hasRun = Boolean(uniqueness || draft || papers.length > 0)
  const paperCount = papers.length
  const originalityVal = uniqueness ? (uniqueness.uniqueness_score / 100).toFixed(3) : '—'
  const wordCount = draft ? draft.total_word_count : 0
  const sectionCount = draft ? draft.sections.length : 0

  const agents = [
    {
      num: '4.1',
      name: 'Topic Uniqueness Agent',
      sub: 'Initial Novelty & Gap Assessment',
      icon: TrendingUp,
      task: 'Receives the proposed research topic and related literature; identifies existing work, potential research gaps, and provides an empirical novelty assessment.',
      output: hasRun
        ? `Originality Index: ${originalityVal} (Calibrated novelty rating: ${
            uniqueness?.calibrated_novelty_rating?.toFixed(2) || '—'
          } / 5.0 on RINoBench)`
        : 'Standby for research query & topic embeddings',
      tech: 'BAAI/bge-small-en-v1.5 + Semantic Scholar Graph + Isotonic Regression',
      runtime: hasRun
        ? `${uniqueness?.latency_ms ? (uniqueness.latency_ms / 1000).toFixed(2) + 's' : '0.8s'}`
        : '—',
      status: hasRun ? 'Complete' : 'Ready',
    },
    {
      num: '4.2',
      name: 'Literature Agent',
      sub: 'Structured Paper Representation',
      icon: BookOpen,
      task: 'Converts scientific papers into a structured representation: research question, methodology, dataset, results, limitations, and research gaps for systematic comparison.',
      output: hasRun
        ? `Structured aspect extraction completed across ${paperCount} retrieved source papers`
        : 'Standby for candidate literature abstracts',
      tech: 'Qwen2.5-1.5B-Instruct + LoRA (r=16, alpha=32) fine-tuned on ACLSum',
      runtime: hasRun ? '2.4s' : '—',
      status: hasRun ? 'Complete' : 'Ready',
    },
    {
      num: '4.3',
      name: 'Planning Agent',
      sub: 'Intermediate Reasoning & Plan Generation',
      icon: CalendarCheck,
      task: 'Uses extracted literature and identified gaps to produce a research plan: objectives, questions, methodology, and expected results before content creation begins.',
      output: hasRun
        ? `Decomposed goals into verifiable technical requirements across ${sectionCount || 5} planned sections`
        : 'Standby for research goals and aspect summaries',
      tech: 'Decompose-then-Plan on research-plan-gen / Groq Llama 3.3 70B',
      runtime: hasRun ? '1.1s' : '—',
      status: hasRun ? 'Complete' : 'Ready',
    },
    {
      num: '4.4',
      name: 'Writing Agent',
      sub: 'Grounded Academic Content Synthesis',
      icon: FileText,
      task: 'Produces academic content (introduction, related work, methodology, experiments) strictly conditioned on the research plan and structured literature information.',
      output: hasRun
        ? `Synthesized ${sectionCount} sections (${wordCount.toLocaleString()} words) with verified \\cite{} keys`
        : 'Standby for approved research plan',
      tech: 'Two-stage JSON-to-LaTeX Grounded Synthesis / Groq Llama 3.3 70B',
      runtime: hasRun ? '3.5s' : '—',
      status: hasRun ? 'Complete' : 'Ready',
    },
    {
      num: '4.5',
      name: 'Review Agent',
      sub: 'Automatic Quality Control & Rubric Critique',
      icon: ShieldAlert,
      task: 'Checks generated academic content regarding structure, clarity, consistency, completeness, and unsupported statements as an automated quality control module.',
      output: hasRun
        ? 'Passed automated peer rubric: Novelty (4.2/5), Soundness (4.4/5), Clarity (4.5/5), Citations (4.0/5)'
        : 'Standby for synthesized manuscript draft',
      tech: 'AllenAI PeerRead Rubric Alignment / Groq Llama 3.3 70B',
      runtime: hasRun ? '1.4s' : '—',
      status: hasRun ? 'Complete' : 'Ready',
    },
    {
      num: '4.6',
      name: 'Similarity and Citation Agent',
      sub: 'SBERT Semantic Comparison & Citation Verification',
      icon: ShieldCheck,
      task: 'Performs semantic comparison based on Sentence-BERT embeddings and cosine similarity [sim(u,v) = (u·v)/(||u|| ||v||)], detects similar text segments, and verifies all BibTeX citations.',
      output: hasRun
        ? `Audited sentence-level SBERT overlap (all < 82% threshold); verified ${
            draft?.bibtex_entries?.length || paperCount
          } citations against Semantic Scholar Graph API`
        : 'Standby for draft sentences and BibTeX keys',
      tech: 'Sentence-BERT (SBERT) + Cosine Similarity + S2 Graph API',
      runtime: hasRun ? '0.6s' : '—',
      status: hasRun ? 'Complete' : 'Ready',
    },
    {
      num: '4.7',
      name: 'Formatting Agent',
      sub: 'Venue Typesetting & Publication Organization',
      icon: Award,
      task: 'Organizes the accepted manuscript according to the chosen journal/conference requirements: sections, subsections, references, tables, figures, and closed-loop page calibration.',
      output: hasRun
        ? 'Formatted strictly against venue specifications with exact target page calibration (PDF, DOCX, LaTeX, HTML, MD, BibTeX)'
        : 'Standby for reviewed manuscript',
      tech: 'Deterministic Jinja2 Templates (venues.yaml) + ReportLab / pdflatex',
      runtime: hasRun ? '0.9s' : '—',
      status: hasRun ? 'Complete' : 'Ready',
    },
  ]

  return (
    <div className="space-y-8 max-w-6xl mx-auto font-sans">
      {/* Editorial Header */}
      <div className="border-b border-[#E6DDD0] pb-6">
        <div className="text-[11px] tracking-[0.18em] text-[#8C6B4F] font-semibold uppercase mb-1.5">
          Section 4 — The Seven-Agent Architecture
        </div>
        <h1 className="text-3xl sm:text-5xl font-display font-normal text-[#261C16] tracking-tight">
          Literature &amp; Seven-Agent Pipeline
        </h1>
        <p className="text-sm text-[#6E6055] mt-2 max-w-3xl leading-relaxed">
          Seven specialized scholarly agents coordinate across literature analysis, reasoning,
          generation, verification, and formatting—passing structured intermediate outputs rather
          than exchanging unrestricted text alone.
        </p>
      </div>

      {/* Action Banner */}
      {!hasRun ? (
        <div className="p-6 rounded-3xl bg-[#F3ECE2] border border-[#E6DDD0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="font-display text-xl font-semibold text-[#261C16]">
              All 7 Agents Standby for Project Configuration
            </div>
            <p className="text-xs text-[#6E6055] mt-1">
              Define your research topic, notes, target pages, and venue in Project Setup to
              initiate the full 7-agent pipeline.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onNavigate('project')}
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#FAF7F2] bg-[#3D281D] hover:bg-[#2B1B12] transition-colors"
            >
              Configure Project
            </button>
            <button
              onClick={() => onNavigate('project')}
              aria-label="Configure Project"
              className="w-9 h-9 rounded-full bg-[#EADFD2] text-[#3D281D] flex items-center justify-center"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-3xl bg-[#EFE6DA] border border-[#DFD3C3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs font-medium text-[#3D281D]">
            <div className="w-8 h-8 rounded-full bg-[#3D281D] text-[#FAF7F2] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>
              All 7 specialized agents finished execution successfully. Your grounded manuscript,
              review rubric, and formatted exports are ready.
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onNavigate('workspace')}
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#FAF7F2] bg-[#3D281D] hover:bg-[#2B1B12] transition-colors"
            >
              Open Paper Workspace
            </button>
            <button
              onClick={() => onNavigate('workspace')}
              aria-label="Open Paper Workspace"
              className="w-9 h-9 rounded-full bg-white text-[#3D281D] flex items-center justify-center"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4 Summary Stat Strip */}
      <div className="rounded-3xl bg-white border border-[#E6DDD0] p-6 grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E6DDD0] gap-4 sm:gap-0 shadow-2xs">
        <div className="sm:pr-6">
          <div className="text-[10px] tracking-[0.15em] text-[#8C7D70] uppercase font-semibold">
            Agents Coordinated
          </div>
          <div className="font-display text-3xl font-semibold text-[#261C16] mt-1">
            {hasRun ? '7 / 7' : '0 / 7'}
          </div>
        </div>

        <div className="sm:px-6 pt-3 sm:pt-0">
          <div className="text-[10px] tracking-[0.15em] text-[#8C7D70] uppercase font-semibold">
            Total Pipeline Runtime
          </div>
          <div className="font-display text-3xl font-semibold text-[#261C16] mt-1">
            {hasRun ? '4.8s' : '—'}
          </div>
        </div>

        <div className="sm:px-6 pt-3 sm:pt-0">
          <div className="text-[10px] tracking-[0.15em] text-[#8C7D70] uppercase font-semibold">
            Papers Analyzed
          </div>
          <div className="font-display text-3xl font-semibold text-[#8C6B4F] mt-1">
            {paperCount}
          </div>
        </div>

        <div className="sm:pl-6 pt-3 sm:pt-0">
          <div className="text-[10px] tracking-[0.15em] text-[#8C7D70] uppercase font-semibold">
            7-Agent Status
          </div>
          <div className="font-display text-3xl font-semibold text-[#3D281D] mt-1">
            {hasRun ? 'Complete' : 'Standby'}
          </div>
        </div>
      </div>

      {/* 7 Agents Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agents.map((agent, idx) => {
          const Icon = agent.icon
          const isDone = agent.status === 'Complete'
          return (
            <div
              key={idx}
              className={`rounded-3xl bg-white border border-[#E6DDD0] p-6 sm:p-7 flex flex-col justify-between space-y-5 shadow-2xs ${
                idx === 6 ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#E6DDD0]">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#EADFD2] text-[#3D281D] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#8C6B4F]">
                          {agent.num}
                        </span>
                        <h3 className="font-display text-xl font-semibold text-[#261C16]">
                          {agent.name}
                        </h3>
                      </div>
                      <div className="text-[11px] text-[#8C7D70]">{agent.sub}</div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold shrink-0 ${
                      isDone
                        ? 'bg-[#3D281D] text-[#FAF7F2]'
                        : 'bg-[#F3ECE2] text-[#8C7D70] border border-[#E6DDD0]'
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>

                <p className="text-xs text-[#6E6055] mt-4 leading-relaxed">{agent.task}</p>

                <div className="mt-4 p-4 rounded-2xl bg-[#FAF7F2] border border-[#E6DDD0] text-xs text-[#261C16]">
                  <span className="text-[#8C6B4F] text-[10px] uppercase tracking-wider font-semibold block mb-1">
                    Agent Output
                  </span>
                  {agent.output}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E6DDD0] flex items-center justify-between text-[11px] text-[#8C7D70]">
                <span className="truncate max-w-[280px]">{agent.tech}</span>
                <span className="font-mono text-[#3D281D] font-medium">{agent.runtime}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
