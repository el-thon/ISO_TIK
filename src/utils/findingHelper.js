// utils/findingHelpers.js

/**
 * Konversi data form ke format input item untuk dikirim ke backend
 */
export const convertFormToInputItem = (formData) => {
  return {
    label: "Form Daftar Temuan Ketidaksesuaian",
    type: "form_data",
    order_index: 9999,
    visibility: "visible",
    value: "",
    metadata: {
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
  if (inputItem?.type === 'form_data' && 
      inputItem?.label === "Form Daftar Temuan Ketidaksesuaian") {
    return {
      audit_code: inputItem.metadata?.audit_code,
      audited_unit: inputItem.metadata?.audited_unit,
      audit_date: inputItem.metadata?.audit_date,
      auditor: inputItem.metadata?.auditor,
      auditee: inputItem.metadata?.auditee,
      findings: inputItem.metadata?.findings || []
    }
  }
  return null
}

/**
 * Cari finding data dari array input_items
 */
export const findFindingData = (inputItems) => {
  if (!inputItems || !Array.isArray(inputItems)) return null
  
  const findingItem = inputItems.find(
    item => item?.type === 'form_data' && 
            item?.label === "Form Daftar Temuan Ketidaksesuaian"
  )
  
  return findingItem ? extractFindingFromInputItem(findingItem) : null
}