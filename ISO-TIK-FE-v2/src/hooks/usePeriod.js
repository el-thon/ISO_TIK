import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAccessToken } from '@/services/api'
import * as periodService from '@/services/periodService'

const hasToken = () => Boolean(getAccessToken())
const PERIOD_KEY = 'period'

const withEnabled = (options = {}, guard = true) => Boolean((options.enabled ?? true) && guard && hasToken())

export function usePeriods(params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: [PERIOD_KEY, params],
    queryFn: () => periodService.listPeriods(params),
    staleTime: 60_000,
    ...rest,
    enabled: withEnabled({ enabled }, true),
  })
}

export function usePeriod(periodId, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: [PERIOD_KEY, periodId],
    queryFn: () => periodService.getPeriod(periodId),
    ...rest,
    enabled: withEnabled({ enabled }, Boolean(periodId)),
  })
}

export function useCreatePeriod(options = {}) {
  const queryClient = useQueryClient()
  const { onSuccess, ...rest } = options
  return useMutation({
    mutationFn: (payload) => periodService.createPeriod(payload),
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

export function useUpdatePeriod(periodId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => periodService.updatePeriod(periodId, payload),
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

export function usePeriodForums(periodId, params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: [PERIOD_KEY, periodId, 'forums', params],
    queryFn: () => periodService.listPeriodForums(periodId, params),
    ...rest,
    enabled: withEnabled({ enabled }, Boolean(periodId)),
  })
}

export function useCreatePeriodForum(periodId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => periodService.createPeriodForum(periodId, payload),
    onSuccess: (data, variables, context) => {
      if (periodId) {
        queryClient.invalidateQueries({ queryKey: [PERIOD_KEY, periodId, 'forums'] })
      }
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useUpdatePeriodForum(periodId, forumId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => periodService.updatePeriodForum(periodId, forumId, payload),
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

export function useJoinPeriod(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => periodService.joinPeriodByCode(payload),
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
    queryFn: () => periodService.listPeriodJoinRequests(periodId, params),
    ...rest,
    enabled: withEnabled({ enabled }, Boolean(periodId)),
  })
}

export function useMyPeriodJoinRequest(periodId, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: [PERIOD_KEY, periodId, 'join-requests', 'me'],
    queryFn: () => periodService.getMyPeriodJoinRequest(periodId),
    ...rest,
    enabled: withEnabled({ enabled }, Boolean(periodId)),
  })
}

export function useApprovePeriodJoinRequest(periodId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ joinRequestId }) => periodService.approvePeriodJoinRequest(periodId, joinRequestId),
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
    mutationFn: ({ joinRequestId, payload }) => periodService.rejectPeriodJoinRequest(periodId, joinRequestId, payload),
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

export function usePeriodForumForms(periodId, forumId, params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: [PERIOD_KEY, periodId, 'forums', forumId, 'forms', params],
    queryFn: () => periodService.listPeriodForumForms(periodId, forumId, params),
    ...rest,
    enabled: withEnabled({ enabled }, Boolean(periodId) && Boolean(forumId)),
  })
}

export function useCreatePeriodForumForm(periodId, forumId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => periodService.createPeriodForumForm(periodId, forumId, payload),
    onSuccess: (data, variables, context) => {
      if (periodId && forumId) {
        queryClient.invalidateQueries({ queryKey: [PERIOD_KEY, periodId, 'forums', forumId, 'forms'] })
      }
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export default {
  usePeriods,
  usePeriod,
  useCreatePeriod,
  useUpdatePeriod,
  usePeriodForums,
  useCreatePeriodForum,
  useUpdatePeriodForum,
  useJoinPeriod,
  usePeriodJoinRequests,
  useMyPeriodJoinRequest,
  useApprovePeriodJoinRequest,
  useRejectPeriodJoinRequest,
  usePeriodForumForms,
  useCreatePeriodForumForm,
}
