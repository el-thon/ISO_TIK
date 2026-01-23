import { useQuery } from '@tanstack/react-query'
import { getAccessToken } from './api'
import * as auditLogsService from './auditLogsService'

const hasToken = () => Boolean(getAccessToken())

const authEnabled = (options = {}, fallback = true) => {
  const flag = options.enabled ?? fallback
  return Boolean(flag && hasToken())
}

export function useAuditLogs(params = {}, options = {}) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => auditLogsService.listAuditLogs(params),
    keepPreviousData: true,
    ...options,
    enabled: authEnabled(options),
  })
}

export function useAuditLog(logId, options = {}) {
  return useQuery({
    queryKey: ['audit-log', logId],
    queryFn: () => auditLogsService.getAuditLog(logId),
    ...options,
    enabled: authEnabled({ ...options, enabled: options.enabled ?? Boolean(logId) }),
  })
}

export default {
  useAuditLogs,
  useAuditLog,
}
