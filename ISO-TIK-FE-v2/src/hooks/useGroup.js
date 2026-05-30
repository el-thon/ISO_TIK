import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAccessToken } from '@/services/api'
import * as groupService from '@/services/groupService'

const hasToken = () => Boolean(getAccessToken())

const computeEnabled = (options = {}, extra = true) => {
  const flag = options.enabled ?? true
  return Boolean(flag && extra && hasToken())
}

export function useGroups(params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['groups', 'list', params],
    queryFn: () => groupService.listGroups(params),
    keepPreviousData: true,
    staleTime: 30_000,
    ...rest,
    enabled: computeEnabled({ enabled }, true),
  })
}

export function useGroup(groupId, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['groups', groupId],
    queryFn: () => groupService.getGroup(groupId),
    ...rest,
    enabled: computeEnabled({ enabled }, Boolean(groupId)),
  })
}

export function useGroupMembers(groupId, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['groups', groupId, 'members'],
    queryFn: () => groupService.listMembers(groupId),
    ...rest,
    enabled: computeEnabled({ enabled }, Boolean(groupId)),
  })
}

export function useGroupRooms(groupId, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['groups', groupId, 'rooms'],
    queryFn: () => groupService.listRooms(groupId),
    ...rest,
    enabled: computeEnabled({ enabled }, Boolean(groupId)),
  })
}

export function useGroupUserSearch(groupId, params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['groups', groupId, 'user-search', params],
    queryFn: () => groupService.searchGroupUsers(groupId, params),
    keepPreviousData: true,
    ...rest,
    enabled: computeEnabled({ enabled }, Boolean(groupId)),
  })
}

export function useGroupJoinCode(groupId, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['groups', groupId, 'join-code'],
    queryFn: () => groupService.getJoinCode(groupId),
    ...rest,
    enabled: computeEnabled({ enabled }, Boolean(groupId)),
  })
}

export function useCreateGroup(options = {}) {
  const queryClient = useQueryClient()
  const prependToLists = (group) => {
    queryClient.setQueriesData({ queryKey: ['groups', 'list'], exact: false }, (old) => {
      if (!group) return old
      if (!old) {
        return {
          groups: [group],
          pagination: {
            current_page: 1,
            per_page: 15,
            total: 1,
            last_page: 1,
            from: 1,
            to: 1,
          },
        }
      }
      const nextGroups = Array.isArray(old.groups) ? old.groups : []
      if (nextGroups.some((g) => g.id === group.id)) {
        return old
      }
      const updatedGroups = [group, ...nextGroups]
      const prevTotal = old.pagination?.total ?? nextGroups.length
      return {
        ...old,
        groups: updatedGroups,
        pagination: {
          ...(old.pagination ?? {}),
          total: prevTotal + 1,
        },
      }
    })
  }

  return useMutation({
    mutationFn: (payload) => groupService.createGroup(payload),
    onSuccess: (data, variables, context) => {
      prependToLists(data)
      queryClient.invalidateQueries({ queryKey: ['groups', 'list'], exact: false })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useJoinGroup(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ code }) => groupService.joinGroup(code),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useUpdateGroup(groupId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => groupService.updateGroup(groupId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useDeleteGroup(groupId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => groupService.deleteGroup(groupId),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useArchiveGroup(groupId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => groupService.archiveGroup(groupId),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useRestoreGroup(groupId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => groupService.restoreGroup(groupId),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useLeaveGroup(groupId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => groupService.leaveGroup(groupId),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useAddGroupMember(groupId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => groupService.addMember(groupId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'members'] })
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useUpdateMemberRole(groupId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, payload }) => groupService.updateMemberRole(groupId, userId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'members'] })
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useRemoveGroupMember(groupId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId) => groupService.removeMember(groupId, userId),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'members'] })
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useCreateGroupRoom(groupId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => groupService.createRoom(groupId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'rooms'] })
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useGenerateJoinCode(groupId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => groupService.generateJoinCode(groupId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'join-code'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useDisableJoinCode(groupId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => groupService.disableJoinCode(groupId),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId, 'join-code'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export default {
  useGroups,
  useGroup,
  useGroupMembers,
  useGroupRooms,
  useGroupJoinCode,
  useCreateGroup,
  useJoinGroup,
  useUpdateGroup,
  useDeleteGroup,
  useArchiveGroup,
  useRestoreGroup,
  useLeaveGroup,
  useAddGroupMember,
  useUpdateMemberRole,
  useRemoveGroupMember,
  useCreateGroupRoom,
  useGenerateJoinCode,
  useDisableJoinCode,
}
