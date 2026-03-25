import api from './api'

const ensureArray = (value) => (Array.isArray(value) ? value : value ? [value] : [])

const unwrap = (response) => response?.data?.data ?? response?.data ?? null

export async function listForumPeriods(params = {}) {
  const res = await api.get('/forum-periods', { params })
  const payload = unwrap(res) ?? {}
  return {
    periods: ensureArray(payload.periods ?? payload.items ?? payload.data ?? []),
  }
}

export async function getForumPeriod(periodId) {
  if (!periodId) throw new Error('periodId is required')
  const res = await api.get(`/forum-periods/${periodId}`)
  return unwrap(res) ?? {}
}

export async function createForumPeriod(payload) {
  const res = await api.post('/forum-periods', payload)
  return unwrap(res) ?? {}
}

export async function updateForumPeriod(periodId, payload) {
  if (!periodId) throw new Error('periodId is required')
  const res = await api.put(`/forum-periods/${periodId}`, payload)
  return unwrap(res) ?? {}
}

export async function listForumPeriodForums(periodId, params = {}) {
  if (!periodId) throw new Error('periodId is required')
  const res = await api.get(`/forum-periods/${periodId}/forums`, { params })
  const payload = unwrap(res) ?? {}
  return {
    forums: ensureArray(payload.forums ?? []),
    period: payload.period ?? null,
    pagination: payload.pagination ?? null,
  }
}

export async function createForumPeriodForum(periodId, payload) {
  if (!periodId) throw new Error('periodId is required')
  const res = await api.post(`/forum-periods/${periodId}/forums`, payload)
  return unwrap(res) ?? {}
}

export async function listForumPeriodForumTopics(periodId, forumId, params = {}) {
  if (!periodId) throw new Error('periodId is required')
  if (!forumId) throw new Error('forumId is required')
  const res = await api.get(`/forum-periods/${periodId}/forums/${forumId}/topics`, { params })
  const payload = unwrap(res) ?? {}
  return {
    topics: ensureArray(payload.topics ?? []),
    forum: payload.forum ?? null,
    period: payload.period ?? null,
    pagination: payload.pagination ?? null,
  }
}

export async function createForumPeriodForumTopic(periodId, forumId, payload) {
  if (!periodId) throw new Error('periodId is required')
  if (!forumId) throw new Error('forumId is required')
  const res = await api.post(`/forum-periods/${periodId}/forums/${forumId}/topics`, payload)
  return unwrap(res) ?? {}
}

export async function joinForumPeriodByCode(payload) {
  const res = await api.post('/forum-periods/join', payload)
  return unwrap(res) ?? {}
}

export default {
  listForumPeriods,
  getForumPeriod,
  createForumPeriod,
  updateForumPeriod,
  listForumPeriodForums,
  createForumPeriodForum,
  listForumPeriodForumTopics,
  createForumPeriodForumTopic,
  joinForumPeriodByCode,
}
