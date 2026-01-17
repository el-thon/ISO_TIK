import api, { setTokens, clearTokens, getRefreshToken } from './api'
import axios from 'axios'

// Helper to normalize token fields from various backend shapes
function extractTokensFromResponse(data) {
  if (!data) return { access: null, refresh: null }
  // common top-level shapes
  const access = data.access_token || data.token || data.accessToken || null
  const refresh = data.refresh_token || data.refreshToken || null
  if (access || refresh) return { access, refresh }

  // nested under data or result
  const nested = data.data || data.result || null
  if (nested) {
    const naccess = nested.access_token || nested.token || nested.accessToken || null
    const nrefresh = nested.refresh_token || nested.refreshToken || null
    return { access: naccess, refresh: nrefresh }
  }

  return { access: null, refresh: null }
}

// Low-level auth API calls. These functions return the axios response.data
// and intentionally don't manipulate global state (except login helper below).

export async function login({ username, password }) {
  const res = await api.post('/auth/login', { username, password })
  const data = res.data || {}
  const { access, refresh } = extractTokensFromResponse(data)
  if (access) {
    setTokens({ access_token: access, refresh_token: refresh })
  }
  return data
}

export async function logout() {
  try {
    await api.post('/auth/logout')
  } finally {
    // Always clear tokens on logout locally
    clearTokens()
  }
}

export async function ssoLogin({ auth_code, state, code_verifier, provider }) {
  const payload = {
    auth_code,
    state,
    ...(code_verifier ? { code_verifier } : {}),
    ...(provider ? { provider } : {}),
  }

  const res = await api.post('/auth/sso/login', payload)
  const data = res.data || {}
  const { access, refresh } = extractTokensFromResponse(data)

  if (access) {
    setTokens({ access_token: access, refresh_token: refresh })
  }

  return data
}

export async function refresh() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error('No refresh token available')

  // Use plain axios to avoid interceptors
  const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, null, {
    headers: { Authorization: `Bearer ${refreshToken}` },
  })

  const data = res.data || {}
  const { access, refresh: newRefresh } = extractTokensFromResponse(data)
  if (access) {
    setTokens({ access_token: access, refresh_token: newRefresh })
  }
  return data
}

export async function me() {
  const res = await api.get('/auth/me')
  return res.data
}

export default {
  login,
  logout,
  refresh,
  me,
  ssoLogin,
}
