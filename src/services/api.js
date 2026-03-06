import axios from 'axios'

// In development we prefer a relative API path so Vite can proxy /api to the backend
const apiBaseEnv = (import.meta.env.VITE_API_BASE_URL || '').trim()
const API_BASE = apiBaseEnv || '/api/v1'

// Token storage helpers (configurable via env)
const ACCESS_KEY = (import.meta.env.VITE_ACCESS_TOKEN_KEY || 'iso_tik_access_token').trim()
const REFRESH_KEY = (import.meta.env.VITE_REFRESH_TOKEN_KEY || 'iso_tik_refresh_token').trim()

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens({ access_token, refresh_token }) {
  if (access_token) localStorage.setItem(ACCESS_KEY, access_token)
  if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

// Hard redirect ke halaman login ketika sesi kadaluarsa
const redirectToLogin = () => {
  if (typeof window === 'undefined') return
  const loginPath = '/login'
  // Hindari loop jika sudah di halaman login
  if (window.location.pathname === loginPath) return
  window.location.replace(loginPath)
}

// Primary axios instance used throughout app. It automatically attaches
// Authorization header when access token present and attempts a single
// refresh+retry on 401 responses.
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Attach access token if available
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  // Attach timezone header according to OpenAPI parameter recommendation
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz) {
      config.headers = config.headers || {}
      if (!config.headers.Timezone && !config.headers.timezone) {
        config.headers.Timezone = tz
      }
    }
  } catch (e) {
    // ignore timezone errors
  }
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: on 401 try to refresh using refresh token and retry once
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err?.config

    // If no response or not 401 return immediately
    if (!err.response || err.response.status !== 401) {
      return Promise.reject(err)
    }

    // Prevent infinite loop
    if (!originalRequest) {
      return Promise.reject(err)
    }

    if (originalRequest._retry) {
      return Promise.reject(err)
    }

    // Attempt refresh
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      // No refresh token - clear and reject
      clearTokens()
      redirectToLogin()
      return Promise.reject(err)
    }

    if (isRefreshing) {
      // Queue the request until refresh finishes
      return new Promise(function (resolve, reject) {
        failedQueue.push({ resolve, reject })
      })
        .then((token) => {
          originalRequest.headers = originalRequest.headers || {}
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
        .catch((e) => Promise.reject(e))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      // Use a bare axios instance to avoid interceptors
      const refreshRes = await axios.post(
        `${API_BASE}/auth/refresh`,
        null,
        { headers: { Authorization: `Bearer ${refreshToken}` } }
      )

      const payload = refreshRes.data?.data ?? refreshRes.data ?? {}
      const newAccess = payload.access_token || payload.token || payload.accessToken
      const newRefresh = payload.refresh_token || payload.refreshToken || null

      if (newAccess) {
        setTokens({ access_token: newAccess, refresh_token: newRefresh })
        api.defaults.headers.common.Authorization = `Bearer ${newAccess}`
        processQueue(null, newAccess)
        return api(originalRequest)
      }

      // If refresh didn't provide token, clear and reject
      clearTokens()
      processQueue(new Error('Unable to refresh token'), null)
      redirectToLogin()
      return Promise.reject(err)
    } catch (refreshErr) {
      clearTokens()
      processQueue(refreshErr, null)
      redirectToLogin()
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
