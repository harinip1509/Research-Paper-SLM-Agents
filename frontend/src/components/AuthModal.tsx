import React, { useState } from 'react'
import { X, Mail, Lock, User, School, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { apiLogin, apiSignup } from '../api'
import { User as UserType } from '../types'

interface AuthModalProps {
  isOpen: boolean
  initialMode?: 'login' | 'signup'
  onClose: () => void
  onSuccess: (user: UserType, token: string) => void
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [institution, setInstitution] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        if (!name.trim()) throw new Error('Please enter your full name')
        if (password.length < 6) throw new Error('Password must be at least 6 characters')
        const data = await apiSignup({ name, email, password, institution })
        localStorage.setItem('scholarforge_token', data.token)
        onSuccess(data.user, data.token)
        onClose()
      } else {
        const data = await apiLogin({ email, password })
        localStorage.setItem('scholarforge_token', data.token)
        onSuccess(data.user, data.token)
        onClose()
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await apiLogin({
        email: 'demo@scholarforge.ai',
        password: 'DemoScholar2025!',
      })
      localStorage.setItem('scholarforge_token', data.token)
      onSuccess(data.user, data.token)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Demo login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="relative w-full max-w-md rounded-xl bg-white border border-[#e2e8f0] shadow-2xl p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="text-[10px] font-mono tracking-widest text-[#2563eb] font-semibold uppercase mb-1">
            ScholarForge AI Platform
          </div>
          <h2 className="text-2xl font-bold font-serif text-slate-900">
            {mode === 'signup' ? 'Create Researcher Account' : 'Sign In to Workspace'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'signup'
              ? 'Register to persist conference drafts, citations, and export logs.'
              : 'Sign in to access your multi-agent papers and venue audits.'}
          </p>
        </div>

        {/* Quick Demo Login Box */}
        <div className="mb-5 p-3.5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2563eb]" />
              <span>Instant Evaluator Demo</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              Dr. Alex Vance (MIT CSAIL)
            </div>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-[#2563eb] hover:bg-[#1d4ed8] transition-colors shadow-2xs"
          >
            1-Click Demo
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200 mb-5 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setError(null)
            }}
            className={`flex-1 py-1.5 rounded-md transition-all ${
              mode === 'login'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setError(null)
            }}
            className={`flex-1 py-1.5 rounded-md transition-all ${
              mode === 'signup'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prof. Alan Turing"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-[#e2e8f0] text-sm text-slate-900 focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
                  Institution / Affiliation
                </label>
                <div className="relative">
                  <School className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. Stanford AI Lab / MIT EECS"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-[#e2e8f0] text-sm text-slate-900 focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
              Academic Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="researcher@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-[#e2e8f0] text-sm text-slate-900 focus:outline-none focus:border-[#2563eb]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-[#e2e8f0] text-sm text-slate-900 focus:outline-none focus:border-[#2563eb]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#0f1f3d] hover:bg-[#162a52] transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'signup' ? 'Complete Registration' : 'Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
