import api from './api'

const DEFAULT_PAGINATION = {
  current_page: 1,
  per_page: 15,
  total: 0,
  last_page: 1,
}

const unwrap = (response) => {
  const data = response?.data ?? response
  if (data?.data && typeof data.data === 'object') return data.data
  return data ?? {}
}

const ensureArray = (value) => {
  if (Array.isArray(value)) return value
  if (value == null) return []
  return [value]
}

export async function listAuditLogs(params = {}) {
  const res = await api.get('/audit-logs', { params })
  const payload = unwrap(res) ?? {}
  const items = ensureArray(payload.data ?? payload.items ?? payload.logs ?? [])
  const meta = payload.meta ?? payload.pagination ?? {}

  return {
    logs: items,
    pagination: {
      ...DEFAULT_PAGINATION,
      current_page: meta.current_page ?? meta.currentPage ?? DEFAULT_PAGINATION.current_page,
      per_page: meta.per_page ?? meta.perPage ?? DEFAULT_PAGINATION.per_page,
      total: meta.total ?? DEFAULT_PAGINATION.total,
      last_page: meta.last_page ?? meta.lastPage ?? DEFAULT_PAGINATION.last_page,
    },
  }
}

export async function getAuditLog(logId) {
  if (!logId) throw new Error('logId is required')
  const res = await api.get(`/audit-logs/${logId}`)
  const payload = unwrap(res) ?? {}
  return payload.log ?? payload
}

export default {
  listAuditLogs,
  getAuditLog,
}
