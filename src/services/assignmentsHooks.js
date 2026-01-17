import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAccessToken } from './api'
import * as assignmentsService from './assignmentsService'

const hasToken = () => Boolean(getAccessToken())
const withEnabled = (options = {}, guard = true) => Boolean((options.enabled ?? true) && guard && hasToken())

const invalidateAssignments = (queryClient) => {
  queryClient.invalidateQueries({ predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'assignments' })
}

export function useAssignments(params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['assignments', params],
    queryFn: () => assignmentsService.listAssignments(params),
    keepPreviousData: true,
    staleTime: 30_000,
    ...rest,
    enabled: withEnabled({ enabled }, true),
  })
}

export function useAssignment(assignmentId, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['assignments', 'detail', assignmentId],
    queryFn: () => assignmentsService.getAssignment(assignmentId),
    ...rest,
    enabled: withEnabled({ enabled }, Boolean(assignmentId)),
  })
}

export function useAssignTopic(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ topicId, payload }) => assignmentsService.assignTopic(topicId, payload),
    onSuccess: (data, variables, context) => {
      invalidateAssignments(queryClient)
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useAssignComment(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ commentId, payload }) => assignmentsService.assignComment(commentId, payload),
    onSuccess: (data, variables, context) => {
      invalidateAssignments(queryClient)
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useUpdateAssignment(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ assignmentId, payload }) => assignmentsService.updateAssignment(assignmentId, payload),
    onSuccess: (data, variables, context) => {
      invalidateAssignments(queryClient)
      if (variables?.assignmentId) {
        queryClient.invalidateQueries({ queryKey: ['assignments', 'detail', variables.assignmentId] })
      }
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useCompleteAssignment(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assignmentId) => assignmentsService.completeAssignment(assignmentId),
    onSuccess: (data, variables, context) => {
      invalidateAssignments(queryClient)
      if (variables) {
        queryClient.invalidateQueries({ queryKey: ['assignments', 'detail', variables] })
      }
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useCancelAssignment(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ assignmentId, payload }) => assignmentsService.cancelAssignment(assignmentId, payload),
    onSuccess: (data, variables, context) => {
      invalidateAssignments(queryClient)
      if (variables?.assignmentId) {
        queryClient.invalidateQueries({ queryKey: ['assignments', 'detail', variables.assignmentId] })
      }
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useEscalateAssignment(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ assignmentId, payload }) => assignmentsService.escalateAssignment(assignmentId, payload),
    onSuccess: (data, variables, context) => {
      invalidateAssignments(queryClient)
      if (variables?.assignmentId) {
        queryClient.invalidateQueries({ queryKey: ['assignments', 'detail', variables.assignmentId] })
      }
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export default {
  useAssignments,
  useAssignment,
  useAssignTopic,
  useAssignComment,
  useUpdateAssignment,
  useCompleteAssignment,
  useCancelAssignment,
  useEscalateAssignment,
}
