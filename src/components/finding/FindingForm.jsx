// components/finding/FindingForm.jsx
import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const createEmptyFinding = () => ({
  no: 1,
  finding_type: 'minor',
  finding_description: '',
  clause_references: [],
  objective_evidence: ''
})

const FindingForm = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    audit_code: initialData?.audit_code || '',
    audited_unit: initialData?.audited_unit || '',
    audit_date: initialData?.audit_date || new Date().toISOString().split('T')[0],
    auditor: initialData?.auditor || { name: '', nip: '' },
    auditee: initialData?.auditee || { name: '', nip: '' },
    findings: initialData?.findings || []
  })

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
      // Convert comma-separated string to array
      updatedFindings[index][field] = value.split(',').map(s => s.trim()).filter(Boolean)
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
                  <Label>Klausul / Acuan (pisahkan dengan koma)</Label>
                  <Input
                    value={finding.clause_references?.join(', ') || ''}
                    onChange={(e) => updateFinding(index, 'clause_references', e.target.value)}
                    placeholder="Contoh: Klausul 7.5, Annex A 5.9, Annex A 5.33"
                    required
                  />
                </div>

                <div>
                  <Label>Bukti Objektif</Label>
                  <Input
                    value={finding.objective_evidence}
                    onChange={(e) => updateFinding(index, 'objective_evidence', e.target.value)}
                    placeholder="Contoh: POS-AP-LSTI-UPA TIK UNILA-007"
                    required
                  />
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