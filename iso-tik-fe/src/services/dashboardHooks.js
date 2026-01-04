import { useQuery } from '@tanstack/react-query'
import * as dashboardService from './dashboardService'
import { getAccessToken } from './api'

const hasToken = () => !!getAccessToken()

function withAuthEnabled(options = {}) {
  return options.enabled ?? hasToken()
}

export function useDashboardSummary(options = {}) {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardService.getSummary(),
    ...options,
    enabled: withAuthEnabled(options),
  })
}

export function useMyAssignments(options = {}) {
  return useQuery({
    queryKey: ['dashboard', 'assignments'],
    queryFn: () => dashboardService.getMyAssignments(),
    ...options,
    enabled: withAuthEnabled(options),
  })
}

export function useTopicsNeedingAttention(options = {}) {
  return useQuery({
    queryKey: ['dashboard', 'topics'],
    queryFn: () => dashboardService.getTopicsNeedingAttention(),
    ...options,
    enabled: withAuthEnabled(options),
  })
}

export function useUpcomingDeadlines(options = {}) {
  return useQuery({
    queryKey: ['dashboard', 'deadlines'],
    queryFn: () => dashboardService.getUpcomingDeadlines(),
    ...options,
    enabled: withAuthEnabled(options),
  })
}

export function useDashboardStatistics(options = {}) {
  return useQuery({
    queryKey: ['dashboard', 'statistics'],
    queryFn: () => dashboardService.getStatistics(),
    ...options,
    enabled: withAuthEnabled(options),
  })
}

export default {
  useDashboardSummary,
  useMyAssignments,
  useTopicsNeedingAttention,
  useUpcomingDeadlines,
  useDashboardStatistics,
}
