import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAccessToken } from '@/services/api'
import * as forumService from '@/services/forumService'

const hasToken = () => Boolean(getAccessToken())

const computeEnabled = (options = {}, guard = true) => {
  const flag = options.enabled ?? true
  return Boolean(flag && guard && hasToken())
}

export function useForums(params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['forums', 'list', params],
    queryFn: () => forumService.listForums(params),
    keepPreviousData: true,
    staleTime: 30_000,
    ...rest,
    enabled: computeEnabled({ enabled }, true),
  })
}

export function useForum(forumId, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['forums', forumId],
    queryFn: () => forumService.getForum(forumId),
    ...rest,
    enabled: computeEnabled({ enabled }, Boolean(forumId)),
  })
}

export function useForumParticipants(forumId, params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['forums', forumId, 'participants', params],
    queryFn: () => forumService.listForumParticipants(forumId, params),
    keepPreviousData: true,
    staleTime: 15_000,
    ...rest,
    enabled: computeEnabled({ enabled }, Boolean(forumId)),
  })
}

export function useForumForms(forumId, params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['forums', forumId, 'forms', params],
    queryFn: () => forumService.listForumForms(forumId, params),
    keepPreviousData: true,
    staleTime: 15_000,
    ...rest,
    enabled: computeEnabled({ enabled }, Boolean(forumId)),
  })
}

export function useUpdateForum(forumId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => forumService.updateForum(forumId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['forums', forumId] })
      queryClient.invalidateQueries({ queryKey: ['forums', 'list'], exact: false })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useDeleteForum(forumId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => forumService.deleteForum(forumId),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['forums'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useLockForum(forumId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => forumService.lockForum(forumId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['forums', forumId] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useUnlockForum(forumId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => forumService.unlockForum(forumId),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['forums', forumId] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useArchiveForum(forumId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => forumService.archiveForum(forumId),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['forums', forumId] })
      queryClient.invalidateQueries({ queryKey: ['forums'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useRestoreForum(forumId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => forumService.restoreForum(forumId),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['forums', forumId] })
      queryClient.invalidateQueries({ queryKey: ['forums'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useLeaveForum(forumId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => forumService.leaveForum(forumId),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['forums', 'list'] })
      if (forumId) {
        queryClient.invalidateQueries({ queryKey: ['forums', forumId] })
        queryClient.invalidateQueries({ queryKey: ['forums', forumId, 'participants'] })
      }
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useAddForumParticipant(forumId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => forumService.addForumParticipant(forumId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['forums', forumId, 'participants'] })
      queryClient.invalidateQueries({ queryKey: ['forums', forumId] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useUpdateForumParticipant(forumId, participantId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => forumService.updateForumParticipant(forumId, participantId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['forums', forumId, 'participants'] })
      queryClient.invalidateQueries({ queryKey: ['forums', forumId] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useRemoveForumParticipant(forumId, participantId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => forumService.removeForumParticipant(forumId, participantId),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['forums', forumId, 'participants'] })
      queryClient.invalidateQueries({ queryKey: ['forums', forumId] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useCreateForum(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => forumService.createForum(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['forums'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useJoinForumByCode(options = {}) {
  return useMutation({
    mutationFn: (payload) => forumService.joinForumByCode(payload),
    onSuccess: (data, variables, context) => {
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useAvailableUsers(params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['users', 'available', params],
    queryFn: () => forumService.listAvailableUsers(params),
    keepPreviousData: true,
    staleTime: 30_000,
    ...rest,
    enabled: Boolean(enabled !== false && hasToken()),
  })
}

export default {
  useForums,
  useForum,
  useForumParticipants,
  useForumForms,
  useUpdateForum,
  useDeleteForum,
  useLockForum,
  useUnlockForum,
  useArchiveForum,
  useRestoreForum,
  useLeaveForum,
  useAddForumParticipant,
  useUpdateForumParticipant,
  useRemoveForumParticipant,
  useCreateForum,
  useJoinForumByCode,
  useAvailableUsers,
}
