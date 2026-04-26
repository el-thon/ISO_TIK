import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAccessToken } from './api'
import * as forumPeriodService from './forumPeriodService'

const hasToken = () => Boolean(getAccessToken())
const PERIOD_KEY = 'period'

const withEnabled = (options = {}, guard = true) => Boolean((options.enabled ?? true) && guard && hasToken())

export function useForumPeriods(params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
  queryKey: [PERIOD_KEY, params],
    queryFn: () => forumPeriodService.listForumPeriods(params),
    staleTime: 60_000,
    ...rest,
    enabled: withEnabled({ enabled }, true),
  })
}

export function useForumPeriod(periodId, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
  queryKey: [PERIOD_KEY, periodId],
    queryFn: () => forumPeriodService.getForumPeriod(periodId),
    ...rest,
    enabled: withEnabled({ enabled }, Boolean(periodId)),
  })
}
export function useCreateForumPeriod(options = {}) {
  const queryClient = useQueryClient()
  const { onSuccess, ...rest } = options
  return useMutation({
    mutationFn: (payload) => forumPeriodService.createForumPeriod(payload),
    onSuccess: (data, variables, context) => {
      const createdPeriod = data?.period ?? data?.data?.period ?? null
      if (createdPeriod) {
  queryClient.setQueriesData({ queryKey: [PERIOD_KEY] }, (oldData) => {
          const existing = oldData?.periods ?? []
          const normalized = Array.isArray(existing) ? existing : []
          return {
            ...(oldData ?? {}),
            periods: [createdPeriod, ...normalized.filter((period) => period?.id !== createdPeriod?.id)],
          }
        })
      }
  queryClient.invalidateQueries({ queryKey: [PERIOD_KEY] })
      if (onSuccess) onSuccess(data, variables, context)
    },
    ...rest,
  })
}

export function useUpdateForumPeriod(periodId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => forumPeriodService.updateForumPeriod(periodId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [PERIOD_KEY] })
      if (periodId) {
        queryClient.invalidateQueries({ queryKey: [PERIOD_KEY, periodId] })
      }
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useForumPeriodForums(periodId, params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
  queryKey: [PERIOD_KEY, periodId, 'forums', params],
    queryFn: () => forumPeriodService.listForumPeriodForums(periodId, params),
    ...rest,
    enabled: withEnabled({ enabled }, Boolean(periodId)),
  })
}

export function useCreateForumPeriodForum(periodId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => forumPeriodService.createForumPeriodForum(periodId, payload),
    onSuccess: (data, variables, context) => {
      if (periodId) {
  queryClient.invalidateQueries({ queryKey: [PERIOD_KEY, periodId, 'forums'] })
      }
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useUpdateForumPeriodForum(periodId, forumId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => forumPeriodService.updateForumPeriodForum(periodId, forumId, payload),
    onSuccess: (data, variables, context) => {
      if (periodId && forumId) {
  queryClient.invalidateQueries({ queryKey: [PERIOD_KEY, periodId, 'forums'] })
  queryClient.invalidateQueries({ queryKey: [PERIOD_KEY, periodId] })
      }
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useJoinForumPeriod(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => forumPeriodService.joinForumPeriodByCode(payload),
    onSuccess: (data, variables, context) => {
  queryClient.invalidateQueries({ queryKey: [PERIOD_KEY] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function usePeriodJoinRequests(periodId, params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: [PERIOD_KEY, periodId, 'join-requests', params],
    queryFn: () => forumPeriodService.listPeriodJoinRequests(periodId, params),
    ...rest,
    enabled: withEnabled({ enabled }, Boolean(periodId)),
  })
}

export function useMyPeriodJoinRequest(periodId, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: [PERIOD_KEY, periodId, 'join-requests', 'me'],
    queryFn: () => forumPeriodService.getMyPeriodJoinRequest(periodId),
    ...rest,
    enabled: withEnabled({ enabled }, Boolean(periodId)),
  })
}

export function useApprovePeriodJoinRequest(periodId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ joinRequestId }) => forumPeriodService.approvePeriodJoinRequest(periodId, joinRequestId),
    onSuccess: (data, variables, context) => {
      if (periodId) {
        queryClient.invalidateQueries({ queryKey: [PERIOD_KEY, periodId, 'join-requests'] })
        queryClient.invalidateQueries({ queryKey: [PERIOD_KEY, periodId] })
      }
      queryClient.invalidateQueries({ queryKey: [PERIOD_KEY] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useRejectPeriodJoinRequest(periodId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ joinRequestId, payload }) => forumPeriodService.rejectPeriodJoinRequest(periodId, joinRequestId, payload),
    onSuccess: (data, variables, context) => {
      if (periodId) {
        queryClient.invalidateQueries({ queryKey: [PERIOD_KEY, periodId, 'join-requests'] })
        queryClient.invalidateQueries({ queryKey: [PERIOD_KEY, periodId] })
      }
      queryClient.invalidateQueries({ queryKey: [PERIOD_KEY] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useForumPeriodForumTopics(periodId, forumId, params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
  queryKey: [PERIOD_KEY, periodId, 'forums', forumId, 'topics', params],
    queryFn: () => forumPeriodService.listForumPeriodForumTopics(periodId, forumId, params),
    ...rest,
    enabled: withEnabled({ enabled }, Boolean(periodId) && Boolean(forumId)),
  })
}

export function useCreateForumPeriodForumTopic(periodId, forumId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => forumPeriodService.createForumPeriodForumTopic(periodId, forumId, payload),
    onSuccess: (data, variables, context) => {
      if (periodId && forumId) {
  queryClient.invalidateQueries({ queryKey: [PERIOD_KEY, periodId, 'forums', forumId, 'topics'] })
      }
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export default {
  useForumPeriods,
  useForumPeriod,
  useCreateForumPeriod,
  useUpdateForumPeriod,
  useForumPeriodForums,
  useCreateForumPeriodForum,
  useJoinForumPeriod,
  usePeriodJoinRequests,
  useMyPeriodJoinRequest,
  useApprovePeriodJoinRequest,
  useRejectPeriodJoinRequest,
  useForumPeriodForumTopics,
  useCreateForumPeriodForumTopic,
}
