// pages/topics/detail.jsx
import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Send, CheckCircle2, MessageSquareWarning, Lock, Unlock, Snowflake, Undo2, Loader2 } from 'lucide-react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
} from '@/services/topicHooks'
import { useMe } from '@/services/authHooks'
import { ACTION_METADATA, isLikelyTopicId, buildErrorMessage, formatDate } from './detail/utils'
import {
  TopicBreadcrumb,
  NotificationBanner,
  ErrorAlert,
  TopicHeader,
  InputItem,
  VersionItem,
  ActionButton,
  TopicDetailSidebar,
  TopicVersionsHeader,
  WorkflowStates,
  Routings,
  Labels,
  TopicDetailSkeleton,
  InputItemsSkeleton,
  VersionsSkeleton,
} from './detail/components'

// Import komponen Finding
import FindingForm from '@/components/finding/FindingForm'
import FindingTable from '@/components/finding/FindingTable'
import { convertFormToInputItem, findFindingData } from '../../utils/findingHelper'

// ============================================================================
// Custom Hooks
// ============================================================================

// PERBAIKAN: Tambahkan hook untuk create input item
const useCreateTopicInputItem = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const mutateAsync = async ({ topicId, data }) => {
    setIsLoading(true)
    setError(null)
    try {
      // TODO: Ganti dengan actual API call
      const response = await fetch(`/api/v1/topics/${topicId}/input-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create input item')
      }
      
      const result = await response.json()
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    mutateAsync,
    isLoading,
    error
  }
}

const useWorkflowActions = (topic, currentUser, hasContent) => {
  const status = (topic?.status || '').toLowerCase()
  const currentUserId = currentUser?.id
  const isCreator = Boolean(currentUserId && (topic?.created_by_user_id === currentUserId || topic?.created_by?.id === currentUserId))
  const isResponsible = Boolean(currentUserId && (topic?.room?.responsible_user_id === currentUserId || topic?.room?.responsible_user?.id === currentUserId))
  const isFrozen = Boolean(topic?.is_frozen || topic?.frozen_at)

  const canPublish = status === 'draft' && isCreator && currentUser?.can_create_topics
  const canApprove = ['in_review', 'changes_requested'].includes(status) && currentUser?.can_approve_topics
  const canRequestChanges = status === 'in_review' && (currentUser?.can_request_changes || currentUser?.can_review_topics)
  const canClose = status === 'approved' && isResponsible
  const canReopen = status === 'closed' && isResponsible
  const canFreeze = isResponsible && !isFrozen
  const canUnfreeze = isResponsible && isFrozen

  const actions = useMemo(() => {
    const result = []
    if (canPublish) {
      result.push({
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
      result.push({
        type: 'approve',
        label: 'Setujui Topik',
        description: 'Konfirmasi bahwa topik siap dijalankan.',
        icon: CheckCircle2,
        variant: 'default',
      })
    }
    if (canRequestChanges) {
      result.push({
        type: 'request_changes',
        label: 'Minta Perubahan',
        description: 'Kirim revisi kembali ke pembuat.',
        icon: MessageSquareWarning,
        variant: 'destructive',
      })
    }
    if (canClose) {
      result.push({
        type: 'close',
        label: 'Tutup Topik',
        description: 'Kunci topik yang sudah approved.',
        icon: Lock,
        variant: 'outline',
      })
    }
    if (canReopen) {
      result.push({
        type: 'reopen',
        label: 'Buka Kembali',
        description: 'Kembalikan topik ke tahap review.',
        icon: Undo2,
        variant: 'outline',
      })
    }
    if (canFreeze) {
      result.push({
        type: 'freeze',
        label: 'Bekukan',
        description: 'Cegah perubahan sementara.',
        icon: Snowflake,
        variant: 'outline',
      })
    }
    if (canUnfreeze) {
      result.push({
        type: 'unfreeze',
        label: 'Lepas Beku',
        description: 'Aktifkan kembali topik.',
        icon: Unlock,
        variant: 'outline',
      })
    }
    return result
  }, [canPublish, canApprove, canRequestChanges, canClose, canReopen, canFreeze, canUnfreeze, hasContent])

  return actions
}

// ============================================================================
// Main Component
// ============================================================================

export default function TopicDetail() {
  const { id: paramTopicId } = useParams()
  const isValidTopicId = useMemo(() => isLikelyTopicId(paramTopicId), [paramTopicId])

  // State
  const [activeAction, setActiveAction] = useState(null)
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState(null)
  const [workflowNotice, setWorkflowNotice] = useState(null)
  
  // State untuk Finding
  const [findingData, setFindingData] = useState(null)
  const [showFindingForm, setShowFindingForm] = useState(false)

  // Custom hooks
  const { data: meData } = useMe()
  const currentUser = meData?.data?.user

  // PERBAIKAN: Definisikan createInputItemMutation di sini
  const createInputItemMutation = useCreateTopicInputItem()

  // Data fetching hooks
  const { data: topic, isLoading, isError, error, refetch } = useTopic(paramTopicId, { 
    enabled: isValidTopicId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

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

  // Definisikan topicId setelah topic tersedia
  const topicId = topic?.id || paramTopicId

  // Load finding data dari input_items
  useEffect(() => {
    if (topic?.input_items) {
      const extractedData = findFindingData(topic.input_items)
      if (extractedData) {
        setFindingData(extractedData)
      }
    }
  }, [topic])

  // Handlers
  const handleSuccess = useCallback((message) => {
    setWorkflowNotice({ type: 'success', text: message })
    closeDialog()
  }, [])

  const handleError = useCallback((err) => {
    setWorkflowNotice({ type: 'error', text: buildErrorMessage(err) })
  }, [])

  const closeDialog = useCallback(() => {
    setActiveAction(null)
    setNote('')
    setNoteError(null)
  }, [])

  // PERBAIKAN: Handler untuk menyimpan finding
  const handleSaveFinding = useCallback(async (formData) => {
    try {
      const inputItem = convertFormToInputItem(formData)
      
      await createInputItemMutation.mutateAsync({
        topicId,
        data: inputItem
      })
      
      setFindingData(formData)
      setShowFindingForm(false)
      handleSuccess('Data temuan berhasil disimpan')
      
      // Refresh data topic
      refetch()
    } catch (err) {
      console.error('Error saving finding:', err)
      handleError(err)
    }
  }, [topicId, createInputItemMutation, handleSuccess, handleError, refetch])

  // Mutation hooks - workflow
  const revertVersionMutation = useRevertTopicVersion({
    onSuccess: () => handleSuccess('Versi topik berhasil dipulihkan.'),
    onError: handleError,
  })

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

  // Derived data
  const versions = versionsData?.versions ?? []
  const versionsErrorMessage = versionsErrorObj?.response?.data?.message || versionsErrorObj?.message || 'Gagal memuat riwayat versi.'
  
  const inputItems = useMemo(() => {
    const rawItems = topic?.input_items || []
    
    return rawItems
      .filter(item => !item.deleted_at && item?.label !== "Form Daftar Temuan Ketidaksesuaian") // Filter out finding item
      .map((item, index) => ({
        ...item,
        id: item.id || `${item.type}-${index}`,
        metadata: item?.metadata || {},
        order_index: item?.order_index || index + 1,
        label: item?.label || item?.title || `${item.type} ${index + 1}`,
        type: item?.type || 'text',
        value: item?.value || '',
        visibility: item?.visibility || 'visible',
      }))
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
  }, [topic])

  const actionLoadingMap = {
    publish: publishMutation.isLoading,
    approve: approveMutation.isLoading,
    request_changes: requestChangesMutation.isLoading,
    close: closeTopicMutation.isLoading,
    reopen: reopenTopicMutation.isLoading,
    freeze: freezeTopicMutation.isLoading,
    unfreeze: unfreezeTopicMutation.isLoading,
  }

  const isAnyWorkflowLoading = Object.values(actionLoadingMap).some(Boolean)
  const hasContent = inputItems.length > 0
  const authorName = topic?.created_by?.profile?.full_name || topic?.created_by?.name || topic?.created_by?.username || 'Tidak diketahui'
  const roomName = topic?.room?.name || 'Tidak ada informasi'
  const isFrozen = Boolean(topic?.is_frozen || topic?.frozen_at)
  const versionDisplay = topic ? `v${topic.version_major}.${topic.version_minor}` : ''

  const actionButtons = useWorkflowActions(topic, currentUser, hasContent)
  const activeMeta = activeAction ? ACTION_METADATA[activeAction] : null

  // More handlers
  const openActionDialog = useCallback((actionType) => {
    setActiveAction(actionType)
    setNote('')
    setNoteError(null)
  }, [])

  const handleConfirmAction = useCallback(() => {
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
  }, [activeAction, topicId, note, publishMutation, approveMutation, requestChangesMutation, closeTopicMutation, reopenTopicMutation, freezeTopicMutation, unfreezeTopicMutation])

  const handleRevertVersion = useCallback((versionId) => {
    if (!versionId || !topicId) return
    revertVersionMutation.mutate({ topicId, versionId })
  }, [topicId, revertVersionMutation])

  // Early returns
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

  return (
    <MainLayout>
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="mb-4">
          <TopicBreadcrumb title={topic?.title} />
        </div>

        {isLoading && <TopicDetailSkeleton />}

        {isError && (
          <ErrorAlert 
            error={error} 
            onRetry={refetch} 
            message={error?.response?.data?.message || error?.message || 'Silakan coba ulang.'} 
          />
        )}

        <NotificationBanner notice={workflowNotice} onClose={() => setWorkflowNotice(null)} />

        {!isLoading && topic && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-8 space-y-4">
              <TopicHeader 
                topic={topic} 
                authorName={authorName} 
                roomName={roomName} 
                versionDisplay={versionDisplay}
              />

              {/* Labels Section */}
              {topic.labels && topic.labels.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <Labels labels={topic.labels} />
                  </CardContent>
                </Card>
              )}

              {/* Input Items Section (regular items) */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Konten Topik</p>
                      <span className="text-xs text-muted-foreground">{inputItems.length} item</span>
                    </div>

                    {inputItems.length > 0 ? (
                      <div className="space-y-3">
                        {inputItems.map((item, index) => (
                          <InputItem key={item.id} item={item} index={index} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground border border-dashed rounded-md p-6 text-center">
                        Belum ada konten yang ditambahkan.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Finding Section - Form Daftar Temuan */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Daftar Temuan Ketidaksesuaian</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowFindingForm(!showFindingForm)}
                      disabled={createInputItemMutation.isLoading}
                    >
                      {createInputItemMutation.isLoading ? (
                        <>Menyimpan...</>
                      ) : showFindingForm ? (
                        'Sembunyikan Form'
                      ) : findingData ? (
                        'Edit Temuan'
                      ) : (
                        'Tambah Temuan'
                      )}
                    </Button>
                  </div>

                  {showFindingForm ? (
                    <FindingForm 
                      onSubmit={handleSaveFinding}
                      initialData={findingData}
                    />
                  ) : findingData ? (
                    <FindingTable 
                      findings={findingData.findings} 
                      auditInfo={{
                        audit_code: findingData.audit_code,
                        audited_unit: findingData.audited_unit,
                        audit_date: findingData.audit_date,
                        auditor: findingData.auditor,
                        auditee: findingData.auditee
                      }}
                    />
                  ) : (
                    <div className="text-sm text-muted-foreground border border-dashed rounded-md p-6 text-center">
                      Belum ada data temuan. Klik "Tambah Temuan" untuk mengisi daftar temuan ketidaksesuaian.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Routings Section */}
              {topic.routings && topic.routings.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <Routings routings={topic.routings} />
                  </CardContent>
                </Card>
              )}

              {/* Workflow States Section */}
              {topic.workflow_states && topic.workflow_states.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <WorkflowStates states={topic.workflow_states} />
                  </CardContent>
                </Card>
              )}

              {/* Versions Section */}
              <Card>
                <TopicVersionsHeader onRefresh={refetchVersions} isLoading={versionsLoading} />
                <CardContent>
                  {versionsLoading ? (
                    <VersionsSkeleton count={3} />
                  ) : versionsError ? (
                    <ErrorAlert 
                      error={versionsError} 
                      onRetry={refetchVersions} 
                      message={versionsErrorMessage} 
                    />
                  ) : versions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada versi tersimpan.</p>
                  ) : (
                    <div className="space-y-3">
                      {versions.map((version, idx) => (
                        <VersionItem
                          key={version.id || idx}
                          version={version}
                          index={idx}
                          onRevert={handleRevertVersion}
                          isLoading={revertVersionMutation.isLoading}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <TopicDetailSidebar
              topic={topic}
              roomName={roomName}
              authorName={authorName}
              isFrozen={isFrozen}
              actionButtons={actionButtons}
              actionLoadingMap={actionLoadingMap}
              isAnyWorkflowLoading={isAnyWorkflowLoading}
              currentUser={currentUser}
              onOpenActionDialog={openActionDialog}
              versionDisplay={versionDisplay}
              commentsCount={topic.comments_count}
              securityLevel={topic.security_level}
              deadlineAt={topic.deadline_at}
            />
          </div>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={Boolean(activeAction)} onOpenChange={(open) => (!open ? closeDialog() : null)}>
        <DialogContent>
          {activeMeta && (
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
                  {activeAction && actionLoadingMap[activeAction] && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {activeMeta.confirmLabel}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}