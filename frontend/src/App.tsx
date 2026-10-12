import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  Layers,
  FileText,
  Award,
  FileCheck,
  ChevronRight,
  BookOpen,
  Sparkles,
} from 'lucide-react'
import { Navbar } from './components/Navbar'
import { AuthModal } from './components/AuthModal'
import { LandingPage } from './components/LandingPage'
import { TopicUniquenessView } from './components/TopicUniquenessView'
import { PlanningView } from './components/PlanningView'
import { DraftingView } from './components/DraftingView'
import { ReviewView } from './components/ReviewView'
import { ExportView } from './components/ExportView'
import { apiGetMe, apiLogout } from './api'
import { User, Paper, PaperPlan, PaperDraft, ReviewCritique, SimilarityReport } from './types'

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [currentView, setCurrentView] = useState<'landing' | 'app'>('landing')
  const [activeTab, setActiveTab] = useState<'uniqueness' | 'plan' | 'draft' | 'review' | 'export'>(
    'uniqueness'
  )

  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  // Shared Paper Workflow State
  const [title, setTitle] = useState('Attention Is All You Need')
  const [abstract, setAbstract] = useState(
    'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on WMT 2014 English-to-German translation achieve 28.4 BLEU.'
  )
  const [userNotes, setUserNotes] = useState(
    'Comparison against seq2seq LSTM baselines with Bahdanau attention. Evaluated on WMT 2014 English-to-French (41.8 BLEU) and English-to-German.'
  )
  const [venue, setVenue] = useState('ieee')
  const [papers, setPapers] = useState<Paper[]>([])
  const [plan, setPlan] = useState<PaperPlan | null>(null)
  const [draft, setDraft] = useState<PaperDraft | null>(null)
  const [review, setReview] = useState<ReviewCritique | null>(null)
  const [similarity, setSimilarity] = useState<SimilarityReport | null>(null)

  useEffect(() => {
    apiGetMe().then((u) => {
      if (u) setUser(u)
    })
  }, [])

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setAuthModalOpen(true)
  }

  const handleAuthSuccess = (u: User) => {
    setUser(u)
    setCurrentView('app')
  }

  const handleLogout = async () => {
    await apiLogout()
    setUser(null)
    setCurrentView('landing')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        user={user}
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1">
        {currentView === 'landing' ? (
          <LandingPage
            onStart={() => {
              if (user) {
                setCurrentView('app')
              } else {
                handleOpenAuth('login')
              }
            }}
            onOpenAuth={handleOpenAuth}
          />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Workspace Header & Step Navigation */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-white tracking-tight">
                      Conference Paper Studio
                    </h1>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Working on: <span className="text-slate-200 font-medium">"{title || 'Untitled Draft'}"</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Venue:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold uppercase">
                    {venue}
                  </span>
                </div>
              </div>

              {/* Multi-Agent Workflow Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3">
                {[
                  {
                    id: 'uniqueness',
                    label: '1. Uniqueness & Literature',
                    icon: TrendingUp,
                    color: 'text-indigo-400',
                  },
                  {
                    id: 'plan',
                    label: '2. Decompose & Plan',
                    icon: Layers,
                    color: 'text-cyan-400',
                  },
                  {
                    id: 'draft',
                    label: '3. Grounded Drafting',
                    icon: FileText,
                    color: 'text-emerald-400',
                  },
                  {
                    id: 'review',
                    label: '4. Rubric & Similarity',
                    icon: Award,
                    color: 'text-amber-400',
                  },
                  {
                    id: 'export',
                    label: '5. Venue Export',
                    icon: FileCheck,
                    color: 'text-purple-400',
                  },
                ].map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 text-xs font-medium ${
                        isActive
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/25'
                          : 'bg-slate-950/70 border-slate-800/80 text-slate-300 hover:bg-slate-800/70'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : tab.color}`} />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Active Tab View */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl backdrop-blur-md">
              {activeTab === 'uniqueness' && (
                <TopicUniquenessView
                  title={title}
                  setTitle={setTitle}
                  abstract={abstract}
                  setAbstract={setAbstract}
                  userNotes={userNotes}
                  setUserNotes={setUserNotes}
                  onProceedToPlanning={(retrieved) => {
                    setPapers(retrieved)
                    setActiveTab('plan')
                  }}
                />
              )}

              {activeTab === 'plan' && (
                <PlanningView
                  title={title}
                  userNotes={userNotes}
                  papers={papers}
                  plan={plan}
                  setPlan={setPlan}
                  onProceedToDraft={() => setActiveTab('draft')}
                />
              )}

              {activeTab === 'draft' && (
                <DraftingView
                  title={title}
                  venue={venue}
                  setVenue={setVenue}
                  userNotes={userNotes}
                  papers={papers}
                  draft={draft}
                  setDraft={setDraft}
                  onProceedToReview={() => setActiveTab('review')}
                />
              )}

              {activeTab === 'review' && (
                <ReviewView
                  title={title}
                  abstract={abstract}
                  venue={venue}
                  draft={draft}
                  papers={papers}
                  review={review}
                  setReview={setReview}
                  similarity={similarity}
                  setSimilarity={setSimilarity}
                  onProceedToExport={() => setActiveTab('export')}
                />
              )}

              {activeTab === 'export' && (
                <ExportView
                  title={title}
                  abstract={abstract}
                  venue={venue}
                  setVenue={setVenue}
                  draft={draft}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 py-8 bg-slate-950/90 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-200">ScholarForge</span>
            <span>— Multi-Agent Assistant for Writing Conference Papers</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Powered by Groq LPUs & Semantic Scholar</span>
            <span>•</span>
            <span>100% Reproducible Research</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}
