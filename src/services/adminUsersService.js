import api from './api'

function unwrap(body) {
  if (!body) return {}
  if (body.data && typeof body.data === 'object') return body.data
  if (body.message && typeof body.message === 'object') return body.message
  return body
}

function extractPaginator(payload = {}) {
  const paginator = payload?.users ?? payload
  const data = Array.isArray(paginator?.data) ? paginator.data : []
  const pagination = {
    currentPage: paginator.current_page ?? 1,
    perPage: paginator.per_page ?? data.length ?? 0,
    total: paginator.total ?? data.length ?? 0,
    lastPage: paginator.last_page ?? 1,
    from: paginator.from ?? null,
    to: paginator.to ?? null,
  }

  return { data, pagination }
}

export async function listUsers(params = {}) {
  const res = await api.get('/admin/users', { params })
  const payload = unwrap(res.data)
  const { data, pagination } = extractPaginator(payload)
  return { users: data, pagination }
}

export async function getUser(userId) {
  if (!userId) return null
  const res = await api.get(`/admin/users/${userId}`)
  const payload = unwrap(res.data)
  return payload.user || payload || null
}

export async function getUserRoles(userId) {
  if (!userId) return []
  const res = await api.get(`/admin/users/${userId}/roles`)
  const payload = unwrap(res.data)
  return payload.roles || []
}

export async function getActivityLogs(userId) {
  if (!userId) return []
  const res = await api.get(`/admin/users/${userId}/activity-logs`)
  const payload = unwrap(res.data)
  return payload.activities || []
}

export async function createUser(input) {
  const res = await api.post('/admin/users', input)
  const payload = unwrap(res.data)
  return payload.user || payload
}

export async function updateUser(userId, input) {
  const res = await api.put(`/admin/users/${userId}`, input)
  const payload = unwrap(res.data)
  return payload.user || payload
}

export async function deleteUser(userId, reason) {
  const res = await api.delete(`/admin/users/${userId}`, { data: { reason } })
  return unwrap(res.data)
}

export async function bulkUpdateStatus(payload) {
  const res = await api.post('/admin/users/bulk-update-status', payload)
  return unwrap(res.data)
}

export async function getStatistics() {
  const res = await api.get('/admin/users/statistics')
  const payload = unwrap(res.data)
  return payload.statistics || payload || {}
}

export async function getRoles() {
  const res = await api.get('/admin/users/roles/reference')
  const payload = unwrap(res.data)
  return payload.roles || []
}

export async function assignRole(userId, roleId, reason) {
  const res = await api.post(`/admin/users/${userId}/assign-role`, { role_id: roleId, reason })
  return unwrap(res.data)
}

export async function revokeRole(userId, roleId, reason) {
  const res = await api.delete(`/admin/users/${userId}/roles/${roleId}`, { data: { reason } })
  return unwrap(res.data)
}

export async function activateUser(userId) {
  const res = await api.patch(`/admin/users/${userId}/activate`)
  const payload = unwrap(res.data)
  return payload.user || payload
}

export async function deactivateUser(userId, reason = 'Deactivated via admin UI') {
  const res = await api.patch(`/admin/users/${userId}/deactivate`, { reason })
  const payload = unwrap(res.data)
  return payload.user || payload
}

export async function resetPassword(userId, input) {
  const res = await api.post(`/admin/users/${userId}/reset-password`, input)
  return unwrap(res.data)
}

export async function restoreUser(userId) {
  const res = await api.post(`/admin/users/${userId}/restore`)
  const payload = unwrap(res.data)
  return payload.user || payload
}

export default {
  listUsers,
  getUser,
  getUserRoles,
  getActivityLogs,
  createUser,
  updateUser,
  deleteUser,
  bulkUpdateStatus,
  getStatistics,
  getRoles,
  assignRole,
  revokeRole,
  activateUser,
  deactivateUser,
  resetPassword,
  restoreUser,
}
