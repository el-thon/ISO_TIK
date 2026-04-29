// ============ CONSTANTS ============
export const PHOTO_OVERRIDE_KEY = 'iso_tik_profile_photo_override'
export const PHOTO_VERSION_KEY = 'iso_tik_photo_version'

// ============ STORAGE BASE URL ============
const rawApiBase = (import.meta.env.VITE_API_BASE_URL || '').trim()
const apiOrigin = rawApiBase ? rawApiBase.replace(/\/api\/?.*$/, '') : ''
const proxyTarget = (import.meta.env.VITE_PROXY_TARGET || '').trim()
const explicitStorageBase = (import.meta.env.VITE_STORAGE_BASE_URL || '').trim()
const runtimeFallback = typeof window !== 'undefined' ? window.location.origin : ''

const STORAGE_BASE = (explicitStorageBase || apiOrigin || proxyTarget || (import.meta.env.DEV ? 'http://localhost:8000' : runtimeFallback)).replace(/\/$/, '')

// ============ PHOTO URL RESOLVER ============
export const resolvePhotoUrl = (path, bypassCache = false) => {
  if (!path) return null
  
  let timestamp = Date.now()
  if (!bypassCache) {
    try {
      const storedVersion = localStorage.getItem(PHOTO_VERSION_KEY)
      if (storedVersion) timestamp = storedVersion
    } catch { /* ignore */ }
  }
  
  // Case 1: Full URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return `${path}${path.includes('?') ? '&' : '?'}_t=${timestamp}`
  }
  
  // Case 2: Absolute server path
  const isAbsolutePath = path.startsWith('/mnt/') || 
                         path.startsWith('/home/') || 
                         path.startsWith('C:/') || 
                         path.startsWith('D:/') ||
                         path.startsWith('/Users/')
  
  if (isAbsolutePath) {
    const storageIndex = path.indexOf('public/storage/')
    if (storageIndex !== -1) {
      const relativePath = path.substring(storageIndex + 'public/storage/'.length)
      return `${STORAGE_BASE}/storage/${relativePath}?_t=${timestamp}`
    }
    const parts = path.split('/')
    const filename = parts[parts.length - 1]
    const folder = parts[parts.length - 2]
    if (filename && folder) {
      return `${STORAGE_BASE}/storage/profile-photos/${folder}/${filename}?_t=${timestamp}`
    }
  }
  
  // Case 3: Relative path
  const cleanPath = path.startsWith('/') ? path.substring(1) : path
  let fullUrl = cleanPath.startsWith('storage/') 
    ? `${STORAGE_BASE}/${cleanPath}`
    : `${STORAGE_BASE}/storage/${cleanPath}`
  
  return `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}_t=${timestamp}`
}

// ============ EXTRACT PHOTO PATH FROM API RESPONSE ============
export const extractPhotoPath = (payload) => {
  if (!payload) return null
  if (payload.photo_url) return payload.photo_url
  if (payload.profile?.photo_url) return payload.profile.photo_url
  if (payload.data?.photo_url) return payload.data.photo_url
  if (payload.data?.profile?.photo_url) return payload.data.profile.photo_url
  if (payload.user?.photo_url) return payload.user.photo_url
  return null
}

// ============ GET INITIALS FROM NAME ============
export const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('') || '??'
}

// ============ GET TAB FROM QUERY PARAM ============
export const getTabFromQuery = (search) => {
  const params = new URLSearchParams(search)
  const tab = params.get('tab')
  return ['overview', 'personal', 'employment', 'security'].includes(tab) ? tab : 'overview'
}

// ============ FORMAT DATE ============
export const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}