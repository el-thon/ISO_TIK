import api from './api'

const DEFAULT_SCOPE = 'global'

const ensureArray = (value) => (Array.isArray(value) ? value : [])

const unwrap = (response) => response?.data?.data ?? response?.data ?? {}

export async function listLabels(params = {}) {
  const res = await api.get('/labels', { params })
  const payload = unwrap(res)
  let list = []
  if (Array.isArray(payload)) list = payload
  else if (Array.isArray(payload?.labels)) list = payload.labels
  else if (Array.isArray(payload?.items)) list = payload.items
  else if (Array.isArray(payload?.list)) list = payload.list
  else if (Array.isArray(payload?.data)) list = payload.data
  const labels = ensureArray(list)
  const pagination = payload.pagination ?? null
  return { labels, pagination }
}

export async function createLabel(payload = {}) {
  const res = await api.post('/labels', {
    scope: payload.scope || DEFAULT_SCOPE,
    name: payload.name,
    color: payload.color,
    scope_id: payload.scope_id,
  })
  return unwrap(res)
}

export async function updateLabel(labelId, payload = {}) {
  if (!labelId) throw new Error('labelId is required')
  const res = await api.put(`/labels/${labelId}`, {
    scope: payload.scope || DEFAULT_SCOPE,
    name: payload.name,
    color: payload.color,
    scope_id: payload.scope_id,
  })
  return unwrap(res)
}

export async function deleteLabel(labelId) {
  if (!labelId) throw new Error('labelId is required')
  const res = await api.delete(`/labels/${labelId}`)
  return unwrap(res)
}

export default {
  listLabels,
  createLabel,
  updateLabel,
  deleteLabel,
}
