import React, { useState, useEffect } from 'react'
import { Menu, FolderPlus, Key, ArrowUpRight } from 'lucide-react'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Shared Research State across agents
  const [projectId, setProjectId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [abstract, setAbstract] = useState('')
  const [userNotes, setUserNotes] = useState('')
  const [venue, setVenue] = useState('ieee')
  const [targetPages, setTargetPages] = useState(6)
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
      if (p.draft) {
        setDraft(p.draft)
        if (p.draft.target_pages) {
          setTargetPages(p.draft.target_pages)
        }
      }
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
    setTargetPages(6)
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
    dashboard: 'Research Studio Overview',
    project: 'Project Configuration',
    'agent-status': 'Literature & Agent Pipeline',
    workspace: 'Manuscript Workspace',
    'final-check': 'Novelty & Citation Audit',
    'final-report': 'Venue Formatting & Export',
  }

  const computedCitationCount =
    draft?.bibtex_entries?.length ||
    draft?.citation_verifications?.length ||
    (draft?.bibtex_content ? (draft.bibtex_content.match(/@\w+\s*\{/g) || []).length : 0) ||
    papers.length

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#261C16] font-sans flex flex-col">
      {isLanding ? (
        <LandingPage
          user={user}
          onStart={() => setIsLanding(false)}
          onOpenAuth={handleOpenAuth}
        />
      ) : (
        <div className="flex-1 flex min-h-screen">
          {/* Warm Editorial Sidebar */}
          <Sidebar
            currentView={currentNav}
            onNavigate={setCurrentNav}
            user={user}
            onOpenAuth={handleOpenAuth}
            onLogout={handleLogout}
            onGoToLanding={() => setIsLanding(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
          />

          {/* Main Content Column */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#FAF7F2]">
            {/* Top Editorial Bar */}
            <header className="h-16 border-b border-[#E6DDD0] bg-[#FAF7F2]/90 backdrop-blur-md sticky top-0 z-30 px-6 sm:px-10 flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden p-2 rounded-full bg-[#F3ECE2] border border-[#E6DDD0] text-[#6E6055] hover:text-[#261C16]"
                >
                  <Menu className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2.5 truncate">
                  <span className="font-display text-lg font-semibold text-[#261C16] truncate">
                    {stageNames[currentNav]}
                  </span>
                  {title && (
                    <>
                      <span className="hidden md:inline text-[#C8B29B]">•</span>
                      <span className="hidden md:inline text-xs text-[#8C7D70] truncate max-w-[280px]">
                        {title}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="px-4 py-2 rounded-full bg-white hover:bg-[#F3ECE2] border border-[#E6DDD0] text-[#4A3728] text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Key className="w-3.5 h-3.5 text-[#8C6B4F]" />
                  <span className="hidden sm:inline">API &amp; Keys</span>
                </button>
                <div className="inline-flex items-center gap-1">
                  <button
                    onClick={handleNewProject}
                    className="px-4 py-2 rounded-full bg-[#3D281D] hover:bg-[#2B1B12] text-[#FAF7F2] text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-[#EADFD2]" />
                    <span>New Manuscript</span>
                  </button>
                  <button
                    onClick={handleNewProject}
                    aria-label="New Manuscript"
                    className="hidden sm:flex w-8 h-8 rounded-full bg-[#EADFD2] hover:bg-[#DFD0BE] text-[#3D281D] items-center justify-center transition-colors"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </header>

            <main className="flex-1 p-6 sm:p-10 overflow-y-auto bg-ivory-canvas">
              {currentNav === 'dashboard' && (
                <DashboardView
                  onNavigate={setCurrentNav}
                  currentStageName={stageNames[currentNav]}
                  papersCount={papers.length}
                  uniquenessScore={uniqueness ? uniqueness.uniqueness_score : null}
                  citationCount={computedCitationCount}
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
                  targetPages={targetPages}
                  setTargetPages={setTargetPages}
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
                  setDraft={setDraft}
                  title={title}
                  abstract={abstract}
                  userNotes={userNotes}
                  papers={papers}
                  venue={venue}
                  setVenue={setVenue}
                  targetPages={targetPages}
                  setTargetPages={setTargetPages}
                />
              )}

              {currentNav === 'final-check' && (
                <FinalCheckView
                  onNavigate={setCurrentNav}
                  uniqueness={uniqueness}
                  papers={papers}
                  draft={draft}
                />
              )}

              {currentNav === 'final-report' && (
                <FinalReportView
                  title={title}
                  abstract={abstract}
                  venue={venue}
                  setVenue={setVenue}
                  draft={draft}
                  uniqueness={uniqueness}
                  targetPages={targetPages}
                  setTargetPages={setTargetPages}
                  onNavigate={setCurrentNav}
                />
              )}
            </main>
          </div>
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
