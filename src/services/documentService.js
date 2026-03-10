import api, { getAccessToken } from './api'

const DEFAULT_PAGINATION = {
  current_page: 1,
  per_page: 15,
  total: 0,
  last_page: 1,
  from: null,
  to: null,
}

const ensureArray = (value) => (Array.isArray(value) ? value : value ? [value] : [])

const apiBaseEnv = (import.meta.env.VITE_API_BASE_URL || '').trim()
const API_BASE = apiBaseEnv || '/api/v1'

const resolveApiBaseUrl = () => {
  if (API_BASE.startsWith('http://') || API_BASE.startsWith('https://')) return API_BASE
  if (typeof window === 'undefined') return API_BASE
  const normalized = API_BASE.startsWith('/') ? API_BASE : `/${API_BASE}`
  return `${window.location.origin}${normalized}`
}

const unwrap = (response) => response?.data?.data ?? response?.data ?? null

const extractDocumentName = (doc) => {
  if (!doc) return null
  return (
    doc.display_name ||
    doc.original_filename ||
    doc.original_name ||
    doc.original_file ||
    doc.originalName ||
    doc.filename ||
    doc.name ||
    doc.file_name ||
    doc.title ||
    null
  )
}

export async function listDocuments(params = {}) {
  const res = await api.get('/documents', { params })
  const payload = unwrap(res) ?? {}
  const documents = ensureArray(payload.documents ?? payload.items ?? [])
  
  // Transform documents untuk memastikan kita punya original_filename
  const transformedDocuments = documents.map((doc) => ({
    ...doc,
    // Tambahkan field display_name dengan prioritas yang benar
    display_name: extractDocumentName(doc) || 'Lampiran',
  }))
  
  return {
    documents: transformedDocuments,
    pagination: { ...DEFAULT_PAGINATION, ...(payload.pagination ?? {}) },
  }
}

export async function getDocument(documentId) {
  if (!documentId) throw new Error('documentId is required')
  const res = await api.get(`/documents/${documentId}`)
  return unwrap(res) ?? {}
}

export async function uploadDocument(file, payload = {}) {
  if (!file) throw new Error('file is required to upload document')

  const formData = new FormData()
  formData.append('file', file)
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    formData.append(key, String(value))
  })

  const res = await api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return unwrap(res) ?? {}
}

export const getDocumentDownloadUrl = (documentId) => {
  if (!documentId) throw new Error('documentId is required')
  return `${resolveApiBaseUrl()}/documents/${documentId}/download`
}

/**
 * Mendapatkan informasi download dokumen dengan fallback ke beberapa endpoint
 */
export async function getDocumentDownloadInfo(documentId, options = {}) {
  if (!documentId) throw new Error('documentId is required')
  const { suppressNotFound = true } = options
  try {
    const res = await api.get(`/documents/${documentId}/download-info`)
    const data = unwrap(res) ?? {}
    return data
  } catch (err) {
    const status = err?.response?.status ?? err?.status
    const message = `${err?.message || ''}`.toLowerCase()
    const statusText = `${err?.response?.statusText || ''}`.toLowerCase()
    const isNotFound = status === 404 || statusText.includes('not found') || message.includes('404')
    if (isNotFound) {
      try {
        const res = await api.get(`/attachments/${documentId}/download-info`)
        const data = unwrap(res) ?? {}
        return {
          document: data?.attachment || data?.document || null,
          download_url: data?.download_url,
        }
      } catch (attachmentErr) {
        if (suppressNotFound) return null
        throw attachmentErr
      }
    }
    if (suppressNotFound) return null
    throw err
  }
}

/**
 * Mendapatkan URL signature dengan authentication token
 */
export const getSignatureUrl = (signaturePath) => {
  if (!signaturePath) return null
  
  const token = getAccessToken()
  const baseUrl = resolveApiBaseUrl().replace('/api/v1', '')
  
  // Pastikan path dimulai dengan /
  const normalizedPath = signaturePath.startsWith('/') ? signaturePath : `/${signaturePath}`
  const fullUrl = `${baseUrl}${normalizedPath}`
  
  // Tambahkan token ke URL jika ada
  if (token) {
    const separator = fullUrl.includes('?') ? '&' : '?'
    return `${fullUrl}${separator}token=${token}`
  }
  
  return fullUrl
}

/**
 * Memuat signature sebagai blob URL dengan authentication
 */
export async function loadSignatureAsBlobUrl(signaturePath) {
  if (!signaturePath) return null
  
  try {
    const token = getAccessToken()
    const baseUrl = resolveApiBaseUrl().replace('/api/v1', '')
    const normalizedPath = signaturePath.startsWith('/') ? signaturePath : `/${signaturePath}`
    const fullUrl = `${baseUrl}${normalizedPath}`
    
    const response = await fetch(fullUrl, {
      headers: token ? {
        'Authorization': `Bearer ${token}`
      } : {}
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error('Error loading signature:', error)
    return null
  }
}

export async function downloadDocument(documentId, filename, onProgress = null) {
  if (!documentId) throw new Error('documentId is required')
  
  const token = getAccessToken()
  if (!token) throw new Error('No access token available')
  
  let finalFilename = filename
  let mimeType = null
  
  // STEP 1: Coba dapatkan informasi dokumen (opsional)
  try {
    const docInfo = await getDocument(documentId).catch(() => null)
    if (docInfo) {
      finalFilename = extractDocumentName(docInfo) || finalFilename
      mimeType = docInfo.mime_type || docInfo.mimeType
    }
  } catch (err) {
    // Abaikan error, lanjut dengan filename yang diberikan
  }
  
  const downloadUrl = getDocumentDownloadUrl(documentId)
  
  // STEP 2: Download file
  const response = await fetch(downloadUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': '*/*',
    },
  })

  if (!response.ok) {
    if (response.status === 401) throw new Error('Sesi telah berakhir. Silakan login kembali.')
    if (response.status === 403) throw new Error('Anda tidak memiliki izin untuk mengunduh dokumen ini.')
    if (response.status === 404) throw new Error('Dokumen tidak ditemukan.')
    throw new Error(`Download gagal: ${response.status}`)
  }

  // Dapatkan filename dari Content-Disposition jika ada
  const contentDisposition = response.headers.get('Content-Disposition')
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
    if (filenameMatch && filenameMatch[1]) {
      const extractedFilename = filenameMatch[1].replace(/['"]/g, '')
      finalFilename = extractedFilename
    }
  }
  
  // Gunakan MIME type dari response atau dari info dokumen
  const responseContentType = response.headers.get('Content-Type')
  const blob = await response.blob()
  
  // Tentukan tipe file berdasarkan ekstensi filename
  let finalBlob = blob
  const fileExtension = finalFilename.split('.').pop()?.toLowerCase()
  
  // Map ekstensi ke MIME type
  const mimeTypes = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'txt': 'text/plain',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
  }
  
  // Perbaiki MIME type jika diperlukan
  const targetMimeType = mimeType || mimeTypes[fileExtension] || responseContentType
  if (targetMimeType && (blob.type === 'text/plain' || blob.type === 'application/octet-stream' || blob.type !== targetMimeType)) {
    finalBlob = new Blob([await blob.arrayBuffer()], { type: targetMimeType })
  }
  
  return { blob: finalBlob, filename: finalFilename }
}

export default {
  listDocuments,
  getDocument,
  getDocumentDownloadUrl,
  getDocumentDownloadInfo,
  uploadDocument,
  downloadDocument,
  getSignatureUrl,
  loadSignatureAsBlobUrl,
}