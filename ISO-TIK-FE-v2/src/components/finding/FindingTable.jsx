// components/finding/FindingTable.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import * as documentService from '@/services/documentService'
import * as forumAttachmentService from '@/services/forumAttachmentService'
import { useAdminClauses } from '@/hooks/useAdminClause'

const OBJECTIVE_EVIDENCE_SEPARATOR = '||'

const splitObjectiveEvidence = (value) => {
  if (!value) return { docId: '', note: '' }
  const raw = String(value)
  const [docId, ...noteParts] = raw.split(OBJECTIVE_EVIDENCE_SEPARATOR)
  return { docId: docId.trim(), note: noteParts.join(OBJECTIVE_EVIDENCE_SEPARATOR).trim() }
}

const FindingTable = ({ findings, auditInfo, forumId }) => {
  const [documentNames, setDocumentNames] = useState({})
  const [loadingNames, setLoadingNames] = useState({})
  const knownDocumentIdsRef = useRef(new Set())
  const { data: clauseData } = useAdminClauses({ per_page: 100, is_active: true })

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

  const resolveClauseRef = (value) => {
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
  }

  const objectiveEvidenceIds = useMemo(() => {
    if (!findings || findings.length === 0) return []
    const ids = findings
      .map((finding) => finding?.objective_evidence)
      .filter(Boolean)
      .map((value) => splitObjectiveEvidence(value).docId)
      .filter(Boolean)
    return Array.from(new Set(ids))
  }, [findings])

  const objectiveEvidenceKey = useMemo(() => objectiveEvidenceIds.join('|'), [objectiveEvidenceIds])

  useEffect(() => {
    if (objectiveEvidenceIds.length === 0) return

    let isMounted = true
    const fetchDocumentList = async () => {
      try {
        const [forumRes, documentRes] = await Promise.all([
          forumId
            ? forumAttachmentService.listForumAttachments(forumId, { per_page: 200 }).catch(() => ({ attachments: [] }))
            : Promise.resolve({ attachments: [] }),
          documentService.listDocuments({ per_page: 200 }).catch(() => ({ documents: [] })),
        ])
        const docs = [...(forumRes?.attachments ?? []), ...(documentRes?.documents ?? [])]
        const names = docs.reduce((acc, doc) => {
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

        knownDocumentIdsRef.current = new Set(docs.map((doc) => String(doc?.id)).filter(Boolean))

        if (isMounted && Object.keys(names).length > 0) {
          setDocumentNames((prev) => ({ ...prev, ...names }))
        }
      } catch (error) {
        console.error('Failed to load documents list for evidence names:', error)
      }
    }

    fetchDocumentList()

    return () => {
      isMounted = false
    }
  }, [objectiveEvidenceKey, forumId])

  useEffect(() => {
    if (objectiveEvidenceIds.length === 0) return
    const missing = objectiveEvidenceIds.filter((docId) => !documentNames[docId])
    if (missing.length === 0) return
    let isMounted = true
    setLoadingNames((prev) => ({
      ...prev,
      ...missing.reduce((acc, docId) => ({ ...acc, [docId]: true }), {}),
    }))
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
      const names = entries.filter(Boolean).reduce((acc, [docId, name]) => ({ ...acc, [docId]: name }), {})
      if (Object.keys(names).length > 0) {
        setDocumentNames((prev) => ({ ...prev, ...names }))
      }
    }).finally(() => {
      if (!isMounted) return
      setLoadingNames((prev) => ({
        ...prev,
        ...missing.reduce((acc, docId) => ({ ...acc, [docId]: false }), {}),
      }))
    })
    return () => {
      isMounted = false
    }
  }, [objectiveEvidenceIds, documentNames])

  const getObjectiveEvidenceLabel = (value) => {
    if (!value) return '-'
    const { docId, note } = splitObjectiveEvidence(value)
    if (!docId) return note || '-'
    const baseLabel = documentNames[docId] || (loadingNames[docId] ? 'Memuat nama dokumen...' : `Dokumen-${docId.substring(0, 8)}`)
    return note ? `${baseLabel} - ${note}` : baseLabel
  }

  if (!findings || findings.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <p>Belum ada data temuan.</p>
            <p className="text-sm mt-2">Klik "Tambah Temuan" untuk mengisi daftar temuan ketidaksesuaian.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getFindingTypeBadge = (type) => {
    const normalized = String(type || '').toLowerCase().trim()
    if (!normalized) return null

    // Support both canonical enums (major/observation) and legacy Indonesian values.
    if (normalized === 'minor') {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Minor</span>
    }

    if (normalized === 'major' || normalized === 'mayor') {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Mayor</span>
    }

    if (normalized === 'observation' || normalized === 'observasi') {
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Observasi</span>
    }

    return (
      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">
        {String(type)}
      </span>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Header informasi audit */}
        {auditInfo && (
          <div className="mb-4 rounded-md bg-slate-50 p-3 text-sm">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div className="break-words"><span className="font-medium">Kode Audit:</span> {auditInfo.audit_code || '-'}</div>
              <div className="break-words"><span className="font-medium">Unit Diaudit:</span> {auditInfo.audited_unit || '-'}</div>
              <div className="break-words"><span className="font-medium">Tanggal Audit:</span> {auditInfo.audit_date || '-'}</div>
              <div className="break-words"><span className="font-medium">Auditor:</span> {auditInfo.auditor?.name || '-'}{auditInfo.auditor?.nip ? ` (${auditInfo.auditor.nip})` : ''}</div>
              <div className="break-words"><span className="font-medium">Auditee:</span> {auditInfo.auditee?.name || '-'}{auditInfo.auditee?.nip ? ` (${auditInfo.auditee.nip})` : ''}</div>
            </div>
          </div>
        )}

        <h3 className="mb-4 text-base font-semibold sm:text-lg">DAFTAR TEMUAN KETIDAKSESUAIAN</h3>
        
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border p-2 text-left text-sm">No</th>
                <th className="border p-2 text-left text-sm">Jenis Temuan</th>
                <th className="border p-2 text-left text-sm">Uraian Temuan</th>
                <th className="border p-2 text-left text-sm">Klausul / Acuan</th>
                <th className="border p-2 text-left text-sm">Bukti Objektif</th>
              </tr>
            </thead>
            <tbody>
              {findings.map((finding) => (
                <tr key={finding.no} className="hover:bg-slate-50">
                  <td className="border p-2 text-sm align-top">{finding.no}</td>
                  <td className="border p-2 text-sm align-top">
                    {getFindingTypeBadge(finding.finding_type)}
                  </td>
                  <td className="border p-2 text-sm align-top">{finding.finding_description}</td>
                  <td className="border p-2 text-sm align-top">
                    {finding.clause_references?.map((ref, idx) => (
                      <div key={idx}>• {resolveClauseRef(ref)}</div>
                    ))}
                  </td>
                  <td className="border p-2 text-sm align-top">
                    {getObjectiveEvidenceLabel(finding.objective_evidence)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {findings.map((finding) => (
            <div key={finding.no} className="rounded-md border bg-white p-3 text-sm shadow-sm">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="font-semibold">Temuan #{finding.no}</div>
                <div className="shrink-0">{getFindingTypeBadge(finding.finding_type)}</div>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs font-medium uppercase text-muted-foreground">Uraian Temuan</div>
                  <div className="mt-1 break-words">{finding.finding_description || '-'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-muted-foreground">Klausul / Acuan</div>
                  <div className="mt-1 space-y-1">
                    {finding.clause_references?.length ? finding.clause_references.map((ref, idx) => (
                      <div key={idx} className="break-words">• {resolveClauseRef(ref)}</div>
                    )) : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-muted-foreground">Bukti Objektif</div>
                  <div className="mt-1 break-words">{getObjectiveEvidenceLabel(finding.objective_evidence)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default FindingTable
