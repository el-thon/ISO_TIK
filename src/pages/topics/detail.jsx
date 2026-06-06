// pages/topics/detail.jsx
import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react'
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
  useTopicInputItems,
} from '@/hooks/useTopic'
import { useMe } from '@/hooks/useAuth'
import { useAdminClauses } from '@/hooks/useAdminClause'
import { useRoomParticipants } from '@/hooks/useRoom'
import { ACTION_METADATA, isLikelyTopicId, buildErrorMessage } from './detail/utils'
import { toast } from '@/components/ui/use-toast'
import api from '@/services/api'
import { getUserData } from '@/utils/auth'
import {
  TopicBreadcrumb,
  ErrorAlert,
  TopicHeader,
  InputItem,
  VersionItem,
  ActionButton,
  TopicDetailSidebar,
  TopicVersionsHeader,
  WorkflowStates,
  Routings,
  TopicDetailSkeleton,
  InputItemsSkeleton,
  VersionsSkeleton,
} from './detail/components'

// Import komponen Finding
import FindingForm from '@/components/finding/FindingForm'
import FindingTable from '@/components/finding/FindingTable'
import { convertFormToInputItem, extractFindingFromInputItem } from '../../utils/findingHelper'
import * as documentService from '@/services/documentService'
import * as forumAttachmentService from '@/services/forumAttachmentService'
import { isPeriodDeadlinePassed as isPeriodDeadlinePassedUtil } from '@/utils/periodDeadline'

// Import PDF Generator
import { generatePDF } from '@/utils/pdfGenerator'

// ============================================================================
// Custom Hooks
// ============================================================================

// PERBAIKAN: Tambahkan hook untuk create input item
const useCreateTopicInputItem = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const mutateAsync = async ({ topicId, data, inputItemId }) => {
    setIsLoading(true)
    setError(null)
    try {
      if (inputItemId) {
        const response = await api.put(`/input-items/${inputItemId}`, data)
        return response?.data
      }

      const response = await api.post(`/topics/${topicId}/input-items`, data)
      return response?.data
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
  const normalizedCurrentUserId = currentUserId != null ? String(currentUserId) : null
  const isCreator = Boolean(
    normalizedCurrentUserId &&
    (String(topic?.created_by_user_id ?? '') === normalizedCurrentUserId || String(topic?.created_by?.id ?? '') === normalizedCurrentUserId)
  )
  const forum = topic?.forum || topic?.room || null
  const responsibleId =
    forum?.responsible_user_id ??
    forum?.responsible_user?.id ??
    forum?.responsibleUser?.id
  const isResponsible = Boolean(
    normalizedCurrentUserId && responsibleId != null && String(responsibleId) === normalizedCurrentUserId
  )
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

  const printRef = useRef(null)

  // State
  const [activeAction, setActiveAction] = useState(null)
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState(null)
  
  // State untuk Finding
  const [findingData, setFindingData] = useState(null)
  const [showFindingForm, setShowFindingForm] = useState(false)
  const [documentNameMap, setDocumentNameMap] = useState({})
  const [signatureDataUrl, setSignatureDataUrl] = useState(null)
  const [auditeeSignatureDataUrl, setAuditeeSignatureDataUrl] = useState(null)
  const [logoDataUrl, setLogoDataUrl] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [findingInputItemId, setFindingInputItemId] = useState(null)

  // Custom hooks
  const { data: meData } = useMe()
  const storedUser = useMemo(() => getUserData(), [])
  const currentUser = meData?.data?.user ?? meData ?? storedUser
  const { data: clauseData } = useAdminClauses({ per_page: 100, is_active: true })

  // PERBAIKAN: Definisikan createInputItemMutation di sini
  const createInputItemMutation = useCreateTopicInputItem()

  // Data fetching hooks
  const { data: topic, isLoading, isError, error: topicError, refetch } = useTopic(paramTopicId, { 
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

  const inputItemsParams = useMemo(() => ({ per_page: 100 }), [])
  const { data: inputItemsData } = useTopicInputItems(paramTopicId, inputItemsParams, {
    enabled: isValidTopicId,
    refetchOnMount: true,
  })

  // Definisikan topicId setelah topic tersedia
  const topicId = topic?.id || paramTopicId

  const forumId = topic?.forum?.id || topic?.room?.id || topic?.forum_id || topic?.room_id

  // Load participants to determine whether current user can add/edit findings.
  const participantsParams = useMemo(() => ({ per_page: 200 }), [])
  const { data: participantsData } = useRoomParticipants(forumId, participantsParams, {
    enabled: Boolean(forumId),
  })
  const forumParticipants = participantsData?.participants ?? []

  // Load finding data dari input_items
  const resolvedInputItems = useMemo(() => {
    if (Array.isArray(topic?.input_items) && topic.input_items.length) {
      return topic.input_items
    }
    return inputItemsData?.items ?? []
  }, [topic, inputItemsData])

  const resolveLogoUrl = useCallback(() => {
    const fallbackOrigin = typeof window !== 'undefined' ? window.location.origin : ''
    return `${fallbackOrigin}/Logo_UnivLampung.png`
  }, [])


  const FORM_DOC_NUMBER = 'FRM-POS-UPA TIK-SMKI-008-01'
  const FORM_REVISION = '0'
  const FORM_ISSUED_DATE = '13-10-2025'

  const toDataUrl = useCallback((blob) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  }), [])

  useEffect(() => {
    let isMounted = true
    const loadLogo = async () => {
      try {
        const response = await fetch(resolveLogoUrl(), { cache: 'no-store' })
        if (!response.ok) throw new Error('Logo fetch failed')
        const blob = await response.blob()
        const dataUrl = await toDataUrl(blob)
        if (isMounted) setLogoDataUrl(dataUrl)
      } catch {
        if (isMounted) setLogoDataUrl(null)
      }
    }
    loadLogo()
    return () => {
      isMounted = false
    }
  }, [resolveLogoUrl, toDataUrl])

  const clauseMap = useMemo(() => {
    const clauses = clauseData?.clauses ?? clauseData?.items ?? clauseData?.data ?? []
    return clauses.reduce((acc, clause) => {
      const id = clause?.id ?? clause?.clause_id ?? clause?.uuid
      if (!id) return acc
      const label = clause?.name && clause?.code ? `${clause.code} - ${clause.name}` : clause?.name || clause?.code
      if (label) acc[String(id)] = label
      return acc
    }, {})
  }, [clauseData])

  const resolveClauseLabel = useCallback(
    (value) => {
      if (!value) return '-'
      if (typeof value === 'object') {
        const id = value?.id ?? value?.clause_id ?? value?.uuid
        const label = value?.name && value?.code ? `${value.code} - ${value.name}` : value?.name || value?.code
        if (label) return label
        if (id) return clauseMap[String(id)] || String(id)
        return JSON.stringify(value)
      }
      const key = String(value)
      return clauseMap[key] || value
    },
    [clauseMap]
  )

  useEffect(() => {
    if (resolvedInputItems.length) {
      const findingItem = resolvedInputItems.find((item) => extractFindingFromInputItem(item))
      const extractedData = findingItem ? extractFindingFromInputItem(findingItem) : null
      if (extractedData) {
        setFindingData(extractedData)
        setFindingInputItemId(findingItem?.id || findingItem?.input_item_id || null)
      } else {
        setFindingInputItemId(null)
      }
    }
  }, [resolvedInputItems])

  const ensureImagesLoaded = useCallback(async (root) => {
    if (!root) return
    const images = Array.from(root.querySelectorAll('img'))
    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) return resolve()
            img.onload = () => resolve()
            img.onerror = () => resolve()
          })
      )
    )
  }, [])

  useEffect(() => {
    const objectiveEvidenceIds = findingData?.findings
      ?.map((finding) => finding?.objective_evidence)
      .filter(Boolean)
      .map((value) => String(value).split('||')[0]?.trim())
      .filter(Boolean)
    if (!objectiveEvidenceIds || objectiveEvidenceIds.length === 0) return

    let isMounted = true
    const loadDocuments = async () => {
      try {
        const [forumRes, documentRes] = await Promise.all([
          forumId
            ? forumAttachmentService.listForumAttachments(forumId, { per_page: 200 }).catch(() => ({ attachments: [] }))
            : Promise.resolve({ attachments: [] }),
          documentService.listDocuments({ per_page: 200 }).catch(() => ({ documents: [] })),
        ])
        const docs = [...(forumRes?.attachments ?? []), ...(documentRes?.documents ?? [])]
        const mapped = docs.reduce((acc, doc) => {
          const docId = doc?.id ? String(doc.id) : null
          if (!docId) return acc
          const displayName =
            doc.display_name ||
            doc.original_filename ||
            doc.original_name ||
            doc.filename ||
            doc.file_name ||
            doc.name
          if (displayName) acc[docId] = displayName
          return acc
        }, {})
        if (isMounted && Object.keys(mapped).length > 0) {
          setDocumentNameMap(mapped)
        }
      } catch {
        // ignore document loading errors
      }
    }

    loadDocuments()

    return () => {
      isMounted = false
    }
  }, [findingData, forumId])

  useEffect(() => {
    const objectiveEvidenceIds = findingData?.findings
      ?.map((finding) => finding?.objective_evidence)
      .filter(Boolean)
      .map((value) => String(value).split('||')[0]?.trim())
      .filter(Boolean)
    const missing = (objectiveEvidenceIds || []).filter((docId) => !documentNameMap[docId])
    if (missing.length === 0) return

    let isMounted = true
    Promise.all(
      missing.map((docId) =>
        documentService.getDocumentDownloadInfo(docId, { suppressNotFound: true })
          .then((info) => {
            const resolvedName =
              info?.attachment?.filename ||
              info?.attachment?.original_filename ||
              info?.document?.original_filename ||
              info?.document?.filename ||
              info?.filename
            return resolvedName ? [docId, resolvedName] : null
          })
          .catch(() => null)
      )
    ).then((entries) => {
      if (!isMounted) return
      const mapped = entries.filter(Boolean).reduce((acc, [docId, name]) => ({ ...acc, [docId]: name }), {})
      if (Object.keys(mapped).length > 0) {
        setDocumentNameMap((prev) => ({ ...prev, ...mapped }))
      }
    })

    return () => {
      isMounted = false
    }
  }, [findingData, documentNameMap])

  const getObjectiveEvidenceLabel = useCallback(
    (value) => {
      if (!value) return '-'
      const rawValue = String(value)
      const [docId, ...noteParts] = rawValue.split('||')
      const note = noteParts.join('||').trim()
      const normalizedDocId = docId.trim()
      const baseLabel = documentNameMap[normalizedDocId] || (normalizedDocId ? `Dokumen-${normalizedDocId.substring(0, 8)}` : rawValue)
      return note ? `${baseLabel} - ${note}` : baseLabel
    },
    [documentNameMap]
  )

  const resolveUserIdFromIdentity = useCallback(async (person) => {
    if (!person) return null

    const directId = person?.user_id || person?.userId || person?.id || person?.user?.id
    if (directId) return directId

    const nip = person?.nip || person?.employee_id || person?.employeeId
    const name = person?.name || person?.full_name || person?.fullName
    const terms = [nip, name].filter(Boolean)

    for (const term of terms) {
      try {
        const res = await api.get('/users', { params: { search: term, per_page: 50 } })
        const users = res?.data?.data?.users ?? []
        const normalizedTerm = String(term).trim().toLowerCase()

        const match = users.find((user) => {
          const username = String(user?.username || '').trim().toLowerCase()
          const fullName = String(user?.user?.profile?.full_name || '').trim().toLowerCase()
          return (nip && username === normalizedTerm) || (name && fullName === normalizedTerm)
        })

        if (match?.id || match?.user_id) {
          return match.id || match.user_id
        }
      } catch {
        // ignore lookup errors and continue
      }
    }

    return null
  }, [])

  const fetchSignatureBlob = useCallback(async (userId) => {
    if (!userId) return null
    try {
      const res = await api.get(`/users/${userId}/signature/download`, { responseType: 'blob' })
      return res?.data instanceof Blob ? res.data : null
    } catch {
      return null
    }
  }, [])

  const resolveSignatures = useCallback(async () => {
    const [auditorUserId, auditeeUserId] = await Promise.all([
      resolveUserIdFromIdentity(findingData?.auditor),
      resolveUserIdFromIdentity(findingData?.auditee)
    ])

    const [auditorBlob, auditeeBlob] = await Promise.all([
      fetchSignatureBlob(auditorUserId),
      fetchSignatureBlob(auditeeUserId)
    ])

    return { auditorBlob, auditeeBlob }
  }, [fetchSignatureBlob, resolveUserIdFromIdentity, findingData])

  // PERBAIKAN: Handler untuk export PDF menggunakan PDFGenerator
  const handleExportPdf = useCallback(async () => {
    if (!printRef.current) return

    if (!findingData) {
      toast({
        variant: 'destructive',
        title: 'Data temuan belum tersedia',
        description: 'Silakan isi data temuan terlebih dahulu sebelum ekspor PDF.',
      })
      return
    }

    if (isExporting || isPreviewing) return

    try {
      setIsExporting(true)
      const { auditorBlob, auditeeBlob } = await resolveSignatures()

      setAuditeeSignatureDataUrl(null)
      setSignatureDataUrl(null)

      if (auditeeBlob) {
        const auditeeDataUrl = await toDataUrl(auditeeBlob)
        setAuditeeSignatureDataUrl(typeof auditeeDataUrl === 'string' ? auditeeDataUrl : null)
      }

      const auditorSignatureDownloader = auditorBlob
        ? {
            mutateAsync: async () => auditorBlob,
          }
        : null

      await generatePDF({
        printRef,
        topicId,
        hasSignature: Boolean(auditorBlob),
        downloadSignature: auditorSignatureDownloader,
        toDataUrl,
        setSignatureDataUrl,
        ensureImagesLoaded,
        mode: 'download'
      })
    } finally {
      setIsExporting(false)
    }
  }, [
    printRef, 
    topicId, 
    toDataUrl, 
    setSignatureDataUrl, 
    ensureImagesLoaded,
    isExporting,
    isPreviewing,
    resolveSignatures
  ])

  const handlePreviewPdf = useCallback(async () => {
    if (!printRef.current) return

    if (!findingData) {
      toast({
        variant: 'destructive',
        title: 'Data temuan belum tersedia',
        description: 'Silakan isi data temuan terlebih dahulu sebelum preview PDF.',
      })
      return
    }

    if (isExporting || isPreviewing) return

    try {
      setIsPreviewing(true)
      const { auditorBlob, auditeeBlob } = await resolveSignatures()

      setAuditeeSignatureDataUrl(null)
      setSignatureDataUrl(null)

      if (auditeeBlob) {
        const auditeeDataUrl = await toDataUrl(auditeeBlob)
        setAuditeeSignatureDataUrl(typeof auditeeDataUrl === 'string' ? auditeeDataUrl : null)
      }

      const auditorSignatureDownloader = auditorBlob
        ? {
            mutateAsync: async () => auditorBlob,
          }
        : null

      await generatePDF({
        printRef,
        topicId,
        hasSignature: Boolean(auditorBlob),
        downloadSignature: auditorSignatureDownloader,
        toDataUrl,
        setSignatureDataUrl,
        ensureImagesLoaded,
        mode: 'preview'
      })
    } finally {
      setIsPreviewing(false)
    }
  }, [
    printRef,
    topicId,
    toDataUrl,
    setSignatureDataUrl,
    ensureImagesLoaded,
  findingData,
  findingData,
    isExporting,
    isPreviewing,
    resolveSignatures
  ])

  // Handlers
  const closeDialog = useCallback(() => {
    setActiveAction(null)
    setNote('')
    setNoteError(null)
  }, [])

  const handleSuccess = useCallback((message) => {
    toast({ title: 'Berhasil', description: message })
    closeDialog()
  }, [closeDialog])

  const handleError = useCallback((err) => {
    const message = buildErrorMessage(err)
    if (String(message).toLowerCase().includes('topic is frozen')) {
      toast({
        variant: 'destructive',
        title: 'Topik sedang dibekukan',
        description: 'Aksi tidak dapat dilakukan karena topik sedang dibekukan.',
      })
      return
    }
    toast({
      variant: 'destructive',
      title: 'Gagal',
      description: message,
    })
  }, [])

  // PERBAIKAN: Handler untuk menyimpan finding
  const handleSaveFinding = useCallback(async (formData) => {
    try {
      if (String(topic?.status || '').toLowerCase() === 'closed') {
        toast({
          variant: 'destructive',
          title: 'Topik sudah ditutup',
          description: 'Perubahan temuan tidak diizinkan untuk topik yang sudah ditutup.',
        })
        return
      }
      const inputItem = convertFormToInputItem(formData)
      
      await createInputItemMutation.mutateAsync({
        topicId,
        data: inputItem,
        inputItemId: findingInputItemId
      })
      
      setFindingData(formData)
      setShowFindingForm(false)
      handleSuccess('Data temuan berhasil disimpan')
      
      // Refresh data topic
      refetch()
    } catch (err) {
      handleError(err)
    }
  }, [topic?.status, topicId, createInputItemMutation, handleSuccess, handleError, refetch, findingInputItemId])

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
    onSuccess: () => {
      handleSuccess('Topik berhasil ditutup.')
      toast({
        title: 'Topik ditutup',
        description: 'Topik berhasil ditutup.',
      })
    },
    onError: handleError,
  })

  const reopenTopicMutation = useReopenTopic({
    onSuccess: () => {
      handleSuccess('Topik berhasil dibuka kembali.')
      toast({
        title: 'Topik dibuka kembali',
        description: 'Topik berhasil dibuka kembali.',
      })
    },
    onError: handleError,
  })

  const freezeTopicMutation = useFreezeTopic({
    onSuccess: () => {
      handleSuccess('Topik berhasil dibekukan.')
      toast({
        title: 'Berhasil',
        description: 'Topik berhasil dibekukan.',
      })
    },
    onError: handleError,
  })

  const unfreezeTopicMutation = useUnfreezeTopic({
    onSuccess: () => {
      handleSuccess('Pembekuan topik telah dilepas.')
      toast({
        title: 'Berhasil',
        description: 'Pembekuan topik telah dilepas.',
      })
    },
    onError: handleError,
  })

  // Derived data
  const versions = versionsData?.versions ?? []
  const versionsErrorMessage = versionsErrorObj?.response?.data?.message || versionsErrorObj?.message || 'Gagal memuat riwayat versi.'
  
  const inputItems = useMemo(() => {
    const rawItems = resolvedInputItems
    
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
  }, [resolvedInputItems])

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
  const roomName = topic?.forum?.name || topic?.room?.name || 'Tidak ada informasi'
  const isFrozen = Boolean(topic?.is_frozen || topic?.frozen_at)
  const isClosed = String(topic?.status || '').toLowerCase() === 'closed'
  const versionDisplay = topic ? `v${topic.version_major}.${topic.version_minor}` : ''

  const isTopicDeadlinePassed = Boolean(
    topic?.deadline_at && new Date(topic.deadline_at) < new Date()
  )

  // The period deadline should lock down topic editing too.
  // Backend usually exposes this flag at forum level when topic is loaded with its forum.
  const resolvePeriodDeadlinePassed = () => {
    // Always reference the *period* (forum_period_*) fields, never forum/topic deadlines.
    return isPeriodDeadlinePassedUtil(topic?.forum) || isPeriodDeadlinePassedUtil(topic?.room)
  }

  const isPeriodDeadlinePassed = resolvePeriodDeadlinePassed()

  const normalizeParticipantRole = (role) => String(role || '').trim().toLowerCase()

  const currentUserForumRole = useMemo(() => {
    const embeddedRole =
      topic?.current_user_role ??
      topic?.user_role ??
      topic?.current_user_participant?.role
    if (embeddedRole) return normalizeParticipantRole(embeddedRole)

    const currentUserId = currentUser?.id
    if (!currentUserId) return ''
    const normalizedId = String(currentUserId)
    const participants = forumParticipants.length ? forumParticipants : (topic?.participants ?? [])
    const match = participants.find((p) => String(p?.user_id ?? p?.user?.id ?? '') === normalizedId)
    return normalizeParticipantRole(match?.role)
  }, [currentUser?.id, forumParticipants, topic])

  const isCurrentUserAuditor = currentUserForumRole === 'auditor'
  const isFindingLockedByDeadline = isTopicDeadlinePassed || isPeriodDeadlinePassed
  const isFindingReadOnly = isFindingLockedByDeadline || !isCurrentUserAuditor

  useEffect(() => {
    if (isClosed) {
      setShowFindingForm(false)
    }
  }, [isClosed])

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
      <div className="mx-auto max-w-full px-3 py-4 sm:px-6 sm:py-6">
        <div className="mb-4">
          <TopicBreadcrumb title={topic?.title} />
        </div>

        {isLoading && <TopicDetailSkeleton />}

        {isError && (
          <ErrorAlert 
            error={topicError} 
            onRetry={refetch} 
            message={topicError?.response?.data?.message || topicError?.message || 'Silakan coba ulang.'} 
          />
        )}

        {!isLoading && topic && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
            {/* Main Content */}
            <div className="lg:col-span-8 space-y-4">
              <TopicHeader 
                topic={topic} 
                authorName={authorName} 
                roomName={roomName} 
                versionDisplay={versionDisplay}
              />

              {/* Finding Section - Form Daftar Temuan */}
              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-base font-semibold sm:text-lg">Daftar Temuan Ketidaksesuaian</h3>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviewPdf}
                        disabled={isExporting || isPreviewing}
                        className="w-full sm:w-auto"
                      >
                        {isPreviewing ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Membuka...
                          </span>
                        ) : (
                          'Preview PDF'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPdf}
                        disabled={isExporting || isPreviewing}
                        className="w-full sm:w-auto"
                      >
                        {isExporting ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Mengekspor...
                          </span>
                        ) : (
                          'Export PDF'
                        )}
                      </Button>
                      {!isFindingLockedByDeadline && isCurrentUserAuditor && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowFindingForm(!showFindingForm)}
                          disabled={createInputItemMutation.isLoading || isClosed}
                          className="col-span-2 w-full sm:col-span-1 sm:w-auto"
                        >
                          {createInputItemMutation.isLoading ? (
                            <>Menyimpan...</>
                          ) : isClosed ? (
                            'Temuan Dikunci'
                          ) : showFindingForm ? (
                            'Sembunyikan Form'
                          ) : findingData ? (
                            'Edit Temuan'
                          ) : (
                            'Tambah Temuan'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  {isFindingLockedByDeadline && (
                    <p className="text-xs text-amber-600 mt-1">
                      Deadline sudah lewat. Penambahan/perubahan temuan dinonaktifkan.
                    </p>
                  )}
                  {isClosed && (
                    <p className="text-xs text-muted-foreground">
                      Topik sudah ditutup. Edit temuan akan aktif kembali setelah topik dibuka.
                    </p>
                  )}

                  {showFindingForm ? (
                    <FindingForm 
                      onSubmit={handleSaveFinding}
                      initialData={findingData}
                      forumId={forumId}
                      readOnly={isFindingReadOnly}
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
                      forumId={forumId}
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
              deadlineAt={topic.deadline_at}
            />
          </div>
        )}
      </div>

      <div
        ref={printRef}
        data-print-root="true"
        style={{
          position: 'fixed',
          left: '-10000px',
          top: 0,
          display: 'block',
          width: '1123px',
          padding: '28px 32px',
          fontFamily: '"Times New Roman", serif',
          fontSize: '12px',
          color: '#111827',
          backgroundColor: '#ffffff',
          lineHeight: 1.4,
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #111827', width: '34%', padding: '12px', textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  {logoDataUrl ? (
                    <img
                      src={logoDataUrl}
                      alt="Logo Unila"
                      style={{ width: '68px', height: '68px' }}
                      crossOrigin="anonymous"
                    />
                  ) : null}
                  <div style={{ fontSize: '10px', lineHeight: 1.9, textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold' }}>KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI</div>
                    <div style={{ fontWeight: 'bold' }}>UNIVERSITAS LAMPUNG</div>
                    <div style={{ fontWeight: 'bold' }}>UPA TEKNOLOGI INFORMASI DAN KOMUNIKASI</div>
                    <div>Jl. Prof. Dr. Sumantri Brojonegoro No. 1 Bandar Lampung 35145</div>
                    <div>Telp (0721) 702673. Fax (0721) 702767</div>
                    <div>e-mail: tik@kpa.unila.ac.id</div>
                  </div>
                </div>
              </td>
              <td style={{ border: '1px solid #111827', width: '33%', textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '12px', paddingTop: '12px', lineHeight: 1.35 }}>FORMULIR</div>
                <div style={{ borderTop: '1px solid #111827', margin: '10px 0' }} />
                <div style={{ fontWeight: 'bold', fontSize: '12px', paddingBottom: '12px', lineHeight: 1.35 }}>
                  DAFTAR TEMUAN KETIDAKSESUAIAN
                </div>
              </td>
              <td style={{ border: '1px solid #111827', width: '33%', fontSize: '10px' }}>
                <div style={{ padding: '7px 10px', borderBottom: '1px solid #111827', lineHeight: 1.35 }}>
                  <div>No. Dokumen</div>
                  <div style={{ fontWeight: 'bold', lineHeight: 0, margin: '5px 0' }}>{findingData?.document_number || FORM_DOC_NUMBER}</div>
                </div>
                <div style={{ padding: '7px 10px', borderBottom: '1px solid #111827', lineHeight: 1.5 }}>
                  <div>Tanggal Terbit</div>
                  <div style={{ fontWeight: 'bold', lineHeight: 0, margin: '5px 0' }}>{findingData?.issued_date || FORM_ISSUED_DATE}</div>
                </div>
                <div style={{ padding: '7px 10px', lineHeight: 1.5 }}>
                  <div>No. Revisi</div>
                  <div style={{ fontWeight: 'bold', lineHeight: 0, margin: '5px 0' }}>{findingData?.revision_number || FORM_REVISION}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <table style={{ width: '100%', marginBottom: '12px', lineHeight: 2 }}>
          <tbody>
            <tr>
              <td style={{ width: '25%', padding: '2px 0' }}>Kode / Nomor Audit</td>
              <td style={{ width: '2%', lineHeight: 2 }}>:</td>
              <td>{findingData?.audit_code || '-'}</td>
            </tr>
            <tr>
              <td>Proses / Layanan / Unit Diaudit</td>
              <td>:</td>
              <td>{findingData?.audited_unit || '-'}</td>
            </tr>
            <tr>
              <td>Tanggal Audit</td>
              <td>:</td>
              <td>{findingData?.audit_date || '-'}</td>
            </tr>
            <tr>
              <td>Auditor</td>
              <td>:</td>
              <td>{findingData?.auditor?.name || '-'}{findingData?.auditor?.nip ? ` (${findingData.auditor.nip})` : ''}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ textAlign: 'center', fontWeight: 'bold', margin: '12px 0 6px' }}>DAFTAR TEMUAN KETIDAKSESUAIAN</div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #111827', padding: '8px 6px', textAlign: 'center', lineHeight: 1.35 }}>No</th>
              <th style={{ border: '1px solid #111827', padding: '8px 6px', lineHeight: 1.35 }}>Jenis Temuan</th>
              <th style={{ border: '1px solid #111827', padding: '8px 6px', lineHeight: 1.35 }}>Uraian Temuan</th>
              <th style={{ border: '1px solid #111827', padding: '8px 6px', lineHeight: 1.35 }}>Klausul / Acuan (ISO/POS/IK)</th>
              <th style={{ border: '1px solid #111827', padding: '8px 6px', lineHeight: 1.35 }}>Bukti Objektif</th>
            </tr>
          </thead>
          <tbody>
            {(findingData?.findings || []).map((finding) => (
              <tr key={finding.no}>
                <td style={{ border: '1px solid #111827', padding: '8px 6px', textAlign: 'center' }}>{finding.no}</td>
                <td style={{ border: '1px solid #111827', padding: '8px 6px', lineHeight: 1.4, width: '10%' }}>
                  {(() => {
                    const rawType = String(finding.finding_type || '').toLowerCase().trim()
                    let normalizedType = rawType
                    if (rawType.includes('observ')) normalizedType = 'observation'
                    if (rawType.includes('mayor')) normalizedType = 'major'
                    if (rawType.includes('minor')) normalizedType = 'minor'
                    return (
                      <>
                        <div style={{ marginBottom: '4px' }}>({normalizedType === 'minor' ? '✓' : ' '}) Minor</div>
                        <div style={{ marginBottom: '4px' }}>({normalizedType === 'major' ? '✓' : ' '}) Mayor</div>
                        <div>({normalizedType === 'observation' ? '✓' : ' '}) Observasi</div>
                      </>
                    )
                  })()}
                </td>
                <td style={{ border: '1px solid #111827', padding: '8px 6px', lineHeight: 1.4 }}>{finding.finding_description}</td>
                <td style={{ border: '1px solid #111827', padding: '8px 6px', lineHeight: 1.4 }}>
                  {(finding.clause_references || []).map((ref) => (
                    <div key={ref} style={{ marginBottom: '2px' }}>• {resolveClauseLabel(ref)}</div>
                  ))}
                </td>
                <td style={{ border: '1px solid #111827', padding: '8px 6px', lineHeight: 1.4 }}>
                  {getObjectiveEvidenceLabel(finding.objective_evidence)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div data-page-break="signature">
          <div style={{ fontSize: '10px', lineHeight: 1.4, margin: '2px 0 14px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>*Keterangan kategori:</div>
            <div style={{ marginBottom: '2px' }}>- Minor : Ketidaksesuaian yang tidak berpengaruh signifikan terhadap efektivitas SMKI.</div>
            <div style={{ marginBottom: '2px' }}>- Mayor : Ketidaksesuaian yang berpotensi mengganggu tercapainya sasaran SMKI / tidak terpenuhinya persyaratan penting.</div>
            <div>- Observasi : Temuan potensial / peluang perbaikan yang belum menjadi ketidaksesuaian.</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #111827', padding: '20px', textAlign: 'center' }}>
                  <div style={{ marginBottom: '40px' }}>Auditor,</div>
                  {typeof signatureDataUrl === 'string' && signatureDataUrl.startsWith('data:') ? (
                    <img
                      src={signatureDataUrl}
                      alt="Tanda tangan"
                      style={{ height: '48px', objectFit: 'contain', margin: '0 auto 6px' }}
                      crossOrigin="anonymous"
                    />
                  ) : null}
                  <div style={{ marginBottom: '4px' }}>{findingData?.auditor?.name || ' '}</div>
                  <div>NIP. {findingData?.auditor?.nip || ' '}</div>
                </td>
                <td style={{ border: '1px solid #111827', padding: '20px', textAlign: 'center' }}>
                  <div style={{ marginBottom: '40px' }}>Auditee</div>
                  {typeof auditeeSignatureDataUrl === 'string' && auditeeSignatureDataUrl.startsWith('data:') ? (
                    <img
                      src={auditeeSignatureDataUrl}
                      alt="Tanda tangan auditee"
                      style={{ height: '60px', objectFit: 'contain', margin: '0 auto 6px', lineHeight: 0 }}
                      crossOrigin="anonymous"
                    />
                  ) : null}
                  <div style={{ marginBottom: '4px' }}>{findingData?.auditee?.name || ' '}</div>
                  <div>NIP. {findingData?.auditee?.nip || ' '}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
