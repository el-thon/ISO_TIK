import React, { useState } from 'react'
import { Plus, FileText, Download, Eye, Trash2 } from 'lucide-react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import CreateAttachmentDialog from '@/components/attachments/CreateAttachmentDialog'
import { useListAttachments } from '@/services/topicHooks'

const formatBytes = (bytes) => {
  if (!bytes || Number.isNaN(Number(bytes))) return '-'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = Number(bytes)
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  return `${size % 1 === 0 ? size : size.toFixed(1)} ${units[unitIndex]}`
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AttachmentsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)

  const { data, isLoading, isError, error, refetch } = useListAttachments({ page: 1, per_page: 50 })

  const attachments = data?.attachments ?? []

  const handleCreateSuccess = (data) => {
    setSuccessMessage('Attachment berhasil dibuat!')
    setTimeout(() => setSuccessMessage(null), 3000)
    refetch()
  }

  const getStorageBaseUrl = () => {
    const rawApiBase = (import.meta.env.VITE_API_BASE_URL || '').trim()
    const apiOrigin = rawApiBase ? rawApiBase.replace(/\/api\/?.*$/, '') : ''
    const proxyTarget = (import.meta.env.VITE_PROXY_TARGET || '').trim()
    const explicitStorageBase = (import.meta.env.VITE_STORAGE_BASE_URL || '').trim()
    const runtimeFallback = typeof window !== 'undefined' ? window.location.origin : ''
    return (explicitStorageBase || apiOrigin || proxyTarget || (import.meta.env.DEV ? 'http://localhost:8000' : runtimeFallback)).replace(/\/$/, '')
  }

  const getDownloadUrl = (attachment) => {
    const storageUrl = attachment?.storage_url || attachment?.url || attachment?.download_url
    if (!storageUrl) return null
    
    if (storageUrl.startsWith('http://') || storageUrl.startsWith('https://')) {
      return storageUrl
    }
    
    const baseUrl = getStorageBaseUrl()
    if (storageUrl.startsWith('/attachments/')) {
      return `${baseUrl}/storage${storageUrl}`
    }
    if (storageUrl.startsWith('/')) {
      return `${baseUrl}${storageUrl}`
    }
    return `${baseUrl}/${storageUrl}`
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Attachments</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola file attachments untuk topics dan recipients
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Buat Attachment
          </Button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <p className="font-medium">Gagal memuat attachments</p>
            <p>{error?.response?.data?.message || error?.message || 'Terjadi kesalahan'}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
              Coba lagi
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Attachments List */}
        {!isLoading && attachments.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-muted-foreground">Belum ada attachment</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setCreateDialogOpen(true)}>
                Buat Attachment Pertama
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && attachments.length > 0 && (
          <div className="space-y-3">
            {attachments.map((attachment) => {
              const downloadUrl = getDownloadUrl(attachment)
              const fileName = attachment.name || attachment.filename || attachment.original_name || 'Unnamed file'
              const fileSize = formatBytes(attachment.size || attachment.size_bytes)
              const topicTitle = attachment.topic?.title || `Topic ${attachment.topic_id}`
              const recipientName = attachment.recipient?.username || attachment.recipient?.name || attachment.recipient?.email || `User ${attachment.recipient_id}`

              return (
                <Card key={attachment.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <FileText className="h-5 w-5 text-slate-500 mt-1 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-800 truncate">{fileName}</h3>
                          <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                            <div>Topic: <span className="font-medium">{topicTitle}</span></div>
                            <div>Recipient: <span className="font-medium">{recipientName}</span></div>
                            <div className="flex items-center gap-3">
                              <span>{fileSize}</span>
                              <span>•</span>
                              <span>{formatDate(attachment.created_at)}</span>
                            </div>
                          </div>
                          {attachment.label && (
                            <div className="mt-2 text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded inline-block">
                              {attachment.label}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {downloadUrl && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </a>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a href={downloadUrl} download={fileName}>
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </a>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Create Attachment Dialog */}
        <CreateAttachmentDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={handleCreateSuccess}
        />
      </div>
    </MainLayout>
  )
}
