import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAccessToken } from '@/services/api'
import * as formulirService from '@/services/formulirService'

const hasToken = () => Boolean(getAccessToken())
const computeEnabled = (flag = true, guard = true) => Boolean((flag ?? true) && guard && hasToken())

const invalidateFormulirQueries = (queryClient, formulirId) => {
  queryClient.invalidateQueries({ queryKey: ['formulirs'] })
  if (!formulirId) return
  queryClient.invalidateQueries({ queryKey: ['formulirs', 'detail', formulirId] })
  queryClient.invalidateQueries({ queryKey: ['formulirs', formulirId, 'input-items'] })
  queryClient.invalidateQueries({ queryKey: ['formulirs', formulirId, 'versions'] })
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
      queryClient.invalidateQueries({ queryKey: ['forums', variables?.forumId, 'forms'] })
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
    mutationFn: ({ formulirId, payload }) => serviceFn(formulirId, payload ?? {}),
    onSuccess: (data, variables, context) => {
      invalidateFormulirQueries(queryClient, variables?.formulirId)
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
    mutationFn: ({ formulirId, versionId, payload }) => formulirService.revertFormulirVersion(formulirId, versionId, payload ?? {}),
    onSuccess: (data, variables, context) => {
      invalidateFormulirQueries(queryClient, variables?.formulirId)
      if (onSuccess) onSuccess(data, variables, context)
    },
    ...rest,
  })
}

export function useCreateInputItem(options = {}) {
  const queryClient = useQueryClient()
  const { onSuccess, ...rest } = options
  return useMutation({
    mutationFn: ({ formulirId, payload }) => formulirService.createInputItem(formulirId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['formulirs', variables?.formulirId, 'input-items'] })
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
      const formulirId = data?.topic_id || data?.formulir_id || variables?.formulirId
      if (formulirId) queryClient.invalidateQueries({ queryKey: ['formulirs', formulirId, 'input-items'] })
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
