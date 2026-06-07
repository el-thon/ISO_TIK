import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAccessToken } from '@/services/api'
import * as formulirService from '@/services/formulirService'

const hasToken = () => Boolean(getAccessToken())
const computeEnabled = (flag = true, guard = true) => Boolean((flag ?? true) && guard && hasToken())

const invalidateFormulirQueries = (queryClient, formulirId) => {
  queryClient.invalidateQueries({ queryKey: ['formulirs'] })
  queryClient.invalidateQueries({ queryKey: ['topics'] })
  if (!formulirId) return
  queryClient.invalidateQueries({ queryKey: ['formulirs', 'detail', formulirId] })
  queryClient.invalidateQueries({ queryKey: ['formulirs', formulirId, 'input-items'] })
  queryClient.invalidateQueries({ queryKey: ['formulirs', formulirId, 'versions'] })
  queryClient.invalidateQueries({ queryKey: ['topics', 'detail', formulirId] })
  queryClient.invalidateQueries({ queryKey: ['topics', formulirId, 'input-items'] })
  queryClient.invalidateQueries({ queryKey: ['topics', formulirId, 'versions'] })
}

export function useFormulirs(params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['formulirs', params],
    queryFn: () => formulirService.listFormulirs(params),
    keepPreviousData: true,
    staleTime: 30_000,
    ...rest,
    enabled: computeEnabled(enabled ?? true, true),
  })
}

export function useFormulir(formulirId, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['formulirs', 'detail', formulirId],
    queryFn: () => formulirService.getFormulir(formulirId),
    ...rest,
    enabled: computeEnabled(enabled ?? true, Boolean(formulirId)),
  })
}

export function useFormulirInputItems(formulirId, params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['formulirs', formulirId, 'input-items', params],
    queryFn: () => formulirService.getFormulirInputItems(formulirId, params),
    staleTime: 0,
    cacheTime: 5 * 60 * 1000,
    ...rest,
    enabled: computeEnabled(enabled ?? true, Boolean(formulirId)),
  })
}

export function useCreateFormulir(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ forumId, payload }) => formulirService.createFormulir(forumId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['formulirs'] })
      queryClient.invalidateQueries({ queryKey: ['topics'] })
      queryClient.invalidateQueries({ queryKey: ['forums', variables?.forumId, 'forms'] })
      queryClient.invalidateQueries({ queryKey: ['rooms', variables?.forumId, 'formulirs'] })
      queryClient.invalidateQueries({ queryKey: ['rooms', variables?.forumId, 'topics'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useUpdateFormulir(formulirId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => formulirService.updateFormulir(formulirId, payload),
    onSuccess: (data, variables, context) => {
      invalidateFormulirQueries(queryClient, formulirId)
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

const useFormulirWorkflowMutation = (serviceFn, options = {}) => {
  const queryClient = useQueryClient()
  const { onSuccess, ...rest } = options
  return useMutation({
    mutationFn: ({ formulirId, topicId: legacyTopicId, payload }) => serviceFn(formulirId ?? legacyTopicId, payload ?? {}),
    onSuccess: (data, variables, context) => {
      invalidateFormulirQueries(queryClient, variables?.formulirId ?? variables?.topicId)
      if (onSuccess) onSuccess(data, variables, context)
    },
    ...rest,
  })
}

export function usePublishFormulir(options = {}) { return useFormulirWorkflowMutation(formulirService.publishFormulir, options) }
export function useApproveFormulir(options = {}) { return useFormulirWorkflowMutation(formulirService.approveFormulir, options) }
export function useRequestFormulirChanges(options = {}) { return useFormulirWorkflowMutation(formulirService.requestChanges, options) }
export function useCloseFormulir(options = {}) { return useFormulirWorkflowMutation(formulirService.closeFormulir, options) }
export function useReopenFormulir(options = {}) { return useFormulirWorkflowMutation(formulirService.reopenFormulir, options) }
export function useRestoreFormulir(options = {}) { return useFormulirWorkflowMutation(formulirService.restoreFormulir, options) }
export function useFreezeFormulir(options = {}) { return useFormulirWorkflowMutation(formulirService.freezeFormulir, options) }
export function useUnfreezeFormulir(options = {}) { return useFormulirWorkflowMutation(formulirService.unfreezeFormulir, options) }

export function useFormulirVersions(formulirId, params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['formulirs', formulirId, 'versions', params],
    queryFn: () => formulirService.getFormulirVersions(formulirId, params),
    staleTime: 0,
    cacheTime: 5 * 60 * 1000,
    ...rest,
    enabled: computeEnabled(enabled ?? true, Boolean(formulirId)),
  })
}

export function useRevertFormulirVersion(options = {}) {
  const queryClient = useQueryClient()
  const { onSuccess, ...rest } = options
  return useMutation({
    mutationFn: ({ formulirId, topicId: legacyTopicId, versionId, payload }) => formulirService.revertFormulirVersion(formulirId ?? legacyTopicId, versionId, payload ?? {}),
    onSuccess: (data, variables, context) => {
      invalidateFormulirQueries(queryClient, variables?.formulirId ?? variables?.topicId)
      if (onSuccess) onSuccess(data, variables, context)
    },
    ...rest,
  })
}

export function useCreateInputItem(options = {}) {
  const queryClient = useQueryClient()
  const { onSuccess, ...rest } = options
  return useMutation({
    mutationFn: ({ formulirId, topicId: legacyTopicId, payload }) => formulirService.createInputItem(formulirId ?? legacyTopicId, payload),
    onSuccess: (data, variables, context) => {
      const id = variables?.formulirId ?? variables?.topicId
      queryClient.invalidateQueries({ queryKey: ['formulirs', id, 'input-items'] })
      queryClient.invalidateQueries({ queryKey: ['topics', id, 'input-items'] })
      if (onSuccess) onSuccess(data, variables, context)
    },
    ...rest,
  })
}

export function useUpdateInputItem(options = {}) {
  const queryClient = useQueryClient()
  const { onSuccess, ...rest } = options
  return useMutation({
    mutationFn: ({ inputItemId, payload }) => formulirService.updateInputItem(inputItemId, payload),
    onSuccess: (data, variables, context) => {
      const formulirId = data?.topic_id || data?.formulir_id || variables?.formulirId || variables?.topicId
      if (formulirId) {
        queryClient.invalidateQueries({ queryKey: ['formulirs', formulirId, 'input-items'] })
        queryClient.invalidateQueries({ queryKey: ['topics', formulirId, 'input-items'] })
      }
      if (onSuccess) onSuccess(data, variables, context)
    },
    ...rest,
  })
}

export function useAttachment(attachmentId, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['attachments', attachmentId],
    queryFn: () => formulirService.getAttachment(attachmentId),
    staleTime: 30_000,
    ...rest,
    enabled: computeEnabled(enabled ?? true, Boolean(attachmentId)),
  })
}

export const useTopics = useFormulirs
export const useTopic = useFormulir
export const useTopicInputItems = useFormulirInputItems
export const useCreateTopic = useCreateFormulir
export const useUpdateTopic = useUpdateFormulir
export const usePublishTopic = usePublishFormulir
export const useApproveTopic = useApproveFormulir
export const useRequestTopicChanges = useRequestFormulirChanges
export const useCloseTopic = useCloseFormulir
export const useReopenTopic = useReopenFormulir
export const useRestoreTopic = useRestoreFormulir
export const useFreezeTopic = useFreezeFormulir
export const useUnfreezeTopic = useUnfreezeFormulir
export const useTopicVersions = useFormulirVersions
export const useRevertTopicVersion = useRevertFormulirVersion

export default {
  useFormulirs,
  useFormulir,
  useFormulirInputItems,
  useCreateFormulir,
  useUpdateFormulir,
  usePublishFormulir,
  useApproveFormulir,
  useRequestFormulirChanges,
  useCloseFormulir,
  useReopenFormulir,
  useRestoreFormulir,
  useFreezeFormulir,
  useUnfreezeFormulir,
  useFormulirVersions,
  useRevertFormulirVersion,
  useCreateInputItem,
  useUpdateInputItem,
  useAttachment,
}
