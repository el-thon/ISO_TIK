// types/topicFinding.js

/**
 * Struktur data untuk Daftar Temuan Ketidaksesuaian
 * Sesuai payload endpoint POST /api/v1/topics/{topicId}/input-items
 */

// Helper function untuk membuat object finding kosong
export const createEmptyFinding = () => ({
  no: 1,
  finding_type: 'minor',
  finding_description: '',
  clause_references: [],
  objective_evidence: ''
})

// Helper function untuk membuat object finding data kosong
export const createEmptyFindingData = () => ({
  label: "Form Daftar Temuan Ketidaksesuaian",
  type: "form_data",
  order_index: 9999,
  visibility: "visible",
  value: "",
  metadata: {
    audit_code: '',
    audited_unit: '',
    audit_date: new Date().toISOString().split('T')[0],
    auditor: { name: '', nip: '' },
    auditee: { name: '', nip: '' },
    findings: []
  }
})

// Contoh data untuk testing
export const sampleFindingData = {
  label: "Form Daftar Temuan Ketidaksesuaian",
  type: "form_data",
  order_index: 1,
  visibility: "visible",
  value: "",
  metadata: {
    audit_code: "AUD-2024-001",
    audited_unit: "Unit Keuangan",
    audit_date: "2026-03-01",
    auditor: { 
      name: "Auditor A", 
      nip: "123" 
    },
    auditee: { 
      name: "Auditee B", 
      nip: "456" 
    },
    findings: [
      {
        no: 1,
        finding_type: "minor",
        finding_description: "Tidak tersedia berita acara kerusakan inventaris sarana dan prasarana.",
        clause_references: [
          "Klausul 7.5 & 8.1",
          "Annex A 5.9",
          "Annex A 5.33"
        ],
        objective_evidence: "POS-AP-LSTI-UPA TIK UNILA-007"
      },
      {
        no: 2,
        finding_type: "mayor",
        finding_description: "Belum ada berita acara atau dokumen resmi ketika permohonan pengadaan/penambahan barang inventaris ditolak.",
        clause_references: [
          "Klausul 7.5",
          "Annex A 5.33"
        ],
        objective_evidence: "POS-AP-LSTI-UPA TIK UNILA-007"
      },
      {
        no: 3,
        finding_type: "minor",
        finding_description: "Belum ada aturan tertulis/prosedur penanganan apabila terjadi kehilangan barang inventaris (alur pelaporan, investigasi, dan tindak lanjut).",
        clause_references: [
          "Klausul 8.1 & 7.5",
          "Annex A 5.24",
          "Annex A 5.33"
        ],
        objective_evidence: "POS-AP-LSTI-UPA TIK UNILA-007"
      }
    ]
  }
}