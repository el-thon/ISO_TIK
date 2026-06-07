import React from 'react'
import { Link } from 'react-router-dom'
import {
  Home,
  FileText,
  Link as LinkIcon,
  MessageSquare,
  History,
  Loader2,
  X as XIcon,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  Download,
  File,
  AlertCircle,
  Tag,
  Undo2,
  Paperclip,
  ListChecks,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  formatDate,
  getInitials,
  getFileName,
  getFileUrl,
  getPreviewUrl,
  formatBytes,
  sanitizeHtml,
  REVIEW_FINDING_TYPES,
} from './utils'
import { renderInputItemContent } from './renderers.jsx'

const getTypeIcon = (type) => {
  const icons = {
    file: Paperclip,
    image: ImageIcon,
    link: LinkIcon,
    rich_text: FileText,
    form_data: ListChecks,
    text: FileText,
  }
  const Icon = icons[type] || FileText
  return <Icon className="w-4 h-4 text-slate-500" />
}

export const FormulirBreadcrumb = ({ title }) => (
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink asChild>
          <Link to="/beranda" className="inline-flex items-center gap-2">
            <Home className="w-4 h-4" />
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink asChild>
          <Link to="/forum">Forum</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>{title || 'Memuat...'}</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
)

export const NotificationBanner = ({ notice, onClose }) => {
  if (!notice) return null

  return (
    <div
      className={`mb-4 flex items-start justify-between gap-4 rounded-md border p-4 ${
        notice.type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-rose-200 bg-rose-50 text-rose-700'
      }`}
    >
      <div>
        <p className="font-medium">{notice.type === 'success' ? 'Berhasil' : 'Gagal'}</p>
        <p className="mt-1 text-sm">{notice.text}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-inherit/80 transition hover:text-inherit"
        aria-label="Tutup notifikasi"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  )
}

export const ErrorAlert = ({ error, onRetry, message }) => {
  if (!error) return null

  return (
    <div className="text-sm text-rose-600 flex items-center justify-between gap-3 border border-rose-200 rounded-md p-3">
      <span>{message}</span>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Coba lagi
        </Button>
      )}
    </div>
  )
}

export const FormulirHeader = ({ formulir, authorName, roomName }) => (
  <Card>
    <CardContent className="pt-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-slate-800">{formulir.title}</h1>
          <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
            <span>ID: {formulir.id}</span>
            {formulir.status && (
              <span className="inline-flex items-center gap-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                <FileText className="h-3 w-3" />
                {String(formulir.status).replace('_', ' ')}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {formulir.category && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {formulir.category}
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
          <div className="font-medium text-slate-800">{formatDate(formulir.created_at, true)}</div>
        </div>
      </div>

      <div className="p-4 rounded-md border bg-slate-50">
        <div className="text-xs text-muted-foreground mb-1">Deskripsi</div>
        <div className="text-sm text-slate-800 whitespace-pre-line">
          {formulir.description || 'Tidak ada deskripsi.'}
        </div>
      </div>
    </CardContent>
  </Card>
)

const LinkContent = ({ value }) => {
  const isValidUrl = value?.startsWith('http://') || value?.startsWith('https://') || value?.startsWith('/')

  if (!value) {
    return (
      <div className="mt-3 p-4 border border-dashed rounded-md text-center">
        <div className="text-sm text-muted-foreground">Link tidak tersedia</div>
      </div>
    )
  }

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
}

const RichTextContent = ({ value }) => {
  if (!value) {
    return (
      <div className="mt-3 p-4 border border-dashed rounded-md text-center">
        <div className="text-sm text-muted-foreground">Konten rich text kosong</div>
      </div>
    )
  }

  return (
    <div className="mt-3 p-3 border rounded-md bg-slate-50">
      <div
        className="prose prose-sm max-w-none text-slate-700"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }}
      />
    </div>
  )
}

const TextContent = ({ value }) => {
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
}

const FormDataContent = ({ fields }) => {
  if (!fields?.length) {
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
          <div className="text-slate-700 whitespace-pre-line wrap-break-word">
            {field.value || <span className="text-muted-foreground">-</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

const ImageContent = ({ item }) => {
  const metadata = item?.metadata ?? {}
  const value = item?.value ?? ''
  const fileName = getFileName(metadata, value, item)
  const fileUrl = getFileUrl(metadata, value, item)
  const previewUrl = getPreviewUrl(metadata, value, fileUrl, item)
  const fileSize = formatBytes(metadata.size || metadata.size_bytes || value?.size)
  const mimeType = metadata.type || metadata.mime_type || 'image/*'
  const displayUrl = previewUrl || fileUrl

  const isValidImageUrl = displayUrl && (
    displayUrl.startsWith('http://') ||
    displayUrl.startsWith('https://') ||
    displayUrl.startsWith('/') ||
    displayUrl.startsWith('data:image/')
  )

  const handleImageError = (e) => {
    e.target.style.display = 'none'
    const parent = e.target.parentElement
    parent.innerHTML = `
      <div class="p-8 text-center border border-dashed rounded">
        <div class="text-sm text-muted-foreground">Gambar tidak dapat ditampilkan</div>
        ${fileUrl ? `
          <a href="${fileUrl}" class="mt-2 text-xs text-blue-600 hover:underline inline-flex items-center gap-1" target="_blank">
            Coba buka file
          </a>
        ` : ''}
      </div>
    `
  }

  return (
    <div className="mt-3 space-y-3">
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
                onError={handleImageError}
              />
            </div>
          </div>
        </div>
      ) : fileUrl && !isValidImageUrl ? (
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

const FileContent = ({ item }) => {
  const metadata = item?.metadata ?? {}
  const value = item?.value ?? ''
  const fileName = getFileName(metadata, value, item)
  const fileUrl = getFileUrl(metadata, value, item)
  const fileSize = formatBytes(metadata.size || metadata.size_bytes || value?.size)
  const mimeType = metadata.type || metadata.mime_type || 'application/octet-stream'

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

export const InputItem = ({ item }) => {
  const contentNode = renderInputItemContent({
    item,
    components: {
      LinkContent,
      RichTextContent,
      TextContent,
      FormDataContent,
      ImageContent,
      FileContent,
    },
  })

  return (
    <div className="border rounded-md p-4 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {getTypeIcon(item.type)}
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
    </div>
  )
}

export const ReviewForm = ({
  findingType,
  onFindingTypeChange,
  findingDescription,
  onFindingDescriptionChange,
  clauseReference,
  onClauseReferenceChange,
  objectiveEvidence,
  onObjectiveEvidenceChange,
  documents,
  documentsLoading,
  documentsError,
  onSubmit,
  isLoading,
  error,
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Jenis Temuan</Label>
        <select
          className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
          value={findingType}
          onChange={(e) => onFindingTypeChange(e.target.value)}
        >
          {REVIEW_FINDING_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Referensi Klausul (opsional)</Label>
        <Input
          placeholder="Contoh: ISO 27001 A.5.1"
          value={clauseReference}
          onChange={(e) => onClauseReferenceChange(e.target.value)}
        />
      </div>
    </div>

    <div className="space-y-2">
      <Label>Deskripsi Temuan</Label>
      <textarea
        rows={4}
        className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
        placeholder="Jelaskan temuan ketidaksesuaian"
        value={findingDescription}
        onChange={(e) => onFindingDescriptionChange(e.target.value)}
      />
    </div>

    <div className="space-y-2">
      <Label>Bukti Objektif (opsional)</Label>
      <select
        className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
        value={objectiveEvidence}
        onChange={(e) => onObjectiveEvidenceChange(e.target.value)}
        disabled={documentsLoading}
      >
        <option value="">{documentsLoading ? 'Memuat dokumen...' : 'Pilih dokumen'}</option>
        {documents.map((document) => (
          <option key={document.id} value={String(document.id)}>
            {document.filename || document.name || document.original_name || `Dokumen ${document.id}`}
          </option>
        ))}
      </select>
      {documentsError && (
        <p className="text-xs text-rose-600">{documentsError}</p>
      )}
    </div>

    {error && <p className="text-xs text-rose-600">{error}</p>}

    <div className="flex items-center justify-between">
      <div className="text-xs text-muted-foreground">
        Temuan ini akan terlihat oleh pembuat dan penanggung jawab formulir.
      </div>
      <Button size="sm" onClick={onSubmit} disabled={isLoading}>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Kirim Tinjauan
      </Button>
    </div>
  </div>
)

export const ReviewItem = ({ review, documents }) => {
  const reviewerName =
    review.created_by_user?.full_name ||
    review.created_by_user?.name ||
    review.created_by_user?.username ||
    review.created_by?.profile?.full_name ||
    review.created_by?.name ||
    review.created_by?.username ||
    review.user?.profile?.full_name ||
    review.user?.name ||
    review.user?.username ||
    review.created_by_user_id ||
    'Tidak diketahui'

  const findingType = review.finding_type || '—'
  const findingDescription = review.finding_description || '—'
  const clauseReference = review.clause_reference
  const objectiveEvidence = review.objective_evidence

  const documentMatch = documents.find((doc) => String(doc.id) === String(objectiveEvidence))
  const objectiveEvidenceLabel =
    documentMatch?.filename ||
    documentMatch?.name ||
    documentMatch?.original_name ||
    objectiveEvidence

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium text-slate-700">{reviewerName}</span>
        <span>{formatDate(review.created_at, true)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
          {findingType}
        </span>
      </div>
      <p className="text-sm text-slate-700 whitespace-pre-line">{findingDescription}</p>
      {clauseReference && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Klausul:</span> {clauseReference}
        </div>
      )}
      {objectiveEvidence && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Bukti:</span> {objectiveEvidenceLabel}
        </div>
      )}
    </div>
  )
}

export const VersionItem = ({ version, index, onRevert, isLoading }) => {
  const label = version.number ? `Versi ${version.number}` : version.name || `Versi ${index + 1}`
  const author =
    version.created_by?.profile?.full_name ||
    version.created_by?.name ||
    version.created_by?.username ||
    'Tidak diketahui'
  const isCurrent = Boolean(version.is_current || version.current)

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
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
        <Button variant="outline" size="sm" onClick={() => onRevert(version.id)} disabled={isCurrent || isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
          <span className="ml-2">Pulihkan</span>
        </Button>
      </div>
    </div>
  )
}

export const ActionButton = ({ action, onClick, isLoading, disabled, isAnyLoading }) => {
  const Icon = action.icon
  const isDisabled = Boolean(action.disabled || disabled || isAnyLoading)

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant={action.variant}
        size="sm"
        className="w-full justify-between"
        onClick={() => onClick(action.type)}
        disabled={isDisabled}
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {action.label}
        </span>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      </Button>
      <p className="text-xs text-muted-foreground">{action.description}</p>
      {action.disabledReason && <p className="text-xs text-rose-600">{action.disabledReason}</p>}
    </div>
  )
}

export function FormulirDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

export function InputItemsSkeleton({ count = 2 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="space-y-2">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      ))}
    </div>
  )
}

export function ReviewsSkeleton({ count = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="rounded-md border p-3 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  )
}

export function VersionsSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="flex items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  )
}

export const FormulirDetailSidebar = ({
  formulir,
  roomName,
  authorName,
  isFrozen,
  actionButtons,
  actionLoadingMap,
  isAnyWorkflowLoading,
  currentUser,
  onOpenActionDialog,
}) => (
  <aside className="lg:col-span-4 space-y-4">
    {currentUser && actionButtons.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Aksi Workflow</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Sesuaikan status formulir sesuai peran Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {actionButtons.map((action) => (
            <ActionButton
              key={action.type}
              action={action}
              onClick={onOpenActionDialog}
              isLoading={actionLoadingMap[action.type]}
              disabled={action.disabled}
              isAnyLoading={isAnyWorkflowLoading}
            />
          ))}
        </CardContent>
      </Card>
    )}

    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Detail Formulir</CardTitle>
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
              <div className="text-xs">{formatDate(formulir.created_at, true)}</div>
            </div>
          </div>
        </div>
        
        {isFrozen ? (
          <div>
            <div className="text-xs uppercase tracking-wide">Status beku</div>
            <div className="mt-1 font-medium text-amber-700">Dibekukan</div>
          </div>
        ) : null}
      </CardContent>
    </Card>

    {formulir.attachments?.length ? (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Lampiran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {formulir.attachments.map((attachment) => (
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
)

export const FormulirReviewsHeader = () => (
  <CardHeader>
    <CardTitle className="text-sm font-medium flex items-center gap-2">
      <MessageSquare className="h-4 w-4" /> Tinjauan & Komentar
    </CardTitle>
    <CardDescription className="text-sm text-muted-foreground">
      Reviewer dapat meninggalkan catatan untuk pembuat atau penanggung jawab.
    </CardDescription>
  </CardHeader>
)

export const FormulirVersionsHeader = ({ onRefresh, isLoading }) => (
  <CardHeader className="flex flex-row items-center justify-between gap-4">
    <div>
      <CardTitle className="text-sm font-medium flex items-center gap-2">
        <History className="h-4 w-4" /> Riwayat Versi
      </CardTitle>
      <CardDescription className="text-sm text-muted-foreground">
        Versi terbaru ditampilkan di urutan teratas.
      </CardDescription>
    </div>
    <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
      {isLoading ? 'Memuat...' : 'Segarkan'}
    </Button>
  </CardHeader>
)

// ============================================================================
// New Components for Labels, Routings, WorkflowStates
// ============================================================================

export const Labels = ({ labels }) => {
  if (!labels || labels.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <Tag className="h-4 w-4" />
        Label
      </h3>
      <div className="flex flex-wrap gap-2">
        {labels.map((label) => (
          <span
            key={label.id}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: label.color ? `${label.color}20` : '#e2e8f0',
              color: label.color || '#334155',
            }}
          >
            {label.name}
          </span>
        ))}
      </div>
    </div>
  )
}

export const Routings = ({ routings }) => {
  if (!routings || routings.length === 0) return null

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'in_progress':
        return <Clock className="h-3 w-3 text-blue-500" />
      case 'rejected':
        return <XCircle className="h-3 w-3 text-red-500" />
      default:
        return <Clock className="h-3 w-3 text-yellow-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <GitBranch className="h-4 w-4" />
        Routing
      </h3>
      <div className="space-y-3">
        {routings.map((routing, index) => (
          <div key={routing.id || index} className="border rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">Step {routing.step || index + 1}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getStatusColor(routing.status)}`}>
                  {getStatusIcon(routing.status)}
                  {routing.status?.replace('_', ' ') || 'Pending'}
                </span>
              </div>
              {routing.due_date && (
                <span className="text-xs text-muted-foreground">
                  Deadline: {formatDate(routing.due_date)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(routing.assignee?.name || routing.assignee?.username)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {routing.assignee?.name || routing.assignee?.username || 'Unassigned'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {routing.role || 'Reviewer'}
                </p>
              </div>
              {routing.completed_at && (
                <span className="text-xs text-muted-foreground">
                  Selesai: {formatDate(routing.completed_at, true)}
                </span>
              )}
            </div>

            {routing.notes && (
              <div className="mt-2 text-xs text-muted-foreground bg-slate-50 p-2 rounded">
                <span className="font-medium">Catatan:</span> {routing.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export const WorkflowStates = ({ states }) => {
  if (!states || states.length === 0) return null

  const getStateIcon = (state) => {
    switch (state) {
      case 'draft':
        return <FileText className="h-3 w-3 text-gray-500" />
      case 'in_review':
        return <Clock className="h-3 w-3 text-blue-500" />
      case 'changes_requested':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />
      case 'approved':
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'rejected':
        return <XCircle className="h-3 w-3 text-red-500" />
      case 'closed':
        return <CheckCircle className="h-3 w-3 text-purple-500" />
      default:
        return <History className="h-3 w-3 text-gray-500" />
    }
  }

  const getStateColor = (state) => {
    switch (state) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'in_review': return 'bg-blue-100 text-blue-800'
      case 'changes_requested': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'closed': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <History className="h-4 w-4" />
        Riwayat Workflow
      </h3>
      <div className="space-y-3">
        {states.map((state, index) => (
          <div key={state.id || index} className="relative pl-6 pb-3 border-l-2 border-slate-200 last:pb-0 last:border-l-0">
            <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-400" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStateIcon(state.state)}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStateColor(state.state)}`}>
                    {state.state?.replace('_', ' ') || '-'}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(state.created_at, true)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {getInitials(state.changed_by?.name || state.changed_by?.username)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="text-xs font-medium">
                    {state.changed_by?.name || state.changed_by?.username || 'System'}
                  </span>
                  {state.changed_by?.role && (
                    <span className="text-xs text-muted-foreground ml-1">
                      • {state.changed_by.role}
                    </span>
                  )}
                </div>
              </div>

              {state.comment && (
                <div className="mt-2 text-xs bg-slate-50 p-2 rounded border border-slate-100">
                  <p className="text-slate-700 whitespace-pre-line">{state.comment}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}