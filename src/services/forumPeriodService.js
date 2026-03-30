import api from './api'

const ensureArray = (value) => (Array.isArray(value) ? value : value ? [value] : [])

const unwrap = (response) => response?.data?.data ?? response?.data ?? null

const pickArrayData = (...sources) => {
  for (const source of sources) {
    if (!source) continue
    if (Array.isArray(source)) return source
    if (Array.isArray(source?.data)) return source.data
    if (Array.isArray(source?.items)) return source.items
    if (Array.isArray(source?.results)) return source.results
    if (Array.isArray(source?.list)) return source.list
  }
  return []
}

export async function listForumPeriods(params = {}) {
  const res = await api.get('/forum-periods', { params })
  const payload = unwrap(res) ?? {}

  return {
    periods: ensureArray(
      pickArrayData(
        payload?.periods,
        payload?.items,
        payload?.data,
        payload?.results,
        payload?.list,
        payload
      )
    ),
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

  const forums = ensureArray(
    pickArrayData(
      payload?.forums,
      payload?.items,
      payload?.data,
      payload?.results,
      payload?.list,
      payload?.period?.forums,
      payload?.forum_period?.forums,
      payload
    )
  )

  return {
    forums,
    period:
      payload?.period ??
      payload?.forum_period ??
      payload?.forumPeriod ??
      null,
    pagination: payload?.pagination ?? null,
    raw: payload,
  }
}

export async function createForumPeriodForum(periodId, payload) {
  if (!periodId) throw new Error('periodId is required')
  const res = await api.post(`/forum-periods/${periodId}/forums`, payload)
  return unwrap(res) ?? {}
}

export async function updateForumPeriodForum(periodId, forumId, payload) {
  if (!periodId) throw new Error('periodId is required')
  if (!forumId) throw new Error('forumId is required')
  const res = await api.put(`/forum-periods/${periodId}/forums/${forumId}`, payload)
  return unwrap(res) ?? {}
}

export async function listForumPeriodForumTopics(periodId, forumId, params = {}) {
  if (!periodId) throw new Error('periodId is required')
  if (!forumId) throw new Error('forumId is required')
  const res = await api.get(`/forum-periods/${periodId}/forums/${forumId}/topics`, { params })
  const payload = unwrap(res) ?? {}

  return {
    topics: ensureArray(
      pickArrayData(
        payload?.topics,
        payload?.items,
        payload?.data,
        payload?.results,
        payload?.list,
        payload
      )
    ),
    forum: payload?.forum ?? null,
    period: payload?.period ?? null,
    pagination: payload?.pagination ?? null,
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
  updateForumPeriodForum,
  listForumPeriodForumTopics,
  createForumPeriodForumTopic,
  joinForumPeriodByCode,
}