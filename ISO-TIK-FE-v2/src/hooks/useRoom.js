import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAccessToken } from '@/services/api'
import * as roomService from '@/services/roomService'

const hasToken = () => Boolean(getAccessToken())

const computeEnabled = (options = {}, guard = true) => {
  const flag = options.enabled ?? true
  return Boolean(flag && guard && hasToken())
}

export function useRooms(params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['rooms', 'list', params],
    queryFn: () => roomService.listRooms(params),
    keepPreviousData: true,
    staleTime: 30_000,
    ...rest,
    enabled: computeEnabled({ enabled }, true),
  })
}

export function useRoom(roomId, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['rooms', roomId],
    queryFn: () => roomService.getRoom(roomId),
    ...rest,
    enabled: computeEnabled({ enabled }, Boolean(roomId)),
  })
}

export function useRoomParticipants(roomId, params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['rooms', roomId, 'participants', params],
    queryFn: () => roomService.listParticipants(roomId, params),
    keepPreviousData: true,
    staleTime: 15_000,
    ...rest,
    enabled: computeEnabled({ enabled }, Boolean(roomId)),
  })
}

export function useRoomTopics(roomId, params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['rooms', roomId, 'topics', params],
    queryFn: () => roomService.listTopics(roomId, params),
    keepPreviousData: true,
    staleTime: 15_000,
    ...rest,
    enabled: computeEnabled({ enabled }, Boolean(roomId)),
  })
}

export function useUpdateRoom(roomId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => roomService.updateRoom(roomId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] })
      queryClient.invalidateQueries({ queryKey: ['rooms', 'list'], exact: false })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useDeleteRoom(roomId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => roomService.deleteRoom(roomId),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useLockRoom(roomId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => roomService.lockRoom(roomId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useUnlockRoom(roomId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => roomService.unlockRoom(roomId),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useArchiveRoom(roomId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => roomService.archiveRoom(roomId),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useRestoreRoom(roomId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => roomService.restoreRoom(roomId),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useLeaveRoom(roomId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => roomService.leaveRoom(roomId),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', 'list'] })
      if (roomId) {
        queryClient.invalidateQueries({ queryKey: ['rooms', roomId] })
        queryClient.invalidateQueries({ queryKey: ['rooms', roomId, 'participants'] })
      }
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useAddRoomParticipant(roomId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => roomService.addParticipant(roomId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId, 'participants'] })
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useUpdateRoomParticipant(roomId, participantId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => roomService.updateParticipant(roomId, participantId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId, 'participants'] })
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useRemoveRoomParticipant(roomId, participantId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => roomService.removeParticipant(roomId, participantId),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId, 'participants'] })
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useCreateRoom(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => {
      return roomService.createRoom(payload)
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useJoinForumByCode(options = {}) {
  return useMutation({
    mutationFn: (payload) => roomService.joinForumByCode(payload),
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
    queryFn: () => roomService.listAvailableUsers(params),
    keepPreviousData: true,
    staleTime: 30_000,
    ...rest,
    enabled: Boolean(enabled !== false && hasToken()),
  })
}

export default {
  useRooms,
  useRoom,
  useRoomParticipants,
  useRoomTopics,
  useUpdateRoom,
  useDeleteRoom,
  useLockRoom,
  useUnlockRoom,
  useArchiveRoom,
  useRestoreRoom,
  useLeaveRoom,
  useAddRoomParticipant,
  useUpdateRoomParticipant,
  useRemoveRoomParticipant,
  useCreateRoom,
  useJoinForumByCode,
  useAvailableUsers,
}
