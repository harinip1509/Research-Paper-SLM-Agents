import {
  User,
  Paper,
  TopicUniquenessResponse,
  PaperPlan,
  PaperDraft,
  ReviewCritique,
  SimilarityReport,
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
  bibtex: string
  ai_disclosure_statement?: string
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

export async function apiExportFormat(params: {
  venue_id: string
  title: string
  authors: any[]
  abstract: string
  keywords: string[]
  sections: any[]
  bibtex: string
  ai_disclosure_statement?: string
}): Promise<any> {
  const res = await fetch(`${API_BASE}/format/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Export compilation failed' }))
    throw new Error(parseErrorMessage(err, 'Export compilation failed'))
  }
  return res.json()
}

export async function apiListProjects(): Promise<ProjectSummary[]> {
  const res = await fetch(`${API_BASE}/projects`, {
    headers: { ...getAuthHeader() },
  })
  if (!res.ok) return []
  return res.json().catch(() => [])
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

