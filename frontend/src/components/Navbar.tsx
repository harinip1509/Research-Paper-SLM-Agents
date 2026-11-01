import React from 'react'
import { Sparkles, BookOpen, LogOut, LayoutDashboard } from 'lucide-react'
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
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0D1713]/90 border-b border-[#2A3D32]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded bg-[#1B2D24] border border-[#2A3D32] flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-[#22C55E]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-lg tracking-tight text-[#F1F5F2]">
                Scholar<span className="text-[#81958A]">Forge</span>
                <span className="text-[#22C55E]">.</span>
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#14221B] text-[#86EFAC] border border-[#2A3D32] font-semibold">
                Multi-Agent
              </span>
            </div>
            <p className="text-[11px] text-[#81958A] hidden sm:block">AI Conference Paper Assistant</p>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs text-[#A6B5AB]">
          <button
            onClick={() => onNavigate('landing')}
            className={`hover:text-[#F1F5F2] transition-colors ${currentView === 'landing' ? 'text-[#22C55E] font-semibold' : ''}`}
          >
            Overview
          </button>
          <a href="#uniqueness" className="hover:text-[#F1F5F2] transition-colors">
            Uniqueness Engine
          </a>
          <a href="#agents" className="hover:text-[#F1F5F2] transition-colors">
            7 Agents
          </a>
          <a href="#benchmarks" className="hover:text-[#F1F5F2] transition-colors">
            Benchmarks
          </a>
          <a href="#venues" className="hover:text-[#F1F5F2] transition-colors">
            Venues
          </a>
        </nav>

        {/* Right CTA / Auth Status */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('app')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-semibold transition-all ${
                  currentView === 'app'
                    ? 'bg-[#22C55E] text-[#0D1713]'
                    : 'bg-[#1B2D24] text-[#F1F5F2] border border-[#2A3D32] hover:bg-[#14532D]'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Workspace</span>
              </button>

              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded bg-[#14221B] border border-[#2A3D32]">
                <div className="w-7 h-7 rounded bg-[#14532D] border border-[#22C55E]/40 flex items-center justify-center text-xs font-semibold text-[#86EFAC]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left text-xs">
                  <div className="font-medium text-[#F1F5F2] truncate max-w-[120px]">{user.name}</div>
                  <div className="text-[10px] text-[#81958A] truncate max-w-[120px]">{user.institution || 'Researcher'}</div>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-2 rounded text-[#81958A] hover:text-rose-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-2 text-xs font-medium text-[#A6B5AB] hover:text-[#F1F5F2] transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-semibold bg-[#22C55E] hover:bg-[#16a34a] text-[#0D1713] transition-all"
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
