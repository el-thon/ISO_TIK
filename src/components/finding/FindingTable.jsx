// components/finding/FindingTable.jsx
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

const FindingTable = ({ findings, auditInfo }) => {
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
    switch (type) {
      case 'minor':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Minor</span>
      case 'mayor':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Mayor</span>
      case 'observasi':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Observasi</span>
      default:
        return null
    }
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
                      <div key={idx}>• {ref}</div>
                    ))}
                  </td>
                  <td className="border p-2 text-sm align-top">{finding.objective_evidence}</td>
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