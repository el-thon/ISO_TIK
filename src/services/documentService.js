import api, { getAccessToken } from './api' // Import getAccessToken

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

export async function listDocuments(params = {}) {
  const res = await api.get('/documents', { params })
  const payload = unwrap(res) ?? {}
  return {
    documents: ensureArray(payload.documents ?? payload.items ?? []),
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

// FUNGSI BARU: Download dengan token dari API instance
export async function downloadDocument(documentId, filename, onProgress = null) {
  if (!documentId) throw new Error('documentId is required')
  
  const token = getAccessToken()
  if (!token) throw new Error('No access token available')
  
  const downloadUrl = getDocumentDownloadUrl(documentId)
  
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
  let downloadFilename = filename
  
  if (contentDisposition) {
    // Regex yang lebih baik untuk menangkap filename
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
    if (filenameMatch && filenameMatch[1]) {
      downloadFilename = filenameMatch[1].replace(/['"]/g, '')
    }
  }
  
  // Dapatkan tipe konten dari response
  const contentType = response.headers.get('Content-Type')
  console.log('Content-Type:', contentType) // Untuk debugging
  
  // Baca response sebagai blob
  const blob = await response.blob()
  
  // Tentukan tipe file berdasarkan ekstensi filename jika blob type tidak sesuai
  let finalBlob = blob
  const fileExtension = downloadFilename.split('.').pop()?.toLowerCase()
  
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
  
  // Jika blob type adalah 'text/plain' atau 'application/octet-stream' tapi seharusnya bukan
  if ((blob.type === 'text/plain' || blob.type === 'application/octet-stream') && fileExtension && mimeTypes[fileExtension]) {
    // Buat blob baru dengan tipe yang benar
    finalBlob = new Blob([await blob.arrayBuffer()], { type: mimeTypes[fileExtension] })
  }
  
  // Untuk PDF, pastikan tipe-nya benar
  if (fileExtension === 'pdf' && finalBlob.type !== 'application/pdf') {
    finalBlob = new Blob([await finalBlob.arrayBuffer()], { type: 'application/pdf' })
  }
  
  return { blob: finalBlob, filename: downloadFilename }
}

export default {
  listDocuments,
  getDocument,
  getDocumentDownloadUrl,
  uploadDocument,
  downloadDocument,
}