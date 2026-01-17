import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Home,
  ArrowLeft,
  FileText,
  Link as LinkIcon,
  Send,
  CheckCircle2,
  MessageSquareWarning,
  MessageSquare,
  Lock,
  Unlock,
  Snowflake,
  History,
  Undo2,
  Loader2,
  X as XIcon,
  Image as ImageIcon,
  ListChecks,
  Paperclip,
  ExternalLink,
  Eye,
  Download,
  File,
  AlertCircle,
} from 'lucide-react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  useTopic,
  usePublishTopic,
  useApproveTopic,
  useRequestTopicChanges,
  useCloseTopic,
  useReopenTopic,
  useFreezeTopic,
  useUnfreezeTopic,
  useTopicVersions,
  useRevertTopicVersion,
  useTopicReviews,
  useCreateTopicReview,
  useReplyComment,
  useTopicInputItems,
} from '@/services/topicHooks'
import { useMe } from '@/services/authHooks'
import { useQuill } from 'react-quilljs'
import 'quill/dist/quill.snow.css'

// Config untuk storage base URL
const getStorageBaseUrl = () => {
  const rawApiBase = (import.meta.env.VITE_API_BASE_URL || '').trim()
  const apiOrigin = rawApiBase ? rawApiBase.replace(/\/api\/?.*$/, '') : ''
  const proxyTarget = (import.meta.env.VITE_PROXY_TARGET || '').trim()
  const explicitStorageBase = (import.meta.env.VITE_STORAGE_BASE_URL || '').trim()
  const runtimeFallback = typeof window !== 'undefined' ? window.location.origin : ''
  return (explicitStorageBase || apiOrigin || proxyTarget || (import.meta.env.DEV ? 'http://localhost:8000' : runtimeFallback)).replace(/\/$/, '')
}

const formatDate = (value, withTime = false) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

const formatBytes = (bytes) => {
  if (!bytes || Number.isNaN(Number(bytes))) return null
  const units = ['B', 'KB', 'MB', 'GB']
  let size = Number(bytes)
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  return `${size % 1 === 0 ? size : size.toFixed(1)} ${units[unitIndex]}`
}

const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('')
}

const statusBadgeClass = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'approved':
      return 'bg-emerald-50 text-emerald-700'
    case 'in_review':
    case 'in review':
      return 'bg-amber-50 text-amber-700'
    case 'changes_requested':
    case 'changes requested':
      return 'bg-rose-50 text-rose-700'
    case 'closed':
      return 'bg-slate-200 text-slate-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

const isLikelyTopicId = (value) => {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (!trimmed) return false

  // Reject obvious filenames with extension
  if (trimmed.includes('.')) return false

  // Numeric IDs
  if (/^\d{1,30}$/.test(trimmed)) return true

  // UUID / hex-ish IDs (allow dashes), including Mongo 24-char hex
  if (/^[0-9a-fA-F-]{16,64}$/.test(trimmed)) return true

  // Slug / alphanumeric with underscore or dash (no dots)
  if (/^[a-zA-Z0-9_-]{6,64}$/.test(trimmed)) return true

  return false
}

const typeIcon = (type) => {
  switch (type) {
    case 'file':
      return <Paperclip className="w-4 h-4 text-slate-500" />
    case 'image':
      return <ImageIcon className="w-4 h-4 text-slate-500" />
    case 'link':
      return <LinkIcon className="w-4 h-4 text-slate-500" />
    case 'rich_text':
      return <FileText className="w-4 h-4 text-slate-500" />
    case 'form_data':
      return <ListChecks className="w-4 h-4 text-slate-500" />
    case 'text':
      return <FileText className="w-4 h-4 text-slate-500" />
    default:
      return <FileText className="w-4 h-4 text-slate-500" />
  }
}

// Helper untuk mendapatkan URL/file info
const extractFromObject = (obj, fields) => {
  if (!obj || typeof obj !== 'object') return null
  for (const field of fields) {
    const val = obj[field]
    if (typeof val === 'string' && val.trim() !== '') return val
  }
  return null
}

const normalizeUrl = (url) => {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null

  // URL sudah absolute (http/https)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed

  const STORAGE_BASE = getStorageBaseUrl()
  
  // Path relatif yang dimulai dengan /
  if (trimmed.startsWith('/')) {
    // FIX: Backend return /attachments/ tapi file ada di /storage/attachments/
    // Karena Laravel storage:link membuat public/storage -> storage/app/public
    if (trimmed.startsWith('/attachments/')) {
      return `${STORAGE_BASE}/storage${trimmed}`
    }
    return `${STORAGE_BASE}${trimmed}`
  }

  // Path tanpa / di depan
  if (trimmed.startsWith('attachments/')) {
    // Fix untuk attachments/ tanpa slash
    return `${STORAGE_BASE}/storage/${trimmed}`
  }
  
  if (trimmed.startsWith('storage/') || trimmed.startsWith('files/') || trimmed.startsWith('uploads/')) {
    return `${STORAGE_BASE}/${trimmed}`
  }

  // Relative path dengan ./
  if (trimmed.startsWith('./')) {
    return `${STORAGE_BASE}/${trimmed.slice(2)}`
  }
  
  // Relative path dengan ../
  if (trimmed.startsWith('../')) {
    return `${STORAGE_BASE}/${trimmed.replace(/^\.\.\//, '')}`
  }

  // Default: anggap relative path, prepend base URL
  return `${STORAGE_BASE}/${trimmed}`
}

// Helper untuk mendapatkan URL file dari berbagai kemungkinan field
const getFileUrl = (metadata, value, item) => {
  const urlFromMeta = normalizeUrl(
    extractFromObject(metadata, [
      'url',
      'path',
      'link',
      'download_url',
      'file_url',
      'file',
      'attachment',
      'file_path',
      'filepath',
    ])
  )
  if (urlFromMeta) return urlFromMeta

  if (typeof value === 'string') return normalizeUrl(value)

  if (value && typeof value === 'object') {
    const urlFromValue = normalizeUrl(
      extractFromObject(value, [
        'url',
        'path',
        'link',
        'download_url',
        'file_url',
        'file',
        'attachment',
        'file_path',
        'filepath',
      ])
    )
    if (urlFromValue) return urlFromValue

    // Attachments fallback
    const attachments = item?.attachments || value.attachments || []
    if (attachments.length) {
      const primary = attachments[0]
      const attachmentUrl = normalizeUrl(primary?.url || primary?.path || primary?.file || primary?.file_url)
      if (attachmentUrl) return attachmentUrl
    }
  }

  return null
}

const getPreviewUrl = (metadata, value, fileUrl, item) => {
  const previewFromMeta = normalizeUrl(
    extractFromObject(metadata, [
      'preview_url',
      'thumbnail_url',
      'image_url',
      'preview',
      'thumbnail',
      'signed_preview_url',
      'file_path',
      'filepath',
    ])
  )
  if (previewFromMeta) return previewFromMeta

  if (value && typeof value === 'object') {
    const previewFromValue = normalizeUrl(
      extractFromObject(value, [
        'preview_url',
        'thumbnail_url',
        'image_url',
        'preview',
        'thumbnail',
        'signed_preview_url',
        'file_path',
        'filepath',
      ])
    )
    if (previewFromValue) return previewFromValue
  }

  // Attachments fallback (thumbnail/preview)
  const attachments = item?.attachments || []
  if (attachments.length) {
    const primary = attachments[0]
    const previewFromAttachment = normalizeUrl(
      primary?.preview_url || primary?.thumbnail_url || primary?.image_url
    )
    if (previewFromAttachment) return previewFromAttachment
  }

  return fileUrl
}

// Helper untuk mendapatkan nama file
const getFileName = (metadata, value, item) => {
  const nameFromMeta = extractFromObject(metadata, [
    'name',
    'filename',
    'original_name',
    'original_filename',
    'file_name',
    'client_name',
  ])
  if (nameFromMeta) return nameFromMeta

  if (value && typeof value === 'object') {
    const nameFromValue = extractFromObject(value, [
      'name',
      'filename',
      'original_name',
      'original_filename',
      'file_name',
      'client_name',
    ])
    if (nameFromValue) return nameFromValue

    const attachments = item?.attachments || []
    if (attachments.length) {
      const primary = attachments[0]
      const attachmentName =
        primary?.original_name ||
        primary?.client_name ||
        primary?.filename ||
        primary?.file_name ||
        primary?.name
      if (attachmentName) return attachmentName
    }
  }

  // Derive from URL path as a last resort
  const url = getFileUrl(metadata, value, item)
  if (url) {
    try {
      const urlObj = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
      const pathname = urlObj.pathname || ''
      const lastSegment = pathname.split('/').filter(Boolean).pop()
      if (lastSegment) return decodeURIComponent(lastSegment)
    } catch (e) {
      const parts = url.split('?')[0].split('/')
      const lastSegment = parts.filter(Boolean).pop()
      if (lastSegment) return decodeURIComponent(lastSegment)
    }
  }

  return typeof value === 'string' && value.trim() ? value : 'File'
}

const renderInputItemContent = (item) => {
  const metadata = item?.metadata ?? {}
  const value = item?.value ?? ''
  const type = item?.type || 'text'

  switch (type) {
    case 'link':
      if (!value) {
        return (
          <div className="mt-3 p-4 border border-dashed rounded-md text-center">
            <div className="text-sm text-muted-foreground">Link tidak tersedia</div>
          </div>
        )
      }
      
      // Validasi URL sebelum render
  const isValidUrl = value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')
      
      return (
        <div className="mt-3">
          {isValidUrl ? (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-slate-50 text-blue-600"
            >
              <LinkIcon className="h-4 w-4" />
              <span className="truncate max-w-md">{value}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <div className="px-4 py-2 border rounded-md bg-slate-50">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-700">{value}</span>
                <AlertCircle className="h-4 w-4 text-amber-500" title="URL tidak valid untuk link langsung" />
              </div>
              <div className="text-xs text-muted-foreground mt-1">Buka di browser: {value}</div>
            </div>
          )}
        </div>
      )

    case 'rich_text':
      if (!value) {
        return (
          <div className="mt-3 p-4 border border-dashed rounded-md text-center">
            <div className="text-sm text-muted-foreground">Konten rich text kosong</div>
          </div>
        )
      }
      
      // Sanitize HTML untuk keamanan
      const sanitizedHtml = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/g, '')
        .replace(/on\w+='[^']*'/g, '')
        .replace(/javascript:/gi, '')
      
      return (
        <div className="mt-3 p-3 border rounded-md bg-slate-50">
          <div 
            className="prose prose-sm max-w-none text-slate-700" 
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }} 
          />
        </div>
      )

    case 'text':
      if (!value) {
        return (
          <div className="mt-3 p-4 border border-dashed rounded-md text-center">
            <div className="text-sm text-muted-foreground">Teks kosong</div>
          </div>
        )
      }
      return (
        <div className="mt-3 p-3 border rounded-md bg-slate-50">
          <p className="text-sm text-slate-700 whitespace-pre-line">{value}</p>
        </div>
      )

    case 'form_data': {
      const fields = Array.isArray(metadata?.fields) ? metadata.fields : []
      if (!fields.length) {
        return (
          <div className="mt-3 p-4 border border-dashed rounded-md text-center">
            <div className="text-sm text-muted-foreground">Tidak ada data form yang tersimpan</div>
          </div>
        )
      }
      return (
        <div className="mt-3 border rounded-md divide-y">
          {fields.map((field, index) => (
            <div key={field.id || field.name || `field-${index}`} className="px-4 py-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-slate-700">{field.name || `Field ${index + 1}`}</div>
                <div className="text-xs text-muted-foreground mt-1">Field</div>
              </div>
              <div className="text-slate-700 whitespace-pre-line break-words">
                {field.value || <span className="text-muted-foreground">-</span>}
              </div>
            </div>
          ))}
        </div>
      )
    }

    case 'image': {
      const fileName = getFileName(metadata, value, item)
      const fileUrl = getFileUrl(metadata, value, item)
      const previewUrl = getPreviewUrl(metadata, value, fileUrl, item)
      const fileSize = formatBytes(metadata.size || metadata.size_bytes || (value && value.size))
      const mimeType = metadata.type || metadata.mime_type || 'image/*'
      const displayUrl = previewUrl || fileUrl

      // Cek apakah URL valid untuk gambar
      const isValidImageUrl = displayUrl && (
        displayUrl.startsWith('http://') ||
        displayUrl.startsWith('https://') ||
        displayUrl.startsWith('/') ||
        displayUrl.startsWith('data:image/')
      )

      return (
        <div className="mt-3 space-y-3">
          {/* Informasi file */}
          <div className="flex items-center justify-between p-3 border rounded-md">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-sm font-medium text-slate-700">{fileName}</div>
                <div className="text-xs text-muted-foreground">
                  {mimeType}
                  {fileSize && ` • ${fileSize}`}
                </div>
              </div>
            </div>
            
            {fileUrl ? (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 inline-flex items-center gap-1"
              >
                <Download className="h-3 w-3" /> Buka Gambar
              </a>
            ) : (
              <span className="text-xs px-3 py-1 bg-slate-100 text-slate-700 rounded-md">
                No URL
              </span>
            )}
          </div>

          {/* Preview jika ada URL yang valid */}
          {isValidImageUrl ? (
            <div className="border rounded-md overflow-hidden">
              <div className="p-3 border-b bg-slate-50 text-xs text-muted-foreground flex items-center justify-between">
                <span>Preview</span>
                <span className="flex items-center gap-2">
                  <Eye className="h-3 w-3" />
                  {fileSize && <span>{fileSize}</span>}
                </span>
              </div>
              <div className="p-4 flex justify-center bg-slate-50">
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt={fileName}
                    className="max-h-64 max-w-full rounded border object-contain"
                    onError={(e) => {
                      // Fallback jika gambar gagal load
                      e.target.style.display = 'none'
                      const parent = e.target.parentElement
                      parent.innerHTML = `
                        <div class="p-8 text-center border border-dashed rounded">
                          <ImageIcon class="h-12 w-12 mx-auto text-slate-300 mb-2" />
                          <div class="text-sm text-muted-foreground">Gambar tidak dapat ditampilkan</div>
                          ${fileUrl ? `
                            <a href="${fileUrl}" class="mt-2 text-xs text-blue-600 hover:underline inline-flex items-center gap-1" target="_blank">
                              <ExternalLink class="h-3 w-3" /> Coba buka file
                            </a>
                          ` : ''}
                        </div>
                      `
                    }}
                  />
                </div>
              </div>
            </div>
          ) : fileUrl && !isValidImageUrl ? (
            // URL ada tapi tidak valid untuk preview
            <div className="p-4 border border-dashed rounded-md text-center">
              <ImageIcon className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              <div className="text-sm text-muted-foreground">Preview tidak tersedia</div>
              {fileUrl && (
                <div className="mt-2">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" /> Coba buka file
                  </a>
                </div>
              )}
            </div>
          ) : (
            // Tidak ada URL sama sekali
            <div className="p-4 border border-dashed rounded-md text-center">
              <ImageIcon className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              <div className="text-sm text-muted-foreground">File telah diupload</div>
              {fileSize && <div className="text-xs text-muted-foreground mt-1">Size: {fileSize}</div>}
              <div className="text-xs text-muted-foreground mt-1">(URL preview belum tersedia)</div>
            </div>
          )}
        </div>
      )
    }

    case 'file': {
      const fileName = getFileName(metadata, value, item)
      const fileUrl = getFileUrl(metadata, value, item)
      const fileSize = formatBytes(metadata.size || metadata.size_bytes || (value && value.size))
      const mimeType = metadata.type || metadata.mime_type || 'application/octet-stream'
      
      // Debug log untuk melihat URL yang dihasilkan
      console.log('🔍 [FILE DEBUG]', {
        fileName,
        fileUrl,
        metadata,
        STORAGE_BASE: getStorageBaseUrl(),
      })
      
      // Cek apakah URL valid (harus http/https setelah normalize)
      const isValidUrl = fileUrl && (
        fileUrl.startsWith('http://') || 
        fileUrl.startsWith('https://')
      )

      return (
        <div className="mt-3">
          <div className="flex items-center justify-between p-4 border rounded-md hover:bg-slate-50">
            <div className="flex items-center gap-3">
              <File className="h-5 w-5 text-slate-500" />
              <div>
                <div className="text-sm font-medium text-slate-700">{fileName}</div>
                <div className="text-xs text-muted-foreground">
                  {mimeType}
                  {fileSize && ` • ${fileSize}`}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isValidUrl ? (
                <>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 inline-flex items-center gap-1"
                  >
                    <Eye className="h-3 w-3" /> View
                  </a>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={fileName}
                    className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 inline-flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" /> Download
                  </a>
                </>
              ) : (
                <div className="text-xs px-3 py-1 bg-slate-100 text-slate-700 rounded-md flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>No URL</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    default:
      return (
        <div className="mt-3 p-4 border border-dashed rounded-md text-center">
          <div className="text-sm text-muted-foreground">Tipe konten tidak dikenali: {type}</div>
          {value && (
            <div className="mt-2 text-xs text-slate-600">
              <div className="font-medium">Isi:</div>
              <code className="block mt-1 p-2 bg-slate-50 rounded border overflow-x-auto">
                {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
              </code>
            </div>
          )}
        </div>
      )
  }
}

const ACTION_METADATA = {
  publish: {
    title: 'Publikasikan Topik',
    description: 'Kirim topik ke reviewer. Status berubah dari Draft menjadi In Review.',
    confirmLabel: 'Ajukan Review',
  },
  approve: {
    title: 'Setujui Topik',
    description: 'Tandai topik sebagai Approved dan kabari pembuat.',
    confirmLabel: 'Setujui',
    noteLabel: 'Catatan untuk pembuat (opsional)',
    notePlaceholder: 'Opsional: masukkan catatan singkat untuk pembuat topik.',
  },
  request_changes: {
    title: 'Minta Perubahan',
    description: 'Kembalikan topik ke pembuat dengan detail revisi yang dibutuhkan.',
    confirmLabel: 'Kirim Permintaan',
    noteLabel: 'Detail permintaan perubahan',
    notePlaceholder: 'Jelaskan revisi yang harus dilakukan secara spesifik.',
    noteRequired: true,
  },
  close: {
    title: 'Tutup Topik',
    description: 'Kunci topik yang sudah approved agar tidak bisa diedit lagi.',
    confirmLabel: 'Tutup Topik',
    noteLabel: 'Alasan penutupan (opsional)',
    notePlaceholder: 'Opsional: catat alasan topik ditutup.',
  },
  reopen: {
    title: 'Buka Kembali Topik',
    description: 'Reopen topik yang sudah ditutup agar bisa direview ulang.',
    confirmLabel: 'Buka Kembali',
    noteLabel: 'Alasan pembukaan kembali (opsional)',
    notePlaceholder: 'Opsional: jelaskan kenapa topik perlu dibuka kembali.',
  },
  freeze: {
    title: 'Bekukan Topik',
    description: 'Bekukan topik untuk mencegah perubahan sementara.',
    confirmLabel: 'Bekukan',
    noteLabel: 'Alasan pembekuan (opsional)',
    notePlaceholder: 'Opsional: catat alasan topik dibekukan.',
  },
  unfreeze: {
    title: 'Lepaskan Pembekuan',
    description: 'Aktifkan kembali topik yang sedang dibekukan.',
    confirmLabel: 'Lepaskan',
    noteLabel: 'Catatan (opsional)',
    notePlaceholder: 'Opsional: catat alasan topik diaktifkan kembali.',
  },
}

export default function TopicDetail() {
  const { id: paramTopicId } = useParams()
  const isValidTopicId = useMemo(() => isLikelyTopicId(paramTopicId), [paramTopicId])

  const { data: topic, isLoading, isError, error, refetch } = useTopic(paramTopicId, { 
    enabled: isValidTopicId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
  const {
    data: inputItemsData,
    isLoading: inputItemsLoading,
    isError: inputItemsError,
    error: inputItemsErrorObj,
    refetch: refetchInputItems,
  } = useTopicInputItems(paramTopicId, {}, { 
    enabled: isValidTopicId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
  const { data: meData } = useMe()
  const currentUser = meData?.data?.user

  const [activeAction, setActiveAction] = useState(null)
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState(null)
  const [workflowNotice, setWorkflowNotice] = useState(null)
  const [reviewText, setReviewText] = useState('')
  const [reviewHtml, setReviewHtml] = useState('')
  const { quill, quillRef } = useQuill({
    theme: 'snow',
    placeholder: 'Berikan masukan, temuan, atau keputusan singkat.',
  })
  const [reviewError, setReviewError] = useState(null)
  const [reviewNotice, setReviewNotice] = useState(null)
  const [activeReplyId, setActiveReplyId] = useState(null)
  const [replyDrafts, setReplyDrafts] = useState({})

  const buildErrorMessage = (err) => err?.response?.data?.message || err?.message || 'Terjadi kesalahan saat menjalankan aksi.'

  const closeDialog = () => {
    setActiveAction(null)
    setNote('')
    setNoteError(null)
  }

  const handleSuccess = (message) => {
    setWorkflowNotice({ type: 'success', text: message })
    closeDialog()
  }

  const handleError = (err) => {
    setWorkflowNotice({ type: 'error', text: buildErrorMessage(err) })
  }

  const versionsParams = useMemo(() => ({ page: 1, per_page: 5 }), [])
  const {
    data: versionsData,
    isLoading: versionsLoading,
    isError: versionsError,
    error: versionsErrorObj,
    refetch: refetchVersions,
  } = useTopicVersions(paramTopicId, versionsParams, { 
    enabled: isValidTopicId,
    refetchOnMount: true,
  })
  const revertVersionMutation = useRevertTopicVersion({
    onSuccess: () => handleSuccess('Versi topik berhasil dipulihkan.'),
    onError: handleError,
  })
  const reviewsParams = useMemo(() => ({ page: 1, per_page: 10 }), [])
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    isError: reviewsError,
    error: reviewsErrorObj,
    refetch: refetchReviews,
  } = useTopicReviews(paramTopicId, reviewsParams, { 
    enabled: isValidTopicId,
    refetchOnMount: true,
  })
  const createReviewMutation = useCreateTopicReview({
    onSuccess: () => {
      setReviewText('')
      setReviewNotice({ type: 'success', text: 'Tinjauan berhasil dikirim.' })
      setReviewError(null)
    },
    onError: (err) => {
      setReviewNotice({ type: 'error', text: buildErrorMessage(err) })
    },
  })

  const replyCommentMutation = useReplyComment({
    onSuccess: () => {
      if (activeReplyId) {
        setReplyDrafts((prev) => ({ ...prev, [activeReplyId]: '' }))
      }
      setActiveReplyId(null)
    },
    onError: (err) => {
      setReviewNotice({ type: 'error', text: buildErrorMessage(err) })
    },
  })

  const topicId = topic?.id || paramTopicId
  const versions = versionsData?.versions ?? []
  const versionsErrorMessage = versionsErrorObj?.response?.data?.message || versionsErrorObj?.message || 'Gagal memuat riwayat versi.'
  const reviews = reviewsData?.reviews ?? []
  const reviewsErrorMessage = reviewsErrorObj?.response?.data?.message || reviewsErrorObj?.message || 'Gagal memuat tinjauan.'
  const inputItems = useMemo(() => {
    // Prioritas: 1) inputItemsData dari endpoint dedicated, 2) fallback kosong
    // TIDAK fallback ke topic.input_items karena bisa berisi cache lama
    const rawItems = inputItemsData?.items ?? []
    
    return rawItems.map((item, index) => ({
      ...item,
      id: item.id || `${item.type}-${index}`,
      metadata: item?.metadata || {},
      order_index: item?.order_index || item?.order || index + 1,
      label: item?.label || item?.title || `${item.type} ${index + 1}`,
      type: item?.type || 'text',
      value: item?.value || '',
      visibility: item?.visibility || 'visible',
    }))
  }, [inputItemsData, topic])
  const inputItemsErrorMessage = inputItemsErrorObj?.response?.data?.message || inputItemsErrorObj?.message || 'Gagal memuat konten topik.'

  const publishMutation = usePublishTopic({
    onSuccess: () => handleSuccess('Topik berhasil diajukan untuk review.'),
    onError: handleError,
  })
  const approveMutation = useApproveTopic({
    onSuccess: () => handleSuccess('Topik disetujui.'),
    onError: handleError,
  })
  const requestChangesMutation = useRequestTopicChanges({
    onSuccess: () => handleSuccess('Permintaan perubahan berhasil dikirim.'),
    onError: handleError,
  })
  const closeTopicMutation = useCloseTopic({
    onSuccess: () => handleSuccess('Topik berhasil ditutup.'),
    onError: handleError,
  })
  const reopenTopicMutation = useReopenTopic({
    onSuccess: () => handleSuccess('Topik berhasil dibuka kembali.'),
    onError: handleError,
  })
  const freezeTopicMutation = useFreezeTopic({
    onSuccess: () => handleSuccess('Topik berhasil dibekukan.'),
    onError: handleError,
  })
  const unfreezeTopicMutation = useUnfreezeTopic({
    onSuccess: () => handleSuccess('Pembekuan topik telah dilepas.'),
    onError: handleError,
  })

  if (!isValidTopicId) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-6 py-10">
          <h1 className="text-heading-3 font-semibold mb-2">Topik tidak valid</h1>
          <p className="text-sm text-muted-foreground mb-4">ID topik tampaknya tidak valid. Silakan kembali ke daftar topik.</p>
          <Link to="/topics" className="text-primary hover:underline text-sm">Kembali ke daftar topik</Link>
        </div>
      </MainLayout>
    )
  }

  const actionLoadingMap = {
    publish: publishMutation.isLoading,
    approve: approveMutation.isLoading,
    request_changes: requestChangesMutation.isLoading,
    close: closeTopicMutation.isLoading,
    reopen: reopenTopicMutation.isLoading,
    freeze: freezeTopicMutation.isLoading,
    unfreeze: unfreezeTopicMutation.isLoading,
  }

  const openActionDialog = (actionType) => {
    setActiveAction(actionType)
    setNote('')
    setNoteError(null)
  }

  const status = (topic?.status || '').toLowerCase()
  const currentUserId = currentUser?.id
  const isCreator = Boolean(currentUserId && (topic?.created_by_user_id === currentUserId || topic?.created_by?.id === currentUserId))
  const isResponsible = Boolean(currentUserId && (topic?.room?.responsible_user_id === currentUserId || topic?.room?.responsible_user?.id === currentUserId))
  const hasContent = inputItems.length > 0
  const isFrozen = Boolean(topic?.is_frozen || topic?.frozen_at)

  const canPublish = status === 'draft' && isCreator && currentUser?.can_create_topics
  const canApprove = ['in_review', 'changes_requested'].includes(status) && currentUser?.can_approve_topics
  const canRequestChanges = status === 'in_review' && (currentUser?.can_request_changes || currentUser?.can_review_topics)
  const canClose = status === 'approved' && isResponsible
  const canReopen = status === 'closed' && isResponsible
  const canFreeze = isResponsible && !isFrozen
  const canUnfreeze = isResponsible && isFrozen

  const actionButtons = useMemo(() => {
    const actions = []
    if (canPublish) {
      actions.push({
        type: 'publish',
        label: 'Ajukan Review',
        description: 'Ubah status Draft menjadi In Review.',
        icon: Send,
        variant: 'default',
        disabled: !hasContent,
        disabledReason: !hasContent ? 'Tambahkan minimal satu konten sebelum mempublikasikan.' : null,
      })
    }
    if (canApprove) {
      actions.push({
        type: 'approve',
        label: 'Setujui Topik',
        description: 'Konfirmasi bahwa topik siap dijalankan.',
        icon: CheckCircle2,
        variant: 'default',
      })
    }
    if (canRequestChanges) {
      actions.push({
        type: 'request_changes',
        label: 'Minta Perubahan',
        description: 'Kirim revisi kembali ke pembuat.',
        icon: MessageSquareWarning,
        variant: 'destructive',
      })
    }
    if (canClose) {
      actions.push({
        type: 'close',
        label: 'Tutup Topik',
        description: 'Kunci topik yang sudah approved.',
        icon: Lock,
        variant: 'outline',
      })
    }
    if (canReopen) {
      actions.push({
        type: 'reopen',
        label: 'Buka Kembali',
        description: 'Kembalikan topik ke tahap review.',
        icon: Undo2,
        variant: 'outline',
      })
    }
    if (canFreeze) {
      actions.push({
        type: 'freeze',
        label: 'Bekukan',
        description: 'Cegah perubahan sementara.',
        icon: Snowflake,
        variant: 'outline',
      })
    }
    if (canUnfreeze) {
      actions.push({
        type: 'unfreeze',
        label: 'Lepas Beku',
        description: 'Aktifkan kembali topik.',
        icon: Unlock,
        variant: 'outline',
      })
    }
    return actions
  }, [canPublish, canApprove, canRequestChanges, canClose, canReopen, hasContent, canFreeze, canUnfreeze])

  const activeMeta = activeAction ? ACTION_METADATA[activeAction] : null

  const handleConfirmAction = () => {
    if (!activeAction || !topicId) return
    const trimmed = note.trim()
    setNoteError(null)

    switch (activeAction) {
      case 'publish':
        publishMutation.mutate({ topicId })
        break
      case 'approve':
        approveMutation.mutate({ topicId, payload: trimmed ? { comment: trimmed } : {} })
        break
      case 'request_changes':
        if (!trimmed) {
          setNoteError('Mohon isi detail perubahan yang diminta.')
          return
        }
        requestChangesMutation.mutate({ topicId, payload: { comment: trimmed } })
        break
      case 'close':
        closeTopicMutation.mutate({ topicId, payload: trimmed ? { reason: trimmed } : {} })
        break
      case 'reopen':
        reopenTopicMutation.mutate({ topicId, payload: trimmed ? { reason: trimmed } : {} })
        break
      case 'freeze':
        freezeTopicMutation.mutate({ topicId, payload: trimmed ? { reason: trimmed } : {} })
        break
      case 'unfreeze':
        unfreezeTopicMutation.mutate({ topicId, payload: trimmed ? { reason: trimmed } : {} })
        break
      default:
        break
    }
  }

  const handleRevertVersion = (versionId) => {
    if (!versionId || !topicId) return
    revertVersionMutation.mutate({ topicId, versionId })
  }

  const handleSubmitReview = () => {
    const stripped = (reviewHtml || '').replace(/<[^>]+>/g, '').trim()
    setReviewError(null)
    setReviewNotice(null)
    if (!stripped) {
      setReviewError('Mohon isi catatan tinjauan sebelum mengirim.')
      return
    }
    if (!topicId) return
    createReviewMutation.mutate({ topicId, payload: { body: reviewHtml || reviewText || stripped } })
  }

  const handleReplySubmit = (commentId) => {
    const text = (replyDrafts[commentId] || '').trim()
    if (!text) return
    replyCommentMutation.mutate({ commentId, payload: { body: text } })
  }

  useEffect(() => {
    if (!quill) return
    const handler = () => {
      setReviewHtml(quill.root.innerHTML)
      setReviewText(quill.getText())
    }
    quill.on('text-change', handler)
    return () => {
      quill.off('text-change', handler)
    }
  }, [quill])

  const isAnyWorkflowLoading = Object.values(actionLoadingMap).some(Boolean)
  const authorName =
    topic?.created_by?.profile?.full_name || topic?.created_by?.name || topic?.created_by?.username || 'Tidak diketahui'
  const roomName = topic?.room?.name || 'Tidak ada informasi'

  return (
    <MainLayout>
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="mb-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard" className="inline-flex items-center gap-2">
                    <Home className="w-4 h-4" />
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />

              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/topics">Topik</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />

              <BreadcrumbItem>
                <BreadcrumbPage>{topic?.title || 'Memuat...'}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {isLoading && <TopicDetailSkeleton />}

        {isError && (
          <div className="p-4 mb-4 border border-rose-200 bg-rose-50 rounded-md flex items-center justify-between">
            <div>
              <p className="font-medium text-rose-700">Gagal memuat topik</p>
              <p className="text-sm text-rose-600">{error?.response?.data?.message || error?.message || 'Silakan coba ulang.'}</p>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              Muat ulang
            </Button>
          </div>
        )}

        {workflowNotice && (
          <div
            className={`mb-4 flex items-start justify-between gap-4 rounded-md border p-4 ${
              workflowNotice.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            <div>
              <p className="font-medium">{workflowNotice.type === 'success' ? 'Berhasil' : 'Gagal'}</p>
              <p className="mt-1 text-sm">{workflowNotice.text}</p>
            </div>
            <button
              type="button"
              onClick={() => setWorkflowNotice(null)}
              className="text-inherit/80 transition hover:text-inherit"
              aria-label="Tutup notifikasi"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {!isLoading && topic && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1">
                      <h1 className="text-xl font-semibold text-slate-800">{topic.title}</h1>
                      <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                        <span>ID: {topic.id}</span>
                        {topic.status && (
                          <span className="inline-flex items-center gap-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                            <Lock className="h-3 w-3" />
                            {String(topic.status).replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {topic.security_level && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          {topic.security_level}
                        </span>
                      )}
                      {topic.category && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {topic.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div className="p-3 rounded-md border bg-slate-50">
                      <div className="text-xs text-muted-foreground">Pembuat</div>
                      <div className="font-medium text-slate-800">{authorName}</div>
                    </div>
                    <div className="p-3 rounded-md border bg-slate-50">
                      <div className="text-xs text-muted-foreground">Ruang</div>
                      <div className="font-medium text-slate-800">{roomName}</div>
                    </div>
                    <div className="p-3 rounded-md border bg-slate-50">
                      <div className="text-xs text-muted-foreground">Dibuat</div>
                      <div className="font-medium text-slate-800">{formatDate(topic.created_at, true)}</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-md border bg-slate-50">
                    <div className="text-xs text-muted-foreground mb-1">Deskripsi</div>
                    <div className="text-sm text-slate-800 whitespace-pre-line">
                      {topic.description || 'Tidak ada deskripsi.'}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Konten Topik</p>
                      <span className="text-xs text-muted-foreground">{inputItems.length} item</span>
                    </div>

                    {inputItemsLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 2 }).map((_, idx) => (
                          <div key={idx} className="space-y-2">
                            <Skeleton className="h-3 w-1/3" />
                            <Skeleton className="h-20 w-full" />
                          </div>
                        ))}
                      </div>
                    ) : inputItemsError ? (
                    <div className="text-sm text-rose-600 flex items-center justify-between gap-3 border border-rose-200 rounded-md p-3">
                      <span>{inputItemsErrorMessage}</span>
                      <Button variant="outline" size="sm" onClick={() => refetchInputItems()}>
                        Coba lagi
                      </Button>
                    </div>
                  ) : inputItems.length ? (
                    <div className="space-y-3">
                      {inputItems.map((item, index) => {
                        const contentNode = renderInputItemContent(item)
                        return (
                          <div key={item.id} className="border rounded-md p-4 space-y-3">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                {typeIcon(item.type)}
                                <div>
                                  <div className="text-sm font-medium">{item.label}</div>
                                  <div className="text-xs text-muted-foreground capitalize">
                                    {item.type.replace('_', ' ')}
                                    {item.visibility !== 'visible' && ` • ${item.visibility}`}
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Urutan {item.order_index}
                              </div>
                            </div>
                            
                            {contentNode}
                            
                            {process.env.NODE_ENV === 'development' && Object.keys(item.metadata).length > 0 && (
                              <details className="mt-2">
                                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-slate-700">
                                  Metadata Debug
                                </summary>
                                <pre className="mt-2 text-xs bg-slate-50 p-2 rounded border overflow-auto max-h-32">
                                  {JSON.stringify(item.metadata, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground border border-dashed rounded-md p-6 text-center">
                      Belum ada konten yang ditambahkan.
                    </div>
                  )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> Tinjauan & Komentar
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Reviewer dapat meninggalkan catatan untuk pembuat atau penanggung jawab.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reviewNotice && (
                    <div
                      className={`flex items-start justify-between gap-3 rounded-md border p-3 text-sm ${
                        reviewNotice.type === 'success'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-rose-200 bg-rose-50 text-rose-700'
                      }`}
                    >
                      <span>{reviewNotice.text}</span>
                      <button
                        type="button"
                        onClick={() => setReviewNotice(null)}
                        className="text-inherit/70 hover:text-inherit"
                        aria-label="Tutup notifikasi"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Catatan tinjauan</label>
                    <div className="border border-slate-200 rounded-md">
                      <div ref={quillRef} />
                    </div>
                    {reviewError && <p className="text-xs text-rose-600">{reviewError}</p>}
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Catatan ini akan terlihat oleh pembuat dan penanggung jawab topik.
                      </div>
                      <Button
                        size="sm"
                        onClick={handleSubmitReview}
                        disabled={createReviewMutation.isLoading || !currentUser}
                      >
                        {createReviewMutation.isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Kirim Tinjauan
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Riwayat Tinjauan</p>
                      <Button variant="outline" size="sm" onClick={() => refetchReviews()} disabled={reviewsLoading}>
                        {reviewsLoading ? 'Memuat...' : 'Segarkan'}
                      </Button>
                    </div>

                    {reviewsLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, idx) => (
                          <div key={idx} className="rounded-md border p-3 space-y-2">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-3 w-48" />
                            <Skeleton className="h-4 w-full" />
                          </div>
                        ))}
                      </div>
                    ) : reviewsError ? (
                      <div className="text-sm text-rose-600 flex items-center justify-between gap-3">
                        <span>{reviewsErrorMessage}</span>
                        <Button variant="outline" size="sm" onClick={() => refetchReviews()}>
                          Coba lagi
                        </Button>
                      </div>
                    ) : reviews.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Belum ada tinjauan.</p>
                    ) : (
                      <div className="space-y-2">
                        {reviews.map((review) => {
                          const reviewerName =
                            review.created_by?.profile?.full_name ||
                            review.created_by?.name ||
                            review.created_by?.username ||
                            review.user?.profile?.full_name ||
                            review.user?.name ||
                            review.user?.username ||
                            review.created_by_user?.full_name ||
                            review.created_by_user?.name ||
                            review.created_by_user?.username ||
                            'Tidak diketahui'
                          const reviewText =
                            review.body || review.comment || review.text || review.note || review.message || '—'
                          const isHtml = /<[^>]+>/.test(reviewText)
                          const statusEffect = review.status || review.status_effect
                          return (
                            <div key={review.id} className="rounded-md border p-3 space-y-2">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="font-medium text-slate-700">{reviewerName}</span>
                                <span>{formatDate(review.created_at, true)}</span>
                              </div>
                              {isHtml ? (
                                <div
                                  className="prose prose-sm max-w-none text-slate-700"
                                  dangerouslySetInnerHTML={{ __html: reviewText }}
                                />
                              ) : (
                                <p className="text-sm text-slate-700 whitespace-pre-line">{reviewText}</p>
                              )}
                              {statusEffect && (
                                <span className="inline-flex text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                                  {String(statusEffect).replace('_', ' ')}
                                </span>
                              )}

                              <div className="flex items-center gap-3 pt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-xs"
                                  onClick={() =>
                                    setActiveReplyId((prev) => (prev === review.id ? null : review.id))
                                  }
                                >
                                  Balas
                                </Button>
                                {replyCommentMutation.isLoading && activeReplyId === review.id && (
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                              </div>

                              {activeReplyId === review.id && (
                                <div className="space-y-2 pt-2">
                                  <textarea
                                    className="w-full rounded-md border border-slate-200 p-2 text-sm"
                                    rows={3}
                                    placeholder="Tulis balasan..."
                                    value={replyDrafts[review.id] || ''}
                                    onChange={(e) =>
                                      setReplyDrafts((prev) => ({ ...prev, [review.id]: e.target.value }))
                                    }
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setActiveReplyId(null)}
                                      type="button"
                                    >
                                      Batal
                                    </Button>
                                    <Button
                                      size="sm"
                                      disabled={replyCommentMutation.isLoading}
                                      onClick={() => handleReplySubmit(review.id)}
                                      type="button"
                                    >
                                      {replyCommentMutation.isLoading && (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      )}
                                      Kirim Balasan
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <History className="h-4 w-4" /> Riwayat Versi
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Versi terbaru ditampilkan di urutan teratas.
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetchVersions()} disabled={versionsLoading}>
                    {versionsLoading ? 'Memuat...' : 'Segarkan'}
                  </Button>
                </CardHeader>
                <CardContent>
                  {versionsLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                          <Skeleton className="h-8 w-20" />
                        </div>
                      ))}
                    </div>
                  ) : versionsError ? (
                    <div className="text-sm text-rose-600 flex items-center justify-between gap-3">
                      <span>{versionsErrorMessage}</span>
                      <Button variant="outline" size="sm" onClick={() => refetchVersions()}>
                        Coba lagi
                      </Button>
                    </div>
                  ) : versions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada versi tersimpan.</p>
                  ) : (
                    <div className="space-y-3">
                      {versions.map((version, idx) => {
                        const label = version.number ? `Versi ${version.number}` : version.name || `Versi ${idx + 1}`
                        const author =
                          version.created_by?.profile?.full_name ||
                          version.created_by?.name ||
                          version.created_by?.username ||
                          'Tidak diketahui'
                        const isCurrent = Boolean(version.is_current || version.current)
                        return (
                          <div key={version.id || idx} className="flex items-center justify-between gap-3 rounded-md border p-3">
                            <div className="space-y-1">
                              <div className="text-sm font-medium flex items-center gap-2">
                                {label}
                                {isCurrent && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Aktif</span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {author} • {formatDate(version.created_at, true)}
                              </div>
                              {version.note && <div className="text-xs text-slate-600">{version.note}</div>}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRevertVersion(version.id)}
                                disabled={isCurrent || revertVersionMutation.isLoading}
                              >
                                {revertVersionMutation.isLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Undo2 className="h-4 w-4" />
                                )}
                                <span className="ml-2">Pulihkan</span>
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <aside className="lg:col-span-4 space-y-4">
              {currentUser && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Aksi Workflow</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Sesuaikan status topik sesuai peran Anda.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {actionButtons.length ? (
                      actionButtons.map((action) => {
                        const Icon = action.icon
                        const isLoadingAction = actionLoadingMap[action.type]
                        const disabled = Boolean(action.disabled || isAnyWorkflowLoading)
                        return (
                          <div key={action.type} className="space-y-1">
                            <Button
                              type="button"
                              variant={action.variant}
                              size="sm"
                              className="w-full justify-between"
                              onClick={() => openActionDialog(action.type)}
                              disabled={disabled}
                            >
                              <span className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {action.label}
                              </span>
                              {isLoadingAction && <Loader2 className="h-4 w-4 animate-spin" />}
                            </Button>
                            <p className="text-xs text-muted-foreground">{action.description}</p>
                            {action.disabledReason && <p className="text-xs text-rose-600">{action.disabledReason}</p>}
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">Tidak ada aksi yang tersedia.</p>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Detail Topik</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <div>
                    <div className="text-xs uppercase tracking-wide">Room</div>
                    <div className="mt-1 font-medium text-slate-700">{roomName}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide">Dibuat oleh</div>
                    <div className="mt-2 flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-slate-700">{authorName}</div>
                        <div className="text-xs">{formatDate(topic.created_at, true)}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide">Deadline</div>
                    <div className="mt-1 font-medium">
                      {topic.deadline_at ? formatDate(topic.deadline_at, true) : 'Tidak ditentukan'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide">Status terakhir</div>
                    <div className="mt-1 font-medium capitalize">{topic.status?.replace('_', ' ') || '-'}</div>
                  </div>
                  {isFrozen ? (
                    <div>
                      <div className="text-xs uppercase tracking-wide">Status beku</div>
                      <div className="mt-1 font-medium text-amber-700">Dibekukan</div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {topic.attachments?.length ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Lampiran</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {topic.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="w-4 h-4" />
                          <span>{attachment.filename}</span>
                        </div>
                        <span className="text-xs">{formatDate(attachment.created_at, true)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}
            </aside>
          </div>
        )}
      </div>

      <Dialog open={Boolean(activeAction)} onOpenChange={(open) => (!open ? closeDialog() : null)}>
        <DialogContent>
          {activeMeta ? (
            <>
              <DialogHeader>
                <DialogTitle>{activeMeta.title}</DialogTitle>
                {activeMeta.description && <DialogDescription>{activeMeta.description}</DialogDescription>}
              </DialogHeader>

              {activeMeta.noteLabel && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {activeMeta.noteLabel}
                    {activeMeta.noteRequired && <span className="text-rose-600"> *</span>}
                  </label>
                  <textarea
                    className="min-h-28 w-full rounded-md border border-slate-200 p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={activeMeta.notePlaceholder}
                    required={Boolean(activeMeta.noteRequired)}
                  />
                  {noteError && <p className="text-xs text-rose-600">{noteError}</p>}
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" type="button" onClick={closeDialog}>
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={Boolean(activeAction && actionLoadingMap[activeAction])}
                >
                  {activeAction && actionLoadingMap[activeAction] && <Loader2 className="h-4 w-4 animate-spin" />}
                  {activeMeta.confirmLabel}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}

function TopicDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-3 w-1/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}