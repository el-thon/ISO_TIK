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
import { useAdminClauses } from '@/services/adminClauseHooks'
import { cn } from '@/lib/utils'
import * as documentService from '@/services/documentService'

const createEmptyFinding = () => ({
  no: 1,
  finding_type: 'minor',
  finding_description: '',
  clause_references: [],
  objective_evidence: ''
})

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
  <div className="max-h-75 overflow-y-auto p-2">
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

function DocumentSelect({ value, onChange, disabled, documents, loading }) {
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
  <SelectContent className="w-full min-w-75 max-h-75">
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
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate" title={getDisplayName(document)}>
                      {getDisplayName(document)}
                    </span>
                    {isLoading(document.id) && (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />
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

const FindingForm = ({ onSubmit, initialData }) => {
  const { data: clauseData, isLoading: clausesLoading } = useAdminClauses({ per_page: 100, is_active: true })
  const [documents, setDocuments] = useState([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [documentsError, setDocumentsError] = useState(null)
  const [formData, setFormData] = useState({
    audit_code: initialData?.audit_code || '',
    audited_unit: initialData?.audited_unit || '',
    audit_date: initialData?.audit_date || new Date().toISOString().split('T')[0],
    auditor: initialData?.auditor || { name: '', nip: '' },
    auditee: initialData?.auditee || { name: '', nip: '' },
    findings: (initialData?.findings || []).map((finding) => createNormalizedFinding(finding))
  })

  useEffect(() => {
    let isMounted = true

    const loadDocuments = async () => {
      setDocumentsLoading(true)
      setDocumentsError(null)
      try {
        const res = await documentService.listDocuments({ per_page: 200 })
        const docs = res?.documents ?? []
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
  }, [])

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

  const updateAuditor = (field, value) => {
    setFormData({
      ...formData,
      auditor: { ...formData.auditor, [field]: value }
    })
  }

  const updateAuditee = (field, value) => {
    setFormData({
      ...formData,
      auditee: { ...formData.auditee, [field]: value }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
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
          </div>

          {/* Auditor Info */}
          <div className="border rounded-md p-4">
            <h4 className="font-medium mb-3">Informasi Auditor</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nama Auditor</Label>
                <Input 
                  value={formData.auditor.name}
                  onChange={(e) => updateAuditor('name', e.target.value)}
                  placeholder="Nama Auditor"
                  required
                />
              </div>
              <div>
                <Label>NIP Auditor</Label>
                <Input 
                  value={formData.auditor.nip}
                  onChange={(e) => updateAuditor('nip', e.target.value)}
                  placeholder="NIP Auditor"
                  required
                />
              </div>
            </div>
          </div>

          {/* Auditee Info */}
          <div className="border rounded-md p-4">
            <h4 className="font-medium mb-3">Informasi Auditee</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nama Auditee</Label>
                <Input 
                  value={formData.auditee.name}
                  onChange={(e) => updateAuditee('name', e.target.value)}
                  placeholder="Nama Auditee"
                  required
                />
              </div>
              <div>
                <Label>NIP Auditee</Label>
                <Input 
                  value={formData.auditee.nip}
                  onChange={(e) => updateAuditee('nip', e.target.value)}
                  placeholder="NIP Auditee"
                  required
                />
              </div>
            </div>
          </div>

          {/* Findings */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Daftar Temuan</h3>
              <Button type="button" onClick={addFinding} variant="outline" size="sm">
                + Tambah Temuan
              </Button>
            </div>

            {formData.findings.map((finding, index) => (
              <div key={index} className="border rounded-md p-4 mb-4 space-y-3">
                <div className="flex justify-between">
                  <h4 className="font-medium">Temuan #{finding.no}</h4>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeFinding(index)}
                    className="text-red-600"
                  >
                    Hapus
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Jenis Temuan</Label>
                    <select
                      className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                      value={finding.finding_type}
                      onChange={(e) => updateFinding(index, 'finding_type', e.target.value)}
                    >
                      <option value="minor">Minor</option>
                      <option value="mayor">Mayor</option>
                      <option value="observasi">Observasi</option>
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
                  />
                </div>

                <div>
                  <Label>Bukti Objektif</Label>
                  <DocumentSelect
                    value={finding.objective_evidence}
                    onChange={(value) => updateFinding(index, 'objective_evidence', value)}
                    disabled={documentsLoading}
                    documents={documents}
                    loading={documentsLoading}
                  />
                  {finding.objective_evidence && !documentsError && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ID Dokumen: {finding.objective_evidence}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {formData.findings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
                Belum ada temuan. Klik "Tambah Temuan" untuk menambahkan.
              </div>
            )}
          </div>

          <Button type="submit" className="w-full">
            Simpan Daftar Temuan
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}

export default FindingForm