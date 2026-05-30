// components/finding/FindingHeader.jsx
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

export const FindingHeader = ({ auditInfo, documentNo, revisionNo, issueDate }) => {
  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Kode / Nomor Audit:</span> {auditInfo?.code}
          </div>
          <div>
            <span className="font-medium">Proses / Layanan / Unit Diaudit:</span> {auditInfo?.process}
          </div>
          <div>
            <span className="font-medium">Tanggal Audit:</span> {auditInfo?.auditDate}
          </div>
          <div>
            <span className="font-medium">Auditor:</span> {auditInfo?.auditor}
          </div>
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground border-t pt-2">
          <span>No. Dokumen: {documentNo} | No. Revisi: {revisionNo} | Tanggal Terbit: {issueDate}</span>
        </div>
      </CardContent>
    </Card>
  )
}