import React from 'react'
import {
  LayoutDashboard,
  FolderGit2,
  Cpu,
  FileEdit,
  ShieldCheck,
  FileText,
  LogOut,
  User as UserIcon,
  LogIn,
  Key,
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  user,
  onOpenAuth,
  onLogout,
  onGoToLanding,
  onOpenSettings,
}) => {
  const menuItems: { id: NavView; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'project', label: 'Research Project', icon: FolderGit2 },
    { id: 'agent-status', label: 'Agent Status', icon: Cpu },
    { id: 'workspace', label: 'Paper Workspace', icon: FileEdit },
    { id: 'final-check', label: 'Final Check', icon: ShieldCheck },
    { id: 'final-report', label: 'Final Report', icon: FileText },
  ]

  return (
    <aside className="w-64 bg-[#0f1f3d] text-slate-300 flex flex-col justify-between shrink-0 min-h-screen border-r border-[#1a2d52] font-sans">
      <div>
        {/* Brand */}
        <div
          onClick={onGoToLanding}
          className="p-5 flex items-center gap-3 cursor-pointer border-b border-[#1a2d52]/60 hover:bg-[#162a52]/40 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-[#2563eb] text-white flex items-center justify-center font-bold text-base shadow-sm">
            R
          </div>
          <div>
            <span className="font-semibold text-white text-base tracking-tight block">
              ResearchFlow AI
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase block">
              ScholarForge Core
            </span>
          </div>
        </div>

        {/* Section Header */}
        <div className="px-5 pt-6 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
            Workflow
          </span>
        </div>

        {/* Nav Links */}
        <nav className="px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#1e3a6a] text-white shadow-sm'
                    : 'text-slate-300 hover:bg-[#162a52] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#3b82f6]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-4 bg-[#2563eb] rounded-full" />
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Footer / Auth */}
      <div className="p-4 border-t border-[#1a2d52]/60 space-y-3">
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-[#162a52] hover:text-white transition-colors border border-transparent hover:border-[#203a6b]"
          >
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>API Keys & Database</span>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
              Config
            </span>
          </button>
        )}

        {user ? (
          <div className="p-2.5 rounded-lg bg-[#162a52]/80 border border-[#203a6b] flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <div className="w-7 h-7 rounded-full bg-[#2563eb]/30 border border-[#2563eb] flex items-center justify-center text-xs font-semibold text-white shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="truncate text-left text-xs">
                <div className="text-white font-medium truncate">{user.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{user.institution || 'Researcher'}</div>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAuth('login')}
              className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-[#2563eb] hover:bg-[#1d4ed8] text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => onOpenAuth('signup')}
              className="py-2 px-3 rounded-lg text-xs font-medium text-slate-300 bg-[#162a52] hover:bg-[#1e3a6a] hover:text-white transition-colors"
            >
              Register
            </button>
          </div>
        )}

        <div className="text-[11px] font-mono text-slate-400 leading-tight">
          <div className="text-slate-300 font-medium">ResearchFlow AI v1.0</div>
          <div className="text-[10px] text-slate-400">Academic Research Platform</div>
        </div>
      </div>
    </aside>
  )
}
