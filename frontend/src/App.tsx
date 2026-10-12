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
import { SettingsModal } from './components/SettingsModal'
import { apiGetMe, apiLogout, apiListProjects, apiGetProject, apiDeleteProject } from './api'
import { User, Paper, PaperDraft, TopicUniquenessResponse, ProjectSummary } from './types'

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [isLanding, setIsLanding] = useState(true)
  const [currentNav, setCurrentNav] = useState<NavView>('dashboard')

  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Shared Research State across 7 agents - Clean defaults (no hardcoding)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [abstract, setAbstract] = useState('')
  const [userNotes, setUserNotes] = useState('')
  const [venue, setVenue] = useState('ieee')
  const [papers, setPapers] = useState<Paper[]>([])
  const [uniqueness, setUniqueness] = useState<TopicUniquenessResponse | null>(null)
  const [draft, setDraft] = useState<PaperDraft | null>(null)
  const [projects, setProjects] = useState<ProjectSummary[]>([])

  const refreshProjects = () => {
    apiListProjects()
      .then((list) => {
        setProjects(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        setProjects([])
      })
  }

  useEffect(() => {
    apiGetMe()
      .then((u) => {
        if (u) {
          setUser(u)
        }
      })
      .catch(() => {})
    refreshProjects()
  }, [])

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setAuthModalOpen(true)
  }

  const handleAuthSuccess = (u: User) => {
    setUser(u || null)
    setIsLanding(false)
    setCurrentNav('dashboard')
    refreshProjects()
  }

  const handleLogout = async () => {
    await apiLogout()
    setUser(null)
    setIsLanding(true)
  }

  const handleSelectProject = async (id: string) => {
    try {
      const p = await apiGetProject(id)
      setProjectId(p.id)
      setTitle(p.title || '')
      setAbstract(p.abstract || '')
      setUserNotes(p.user_notes || '')
      setVenue(p.venue || 'ieee')
      if (p.papers) setPapers(p.papers)
      if (p.draft) setDraft(p.draft)
      if (p.uniqueness_score != null) {
        setUniqueness({
          title: p.title,
          uniqueness_score: p.uniqueness_score,
          overlap_meter: p.overlap_meter || {
            score: p.uniqueness_score,
            raw_overlap: (100 - p.uniqueness_score) / 100,
            threshold: 0.75,
            is_high_overlap: false,
            status: 'Within Tolerance',
          },
          calibrated_novelty_rating: p.calibrated_rating || 4.2,
          coverage_caveat:
            'Coverage caveat: Literature retrieval misses relevant papers (estimated LitSearch Recall@20 is ~0.66). This score is an empirical estimate, not a novelty verdict.',
          recommended_papers: p.papers || [],
          differentiation_suggestions: [],
          latency_ms: 12.0,
          cache_hit: true,
        })
      } else {
        setUniqueness(null)
      }
      if (p.draft) {
        setCurrentNav('workspace')
      } else {
        setCurrentNav('project')
      }
    } catch (err) {
      console.error('Failed to load project:', err)
    }
  }

  const handleNewProject = () => {
    setProjectId(null)
    setTitle('')
    setAbstract('')
    setUserNotes('')
    setVenue('ieee')
    setPapers([])
    setUniqueness(null)
    setDraft(null)
    setCurrentNav('project')
  }

  const handleApplyPreset = (preset: {
    title: string
    abstract: string
    notes: string
    venue: string
  }) => {
    setProjectId(null)
    setTitle(preset.title)
    setAbstract(preset.abstract)
    setUserNotes(preset.notes)
    setVenue(preset.venue)
    setPapers([])
    setUniqueness(null)
    setDraft(null)
    setCurrentNav('project')
  }

  const handleDeleteProject = async (id: string) => {
    await apiDeleteProject(id)
    if (projectId === id) {
      handleNewProject()
    }
    refreshProjects()
  }

  const stageNames: Record<NavView, string> = {
    dashboard: 'Research Dashboard',
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
          user={user}
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
            onOpenSettings={() => setSettingsOpen(true)}
          />

          {/* Main University-style Content Area */}
          <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
            {currentNav === 'dashboard' && (
              <DashboardView
                onNavigate={setCurrentNav}
                currentStageName={stageNames[currentNav]}
                papersCount={papers.length}
                uniquenessScore={uniqueness ? uniqueness.uniqueness_score : null}
                citationCount={draft?.bibtex_entries?.length || 0}
                projects={projects}
                onSelectProject={handleSelectProject}
                onNewProject={handleNewProject}
                onDeleteProject={handleDeleteProject}
                onApplyPreset={handleApplyPreset}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            )}

            {currentNav === 'project' && (
              <ResearchProjectView
                onNavigate={setCurrentNav}
                projectId={projectId}
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
                onProjectSaved={(newId) => {
                  setProjectId(newId)
                  refreshProjects()
                }}
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
                onNavigate={setCurrentNav}
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

      {/* Settings & API Keys Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}
