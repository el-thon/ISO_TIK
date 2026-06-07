import api from './api'
import { ensureArray, mergePagination, unwrapApiPayload } from './serviceUtils'

const normalizeStorageUrl = (url) => {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) return trimmed
  if (trimmed.startsWith('attachments/') || trimmed.startsWith('files/') || trimmed.startsWith('storage/')) return `/${trimmed}`
  return `/${trimmed}`
}

export async function listFormulirs(params = {}) {
  const res = await api.get('/topics', { params })
  const payload = unwrapApiPayload(res) ?? {}
  const formulirs = ensureArray(payload.formulirs ?? payload.forms ?? payload.topics ?? payload.items ?? [])
  return {
    formulirs,
    topics: formulirs,
    pagination: mergePagination(payload.pagination),
  }
}

export async function getFormulir(formulirId) {
  if (!formulirId) throw new Error('formulirId is required')
  const res = await api.get(`/topics/${formulirId}`)
  const payload = unwrapApiPayload(res) ?? {}
  const formulir = payload.formulir ?? payload.form ?? payload.topic ?? payload

  return {
    ...formulir,
    input_items: payload.input_items ?? formulir.input_items ?? [],
    items: payload.items ?? formulir.items ?? payload.input_items ?? formulir.input_items ?? [],
    workflow: payload.workflow ?? formulir.workflow ?? null,
    participants: payload.participants ?? formulir.participants ?? [],
    versions: payload.versions ?? formulir.versions ?? [],
  }
}

export async function getFormulirInputItems(formulirId, params = {}) {
  if (!formulirId) throw new Error('formulirId is required to list input items')
  const res = await api.get(`/topics/${formulirId}/input-items`, { params })
  const payload = unwrapApiPayload(res) ?? {}
  const items = ensureArray(payload.items ?? payload.input_items ?? [])

  const processedItems = items.map((item, index) => {
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

    let value = item?.value
    if (typeof value === 'string' && value.trim() && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
      try {
        value = JSON.parse(value)
      } catch {
        // keep original value
      }
    }

    const extractFileInfo = () => {
      const info = { url: null, name: null, previewUrl: null, size: null, type: null }
      info.url = normalizeStorageUrl(metadata.url) || normalizeStorageUrl(metadata.storage_url) || normalizeStorageUrl(metadata.download_url) || normalizeStorageUrl(metadata.file_url) || normalizeStorageUrl(metadata.public_url)
      info.name = metadata.name || metadata.filename || metadata.original_name || metadata.file_name
      info.previewUrl = normalizeStorageUrl(metadata.preview_url) || normalizeStorageUrl(metadata.thumbnail_url) || normalizeStorageUrl(metadata.image_url)
      info.size = metadata.size || metadata.size_bytes || metadata.file_size
      info.type = metadata.type || metadata.mime_type || metadata.content_type

      if (value && typeof value === 'object') {
        info.url = info.url || normalizeStorageUrl(value.url) || normalizeStorageUrl(value.storage_url) || normalizeStorageUrl(value.download_url) || normalizeStorageUrl(value.file_url) || normalizeStorageUrl(value.path) || normalizeStorageUrl(value.uri)
        info.name = info.name || value.name || value.filename || value.original_name || value.file_name
        info.previewUrl = info.previewUrl || normalizeStorageUrl(value.preview_url) || normalizeStorageUrl(value.thumbnail_url)
        info.size = info.size || value.size || value.size_bytes
        info.type = info.type || value.type || value.mime_type
      }

      const attachments = ensureArray(item.attachments)
      if (attachments.length) {
        const primary = attachments[0]
        const attachmentUrl = normalizeStorageUrl(primary?.download_url) || normalizeStorageUrl(primary?.storage_url) || normalizeStorageUrl(primary?.url) || (primary?.id ? `/api/v1/attachments/${primary.id}/download` : null)
        if (attachmentUrl && !info.url) info.url = attachmentUrl
        info.name = info.name || primary?.original_name || primary?.client_name || primary?.filename || primary?.file_name || primary?.name
        info.size = info.size || primary?.size_bytes
        info.previewUrl = info.previewUrl || normalizeStorageUrl(primary?.preview_url) || normalizeStorageUrl(primary?.thumbnail_url)
        info.type = info.type || primary?.mime_type
        if (primary?.id && !metadata.attachment_id) metadata.attachment_id = primary.id
      }

      return info
    }

    const fileInfo = extractFileInfo()
    if (fileInfo.url && !metadata.url) metadata.url = fileInfo.url
    if (fileInfo.name && !metadata.name) metadata.name = fileInfo.name
    if (fileInfo.previewUrl && !metadata.preview_url) metadata.preview_url = fileInfo.previewUrl
    if (fileInfo.size && !metadata.size) metadata.size = fileInfo.size
    if (fileInfo.type && !metadata.type) metadata.type = fileInfo.type

    return {
      ...item,
      metadata,
      value,
      order_index: item.order_index ?? item.order ?? index + 1,
      file_url: fileInfo.url,
      file_name: fileInfo.name,
      preview_url: fileInfo.previewUrl,
      file_size: fileInfo.size,
      file_type: fileInfo.type,
    }
  })

  return { items: processedItems }
}

export async function createInputItem(formulirId, payload = {}) {
  if (!formulirId) throw new Error('formulirId is required to create an input item')
  if (!payload?.type) throw new Error('type is required to create an input item')
  const res = await api.post(`/topics/${formulirId}/input-items`, payload)
  const data = unwrapApiPayload(res) ?? {}
  return data.item || data
}

export async function updateInputItem(inputItemId, payload = {}) {
  if (!inputItemId) throw new Error('inputItemId is required to update input item')
  const res = await api.put(`/input-items/${inputItemId}`, payload)
  const data = unwrapApiPayload(res) ?? {}
  return data.item || data
}

export async function getFormulirLabels(formulirId) {
  if (!formulirId) throw new Error('formulirId is required to list labels')
  const res = await api.get(`/topics/${formulirId}/labels`)
  const payload = unwrapApiPayload(res) ?? {}
  return { labels: ensureArray(payload.labels ?? []) }
}

export async function attachFormulirLabel(formulirId, labelId) {
  if (!formulirId) throw new Error('formulirId is required to attach label')
  if (!labelId) throw new Error('labelId is required to attach label')
  const res = await api.post(`/topics/${formulirId}/labels`, { label_id: labelId })
  return unwrapApiPayload(res) ?? {}
}

export async function detachFormulirLabel(formulirId, labelId) {
  if (!formulirId) throw new Error('formulirId is required to detach label')
  if (!labelId) throw new Error('labelId is required to detach label')
  const res = await api.delete(`/topics/${formulirId}/labels/${labelId}`)
  return unwrapApiPayload(res) ?? {}
}

export async function createFormulir(forumId, payload = {}) {
  if (!forumId) throw new Error('forumId is required when creating a formulir')
  try {
    const res = await api.post(`/forums/${forumId}/topics`, payload)
    return res?.data ?? {}
  } catch (error) {
    const enhancedError = new Error(`Failed to create formulir: ${error.response?.data?.message || error.message}`)
    enhancedError.response = error.response
    throw enhancedError
  }
}

export async function updateFormulir(formulirId, payload = {}) {
  if (!formulirId) throw new Error('formulirId is required when updating a formulir')
  const res = await api.put(`/topics/${formulirId}`, payload)
  return unwrapApiPayload(res) ?? {}
}

export async function deleteFormulir(formulirId, params = {}) {
  if (!formulirId) throw new Error('formulirId is required when deleting a formulir')
  const res = await api.delete(`/topics/${formulirId}`, { params })
  return res?.data ?? {}
}

export async function uploadInputItemAttachment(inputItemId, file, label) {
  if (!inputItemId) throw new Error('inputItemId is required to upload attachment')
  if (!file) throw new Error('file is required to upload attachment')
  const formData = new FormData()
  formData.append('file', file)
  if (label) formData.append('label', label)
  const res = await api.post(`/input-items/${inputItemId}/attachments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  const result = unwrapApiPayload(res) ?? {}
  const attachment = result.attachment || result.attachments?.[0] || result
  const downloadUrl = attachment?.download_url || attachment?.url || attachment?.storage_url || (attachment?.id ? `/api/v1/attachments/${attachment.id}/download` : undefined)
  return { attachment, url: downloadUrl, filename: attachment?.filename || file.name, size: attachment?.size_bytes || file.size, type: attachment?.mime_type || file.type, raw: result }
}

export async function publishFormulir(formulirId, payload = {}) {
  if (!formulirId) throw new Error('formulirId is required to publish')
  const res = await api.post(`/topics/${formulirId}/publish`, payload)
  return unwrapApiPayload(res) ?? {}
}

export async function approveFormulir(formulirId, payload = {}) {
  if (!formulirId) throw new Error('formulirId is required to approve')
  const res = await api.post(`/topics/${formulirId}/approve`, payload)
  return unwrapApiPayload(res) ?? {}
}

export async function requestChanges(formulirId, payload = {}) {
  if (!formulirId) throw new Error('formulirId is required to request changes')
  const res = await api.post(`/topics/${formulirId}/request-changes`, payload)
  return unwrapApiPayload(res) ?? {}
}

export async function closeFormulir(formulirId, payload = {}) {
  if (!formulirId) throw new Error('formulirId is required to close')
  const res = await api.post(`/topics/${formulirId}/close`, payload)
  return unwrapApiPayload(res) ?? {}
}

export async function reopenFormulir(formulirId, payload = {}) {
  if (!formulirId) throw new Error('formulirId is required to reopen')
  const res = await api.post(`/topics/${formulirId}/reopen`, payload)
  return unwrapApiPayload(res) ?? {}
}

export async function restoreFormulir(formulirId) {
  if (!formulirId) throw new Error('formulirId is required to restore')
  const res = await api.post(`/topics/${formulirId}/restore`)
  return unwrapApiPayload(res) ?? {}
}

export async function freezeFormulir(formulirId, payload = {}) {
  if (!formulirId) throw new Error('formulirId is required to freeze')
  const res = await api.post(`/topics/${formulirId}/freeze`, payload)
  return unwrapApiPayload(res) ?? {}
}

export async function unfreezeFormulir(formulirId, payload = {}) {
  if (!formulirId) throw new Error('formulirId is required to unfreeze')
  const res = await api.post(`/topics/${formulirId}/unfreeze`, payload)
  return unwrapApiPayload(res) ?? {}
}

export async function getFormulirTimeline(formulirId, params = {}) {
  if (!formulirId) throw new Error('formulirId is required to get timeline')
  const res = await api.get(`/topics/${formulirId}/timeline`, { params })
  const payload = unwrapApiPayload(res) ?? {}
  return ensureArray(payload.events ?? [])
}

export async function getFormulirReviews(formulirId, params = {}) {
  if (!formulirId) throw new Error('formulirId is required to get reviews')
  const res = await api.get(`/topics/${formulirId}/reviews`, { params })
  const payload = unwrapApiPayload(res) ?? {}
  return { reviews: ensureArray(payload.reviews ?? payload.items ?? payload.data ?? []), pagination: mergePagination(payload.pagination) }
}

export async function getCommentById(formulirId, commentId, options = {}) {
  if (!formulirId) throw new Error('formulirId is required to get comment')
  if (!commentId) throw new Error('commentId is required to get comment')
  const perPage = options.per_page || 20
  let page = 1
  const maxPages = options.maxPages || 50
  const findInThread = (comments, id) => {
    for (const comment of comments || []) {
      if (String(comment?.id) === String(id)) return comment
      const found = findInThread(ensureArray(comment?.replies), id)
      if (found) return found
    }
    return null
  }
  while (page <= maxPages) {
    const res = await api.get(`/topics/${formulirId}/comments`, { params: { page, per_page: perPage } })
    const payload = unwrapApiPayload(res) ?? {}
    const comments = ensureArray(payload.comments ?? payload.reviews ?? payload.items ?? [])
    const found = findInThread(comments, commentId)
    if (found) return found
    const lastPage = payload.pagination?.last_page ?? null
    if (!lastPage || page >= lastPage) break
    page += 1
  }
  throw new Error(`Comment with id ${commentId} not found for formulir ${formulirId}`)
}

export async function createFormulirReview(formulirId, payload = {}) {
  if (!formulirId) throw new Error('formulirId is required to create review')
  if (!payload?.finding_type || !payload?.finding_description) throw new Error('finding_type and finding_description are required to create review')
  const res = await api.post(`/topics/${formulirId}/reviews`, payload)
  return unwrapApiPayload(res) ?? {}
}

export async function updateFormulirReview(formulirId, reviewId, payload = {}) {
  if (!formulirId || !reviewId) throw new Error('formulirId and reviewId are required to update review')
  const res = await api.put(`/topics/${formulirId}/reviews/${reviewId}`, payload)
  return unwrapApiPayload(res) ?? {}
}

export async function deleteFormulirReview(formulirId, reviewId, payload = {}) {
  if (!formulirId || !reviewId) throw new Error('formulirId and reviewId are required to delete review')
  const res = await api.delete(`/topics/${formulirId}/reviews/${reviewId}`, { data: payload })
  return unwrapApiPayload(res) ?? {}
}

export async function replyToComment(commentId, payload = {}) {
  if (!commentId) throw new Error('commentId is required to reply')
  const body = payload?.comment ?? payload?.body
  if (!body) throw new Error('comment body is required to reply')
  const res = await api.post(`/comments/${commentId}/reply`, { body })
  return unwrapApiPayload(res) ?? {}
}

export async function uploadCommentAttachment(commentId, file, label) {
  if (!commentId) throw new Error('commentId is required to upload comment attachment')
  if (!file) throw new Error('file is required to upload comment attachment')
  const formData = new FormData()
  formData.append('file', file)
  if (label) formData.append('label', label)
  const res = await api.post(`/comments/${commentId}/attachments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  const result = unwrapApiPayload(res) ?? {}
  const attachment = result.attachment || result.attachments?.[0] || result
  const downloadUrl = attachment?.download_url || attachment?.url || attachment?.storage_url || (attachment?.id ? `/api/v1/attachments/${attachment.id}/download` : undefined)
  return { attachment, url: downloadUrl, filename: attachment?.filename || file.name, size: attachment?.size_bytes || file.size, type: attachment?.mime_type || file.type, raw: result }
}

export async function getAttachment(attachmentId) {
  if (!attachmentId) throw new Error('attachmentId is required to get attachment')
  const attachment = unwrapApiPayload(await api.get(`/attachments/${attachmentId}`)) ?? {}
  if (attachment.attachment) return attachment.attachment
  if (attachment.data?.attachment) return attachment.data.attachment
  if (!attachment.filename) attachment.filename = 'lampiran'
  return attachment
}

export async function getAttachmentDownloadInfo(attachmentId) {
  if (!attachmentId) throw new Error('attachmentId is required to get download info')
  const res = await api.get(`/attachments/${attachmentId}/download-info`)
  return unwrapApiPayload(res) ?? {}
}

export const getAttachmentDownloadUrl = (attachmentId) => {
  if (!attachmentId) throw new Error('attachmentId is required to build download url')
  return `/api/v1/attachments/${attachmentId}/download`
}

export async function downloadAttachment(attachmentId) {
  if (!attachmentId) throw new Error('attachmentId is required to download attachment')
  const infoResponse = await getAttachmentDownloadInfo(attachmentId)
  let originalFilename = 'lampiran'
  if (infoResponse?.attachment?.filename) originalFilename = infoResponse.attachment.filename
  else if (infoResponse?.data?.attachment?.filename) originalFilename = infoResponse.data.attachment.filename
  else if (infoResponse?.filename) originalFilename = infoResponse.filename
  const res = await api.get(`/attachments/${attachmentId}/download`, { responseType: 'blob' })
  return { blob: res.data, contentType: res.headers?.['content-type'], filename: originalFilename }
}

export async function getFormulirVersions(formulirId, params = {}) {
  if (!formulirId) throw new Error('formulirId is required to get versions')
  const res = await api.get(`/topics/${formulirId}/versions`, { params })
  const payload = unwrapApiPayload(res) ?? {}
  return { versions: ensureArray(payload.versions ?? []), pagination: mergePagination(payload.pagination) }
}

export async function getFormulirVersion(formulirId, versionId) {
  if (!formulirId) throw new Error('formulirId is required to get version detail')
  if (!versionId) throw new Error('versionId is required to get version detail')
  const res = await api.get(`/topics/${formulirId}/versions/${versionId}`)
  return unwrapApiPayload(res) ?? {}
}

export async function revertFormulirVersion(formulirId, versionId, payload = {}) {
  if (!formulirId) throw new Error('formulirId is required to revert version')
  if (!versionId) throw new Error('versionId is required to revert version')
  const res = await api.post(`/topics/${formulirId}/versions/${versionId}/revert`, payload)
  return unwrapApiPayload(res) ?? {}
}

export const refreshFormulirInputItems = async (formulirId, queryClient) => {
  if (!formulirId || !queryClient) return
  await queryClient.invalidateQueries({ queryKey: ['formulirs', formulirId, 'input-items'] })
}

export async function createAttachment(payload) {
  if (!payload) throw new Error('payload is required to create attachment')
  const res = await api.post('/attachments', payload)
  return unwrapApiPayload(res) ?? {}
}

export async function listAttachments(params = {}) {
  const res = await api.get('/attachments', { params })
  const payload = unwrapApiPayload(res) ?? {}
  return { attachments: ensureArray(payload.attachments ?? payload.items ?? []), pagination: mergePagination(payload.pagination) }
}

export async function uploadAttachment(file, payload = {}) {
  if (!file) throw new Error('file is required to upload attachment')
  const formData = new FormData()
  formData.append('file', file)
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    formData.append(key, String(value))
  })
  const res = await api.post('/attachments', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  return unwrapApiPayload(res) ?? {}
}

export default {
  listFormulirs,
  getFormulir,
  getFormulirLabels,
  getFormulirInputItems,
  attachFormulirLabel,
  detachFormulirLabel,
  createFormulir,
  updateFormulir,
  uploadInputItemAttachment,
  deleteFormulir,
  publishFormulir,
  approveFormulir,
  requestChanges,
  closeFormulir,
  reopenFormulir,
  restoreFormulir,
  freezeFormulir,
  unfreezeFormulir,
  getFormulirTimeline,
  getFormulirReviews,
  createFormulirReview,
  updateFormulirReview,
  deleteFormulirReview,
  replyToComment,
  uploadCommentAttachment,
  getAttachment,
  getAttachmentDownloadInfo,
  getAttachmentDownloadUrl,
  downloadAttachment,
  getFormulirVersions,
  getFormulirVersion,
  revertFormulirVersion,
  refreshFormulirInputItems,
  createAttachment,
  listAttachments,
  uploadAttachment,
  createInputItem,
  updateInputItem,
}
