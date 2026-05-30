import api, { setTokens, clearTokens, getRefreshToken, performRefresh } from './api'

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

function extractTokenMetaFromResponse(data) {
  if (!data) return { access_expires_at: null, refresh_expires_at: null }

  let responseData = data
  if (data.data && typeof data.data === 'object') {
    responseData = data.data
  }
  if (responseData.data && typeof responseData.data === 'object') {
    responseData = responseData.data
  }

  return {
    access_expires_at:
      responseData.access_expires_at ||
      responseData.accessExpiresAt ||
      responseData.access_expires ||
      null,
    refresh_expires_at:
      responseData.refresh_expires_at ||
      responseData.refreshExpiresAt ||
      responseData.refresh_expires ||
      null,
  }
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

export async function login({ login, username, password, otp }) {
  const identifier = login || username
  const payload = { login: identifier?.trim?.() ?? identifier, password }
  if (otp) payload.otp = otp
  const res = await api.post('/auth/login', payload)
  const responseData = res.data || {}

  const otpRequired = Boolean(
    responseData.otp_required ||
    responseData.requires_otp ||
    responseData.step === 'otp' ||
    responseData?.data?.otp_required ||
    responseData?.data?.requires_otp ||
    responseData?.data?.step === 'otp'
  )

  if (otpRequired) {
    return {
      success: false,
      otp_required: true,
      message: responseData.message || responseData?.data?.message || 'OTP diperlukan untuk melanjutkan.',
      otp_channel: responseData.otp_channel || responseData?.data?.otp_channel || 'email',
      otp_sent_to: responseData.otp_sent_to || responseData?.data?.otp_sent_to || responseData?.data?.email || responseData?.email,
      original_response: responseData,
    }
  }
  
  // Extract tokens
  const { access, refresh } = extractTokensFromResponse(responseData)
  const { access_expires_at, refresh_expires_at } = extractTokenMetaFromResponse(responseData)
  
  if (access) {
    setTokens({ 
      access_token: access, 
      refresh_token: refresh,
      access_expires_at,
      refresh_expires_at,
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
  access_expires_at,
  refresh_expires_at,
    user: user,
    // Include original data for reference
    original_response: responseData
  }
}

export async function logout() {
  try {
    await api.post('/auth/logout')
  } catch {
    // ignore logout errors
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
    const newAccess = await performRefresh()
    // performRefresh already set tokens and authorization header
    return { success: true, access_token: newAccess }
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

export async function resendLoginOtp({ login, username, password }) {
  const identifier = login || username
  const payload = { login: identifier, username: identifier, password }
  const res = await api.post('/auth/login/otp/resend', payload)
  return res.data || {}
}

// Sementara biarkan kosong dulu, implementasi menyusul
export async function ssoLogin() {
  throw new Error('SSO Login not implemented')
}

export default {
  login,
  logout,
  refresh,
  me,
  ssoLogin,
}