// components/finding/FindingForm.jsx
import React, { useMemo, useState, useEffect } from 'react'
import { ChevronsUpDown, FileText, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAdminClauses } from '@/hooks/useAdminClause'
import { useActiveDocumentMaster } from '@/hooks/useActiveMaster'
import { useRoomParticipants } from '@/hooks/useRoom'
import { cn } from '@/lib/utils'
import * as documentService from '@/services/documentService'
import * as forumAttachmentService from '@/services/forumAttachmentService'

const createEmptyFinding = () => ({
  no: 1,
  finding_type: 'minor',
  finding_description: '',
  clause_references: [],
  objective_evidence: ''
})

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

const splitObjectiveEvidenceId = (value) => {
  if (!value) return ''
  return String(value).split(OBJECTIVE_EVIDENCE_SEPARATOR)[0]?.trim() || ''
}

const normalizeClauseReferences = (refs) => {
  if (!Array.isArray(refs)) return []
  return refs
    .map((ref) => {
      if (!ref) return null
      if (typeof ref === 'object') {
        return ref?.id ?? ref?.clause_id ?? ref?.uuid ?? null
      }
      return ref
    })
    .filter(Boolean)
    .map((ref) => String(ref))
}

const normalizeObjectiveEvidence = (value) => {
  if (!value) return ''
  if (typeof value === 'object') {
    return String(value?.id ?? value?.document_id ?? value?.uuid ?? '')
  }
  return String(value)
}

const createNormalizedFinding = (finding) => ({
  ...finding,
  clause_references: normalizeClauseReferences(finding?.clause_references),
  objective_evidence: normalizeObjectiveEvidence(finding?.objective_evidence),
})

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

function MultiSelect({ options, value, onChange, placeholder = 'Pilih klausul...', loading = false }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = useMemo(() => {
    return new Set(value)
  }, [value])

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
    return options.filter((opt) => (opt.label || '').toLowerCase().includes(normalized))
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

function DocumentSelect({ value, onChange, disabled, documents, loading }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [documentNames, setDocumentNames] = useState({})
  const [loadingNames, setLoadingNames] = useState({})

  useEffect(() => {
    const fetchOriginalNames = async () => {
      const names = {}
      const loadingState = {}

      for (const doc of documents) {
        if (!doc.original_filename && !doc.display_name) {
          loadingState[doc.id] = true
          try {
            const info = await documentService.getDocumentDownloadInfo(doc.id, { suppressNotFound: true })
            if (info?.document?.original_filename) {
              names[doc.id] = info.document.original_filename
            }
          } catch (error) {
            console.error(`Failed to fetch name for doc ${doc.id}:`, error)
          } finally {
            loadingState[doc.id] = false
          }
        }
      }

      setDocumentNames(names)
      setLoadingNames(loadingState)
    }

    if (documents.length > 0) {
      fetchOriginalNames()
    }
  }, [documents])

  const getDisplayName = (doc) => {
    if (documentNames[doc.id]) return documentNames[doc.id]
    if (doc.display_name) return doc.display_name
    if (doc.original_filename) return doc.original_filename
    if (doc.original_name) return doc.original_name
    if (doc.filename) return doc.filename
    if (doc.file_name) return doc.file_name
    if (doc.name) return doc.name
    return `Dokumen-${doc.id.substring(0, 8)}`
  }

  useEffect(() => {
    if (!value || documents.some((doc) => String(doc.id) === String(value)) || documentNames[value]) return
    let isMounted = true
    setLoadingNames((prev) => ({ ...prev, [value]: true }))
    documentService.getDocumentDownloadInfo(value, { suppressNotFound: true })
      .then((info) => {
        const resolvedName =
          info?.attachment?.filename ||
          info?.attachment?.original_filename ||
          info?.document?.original_filename ||
          info?.document?.filename ||
          info?.filename
        if (isMounted && resolvedName) {
          setDocumentNames((prev) => ({ ...prev, [value]: resolvedName }))
        }
      })
      .finally(() => {
        if (isMounted) setLoadingNames((prev) => ({ ...prev, [value]: false }))
      })
    return () => {
      isMounted = false
    }
  }, [value, documents, documentNames])

  const selectedDocument = useMemo(() => {
    if (!value) return null
    return documents.find((doc) => String(doc.id) === String(value)) ?? { id: value }
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

const normalizeRole = (role) => {
  const raw = String(role || '').trim().toLowerCase()
  if (!raw) return ''
  if (raw === 'auditor' || raw === 'auditee') return raw
  // tolerate other legacy values by returning as-is
  return raw
}

const getIdentityText = (identity) => {
  if (!identity) return ''
  if (typeof identity === 'string') return identity
  const name = identity?.name ? String(identity.name) : ''
  const nip = identity?.nip ? String(identity.nip) : ''
  return `${name}${nip ? ` (${nip})` : ''}`.trim()
}

const getParticipantIdentity = (participant) => {
  if (!participant) return { name: '', nip: '' }
  const user = participant?.user ?? {}
  const profile = user?.profile ?? {}
  const employment = user?.employment ?? {}
  const name =
    profile?.full_name ||
    user?.name ||
    participant?.name ||
    user?.username ||
    ''
  const nip =
    participant?.nip ??
    participant?.employee_id ??
    user?.nip ??
    user?.employee_id ??
    profile?.nip ??
    profile?.employee_id ??
    employment?.nip ??
    employment?.employee_id ??
    ''
  return { name: String(name || ''), nip: String(nip || '') }
}

const getParticipantLabel = (participant) => {
  if (!participant) return ''
  const user = participant?.user ?? {}
  const profile = user?.profile ?? {}
  const employment = user?.employment ?? {}
  const fullName = profile?.full_name
  const username = user?.username
  const name = fullName || user?.name || participant?.name || username || ''
  const nip =
    participant?.nip ??
    participant?.employee_id ??
    user?.nip ??
    user?.employee_id ??
    profile?.nip ??
    profile?.employee_id ??
    employment?.nip ??
    employment?.employee_id ??
    ''
  const withUsername = name && username && name !== username ? `${name} (${username})` : name
  return `${withUsername}${nip ? ` - ${nip}` : ''}`.trim()
}

const FindingForm = ({ onSubmit, initialData, forumId, readOnly = false }) => {
  const { data: clauseData, isLoading: clausesLoading } = useAdminClauses({ per_page: 100, is_active: true })
  const { data: activeMaster, isLoading: activeMasterLoading } = useActiveDocumentMaster({ enabled: !readOnly })
  const [documents, setDocuments] = useState([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [documentsError, setDocumentsError] = useState(null)
  const [headerError, setHeaderError] = useState('')

  const participantsParams = useMemo(() => ({ per_page: 100 }), [])
  const {
    data: participantsData,
    isLoading: participantsLoading,
    isError: participantsError,
    error: participantsErrorObj,
  } = useRoomParticipants(forumId, participantsParams, {
    enabled: Boolean(forumId),
  })

  const participants = participantsData?.participants ?? []
  const [formData, setFormData] = useState({
    document_number: initialData?.document_number || '',
    issued_date: initialData?.issued_date || '',
    revision_number: initialData?.revision_number || '',
    audit_code: initialData?.audit_code || '',
    audited_unit: initialData?.audited_unit || '',
    audit_date: initialData?.audit_date || new Date().toISOString().split('T')[0],
    auditor: initialData?.auditor || { name: '', nip: '' },
    auditee: initialData?.auditee || { name: '', nip: '' },
    findings: (initialData?.findings || []).map((finding) => createNormalizedFinding(finding))
  })

  const [selectedAuditorId, setSelectedAuditorId] = useState('')
  const [selectedAuditeeId, setSelectedAuditeeId] = useState('')

  useEffect(() => {
    if (readOnly || initialData || activeMasterLoading) return
    setFormData((current) => ({
      ...current,
      document_number: activeMaster?.document_number || '',
      issued_date: activeMaster?.published_at ? activeMaster.published_at.slice(0, 10) : '',
      revision_number: activeMaster?.revision_number || '',
    }))
  }, [activeMaster, activeMasterLoading, initialData, readOnly])

  const auditorCandidates = useMemo(() => {
    const filtered = participants.filter((p) => normalizeRole(p?.role) === 'auditor')
    return filtered.length ? filtered : participants
  }, [participants])

  const auditeeCandidates = useMemo(() => {
    const filtered = participants.filter((p) => normalizeRole(p?.role) === 'auditee')
    return filtered.length ? filtered : participants
  }, [participants])

  const resolveParticipantIdFromIdentity = useMemo(() => {
    const normalizeText = (value) => String(value || '').trim().toLowerCase()
    return (identity) => {
      if (!identity) return ''
      const targetNip = normalizeText(identity?.nip)
      const targetName = normalizeText(identity?.name)
      if (!targetNip && !targetName) return ''

      const match = participants.find((p) => {
        const user = p?.user ?? {}
        const profile = user?.profile ?? {}
        const employment = user?.employment ?? {}
        const nip = normalizeText(
          p?.nip ??
          p?.employee_id ??
          user?.nip ??
          user?.employee_id ??
          profile?.nip ??
          profile?.employee_id ??
          employment?.nip ??
          employment?.employee_id
        )
        const name = normalizeText(profile?.full_name ?? p?.name ?? user?.name ?? user?.username)
        if (targetNip && nip && targetNip === nip) return true
        if (targetName && name && targetName === name) return true
        return false
      })

      if (!match) return ''
      return String(match?.user_id ?? match?.user?.id ?? '')
    }
  }, [participants])

  useEffect(() => {
    if (!participants.length) return
    setSelectedAuditorId((current) => current || resolveParticipantIdFromIdentity(formData?.auditor))
    setSelectedAuditeeId((current) => current || resolveParticipantIdFromIdentity(formData?.auditee))
  }, [participants, resolveParticipantIdFromIdentity])

  useEffect(() => {
    let isMounted = true

    const loadDocuments = async () => {
      setDocumentsLoading(true)
      setDocumentsError(null)
      try {
        let docs = []
        const [forumRes, documentRes] = await Promise.all([
          forumId
            ? forumAttachmentService.listForumAttachments(forumId, { per_page: 200 }).catch(() => ({ attachments: [] }))
            : Promise.resolve({ attachments: [] }),
          documentService.listDocuments({ per_page: 200 }).catch(() => ({ documents: [] })),
        ])
        docs = [...(forumRes?.attachments ?? []), ...(documentRes?.documents ?? [])]

        if (isMounted) setDocuments(docs)
      } catch (error) {
        if (isMounted) setDocumentsError(error)
      } finally {
        if (isMounted) setDocumentsLoading(false)
      }
    }

    loadDocuments()
    return () => {
      isMounted = false
    }
  }, [forumId])

  useEffect(() => {
    const usedEvidenceIds = Array.from(new Set(
      formData.findings
        .map((finding) => splitObjectiveEvidenceId(finding.objective_evidence))
        .filter(Boolean)
    ))
    const missingIds = usedEvidenceIds.filter((docId) => !documents.some((doc) => String(doc.id) === String(docId)))
    if (!missingIds.length) return

    let isMounted = true
    Promise.all(
      missingIds.map((docId) =>
        documentService.getDocumentDownloadInfo(docId, { suppressNotFound: true })
          .then((info) => {
            const source = info?.attachment || info?.document || null
            const resolvedName =
              source?.original_filename ||
              source?.filename ||
              source?.file_name ||
              info?.filename ||
              `Dokumen-${docId.substring(0, 8)}`
            return {
              ...(source || {}),
              id: docId,
              original_filename: resolvedName,
              display_name: resolvedName,
              filename: resolvedName,
            }
          })
          .catch(() => ({
            id: docId,
            original_filename: `Dokumen-${docId.substring(0, 8)}`,
            display_name: `Dokumen-${docId.substring(0, 8)}`,
            filename: `Dokumen-${docId.substring(0, 8)}`,
          }))
      )
    ).then((resolvedDocs) => {
      if (!isMounted) return
      setDocuments((current) => {
        const existing = new Set(current.map((doc) => String(doc.id)))
        const additions = resolvedDocs.filter((doc) => doc?.id && !existing.has(String(doc.id)))
        return additions.length ? [...current, ...additions] : current
      })
    })

    return () => {
      isMounted = false
    }
  }, [formData.findings, documents])

  const clauseOptions = useMemo(() => {
    const clauses = clauseData?.clauses ?? clauseData?.items ?? clauseData?.data ?? []
    return clauses
      .map((clause) => {
        const id = clause?.id ?? clause?.clause_id ?? clause?.uuid
        if (!id) return null
        const label = clause?.name && clause?.code ? `${clause.code} - ${clause.name}` : clause?.name || clause?.code
        return {
          value: String(id),
          label: label || String(id),
        }
      })
      .filter(Boolean)
  }, [clauseData])

  const addFinding = () => {
    const newFinding = createEmptyFinding()
    newFinding.no = formData.findings.length + 1
    setFormData({
      ...formData,
      findings: [...formData.findings, newFinding]
    })
  }

  const updateFinding = (index, field, value) => {
    const updatedFindings = [...formData.findings]

    if (field === 'clause_references') {
      updatedFindings[index][field] = Array.isArray(value)
        ? value
        : String(value)
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
    } else {
      updatedFindings[index][field] = value
    }
    
    setFormData({
      ...formData,
      findings: updatedFindings
    })
  }

  const removeFinding = (index) => {
    const updatedFindings = formData.findings.filter((_, i) => i !== index)
    updatedFindings.forEach((f, i) => { f.no = i + 1 })
    setFormData({
      ...formData,
      findings: updatedFindings
    })
  }

  const updateAuditorFromParticipant = (userId) => {
    setSelectedAuditorId(String(userId || ''))
    const match = participants.find((p) => String(p?.user_id ?? p?.user?.id) === String(userId))
    if (!match) return
    const { name, nip } = getParticipantIdentity(match)
    setFormData((prev) => ({
      ...prev,
      auditor: { name: String(name || ''), nip: String(nip || '') }
    }))
  }

  const updateAuditeeFromParticipant = (userId) => {
    setSelectedAuditeeId(String(userId || ''))
    const match = participants.find((p) => String(p?.user_id ?? p?.user?.id) === String(userId))
    if (!match) return
    const { name, nip } = getParticipantIdentity(match)
    setFormData((prev) => ({
      ...prev,
      auditee: { name: String(name || ''), nip: String(nip || '') }
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const missingHeader =
      !initialData &&
      (!activeMaster ||
        !formData.document_number?.trim() ||
        !formData.issued_date?.trim() ||
        !formData.revision_number?.trim())

    if (missingHeader) {
      setHeaderError('Simpan diblokir: siapkan master dokumen aktif di Administrasi yang memiliki nomor dokumen, tanggal terbit, dan nomor revisi.')
      return
    }

    setHeaderError('')
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Audit Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Kode Audit</Label>
              <Input 
                value={formData.audit_code}
                onChange={(e) => setFormData({...formData, audit_code: e.target.value})}
                placeholder="Contoh: AUD-2024-001"
                required
              />
            </div>
            <div>
              <Label>Unit yang Diaudit</Label>
              <Input 
                value={formData.audited_unit}
                onChange={(e) => setFormData({...formData, audited_unit: e.target.value})}
                placeholder="Contoh: Unit Keuangan"
                required
              />
            </div>
            <div>
              <Label>Tanggal Audit</Label>
              <Input 
                type="date"
                value={formData.audit_date}
                onChange={(e) => setFormData({...formData, audit_date: e.target.value})}
                required
              />
            </div>
            <div>
              <Label>No. Dokumen</Label>
              <Input
                value={formData.document_number}
                placeholder={activeMasterLoading ? 'Memuat master dokumen...' : 'Belum ada master dokumen aktif'}
                disabled
              />
            </div>
            <div>
              <Label>Tanggal Terbit</Label>
              <Input
                type="date"
                value={formData.issued_date}
                disabled
              />
            </div>
            <div>
              <Label>No. Revisi</Label>
              <Input
                value={formData.revision_number}
                placeholder={activeMasterLoading ? 'Memuat master dokumen...' : 'Belum ada master dokumen aktif'}
                disabled
              />
            </div>
          </div>
          {headerError && <p className="text-sm text-destructive">{headerError}</p>}

          {/* Auditor Info */}
          <div className="border rounded-md p-4">
            <h4 className="font-medium mb-3">Informasi Auditor</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="min-w-0">
                <Label>Nama Auditor</Label>
                <Select
                  value={selectedAuditorId}
                  onValueChange={updateAuditorFromParticipant}
                  disabled={participantsLoading || readOnly || auditorCandidates.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={participantsLoading ? 'Memuat...' : 'Pilih auditor'} />
                  </SelectTrigger>
                  <SelectContent>
                    {auditorCandidates.map((p) => {
                      const userId = p?.user_id ?? p?.user?.id
                      if (!userId) return null
                      const label = getParticipantLabel(p) || getIdentityText({
                        name: p?.name ?? p?.user?.name,
                        nip: p?.nip ?? p?.user?.nip,
                      })
                      return (
                        <SelectItem key={String(userId)} value={String(userId)}>
                          {label || String(userId)}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {participantsError && (
                  <p className="text-xs text-amber-600 mt-1">
                    {participantsErrorObj?.response?.data?.message || participantsErrorObj?.message || 'Gagal memuat peserta forum.'}
                  </p>
                )}
              </div>
              <div className="min-w-0">
                <Label>NIP Auditor</Label>
                <Input 
                  value={formData.auditor.nip}
                  placeholder="NIP Auditor"
                  required
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Auditee Info */}
          <div className="border rounded-md p-4">
            <h4 className="font-medium mb-3">Informasi Auditee</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="min-w-0">
                <Label>Nama Auditee</Label>
                <Select
                  value={selectedAuditeeId}
                  onValueChange={updateAuditeeFromParticipant}
                  disabled={participantsLoading || readOnly || auditeeCandidates.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={participantsLoading ? 'Memuat...' : 'Pilih auditee'} />
                  </SelectTrigger>
                  <SelectContent>
                    {auditeeCandidates.map((p) => {
                      const userId = p?.user_id ?? p?.user?.id
                      if (!userId) return null
                      const label = getParticipantLabel(p) || getIdentityText({
                        name: p?.name ?? p?.user?.name,
                        nip: p?.nip ?? p?.user?.nip,
                      })
                      return (
                        <SelectItem key={String(userId)} value={String(userId)}>
                          {label || String(userId)}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {participantsError && (
                  <p className="text-xs text-amber-600 mt-1">
                    {participantsErrorObj?.response?.data?.message || participantsErrorObj?.message || 'Gagal memuat peserta forum.'}
                  </p>
                )}
              </div>
              <div className="min-w-0">
                <Label>NIP Auditee</Label>
                <Input 
                  value={formData.auditee.nip}
                  placeholder="NIP Auditee"
                  required
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Findings */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Daftar Temuan</h3>
              {!readOnly && (
                <Button type="button" onClick={addFinding} variant="outline" size="sm">
                  + Tambah Temuan
                </Button>
              )}
            </div>

            {formData.findings.map((finding, index) => (
              <div key={index} className="border rounded-md p-4 mb-4 space-y-3">
                <div className="flex justify-between">
                  <h4 className="font-medium">Temuan #{finding.no}</h4>
                  {!readOnly && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeFinding(index)}
                      className="text-red-600"
                    >
                      Hapus
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Jenis Temuan</Label>
                    <select
                      className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                      value={finding.finding_type}
                      onChange={(e) => updateFinding(index, 'finding_type', e.target.value)}
                      disabled={readOnly}
                    >
                      <option value="minor">Minor</option>
                      <option value="major">Mayor</option>
                      <option value="observation">Observasi</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Label>Uraian Temuan</Label>
                    <textarea
                      className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                      rows={2}
                      value={finding.finding_description}
                      onChange={(e) => updateFinding(index, 'finding_description', e.target.value)}
                      required
                      disabled={readOnly}
                    />
                  </div>
                </div>

                <div>
                  <Label>Klausul / Acuan</Label>
                  <MultiSelect
                    options={clauseOptions}
                    value={finding.clause_references || []}
                    onChange={(value) => updateFinding(index, 'clause_references', value)}
                    placeholder={clausesLoading ? 'Memuat klausul...' : 'Pilih klausul'}
                    loading={clausesLoading}
                    disabled={readOnly}
                  />
                </div>

                <div>
                  <Label>Bukti Objektif</Label>
                  {(() => {
                    const { docId, note } = splitObjectiveEvidence(finding.objective_evidence)
                    return (
                      <>
                        <DocumentSelect
                          value={docId}
                          onChange={(value) => updateFinding(index, 'objective_evidence', buildObjectiveEvidence(value, note))}
                          disabled={documentsLoading || readOnly}
                          documents={documents}
                          loading={documentsLoading}
                        />
                        <Input
                          value={note}
                          onChange={(event) =>
                            updateFinding(index, 'objective_evidence', buildObjectiveEvidence(docId, event.target.value))
                          }
                          placeholder="Tambahkan keterangan bukti objektif"
                          disabled={readOnly}
                        />
                        {docId && !documentsError && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Bukti: {docId}{note ? ` - ${note}` : ''}
                          </p>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
            ))}

            {formData.findings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
                Belum ada temuan. Klik "Tambah Temuan" untuk menambahkan.
              </div>
            )}
          </div>

          {!readOnly && (
            <Button type="submit" className="w-full">
              Simpan Daftar Temuan
            </Button>
          )}
        </CardContent>
      </Card>
    </form>
  )
}

export default FindingForm
