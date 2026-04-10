import axios from 'axios'
import { toast } from '@/components/ui/use-toast'

// In development we prefer a relative API path so Vite can proxy /api to the backend
const apiBaseEnv = (import.meta.env.VITE_API_BASE_URL || '').trim()
const API_BASE = apiBaseEnv || '/api/v1'

// Token storage helpers (configurable via env)
const ACCESS_KEY = (import.meta.env.VITE_ACCESS_TOKEN_KEY || 'iso_tik_access_token').trim()
const REFRESH_KEY = (import.meta.env.VITE_REFRESH_TOKEN_KEY || 'iso_tik_refresh_token').trim()
const ACCESS_EXPIRES_KEY = (import.meta.env.VITE_ACCESS_TOKEN_EXPIRES_KEY || 'iso_tik_access_expires_at').trim()
const REFRESH_EXPIRES_KEY = (import.meta.env.VITE_REFRESH_TOKEN_EXPIRES_KEY || 'iso_tik_refresh_expires_at').trim()

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}

export function getAccessExpiresAt() {
  return localStorage.getItem(ACCESS_EXPIRES_KEY)
}

export function getRefreshExpiresAt() {
  return localStorage.getItem(REFRESH_EXPIRES_KEY)
}

export function setTokens({ access_token, refresh_token, access_expires_at, refresh_expires_at }) {
  if (access_token) localStorage.setItem(ACCESS_KEY, access_token)
  if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token)
  if (access_expires_at) localStorage.setItem(ACCESS_EXPIRES_KEY, access_expires_at)
  if (refresh_expires_at) localStorage.setItem(REFRESH_EXPIRES_KEY, refresh_expires_at)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(ACCESS_EXPIRES_KEY)
  localStorage.removeItem(REFRESH_EXPIRES_KEY)
  localStorage.removeItem('user_data')
}

const getStoredUserData = () => {
  try {
    const raw = localStorage.getItem('user_data')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const getUserRoles = (userData) => {
  const roles =
    userData?.roles ||
    userData?.data?.roles ||
    userData?.data?.user?.roles ||
    []

  return Array.isArray(roles) ? roles.map((role) => String(role).toLowerCase()) : []
}

const isProductOwnerUser = (userData) => getUserRoles(userData).includes('product_owner')

const isReadOnlyMethod = (method = 'GET') => ['GET', 'HEAD', 'OPTIONS'].includes(String(method).toUpperCase())
const DEADLINE_ERROR_MESSAGE_ID = 'Deadline forum period sudah lewat'
const DEADLINE_ERROR_MESSAGE_EN = 'Forum period deadline has passed'

let lastDeadlineToastAt = 0

const maybeShowDeadlinePassedToast = (error) => {
  const message = error?.response?.data?.message || error?.message || ''
  const normalized = String(message).toLowerCase()
  const isDeadlineMessage =
    normalized.includes(DEADLINE_ERROR_MESSAGE_ID.toLowerCase()) ||
    normalized.includes(DEADLINE_ERROR_MESSAGE_EN.toLowerCase())

  if (!isDeadlineMessage) return

  const now = Date.now()
  if (now - lastDeadlineToastAt < 1500) return
  lastDeadlineToastAt = now

  toast({
    variant: 'destructive',
    title: 'Deadline ruangan telah lewat',
    description: 'Deadline forum period sudah lewat. Akses tersedia dalam mode baca.',
  })
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

const parseExpiry = (value) => {
  if (!value) return null
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? null : parsed
}

const isExpiringSoon = (expiresAt, skewMs = 60000) => {
  const parsed = parseExpiry(expiresAt)
  if (!parsed) return false
  return parsed <= Date.now() + skewMs
}

const extractTokenMeta = (payload) => {
  return {
    access_expires_at: payload.access_expires_at || payload.accessExpiresAt || payload.access_expires || null,
    refresh_expires_at: payload.refresh_expires_at || payload.refreshExpiresAt || payload.refresh_expires || null,
  }
}

let refreshPromise = null

export const performRefresh = async () => {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error('No refresh token available')

  if (refreshPromise) return refreshPromise

  refreshPromise = axios
    .post(`${API_BASE}/auth/refresh`, null, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    })
    .then((refreshRes) => {
      const payload = refreshRes.data?.data ?? refreshRes.data ?? {}
      const newAccess = payload.access_token || payload.token || payload.accessToken
      const newRefresh = payload.refresh_token || payload.refreshToken || null
      const { access_expires_at, refresh_expires_at } = extractTokenMeta(payload)

      if (!newAccess) {
        throw new Error('Unable to refresh token')
      }

      setTokens({
        access_token: newAccess,
        refresh_token: newRefresh,
        access_expires_at,
        refresh_expires_at,
      })
      api.defaults.headers.common.Authorization = `Bearer ${newAccess}`
      return newAccess
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}


// Attach access token if available
// Attach access token if available
api.interceptors.request.use(async (config) => {
  let token = getAccessToken()
  const refreshToken = getRefreshToken()
  const accessExpiresAt = getAccessExpiresAt()
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
  if (token && refreshToken && isExpiringSoon(accessExpiresAt)) {
    try {
      token = await performRefresh()
    } catch (e) {
      clearTokens()
      redirectToLogin()
      return Promise.reject(e)
    }
  }

  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }

  const currentUser = getStoredUserData()
  if (isProductOwnerUser(currentUser) && !isReadOnlyMethod(config.method)) {
    // Suppress verbose message for product_owner write attempts so UI doesn't show it.
    // We still reject with 403 so callers can handle it, but hide description.
    const error = new Error('Akses ditolak. Role product_owner hanya dapat melakukan operasi baca (GET).')
    error.response = {
      status: 403,
      data: {
        success: false,
        // Empty message to avoid surfacing this sentence in UI toasts.
        message: '',
        // hint for UI if it needs to suppress generic error toasts
        _silent: true,
      },
    }
    return Promise.reject(error)
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

    maybeShowDeadlinePassedToast(err)

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
      const newAccess = await performRefresh()
      processQueue(null, newAccess)
      originalRequest.headers = originalRequest.headers || {}
      originalRequest.headers.Authorization = `Bearer ${newAccess}`
      return api(originalRequest)
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
