const DEFAULT_BACKEND_ORIGIN = 'http://localhost:8080'

const trimTrailingSlash = (value) => value.replace(/\/$/, '')

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').trim()

const rawApiBase = API_BASE_URL
const apiOrigin = rawApiBase.startsWith('http')
  ? rawApiBase.replace(/\/api\/?.*$/, '')
  : ''
const proxyTarget = (import.meta.env.VITE_PROXY_TARGET || '').trim()
const explicitStorageBase = (import.meta.env.VITE_STORAGE_BASE_URL || '').trim()
const runtimeFallback = typeof window !== 'undefined' ? window.location.origin : ''

export const STORAGE_BASE_URL = trimTrailingSlash(
  explicitStorageBase ||
    apiOrigin ||
    proxyTarget ||
    (import.meta.env.DEV ? DEFAULT_BACKEND_ORIGIN : runtimeFallback)
)

