import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAccessToken } from '@/services/api'
import * as adminUsersService from '@/services/adminUsersService'

const hasToken = () => !!getAccessToken()

const authEnabled = (options = {}) => options.enabled ?? hasToken()

const invalidateAdminUsers = (queryClient) => {
  queryClient.invalidateQueries({ predicate: (query) => query.queryKey?.[0] === 'admin-users' })
}

const patchAdminUserLists = (queryClient, updater) => {
  const queries = queryClient.getQueriesData({ predicate: (query) => query.queryKey?.[0] === 'admin-users' })
  queries.forEach(([key, value]) => {
    if (!value || !Array.isArray(value.users)) return
    const next = updater(value)
    if (next) {
      queryClient.setQueryData(key, next)
    }
  })
}

const upsertUserInLists = (queryClient, userId, partial) => {
  if (!userId) return
  patchAdminUserLists(queryClient, (old) => ({
    ...old,
    users: (old.users || []).map((u) => (u.id === userId ? { ...u, ...partial } : u)),
  }))
}

export function useAdminUsersList(params = {}, options = {}) {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => adminUsersService.listUsers(params),
    keepPreviousData: true,
    ...options,
    enabled: authEnabled(options),
  })
}

export function useAdminUser(userId, options = {}) {
  return useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => adminUsersService.getUser(userId),
    ...options,
    enabled: authEnabled({ ...options, enabled: options.enabled ?? !!userId }),
  })
}

export function useAdminUserRoles(userId, options = {}) {
  return useQuery({
    queryKey: ['admin-user-roles', userId],
    queryFn: () => adminUsersService.getUserRoles(userId),
    ...options,
    enabled: authEnabled({ ...options, enabled: options.enabled ?? !!userId }),
  })
}

export function useAdminUserActivities(userId, options = {}) {
  return useQuery({
    queryKey: ['admin-user-activities', userId],
    queryFn: () => adminUsersService.getActivityLogs(userId),
    ...options,
    enabled: authEnabled({ ...options, enabled: options.enabled ?? !!userId }),
  })
}

export function useAdminUserStatistics(options = {}) {
  return useQuery({
    queryKey: ['admin-users', 'stats'],
    queryFn: () => adminUsersService.getStatistics(),
    ...options,
    enabled: authEnabled(options),
  })
}

export function useAdminRoles(options = {}) {
  return useQuery({
    queryKey: ['admin-users', 'roles'],
    queryFn: () => adminUsersService.getRoles(),
    staleTime: 1000 * 60 * 5,
    ...options,
    enabled: authEnabled(options),
  })
}

export function useCreateAdminUser(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => adminUsersService.createUser(payload),
    onSuccess: (data, variables) => {
      patchAdminUserLists(queryClient, (old) => {
        // Prepend to current page if space; keep pagination total in sync if present
        const users = [data, ...(old.users || [])]
        const pagination = old.pagination
          ? {
              ...old.pagination,
              total: (old.pagination.total ?? users.length),
            }
          : undefined
        return { ...old, users, pagination }
      })
      invalidateAdminUsers(queryClient)
      queryClient.invalidateQueries({ queryKey: ['admin-users', 'stats'] })
      if (options.onSuccess) options.onSuccess(data, variables)
    },
    ...options,
  })
}

export function useUpdateAdminUser(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, payload }) => adminUsersService.updateUser(userId, payload),
    onSuccess: (data, variables) => {
      if (data?.id) {
        patchAdminUserLists(queryClient, (old) => ({
          ...old,
          users: (old.users || []).map((u) => (u.id === data.id ? { ...u, ...data } : u)),
        }))
      }
      invalidateAdminUsers(queryClient)
      queryClient.invalidateQueries({ queryKey: ['admin-users', 'stats'] })
      if (variables?.userId) {
        queryClient.invalidateQueries({ queryKey: ['admin-user', variables.userId] })
        queryClient.invalidateQueries({ queryKey: ['admin-user-roles', variables.userId] })
      }
      if (options.onSuccess) options.onSuccess(data, variables)
    },
    ...options,
  })
}

export function useDeleteAdminUser(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, reason }) => adminUsersService.deleteUser(userId, reason),
    onSuccess: (data, variables) => {
      if (variables?.userId) {
        patchAdminUserLists(queryClient, (old) => {
          const users = (old.users || []).filter((u) => u.id !== variables.userId)
          const pagination = old.pagination
            ? {
                ...old.pagination,
                total: Math.max(0, (old.pagination.total ?? users.length) - 1),
              }
            : undefined
          return { ...old, users, pagination }
        })
      }
      invalidateAdminUsers(queryClient)
      queryClient.invalidateQueries({ queryKey: ['admin-users', 'stats'] })
      if (options.onSuccess) options.onSuccess(data, variables)
    },
    ...options,
  })
}

export function useBulkStatusUpdate(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => adminUsersService.bulkUpdateStatus(payload),
    onSuccess: (data, variables) => {
      const ids = new Set(variables?.user_ids || [])
      patchAdminUserLists(queryClient, (old) => ({
        ...old,
        users: (old.users || []).map((u) => (ids.has(u.id) ? { ...u, status: variables.status } : u)),
      }))
      invalidateAdminUsers(queryClient)
      queryClient.invalidateQueries({ queryKey: ['admin-users', 'stats'] })
      if (options.onSuccess) options.onSuccess(data, variables)
    },
    ...options,
  })
}

export function useAssignRole(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, roleId, reason }) => adminUsersService.assignRole(userId, roleId, reason),
    onSuccess: (data, variables) => {
      invalidateAdminUsers(queryClient)
      if (variables?.userId) {
        queryClient.invalidateQueries({ queryKey: ['admin-user-roles', variables.userId] })
      }
      if (options.onSuccess) options.onSuccess(data, variables)
    },
    ...options,
  })
}

export function useRevokeRole(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, roleId, reason }) => adminUsersService.revokeRole(userId, roleId, reason),
    onSuccess: (data, variables) => {
      invalidateAdminUsers(queryClient)
      if (variables?.userId) {
        queryClient.invalidateQueries({ queryKey: ['admin-user-roles', variables.userId] })
      }
      if (options.onSuccess) options.onSuccess(data, variables)
    },
    ...options,
  })
}

export function useActivateAdminUser(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId) => adminUsersService.activateUser(userId),
    onSuccess: (data, variables) => {
      const userId = data?.id ?? variables
      const partial = data?.id ? data : { status: 'active' }
      upsertUserInLists(queryClient, userId, partial)
      invalidateAdminUsers(queryClient)
      queryClient.invalidateQueries({ queryKey: ['admin-users', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['admin-user', variables] })
      if (options.onSuccess) options.onSuccess(data, variables)
    },
    ...options,
  })
}

export function useDeactivateAdminUser(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, reason }) => adminUsersService.deactivateUser(userId, reason),
    onSuccess: (data, variables) => {
      const userId = data?.id ?? variables?.userId
      const partial = data?.id ? data : { status: 'inactive' }
      upsertUserInLists(queryClient, userId, partial)
      invalidateAdminUsers(queryClient)
      queryClient.invalidateQueries({ queryKey: ['admin-users', 'stats'] })
      if (userId) queryClient.invalidateQueries({ queryKey: ['admin-user', userId] })
      if (options.onSuccess) options.onSuccess(data, variables)
    },
    ...options,
  })
}

export function useResetUserPassword(options = {}) {
  return useMutation({
    mutationFn: ({ userId, payload }) => adminUsersService.resetPassword(userId, payload),
    ...options,
  })
}

export function useRestoreUser(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId) => adminUsersService.restoreUser(userId),
    onSuccess: (data, variables) => {
      if (data?.id) {
        patchAdminUserLists(queryClient, (old) => ({
          ...old,
          users: (old.users || []).map((u) => (u.id === data.id ? { ...u, ...data } : u)),
        }))
      }
      invalidateAdminUsers(queryClient)
      queryClient.invalidateQueries({ queryKey: ['admin-users', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['admin-user', variables] })
      if (options.onSuccess) options.onSuccess(data, variables)
    },
    ...options,
  })
}

export default {
  useAdminUsersList,
  useAdminUser,
  useAdminUserRoles,
  useAdminUserActivities,
  useAdminUserStatistics,
  useAdminRoles,
  useCreateAdminUser,
  useUpdateAdminUser,
  useDeleteAdminUser,
  useBulkStatusUpdate,
  useAssignRole,
  useRevokeRole,
  useActivateAdminUser,
  useDeactivateAdminUser,
  useResetUserPassword,
  useRestoreUser,
}
