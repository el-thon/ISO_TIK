import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as authService from './authService'
import { clearTokens, setTokens, getAccessToken, getRefreshToken } from './api'

/**
 * useLogin - Hook untuk login
 * Menyimpan token dan user data ke cache dengan format konsisten
 */
export function useLogin(options = {}) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (creds) => authService.login(creds),
    onSuccess: (data) => {
      
      // Store tokens
      if (data?.access_token) {
        setTokens({ 
          access_token: data.access_token, 
          refresh_token: data.refresh_token,
          access_expires_at: data.access_expires_at,
          refresh_expires_at: data.refresh_expires_at,
        })
      }
      
      // Ekstrak user data dari berbagai format response
      let userData = null
      
      // Format 1: { user: {...} } - dari authService.login
      if (data?.user) {
        userData = data.user
      } 
      // Format 2: { data: { user: {...} } }
      else if (data?.data?.user) {
        userData = data.data.user
      }
      // Format 3: Langsung user object (punya id)
      else if (data?.id) {
        userData = data
      }
      // Format 4: { data: { id, ... } }
      else if (data?.data?.id) {
        userData = data.data
      }
      
      if (userData) {
        
        // Simpan ke React Query cache - LANGSUNG USER DATA, BUKAN OBJECT BERSARANG
        queryClient.setQueryData(['me'], userData)
        
        // Simpan juga di localStorage sebagai backup
        localStorage.setItem('user_data', JSON.stringify(userData))
      } else {
        // Jika tidak ada user data, invalidate query biar fetch ulang
        queryClient.invalidateQueries({ queryKey: ['me'] })
      }
      
      if (options.onSuccess) options.onSuccess(data)
    },
    onError: (error) => {
      if (options.onError) options.onError(error)
    },
    onSettled: options.onSettled,
  })
}

/**
 * useLogout - Hook untuk logout
 * Membersihkan semua data autentikasi
 */
export function useLogout(options = {}) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: (data) => {
      // Hapus tokens
      clearTokens()
      
      // Hapus query cache
      queryClient.removeQueries({ queryKey: ['me'] })
      
      // Hapus localStorage
      localStorage.removeItem('user_data')
      
      if (options.onSuccess) options.onSuccess(data)
    },
    onError: (error) => {
      if (options.onError) options.onError(error)
    },
  })
}

/**
 * useSsoLogin - Hook untuk login dengan SSO
 */
export function useSsoLogin(options = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => authService.ssoLogin(payload),
    onSuccess: (data) => {
      
      // Store tokens
      if (data?.access_token) {
        setTokens({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          access_expires_at: data.access_expires_at,
          refresh_expires_at: data.refresh_expires_at,
        })
      }

      // Ekstrak user data
      let userData = null
      
      if (data?.user) {
        userData = data.user
      } else if (data?.data?.user) {
        userData = data.data.user
      } else if (data?.id) {
        userData = data
      } else if (data?.data?.id) {
        userData = data.data
      }
      
      if (userData) {
        // Simpan ke cache - LANGSUNG USER DATA
        queryClient.setQueryData(['me'], userData)
        localStorage.setItem('user_data', JSON.stringify(userData))
      } else {
        queryClient.invalidateQueries({ queryKey: ['me'] })
      }

      if (options.onSuccess) options.onSuccess(data)
    },
    onError: options.onError,
    onSettled: options.onSettled,
  })
}

export function useResendLoginOtp(options = {}) {
  return useMutation({
    mutationFn: (payload) => authService.resendLoginOtp(payload),
    onSuccess: options.onSuccess,
    onError: options.onError,
    onSettled: options.onSettled,
  })
}

/**
 * useMe - Hook untuk mendapatkan data user saat ini
 * Returns: User object langsung (bukan object bersarang)
 * Contoh: { id, username, name, email, roles, ... }
 * 
 * PENTING: Hook ini menggunakan cache first strategy
 * - Pertama cek localStorage untuk data yang sudah ada
 * - Hanya fetch ke server jika tidak ada data atau data expired
 * - Ini mencegah infinite loop dan rate limiting 429
 */
export function useMe(options = {}) {
  const enabled = options.enabled ?? !!getAccessToken()
  
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await authService.me()

      // Ekstrak user data dari berbagai format response
      let userData = null

      // Format 1: { data: { user: { ... } } } - dari endpoint /me
      if (response?.data?.user) {
        userData = response.data.user
      }
      // Format 2: { user: { ... } } - dari response login
      else if (response?.user) {
        userData = response.user
      }
      // Format 3: Langsung user object (punya id)
      else if (response?.id) {
        userData = response
      }
      // Format 4: { data: { id, username, ... } }
      else if (response?.data?.id) {
        userData = response.data
      }

      if (userData) {
        const rolesFromResponse = response?.data?.roles || response?.roles
        if (Array.isArray(rolesFromResponse) && rolesFromResponse.length) {
          userData = { ...userData, roles: rolesFromResponse }
        }
      }

      // Simpan ke localStorage untuk cache
      if (userData?.id || userData?.user_id) {
        localStorage.setItem('user_data', JSON.stringify(userData))
      }

      // RETURN LANGSUNG USER DATA, BUKAN OBJECT BERSARANG
      return userData
    },
    enabled,
    retry: 1,
    retryDelay: 1000,
    staleTime: 10 * 60 * 1000, // 10 menit (agak panjang karena cache first strategy)
    gcTime: 15 * 60 * 1000,  // 15 menit (cacheTime)
    ...options,
  })
}

/**
 * useBootstrapSession - Hook untuk refresh token otomatis
 * Menangani refresh token saat aplikasi dimulai
 */
export function useBootstrapSession(options = {}) {
  const { enabled = true, onSuccess, onError, onSettled } = options
  const queryClient = useQueryClient()

  const shouldAttemptRefresh = useMemo(() => {
    if (!enabled) return false

    const accessToken = getAccessToken()
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false

    // Avoid Date.now() (impure) during render. We'll only bootstrap-refresh when there's
    // no access token at all; expiry-based refresh is handled by api interceptor.
    return !accessToken
  }, [enabled])

  const refreshQuery = useQuery({
    queryKey: ['bootstrap-session'],
    enabled: shouldAttemptRefresh,
    retry: 0,
    queryFn: async () => {
      const data = await authService.refresh()
      if (data?.user) {
        queryClient.setQueryData(['me'], data.user)
        localStorage.setItem('user_data', JSON.stringify(data.user))
      }
      if (onSuccess) onSuccess(data)
      return data
    },
  })

  const isRefreshing = refreshQuery.isFetching
  const isError = refreshQuery.isError
  const error = refreshQuery.error

  if (isError) {
    clearTokens()
    localStorage.removeItem('user_data')
    if (onError) onError(error)
  }
  if (refreshQuery.isFetched && onSettled) {
    onSettled()
  }

  return {
    status: isRefreshing ? 'refreshing' : 'ready',
    error,
    isRefreshing,
    isReady: !isRefreshing,
    isError,
  }
}

export default {
  useLogin,
  useLogout,
  useMe,
  useBootstrapSession,
  useSsoLogin,
}