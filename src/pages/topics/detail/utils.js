export const ACTION_METADATA = {
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

export const REVIEW_FINDING_TYPES = [
  { value: 'minor', label: 'Minor' },
  { value: 'major', label: 'Major' },
  { value: 'observation', label: 'Observation' },
]

export const isLikelyTopicId = (value) => {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (!trimmed) return false

  if (trimmed.includes('.')) return false
  if (/^\d{1,30}$/.test(trimmed)) return true
  if (/^[0-9a-fA-F-]{16,64}$/.test(trimmed)) return true
  if (/^[a-zA-Z0-9_-]{6,64}$/.test(trimmed)) return true

  return false
}

export const formatDate = (value, withTime = false) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime && { hour: '2-digit', minute: '2-digit' }),
  })
}

export const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('')
}

export const extractFromObject = (obj, fields) => {
  if (!obj || typeof obj !== 'object') return null
  for (const field of fields) {
    const val = obj[field]
    if (typeof val === 'string' && val.trim() !== '') return val
  }
  return null
}

export const getStorageBaseUrl = () => {
  // Vite uses `import.meta.env` (not `process.env`).
  // Support both just in case this file is used in non-vite contexts.
  return (import.meta?.env?.VITE_STORAGE_URL ?? import.meta?.env?.VITE_PUBLIC_STORAGE_URL ?? '') || ''
}

export const normalizeUrl = (url) => {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed

  const STORAGE_BASE = getStorageBaseUrl()

  if (trimmed.startsWith('/attachments/')) {
    return `${STORAGE_BASE}/storage${trimmed}`
  }
  if (trimmed.startsWith('/')) {
    return `${STORAGE_BASE}${trimmed}`
  }
  if (trimmed.startsWith('attachments/')) {
    return `${STORAGE_BASE}/storage/${trimmed}`
  }
  if (trimmed.startsWith('storage/') || trimmed.startsWith('files/') || trimmed.startsWith('uploads/')) {
    return `${STORAGE_BASE}/${trimmed}`
  }
  if (trimmed.startsWith('./')) {
    return `${STORAGE_BASE}/${trimmed.slice(2)}`
  }
  if (trimmed.startsWith('../')) {
    return `${STORAGE_BASE}/${trimmed.replace(/^\.\.\//, '')}`
  }

  return `${STORAGE_BASE}/${trimmed}`
}

export const getFileUrl = (metadata, value, item) => {
  const urlFromMeta = normalizeUrl(
    extractFromObject(metadata, [
      'url', 'path', 'link', 'download_url', 'file_url',
      'file', 'attachment', 'file_path', 'filepath',
    ])
  )
  if (urlFromMeta) return urlFromMeta

  if (typeof value === 'string') return normalizeUrl(value)

  if (value && typeof value === 'object') {
    const urlFromValue = normalizeUrl(
      extractFromObject(value, [
        'url', 'path', 'link', 'download_url', 'file_url',
        'file', 'attachment', 'file_path', 'filepath',
      ])
    )
    if (urlFromValue) return urlFromValue

    const attachments = item?.attachments || value.attachments || []
    if (attachments.length) {
      const primary = attachments[0]
      const attachmentUrl = normalizeUrl(primary?.url || primary?.path || primary?.file || primary?.file_url)
      if (attachmentUrl) return attachmentUrl
    }
  }

  return null
}

export const getPreviewUrl = (metadata, value, fileUrl, item) => {
  const previewFromMeta = normalizeUrl(
    extractFromObject(metadata, [
      'preview_url', 'thumbnail_url', 'image_url', 'preview',
      'thumbnail', 'signed_preview_url', 'file_path', 'filepath',
    ])
  )
  if (previewFromMeta) return previewFromMeta

  if (value && typeof value === 'object') {
    const previewFromValue = normalizeUrl(
      extractFromObject(value, [
        'preview_url', 'thumbnail_url', 'image_url', 'preview',
        'thumbnail', 'signed_preview_url', 'file_path', 'filepath',
      ])
    )
    if (previewFromValue) return previewFromValue
  }

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

export const getFileName = (metadata, value, item) => {
  const nameFromMeta = extractFromObject(metadata, [
    'name', 'filename', 'original_name', 'original_filename', 'file_name', 'client_name',
  ])
  if (nameFromMeta) return nameFromMeta

  if (value && typeof value === 'object') {
    const nameFromValue = extractFromObject(value, [
      'name', 'filename', 'original_name', 'original_filename', 'file_name', 'client_name',
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

  const url = getFileUrl(metadata, value, item)
  if (url) {
    try {
      const urlObj = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
      const pathname = urlObj.pathname || ''
      const lastSegment = pathname.split('/').filter(Boolean).pop()
      if (lastSegment) return decodeURIComponent(lastSegment)
    } catch {
      const parts = url.split('?')[0].split('/')
      const lastSegment = parts.filter(Boolean).pop()
      if (lastSegment) return decodeURIComponent(lastSegment)
    }
  }

  return typeof value === 'string' && value.trim() ? value : 'File'
}

export const formatBytes = (bytes) => {
  if (!bytes || typeof bytes !== 'number') return null
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

export const sanitizeHtml = (html) => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/on\w+='[^']*'/g, '')
    .replace(/javascript:/gi, '')
}

export const buildErrorMessage = (err) => {
  return err?.response?.data?.message || err?.message || 'Terjadi kesalahan saat menjalankan aksi.'
}
