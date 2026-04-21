import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAccessToken } from './api'
import * as adminSystemService from './adminSystemService'

const hasToken = () => Boolean(getAccessToken())

export function useAdminSystemSettings(options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['admin', 'system-settings'],
    queryFn: () => adminSystemService.getSystemSettings(),
    staleTime: 30_000,
    ...rest,
    enabled: Boolean((enabled ?? true) && hasToken()),
  })
}

export function useUpdateAdminSystemSettings(options = {}) {
  const queryClient = useQueryClient()
  const { onSuccess, ...rest } = options

  return useMutation({
    mutationFn: (settings) => adminSystemService.updateSystemSettings(settings),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'system-settings'] })
      if (onSuccess) onSuccess(data, variables, context)
    },
    ...rest,
  })
}

export default {
  useAdminSystemSettings,
  useUpdateAdminSystemSettings,
}
