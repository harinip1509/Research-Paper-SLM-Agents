import React from 'react'
import {
  LayoutDashboard,
  FolderGit2,
  Compass,
  FileEdit,
  ShieldCheck,
  FileText,
  LogOut,
  LogIn,
  Key,
  X,
  ArrowUpLeft,
} from 'lucide-react'
import { User } from '../types'

export type NavView =
  | 'dashboard'
  | 'project'
  | 'agent-status'
  | 'workspace'
  | 'final-check'
  | 'final-report'

interface SidebarProps {
  currentView: NavView
  onNavigate: (view: NavView) => void
  user: User | null
  onOpenAuth: (mode: 'login' | 'signup') => void
  onLogout: () => void
  onGoToLanding: () => void
  onOpenSettings?: () => void
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  user,
  onOpenAuth,
  onLogout,
  onGoToLanding,
  onOpenSettings,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const menuItems: {
    id: NavView
    label: string
    sub: string
    icon: React.FC<{ className?: string }>
  }[] = [
    { id: 'dashboard', label: 'Studio Overview', sub: 'Projects & Presets', icon: LayoutDashboard },
    { id: 'project', label: 'Project Setup', sub: 'Topic, Venue & Pages', icon: FolderGit2 },
    { id: 'agent-status', label: 'Literature & Agents', sub: 'Retrieval & Analysis', icon: Compass },
    { id: 'workspace', label: 'Paper Workspace', sub: 'Section Drafting', icon: FileEdit },
    { id: 'final-check', label: 'Novelty & Citations', sub: 'Provenance Audit', icon: ShieldCheck },
    { id: 'final-report', label: 'Format & Export', sub: 'PDF, DOCX, TeX, HTML', icon: FileText },
  ]

  const handleSelect = (id: NavView) => {
    onNavigate(id)
    if (onCloseMobile) onCloseMobile()
  }

  const sidebarContent = (
    <aside className="w-64 bg-[#F3ECE2] text-[#4A3728] flex flex-col justify-between shrink-0 min-h-screen border-r border-[#E6DDD0] font-sans select-none">
      <div>
        {/* Editorial Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-[#E6DDD0]">
          <div
            onClick={onGoToLanding}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-[#3D281D] text-[#FAF7F2] flex items-center justify-center font-display font-semibold text-base shadow-2xs group-hover:bg-[#2B1B12] transition-colors">
              S
            </div>
            <div>
              <span className="font-display font-semibold text-[#261C16] text-xl tracking-tight block leading-none">
                ScholarForge
              </span>
              <span className="text-[10px] text-[#8C7D70] tracking-[0.14em] uppercase block mt-0.5">
                Research Studio
              </span>
            </div>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-full text-[#8C7D70] hover:text-[#261C16] hover:bg-[#EADFD2]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Section Header */}
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <span className="text-[10px] tracking-[0.18em] text-[#8C7D70] uppercase font-semibold">
            Editorial Workflow
          </span>
        </div>

        {/* Nav Links */}
        <nav className="px-3.5 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-left transition-all ${
                  isActive
                    ? 'bg-[#3D281D] text-[#FAF7F2] shadow-xs'
                    : 'text-[#4A3728] hover:bg-[#EADFD2]/70 hover:text-[#261C16]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#EADFD2]' : 'text-[#8C6B4F]'
                    }`}
                  />
                  <div className="truncate">
                    <div className="text-xs font-medium leading-tight">{item.label}</div>
                    <div
                      className={`text-[10px] mt-0.5 truncate ${
                        isActive ? 'text-[#EADFD2]/80' : 'text-[#8C7D70]'
                      }`}
                    >
                      {item.sub}
                    </div>
                  </div>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EADFD2] shrink-0" />
                )}
              </button>
            )
          })}
        </nav>

        <div className="px-6 pt-4">
          <button
            onClick={onGoToLanding}
            className="w-full py-2 px-3.5 rounded-full border border-[#DFD3C3] bg-[#FAF7F2]/70 hover:bg-white text-[11px] font-medium text-[#6E6055] hover:text-[#261C16] transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowUpLeft className="w-3.5 h-3.5 text-[#8C6B4F]" />
            <span>Return to Landing Page</span>
          </button>
        </div>
      </div>

      {/* Footer / Auth & Config */}
      <div className="p-4 border-t border-[#E6DDD0] space-y-3 bg-[#EFE6DA]/60">
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium text-[#4A3728] bg-white hover:bg-[#FAF7F2] transition-colors border border-[#E6DDD0] shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-[#8C6B4F]" />
              <span>API Keys &amp; Database</span>
            </div>
            <span className="text-[10px] bg-[#F3ECE2] text-[#6E6055] px-2 py-0.5 rounded-full">
              Config
            </span>
          </button>
        )}

        {user ? (
          <div className="p-3 rounded-2xl bg-white border border-[#E6DDD0] flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-[#EADFD2] text-[#3D281D] flex items-center justify-center font-display font-semibold text-sm shrink-0">
                {(
                  user?.name?.trim()?.charAt(0) ||
                  user?.email?.trim()?.charAt(0) ||
                  'S'
                ).toUpperCase()}
              </div>
              <div className="truncate text-left text-xs">
                <div className="text-[#261C16] font-semibold truncate">
                  {user?.name?.trim() || user?.email?.trim() || 'Researcher'}
                </div>
                <div className="text-[10px] text-[#8C7D70] truncate">
                  {user?.institution?.trim() || 'Academic Scholar'}
                </div>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-[#8C7D70] hover:text-rose-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAuth('login')}
              className="flex-1 py-2.5 px-3 rounded-full text-xs font-medium bg-[#3D281D] hover:bg-[#2B1B12] text-[#FAF7F2] transition-colors flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => onOpenAuth('signup')}
              className="py-2.5 px-3.5 rounded-full text-xs font-medium text-[#3D281D] bg-white hover:bg-[#FAF7F2] border border-[#E6DDD0] transition-colors"
            >
              Register
            </button>
          </div>
        )}
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">{sidebarContent}</div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#261C16]/40 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  )
}
