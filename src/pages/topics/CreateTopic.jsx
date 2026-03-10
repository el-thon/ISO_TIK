import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, Trash2, Loader2, ChevronsUpDown, FileText, Calendar, User, Building2, Lock, Save, X } from 'lucide-react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRooms, useRoomParticipants } from '@/services/roomHooks'
import { useCreateTopic, useCreateInputItem } from '@/services/topicHooks'
import * as documentService from '@/services/documentService'
import { cn } from '@/lib/utils'
import { useAdminClauses } from '@/services/adminClauseHooks'

// PERBAIKAN: Security options
const securityOptions = [
  { value: 'L0', label: 'L0 - Publik', description: 'Dapat diakses semua orang' },
  { value: 'L1', label: 'L1 - Internal', description: 'Hanya internal organisasi' },
  { value: 'L2', label: 'L2 - Rahasia', description: 'Akses terbatas' },
  { value: 'L3', label: 'L3 - Sangat Rahasia', description: 'Akses sangat terbatas' },
]

const FINDING_TYPES = [
  { value: 'minor', label: 'Minor', color: 'bg-yellow-100 text-yellow-800', description: 'Ketidaksesuaian ringan' },
  { value: 'major', label: 'Mayor', color: 'bg-orange-100 text-orange-800', description: 'Ketidaksesuaian signifikan' },
  { value: 'observation', label: 'Observasi', color: 'bg-blue-100 text-blue-800', description: 'Catatan untuk perbaikan' },
]

// Utility functions
const normalizeId = (value) => {
  if (value == null) return undefined
  const numeric = Number(value)
  return Number.isNaN(numeric) ? value : numeric
}

const buildClauseLabel = (clause) => {
  if (!clause) return ''
  if (clause.code && clause.name) return `${clause.code} - ${clause.name}`
  return clause.name || clause.code || ''
}

const stringifyId = (value) => {
  if (value == null) return null
  if (typeof value === 'string') return value.trim() || null
  if (typeof value === 'number' && !Number.isNaN(value)) return String(value)
  return null
}

const extractIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null
  try {
    const parsed = typeof window !== 'undefined' ? new URL(url, window.location.origin) : new URL(url)
    const match = parsed.pathname.match(/topics\/([^/]+)/i)
    return match?.[1] ?? null
  } catch (err) {
    const fallbackMatch = url.match(/topics\/([^/]+)/i)
    return fallbackMatch?.[1] ?? null
  }
}

const findUuidInValue = (value) => {
  if (!value) return null
  const str = typeof value === 'string' ? value : JSON.stringify(value)
  const match = str && str.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/)
  return match?.[0] ?? null
}

const isLikelyTopicId = (value) => {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (/^[0-9a-fA-F-]{32,40}$/.test(trimmed)) return true
  if (/^\d{1,20}$/.test(trimmed)) return true
  return false
}

const resolveCreatedTopicId = (payload) => {
  if (!payload || typeof payload !== 'object') return null

  const candidates = [
    payload.id,
    payload.topic_id,
    payload.topic_uuid,
    payload.uuid,
    payload.topic?.id,
    payload.topic?.topic_id,
    payload.topic?.uuid,
    payload.data?.id,
    payload.data?.topic_id,
    payload.data?.topic?.id,
    payload.meta?.topic_id,
    payload.result?.id,
    payload.result?.topic_id,
    payload.message?.topic_id,
    payload.message?.id,
    payload.message?.topic?.id,
  ]

  for (const candidate of candidates) {
    const normalized = stringifyId(candidate)
    if (normalized && isLikelyTopicId(normalized)) return normalized
  }

  const linkCandidates = [
    payload.redirect_url,
    payload.topic_url,
    payload.links?.detail,
    payload.links?.self,
    payload.topic?.url,
  ]
  for (const link of linkCandidates) {
    const normalized = extractIdFromUrl(link)
    if (normalized && isLikelyTopicId(normalized)) return normalized
  }

  const messageUuid = findUuidInValue(payload.message)
  if (messageUuid) return messageUuid

  const rawUuid = findUuidInValue(payload)
  if (rawUuid) return rawUuid

  return null
}

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return '-'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

// Komponen MultiSelect untuk klausul
function MultiSelect({ options, value, onChange, placeholder = 'Pilih klausul...', loading = false }) {
  const selected = new Set(value)
  const toggle = (val) => {
    if (selected.has(val)) {
      onChange(value.filter((item) => item !== val))
    } else {
      onChange([...value, val])
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between h-10">
          <span className="truncate flex items-center gap-2">
            {value.length > 0 ? (
              <>
                <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                  {value.length}
                </Badge>
                <span>{value.length} klausul dipilih</span>
              </>
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <div className="max-h-[300px] overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : options.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              Tidak ada klausul tersedia
            </div>
          ) : (
            <div className="space-y-1">
              {options.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-start gap-2 p-2 rounded-md text-sm cursor-pointer hover:bg-accent",
                    selected.has(option.value) && "bg-accent"
                  )}
                >
                  <Checkbox
                    checked={selected.has(option.value)}
                    onCheckedChange={() => toggle(option.value)}
                    className="mt-0.5"
                  />
                  <span className="leading-tight flex-1">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// KOMPONEN: DocumentSelect untuk menampilkan nama asli file
function DocumentSelect({ value, onChange, disabled, documents, loading }) {
  const [documentNames, setDocumentNames] = useState({})
  const [loadingNames, setLoadingNames] = useState({})

  useEffect(() => {
    const fetchOriginalNames = async () => {
      const names = {}
      const loading = {}
      
      for (const doc of documents) {
        if (!doc.original_filename && !doc.display_name) {
          loading[doc.id] = true
          try {
            const info = await documentService.getDocumentDownloadInfo(doc.id, { suppressNotFound: true })
            if (info?.document?.original_filename) {
              names[doc.id] = info.document.original_filename
            }
          } finally {
            loading[doc.id] = false
          }
        }
      }
      
      setDocumentNames(names)
      setLoadingNames(loading)
    }

    if (documents.length > 0) {
      fetchOriginalNames()
    }
  }, [documents])

  const getDisplayName = (doc) => {
    if (documentNames[doc.id]) return documentNames[doc.id]
    if (doc.display_name) return doc.display_name
    if (doc.original_filename) return doc.original_filename
    if (doc.filename) return doc.filename
    if (doc.name) return doc.name
    return `Dokumen-${doc.id.substring(0, 8)}`
  }

  const isLoading = (docId) => loadingNames[docId]

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={loading ? 'Memuat dokumen...' : 'Pilih dokumen pendukung'} />
      </SelectTrigger>
      <SelectContent className="w-full min-w-[300px] max-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            Tidak ada dokumen tersedia
          </div>
        ) : (
          documents.map((document) => (
            <SelectItem key={document.id} value={String(document.id)} className="py-2">
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate" title={getDisplayName(document)}>
                      {getDisplayName(document)}
                    </span>
                    {isLoading(document.id) && (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                  {document.size && (
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(document.size)}
                    </span>
                  )}
                </div>
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}

// Komponen FindingItem
function FindingItem({ index, finding, onUpdate, onRemove, showRemove, clauseOptions, clausesLoading, documents, documentsLoading }) {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
              {index + 1}
            </Badge>
            <span className="text-sm font-medium">Temuan #{index + 1}</span>
          </div>
          {showRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(index)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Jenis Temuan</Label>
            <Select
              value={finding.findingType}
              onValueChange={(value) => onUpdate(index, { findingType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis temuan" />
              </SelectTrigger>
              <SelectContent>
                {FINDING_TYPES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("px-1.5 py-0", option.color)}>
                        {option.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Klausul / Acuan</Label>
            <MultiSelect
              options={clauseOptions}
              value={finding.clauseReferences}
              onChange={(value) => onUpdate(index, { clauseReferences: value })}
              placeholder={clausesLoading ? 'Memuat klausul...' : 'Pilih klausul'}
              loading={clausesLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Uraian Temuan</Label>
          <textarea
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={finding.findingDescription}
            onChange={(e) => onUpdate(index, { findingDescription: e.target.value })}
            placeholder="Jelaskan temuan secara detail..."
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Bukti Objektif</Label>
          <DocumentSelect
            value={finding.objectiveEvidence}
            onChange={(value) => onUpdate(index, { objectiveEvidence: value })}
            disabled={documentsLoading}
            documents={documents}
            loading={documentsLoading}
          />
          {finding.objectiveEvidence && (
            <p className="text-xs text-muted-foreground mt-1">
              ID Dokumen: {finding.objectiveEvidence}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Main Component
export default function CreateTopic() {
  const navigate = useNavigate()
  const location = useLocation()
  const forumFromState = location?.state?.roomId ? String(location.state.roomId) : ''
  const forumTitleFromState = location?.state?.roomTitle || null

  const [selectedForum, setSelectedForum] = useState(forumFromState)
  const [securityLevel, setSecurityLevel] = useState('L1')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('audit-info')
  const [serverError, setServerError] = useState(null)

  const [auditCode, setAuditCode] = useState('')
  const [auditedUnit, setAuditedUnit] = useState('')
  const [auditDate, setAuditDate] = useState('')
  const [auditorName, setAuditorName] = useState('')
  const [auditorNip, setAuditorNip] = useState('')
  const [auditeeName, setAuditeeName] = useState('')
  const [auditeeNip, setAuditeeNip] = useState('')
  const [selectedAuditorId, setSelectedAuditorId] = useState('')
  const [selectedAuditeeId, setSelectedAuditeeId] = useState('')

  const [findings, setFindings] = useState([
    {
      findingType: 'minor',
      findingDescription: '',
      clauseReferences: [],
      objectiveEvidence: '',
    },
  ])
  const [documents, setDocuments] = useState([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [documentsError, setDocumentsError] = useState(null)

  useEffect(() => {
    if (!selectedForum && forumFromState) {
      setSelectedForum(forumFromState)
    }
  }, [forumFromState, selectedForum])

  // Load rooms
  const {
    data: roomsData,
    isLoading: roomsLoading,
    isError: roomsError,
    error: roomsErrorObj,
    refetch: refetchRooms,
  } = useRooms({ per_page: 100 })
  
  const rooms = roomsData?.rooms ?? []

  // Load clauses
  const {
    data: clausesData,
    isLoading: clausesLoading,
    isError: clausesError,
    error: clausesErrorObj,
    refetch: refetchClauses,
  } = useAdminClauses({ is_active: true, per_page: 100 })
  
  const clauses = clausesData?.clauses ?? []
  
  const clauseOptions = useMemo(
    () => clauses.map((clause) => ({ value: String(clause.id), label: buildClauseLabel(clause) })),
    [clauses]
  )
  
  // Hooks
  const createTopic = useCreateTopic()
  const createInputItem = useCreateInputItem()
  const isBusy = createTopic.isPending || createInputItem.isPending || submitting

  const participantsParams = useMemo(() => ({ per_page: 100 }), [])
  const {
    data: participantsData,
    isLoading: participantsLoading,
    isError: participantsError,
    error: participantsErrorObj,
  } = useRoomParticipants(selectedForum || forumFromState, participantsParams, {
    enabled: Boolean(selectedForum || forumFromState),
  })

  const participants = participantsData?.participants ?? []

  const participantLabel = (participant) => {
    const fullName = participant?.user?.profile?.full_name
    const username = participant?.user?.username
    return fullName ? `${fullName}${username ? ` (${username})` : ''}` : username || 'Pengguna'
  }

  const normalizeRole = (role) => (role || '').toLowerCase()

  const auditorOptions = useMemo(() => {
    const filtered = participants.filter((p) => normalizeRole(p.role) === 'auditor')
    return filtered.length ? filtered : participants
  }, [participants])

  const auditeeOptions = useMemo(() => {
    const filtered = participants.filter((p) => normalizeRole(p.role) === 'auditee')
    return filtered.length ? filtered : participants
  }, [participants])

  useEffect(() => {
    if (!selectedAuditorId) {
      setAuditorName('')
      setAuditorNip('')
      return
    }
    const match = participants.find((p) => String(p.user_id || p.user?.id) === String(selectedAuditorId))
    if (match) {
      setAuditorName(match.user?.profile?.full_name || match.user?.username || '')
      setAuditorNip(match.user?.employee_id || '')
    }
  }, [selectedAuditorId, participants])

  useEffect(() => {
    if (!selectedAuditeeId) {
      setAuditeeName('')
      setAuditeeNip('')
      return
    }
    const match = participants.find((p) => String(p.user_id || p.user?.id) === String(selectedAuditeeId))
    if (match) {
      setAuditeeName(match.user?.profile?.full_name || match.user?.username || '')
      setAuditeeNip(match.user?.employee_id || '')
    }
  }, [selectedAuditeeId, participants])

  // Load dokumen
  useEffect(() => {
    const loadDocuments = async () => {
      setDocumentsLoading(true)
      setDocumentsError(null)
      try {
        const res = await documentService.listDocuments({ per_page: 100 })
        const rawDocuments = res?.documents ?? []
        
        const transformedDocs = rawDocuments.map(doc => {
          const displayName = doc.original_filename || 
                             doc.filename || 
                             doc.name || 
                             doc.file_name || 
                             `Dokumen-${doc.id.substring(0, 8)}`
          
          return {
            ...doc,
            display_name: displayName
          }
        })
        
        setDocuments(transformedDocs)
      } catch (err) {
        setDocumentsError(err?.response?.data?.message || err?.message || 'Gagal memuat dokumen.')
      } finally {
        setDocumentsLoading(false)
      }
    }

    loadDocuments()
  }, [])

  const currentForumName = useMemo(() => {
    if (selectedForum) {
      const match = rooms.find((room) => String(room.id) === String(selectedForum))
      if (match) return match.name
    }
    return forumTitleFromState || '-'
  }, [rooms, selectedForum, forumTitleFromState])

  const addFinding = () => {
    setFindings((prev) => [
      ...prev,
      {
        findingType: 'minor',
        findingDescription: '',
        clauseReferences: [],
        objectiveEvidence: '',
      },
    ])
    setActiveTab('findings')
  }

  const removeFinding = (index) => {
    setFindings((prev) => prev.filter((_, idx) => idx !== index))
  }

  const updateFinding = (index, patch) => {
    setFindings((prev) => prev.map((row, idx) => (idx === index ? { ...row, ...patch } : row)))
  }

  const validatePhase1 = () => {
    const validationErrors = {}
    const chosenForum = selectedForum || forumFromState || ''
    if (!chosenForum) validationErrors.forum = 'Pilih forum terlebih dahulu.'
    if (!auditCode.trim()) validationErrors.auditCode = 'Kode/nomor audit wajib diisi.'
    if (!auditedUnit.trim()) validationErrors.auditedUnit = 'Proses/layanan/unit wajib diisi.'
    if (!auditDate.trim()) validationErrors.auditDate = 'Tanggal audit wajib diisi.'
    if (!auditorName.trim()) validationErrors.auditorName = 'Nama auditor wajib diisi.'
    if (!findings.length || !findings.some((row) => row.findingDescription.trim())) {
      validationErrors.findings = 'Minimal satu temuan harus diisi.'
    }
    setErrors(validationErrors)
    return { ok: Object.keys(validationErrors).length === 0, chosenForum }
  }

  const handleSubmit = async (mode) => {
    // Reset server error
    setServerError(null)
    
    const { ok, chosenForum } = validatePhase1()
    if (!ok) {
      if (errors.auditCode || errors.auditedUnit || errors.auditDate || errors.auditorName || errors.forum) {
        setActiveTab('audit-info')
      } else if (errors.findings) {
        setActiveTab('findings')
      }
      return
    }
    
    setSubmitting(true)
    
    try {
      // STEP 1: Create topic
      const topicPayload = {
        title: auditCode.trim() || `Audit ${new Date().toLocaleDateString('id-ID')}`,
        description: auditedUnit.trim() || 'Audit tanpa unit',
        security_level: securityLevel,
        status: mode === 'publish' ? 'in_review' : 'draft'
      }
            
      const created = await createTopic.mutateAsync({ 
        forumId: normalizeId(chosenForum), 
        payload: topicPayload
      })
            
      // Extract topic ID from response
      const newTopicId = resolveCreatedTopicId(created)
      
      if (!newTopicId) {
        throw new Error('Topic ID not found in response')
      }
            
      // STEP 2: Create input item untuk topic yang baru dibuat
      const inputItemPayload = {
        type: "form_data",
        label: "Form Daftar Temuan Ketidaksesuaian",
        value: "",
        order_index: 1,
        visibility: "visible",
        metadata: {
          audit_code: auditCode.trim(),
          audited_unit: auditedUnit.trim(),
          audit_date: auditDate,
          auditor: {
            name: auditorName.trim(),
            nip: auditorNip.trim()
          },
          auditee: {
            name: auditeeName.trim(),
            nip: auditeeNip.trim()
          },
          findings: findings.map((row, index) => ({
            no: index + 1,
            finding_type: row.findingType,
            finding_description: row.findingDescription.trim(),
            clause_references: row.clauseReferences,
            objective_evidence: row.objectiveEvidence
          }))
        }
      }
            
      await createInputItem.mutateAsync({
        topicId: newTopicId,
        payload: inputItemPayload
      })
            
      // Navigate to the topic page
      navigate(`/formulir/${newTopicId}`)
      
    } catch (err) {
      
      const errorMessage = err.response?.data?.message || err.message || 'Terjadi kesalahan'
      const errorDetails = err.response?.data?.errors || {}
      
      setServerError(
        <div className="space-y-2">
          <p className="font-semibold">{errorMessage}</p>
          {Object.keys(errorDetails).length > 0 && (
            <ul className="list-disc list-inside text-sm">
              {Object.entries(errorDetails).map(([field, message]) => (
                <li key={field}>{field}: {message}</li>
              ))}
            </ul>
          )}
        </div>
      )
    } finally {
      setSubmitting(false)
    }
  }

  const roomsErrorMessage = roomsErrorObj?.response?.data?.message || roomsErrorObj?.message || ''

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Building2 className="h-4 w-4" />
            <span>Forum: {currentForumName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Form Daftar Temuan Ketidaksesuaian</h1>
          <p className="text-muted-foreground mt-1">Isi data temuan audit sesuai dengan format yang ditentukan</p>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-muted/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Buat Temuan Baru</CardTitle>
                <CardDescription>Lengkapi semua informasi yang diperlukan</CardDescription>
              </div>
              <Badge variant="outline" className="px-3 py-1">
                {securityOptions.find(opt => opt.value === securityLevel)?.label || 'Internal'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="audit-info" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Informasi Audit</span>
                </TabsTrigger>
                <TabsTrigger value="findings" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Daftar Temuan</span>
                </TabsTrigger>
                <TabsTrigger value="parties" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span className="hidden sm:inline">Pihak Terkait</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Informasi Audit */}
              <TabsContent value="audit-info" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Kode / Nomor Audit <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={auditCode}
                      onChange={(e) => setAuditCode(e.target.value)}
                      placeholder="Contoh: AUD-2024-001"
                      className={cn(errors.auditCode && "border-destructive")}
                    />
                    {errors.auditCode && (
                      <p className="text-xs text-destructive">{errors.auditCode}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Proses / Layanan / Unit <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={auditedUnit}
                      onChange={(e) => setAuditedUnit(e.target.value)}
                      placeholder="Contoh: Unit Keuangan"
                      className={cn(errors.auditedUnit && "border-destructive")}
                    />
                    {errors.auditedUnit && (
                      <p className="text-xs text-destructive">{errors.auditedUnit}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Tanggal Audit <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={auditDate}
                        onChange={(e) => setAuditDate(e.target.value)}
                        className={cn("pl-9", errors.auditDate && "border-destructive")}
                      />
                    </div>
                    {errors.auditDate && (
                      <p className="text-xs text-destructive">{errors.auditDate}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Forum <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={selectedForum}
                      onValueChange={(value) => setSelectedForum(value)}
                      disabled={roomsLoading}
                    >
                      <SelectTrigger className={cn(errors.forum && "border-destructive")}>
                        <SelectValue placeholder={roomsLoading ? 'Memuat forum...' : 'Pilih forum'} />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={String(room.id)}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.forum && (
                      <p className="text-xs text-destructive">{errors.forum}</p>
                    )}
                    {roomsError && (
                      <Alert variant="destructive" className="py-2">
                        <AlertDescription className="text-xs flex items-center justify-between">
                          <span>{roomsErrorMessage}</span>
                          <Button variant="ghost" size="sm" onClick={() => refetchRooms()} className="h-6 px-2">
                            Coba lagi
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Daftar Temuan */}
              <TabsContent value="findings" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Daftar Temuan</h3>
                    <p className="text-xs text-muted-foreground">Tambahkan minimal satu temuan</p>
                  </div>
                  <Button type="button" onClick={addFinding} size="sm">
                    <Plus className="h-4 w-4 mr-2" /> Tambah Temuan
                  </Button>
                </div>

                {errors.findings && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-xs">{errors.findings}</AlertDescription>
                  </Alert>
                )}

                {clausesError && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-xs flex items-center justify-between">
                      <span>{clausesErrorObj?.response?.data?.message || clausesErrorObj?.message || 'Gagal memuat klausul.'}</span>
                      <Button variant="ghost" size="sm" onClick={() => refetchClauses()} className="h-6 px-2">
                        Coba lagi
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  {findings.map((finding, index) => (
                    <FindingItem
                      key={index}
                      index={index}
                      finding={finding}
                      onUpdate={updateFinding}
                      onRemove={removeFinding}
                      showRemove={findings.length > 1}
                      clauseOptions={clauseOptions}
                      clausesLoading={clausesLoading}
                      documents={documents}
                      documentsLoading={documentsLoading}
                    />
                  ))}
                </div>
              </TabsContent>

              {/* Tab 3: Pihak Terkait */}
              <TabsContent value="parties" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Auditor</Label>
                    <Select
                      value={selectedAuditorId}
                      onValueChange={setSelectedAuditorId}
                      disabled={participantsLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={participantsLoading ? 'Memuat auditor...' : 'Pilih auditor'} />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        {auditorOptions.map((participant) => (
                          <SelectItem
                            key={participant.id}
                            value={String(participant.user_id || participant.user?.id)}
                          >
                            {participantLabel(participant)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {participantsError && (
                      <p className="text-xs text-destructive">
                        {participantsErrorObj?.response?.data?.message || participantsErrorObj?.message || 'Gagal memuat peserta.'}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Auditor - NIP / Employee ID</Label>
                    <Input value={auditorNip} disabled placeholder="Terisi otomatis" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Auditee</Label>
                    <Select
                      value={selectedAuditeeId}
                      onValueChange={setSelectedAuditeeId}
                      disabled={participantsLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={participantsLoading ? 'Memuat auditee...' : 'Pilih auditee'} />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        {auditeeOptions.map((participant) => (
                          <SelectItem
                            key={participant.id}
                            value={String(participant.user_id || participant.user?.id)}
                          >
                            {participantLabel(participant)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Auditee - NIP / Employee ID</Label>
                    <Input value={auditeeNip} disabled placeholder="Terisi otomatis" />
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tingkat Keamanan</Label>
                  <Select value={securityLevel} onValueChange={setSecurityLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {securityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span>{option.label}</span>
                            <span className="text-xs text-muted-foreground">{option.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pilih tingkat keamanan sesuai klasifikasi data
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Server Error Message */}
            {serverError && (
              <Alert variant="destructive" className="mt-6">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="border-t bg-muted/5 px-6 py-4 flex justify-end gap-3">
            <Button
              variant="outline"
              disabled={isBusy}
              onClick={() => navigate(-1)}
              className="min-w-[100px]"
            >
              <X className="h-4 w-4 mr-2" /> Batal
            </Button>
            <Button
              variant="secondary"
              disabled={isBusy}
              onClick={() => handleSubmit('draft')}
              className="min-w-[100px]"
            >
              {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4 mr-2" /> Draft
            </Button>
            <Button
              disabled={isBusy}
              onClick={() => handleSubmit('publish')}
              className="min-w-[100px] bg-blue-600 hover:bg-blue-700"
            >
              {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Temuan
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  )
}