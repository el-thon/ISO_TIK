import api from './api'

const DEFAULT_PAGINATION = {
  current_page: 1,
  per_page: 15,
  total: 0,
  last_page: 1,
  from: null,
  to: null,
}

const ensureArray = (value) => {
  if (Array.isArray(value)) return value
  if (value == null) return []
  return [value]
}

const unwrap = (response) => {
  const successPayload = response?.data?.data
  if (successPayload && typeof successPayload === 'object') {
    return successPayload
  }

  const messagePayload = response?.data?.message
  if (messagePayload && typeof messagePayload === 'object') {
    return messagePayload
  }

  return response?.data ?? {}
}

const normalizeStorageUrl = (url) => {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) return trimmed
  // common patterns from backend storage paths
  if (trimmed.startsWith('attachments/') || trimmed.startsWith('files/') || trimmed.startsWith('storage/')) {
    return `/${trimmed}`
  }
  return `/${trimmed}`
}

export async function listTopics(params = {}) {
  const res = await api.get('/topics', { params })
  const payload = unwrap(res) ?? {}
  return {
    topics: ensureArray(payload.topics ?? payload.items ?? []),
    pagination: { ...DEFAULT_PAGINATION, ...(payload.pagination ?? {}) },
  }
}

export async function getTopic(topicId) {
  if (!topicId) throw new Error('topicId is required')
  const res = await api.get(`/topics/${topicId}`)
  return unwrap(res) ?? {}
}

export async function getTopicInputItems(topicId, params = {}) {
  if (!topicId) throw new Error('topicId is required to list input items')
  
  const res = await api.get(`/topics/${topicId}/input-items`, { params })
  const payload = unwrap(res) ?? {}
  const items = ensureArray(payload.items ?? payload.input_items ?? [])
  
  const processedItems = items.map((item, index) => {
    // Parse metadata safely (can be object or JSON string)
    const metadata = (() => {
      if (item?.metadata == null) return {}
      if (typeof item.metadata === 'object') return item.metadata
      if (typeof item.metadata === 'string') {
        try {
          const parsed = JSON.parse(item.metadata)
          return typeof parsed === 'object' && parsed !== null ? parsed : {}
        } catch {
          return {}
        }
      }
      return {}
    })()

    // Parse value if it is a JSON string (common for file/image payloads)
    let value = item?.value
    if (typeof value === 'string' && value.trim()) {
      // Check if it's JSON (starts with { or [)
      if (value.trim().startsWith('{') || value.trim().startsWith('[')) {
        try {
          const parsedValue = JSON.parse(value)
          value = parsedValue
        } catch {
          // keep original value if parse fails
        }
      }
    }

    // Extract file information from various possible locations
    const extractFileInfo = () => {
      const info = {
        url: null,
        name: null,
        previewUrl: null,
        size: null,
        type: null
      };

      // Check metadata first
  info.url = normalizeStorageUrl(metadata.url) || normalizeStorageUrl(metadata.storage_url) || normalizeStorageUrl(metadata.download_url) || normalizeStorageUrl(metadata.file_url) || normalizeStorageUrl(metadata.public_url);
      info.name = metadata.name || metadata.filename || metadata.original_name || metadata.file_name;
  info.previewUrl = normalizeStorageUrl(metadata.preview_url) || normalizeStorageUrl(metadata.thumbnail_url) || normalizeStorageUrl(metadata.image_url);
      info.size = metadata.size || metadata.size_bytes || metadata.file_size;
      info.type = metadata.type || metadata.mime_type || metadata.content_type;

      // Check value object if it exists
      if (value && typeof value === 'object') {
  info.url = info.url || normalizeStorageUrl(value.url) || normalizeStorageUrl(value.storage_url) || normalizeStorageUrl(value.download_url) || normalizeStorageUrl(value.file_url) || normalizeStorageUrl(value.path) || normalizeStorageUrl(value.uri);
        info.name = info.name || value.name || value.filename || value.original_name || value.file_name;
  info.previewUrl = info.previewUrl || normalizeStorageUrl(value.preview_url) || normalizeStorageUrl(value.thumbnail_url);
        info.size = info.size || value.size || value.size_bytes;
        info.type = info.type || value.type || value.mime_type;
        
        // Store these back to metadata for easy access
        if (value.url && !metadata.url) metadata.url = value.url;
        if (value.name && !metadata.name) metadata.name = value.name;
      }

      // Check attachments array when present (after upload endpoint)
      const attachments = ensureArray(item.attachments)
      if (attachments.length) {
        const primary = attachments[0]
        const attachmentUrl =
          normalizeStorageUrl(primary?.download_url) ||
          normalizeStorageUrl(primary?.storage_url) ||
          normalizeStorageUrl(primary?.url) ||
          (primary?.id ? `/api/v1/attachments/${primary.id}/download` : null)

        if (attachmentUrl && !info.url) {
          info.url = attachmentUrl;
          metadata.url = attachmentUrl;
        }
        const attachmentName =
          primary?.original_name ||
          primary?.client_name ||
          primary?.filename ||
          primary?.file_name ||
          primary?.name
        if (attachmentName && !info.name) {
          info.name = attachmentName;
          metadata.name = attachmentName;
        }
        if (primary?.size_bytes && !info.size) {
          info.size = primary.size_bytes;
          metadata.size_bytes = primary.size_bytes;
        }
        if (!info.previewUrl) {
          const thumb = primary?.preview_url || primary?.thumbnail_url
          if (thumb) {
            info.previewUrl = thumb;
            metadata.preview_url = thumb;
          }
        }
        if (primary?.mime_type && !info.type) {
          info.type = primary.mime_type;
          metadata.mime_type = primary.mime_type;
        }
        
        // Also store attachment_id for future reference
        if (primary?.id && !metadata.attachment_id) {
          metadata.attachment_id = primary.id;
        }
      }

      return info;
    };

    const fileInfo = extractFileInfo();
    
    // If we found file info, enrich metadata
    if (fileInfo.url && !metadata.url) metadata.url = fileInfo.url;
    if (fileInfo.name && !metadata.name) metadata.name = fileInfo.name;
  if (fileInfo.previewUrl && !metadata.preview_url) metadata.preview_url = fileInfo.previewUrl;
    if (fileInfo.size && !metadata.size) metadata.size = fileInfo.size;
    if (fileInfo.type && !metadata.type) metadata.type = fileInfo.type;

    return {
      ...item,
      metadata,
      value,
      order_index: item.order_index ?? item.order ?? index + 1,
      // Add helper fields for easier access
      file_url: fileInfo.url,
      file_name: fileInfo.name,
      preview_url: fileInfo.previewUrl,
      file_size: fileInfo.size,
      file_type: fileInfo.type
    }
  })
  
  return {
    items: processedItems,
  }
}

export async function createInputItem(topicId, payload = {}) {
  if (!topicId) throw new Error('topicId is required to create an input item')
  if (!payload?.type) throw new Error('type is required to create an input item')

  const res = await api.post(`/topics/${topicId}/input-items`, payload)
  const data = unwrap(res) ?? {}

  // Some responses wrap the item under `item`, others return the whole payload
  const item = data.item || data

  return item
}

export async function getTopicLabels(topicId) {
  if (!topicId) throw new Error('topicId is required to list labels')
  const res = await api.get(`/topics/${topicId}/labels`)
  const payload = unwrap(res) ?? {}
  return {
    labels: ensureArray(payload.labels ?? []),
  }
}

export async function attachTopicLabel(topicId, labelId) {
  if (!topicId) throw new Error('topicId is required to attach label')
  if (!labelId) throw new Error('labelId is required to attach label')
  const res = await api.post(`/topics/${topicId}/labels`, { label_id: labelId })
  return unwrap(res) ?? {}
}

export async function detachTopicLabel(topicId, labelId) {
  if (!topicId) throw new Error('topicId is required to detach label')
  if (!labelId) throw new Error('labelId is required to detach label')
  const res = await api.delete(`/topics/${topicId}/labels/${labelId}`)
  return unwrap(res) ?? {}
}

export async function createTopic(roomId, payload = {}) {
  if (!roomId) throw new Error('roomId is required when creating a topic')
  
  try {
    const res = await api.post(`/rooms/${roomId}/topics`, payload);
    
    // Return the full response data including any input_items that might be included
    const responseData = res?.data ?? {};
    
    // Log if input_items are included in response
    return responseData;
  } catch (error) {
    // Rethrow dengan informasi lebih jelas
    const enhancedError = new Error(
      `Failed to create topic: ${error.response?.data?.message || error.message}`
    );
    enhancedError.response = error.response;
    throw enhancedError;
  }
}

export async function updateTopic(topicId, payload = {}) {
  if (!topicId) throw new Error('topicId is required when updating a topic')
  const res = await api.put(`/topics/${topicId}`, payload)
  return unwrap(res) ?? {}
}

export async function uploadInputItemAttachment(inputItemId, file, label) {
  if (!inputItemId) throw new Error('inputItemId is required to upload attachment')
  if (!file) throw new Error('file is required to upload attachment')

  const formData = new FormData()
  formData.append('file', file)
  if (label) formData.append('label', label)

  const res = await api.post(`/input-items/${inputItemId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const result = unwrap(res) ?? {};

  const attachment = result.attachment || result.attachments?.[0] || result;
  const downloadUrl =
    attachment?.download_url ||
    attachment?.url ||
    attachment?.storage_url ||
    (attachment?.id ? `/api/v1/attachments/${attachment.id}/download` : undefined);

  return {
    attachment,
    url: downloadUrl,
    filename: attachment?.filename || file.name,
    size: attachment?.size_bytes || file.size,
    type: attachment?.mime_type || file.type,
    raw: result,
  };
}

export async function updateInputItem(inputItemId, payload = {}) {
  if (!inputItemId) throw new Error('inputItemId is required to update input item')

  const res = await api.put(`/input-items/${inputItemId}`, payload)
  const data = unwrap(res) ?? {}
  const item = data.item || data
  return item
}

export async function deleteTopic(topicId, params = {}) {
  if (!topicId) throw new Error('topicId is required when deleting a topic')
  const res = await api.delete(`/topics/${topicId}`, { params })
  return res?.data ?? {}
}

export async function publishTopic(topicId, payload = {}) {
  if (!topicId) throw new Error('topicId is required to publish')
  const res = await api.post(`/topics/${topicId}/publish`, payload)
  return unwrap(res) ?? {}
}

export async function approveTopic(topicId, payload = {}) {
  if (!topicId) throw new Error('topicId is required to approve')
  const res = await api.post(`/topics/${topicId}/approve`, payload)
  return unwrap(res) ?? {}
}

export async function requestChanges(topicId, payload = {}) {
  if (!topicId) throw new Error('topicId is required to request changes')
  const res = await api.post(`/topics/${topicId}/request-changes`, payload)
  return unwrap(res) ?? {}
}

export async function closeTopic(topicId, payload = {}) {
  if (!topicId) throw new Error('topicId is required to close')
  const res = await api.post(`/topics/${topicId}/close`, payload)
  return unwrap(res) ?? {}
}

export async function reopenTopic(topicId, payload = {}) {
  if (!topicId) throw new Error('topicId is required to reopen')
  const res = await api.post(`/topics/${topicId}/reopen`, payload)
  return unwrap(res) ?? {}
}

export async function restoreTopic(topicId) {
  if (!topicId) throw new Error('topicId is required to restore')
  const res = await api.post(`/topics/${topicId}/restore`)
  return unwrap(res) ?? {}
}

export async function freezeTopic(topicId, payload = {}) {
  if (!topicId) throw new Error('topicId is required to freeze')
  const res = await api.post(`/topics/${topicId}/freeze`, payload)
  return unwrap(res) ?? {}
}

export async function unfreezeTopic(topicId, payload = {}) {
  if (!topicId) throw new Error('topicId is required to unfreeze')
  const res = await api.post(`/topics/${topicId}/unfreeze`, payload)
  return unwrap(res) ?? {}
}

export async function getTopicTimeline(topicId, params = {}) {
  if (!topicId) throw new Error('topicId is required to get timeline')
  const res = await api.get(`/topics/${topicId}/timeline`, { params })
  const payload = unwrap(res) ?? {}
  return ensureArray(payload.events ?? [])
}

export async function getTopicReviews(topicId, params = {}) {
  if (!topicId) throw new Error('topicId is required to get reviews')
  const res = await api.get(`/topics/${topicId}/comments`, { params })
  const payload = unwrap(res) ?? {}
  return {
    reviews: ensureArray(payload.reviews ?? payload.items ?? payload.comments ?? []),
    pagination: { ...DEFAULT_PAGINATION, ...(payload.pagination ?? {}) },
  }
}

// Find a single comment (or reply) by id by paging through topic comments
export async function getCommentById(topicId, commentId, options = {}) {
  if (!topicId) throw new Error('topicId is required to get comment')
  if (!commentId) throw new Error('commentId is required to get comment')

  const perPage = options.per_page || 20
  let page = 1
  const maxPages = options.maxPages || 50 // safety cap to avoid infinite loops

  const findInThread = (comments, id) => {
    if (!comments || !comments.length) return null
    for (const c of comments) {
      if (!c) continue
      if (String(c.id) === String(id)) return c
      const replies = ensureArray(c.replies)
      if (replies.length) {
        const found = findInThread(replies, id)
        if (found) return found
      }
    }
    return null
  }

  while (page <= maxPages) {
    const res = await api.get(`/topics/${topicId}/comments`, { params: { page, per_page: perPage } })
    const payload = unwrap(res) ?? {}
    const comments = ensureArray(payload.comments ?? payload.reviews ?? payload.items ?? [])

    const found = findInThread(comments, commentId)
    if (found) return found

    const pagination = payload.pagination ?? {}
    const lastPage = pagination.last_page ?? null
    if (lastPage && page >= lastPage) break
    // if pagination not present, stop after one page
    if (!lastPage) break
    page += 1
  }

  // Not found
  throw new Error(`Comment with id ${commentId} not found for topic ${topicId}`)
}

export async function createTopicReview(topicId, payload = {}) {
  if (!topicId) throw new Error('topicId is required to create review')
  const body = payload?.comment ?? payload?.body
  if (!body) throw new Error('comment is required to create review')
  const res = await api.post(`/topics/${topicId}/comments`, { body })
  return unwrap(res) ?? {}
}

// Reply to a topic comment
export async function replyToComment(commentId, payload = {}) {
  if (!commentId) throw new Error('commentId is required to reply')
  const body = payload?.comment ?? payload?.body
  if (!body) throw new Error('comment body is required to reply')
  const res = await api.post(`/comments/${commentId}/reply`, { body })
  return unwrap(res) ?? {}
}

// Upload attachment for a comment
export async function uploadCommentAttachment(commentId, file, label) {
  if (!commentId) throw new Error('commentId is required to upload comment attachment')
  if (!file) throw new Error('file is required to upload comment attachment')

  const formData = new FormData()
  formData.append('file', file)
  if (label) formData.append('label', label)

  const res = await api.post(`/comments/${commentId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  const result = unwrap(res) ?? {}
  const attachment = result.attachment || result.attachments?.[0] || result
  const downloadUrl =
    attachment?.download_url ||
    attachment?.url ||
    attachment?.storage_url ||
    (attachment?.id ? `/api/v1/attachments/${attachment.id}/download` : undefined)

  return {
    attachment,
    url: downloadUrl,
    filename: attachment?.filename || file.name,
    size: attachment?.size_bytes || file.size,
    type: attachment?.mime_type || file.type,
    raw: result,
  }
}

export async function getAttachment(attachmentId) {
  if (!attachmentId) throw new Error('attachmentId is required to get attachment')
  const res = await api.get(`/attachments/${attachmentId}`)
  return unwrap(res) ?? {}
}

export const getAttachmentDownloadUrl = (attachmentId) => {
  if (!attachmentId) throw new Error('attachmentId is required to build download url')
  return `/api/v1/attachments/${attachmentId}/download`
}

export async function downloadAttachment(attachmentId) {
  if (!attachmentId) throw new Error('attachmentId is required to download attachment')
  const res = await api.get(`/attachments/${attachmentId}/download`, {
    responseType: 'blob',
  })

  const contentType = res.headers?.['content-type']
  const disposition = res.headers?.['content-disposition'] || ''
  const filenameMatch = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i)
  const filename = decodeURIComponent(filenameMatch?.[1] || filenameMatch?.[2] || '') || undefined

  return {
    blob: res.data,
    contentType,
    filename,
  }
}

export async function getTopicVersions(topicId, params = {}) {
  if (!topicId) throw new Error('topicId is required to get versions')
  const res = await api.get(`/topics/${topicId}/versions`, { params })
  const payload = unwrap(res) ?? {}
  return {
    versions: ensureArray(payload.versions ?? []),
    pagination: { ...DEFAULT_PAGINATION, ...(payload.pagination ?? {}) },
  }
}

export async function getTopicVersion(topicId, versionId) {
  if (!topicId) throw new Error('topicId is required to get version detail')
  if (!versionId) throw new Error('versionId is required to get version detail')
  const res = await api.get(`/topics/${topicId}/versions/${versionId}`)
  return unwrap(res) ?? {}
}

export async function revertTopicVersion(topicId, versionId, payload = {}) {
  if (!topicId) throw new Error('topicId is required to revert version')
  if (!versionId) throw new Error('versionId is required to revert version')
  const res = await api.post(`/topics/${topicId}/versions/${versionId}/revert`, payload)
  return unwrap(res) ?? {}
}

// Helper function to manually refresh input items cache
export const refreshTopicInputItems = async (topicId, queryClient) => {
  if (!topicId || !queryClient) return;
  
  try {
    await queryClient.invalidateQueries({ 
      queryKey: ['topics', topicId, 'input-items'] 
    });
  } catch {
    // ignore refresh errors
  }
};

// Create attachment with topic and recipient
export async function createAttachment(payload) {
  if (!payload) throw new Error('payload is required to create attachment')
  const res = await api.post('/attachments', payload)
  return unwrap(res) ?? {}
}

// List all attachments
export async function listAttachments(params = {}) {
  const res = await api.get('/attachments', { params })
  const payload = unwrap(res) ?? {}
  return {
    attachments: ensureArray(payload.attachments ?? payload.items ?? []),
    pagination: { ...DEFAULT_PAGINATION, ...(payload.pagination ?? {}) },
  }
}

export default {
  listTopics,
  getTopic,
  getTopicLabels,
  getTopicInputItems,
  attachTopicLabel,
  detachTopicLabel,
  createTopic,
  updateTopic,
  uploadInputItemAttachment,
  deleteTopic,
  publishTopic,
  approveTopic,
  requestChanges,
  closeTopic,
  reopenTopic,
  restoreTopic,
  freezeTopic,
  unfreezeTopic,
  getTopicTimeline,
  getTopicReviews,
  createTopicReview,
  replyToComment,
  uploadCommentAttachment,
  getAttachment,
  getAttachmentDownloadUrl,
  downloadAttachment,
  getTopicVersions,
  getTopicVersion,
  revertTopicVersion,
  refreshTopicInputItems,
  createAttachment,
  listAttachments,
}