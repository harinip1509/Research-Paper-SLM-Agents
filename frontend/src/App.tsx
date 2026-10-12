import React, { useState, useEffect } from 'react'
import { Sidebar, NavView } from './components/Sidebar'
import { DashboardView } from './components/DashboardView'
import { ResearchProjectView } from './components/ResearchProjectView'
import { AgentStatusView } from './components/AgentStatusView'
import { PaperWorkspaceView } from './components/PaperWorkspaceView'
import { FinalCheckView } from './components/FinalCheckView'
import { FinalReportView } from './components/FinalReportView'
import { LandingPage } from './components/LandingPage'
import { AuthModal } from './components/AuthModal'
import { apiGetMe, apiLogout } from './api'
import { User, Paper, PaperDraft, TopicUniquenessResponse } from './types'

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [isLanding, setIsLanding] = useState(false)
  const [currentNav, setCurrentNav] = useState<NavView>('dashboard')

  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  // Shared Research State across 7 agents
  const [title, setTitle] = useState(
    'Automated Synthesis of Biomedical Literature Using Instruction-Tuned Language Models'
  )
  const [abstract, setAbstract] = useState(
    'This paper presents ResearchFlow, a multi-agent framework for automated synthesis of biomedical literature and generation of structured research papers using instruction-tuned language models. Our system employs six specialized agents — Academic Search, Literature Analysis, Topic Uniqueness, Writing, Similarity Checking, and Review — coordinated through a shared research state. The Writing Agent leverages Qwen2.5-1.5B-Instruct with domain-specific LoRA adapters to produce citation-grounded paper sections, while the Similarity Agent uses Sentence Transformers with cosine similarity to detect and mitigate content overlap. Evaluation on 50 biomedical research scenarios demonstrates an average originality score of 0.87 and citation accuracy of 91.3%, with end-to-end paper generation completing in under 4 minutes.'
  )
  const [userNotes, setUserNotes] = useState(
    'Coordinated multi-agent state; LoRA on Qwen2.5-1.5B-Instruct; Sentence Transformer similarity check; evaluated against LitSearch, ACLSum, and RINoBench benchmarks.'
  )
  const [venue, setVenue] = useState('ieee')
  const [papers, setPapers] = useState<Paper[]>([])
  const [uniqueness, setUniqueness] = useState<TopicUniquenessResponse | null>(null)
  const [draft, setDraft] = useState<PaperDraft | null>(null)

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
    setIsLanding(false)
  }

  const handleLogout = async () => {
    await apiLogout()
    setUser(null)
  }

  const stageNames: Record<NavView, string> = {
    dashboard: 'Research Topic',
    project: 'Research Topic',
    'agent-status': 'Academic Search & Literature',
    workspace: 'Paper Writing',
    'final-check': 'Topic Uniqueness & Similarity',
    'final-report': 'Final Paper Export',
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col">
      {isLanding ? (
        <LandingPage
          onStart={() => setIsLanding(false)}
          onOpenAuth={handleOpenAuth}
        />
      ) : (
        <div className="flex-1 flex min-h-screen">
          {/* Exact Figma Navy Sidebar */}
          <Sidebar
            currentView={currentNav}
            onNavigate={setCurrentNav}
            user={user}
            onOpenAuth={handleOpenAuth}
            onLogout={handleLogout}
            onGoToLanding={() => setIsLanding(true)}
          />

          {/* Main University-style Content Area */}
          <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
            {currentNav === 'dashboard' && (
              <DashboardView
                onNavigate={setCurrentNav}
                currentStageName={stageNames[currentNav]}
                papersCount={papers.length > 0 ? papers.length : 6}
                uniquenessScore={uniqueness ? uniqueness.uniqueness_score : 87.2}
                citationCount={draft?.bibtex_entries?.length || 6}
              />
            )}

            {currentNav === 'project' && (
              <ResearchProjectView
                onNavigate={setCurrentNav}
                title={title}
                setTitle={setTitle}
                abstract={abstract}
                setAbstract={setAbstract}
                userNotes={userNotes}
                setUserNotes={setUserNotes}
                venue={venue}
                setVenue={setVenue}
                setPapers={setPapers}
                setUniqueness={setUniqueness}
                setDraft={setDraft}
              />
            )}

            {currentNav === 'agent-status' && (
              <AgentStatusView
                onNavigate={setCurrentNav}
                papers={papers}
                uniqueness={uniqueness}
                draft={draft}
              />
            )}

            {currentNav === 'workspace' && (
              <PaperWorkspaceView
                onNavigate={setCurrentNav}
                draft={draft}
              />
            )}

            {currentNav === 'final-check' && (
              <FinalCheckView
                onNavigate={setCurrentNav}
                uniqueness={uniqueness}
                papers={papers}
              />
            )}

            {currentNav === 'final-report' && (
              <FinalReportView
                title={title}
                abstract={abstract}
                venue={venue}
                draft={draft}
                uniqueness={uniqueness}
              />
            )}
          </main>
        </div>
      )}

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
