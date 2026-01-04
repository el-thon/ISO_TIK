import api from './api'

function unwrap(response) {
  const body = response?.data ?? response
  if (body && Object.prototype.hasOwnProperty.call(body, 'data')) return body.data
  return body
}

function unwrapArray(body, key) {
  if (!body) return []
  const data = body.data ?? body
  const value = key ? data?.[key] : data
  if (Array.isArray(value)) return value
  if (Array.isArray(data)) return data
  return []
}

function unwrapPaginator(body) {
  const data = body?.data ?? body ?? {}
  const items = Array.isArray(data.data) ? data.data : Array.isArray(data.items) ? data.items : []
  return {
    items,
    pagination: {
      currentPage: data.current_page ?? data.currentPage ?? 1,
      perPage: data.per_page ?? data.perPage ?? items.length ?? 0,
      total: data.total ?? items.length ?? 0,
      lastPage: data.last_page ?? data.lastPage ?? 1,
    },
    meta: {
      path: data.path,
      prevPageUrl: data.prev_page_url ?? data.prevPageUrl,
      nextPageUrl: data.next_page_url ?? data.nextPageUrl,
    },
  }
}

function toPaginator(payload = {}) {
  const items = Array.isArray(payload.data) ? payload.data : []
  return {
    items,
    pagination: {
      currentPage: payload.current_page ?? 1,
      perPage: payload.per_page ?? (items?.length ?? 0),
      total: payload.total ?? (items?.length ?? 0),
      lastPage: payload.last_page ?? 1,
    },
    meta: {
      path: payload.path,
      prevPageUrl: payload.prev_page_url,
      nextPageUrl: payload.next_page_url,
    },
  }
}

export async function fetchProfile() {
  const res = await api.get('/profile')
  // Backend returns {status,message,data:<user+profile+contact+employment+...>}
  return unwrap(res) ?? {}
}

export async function updateProfile(payload) {
  const res = await api.put('/profile', payload)
  // Controller returns same shape as fetchProfile
  return unwrap(res) ?? {}
}

export async function updateEmployment({ userId, payload }) {
  if (!userId) throw new Error('userId is required to update employment')
  // Backend expects flat fields, not nested under "employment"
  const res = await api.put(`/admin/users/${userId}/employment`, payload)
  return unwrap(res) ?? {}
}

export async function updatePreferences(preferencesPayload) {
  const res = await api.put('/profile/preferences', { preferences: preferencesPayload })
  const data = unwrap(res) ?? {}
  return data.preferences ?? data
}

export async function changePassword(payload) {
  const res = await api.post('/profile/change-password', payload)
  return res?.data ?? {}
}

export async function uploadPhoto(file) {
  if (!file) throw new Error('File is required')
  const formData = new FormData()
  formData.append('photo', file)
  const res = await api.post('/profile/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  // Backend returns data.photo_url (already Storage::url)
  return unwrap(res) ?? {}
}

export async function deletePhoto() {
  const res = await api.delete('/profile/photo')
  return res?.data ?? {}
}

export async function getSecuritySettings() {
  const res = await api.get('/profile/security')
  // Returns { mfa_enabled, sessions: [...], login_history: [...] }
  return unwrap(res) ?? {}
}

export async function getSessions(params = {}) {
  const res = await api.get('/profile/security/sessions', { params })
  const payload = unwrap(res) ?? {}
  return toPaginator(payload)
}

export async function getLoginHistory(params = {}) {
  const res = await api.get('/profile/security/login-history', { params })
  const payload = unwrap(res) ?? {}
  return toPaginator(payload)
}

export async function revokeSession(sessionId, payload = {}) {
  if (!sessionId) throw new Error('Session ID is required')
  const res = await api.delete(`/profile/security/sessions/${sessionId}`, { data: payload })
  return res?.data ?? {}
}

export async function revokeAllSessions(payload) {
  const res = await api.delete('/profile/security/sessions', { data: payload })
  return res?.data ?? {}
}

export default {
  fetchProfile,
  updateProfile,
  updatePreferences,
  changePassword,
  uploadPhoto,
  deletePhoto,
  getSecuritySettings,
  getSessions,
  getLoginHistory,
  revokeSession,
  revokeAllSessions,
}
