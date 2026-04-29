// components/finding/FindingTable.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import * as documentService from '@/services/documentService'
import { useAdminClauses } from '@/services/adminClauseHooks'

const FindingTable = ({ findings, auditInfo }) => {
  const [documentNames, setDocumentNames] = useState({})
  const [loadingNames, setLoadingNames] = useState({})
  const [documentsLoaded, setDocumentsLoaded] = useState(false)
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
      .map((id) => String(id))
    return Array.from(new Set(ids))
  }, [findings])

  useEffect(() => {
    if (objectiveEvidenceIds.length === 0 || documentsLoaded) return

    let isMounted = true
    const fetchDocumentList = async () => {
      try {
        const res = await documentService.listDocuments({ per_page: 200 })
        const docs = res?.documents ?? []
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
      } finally {
        if (isMounted) setDocumentsLoaded(true)
      }
    }

    fetchDocumentList()

    return () => {
      isMounted = false
    }
  }, [objectiveEvidenceIds, documentsLoaded])

  useEffect(() => {
    if (objectiveEvidenceIds.length === 0 || !documentsLoaded) return
    const missing = objectiveEvidenceIds.filter((docId) => !documentNames[docId])
    if (missing.length === 0) return
    setLoadingNames((prev) => ({
      ...prev,
      ...missing.reduce((acc, docId) => {
        acc[docId] = false
        return acc
      }, {}),
    }))
  }, [objectiveEvidenceIds, documentNames, documentsLoaded])

  const getObjectiveEvidenceLabel = (value) => {
    if (!value) return '-'
    const docId = String(value)
    if (documentNames[docId]) return documentNames[docId]
    if (loadingNames[docId]) return 'Memuat nama dokumen...'
    return `Dokumen-${docId.substring(0, 8)}`
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
          <div className="mb-4 p-3 bg-slate-50 rounded-md text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="font-medium">Kode Audit:</span> {auditInfo.audit_code}</div>
              <div><span className="font-medium">Unit Diaudit:</span> {auditInfo.audited_unit}</div>
              <div><span className="font-medium">Tanggal Audit:</span> {auditInfo.audit_date}</div>
              <div><span className="font-medium">Auditor:</span> {auditInfo.auditor?.name} ({auditInfo.auditor?.nip})</div>
              <div><span className="font-medium">Auditee:</span> {auditInfo.auditee?.name} ({auditInfo.auditee?.nip})</div>
            </div>
          </div>
        )}

        <h3 className="text-lg font-semibold mb-4">DAFTAR TEMUAN KETIDAKSESUAIAN</h3>
        
        <div className="overflow-x-auto">
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
      </CardContent>
    </Card>
  )
}

export default FindingTable