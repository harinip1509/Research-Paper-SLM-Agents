import React from 'react'
import { Sparkles, BookOpen, LogOut, User as UserIcon, ArrowRight, LayoutDashboard } from 'lucide-react'
import { User } from '../types'

interface NavbarProps {
  user: User | null
  currentView: 'landing' | 'app'
  onNavigate: (view: 'landing' | 'app') => void
  onOpenAuth: (mode: 'login' | 'signup') => void
  onLogout: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentView,
  onNavigate,
  onOpenAuth,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                ScholarForge
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                Multi-Agent
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">AI Conference Paper Assistant</p>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
          <button
            onClick={() => onNavigate('landing')}
            className={`hover:text-white transition-colors ${currentView === 'landing' ? 'text-indigo-400 font-medium' : ''}`}
          >
            Overview
          </button>
          <a href="#uniqueness" className="hover:text-white transition-colors">
            Uniqueness Engine
          </a>
          <a href="#agents" className="hover:text-white transition-colors">
            7 Agents
          </a>
          <a href="#benchmarks" className="hover:text-white transition-colors">
            Benchmarks
          </a>
          <a href="#venues" className="hover:text-white transition-colors">
            Venues
          </a>
        </nav>

        {/* Right CTA / Auth Status */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('app')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentView === 'app'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Workspace</span>
              </button>

              {/* User badge */}
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-xs font-semibold text-violet-300">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left text-xs">
                  <div className="font-medium text-slate-200 truncate max-w-[120px]">{user.name}</div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{user.institution || 'Researcher'}</div>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-md shadow-indigo-500/20 transition-all hover:shadow-indigo-500/40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Get Started</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
