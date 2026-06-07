import api from './api'

const DEFAULT_PAGINATION = {
  current_page: 1,
  per_page: 10,
  total: 0,
  last_page: 1,
  from: null,
  to: null,
}

const ensureArray = (value) => {
  if (Array.isArray(value)) return value
  if (value == null) return []
  return [value]
}

const pickArrayData = (...sources) => {
  for (const source of sources) {
    if (!source) continue
    if (Array.isArray(source)) return source
    if (source && Array.isArray(source.data)) return source.data
  }
  return null
}

const unwrap = (response) => {
  if (!response) return {}
  const dataLayer = response.data?.data ?? response.data ?? response
  if (dataLayer?.data && !Array.isArray(dataLayer.data) && typeof dataLayer.data === 'object') {
    return dataLayer
  }
  return dataLayer ?? {}
}

const normalizeAssignment = (raw) => {
  if (!raw || typeof raw !== 'object') return raw
  const formulir = raw.formulir || raw.formulir_data || raw.topic || raw.topic_data || null
  const comment = raw.comment || raw.comment_data || null
  const assignee = raw.assignee || raw.to_user || null
  const assignedBy = raw.assigned_by || raw.assigner || raw.from_user || null
  return {
    ...raw,
    formulir,
    topic: raw.topic || formulir,
    comment,
    from_user: assignedBy || raw.created_by || raw.author || null,
    to_user: assignee || raw.user || null,
    from_user_id: raw.from_user_id || raw.assigned_by_id || assignedBy?.id || null,
    to_user_id: raw.to_user_id || raw.assignee_id || assignee?.id || null,
  }
}

export async function listAssignments(params = {}) {
  const res = await api.get('/topic-assignments', { params })
  const payload = unwrap(res) ?? {}
  const arraySource =
    pickArrayData(
      payload.assignments,
      payload.data?.assignments,
      payload.items,
      payload.data?.items,
      payload.list,
      payload.data?.list,
      payload.results,
      payload.data?.results,
      payload.data
    ) ?? []

  const assignmentsRaw = arraySource.length
    ? arraySource
    : ensureArray(payload.assignment ?? payload.data?.assignment ?? null)

  const assignments = assignmentsRaw.map(normalizeAssignment)
  const counts =
    payload.counts ||
    payload.meta?.counts ||
    (typeof payload.total === 'number' ? { total: payload.total } : null) ||
    null

  const paginationSource = payload.pagination || payload.meta?.pagination || payload.meta || {}
  const pagination = { ...DEFAULT_PAGINATION, ...paginationSource }

  const totalCandidates = [
    paginationSource.total,
    paginationSource.total_items,
    payload.total,
    payload.total_items,
    payload.meta?.total,
    payload.meta?.counts?.total,
    counts?.total,
    counts?.total_assignments,
    counts?.total_all,
    payload.count,
    payload.count_assignments,
    payload.assignments_count,
    assignments.length,
  ]

  const fallbackTotal = totalCandidates.find((value) => typeof value === 'number' && value > 0) ?? assignments.length

  if (!pagination.total || pagination.total < assignments.length) {
    pagination.total = fallbackTotal
  }

  if (pagination.per_page && !pagination.last_page) {
    pagination.last_page = Math.max(1, Math.ceil((pagination.total || assignments.length || 1) / pagination.per_page))
  }

  if (!pagination.from && pagination.current_page && pagination.per_page) {
    pagination.from = (pagination.current_page - 1) * pagination.per_page + 1
    pagination.to = Math.min(pagination.total ?? assignments.length, pagination.from + assignments.length - 1)
  }

  return {
    assignments,
    pagination,
    meta: payload.meta ?? null,
    counts,
  }
}

export async function assignFormulir(formulirId, payload) {
  if (!formulirId) throw new Error('formulirId is required to assign formulir')
  const res = await api.post(`/topics/${formulirId}/assignments`, payload)
  const body = unwrap(res)
  return normalizeAssignment(body.assignment ?? body)
}

export const assignTopic = assignFormulir

export async function completeAssignment(assignmentId) {
  if (!assignmentId) throw new Error('assignmentId is required')
  const res = await api.post(`/topic-assignments/${assignmentId}/complete`)
  const body = unwrap(res)
  return normalizeAssignment(body.assignment ?? body)
}

export async function cancelAssignment(assignmentId, payload = {}) {
  if (!assignmentId) throw new Error('assignmentId is required')
  const res = await api.post(`/topic-assignments/${assignmentId}/cancel`, payload)
  const body = unwrap(res)
  return normalizeAssignment(body.assignment ?? body)
}

export default {
  listAssignments,
  assignFormulir,
  assignTopic,
  completeAssignment,
  cancelAssignment,
}
