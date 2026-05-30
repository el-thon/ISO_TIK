import api from './api'

const DEFAULT_PAGINATION = {
  current_page: 1,
  per_page: 15,
  total: 0,
  last_page: 1,
  from: null,
  to: null,
}

const ensureArray = (value) => (Array.isArray(value) ? value : value ? [value] : [])

const unwrap = (response) => response?.data?.data ?? response?.data ?? null

export async function listForumAttachments(forumId, params = {}) {
  if (!forumId) throw new Error('forumId is required')
  const res = await api.get(`/forums/${forumId}/attachments`, { params })
  const payload = unwrap(res) ?? {}
  return {
    attachments: ensureArray(payload.attachments ?? payload.items ?? []),
    pagination: { ...DEFAULT_PAGINATION, ...(payload.pagination ?? {}) },
  }
}

export async function uploadForumAttachment(forumId, file) {
  if (!forumId) throw new Error('forumId is required')
  if (!file) throw new Error('file is required to upload attachment')

  const formData = new FormData()
  formData.append('file', file)

  const res = await api.post(`/forums/${forumId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return unwrap(res) ?? {}
}

export default {
  listForumAttachments,
  uploadForumAttachment,
}
