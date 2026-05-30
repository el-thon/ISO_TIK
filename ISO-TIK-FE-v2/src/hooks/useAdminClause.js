import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAccessToken } from '@/services/api'
import * as adminClauseService from '@/services/adminClauseService'

const hasToken = () => Boolean(getAccessToken())

const computeEnabled = (options = {}, extra = true) => {
  const flag = options.enabled ?? true
  return Boolean(flag && extra && hasToken())
}

export function useAdminClauses(params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['admin', 'clauses', params],
    queryFn: () => adminClauseService.listClauses(params),
    keepPreviousData: true,
    staleTime: 30_000,
    ...rest,
    enabled: computeEnabled({ enabled }, true),
  })
}

export function useCreateClause(options = {}) {
  const queryClient = useQueryClient()
  const { onSuccess, ...rest } = options
  return useMutation({
    mutationFn: (payload) => adminClauseService.createClause(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'clauses'] })
      if (onSuccess) onSuccess(data, variables, context)
    },
    ...rest,
  })
}

export function useUpdateClause(options = {}) {
  const queryClient = useQueryClient()
  const { onSuccess, ...rest } = options
  return useMutation({
    mutationFn: ({ clauseId, payload }) => adminClauseService.updateClause(clauseId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'clauses'] })
      if (onSuccess) onSuccess(data, variables, context)
    },
    ...rest,
  })
}

export function useDeleteClause(options = {}) {
  const queryClient = useQueryClient()
  const { onSuccess, ...rest } = options
  return useMutation({
    mutationFn: (clauseId) => adminClauseService.deleteClause(clauseId),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'clauses'] })
      if (onSuccess) onSuccess(data, variables, context)
    },
    ...rest,
  })
}

export default {
  useAdminClauses,
  useCreateClause,
  useUpdateClause,
  useDeleteClause,
}
