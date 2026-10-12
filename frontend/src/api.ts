import {
  User,
  Paper,
  TopicUniquenessResponse,
  PaperPlan,
  PaperDraft,
  ReviewCritique,
  SimilarityReport,
  FormatConstraintReport
} from './types'

const API_BASE = '/api'

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('scholarforge_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiSignup(data: { name: string; email: string; password: string; institution?: string }): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Signup failed' }))
    throw new Error(err.detail || 'Signup failed')
  }
  return res.json()
}

export async function apiLogin(data: { email: string; password: string }): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Invalid credentials' }))
    throw new Error(err.detail || 'Invalid credentials')
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
    throw new Error(err.detail || 'Uniqueness scoring failed')
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
    throw new Error(err.detail || 'Planning generation failed')
  }
  return res.json()
}

export async function apiDraftFullPaper(params: {
  title: string
  venue: string
  user_notes: string
  retrieved_papers: Paper[]
}): Promise<PaperDraft> {
  const res = await fetch(`${API_BASE}/draft/full`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Drafting failed' }))
    throw new Error(err.detail || 'Drafting failed')
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
    throw new Error(err.detail || 'Review failed')
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
    throw new Error(err.detail || 'Similarity check failed')
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
    throw new Error(err.detail || 'Constraint check failed')
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
    throw new Error(err.detail || 'Export compilation failed')
  }
  return res.json()
}
