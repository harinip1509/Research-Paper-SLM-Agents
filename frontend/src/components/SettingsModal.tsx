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
      setSuccess('Settings updated and persisted to .env.')
      setGroqKey('')
      setS2Key('')
    } catch (err: any) {
      setError(err.message || 'Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#261C16]/45 backdrop-blur-xs font-sans">
      <div className="bg-[#FAF7F2] rounded-3xl border border-[#E6DDD0] shadow-[0_24px_60px_rgba(38,28,22,0.22)] max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] text-[#261C16]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-[#F3ECE2] border-b border-[#E6DDD0] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#3D281D] text-[#FAF7F2] flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-semibold tracking-tight text-[#261C16]">
                API Keys &amp; Studio Configuration
              </h2>
              <p className="text-xs text-[#6E6055]">
                Configure LLM synthesis, Semantic Scholar discovery, and local SQLite persistence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8C7D70] hover:text-[#261C16] transition-colors p-2 rounded-full hover:bg-[#EADFD2]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-[#EFE6DA] border border-[#C8B29B] rounded-2xl text-xs text-[#3D281D] font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#3D281D]" />
              <span>{success}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-[#8C7D70] text-xs">
              <div className="w-6 h-6 border-2 border-[#3D281D] border-t-transparent rounded-full animate-spin mb-2" />
              Loading studio configuration...
            </div>
          ) : (
            <form id="settings-form" onSubmit={handleSave} className="space-y-5">
              {/* Groq API Key Section */}
              <div className="p-5 rounded-2xl bg-white border border-[#E6DDD0] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#8C6B4F]" />
                    <span className="font-display text-lg font-semibold text-[#261C16]">
                      Groq API Key (Llama 3.3 70B Synthesis)
                    </span>
                  </div>
                  {info?.groq_api_key_configured ? (
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#EADFD2] text-[#3D281D]">
                      <CheckCircle2 className="w-3 h-3" /> Live Groq Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-medium bg-[#F3ECE2] text-[#6E6055] border border-[#E6DDD0]">
                      Grounded Local Engine Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#6E6055] leading-relaxed">
                  Powers section-by-section academic manuscript drafting with automatic failover to
                  the built-in topic-grounded synthesis engine.
                </p>

                <div className="text-xs text-[#6E6055] bg-[#FAF7F2] px-3.5 py-2 rounded-xl border border-[#E6DDD0] flex items-center justify-between">
                  <span className="font-mono text-[11px]">
                    Current:{' '}
                    <strong className="text-[#261C16]">
                      {info?.groq_api_key_masked || 'Not Configured'}
                    </strong>
                  </span>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#8C6B4F] hover:text-[#3D281D] hover:underline flex items-center gap-1 text-xs font-medium"
                  >
                    <span>Get Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A3728] mb-1">
                    Update Groq API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showGroq ? 'text' : 'password'}
                      placeholder="Paste new Groq key (e.g. gsk_...)"
                      value={groqKey}
                      onChange={(e) => setGroqKey(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 pr-10 bg-[#FAF7F2] border border-[#E6DDD0] rounded-xl text-[#261C16] placeholder-[#8C7D70] focus:outline-none focus:border-[#8C6B4F] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGroq(!showGroq)}
                      className="absolute right-3 top-2.5 text-[#8C7D70] hover:text-[#261C16]"
                    >
                      {showGroq ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Semantic Scholar API Key Section */}
              <div className="p-5 rounded-2xl bg-white border border-[#E6DDD0] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#8C6B4F]" />
                    <span className="font-display text-lg font-semibold text-[#261C16]">
                      Semantic Scholar API Key (Literature &amp; Citations)
                    </span>
                  </div>
                  {info?.s2_api_key_configured ? (
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#EADFD2] text-[#3D281D]">
                      <CheckCircle2 className="w-3 h-3" /> S2 Partner Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-medium bg-[#F3ECE2] text-[#6E6055] border border-[#E6DDD0]">
                      Public Graph Tier Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#6E6055] leading-relaxed">
                  Used by the Academic Search and Citation Verification agents to fetch peer-reviewed
                  metadata, recommendations, and verified BibTeX records.
                </p>

                <div className="text-xs text-[#6E6055] bg-[#FAF7F2] px-3.5 py-2 rounded-xl border border-[#E6DDD0] flex items-center justify-between">
                  <span className="font-mono text-[11px]">
                    Current:{' '}
                    <strong className="text-[#261C16]">
                      {info?.s2_api_key_masked || 'Public Access'}
                    </strong>
                  </span>
                  <a
                    href="https://www.semanticscholar.org/product/api"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#8C6B4F] hover:text-[#3D281D] hover:underline flex items-center gap-1 text-xs font-medium"
                  >
                    <span>Request Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A3728] mb-1">
                    Update Semantic Scholar Key
                  </label>
                  <div className="relative">
                    <input
                      type={showS2 ? 'text' : 'password'}
                      placeholder="Paste S2 API key or leave blank for public access"
                      value={s2Key}
                      onChange={(e) => setS2Key(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 pr-10 bg-[#FAF7F2] border border-[#E6DDD0] rounded-xl text-[#261C16] placeholder-[#8C7D70] focus:outline-none focus:border-[#8C6B4F] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowS2(!showS2)}
                      className="absolute right-3 top-2.5 text-[#8C7D70] hover:text-[#261C16]"
                    >
                      {showS2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Local SQLite Database Connection Section */}
              <div className="p-5 rounded-2xl bg-white border border-[#E6DDD0] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#8C6B4F]" />
                    <span className="font-display text-lg font-semibold text-[#261C16]">
                      Local SQLite Archive
                    </span>
                  </div>
                  {info?.db_connected ? (
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#EADFD2] text-[#3D281D]">
                      <CheckCircle2 className="w-3 h-3" /> Connected &amp; Persistent
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                      Disconnected
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#6E6055] leading-relaxed">
                  Your scholar accounts, sessions, and manuscript drafts are persisted locally in
                  your SQLite database file.
                </p>

                <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E6DDD0] space-y-1.5 text-xs">
                  <div className="text-[#8C7D70] text-[10px] uppercase font-semibold tracking-wider">
                    Database File Path
                  </div>
                  <div className="font-mono text-[11px] text-[#3D281D] break-all bg-white px-2.5 py-1.5 rounded-lg border border-[#E6DDD0]">
                    {info?.db_path || 'scholarforge.db'}
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#F3ECE2] border-t border-[#E6DDD0] flex items-center justify-between">
          <span className="text-xs text-[#6E6055]">
            Keys are saved to your local <code className="text-[#261C16] font-mono">.env</code> file.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#6E6055] hover:text-[#261C16] transition-colors"
            >
              Close
            </button>
            <button
              form="settings-form"
              type="submit"
              disabled={saving || (!groqKey.trim() && !s2Key.trim())}
              className="px-5 py-2.5 bg-[#3D281D] hover:bg-[#2B1B12] disabled:opacity-40 text-[#FAF7F2] text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
