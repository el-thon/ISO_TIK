import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as authService from './authService'
import { clearTokens, setTokens, getAccessToken, getRefreshToken } from './api'

export function useLogin(options = {}) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (creds) => authService.login(creds),
    onSuccess: (data) => {
      // Store tokens
      if (data?.access_token) {
        setTokens({ 
          access_token: data.access_token, 
          refresh_token: data.refresh_token 
        })
      }
      
      // Prime the `me` cache if server returned user
      if (data?.user) {
        queryClient.setQueryData(['me'], data.user)
      } else {
        // otherwise refetch `/auth/me`
        queryClient.invalidateQueries({ queryKey: ['me'] })
      }
      
      if (options.onSuccess) options.onSuccess(data)
    },
    onError: options.onError,
    onSettled: options.onSettled,
  })
}

export function useLogout(options = {}) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: (data) => {
      clearTokens()
      queryClient.removeQueries({ queryKey: ['me'] })
      if (options.onSuccess) options.onSuccess(data)
    },
    onError: options.onError,
  })
}

export function useSsoLogin(options = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => authService.ssoLogin(payload),
    onSuccess: (data) => {
      if (data?.access_token) {
        setTokens({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        })
      }

      if (data?.user) {
        queryClient.setQueryData(['me'], data.user)
      } else {
        queryClient.invalidateQueries({ queryKey: ['me'] })
      }

      if (options.onSuccess) options.onSuccess(data)
    },
    onError: options.onError,
    onSettled: options.onSettled,
  })
}

export function useMe(options = {}) {
  // enabled only when an access token exists locally
  const enabled = options.enabled ?? !!getAccessToken()
  
  return useQuery({
    queryKey: ['me'],
    queryFn: () => authService.me(),
    enabled,
    retry: false,
    ...options,
  })
}

export function useBootstrapSession(options = {}) {
  const { enabled = true, onSuccess, onError, onSettled } = options
  const [state, setState] = useState(() => ({
    status: getAccessToken() ? 'ready' : 'idle',
    error: null,
  }))

  useEffect(() => {
    if (!enabled) return

    if (getAccessToken()) {
      setState({ status: 'ready', error: null })
      return
    }

    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      setState({ status: 'ready', error: null })
      return
    }

    let cancelled = false
    setState({ status: 'refreshing', error: null })

    authService
      .refresh()
      .then((data) => {
        if (cancelled) return
        setState({ status: 'ready', error: null })
        if (onSuccess) onSuccess(data)
      })
      .catch((error) => {
        if (cancelled) return
        setState({ status: 'error', error })
        if (onError) onError(error)
      })
      .finally(() => {
        if (cancelled) return
        if (onSettled) onSettled()
      })

    return () => {
      cancelled = true
    }
  }, [enabled, onError, onSettled, onSuccess])

  return {
    status: state.status,
    error: state.error,
    isRefreshing: state.status === 'refreshing' || state.status === 'idle',
    isReady: state.status === 'ready',
    isError: state.status === 'error',
  }
}

export default {
  useLogin,
  useLogout,
  useMe,
  useBootstrapSession,
  useSsoLogin,
}
