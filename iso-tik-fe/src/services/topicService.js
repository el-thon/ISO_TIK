import api from './api'

const DEFAULT_PAGINATION = {
  current_page: 1,
  per_page: 15,
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

const unwrap = (response) => {
  const successPayload = response?.data?.data
  if (successPayload && typeof successPayload === 'object') {
    return successPayload
  }

  const messagePayload = response?.data?.message
  if (messagePayload && typeof messagePayload === 'object') {
    return messagePayload
  }

  return response?.data ?? {}
}

export async function listTopics(params = {}) {
  const res = await api.get('/topics', { params })
  const payload = unwrap(res) ?? {}
  return {
    topics: ensureArray(payload.topics ?? payload.items ?? []),
    pagination: { ...DEFAULT_PAGINATION, ...(payload.pagination ?? {}) },
  }
}

export async function getTopic(topicId) {
  if (!topicId) throw new Error('topicId is required')
  const res = await api.get(`/topics/${topicId}`)
  return unwrap(res) ?? {}
}

export async function getTopicLabels(topicId) {
  if (!topicId) throw new Error('topicId is required to list labels')
  const res = await api.get(`/topics/${topicId}/labels`)
  const payload = unwrap(res) ?? {}
  return {
    labels: ensureArray(payload.labels ?? []),
  }
}

export async function attachTopicLabel(topicId, labelId) {
  if (!topicId) throw new Error('topicId is required to attach label')
  if (!labelId) throw new Error('labelId is required to attach label')
  const res = await api.post(`/topics/${topicId}/labels`, { label_id: labelId })
  return unwrap(res) ?? {}
}

export async function detachTopicLabel(topicId, labelId) {
  if (!topicId) throw new Error('topicId is required to detach label')
  if (!labelId) throw new Error('labelId is required to detach label')
  const res = await api.delete(`/topics/${topicId}/labels/${labelId}`)
  return unwrap(res) ?? {}
}

export async function createTopic(roomId, payload = {}) {
  if (!roomId) throw new Error('roomId is required when creating a topic')
  const res = await api.post(`/rooms/${roomId}/topics`, payload)
  return unwrap(res) ?? {}
}

export async function updateTopic(topicId, payload = {}) {
  if (!topicId) throw new Error('topicId is required when updating a topic')
  const res = await api.put(`/topics/${topicId}`, payload)
  return unwrap(res) ?? {}
}

export async function deleteTopic(topicId, params = {}) {
  if (!topicId) throw new Error('topicId is required when deleting a topic')
  const res = await api.delete(`/topics/${topicId}`, { params })
  return res?.data ?? {}
}

export async function publishTopic(topicId, payload = {}) {
  if (!topicId) throw new Error('topicId is required to publish')
  const res = await api.post(`/topics/${topicId}/publish`, payload)
  return unwrap(res) ?? {}
}

export async function approveTopic(topicId, payload = {}) {
  if (!topicId) throw new Error('topicId is required to approve')
  const res = await api.post(`/topics/${topicId}/approve`, payload)
  return unwrap(res) ?? {}
}

export async function requestChanges(topicId, payload = {}) {
  if (!topicId) throw new Error('topicId is required to request changes')
  const res = await api.post(`/topics/${topicId}/request-changes`, payload)
  return unwrap(res) ?? {}
}

export async function closeTopic(topicId, payload = {}) {
  if (!topicId) throw new Error('topicId is required to close')
  const res = await api.post(`/topics/${topicId}/close`, payload)
  return unwrap(res) ?? {}
}

export async function reopenTopic(topicId, payload = {}) {
  if (!topicId) throw new Error('topicId is required to reopen')
  const res = await api.post(`/topics/${topicId}/reopen`, payload)
  return unwrap(res) ?? {}
}

export async function restoreTopic(topicId) {
  if (!topicId) throw new Error('topicId is required to restore')
  const res = await api.post(`/topics/${topicId}/restore`)
  return unwrap(res) ?? {}
}

export async function freezeTopic(topicId, payload = {}) {
  if (!topicId) throw new Error('topicId is required to freeze')
  const res = await api.post(`/topics/${topicId}/freeze`, payload)
  return unwrap(res) ?? {}
}

export async function unfreezeTopic(topicId, payload = {}) {
  if (!topicId) throw new Error('topicId is required to unfreeze')
  const res = await api.post(`/topics/${topicId}/unfreeze`, payload)
  return unwrap(res) ?? {}
}

export async function getTopicTimeline(topicId, params = {}) {
  if (!topicId) throw new Error('topicId is required to get timeline')
  const res = await api.get(`/topics/${topicId}/timeline`, { params })
  const payload = unwrap(res) ?? {}
  return ensureArray(payload.events ?? [])
}

export async function getTopicReviews(topicId, params = {}) {
  if (!topicId) throw new Error('topicId is required to get reviews')
  // Backend currently exposes comments under /comments; keep function name for UI clarity
  const res = await api.get(`/topics/${topicId}/comments`, { params })
  const payload = unwrap(res) ?? {}
  return {
    reviews: ensureArray(payload.reviews ?? payload.items ?? payload.comments ?? []),
    pagination: { ...DEFAULT_PAGINATION, ...(payload.pagination ?? {}) },
  }
}

export async function createTopicReview(topicId, payload = {}) {
  if (!topicId) throw new Error('topicId is required to create review')
  const body = payload?.comment ?? payload?.body
  if (!body) throw new Error('comment is required to create review')
  const res = await api.post(`/topics/${topicId}/comments`, { body })
  return unwrap(res) ?? {}
}

export async function getTopicVersions(topicId, params = {}) {
  if (!topicId) throw new Error('topicId is required to get versions')
  const res = await api.get(`/topics/${topicId}/versions`, { params })
  const payload = unwrap(res) ?? {}
  return {
    versions: ensureArray(payload.versions ?? []),
    pagination: { ...DEFAULT_PAGINATION, ...(payload.pagination ?? {}) },
  }
}

export async function getTopicVersion(topicId, versionId) {
  if (!topicId) throw new Error('topicId is required to get version detail')
  if (!versionId) throw new Error('versionId is required to get version detail')
  const res = await api.get(`/topics/${topicId}/versions/${versionId}`)
  return unwrap(res) ?? {}
}

export async function revertTopicVersion(topicId, versionId, payload = {}) {
  if (!topicId) throw new Error('topicId is required to revert version')
  if (!versionId) throw new Error('versionId is required to revert version')
  const res = await api.post(`/topics/${topicId}/versions/${versionId}/revert`, payload)
  return unwrap(res) ?? {}
}

export default {
  listTopics,
  getTopic,
  getTopicLabels,
  attachTopicLabel,
  detachTopicLabel,
  createTopic,
  updateTopic,
  deleteTopic,
  publishTopic,
  approveTopic,
  requestChanges,
  closeTopic,
  reopenTopic,
  restoreTopic,
  freezeTopic,
  unfreezeTopic,
  getTopicTimeline,
  getTopicReviews,
  createTopicReview,
  getTopicVersions,
  getTopicVersion,
  revertTopicVersion,
}
