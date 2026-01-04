import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAccessToken } from './api'
import * as profileService from './profileService'

const hasToken = () => Boolean(getAccessToken())

const authEnabled = (options = {}, defaultEnabled = true) => {
  const flag = options.enabled ?? defaultEnabled
  return flag && hasToken()
}

export function useProfile(options = {}) {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.fetchProfile(),
    staleTime: 1000 * 30,
    ...options,
    enabled: authEnabled(options),
  })
}

export function useUpdateProfile(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => profileService.updateProfile(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useUpdateEmployment(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, payload }) => profileService.updateEmployment({ userId, payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useUploadProfilePhoto(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file) => profileService.uploadPhoto(file),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['profile', 'security'] })
      // Jika backend mengembalikan photo_url langsung, kita bisa set cache cepat
      const photoUrl = data?.photo_url || data?.data?.photo_url
      if (photoUrl) {
        queryClient.setQueryData(['profile'], (old) => ({
          ...(old || {}),
          photo_url: photoUrl,
          profile: {
            ...(old?.profile || {}),
            photo_url: photoUrl,
          },
        }))
      }
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useDeleteProfilePhoto(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => profileService.deletePhoto(),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useUpdatePreferences(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => profileService.updatePreferences(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useChangePassword(options = {}) {
  return useMutation({
    mutationFn: (payload) => profileService.changePassword(payload),
    ...options,
  })
}

export function useSecuritySettings(options = {}) {
  return useQuery({
    queryKey: ['profile', 'security'],
    queryFn: () => profileService.getSecuritySettings(),
    staleTime: 1000 * 15,
    ...options,
    enabled: authEnabled(options),
  })
}

export function useSessions(params = {}, options = {}) {
  return useQuery({
    queryKey: ['profile', 'sessions', params],
    queryFn: () => profileService.getSessions(params),
    keepPreviousData: true,
    ...options,
    enabled: authEnabled(options),
  })
}

export function useLoginHistory(params = {}, options = {}) {
  return useQuery({
    queryKey: ['profile', 'login-history', params],
    queryFn: () => profileService.getLoginHistory(params),
    keepPreviousData: true,
    ...options,
    enabled: authEnabled(options),
  })
}

export function useRevokeSession(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, payload }) => profileService.revokeSession(sessionId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'security'] })
      queryClient.invalidateQueries({ queryKey: ['profile', 'sessions'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useRevokeAllSessions(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => profileService.revokeAllSessions(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'security'] })
      queryClient.invalidateQueries({ queryKey: ['profile', 'sessions'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export default {
  useProfile,
  useUpdateProfile,
  useUploadProfilePhoto,
  useDeleteProfilePhoto,
  useUpdatePreferences,
  useChangePassword,
  useSecuritySettings,
  useSessions,
  useLoginHistory,
  useRevokeSession,
  useRevokeAllSessions,
}
