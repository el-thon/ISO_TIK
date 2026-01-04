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

export async function listGroups(params = {}) {
  const res = await api.get('/groups', { params })
  const payload = unwrap(res) ?? {}
  return {
    groups: ensureArray(payload.groups ?? payload.items ?? []),
    pagination: { ...DEFAULT_PAGINATION, ...(payload.pagination ?? {}) },
  }
}

export async function createGroup(payload) {
  const res = await api.post('/groups', payload)
  return unwrap(res) ?? {}
}

export async function joinGroup(code) {
  const res = await api.post('/groups/join', { code })
  return unwrap(res) ?? {}
}

export async function getGroup(groupId) {
  if (!groupId) throw new Error('groupId is required')
  const res = await api.get(`/groups/${groupId}`)
  return unwrap(res) ?? {}
}

export async function updateGroup(groupId, payload) {
  if (!groupId) throw new Error('groupId is required')
  const res = await api.put(`/groups/${groupId}`, payload)
  return unwrap(res) ?? {}
}

export async function deleteGroup(groupId) {
  if (!groupId) throw new Error('groupId is required')
  const res = await api.delete(`/groups/${groupId}`)
  return res?.data ?? {}
}

export async function archiveGroup(groupId) {
  if (!groupId) throw new Error('groupId is required')
  const res = await api.post(`/groups/${groupId}/archive`)
  return unwrap(res) ?? {}
}

export async function restoreGroup(groupId) {
  if (!groupId) throw new Error('groupId is required')
  const res = await api.post(`/groups/${groupId}/restore`)
  return unwrap(res) ?? {}
}

export async function leaveGroup(groupId) {
  if (!groupId) throw new Error('groupId is required')
  const res = await api.post(`/groups/${groupId}/leave`)
  return unwrap(res) ?? {}
}

export async function listMembers(groupId) {
  if (!groupId) throw new Error('groupId is required')
  const res = await api.get(`/groups/${groupId}/members`)
  const payload = unwrap(res) ?? {}
  return {
    group: payload.group ?? null,
    members: ensureArray(payload.members ?? []),
    total: payload.total ?? (payload.members?.length ?? 0) ?? 0,
  }
}

export async function addMember(groupId, payload) {
  if (!groupId) throw new Error('groupId is required')
  const res = await api.post(`/groups/${groupId}/members`, payload)
  return unwrap(res) ?? {}
}

export async function updateMemberRole(groupId, userId, payload) {
  if (!groupId || !userId) throw new Error('groupId and userId are required')
  const res = await api.put(`/groups/${groupId}/members/${userId}`, payload)
  return unwrap(res) ?? {}
}

export async function removeMember(groupId, userId) {
  if (!groupId || !userId) throw new Error('groupId and userId are required')
  const res = await api.delete(`/groups/${groupId}/members/${userId}`)
  return res?.data ?? {}
}

export async function listRooms(groupId) {
  if (!groupId) throw new Error('groupId is required')
  const res = await api.get(`/groups/${groupId}/rooms`)
  const payload = unwrap(res) ?? {}
  return {
    group: payload.group ?? null,
    rooms: ensureArray(payload.rooms ?? []),
    total: payload.total ?? (payload.rooms?.length ?? 0) ?? 0,
  }
}

export async function createRoom(groupId, payload) {
  if (!groupId) throw new Error('groupId is required')
  const res = await api.post(`/groups/${groupId}/rooms`, payload)
  return unwrap(res) ?? {}
}

export async function getJoinCode(groupId) {
  if (!groupId) throw new Error('groupId is required')
  const res = await api.get(`/groups/${groupId}/join-code`)
  return unwrap(res) ?? {}
}

export async function generateJoinCode(groupId, payload) {
  if (!groupId) throw new Error('groupId is required')
  const res = await api.post(`/groups/${groupId}/join-code/generate`, payload)
  return unwrap(res) ?? {}
}

export async function disableJoinCode(groupId) {
  if (!groupId) throw new Error('groupId is required')
  const res = await api.post(`/groups/${groupId}/join-code/disable`)
  return unwrap(res) ?? {}
}

export default {
  listGroups,
  createGroup,
  joinGroup,
  getGroup,
  updateGroup,
  deleteGroup,
  archiveGroup,
  restoreGroup,
  leaveGroup,
  listMembers,
  addMember,
  updateMemberRole,
  removeMember,
  listRooms,
  createRoom,
  getJoinCode,
  generateJoinCode,
  disableJoinCode,
}
