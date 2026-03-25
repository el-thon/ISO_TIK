import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, Trash2, Loader2, ChevronsUpDown, FileText, Calendar, User, Building2, Lock, Save, X, ArrowLeft } from 'lucide-react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog'
import { useRooms, useRoomParticipants } from '@/services/roomHooks'
import { useCreateTopic, useCreateInputItem } from '@/services/topicHooks'
import * as forumAttachmentService from '@/services/forumAttachmentService'
import * as topicService from '@/services/topicService'
import { cn } from '@/lib/utils'
import { useAdminClauses } from '@/services/adminClauseHooks'

const FINDING_TYPES = [
  { value: 'minor', label: 'Minor', color: 'bg-yellow-100 text-yellow-800', description: 'Ketidaksesuaian ringan' },
  { value: 'major', label: 'Mayor', color: 'bg-orange-100 text-orange-800', description: 'Ketidaksesuaian signifikan' },
  { value: 'observation', label: 'Observasi', color: 'bg-blue-100 text-blue-800', description: 'Catatan untuk perbaikan' },
]

const OBJECTIVE_EVIDENCE_SEPARATOR = '||'

const splitObjectiveEvidence = (value) => {
  if (!value) return { docId: '', note: '' }
  const raw = String(value)
  const [docId, ...noteParts] = raw.split(OBJECTIVE_EVIDENCE_SEPARATOR)
  return { docId, note: noteParts.join(OBJECTIVE_EVIDENCE_SEPARATOR).trim() }
}

const buildObjectiveEvidence = (docId, note) => {
  if (!docId) return note ? `${note}` : ''
  if (!note) return String(docId)
  return `${docId}${OBJECTIVE_EVIDENCE_SEPARATOR}${note}`
}

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
  } catch {
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
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const selected = new Set(value)
  const toggle = (val) => {
    if (selected.has(val)) {
      onChange(value.filter((item) => item !== val))
    } else {
      onChange([...value, val])
    }
  }

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return options
    return options.filter((option) => option.label?.toLowerCase().includes(normalized))
  }, [options, query])

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-between h-10"
        onClick={() => setOpen(true)}
        type="button"
      >
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay className="backdrop-blur-sm" />
          <DialogContent className="max-w-2xl p-0">
            <DialogHeader className="px-6 pt-6">
              <DialogTitle>Daftar Klausul</DialogTitle>
              <DialogDescription>Pilih klausul yang relevan untuk temuan ini.</DialogDescription>
            </DialogHeader>

            <div className="px-6 pb-4">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari klausul..."
              />
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  Tidak ada klausul tersedia
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredOptions.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        "flex items-start gap-2 p-3 rounded-md text-sm cursor-pointer border hover:bg-accent",
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

            <DialogFooter className="px-6 pb-6">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Selesai
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  )
}

// KOMPONEN: DocumentSelect untuk menampilkan nama asli file
function DocumentSelect({ value, onChange, disabled, documents, loading }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
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
            const info = await topicService.getAttachmentDownloadInfo(doc.id)
            if (info?.attachment?.filename) {
              names[doc.id] = info.attachment.filename
            } else if (info?.document?.original_filename) {
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

  const selectedDocument = useMemo(() => {
    if (!value) return null
    return documents.find((doc) => String(doc.id) === String(value)) ?? null
  }, [documents, value])

  const filteredDocuments = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return documents
    return documents.filter((doc) => getDisplayName(doc).toLowerCase().includes(normalized))
  }, [documents, query, documentNames])

  const isLoadingName = (docId) => loadingNames[docId]

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-between h-10"
        onClick={() => setOpen(true)}
        type="button"
        disabled={disabled}
      >
        <span className="truncate flex items-center gap-2">
          {selectedDocument ? (
            <span className="truncate" title={getDisplayName(selectedDocument)}>
              {getDisplayName(selectedDocument)}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {loading ? 'Memuat dokumen...' : 'Pilih dokumen pendukung'}
            </span>
          )}
        </span>
        <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay className="backdrop-blur-sm" />
          <DialogContent className="max-w-2xl p-0">
            <DialogHeader className="px-6 pt-6">
              <DialogTitle>Daftar Dokumen</DialogTitle>
              <DialogDescription>Pilih dokumen pendukung untuk bukti objektif.</DialogDescription>
            </DialogHeader>

            <div className="px-6 pb-4">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari dokumen..."
              />
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  Tidak ada dokumen tersedia
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDocuments.map((document) => {
                    const selected = String(document.id) === String(value)
                    return (
                      <button
                        key={document.id}
                        type="button"
                        onClick={() => {
                          onChange(String(document.id))
                          setOpen(false)
                        }}
                        className={cn(
                          "w-full text-left flex items-start gap-3 p-3 rounded-md text-sm border hover:bg-accent",
                          selected && "bg-accent"
                        )}
                      >
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate" title={getDisplayName(document)}>
                              {getDisplayName(document)}
                            </span>
                            {isLoadingName(document.id) && (
                              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />
                            )}
                          </div>
                          {document.size && (
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(document.size)}
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <DialogFooter className="px-6 pb-6">
              <div className="flex flex-wrap gap-2 justify-between w-full">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    onChange('')
                    setOpen(false)
                  }}
                >
                  Hapus pilihan
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Selesai
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  )
}

function ParticipantSelect({
  value,
  onChange,
  disabled,
  options,
  loading,
  placeholder,
  title,
  description,
  emptyText,
  getOptionLabel,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selectedOption = useMemo(() => {
    if (!value) return null
    return options.find((option) => String(option.value) === String(value)) ?? null
  }, [options, value])

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return options
    return options.filter((option) => getOptionLabel(option).toLowerCase().includes(normalized))
  }, [options, query, getOptionLabel])

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-between h-10"
        onClick={() => setOpen(true)}
        type="button"
        disabled={disabled}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption ? (
            <span className="truncate" title={getOptionLabel(selectedOption)}>
              {getOptionLabel(selectedOption)}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {loading ? 'Memuat peserta...' : placeholder}
            </span>
          )}
        </span>
        <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay className="backdrop-blur-sm" />
          <DialogContent className="max-w-2xl p-0">
            <DialogHeader className="px-6 pt-6">
              <DialogTitle>{title}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>

            <div className="px-6 pb-4">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama..."
              />
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  {emptyText}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredOptions.map((option) => {
                    const selected = String(option.value) === String(value)
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          onChange(String(option.value))
                          setOpen(false)
                        }}
                        className={cn(
                          "w-full text-left flex items-start gap-3 p-3 rounded-md text-sm border hover:bg-accent",
                          selected && "bg-accent"
                        )}
                      >
                        <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <span className="font-medium truncate">{getOptionLabel(option)}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <DialogFooter className="px-6 pb-6">
              <div className="flex flex-wrap gap-2 justify-between w-full">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    onChange('')
                    setOpen(false)
                  }}
                >
                  Hapus pilihan
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Selesai
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  )
}

function FindingTypeSelect({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selectedOption = useMemo(
    () => FINDING_TYPES.find((option) => option.value === value) ?? null,
    [value]
  )

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return FINDING_TYPES
    return FINDING_TYPES.filter((option) => {
      const text = `${option.label} ${option.description}`.toLowerCase()
      return text.includes(normalized)
    })
  }, [query])

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-between h-10"
        onClick={() => setOpen(true)}
        type="button"
        disabled={disabled}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption ? (
            <span className="flex items-center gap-2 truncate">
              <Badge className={cn("px-1.5 py-0", selectedOption.color)}>
                {selectedOption.label}
              </Badge>
              <span className="truncate text-muted-foreground">{selectedOption.description}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Pilih jenis temuan</span>
          )}
        </span>
        <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay className="backdrop-blur-sm" />
          <DialogContent className="max-w-xl p-0">
            <DialogHeader className="px-6 pt-6">
              <DialogTitle>Jenis Temuan</DialogTitle>
              <DialogDescription>Pilih klasifikasi temuan audit.</DialogDescription>
            </DialogHeader>

            <div className="px-6 pb-4">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari jenis temuan..."
              />
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
              {filteredOptions.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  Tidak ada jenis temuan tersedia
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredOptions.map((option) => {
                    const selected = option.value === value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          onChange(option.value)
                          setOpen(false)
                        }}
                        className={cn(
                          "w-full text-left flex items-start gap-3 p-3 rounded-md text-sm border hover:bg-accent",
                          selected && "bg-accent"
                        )}
                      >
                        <Badge className={cn("px-1.5 py-0", option.color)}>
                          {option.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <DialogFooter className="px-6 pb-6">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Selesai
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
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
            <FindingTypeSelect
              value={finding.findingType}
              onChange={(value) => onUpdate(index, { findingType: value })}
            />
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
          {(() => {
            const { docId, note } = splitObjectiveEvidence(finding.objectiveEvidence)
            return (
              <>
                <DocumentSelect
                  value={docId}
                  onChange={(value) =>
                    onUpdate(index, { objectiveEvidence: buildObjectiveEvidence(value, note) })
                  }
                  disabled={documentsLoading}
                  documents={documents}
                  loading={documentsLoading}
                />
                <Input
                  value={note}
                  onChange={(event) =>
                    onUpdate(index, { objectiveEvidence: buildObjectiveEvidence(docId, event.target.value) })
                  }
                  placeholder="Tambahkan keterangan bukti objektif"
                />
                {docId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Bukti: {docId}{note ? ` - ${note}` : ''}
                  </p>
                )}
              </>
            )
          })()}
        </div>
      </CardContent>
    </Card>
  )
}

// Main Component
export default function CreateTopic() {
  const navigate = useNavigate()
  const location = useLocation()
  const forumFromState = location?.state?.roomId
    || location?.state?.forumId
    || location?.state?.childForumId
    || location?.state?.room?.id
    || location?.state?.forum?.id
    || ''
  const forumFromQuery = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('forumId') || params.get('roomId') || ''
  }, [location.search])
  const forumTitleFromState = location?.state?.roomTitle
    || location?.state?.forumTitle
    || location?.state?.room?.name
    || location?.state?.forum?.name
    || null

  const [selectedForum, setSelectedForum] = useState(
    forumFromState ? String(forumFromState) : forumFromQuery
  )
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('audit-info')
  const [serverError, setServerError] = useState(null)

  const [auditCode, setAuditCode] = useState('')
  const [auditedUnit, setAuditedUnit] = useState('')
  const [auditDate, setAuditDate] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')
  const [issuedDate, setIssuedDate] = useState(new Date().toISOString().split('T')[0])
  const [revisionNumber, setRevisionNumber] = useState('0')
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

  const resolvedForumId = selectedForum || forumFromState || forumFromQuery

  useEffect(() => {
    if (!selectedForum && (forumFromState || forumFromQuery)) {
      setSelectedForum(String(forumFromState || forumFromQuery))
    }
  }, [forumFromQuery, forumFromState, selectedForum])

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
  } = useRoomParticipants(resolvedForumId, participantsParams, {
    enabled: Boolean(resolvedForumId),
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

  const auditorSelectOptions = useMemo(
    () => auditorOptions.map((participant) => ({
      value: String(participant.user_id || participant.user?.id),
      label: participantLabel(participant),
    })),
    [auditorOptions]
  )

  const auditeeSelectOptions = useMemo(
    () => auditeeOptions.map((participant) => ({
      value: String(participant.user_id || participant.user?.id),
      label: participantLabel(participant),
    })),
    [auditeeOptions]
  )

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
      const forumId = resolvedForumId || ''
      if (!forumId) {
        setDocuments([])
        return
      }

      setDocumentsLoading(true)
      setDocumentsError(null)
      try {
        const res = await forumAttachmentService.listForumAttachments(forumId, { per_page: 100 })
        const rawDocuments = res?.attachments ?? []

        const transformedDocs = rawDocuments.map(doc => {
          const displayName = doc.original_filename || 
                             doc.filename || 
                             doc.name || 
                             doc.file_name || 
                             `Lampiran-${doc.id.substring(0, 8)}`

          return {
            ...doc,
            display_name: displayName
          }
        })

        setDocuments(transformedDocs)
      } catch (err) {
        setDocumentsError(err?.response?.data?.message || err?.message || 'Gagal memuat lampiran.')
      } finally {
        setDocumentsLoading(false)
      }
    }

    loadDocuments()
  }, [resolvedForumId])

  const currentForumName = useMemo(() => {
    if (resolvedForumId) {
      const match = rooms.find((room) => String(room.id) === String(resolvedForumId))
      if (match) return match.name
    }
    return forumTitleFromState || '-'
  }, [rooms, resolvedForumId, forumTitleFromState])

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
          document_number: documentNumber.trim(),
          issued_date: issuedDate,
          revision_number: revisionNumber.trim(),
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Form Daftar Temuan Ketidaksesuaian</h1>
              <p className="text-muted-foreground mt-1">Isi data temuan audit sesuai dengan format yang ditentukan</p>
            </div>
            {resolvedForumId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/forum/${resolvedForumId}`)}
                className="self-start"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
              </Button>
            )}
          </div>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-muted/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Buat Temuan Baru</CardTitle>
                <CardDescription>Lengkapi semua informasi yang diperlukan</CardDescription>
              </div>
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
                    <Label className="text-sm font-medium">No. Dokumen</Label>
                    <Input
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder="Contoh: FRM-POS-UPA TIK-SMKI-008-01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tanggal Terbit</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={issuedDate}
                        onChange={(e) => setIssuedDate(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">No. Revisi</Label>
                    <Input
                      value={revisionNumber}
                      onChange={(e) => setRevisionNumber(e.target.value)}
                      placeholder="Contoh: 0"
                    />
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

                {documentsError && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-xs">
                      {documentsError}
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
                    <ParticipantSelect
                      value={selectedAuditorId}
                      onChange={setSelectedAuditorId}
                      disabled={participantsLoading}
                      options={auditorSelectOptions}
                      loading={participantsLoading}
                      placeholder="Pilih auditor"
                      title="Daftar Auditor"
                      description="Pilih auditor yang bertanggung jawab."
                      emptyText="Tidak ada auditor tersedia"
                      getOptionLabel={(option) => option.label}
                    />
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
                    <ParticipantSelect
                      value={selectedAuditeeId}
                      onChange={setSelectedAuditeeId}
                      disabled={participantsLoading}
                      options={auditeeSelectOptions}
                      loading={participantsLoading}
                      placeholder="Pilih auditee"
                      title="Daftar Auditee"
                      description="Pilih auditee yang akan diaudit."
                      emptyText="Tidak ada auditee tersedia"
                      getOptionLabel={(option) => option.label}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Auditee - NIP / Employee ID</Label>
                    <Input value={auditeeNip} disabled placeholder="Terisi otomatis" />
                  </div>
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
              onClick={() => {
                if (resolvedForumId) {
                  navigate(`/forum/${resolvedForumId}`)
                } else {
                  navigate(-1)
                }
              }}
              className="min-w-25"
            >
              <X className="h-4 w-4 mr-2" /> Batal
            </Button>
            <Button
              variant="secondary"
              disabled={isBusy}
              onClick={() => handleSubmit('draft')}
              className="min-w-25"
            >
              {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4 mr-2" /> Draft
            </Button>
            <Button
              disabled={isBusy}
              onClick={() => handleSubmit('publish')}
              className="min-w-25 bg-blue-600 hover:bg-blue-700"
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