import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAccessToken } from './api'
import * as topicService from './topicService'
import api from './api' // TAMBAHKAN IMPORT INI!

const hasToken = () => Boolean(getAccessToken())
const computeEnabled = (flag = true, guard = true) => Boolean((flag ?? true) && guard && hasToken())

const invalidateTopicQueries = (queryClient, topicId) => {
  queryClient.invalidateQueries({ queryKey: ['topics'] })
  if (!topicId) return
  queryClient.invalidateQueries({ queryKey: ['topics', 'detail', topicId] })
  queryClient.invalidateQueries({ queryKey: ['topics', topicId, 'timeline'] })
  queryClient.invalidateQueries({ queryKey: ['topics', topicId, 'input-items'] })
  queryClient.invalidateQueries({ queryKey: ['topics', topicId, 'versions'] })
  queryClient.invalidateQueries({ queryKey: ['topics', topicId, 'reviews'] })
}

const useWorkflowMutation = (serviceFn, options = {}) => {
  const queryClient = useQueryClient()
  const { onSuccess, ...rest } = options
  return useMutation({
    mutationFn: ({ topicId, payload }) => {
      if (!topicId) {
        throw new Error('topicId is required to run this workflow action')
      }
      return serviceFn(topicId, payload ?? {})
    },
    onSuccess: (data, variables, context) => {
      const currentTopicId = variables?.topicId
      invalidateTopicQueries(queryClient, currentTopicId)
      if (onSuccess) onSuccess(data, variables, context)
    },
    ...rest,
  })
}

export function useTopics(params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['topics', params],
    queryFn: () => topicService.listTopics(params),
    keepPreviousData: true,
    staleTime: 30_000,
    ...rest,
    enabled: computeEnabled(enabled ?? true, true),
  })
}

export function useTopic(topicId, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['topics', 'detail', topicId],
    queryFn: () => topicService.getTopic(topicId),
    ...rest,
    enabled: computeEnabled(enabled ?? true, Boolean(topicId)),
  })
}

export function useTopicLabels(topicId, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['topics', topicId, 'labels'],
    queryFn: () => topicService.getTopicLabels(topicId),
    staleTime: 15_000,
    ...rest,
    enabled: computeEnabled(enabled ?? true, Boolean(topicId)),
  })
}

export function useTopicInputItems(topicId, params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['topics', topicId, 'input-items', params],
    queryFn: () => topicService.getTopicInputItems(topicId, params),
    staleTime: 0,
    cacheTime: 5 * 60 * 1000,
    ...rest,
    enabled: computeEnabled(enabled ?? true, Boolean(topicId)),
  })
}

export function useCreateTopic(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ forumId, payload }) => topicService.createTopic(forumId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['topics'] })
      queryClient.invalidateQueries({ queryKey: ['rooms', variables?.forumId, 'topics'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useUpdateTopic(topicId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => topicService.updateTopic(topicId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['topics'] })
      queryClient.invalidateQueries({ queryKey: ['topics', 'detail', topicId] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useDeleteTopic(topicId, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params) => topicService.deleteTopic(topicId, params),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['topics'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function usePublishTopic(options = {}) {
  return useWorkflowMutation(topicService.publishTopic, options)
}

export function useApproveTopic(options = {}) {
  return useWorkflowMutation(topicService.approveTopic, options)
}

export function useRequestTopicChanges(options = {}) {
  return useWorkflowMutation(topicService.requestChanges, options)
}

export function useCloseTopic(options = {}) {
  return useWorkflowMutation(topicService.closeTopic, options)
}

export function useReopenTopic(options = {}) {
  return useWorkflowMutation(topicService.reopenTopic, options)
}

export function useRestoreTopic(options = {}) {
  return useWorkflowMutation(topicService.restoreTopic, options)
}

export function useFreezeTopic(options = {}) {
  return useWorkflowMutation(topicService.freezeTopic, options)
}

export function useUnfreezeTopic(options = {}) {
  return useWorkflowMutation(topicService.unfreezeTopic, options)
}

const invalidateTopicLabelQueries = (queryClient, topicId) => {
  if (!topicId) return
  queryClient.invalidateQueries({ queryKey: ['topics', topicId, 'labels'] })
  invalidateTopicQueries(queryClient, topicId)
}

export function useAttachTopicLabel(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ topicId, labelId }) => topicService.attachTopicLabel(topicId, labelId),
    onSuccess: (data, variables, context) => {
      const topicId = variables?.topicId
      invalidateTopicLabelQueries(queryClient, topicId)
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useDetachTopicLabel(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ topicId, labelId }) => topicService.detachTopicLabel(topicId, labelId),
    onSuccess: (data, variables, context) => {
      const topicId = variables?.topicId
      invalidateTopicLabelQueries(queryClient, topicId)
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useTopicTimeline(topicId, params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['topics', topicId, 'timeline', params],
    queryFn: () => topicService.getTopicTimeline(topicId, params),
    staleTime: 15_000,
    ...rest,
    enabled: computeEnabled(enabled ?? true, Boolean(topicId)),
  })
}

export function useTopicReviews(topicId, params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['topics', topicId, 'reviews', params],
    queryFn: () => topicService.getTopicReviews(topicId, params),
    staleTime: 0,
    cacheTime: 5 * 60 * 1000,
    ...rest,
    enabled: computeEnabled(enabled ?? true, Boolean(topicId)),
  })
}

export function useAttachment(attachmentId, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['attachments', attachmentId],
    queryFn: () => topicService.getAttachment(attachmentId),
    staleTime: 30_000,
    ...rest,
    enabled: computeEnabled(enabled ?? true, Boolean(attachmentId)),
  })
}

export function useAttachmentDownloadInfo(attachmentId, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['attachments', attachmentId, 'download-info'],
    queryFn: () => topicService.getAttachmentDownloadInfo(attachmentId),
    staleTime: 5 * 60 * 1000,
    ...rest,
    enabled: computeEnabled(enabled ?? true, Boolean(attachmentId)),
  })
}

export function useDownloadAttachment(options = {}) {
  return useMutation({
    mutationFn: ({ attachmentId }) => topicService.downloadAttachment(attachmentId),
    ...options,
  })
}

export function useComment(topicId, commentId, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['topics', topicId, 'comment', commentId],
    queryFn: () => topicService.getCommentById(topicId, commentId, options),
    staleTime: 30_000,
    ...rest,
    enabled: computeEnabled(enabled ?? true, Boolean(topicId && commentId)),
  })
}

export function useCreateTopicReview(options = {}) {
  const queryClient = useQueryClient()
  const { onSuccess, ...rest } = options
  return useMutation({
    mutationFn: ({ topicId, payload }) => topicService.createTopicReview(topicId, payload),
    onSuccess: (data, variables, context) => {
      const topicId = variables?.topicId
      invalidateTopicQueries(queryClient, topicId)
      if (onSuccess) onSuccess(data, variables, context)
    },
    ...rest,
  })
}

export function useUpdateTopicReview(options = {}) {
  const queryClient = useQueryClient()
  const { onSuccess, ...rest } = options
  return useMutation({
    mutationFn: ({ topicId, reviewId, payload }) => topicService.updateTopicReview(topicId, reviewId, payload),
    onSuccess: (data, variables, context) => {
      const topicId = variables?.topicId
      invalidateTopicQueries(queryClient, topicId)
      if (onSuccess) onSuccess(data, variables, context)
    },
    ...rest,
  })
}

export function useDeleteTopicReview(options = {}) {
  const queryClient = useQueryClient()
  const { onSuccess, ...rest } = options
  return useMutation({
    mutationFn: ({ topicId, reviewId, payload }) => topicService.deleteTopicReview(topicId, reviewId, payload),
    onSuccess: (data, variables, context) => {
      const topicId = variables?.topicId
      invalidateTopicQueries(queryClient, topicId)
      if (onSuccess) onSuccess(data, variables, context)
    },
    ...rest,
  })
}

export function useReplyComment(options = {}) {
  const queryClient = useQueryClient()
  const { onSuccess, ...rest } = options
  return useMutation({
    mutationFn: ({ commentId, payload }) => topicService.replyToComment(commentId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey.includes('reviews') })
      if (onSuccess) onSuccess(data, variables, context)
    },
    ...rest,
  })
}

export function useUploadCommentAttachment(options = {}) {
  const queryClient = useQueryClient()
  const { onSuccess, ...rest } = options
  return useMutation({
    mutationFn: ({ commentId, file, label }) => topicService.uploadCommentAttachment(commentId, file, label),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey.includes('reviews') })
      if (onSuccess) onSuccess(data, variables, context)
    },
    ...rest,
  })
}

export function useTopicVersions(topicId, params = {}, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['topics', topicId, 'versions', params],
    queryFn: () => topicService.getTopicVersions(topicId, params),
    staleTime: 0,
    cacheTime: 5 * 60 * 1000,
    ...rest,
    enabled: computeEnabled(enabled ?? true, Boolean(topicId)),
  })
}

export function useTopicVersion(topicId, versionId, options = {}) {
  const { enabled, ...rest } = options
  return useQuery({
    queryKey: ['topics', topicId, 'version', versionId],
    queryFn: () => topicService.getTopicVersion(topicId, versionId),
    staleTime: 30_000,
    ...rest,
    enabled: computeEnabled(enabled ?? true, Boolean(topicId && versionId)),
  })
}

export function useRevertTopicVersion(options = {}) {
  const queryClient = useQueryClient()
  const { onSuccess, ...rest } = options
  return useMutation({
    mutationFn: ({ topicId, versionId, payload }) => {
      if (!topicId) throw new Error('topicId is required to revert version')
      if (!versionId) throw new Error('versionId is required to revert version')
      return topicService.revertTopicVersion(topicId, versionId, payload ?? {})
    },
    onSuccess: (data, variables, context) => {
      const topicId = variables?.topicId
      invalidateTopicQueries(queryClient, topicId)
      if (onSuccess) onSuccess(data, variables, context)
    },
    ...rest,
  })
}

// ============== HOKS BARU UNTUK INPUT ITEMS ==============

// Hook untuk create input item (menggunakan topicService yang sudah ada)
export function useCreateInputItem(options = {}) {
  const queryClient = useQueryClient()
  const { onSuccess, ...rest } = options
  
  return useMutation({
    mutationFn: ({ topicId, payload }) => {
      if (!topicId) throw new Error('topicId is required')
      if (!payload?.type) throw new Error('type is required')
      
      return topicService.createInputItem(topicId, payload)
    },
    onSuccess: (data, variables, context) => {
      // Invalidate queries terkait
      queryClient.invalidateQueries({ queryKey: ['topics', variables?.topicId, 'input-items'] })
      if (onSuccess) onSuccess(data, variables, context)
    },
    ...rest,
  })
}

// Hook untuk update input item
export function useUpdateInputItem(options = {}) {
  const queryClient = useQueryClient()
  const { onSuccess, ...rest } = options
  
  return useMutation({
    mutationFn: ({ inputItemId, payload }) => {
      if (!inputItemId) throw new Error('inputItemId is required')
      
      return topicService.updateInputItem(inputItemId, payload)
    },
    onSuccess: (data, variables, context) => {
      // Dapatkan topicId dari data response jika ada
      const topicId = data?.topic_id || variables?.topicId
      if (topicId) {
        queryClient.invalidateQueries({ queryKey: ['topics', topicId, 'input-items'] })
      }
      if (onSuccess) onSuccess(data, variables, context)
    },
    ...rest,
  })
}

// Hook untuk delete input item
export function useDeleteInputItem(options = {}) {
  const queryClient = useQueryClient()
  const { onSuccess, ...rest } = options
  
  return useMutation({
    mutationFn: ({ inputItemId, topicId }) => {
      if (!inputItemId) throw new Error('inputItemId is required')
      
      // Gunakan service yang sudah ada atau buat fungsi baru di topicService
      return topicService.deleteInputItem?.(inputItemId) || 
             (async () => { throw new Error('deleteInputItem not implemented') })()
    },
    onSuccess: (data, variables, context) => {
      if (variables?.topicId) {
        queryClient.invalidateQueries({ queryKey: ['topics', variables.topicId, 'input-items'] })
      }
      if (onSuccess) onSuccess(data, variables, context)
    },
    ...rest,
  })
}

// ============== EXPORT DEFAULT ==============

export default {
  useTopics,
  useTopic,
  useTopicLabels,
  useTopicInputItems,
  useCreateTopic,
  useUpdateTopic,
  useDeleteTopic,
  usePublishTopic,
  useApproveTopic,
  useRequestTopicChanges,
  useCloseTopic,
  useReopenTopic,
  useRestoreTopic,
  useFreezeTopic,
  useUnfreezeTopic,
  useAttachTopicLabel,
  useDetachTopicLabel,
  useTopicTimeline,
  useTopicReviews,
  useAttachment,
  useAttachmentDownloadInfo,
  useDownloadAttachment,
  useComment,
  useCreateTopicReview,
  useUpdateTopicReview,
  useDeleteTopicReview,
  useTopicVersions,
  useTopicVersion,
  useRevertTopicVersion,
  // Export hooks baru
  useCreateInputItem,
  useUpdateInputItem,
  useDeleteInputItem,
}