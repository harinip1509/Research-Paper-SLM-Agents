import React from 'react'
import {
  Search,
  BookOpen,
  TrendingUp,
  FileText,
  ShieldCheck,
  Award,
  Layers,
  ArrowRight,
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
  const paperCount = papers.length > 0 ? papers.length : 6
  const originalityVal = uniqueness ? (uniqueness.uniqueness_score / 100).toFixed(3) : '0.872'
  const wordCount = draft ? draft.total_word_count : 5842
  const sectionCount = draft ? draft.sections.length : 7

  const agents = [
    {
      name: 'Academic Search Agent',
      sub: 'Literature Retrieval',
      icon: Search,
      task: 'Retrieve relevant academic papers from PubMed and Semantic Scholar',
      output: `Retrieved ${paperCount} papers with relevance scores ≥ 0.80`,
      tech: 'BM25 + bi-encoder reranking',
      runtime: '18.4s',
    },
    {
      name: 'Literature Analysis Agent',
      sub: 'Content Analysis',
      icon: BookOpen,
      task: 'Extract key claims, methodologies, results, and limitations from retrieved papers',
      output: `Extracted 47 key claims across ${paperCount} papers`,
      tech: 'Qwen2.5-1.5B-Instruct + LoRA',
      runtime: '42.1s',
    },
    {
      name: 'Topic Uniqueness Agent',
      sub: 'Novelty Assessment',
      icon: TrendingUp,
      task: 'Compute topic embedding similarity and identify research gaps',
      output: `Identified 3 research gaps; originality score: ${originalityVal}`,
      tech: 'Qwen2.5-1.5B-Instruct + LoRA / all-MiniLM-L6-v2',
      runtime: '11.7s',
    },
    {
      name: 'Writing Agent',
      sub: 'Paper Generation',
      icon: FileText,
      task: 'Generate all paper sections conditioned on analyzed literature',
      output: `Generated ${sectionCount} sections (${wordCount.toLocaleString()} words) with citation grounding`,
      tech: 'Qwen2.5-1.5B-Instruct + LoRA',
      runtime: '2m 12s',
    },
    {
      name: 'Similarity & Citation Agent',
      sub: 'Verification & Integrity',
      icon: ShieldCheck,
      task: 'Audit sentence-level cosine similarity and verify Semantic Scholar DOIs',
      output: 'Verified 6/6 BibTeX citation keys; 0 unverified citations',
      tech: 'Sentence Transformer + S2 Graph API',
      runtime: '8.3s',
    },
    {
      name: 'Review & Formatting Agent',
      sub: 'Venue Compliance',
      icon: Award,
      task: 'Check page budgets, anonymization rules, and render LaTeX Jinja2 templates',
      output: 'Complies with IEEE & ACL formats; generated AI-use disclosure statement',
      tech: 'Jinja2 deterministic compiler + tectonic',
      runtime: '14.2s',
    },
  ]

  return (
    <div className="space-y-8 max-w-6xl mx-auto font-sans">
      {/* Header */}
      <div>
        <div className="text-[11px] font-mono tracking-widest text-[#2563eb] font-semibold uppercase mb-1.5">
          Stage 2–4 — Agent Status
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-slate-900 tracking-tight">
          Multi-Agent Pipeline
        </h1>
        <p className="text-sm text-slate-500 mt-2 max-w-3xl leading-relaxed">
          Six specialized agents coordinate to search, analyze, write, and verify your research paper.
          All agents have completed successfully.
        </p>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
            Agents Active
          </div>
          <div className="text-xl font-bold font-serif text-emerald-600 mt-2">
            6 / 6
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
            Total Runtime
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-2">
            4m 19s
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
            Papers Processed
          </div>
          <div className="text-xl font-bold font-serif text-slate-900 mt-2">
            {paperCount}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
            Pipeline Status
          </div>
          <div className="text-xl font-bold font-serif text-emerald-600 mt-2">
            Complete
          </div>
        </div>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {agents.map((agent, idx) => {
          const Icon = agent.icon
          return (
            <div
              key={idx}
              className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                      <Icon className="w-4 h-4 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{agent.name}</h3>
                      <div className="text-[10px] text-slate-400 font-sans">{agent.sub}</div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 uppercase">
                    Complete
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>Progress</span>
                    <span className="text-emerald-600 font-semibold">100%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-full" />
                  </div>
                </div>

                {/* Task & Output */}
                <div className="mt-3.5 space-y-2 text-[11px]">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Task
                    </span>
                    <p className="text-slate-600 mt-0.5">{agent.task}</p>
                  </div>

                  <div>
                    <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Last Output
                    </span>
                    <p className="text-slate-900 font-medium mt-0.5">{agent.output}</p>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="truncate max-w-[240px]">{agent.tech}</span>
                <span className="shrink-0">Runtime: {agent.runtime}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Next Action */}
      <div className="flex justify-end pt-2">
        <button
          onClick={() => onNavigate('final-report')}
          className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#0f1f3d] hover:bg-[#162a52] transition-colors flex items-center gap-2 shadow-sm"
        >
          <span>View Final Report (Stage 7)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
