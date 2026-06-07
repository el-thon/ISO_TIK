import api from './api'
import { ensureArray, mergePagination, unwrapApiPayload } from './serviceUtils'

const unwrapForumPayload = (payload = {}) => payload.forum ?? payload.room ?? payload
const normalizeForum = (forum = {}) => {
  const participantCount = forum?.participant_count ?? forum?.participants_count ?? 0
  const formCount = forum?.form_count ?? forum?.forms_count ?? forum?.topic_count ?? forum?.topics_count ?? forum?.formulir_count ?? 0
  const createdByUser = forum?.created_by_user ?? forum?.owner ?? forum?.responsible_user ?? null

  return {
    ...forum,
    participant_count: participantCount,
    participants_count: forum?.participants_count ?? participantCount,
    form_count: formCount,
    forms_count: forum?.forms_count ?? formCount,
    topic_count: formCount,
    topics_count: forum?.topics_count ?? formCount,
    stats: {
      ...(forum?.stats ?? {}),
      participant_count: forum?.stats?.participant_count ?? participantCount,
      form_count: forum?.stats?.form_count ?? forum?.stats?.topic_count ?? formCount,
      topic_count: forum?.stats?.topic_count ?? formCount,
    },
    created_by_user: createdByUser,
    owner: forum?.owner ?? createdByUser,
    created_by: forum?.created_by ?? createdByUser?.name ?? createdByUser?.username ?? null,
  }
}

export async function listForums(params = {}) {
  const res = await api.get('/forums', { params })
  const payload = unwrapApiPayload(res) ?? {}
  return {
    forums: ensureArray(payload.forums ?? payload.rooms ?? payload.items ?? []),
    pagination: mergePagination(payload.pagination),
    metadata: payload.metadata ?? null,
  }
}

export async function getForum(forumId) {
  if (!forumId) throw new Error('forumId is required')
  const res = await api.get(`/forums/${forumId}`)
  return normalizeForum(unwrapForumPayload(unwrapApiPayload(res) ?? {}))
}

export async function updateForum(forumId, payload) {
  if (!forumId) throw new Error('forumId is required')
  const res = await api.put(`/forums/${forumId}`, payload)
  return normalizeForum(unwrapForumPayload(unwrapApiPayload(res) ?? {}))
}

export async function deleteForum(forumId) {
  if (!forumId) throw new Error('forumId is required')
  const res = await api.delete(`/forums/${forumId}`)
  return res?.data ?? {}
}

export async function createForum(payload) {
  const res = await api.post('/forums', payload)
  return unwrapApiPayload(res) ?? {}
}

export async function lockForum(forumId, payload = {}) {
  if (!forumId) throw new Error('forumId is required')
  const res = await api.post(`/forums/${forumId}/lock`, payload)
  return normalizeForum(unwrapForumPayload(unwrapApiPayload(res) ?? {}))
}

export async function unlockForum(forumId) {
  if (!forumId) throw new Error('forumId is required')
  const res = await api.post(`/forums/${forumId}/unlock`)
  return normalizeForum(unwrapForumPayload(unwrapApiPayload(res) ?? {}))
}

export async function archiveForum(forumId) {
  if (!forumId) throw new Error('forumId is required')
  const res = await api.post(`/forums/${forumId}/archive`)
  return normalizeForum(unwrapForumPayload(unwrapApiPayload(res) ?? {}))
}

export async function restoreForum(forumId) {
  if (!forumId) throw new Error('forumId is required')
  const res = await api.post(`/forums/${forumId}/restore`)
  return normalizeForum(unwrapForumPayload(unwrapApiPayload(res) ?? {}))
}

const isUuidLike = (value) => {
  if (!value) return false
  const raw = String(value).trim()
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw)) return true
  const compact = raw.replace(/-/g, '')
  return /^[0-9a-f]{16,64}$/i.test(compact)
}

const resolveParticipantId = (participant) => {
  if (!participant) return null
  const candidates = [
    participant.id,
    participant.participant_id,
    participant.forum_participant_id,
    participant.room_participant_id,
    participant.participant_uuid,
    participant.forum_participant?.id,
    participant.room_participant?.id,
    participant.pivot?.id,
    participant.uuid,
  ].filter(Boolean)
  const uuidCandidate = candidates.find(isUuidLike)
  return uuidCandidate || null
}

export async function listForumParticipants(forumId, params = {}) {
  if (!forumId) throw new Error('forumId is required')
  const res = await api.get(`/forums/${forumId}/participants`, { params })
  const payload = unwrapApiPayload(res) ?? {}
  return {
    participants: ensureArray(payload.participants ?? []).map((participant) => {
      const resolvedParticipantId = resolveParticipantId(participant)
      return {
        ...participant,
        id: resolvedParticipantId ?? participant?.id,
        participant_id: resolvedParticipantId ?? participant?.participant_id,
      }
    }),
    pagination: mergePagination(payload.pagination),
  }
}

export async function addForumParticipant(forumId, payload) {
  if (!forumId) throw new Error('forumId is required')
  const res = await api.post(`/forums/${forumId}/participants`, payload)
  return unwrapApiPayload(res) ?? {}
}

export async function updateForumParticipant(forumId, participantId, payload) {
  if (!forumId || !participantId) throw new Error('forumId and participantId are required')
  const res = await api.put(`/forums/${forumId}/participants/${participantId}`, payload)
  return unwrapApiPayload(res) ?? {}
}

export async function removeForumParticipant(forumId, participantId) {
  if (!forumId || !participantId) throw new Error('forumId and participantId are required')
  const res = await api.delete(`/forums/${forumId}/participants/${participantId}`)
  return res?.data ?? {}
}

export async function leaveForum(forumId) {
  if (!forumId) throw new Error('forumId is required')
  const res = await api.post(`/forums/${forumId}/leave`)
  return unwrapApiPayload(res) ?? {}
}

export async function listForumForms(forumId, params = {}) {
  if (!forumId) throw new Error('forumId is required')
  const res = await api.get(`/forums/${forumId}/topics`, { params })
  const payload = unwrapApiPayload(res) ?? {}
  const forms = ensureArray(payload.forms ?? payload.formulir ?? payload.topics ?? [])
  return {
    forms,
    topics: forms,
    pagination: mergePagination(payload.pagination),
  }
}

export async function joinForumByCode(payload) {
  const res = await api.post('/forums/join', payload)
  return unwrapApiPayload(res) ?? {}
}

export async function listAvailableUsers(params = {}) {
  const res = await api.get('/users', { params })
  const payload = unwrapApiPayload(res) ?? {}
  const users = ensureArray(payload.users ?? payload.items ?? []).map((user) => {
    const profile = user?.profile || user?.user?.profile || {}
    return {
      id: user?.id || user?.user_id,
      user_id: user?.user_id || user?.id,
      username: user?.username || user?.user?.username || '',
      name: profile?.full_name || user?.user?.profile?.full_name || user?.username || 'User',
      profile,
      user: user?.user || user,
    }
  })

  return {
    users,
    pagination: mergePagination(payload.pagination),
  }
}

export default {
  listForums,
  getForum,
  createForum,
  updateForum,
  deleteForum,
  lockForum,
  unlockForum,
  archiveForum,
  restoreForum,
  listForumParticipants,
  addForumParticipant,
  updateForumParticipant,
  removeForumParticipant,
  leaveForum,
  listForumForms,
  joinForumByCode,
  listAvailableUsers,
}
