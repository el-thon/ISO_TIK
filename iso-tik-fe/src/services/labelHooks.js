import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAccessToken } from './api'
import * as labelService from './labelService'

const hasToken = () => Boolean(getAccessToken())
const computeEnabled = (flag = true) => Boolean((flag ?? true) && hasToken())

export function useLabels(params = undefined, options = {}) {
  const { enabled, ...rest } = options
  const queryParams = params ?? {}
  const paramsKey = JSON.stringify(queryParams)
  return useQuery({
    queryKey: ['labels', paramsKey],
    queryFn: () => labelService.listLabels(queryParams),
    staleTime: 60_000,
    ...rest,
    enabled: computeEnabled(enabled ?? true),
  })
}

export function useCreateLabel(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => labelService.createLabel(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['labels'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useUpdateLabel(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ labelId, payload }) => labelService.updateLabel(labelId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['labels'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useDeleteLabel(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (labelId) => labelService.deleteLabel(labelId),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['labels'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export default {
  useLabels,
  useCreateLabel,
  useUpdateLabel,
  useDeleteLabel,
}
