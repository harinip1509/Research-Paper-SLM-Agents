import React, { useState } from 'react'
import { X, Mail, Lock, User, School, ArrowUpRight, AlertCircle, CheckCircle2 } from 'lucide-react'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#261C16]/45 backdrop-blur-xs font-sans">
      <div className="relative w-full max-w-md rounded-3xl bg-[#FAF7F2] border border-[#E6DDD0] shadow-[0_24px_60px_rgba(38,28,22,0.22)] p-6 sm:p-8 text-[#261C16]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#8C7D70] hover:text-[#261C16] hover:bg-[#EADFD2] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="text-[10px] tracking-[0.18em] text-[#8C6B4F] font-semibold uppercase mb-1">
            ScholarForge Research Studio
          </div>
          <h2 className="text-3xl font-display font-semibold text-[#261C16]">
            {mode === 'signup' ? 'Create Scholar Account' : 'Sign In to Studio'}
          </h2>
          <p className="text-xs text-[#6E6055] mt-1">
            {mode === 'signup'
              ? 'Register to save conference manuscripts, bibliographies, and novelty audits.'
              : 'Sign in to access your saved manuscripts and venue configurations.'}
          </p>
        </div>

        {/* Quick Demo Login Box */}
        <div className="mb-5 p-4 rounded-2xl bg-[#EFE6DA] border border-[#DFD3C3] flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[#261C16] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3D281D]" />
              <span>Instant Evaluator Access</span>
            </div>
            <div className="text-[11px] text-[#6E6055] mt-0.5">Dr. Alex Vance (MIT CSAIL)</div>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="px-4 py-1.5 rounded-full text-xs font-semibold text-[#FAF7F2] bg-[#3D281D] hover:bg-[#2B1B12] transition-colors"
          >
            1-Click Demo
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-full bg-[#F3ECE2] p-1 border border-[#E6DDD0] mb-5 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setError(null)
            }}
            className={`flex-1 py-2 rounded-full transition-all ${
              mode === 'login'
                ? 'bg-white text-[#261C16] font-semibold shadow-2xs'
                : 'text-[#6E6055] hover:text-[#261C16]'
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
            className={`flex-1 py-2 rounded-full transition-all ${
              mode === 'signup'
                ? 'bg-white text-[#261C16] font-semibold shadow-2xs'
                : 'text-[#6E6055] hover:text-[#261C16]'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#6E6055] font-semibold mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8C7D70] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prof. Alan Turing"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#E6DDD0] text-sm text-[#261C16] placeholder-[#8C7D70] focus:outline-none focus:border-[#8C6B4F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#6E6055] font-semibold mb-1.5">
                  Institution / Affiliation
                </label>
                <div className="relative">
                  <School className="w-4 h-4 text-[#8C7D70] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. Stanford AI Lab / MIT EECS"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#E6DDD0] text-sm text-[#261C16] placeholder-[#8C7D70] focus:outline-none focus:border-[#8C6B4F]"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#6E6055] font-semibold mb-1.5">
              Academic Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8C7D70] absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="researcher@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#E6DDD0] text-sm text-[#261C16] placeholder-[#8C7D70] focus:outline-none focus:border-[#8C6B4F]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#6E6055] font-semibold mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8C7D70] absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#E6DDD0] text-sm text-[#261C16] placeholder-[#8C7D70] focus:outline-none focus:border-[#8C6B4F]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-full text-xs font-semibold text-[#FAF7F2] bg-[#3D281D] hover:bg-[#2B1B12] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-[#FAF7F2]/30 border-t-[#FAF7F2] rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'signup' ? 'Complete Registration' : 'Enter Studio'}</span>
                <ArrowUpRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
