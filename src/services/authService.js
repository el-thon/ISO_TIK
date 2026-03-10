import api, { setTokens, clearTokens, getRefreshToken } from './api'
import axios from 'axios'

function extractTokensFromResponse(data) {
  if (!data) return { access: null, refresh: null }
  
  
  // Handle response dari backend yang punya struktur { success: true, data: { ... } }
  let responseData = data
  
  // Jika data punya properti 'data', gunakan itu
  if (data.data && typeof data.data === 'object') {
    responseData = data.data
  }
  
  // Jika responseData punya properti 'data' lagi (nested lebih dalam)
  if (responseData.data && typeof responseData.data === 'object') {
    responseData = responseData.data
  }
  
  
  // Cari access token
  const access = 
    responseData.access_token || 
    responseData.token || 
    responseData.accessToken || 
    responseData.access || 
    null
    
  // Cari refresh token  
  const refresh = 
    responseData.refresh_token || 
    responseData.refreshToken || 
    responseData.refresh || 
    null
  
  return { access, refresh }
}

function extractUserFromResponse(data) {
  if (!data) return null
  
  
  // Handle response dari backend yang punya struktur { success: true, data: { user: { ... } } }
  let responseData = data
  
  // Jika data punya properti 'data', gunakan itu
  if (data.data && typeof data.data === 'object') {
    responseData = data.data
  }
  
  // Jika responseData punya properti 'data' lagi (nested lebih dalam)
  if (responseData.data && typeof responseData.data === 'object') {
    responseData = responseData.data
  }
  
  
  // Cari user di berbagai kemungkinan lokasi
  let user = null
  
  // 1. Langsung di responseData.user
  if (responseData.user && typeof responseData.user === 'object') {
    user = responseData.user
  }
  // 2. Di responseData (langsung)
  else if (responseData.id || responseData.user_id) {
    user = responseData
  }
  // 3. Di responseData.data (kemungkinan struktur lain)
  else if (responseData.data && responseData.data.user) {
    user = responseData.data.user
  }
  
  // Validasi user punya ID
  if (user && (user.id || user.user_id)) {
    // Normalisasi ID ke field 'id'
    if (user.user_id && !user.id) {
      user.id = user.user_id
    }
    return user
  }
  
  return null
}

export async function login({ username, password }) {
  try {    
    const res = await api.post('/auth/login', { username, password })
    const responseData = res.data || {}
    
    // Extract tokens
    const { access, refresh } = extractTokensFromResponse(responseData)
    
    if (access) {
      setTokens({ 
        access_token: access, 
        refresh_token: refresh 
      })
    }
    
    // Extract user data dan simpan ke localStorage
    const user = extractUserFromResponse(responseData)
    
    if (user) {
      localStorage.setItem('user_data', JSON.stringify(user))
    }
    
    // Return data dalam format yang diharapkan useLogin
    return {
      success: responseData.success || true,
      access_token: access,
      refresh_token: refresh,
      user: user,
      // Include original data for reference
      original_response: responseData
    }
    
  } catch (error) {
    throw error
  }
}

export async function logout() {
  try {
    await api.post('/auth/logout')
  } catch (error) {
  } finally {
    clearTokens()
    localStorage.removeItem('user_data')
  }
}

export async function refresh() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  
  try {
    const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, null, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    })

    const responseData = res.data || {}
    
    const { access, refresh: newRefresh } = extractTokensFromResponse(responseData)
    
    if (access) {
      setTokens({ 
        access_token: access, 
        refresh_token: newRefresh 
      })
    }
    
    // Extract dan update user data jika ada
    const user = extractUserFromResponse(responseData)
    if (user) {
      localStorage.setItem('user_data', JSON.stringify(user))
    }
    
    return {
      success: responseData.success || true,
      access_token: access,
      refresh_token: newRefresh,
      user: user
    }
    
  } catch (error) {
    clearTokens()
    localStorage.removeItem('user_data')
    throw error
  }
}

export async function me() {
  try {
    const res = await api.get('/auth/me')
    const responseData = res.data || {}

    
    
    // Extract user dari response
    let userData = responseData
    
    // Handle struktur { success: true, data: { user: ... } }
    if (responseData.data) {
      if (responseData.data.user) {
        userData = responseData.data.user
        if (Array.isArray(responseData.data.roles) && responseData.data.roles.length) {
          userData = { ...userData, roles: responseData.data.roles }
        }
      } else if (responseData.data) {
        userData = responseData.data
        if (Array.isArray(responseData.data.roles) && responseData.data.roles.length) {
          userData = { ...userData, roles: responseData.data.roles }
        }
      }
    }
    
    // Simpan ke localStorage sebagai backup
    if (userData && (userData.id || userData.user_id)) {
      localStorage.setItem('user_data', JSON.stringify(userData))
    }
    
    return userData
    
  } catch (error) {
    const status = error?.response?.status
    if (status === 401 || status === 403) {
      clearTokens()
      localStorage.removeItem('user_data')
    }
    throw error
  }
}

// Sementara biarkan kosong dulu, implementasi menyusul
export async function ssoLogin(payload) {
  throw new Error('SSO Login not implemented')
}

export default {
  login,
  logout,
  refresh,
  me,
  ssoLogin,
}