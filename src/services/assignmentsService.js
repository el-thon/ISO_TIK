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
  const topic = raw.topic || raw.topic_data || null
  const comment = raw.comment || raw.comment_data || null
  return {
    ...raw,
    topic,
    comment,
    from_user: raw.from_user || raw.assigner || raw.created_by || raw.author || null,
    to_user: raw.to_user || raw.assignee || raw.user || null,
  }
}

export async function listAssignments(params = {}) {
  const res = await api.get('/assignments', { params })
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

export async function getAssignment(assignmentId) {
  if (!assignmentId) throw new Error('assignmentId is required')
  const res = await api.get(`/assignments/${assignmentId}`)
  const payload = unwrap(res)
  return normalizeAssignment(payload.assignment ?? payload)
}

export async function assignTopic(topicId, payload) {
  if (!topicId) throw new Error('topicId is required to assign topic')
  const res = await api.post(`/topics/${topicId}/assign`, payload)
  const body = unwrap(res)
  return normalizeAssignment(body.assignment ?? body)
}

export async function assignComment(commentId, payload) {
  if (!commentId) throw new Error('commentId is required to assign comment')
  const res = await api.post(`/comments/${commentId}/assign`, payload)
  const body = unwrap(res)
  return normalizeAssignment(body.assignment ?? body)
}

export async function updateAssignment(routingId, payload) {
  if (!routingId) throw new Error('routingId is required')
  const res = await api.put(`/routings/${routingId}`, payload)
  const body = unwrap(res)
  return normalizeAssignment(body.assignment ?? body)
}

export async function completeAssignment(routingId) {
  if (!routingId) throw new Error('routingId is required')
  const res = await api.post(`/routings/${routingId}/complete`)
  const body = unwrap(res)
  return normalizeAssignment(body.assignment ?? body)
}

export async function cancelAssignment(routingId, payload = {}) {
  if (!routingId) throw new Error('routingId is required')
  const res = await api.post(`/routings/${routingId}/cancel`, payload)
  const body = unwrap(res)
  return normalizeAssignment(body.assignment ?? body)
}

export async function escalateAssignment(routingId, payload = {}) {
  if (!routingId) throw new Error('routingId is required')
  const res = await api.post(`/routings/${routingId}/escalate`, payload)
  const body = unwrap(res)
  return normalizeAssignment(body.assignment ?? body)
}

export default {
  listAssignments,
  getAssignment,
  assignTopic,
  assignComment,
  updateAssignment,
  completeAssignment,
  cancelAssignment,
  escalateAssignment,
}
