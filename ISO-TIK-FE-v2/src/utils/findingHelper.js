// utils/findingHelpers.js

/**
 * Konversi data form ke format input item untuk dikirim ke backend
 */
export const convertFormToInputItem = (formData) => {
  return {
    label: "Form Daftar Temuan Ketidaksesuaian",
    type: "finding",
    order_index: 9999,
    visibility: "visible",
    value: "",
    metadata: {
      document_number: formData.document_number,
      issued_date: formData.issued_date,
      revision_number: formData.revision_number,
      audit_code: formData.audit_code,
      audited_unit: formData.audited_unit,
      audit_date: formData.audit_date,
      auditor: formData.auditor,
      auditee: formData.auditee,
      findings: formData.findings.map(finding => ({
        no: finding.no,
        finding_type: finding.finding_type,
        finding_description: finding.finding_description,
        clause_references: finding.clause_references || [],
        objective_evidence: finding.objective_evidence
      }))
    }
  }
}

/**
 * Ekstrak data finding dari input item
 */
export const extractFindingFromInputItem = (inputItem) => {
  if (!inputItem || !['form_data', 'finding'].includes(inputItem?.type)) return null

  let parsedValue = null
  if (typeof inputItem?.value === 'string' && inputItem.value.trim()) {
    try {
      parsedValue = JSON.parse(inputItem.value)
    } catch {
      parsedValue = null
    }
  } else if (typeof inputItem?.value === 'object' && inputItem.value !== null) {
    parsedValue = inputItem.value
  }

  const metadata =
    inputItem.metadata ||
    parsedValue?.metadata ||
    (parsedValue && typeof parsedValue === 'object' ? parsedValue : null) ||
    {}

  const findings = Array.isArray(metadata?.findings) ? metadata.findings : []
  const label = String(inputItem?.label || '').toLowerCase()
  const labelMatch = label.includes('temuan') && label.includes('ketidaksesuaian')

  if (labelMatch || findings.length > 0) {
    return {
      document_number: metadata?.document_number,
      issued_date: metadata?.issued_date,
      revision_number: metadata?.revision_number,
      audit_code: metadata?.audit_code,
      audited_unit: metadata?.audited_unit,
      audit_date: metadata?.audit_date,
      auditor: metadata?.auditor,
      auditee: metadata?.auditee,
      findings,
    }
  }
  return null
}

/**
 * Cari finding data dari array input_items
 */
export const findFindingData = (inputItems) => {
  if (!inputItems || !Array.isArray(inputItems)) return null

  const findingItem = inputItems.find((item) => extractFindingFromInputItem(item))
  return findingItem ? extractFindingFromInputItem(findingItem) : null
}
