import {
  User,
  Paper,
  TopicUniquenessResponse,
  PaperPlan,
  PaperDraft,
  ReviewCritique,
  SimilarityReport,
  CitationVerificationResult,
  FormatConstraintReport,
  ProjectSummary,
} from './types'

const API_BASE = '/api'

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('scholarforge_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function parseErrorMessage(err: any, fallback: string): string {
  if (!err) return fallback
  if (typeof err === 'string') return err
  if (typeof err.detail === 'string') return err.detail
  if (Array.isArray(err.detail)) {
    return err.detail
      .map((d: any) => {
        if (typeof d === 'string') return d
        if (d && typeof d === 'object') {
          const field = Array.isArray(d.loc) ? d.loc.slice(-1)[0] : ''
          const msg = d.msg || d.message || JSON.stringify(d)
          return field ? `${field}: ${msg}` : msg
        }
        return String(d)
      })
      .join('; ')
  }
  if (typeof err.message === 'string') return err.message
  return fallback
}

export async function apiSignup(data: {
  name: string
  email: string
  password: string
  institution?: string
}): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Signup failed' }))
    throw new Error(parseErrorMessage(err, 'Signup failed'))
  }
  return res.json()
}

export async function apiLogin(data: {
  email: string
  password: string
}): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Invalid credentials' }))
    throw new Error(parseErrorMessage(err, 'Invalid credentials'))
  }
  return res.json()
}

export async function apiGetMe(): Promise<User | null> {
  const headers = getAuthHeader()
  if (!headers.Authorization) return null
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { headers })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function apiLogout(): Promise<void> {
  const headers = getAuthHeader()
  try {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers })
  } finally {
    localStorage.removeItem('scholarforge_token')
  }
}

export async function apiComputeUniqueness(params: {
  title: string
  abstract: string
  user_notes?: string
  overlap_threshold?: number
}): Promise<TopicUniquenessResponse> {
  const res = await fetch(`${API_BASE}/uniqueness`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Uniqueness scoring failed' }))
    throw new Error(parseErrorMessage(err, 'Uniqueness scoring failed'))
  }
  return res.json()
}

export async function apiGeneratePlan(params: {
  goal: string
  topic: string
  user_notes?: string
  literature?: Paper[]
}): Promise<PaperPlan> {
  const res = await fetch(`${API_BASE}/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Planning generation failed' }))
    throw new Error(parseErrorMessage(err, 'Planning generation failed'))
  }
  return res.json()
}

export async function apiDraftFullPaper(params: {
  title: string
  venue: string
  user_notes: string
  abstract?: string
  retrieved_papers?: Paper[]
  verified_papers?: Paper[]
  target_pages?: number
}): Promise<PaperDraft> {
  const payload = {
    paper_title: params.title,
    title: params.title,
    paper_abstract: params.abstract || '',
    abstract: params.abstract || '',
    user_notes: params.user_notes || '',
    verified_papers: params.retrieved_papers || params.verified_papers || [],
    retrieved_papers: params.retrieved_papers || params.verified_papers || [],
    venue: params.venue,
    target_pages: params.target_pages || 6,
  }
  const res = await fetch(`${API_BASE}/draft/full`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Drafting failed' }))
    throw new Error(parseErrorMessage(err, 'Drafting failed'))
  }
  return res.json()
}

export async function apiReviewDraft(params: {
  title: string
  abstract: string
  draft_text: string
  target_venue?: string
}): Promise<ReviewCritique> {
  const res = await fetch(`${API_BASE}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Review failed' }))
    throw new Error(parseErrorMessage(err, 'Review failed'))
  }
  return res.json()
}

export async function apiCheckSimilarity(params: {
  draft_text: string
  retrieved_papers: Paper[]
}): Promise<SimilarityReport> {
  const res = await fetch(`${API_BASE}/similarity/sentence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Similarity check failed' }))
    throw new Error(parseErrorMessage(err, 'Similarity check failed'))
  }
  return res.json()
}

export async function apiVerifyCitations(params: {
  draft_text: string
  known_papers: Paper[]
}): Promise<CitationVerificationResult[]> {
  const res = await fetch(`${API_BASE}/citations/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Citation verification failed' }))
    throw new Error(parseErrorMessage(err, 'Citation verification failed'))
  }
  return res.json()
}

export async function apiGetVenues(): Promise<Record<string, any>> {
  const res = await fetch(`${API_BASE}/format/venues`)
  if (!res.ok) throw new Error('Failed to load venue profiles')
  return res.json()
}

export async function apiCheckConstraints(params: {
  venue_id: string
  title: string
  authors: any[]
  abstract: string
  keywords: string[]
  sections: any[]
  bibtex?: string
  ai_disclosure_statement?: string
  is_anonymized?: boolean
  target_pages?: number
}): Promise<FormatConstraintReport> {
  const res = await fetch(`${API_BASE}/format/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Constraint check failed' }))
    throw new Error(parseErrorMessage(err, 'Constraint check failed'))
  }
  return res.json()
}

export async function apiRenderLatex(params: {
  venue_id: string
  title: string
  authors: any[]
  abstract: string
  keywords: string[]
  sections: any[]
  bibtex: string
  ai_disclosure_statement?: string
  target_pages?: number
}): Promise<{ venue_id: string; latex_source: string }> {
  const res = await fetch(`${API_BASE}/format/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'LaTeX rendering failed' }))
    throw new Error(parseErrorMessage(err, 'LaTeX rendering failed'))
  }
  return res.json()
}

export async function apiDownloadPdf(params: {
  venue_id: string
  title: string
  authors: any[]
  abstract: string
  keywords: string[]
  sections: any[]
  bibtex: string
  ai_disclosure_statement?: string
  target_pages?: number
}): Promise<Blob> {
  const res = await fetch(`${API_BASE}/format/compile/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'PDF compilation failed' }))
    throw new Error(parseErrorMessage(err, 'PDF compilation failed'))
  }
  return res.blob()
}

export async function apiDownloadDocx(params: {
  venue_id: string
  title: string
  authors: any[]
  abstract: string
  keywords: string[]
  sections: any[]
  bibtex: string
  ai_disclosure_statement?: string
  target_pages?: number
}): Promise<Blob> {
  const res = await fetch(`${API_BASE}/format/compile/docx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'DOCX generation failed' }))
    throw new Error(parseErrorMessage(err, 'DOCX generation failed'))
  }
  return res.blob()
}

export async function apiDownloadTex(params: {
  venue_id: string
  title: string
  authors: any[]
  abstract: string
  keywords: string[]
  sections: any[]
  bibtex: string
  ai_disclosure_statement?: string
  target_pages?: number
}): Promise<Blob> {
  const res = await fetch(`${API_BASE}/format/compile/tex`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'LaTeX export failed' }))
    throw new Error(parseErrorMessage(err, 'LaTeX export failed'))
  }
  return res.blob()
}

export async function apiDownloadMarkdown(params: {
  venue_id: string
  title: string
  authors: any[]
  abstract: string
  keywords: string[]
  sections: any[]
  bibtex: string
  ai_disclosure_statement?: string
  target_pages?: number
}): Promise<Blob> {
  const res = await fetch(`${API_BASE}/format/compile/markdown`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Markdown export failed' }))
    throw new Error(parseErrorMessage(err, 'Markdown export failed'))
  }
  return res.blob()
}

export async function apiDownloadHtml(params: {
  venue_id: string
  title: string
  authors: any[]
  abstract: string
  keywords: string[]
  sections: any[]
  bibtex: string
  ai_disclosure_statement?: string
  target_pages?: number
}): Promise<Blob> {
  const res = await fetch(`${API_BASE}/format/compile/html`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'HTML export failed' }))
    throw new Error(parseErrorMessage(err, 'HTML export failed'))
  }
  return res.blob()
}

export async function apiListProjects(): Promise<ProjectSummary[]> {
  try {
    const res = await fetch(`${API_BASE}/projects`, {
      headers: { ...getAuthHeader() },
    })
    if (!res.ok) return []
    const data = await res.json().catch(() => [])
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function apiSaveProject(params: {
  id?: string
  title: string
  abstract: string
  user_notes?: string
  venue?: string
  uniqueness?: TopicUniquenessResponse | null
  draft?: PaperDraft | null
  papers?: Paper[]
}): Promise<{ id: string; status: string }> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to save project' }))
    throw new Error(parseErrorMessage(err, 'Failed to save project'))
  }
  return res.json()
}

export async function apiGetProject(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    headers: { ...getAuthHeader() },
  })
  if (!res.ok) {
    throw new Error('Project not found')
  }
  return res.json()
}

export async function apiDeleteProject(id: string): Promise<void> {
  await fetch(`${API_BASE}/projects/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() },
  })
}

export interface SettingsKeysInfo {
  groq_api_key_configured: boolean
  groq_api_key_masked: string
  s2_api_key_configured: boolean
  s2_api_key_masked: string
  db_path: string
  db_connected: boolean
  groq_model_writing: string
  groq_model_review: string
}

export async function apiGetSettingsKeys(): Promise<SettingsKeysInfo> {
  const res = await fetch(`${API_BASE}/settings/keys`, {
    headers: { ...getAuthHeader() },
  })
  if (!res.ok) {
    throw new Error('Failed to fetch settings')
  }
  return res.json()
}

export async function apiSaveSettingsKeys(data: {
  groq_api_key?: string
  s2_api_key?: string
}): Promise<SettingsKeysInfo> {
  const res = await fetch(`${API_BASE}/settings/keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update API keys' }))
    throw new Error(parseErrorMessage(err, 'Failed to update API keys'))
  }
  return res.json()
}

