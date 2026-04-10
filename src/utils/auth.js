// utils/auth.js
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '@/services/api'

export const getCurrentUserId = () => {
  if (typeof window === 'undefined') return null
  
  try {
    // Coba dari user_data di localStorage
    const userData = localStorage.getItem('user_data')
    if (userData) {
      const parsed = JSON.parse(userData)
      if (parsed?.id) return parsed.id
      if (parsed?.user_id) return parsed.user_id
    }
    
    // Fallback: coba dari token (jika JWT)
    const token = localStorage.getItem('iso_tik_access_token')
    if (token && token.split('.').length === 3) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.sub || payload.user_id || payload.id || null
      } catch {
        // Token bukan JWT
        console.log('[Auth] Token is not JWT, skipping decode')
      }
    }
  } catch (error) {
    console.error('[Auth] Error getting user ID:', error)
  }
  
  return null
}

export const getUserData = () => {
  if (typeof window === 'undefined') return null
  
  try {
    const userData = localStorage.getItem('user_data')
    if (userData) {
      return JSON.parse(userData)
    }
  } catch (e) {
    console.error('[Auth] Error parsing user data:', e)
  }
  
  return null
}

export const getUserRoles = (userData = null) => {
  const source = userData || getUserData()
  const roles =
    source?.roles ||
    source?.data?.roles ||
    source?.data?.user?.roles ||
    []

  if (!Array.isArray(roles)) return []
  return roles.map((role) => String(role).toLowerCase().replace(/\s+/g, '_'))
}

export const isProductOwnerUser = (userData = null) => {
  return getUserRoles(userData).includes('product_owner')
}

export const isAuthenticated = () => {
  return !!getAccessToken()
}

export const saveUserData = (user) => {
  if (typeof window === 'undefined') return
  
  try {
    if (user) {
      localStorage.setItem('user_data', JSON.stringify(user))
      console.log('[Auth] User data saved:', user)
    }
  } catch (e) {
    console.error('[Auth] Error saving user data:', e)
  }
}

export const clearUserData = () => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem('user_data')
    console.log('[Auth] User data cleared')
  } catch (e) {
    console.error('[Auth] Error clearing user data:', e)
  }
}

// Re-export dari api.js untuk kemudahan
export { getAccessToken, getRefreshToken, setTokens, clearTokens } from '@/services/api'

export default {
  getCurrentUserId,
  getUserData,
  getUserRoles,
  isProductOwnerUser,
  isAuthenticated,
  saveUserData,
  clearUserData,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens
}