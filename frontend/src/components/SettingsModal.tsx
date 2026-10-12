import React, { useState, useEffect } from 'react'
import {
  X,
  Key,
  Database,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Cpu,
  Save,
  Server,
} from 'lucide-react'
import { apiGetSettingsKeys, apiSaveSettingsKeys, SettingsKeysInfo } from '../api'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [info, setInfo] = useState<SettingsKeysInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [groqKey, setGroqKey] = useState('')
  const [s2Key, setS2Key] = useState('')
  const [showGroq, setShowGroq] = useState(false)
  const [showS2, setShowS2] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setError(null)
      setSuccess(null)
      setGroqKey('')
      setS2Key('')
      setLoading(true)
      apiGetSettingsKeys()
        .then((data) => {
          setInfo(data)
        })
        .catch((err) => {
          setError(err.message || 'Failed to load settings')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      const payload: { groq_api_key?: string; s2_api_key?: string } = {}
      if (groqKey.trim()) payload.groq_api_key = groqKey.trim()
      if (s2Key.trim() !== '') payload.s2_api_key = s2Key.trim()

      const updated = await apiSaveSettingsKeys(payload)
      setInfo(updated)
      setSuccess('Settings updated successfully! Keys persisted to .env.')
      setGroqKey('')
      setS2Key('')
    } catch (err: any) {
      setError(err.message || 'Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-[#0f1f3d] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#2563eb] flex items-center justify-center text-white shadow-sm">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif tracking-tight">API Keys & Engine Settings</h2>
              <p className="text-xs text-slate-300">
                Configure LLM generation, Semantic Scholar literature discovery, and database status
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin mb-2" />
              Loading system configurations...
            </div>
          ) : (
            <form id="settings-form" onSubmit={handleSave} className="space-y-6">
              {/* Groq API Key Section */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#2563eb]" />
                    <span className="text-xs font-bold font-serif text-slate-900">
                      Groq API Key (Llama 3.3 70B Generation)
                    </span>
                  </div>
                  {info?.groq_api_key_configured ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" /> Live Groq Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800">
                      Offline / Deterministic Fallback
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Powers high-speed section-by-section academic paper writing, rubric critiques, and
                  constraint-based word limit rewrites.
                </p>

                <div className="text-[11px] font-mono text-slate-600 bg-white px-3 py-1.5 rounded-md border border-slate-200 flex items-center justify-between">
                  <span>Current: <strong>{info?.groq_api_key_masked || 'Not Configured'}</strong></span>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#2563eb] hover:underline flex items-center gap-1 text-[11px] font-sans"
                  >
                    <span>Get Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Update Groq API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showGroq ? 'text' : 'password'}
                      placeholder="Paste new Groq key (e.g. gsk_...)"
                      value={groqKey}
                      onChange={(e) => setGroqKey(e.target.value)}
                      className="w-full text-xs px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGroq(!showGroq)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showGroq ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Semantic Scholar API Key Section */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#2563eb]" />
                    <span className="text-xs font-bold font-serif text-slate-900">
                      Semantic Scholar API Key (Graph & Citations)
                    </span>
                  </div>
                  {info?.s2_api_key_configured ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" /> S2 Partner Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                      Public Tier (Rate-Limited)
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Used by Topic Uniqueness (Agent 1) and Similarity Agent (Agent 6) to fetch real metadata,
                  recommendations, and verified BibTeX citations without fabrications.
                </p>

                <div className="text-[11px] font-mono text-slate-600 bg-white px-3 py-1.5 rounded-md border border-slate-200 flex items-center justify-between">
                  <span>Current: <strong>{info?.s2_api_key_masked || 'Not Configured'}</strong></span>
                  <a
                    href="https://www.semanticscholar.org/product/api"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#2563eb] hover:underline flex items-center gap-1 text-[11px] font-sans"
                  >
                    <span>Request Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Update Semantic Scholar Key
                  </label>
                  <div className="relative">
                    <input
                      type={showS2 ? 'text' : 'password'}
                      placeholder="Paste S2 API key or leave blank for public access"
                      value={s2Key}
                      onChange={(e) => setS2Key(e.target.value)}
                      className="w-full text-xs px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowS2(!showS2)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showS2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Local SQLite Database Connection Section */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#2563eb]" />
                    <span className="text-xs font-bold font-serif text-slate-900">
                      Local SQLite Database
                    </span>
                  </div>
                  {info?.db_connected ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" /> Connected & Persistent
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                      Disconnected
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Your researcher accounts, sessions, and paper drafts are stored in the local SQLite database
                  file on your machine. Each registered account has an isolated workspace.
                </p>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5 font-mono text-[11px]">
                  <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    Database File Path:
                  </div>
                  <div className="text-slate-800 break-all bg-slate-100 px-2 py-1 rounded">
                    {info?.db_path || 'scholarforge.db'}
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1">
                    Mode: <code>WAL (Write-Ahead Logging)</code> • Multi-user isolated tables: <code>users</code>, <code>sessions</code>, <code>projects</code>, <code>uniqueness_runs</code>.
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Keys are stored in your workspace <code>.env</code> file.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Close
            </button>
            <button
              form="settings-form"
              type="submit"
              disabled={saving || (!groqKey.trim() && !s2Key.trim())}
              className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Keys'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
