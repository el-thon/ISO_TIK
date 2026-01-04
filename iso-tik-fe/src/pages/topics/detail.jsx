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
} from '@/services/topicHooks'
import { useMe } from '@/services/authHooks'
import { useQuill } from 'react-quilljs'
import 'quill/dist/quill.snow.css'

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

const typeIcon = (type) => {
  switch (type) {
    case 'file':
      return <FileText className="w-4 h-4 text-slate-500" />
    case 'link':
      return <LinkIcon className="w-4 h-4 text-slate-500" />
    default:
      return <FileText className="w-4 h-4 text-slate-500" />
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
  const { id } = useParams()
  const { data: topic, isLoading, isError, error, refetch } = useTopic(id)
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
  } = useTopicVersions(id, versionsParams, { keepPreviousData: true })
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
  } = useTopicReviews(id, reviewsParams, { keepPreviousData: true })
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

  const topicId = topic?.id || id
  const versions = versionsData?.versions ?? []
  const versionsErrorMessage = versionsErrorObj?.response?.data?.message || versionsErrorObj?.message || 'Gagal memuat riwayat versi.'
  const reviews = reviewsData?.reviews ?? []
  const reviewsErrorMessage = reviewsErrorObj?.response?.data?.message || reviewsErrorObj?.message || 'Gagal memuat tinjauan.'

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
  const hasContent = (topic?.input_items?.length ?? 0) > 0
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
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Link to="/topics" className="inline-flex items-center gap-2 text-blue-600">
                        <ArrowLeft className="w-4 h-4" /> Kembali
                      </Link>
                      <span className="text-muted-foreground">•</span>
                      <span>{formatDate(topic.created_at, true)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-heading-2 font-semibold">{topic.title}</h2>
                      {topic.status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadgeClass(topic.status)}`}>
                          {topic.status.replace('_', ' ')}
                        </span>
                      )}
                      {topic.security_level && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          {topic.security_level}
                        </span>
                      )}
                    </div>
                    {topic.labels?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {topic.labels.map((label) => (
                          <span key={label.id} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {label.name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <p className="text-sm text-muted-foreground">{topic.description || 'Belum ada deskripsi.'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Konten</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Input items yang melekat pada topik ini
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {topic.input_items?.length ? (
                    <div className="space-y-3">
                      {topic.input_items.map((item) => (
                        <div key={item.id} className="border rounded-md p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              {typeIcon(item.type)}
                              <div>
                                <div className="text-sm font-medium">{item.label || item.type}</div>
                                {item.visibility && (
                                  <div className="text-xs text-muted-foreground capitalize">{item.visibility}</div>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">{formatDate(item.updated_at, true)}</div>
                          </div>
                          {item.value && (
                            <p className="text-sm text-muted-foreground mt-3 whitespace-pre-line">{item.value}</p>
                          )}
                          {item.metadata && Object.keys(item.metadata).length > 0 && (
                            <pre className="mt-3 text-xs bg-slate-50 rounded-md p-3 overflow-auto">
                              {JSON.stringify(item.metadata, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground border border-dashed rounded-md p-6 text-center">
                      Belum ada konten yang ditambahkan.
                    </div>
                  )}
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
