import api from './api'

const DEFAULT_PAGINATION = {
  current_page: 1,
  per_page: 15,
  total: 0,
  last_page: 1,
  from: null,
  to: null,
}

const ensureArray = (value) => (Array.isArray(value) ? value : value ? [value] : [])

const unwrap = (response) => response?.data?.data ?? response?.data ?? null

export async function listClauses(params = {}) {
  const normalizedParams = { ...params }
  if (typeof normalizedParams.is_active === 'boolean') {
    normalizedParams.is_active = normalizedParams.is_active ? 1 : 0
  }
  const res = await api.get('/admin/system/clauses', { params: normalizedParams })
  const payload = unwrap(res) ?? {}
  return {
    clauses: ensureArray(payload.clauses ?? payload.items ?? payload.data ?? []),
    pagination: { ...DEFAULT_PAGINATION, ...(payload.pagination ?? {}) },
  }
}

export async function createClause(payload = {}) {
  const res = await api.post('/admin/system/clauses', payload)
  return unwrap(res) ?? {}
}

export async function updateClause(clauseId, payload = {}) {
  if (!clauseId) throw new Error('clauseId is required')
  const res = await api.put(`/admin/system/clauses/${clauseId}`, payload)
  return unwrap(res) ?? {}
}

export async function deleteClause(clauseId) {
  if (!clauseId) throw new Error('clauseId is required')
  const res = await api.delete(`/admin/system/clauses/${clauseId}`)
  return unwrap(res) ?? {}
}

export default {
  listClauses,
  createClause,
  updateClause,
  deleteClause,
}
