import React, { useState } from 'react'
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  Compass,
  Feather,
  FileCheck2,
  Layers,
  Sparkles,
  Check,
  ExternalLink,
  FileText,
  Scale,
} from 'lucide-react'
import { User, TopicUniquenessResponse } from '../types'
import { apiComputeUniqueness } from '../api'

interface LandingPageProps {
  user: User | null
  onStart: () => void
  onOpenAuth: (mode: 'login' | 'signup') => void
}

const SAMPLE_TOPICS = [
  {
    label: 'Quantum Molecular Docking',
    title: 'Parameterized Quantum Circuits for Non-Covalent Molecular Docking',
    abstract:
      'We introduce a symmetry-preserving variational quantum eigensolver architecture for predicting ligand-receptor binding affinities across flexible protein pockets on the ChEMBL benchmark.',
  },
  {
    label: 'Clinical EHR Summarization',
    title: 'Long-Context Discourse Grounding for Clinical Narrative Summarization',
    abstract:
      'We propose an entity-calibrated sparse attention mechanism for longitudinal electronic health record synthesis, mitigating clinical hallucination across multi-admission ICU discharge notes.',
  },
  {
    label: 'Federated Differential Privacy',
    title: 'Adaptive Gradient Clipping in Heterogeneous Federated Healthcare Silos',
    abstract:
      'We formulate a Rényi differential privacy accounting protocol for non-IID clinical imaging networks, preserving diagnostic AUC parity under strict epsilon-delta privacy budgets.',
  },
]

const VENUE_ARCH_CARDS = [
  {
    id: 'ieee',
    name: 'IEEE Proceedings',
    badge: 'Two-Column Standard',
    spec: 'Roman Section Numerals',
    features: [
      'US Letter two-column IEEEtran layout',
      'Numeric bracket citations [1], [2]',
      'Inline bold-italic Abstract & Index Terms',
      'Calibrated to your exact page target',
    ],
    featured: false,
  },
  {
    id: 'acl',
    name: 'ACL / EMNLP',
    badge: 'Double-Blind Review',
    spec: 'Author–Year Citations',
    features: [
      'A4 two-column anonymized submission',
      'Continuous review margin line numbers',
      'Parenthetical citations (Author, Year)',
      'Dedicated Limitations & Ethics section',
    ],
    featured: true,
  },
  {
    id: 'acm',
    name: 'ACM SIGCONF',
    badge: 'sigconf Proceedings',
    spec: 'CCS & Rights Block',
    features: [
      'Two-column acmart sigconf typography',
      'ACM Reference Format & CCS concepts',
      'Double-blind anonymous author header',
      'Export to PDF, DOCX, LaTeX & HTML',
    ],
    featured: false,
  },
  {
    id: 'lncs',
    name: 'Springer LNCS',
    badge: 'Single-Column Monograph',
    spec: 'Wide Margin Book Style',
    features: [
      'Single-column llncs book proportions',
      'Alternating running heads & institutes',
      'Indented Abstract & middle-dot keywords',
      'Exact page budget calibration (1–30 pp)',
    ],
    featured: false,
  },
]

export const LandingPage: React.FC<LandingPageProps> = ({ user, onStart, onOpenAuth }) => {
  const [testTitle, setTestTitle] = useState(SAMPLE_TOPICS[0].title)
  const [testAbstract, setTestAbstract] = useState(SAMPLE_TOPICS[0].abstract)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TopicUniquenessResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRunTest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testTitle.trim() || !testAbstract.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiComputeUniqueness({
        title: testTitle,
        abstract: testAbstract,
        overlap_threshold: 0.75,
      })
      setResult(res)
    } catch (err: any) {
      setError(err.message || 'Unable to compute uniqueness score right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#261C16] font-sans selection:bg-[#EADFD2]">
      {/* ================= HERO SECTION (Warm Espresso-Bronze Frame) ================= */}
      <section className="bg-espresso-hero p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto rounded-[28px] border border-white/25 bg-white/[0.03] p-5 sm:p-8 lg:p-10 relative overflow-hidden">
          {/* Subtle decorative radial light inside frame */}
          <div className="pointer-events-none absolute -top-24 right-1/4 w-96 h-96 rounded-full bg-[#D8B898]/15 blur-3xl" />

          {/* Floating White Pill Navigation Bar */}
          <header className="bg-white/95 backdrop-blur-md rounded-full px-4 sm:px-7 py-2.5 flex items-center justify-between shadow-[0_8px_30px_rgba(38,28,22,0.12)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#3D281D] text-[#FAF7F2] flex items-center justify-center font-display font-semibold text-base">
                S
              </div>
              <span className="font-display font-semibold text-xl tracking-tight text-[#261C16]">
                ScholarForge
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-[#6E6055]">
              <a href="#features" className="hover:text-[#261C16] transition-colors">
                Methodology
              </a>
              <a href="#craft" className="hover:text-[#261C16] transition-colors">
                Architecture
              </a>
              <a href="#pipeline" className="hover:text-[#261C16] transition-colors">
                Novelty Lab
              </a>
              <a href="#venues" className="hover:text-[#261C16] transition-colors">
                Venue Formats
              </a>
            </nav>

            <div className="flex items-center gap-2">
              {user ? (
                <button
                  onClick={onStart}
                  className="px-5 py-2 rounded-full bg-[#3D281D] hover:bg-[#2B1B12] text-[#FAF7F2] text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <span>Open Studio</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onOpenAuth('login')}
                    className="hidden sm:inline-flex px-4 py-2 rounded-full text-xs font-medium text-[#4A3728] hover:text-[#261C16] transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={onStart}
                    className="px-5 py-2 rounded-full bg-[#3D281D] hover:bg-[#2B1B12] text-[#FAF7F2] text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <span>Enter Workspace</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </header>

          {/* Hero Grid Content */}
          <div className="mt-12 sm:mt-16 lg:mt-20 mb-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Column: Editorial Headline & Paired Pill CTAs */}
            <div className="lg:col-span-7 space-y-6 text-[#FAF7F2]">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] tracking-[0.16em] uppercase text-[#EFE6DA]">
                <span>Empirical Academic Research Studio</span>
              </div>

              <h1 className="font-display text-4xl sm:text-6xl lg:text-[66px] font-normal leading-[1.04] tracking-tight text-[#FDFBF7]">
                Your Sanctuary For{' '}
                <span className="italic font-normal text-[#EADFD2]">Grounded</span> Academic
                Scholarship
              </h1>

              <p className="text-sm sm:text-base text-[#E6DDD0]/90 max-w-xl leading-relaxed font-normal">
                Compose literature-backed manuscripts with quiet precision. Seven specialized research
                agents retrieve real Semantic Scholar papers, calibrate empirical novelty, verify
                every BibTeX citation, and typeset your exact page count across IEEE, ACL, ACM, and
                Springer LNCS.
              </p>

              {/* Pill Button + Circular Icon Pair */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-1.5">
                  <button
                    onClick={onStart}
                    className="px-7 py-3.5 rounded-full bg-white hover:bg-[#FAF7F2] text-[#261C16] text-xs font-semibold tracking-wide transition-all shadow-sm"
                  >
                    Let&apos;s Get Started
                  </button>
                  <button
                    onClick={onStart}
                    aria-label="Launch Workspace"
                    className="w-11 h-11 rounded-full bg-white/90 hover:bg-white text-[#261C16] flex items-center justify-center transition-all shadow-sm"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

                <a
                  href="#pipeline"
                  className="px-5 py-3.5 rounded-full border border-white/30 hover:bg-white/10 text-[#FDFBF7] text-xs font-medium transition-colors"
                >
                  Test Topic Uniqueness
                </a>
              </div>
            </div>

            {/* Right Column: Floating Editorial Cards & Rating Badge */}
            <div className="lg:col-span-5 relative flex flex-col items-end gap-4">
              {/* Top Floating Rating Pill (mirrors 4.5 ★ badge in reference) */}
              <div className="self-start lg:self-auto bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl px-4 py-3 text-[#FDFBF7] max-w-xs shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="font-display text-2xl font-semibold">4.8 ★</span>
                  <span className="text-[11px] uppercase tracking-wider text-[#EADFD2] font-medium">
                    RINoBench Calibrated
                  </span>
                </div>
                <p className="text-[11px] text-[#E6DDD0]/90 mt-1 leading-snug">
                  Isotonic regression novelty scoring grounded against 200M+ Semantic Scholar
                  records.
                </p>
              </div>

              {/* Main Manuscript Preview Card */}
              <div className="w-full bg-[#FAF7F2] text-[#261C16] rounded-3xl p-6 shadow-[0_20px_50px_rgba(28,19,14,0.28)] border border-white/60 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E6DDD0] pb-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.15em] text-[#8C6B4F] font-semibold block">
                      Live Typesetting Engine
                    </span>
                    <h3 className="font-display text-xl font-semibold text-[#261C16]">
                      Multi-Venue Manuscript Calibration
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#EADFD2] text-[#3D281D] text-[11px] font-medium">
                    1–30 Pages
                  </span>
                </div>

                {/* Miniature 2-column vs 1-column visual preview */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white border border-[#E6DDD0] space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-medium text-[#6E6055]">
                      <span>IEEE / ACL / ACM</span>
                      <span className="text-[#8C6B4F]">2-Col</span>
                    </div>
                    <div className="h-2 w-3/4 mx-auto rounded bg-[#3D281D]/80" />
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <div className="space-y-1">
                        <div className="h-1.5 rounded bg-[#D8CBB8]" />
                        <div className="h-1.5 rounded bg-[#E6DDD0]" />
                        <div className="h-1.5 w-4/5 rounded bg-[#D8CBB8]" />
                      </div>
                      <div className="space-y-1">
                        <div className="h-1.5 rounded bg-[#E6DDD0]" />
                        <div className="h-1.5 rounded bg-[#D8CBB8]" />
                        <div className="h-1.5 w-3/4 rounded bg-[#E6DDD0]" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#E6DDD0] space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-medium text-[#6E6055]">
                      <span>LNCS / Preprint</span>
                      <span className="text-[#8C6B4F]">1-Col</span>
                    </div>
                    <div className="h-2 w-2/3 mx-auto rounded bg-[#3D281D]/80" />
                    <div className="space-y-1 pt-1 px-2">
                      <div className="h-1.5 rounded bg-[#D8CBB8]" />
                      <div className="h-1.5 rounded bg-[#E6DDD0]" />
                      <div className="h-1.5 w-5/6 rounded bg-[#D8CBB8]" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs text-[#6E6055]">
                  <span>Exports: PDF • DOCX • LaTeX • HTML • MD • BibTeX</span>
                  <button
                    onClick={onStart}
                    className="inline-flex items-center gap-1 font-semibold text-[#3D281D] hover:underline"
                  >
                    <span>Try Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 4-COLUMN FEATURE STRIP (Warm Linen Bar) ================= */}
      <section id="features" className="bg-[#F3ECE2] border-b border-[#E6DDD0]">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#DFD3C3]">
          {[
            {
              icon: Compass,
              title: 'Semantic Scholar Discovery',
              desc: 'Dense BGE-small reranking retrieves high-relevance peer-reviewed literature with real DOIs and venue records.',
            },
            {
              icon: Scale,
              title: 'Empirical Novelty Scoring',
              desc: 'Computes cosine overlap against top candidate papers and calibrates a 1–5 novelty rating on RINoBench.',
            },
            {
              icon: Feather,
              title: 'Grounded Section Synthesis',
              desc: 'Two-stage outline and LaTeX drafting conditioned strictly on retrieved abstracts and your experimental notes.',
            },
            {
              icon: FileCheck2,
              title: 'Exact-Page Venue Formatting',
              desc: 'Closed-loop compilation scales prose and typography to match your target page count (1–30 pages).',
            },
          ].map((item, idx) => {
            const Icon = item.icon
            return (
              <div
                key={idx}
                className={`py-6 sm:py-2 ${
                  idx === 0 ? 'sm:pr-6' : idx === 3 ? 'sm:pl-6' : 'sm:px-6'
                } flex flex-col items-start gap-3`}
              >
                <div className="w-11 h-11 rounded-full bg-[#E5D7C6] text-[#3D281D] flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-xl font-semibold text-[#261C16]">{item.title}</h3>
                <p className="text-xs text-[#6E6055] leading-relaxed">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ================= EDITORIAL ASYMMETRIC SHOWCASE SECTION ================= */}
      <section id="craft" className="max-w-7xl mx-auto px-6 py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Editorial Narrative + Stats */}
          <div className="lg:col-span-5 space-y-6">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[#8C6B4F] font-semibold">
              Methodological Integrity
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-normal text-[#261C16] leading-[1.08]">
              The Art Of Empirical Refinement
            </h2>
            <p className="text-sm text-[#6E6055] leading-relaxed">
              Academic writing demands verifiable provenance rather than generic prose. ScholarForge
              separates literature discovery, aspect extraction, novelty calibration, and citation
              auditing into transparent stages—giving you complete editorial authority over every
              claim and equation.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={onStart}
                className="px-6 py-3 rounded-full bg-[#3D281D] hover:bg-[#2B1B12] text-[#FAF7F2] text-xs font-medium transition-colors"
              >
                Launch Research Studio
              </button>
              <button
                onClick={onStart}
                aria-label="Open Studio"
                className="w-10 h-10 rounded-full bg-[#EADFD2] hover:bg-[#DFD0BE] text-[#3D281D] flex items-center justify-center transition-colors"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* Clean 3-Stat Row */}
            <div className="pt-6 border-t border-[#E6DDD0] grid grid-cols-3 gap-4">
              <div>
                <div className="font-display text-3xl sm:text-4xl font-semibold text-[#261C16]">
                  7 Agents
                </div>
                <div className="text-[11px] text-[#8C7D70] mt-0.5">Section 4 Pipeline</div>
              </div>
              <div>
                <div className="font-display text-3xl sm:text-4xl font-semibold text-[#261C16]">
                  100%
                </div>
                <div className="text-[11px] text-[#8C7D70] mt-0.5">Verified BibTeX Keys</div>
              </div>
              <div>
                <div className="font-display text-3xl sm:text-4xl font-semibold text-[#261C16]">
                  6 Formats
                </div>
                <div className="text-[11px] text-[#8C7D70] mt-0.5">PDF, DOCX, TeX &amp; More</div>
              </div>
            </div>
          </div>

          {/* Center Column: Tall Arched Manuscript Showcase Card */}
          <div className="lg:col-span-4">
            <div className="rounded-[32px] bg-[#EFE6DA] border border-[#E2D6C5] p-6 sm:p-7 shadow-xs space-y-5">
              <div className="rounded-2xl bg-white border border-[#E6DDD0] p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between text-[10px] text-[#8C6B4F] uppercase tracking-widest font-semibold">
                  <span>Compiled Manuscript Excerpt</span>
                  <span>IEEE / ACL</span>
                </div>
                <div className="font-display text-lg font-semibold text-[#261C16] leading-snug">
                  I. INTRODUCTION &amp; PROBLEM FORMULATION
                </div>
                <p className="text-[11px] text-[#6E6055] leading-relaxed font-serif">
                  Let $\mathcal&#123;D&#125; = \&#123;(x_i, y_i)\&#125;_&#123;i=1&#125;^N$ denote a corpus of
                  empirical observations grounded in retrieved literature. By bounding sentence-level
                  cosine similarity below $\tau = 0.82$, our synthesis engine preserves original
                  phrasing while anchoring every assertion to verified bibliography entries.
                </p>
                <div className="pt-2 border-t border-[#F3ECE2] flex items-center justify-between text-[10px] text-[#8C7D70]">
                  <span>Citation Audit: Passed</span>
                  <span className="text-[#3D281D] font-semibold">0 Hallucinations</span>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <div>
                  <div className="font-display text-lg font-semibold text-[#261C16]">
                    Closed-Loop Page Calibration
                  </div>
                  <div className="text-xs text-[#6E6055]">
                    Choose any target length from 1 to 30 pages
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#3D281D] text-[#FAF7F2] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Checklist + Secondary Card */}
          <div className="lg:col-span-3 space-y-6">
            <ul className="space-y-3.5">
              {[
                'Direct Semantic Scholar Graph API literature retrieval',
                'Aspect-based extraction of problems, methods & limitations',
                'Sentence-level cosine paraphrase & overlap auditing',
                'Distinct typography for IEEE, ACL, ACM, LNCS & arXiv',
                'Instant download in PDF, Word (.docx), LaTeX (.tex), HTML & MD',
              ].map((point, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-[#4A3728] leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-[#EADFD2] text-[#3D281D] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <div className="rounded-3xl bg-[#F3ECE2] border border-[#E6DDD0] p-5 space-y-2">
              <div className="text-[10px] uppercase tracking-[0.15em] text-[#8C6B4F] font-semibold">
                Local Persistence
              </div>
              <div className="font-display text-xl font-semibold text-[#261C16]">
                Private Research Workspace
              </div>
              <p className="text-xs text-[#6E6055] leading-relaxed">
                All projects, drafts, and API keys persist locally in your SQLite database with
                zero external lock-in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= WARM SAND ROUNDED CONTAINER: PIPELINE & LIVE NOVELTY LAB ================= */}
      <section id="pipeline" className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="rounded-[36px] bg-[#EFE6DA] border border-[#E2D6C5] p-6 sm:p-10 lg:p-14 space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[#8C6B4F] font-semibold">
              Autonomous Multi-Agent Workflow
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-normal text-[#261C16]">
              Our Research Pipeline
            </h2>
            <p className="text-xs sm:text-sm text-[#6E6055] leading-relaxed">
              Explore the three core pillars of ScholarForge below, or test our live Topic
              Uniqueness &amp; Literature Evaluator directly in your browser.
            </p>
          </div>

          {/* 3 Editorial Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                tag: 'Stages 1 – 3',
                title: 'Literature & Aspect Analysis',
                desc: 'Queries Semantic Scholar, reranks candidate papers with BGE-small embeddings, and extracts structured claims, datasets, and limitations.',
              },
              {
                icon: Sparkles,
                tag: 'Stages 4 – 5',
                title: 'Novelty & Grounded Drafting',
                desc: 'Calibrates empirical originality on RINoBench and synthesizes multi-section academic prose scaled to your exact page target.',
              },
              {
                icon: Layers,
                tag: 'Stages 6 – 7',
                title: 'Citation Audit & Venue Export',
                desc: 'Verifies every in-text citation against BibTeX records and compiles publication-ready PDF, Word DOCX, and LaTeX manuscripts.',
              },
            ].map((card, i) => {
              const Icon = card.icon
              return (
                <div
                  key={i}
                  className="rounded-3xl bg-[#FAF7F2] border border-[#E6DDD0] p-6 flex flex-col justify-between space-y-6 shadow-2xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-[#EADFD2] text-[#3D281D] text-[10px] uppercase tracking-wider font-semibold">
                        {card.tag}
                      </span>
                      <div className="w-9 h-9 rounded-full bg-white border border-[#E6DDD0] flex items-center justify-center text-[#3D281D]">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="font-display text-2xl font-semibold text-[#261C16]">
                      {card.title}
                    </h3>
                    <p className="text-xs text-[#6E6055] leading-relaxed">{card.desc}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#E6DDD0]">
                    <button
                      onClick={onStart}
                      className="text-xs font-semibold text-[#3D281D] hover:underline"
                    >
                      Open in Studio
                    </button>
                    <button
                      onClick={onStart}
                      aria-label={card.title}
                      className="w-8 h-8 rounded-full bg-[#3D281D] text-[#FAF7F2] flex items-center justify-center hover:bg-[#2B1B12] transition-colors"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Interactive Live Topic Uniqueness Evaluator Card */}
          <div className="rounded-3xl bg-white border border-[#E6DDD0] p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#E6DDD0]">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-[#8C6B4F] font-semibold">
                  Interactive Sandbox • Agent 1 &amp; Agent 3
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[#261C16] mt-0.5">
                  Live Topic Uniqueness &amp; Literature Check
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-[#8C7D70] mr-1">Sample topics:</span>
                {SAMPLE_TOPICS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTestTitle(s.title)
                      setTestAbstract(s.abstract)
                    }}
                    className="px-3 py-1.5 rounded-full bg-[#FAF7F2] hover:bg-[#EADFD2] border border-[#E6DDD0] text-[11px] font-medium text-[#4A3728] transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleRunTest} className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#4A3728] mb-1.5">
                    Proposed Paper Title
                  </label>
                  <input
                    type="text"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    placeholder="Enter your research paper title..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E6DDD0] text-sm text-[#261C16] focus:outline-none focus:border-[#8C6B4F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A3728] mb-1.5">
                    Research Abstract or Hypothesis
                  </label>
                  <textarea
                    rows={3}
                    value={testAbstract}
                    onChange={(e) => setTestAbstract(e.target.value)}
                    placeholder="Summarize your core methodology and experimental scope..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E6DDD0] text-sm text-[#261C16] focus:outline-none focus:border-[#8C6B4F] resize-none"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-full bg-[#3D281D] hover:bg-[#2B1B12] text-[#FAF7F2] text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Evaluating Literature...' : 'Evaluate Topic Uniqueness'}
                  </button>
                  <button
                    type="button"
                    onClick={onStart}
                    className="px-5 py-2.5 rounded-full bg-[#F3ECE2] hover:bg-[#EADFD2] text-[#3D281D] text-xs font-medium transition-colors"
                  >
                    Draft Full Manuscript in Studio &rarr;
                  </button>
                </div>
                {error && <p className="text-xs text-rose-700">{error}</p>}
              </div>

              {/* Right Column: Live Score Output */}
              <div className="lg:col-span-5 rounded-2xl bg-[#FAF7F2] border border-[#E6DDD0] p-5 flex flex-col justify-between">
                {result ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E6DDD0] pb-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#8C7D70] block">
                          Originality Score
                        </span>
                        <span className="font-display text-3xl font-semibold text-[#261C16]">
                          {(result.uniqueness_score / 100).toFixed(3)}{' '}
                          <span className="text-xs font-sans font-normal text-[#8C7D70]">
                            / 1.000
                          </span>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider text-[#8C7D70] block">
                          RINoBench Rating
                        </span>
                        <span className="font-display text-2xl font-semibold text-[#8C6B4F]">
                          {result.calibrated_novelty_rating.toFixed(2)} / 5.0 ★
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] font-medium text-[#4A3728]">
                        Closest Retrieved Literature ({result.recommended_papers.length} papers):
                      </div>
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {result.recommended_papers.slice(0, 3).map((p, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-white border border-[#E6DDD0] text-xs flex items-start justify-between gap-2"
                          >
                            <div className="line-clamp-1 font-medium text-[#261C16]">{p.title}</div>
                            {p.url && (
                              <a
                                href={p.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#8C6B4F] hover:text-[#3D281D] shrink-0"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="my-auto text-center py-6 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-[#EADFD2] text-[#3D281D] flex items-center justify-center mx-auto">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="font-display text-xl font-semibold text-[#261C16]">
                      Ready for Empirical Evaluation
                    </div>
                    <p className="text-xs text-[#6E6055] max-w-xs mx-auto leading-relaxed">
                      Click &ldquo;Evaluate Topic Uniqueness&rdquo; to query Semantic Scholar and
                      compute your topic&apos;s calibrated novelty rating.
                    </p>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ================= ARCHED VENUE CARDS SECTION ("Choose The Venue Format!") ================= */}
      <section id="venues" className="max-w-7xl mx-auto px-6 pb-24">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#8C6B4F] font-semibold">
            Publication-Ready Typesetting
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-normal text-[#261C16]">
            Choose Your Venue Format
          </h2>
          <p className="text-xs sm:text-sm text-[#6E6055] leading-relaxed">
            Each conference profile applies authentic column geometry, section numbering, citation
            brackets, and anonymization policies—calibrated to your exact page count.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {VENUE_ARCH_CARDS.map((v) => (
            <div
              key={v.id}
              className={`rounded-t-[120px] rounded-b-[28px] pt-14 pb-7 px-6 flex flex-col justify-between transition-all border ${
                v.featured
                  ? 'bg-[#3D281D] text-[#FAF7F2] border-[#3D281D] shadow-[0_18px_40px_rgba(61,40,29,0.18)]'
                  : 'bg-[#F3ECE2] text-[#261C16] border-[#E2D6C5] hover:border-[#C8B29B]'
              }`}
            >
              <div className="text-center space-y-3">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold ${
                    v.featured
                      ? 'bg-white/15 text-[#EADFD2]'
                      : 'bg-[#EADFD2] text-[#4A3728]'
                  }`}
                >
                  {v.badge}
                </span>
                <h3 className="font-display text-3xl font-semibold">{v.name}</h3>
                <div
                  className={`text-xs font-medium pb-4 border-b ${
                    v.featured
                      ? 'text-[#EADFD2] border-white/15'
                      : 'text-[#8C6B4F] border-[#DFD3C3]'
                  }`}
                >
                  {v.spec}
                </div>

                <ul className="space-y-2.5 text-left pt-2">
                  {v.features.map((feat, idx) => (
                    <li
                      key={idx}
                      className={`flex items-start gap-2 text-xs leading-snug ${
                        v.featured ? 'text-[#E6DDD0]' : 'text-[#6E6055]'
                      }`}
                    >
                      <Check
                        className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                          v.featured ? 'text-[#EADFD2]' : 'text-[#8C6B4F]'
                        }`}
                      />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8 flex items-center justify-center gap-2">
                <button
                  onClick={onStart}
                  className={`flex-1 py-3 px-4 rounded-full text-xs font-semibold transition-colors ${
                    v.featured
                      ? 'bg-white text-[#261C16] hover:bg-[#FAF7F2]'
                      : 'bg-[#3D281D] text-[#FAF7F2] hover:bg-[#2B1B12]'
                  }`}
                >
                  Select {v.name.split(' ')[0]}
                </button>
                <button
                  onClick={onStart}
                  aria-label={`Select ${v.name}`}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    v.featured
                      ? 'bg-white/15 text-white hover:bg-white/25'
                      : 'bg-[#EADFD2] text-[#3D281D] hover:bg-[#DFD0BE]'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= MINIMALIST EDITORIAL FOOTER ================= */}
      <footer className="bg-[#EFE6DA] border-t border-[#E2D6C5] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6E6055]">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-[#3D281D] text-[#FAF7F2] flex items-center justify-center font-display font-semibold text-xs">
              S
            </div>
            <span className="font-display font-semibold text-base text-[#261C16]">
              ScholarForge
            </span>
            <span className="text-[#8C7D70]">•</span>
            <span>Multi-Agent Academic Research Studio</span>
          </div>
          <div className="flex items-center gap-6">
            <span>IEEE • ACL • ACM • Springer LNCS • arXiv</span>
            <button
              onClick={onStart}
              className="font-semibold text-[#3D281D] hover:underline"
            >
              Enter Studio &rarr;
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
