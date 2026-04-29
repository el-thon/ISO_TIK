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

function stripSignaturePaths(signature) {
  if (!signature || typeof signature !== 'object') return signature
  const cleaned = { ...signature }
  delete cleaned.signature_url
  delete cleaned.url
  delete cleaned.path
  delete cleaned.download_url
  return cleaned
}

function sanitizeSignaturePayload(payload) {
  if (!payload || typeof payload !== 'object') return payload
  if (payload.signature && typeof payload.signature === 'object') {
    return { ...payload, signature: stripSignaturePaths(payload.signature) }
  }
  return stripSignaturePaths(payload)
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

export async function changePassword(payload) {
  const res = await api.post('/profile/change-password', payload)
  return res?.data ?? {}
}

export async function uploadPhoto(fileOrFormData) {
  if (!fileOrFormData) throw new Error('File is required')
  const formData = fileOrFormData instanceof FormData ? fileOrFormData : new FormData()
  if (!(fileOrFormData instanceof FormData)) {
    formData.append('photo', fileOrFormData)
    formData.append('image', fileOrFormData)
  }
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

export async function getSessions(params = {}) {
  // Primary endpoint per spec: /profile/sessions
  // Keep compatibility with security-prefixed alias if backend still uses it
  try {
    const res = await api.get('/profile/sessions', { params })
    const payload = unwrap(res) ?? {}
    return toPaginator(payload)
  } catch (err) {
    const res = await api.get('/profile/security/sessions', { params })
    const payload = unwrap(res) ?? {}
    return toPaginator(payload)
  }
}

export async function getLoginHistory(params = {}) {
  try {
    const res = await api.get('/profile/login-history', { params })
    const payload = unwrap(res) ?? {}
    return toPaginator(payload)
  } catch (err) {
    const res = await api.get('/profile/security/login-history', { params })
    const payload = unwrap(res) ?? {}
    return toPaginator(payload)
  }
}

export async function revokeSession(sessionId, payload = {}) {
  if (!sessionId) throw new Error('Session ID is required')
  try {
    const res = await api.delete(`/profile/sessions/${sessionId}`, { data: payload })
    return res?.data ?? {}
  } catch (err) {
    const res = await api.delete(`/profile/security/sessions/${sessionId}`, { data: payload })
    return res?.data ?? {}
  }
}

export async function revokeAllSessions(payload) {
  try {
    const res = await api.delete('/profile/sessions/all', { data: payload })
    return res?.data ?? {}
  } catch (err) {
    const res = await api.delete('/profile/security/sessions', { data: payload })
    return res?.data ?? {}
  }
}

// Signature endpoints
export async function getSignature() {
  // Self-service per backend spec; treat 404 as "belum ada" tanpa melempar error
  try {
    const res = await api.get('/profile/signature', {
      validateStatus: (status) => [200, 201, 204, 404].includes(status),
    })

    if (res.status === 404) return {}
    return sanitizeSignaturePayload(unwrap(res) ?? {})
  } catch (err) {
    if (err?.response?.status === 404) return {}
    throw err
  }
}

export async function uploadSignature(fileOrFormData) {
  if (!fileOrFormData) throw new Error('Signature file is required')
  const formData = fileOrFormData instanceof FormData ? fileOrFormData : new FormData()

  if (!(fileOrFormData instanceof FormData)) {
    // Backend expects field name `file` (png/jpg/jpeg, max 2MB); keep `signature` for compatibility
    formData.append('file', fileOrFormData)
    formData.append('signature', fileOrFormData)
  } else {
    const keys = Array.from(formData.keys())
    const hasFile = keys.includes('file')
    const hasSignature = keys.includes('signature')
    if (!hasFile) {
      const existing = formData.get('signature') || formData.get('image')
      if (existing) formData.append('file', existing)
    }
    if (!hasSignature) {
      const existing = formData.get('file') || formData.get('image')
      if (existing) formData.append('signature', existing)
    }
  }
  const res = await api.post('/profile/signature', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return sanitizeSignaturePayload(unwrap(res) ?? {})
}

export async function deleteSignature() {
  const res = await api.delete('/profile/signature')
  return res?.data ?? {}
}

export async function downloadSignature() {
  try {
    const res = await api.get('/profile/signature/download', { responseType: 'blob' })
    return res?.data
  } catch (err) {
    if (err?.response?.status === 404) return null
    throw err
  }
}

export default {
  fetchProfile,
  updateProfile,
  changePassword,
  uploadPhoto,
  deletePhoto,
  getSessions,
  getLoginHistory,
  revokeSession,
  revokeAllSessions,
}
