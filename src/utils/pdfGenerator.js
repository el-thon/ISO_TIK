// utils/pdfGenerator.js
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/**
 * PDF Generator untuk Form Daftar Temuan Ketidaksesuaian
 */
class PDFGenerator {
  constructor(options = {}) {
    this.printRef = options.printRef || null
    this.topicId = options.topicId || null
    this.hasSignature = options.hasSignature || false
    this.downloadSignature = options.downloadSignature || null
    this.toDataUrl = options.toDataUrl || null
    this.setSignatureDataUrl = options.setSignatureDataUrl || null
    this.ensureImagesLoaded = options.ensureImagesLoaded || null
    this.setWorkflowNotice = options.setWorkflowNotice || null
    this.mode = options.mode || 'download'
  }

  /**
   * Setter untuk dependencies
   */
  setDependencies(deps) {
    this.printRef = deps.printRef || this.printRef
    this.topicId = deps.topicId || this.topicId
    this.hasSignature = deps.hasSignature ?? this.hasSignature
    this.downloadSignature = deps.downloadSignature || this.downloadSignature
    this.toDataUrl = deps.toDataUrl || this.toDataUrl
    this.setSignatureDataUrl = deps.setSignatureDataUrl || this.setSignatureDataUrl
    this.ensureImagesLoaded = deps.ensureImagesLoaded || this.ensureImagesLoaded
    this.setWorkflowNotice = deps.setWorkflowNotice || this.setWorkflowNotice
    this.mode = deps.mode || this.mode
  }

  /**
   * Handle signature sebelum export
   */
  async handleSignature() {
    if (!this.hasSignature || !this.downloadSignature || !this.toDataUrl) {
      if (this.setSignatureDataUrl) this.setSignatureDataUrl(null)
      return null
    }

    try {
      const result = await this.downloadSignature.mutateAsync()
      const blob = result instanceof Blob ? result : result?.data
      
      if (blob instanceof Blob) {
        const dataUrl = await this.toDataUrl(blob)
        const validDataUrl = typeof dataUrl === 'string' && dataUrl.startsWith('data:') 
          ? dataUrl 
          : null
        
        if (this.setSignatureDataUrl) {
          this.setSignatureDataUrl(validDataUrl)
        }
        
        return validDataUrl
      } else {
        if (this.setSignatureDataUrl) this.setSignatureDataUrl(null)
        return null
      }
    } catch {
      if (this.setSignatureDataUrl) this.setSignatureDataUrl(null)
      return null
    }
  }

  /**
   * Setup posisi elemen untuk export
   */
  setupExportElement(exportNode) {
    const previousStyle = {
      left: exportNode.style.left,
      top: exportNode.style.top,
      opacity: exportNode.style.opacity,
      zIndex: exportNode.style.zIndex,
      position: exportNode.style.position,
      display: exportNode.style.display,
      visibility: exportNode.style.visibility,
      width: exportNode.style.width,
      maxWidth: exportNode.style.maxWidth,
      transform: exportNode.style.transform,
      zoom: exportNode.style.zoom,
      boxSizing: exportNode.style.boxSizing,
    }

    // Simpan referensi ke elemen yang akan diexport
    this.exportNode = exportNode
    
    // Set style untuk export - pastikan lebar penuh dan tidak ada scale/zoom
    exportNode.style.position = 'fixed'
    exportNode.style.left = '0px'
    exportNode.style.top = '0px'
    exportNode.style.opacity = '1'
    exportNode.style.zIndex = '9999'
    exportNode.style.display = 'block'
    exportNode.style.visibility = 'visible'
  exportNode.style.width = previousStyle.width || `${exportNode.offsetWidth}px`
    exportNode.style.maxWidth = 'none'
    exportNode.style.transform = 'none'
    exportNode.style.zoom = '1'
  exportNode.style.boxSizing = 'border-box'

    this.applySignaturePageBreak(exportNode)

    return previousStyle
  }

  /**
   * Restore posisi elemen setelah export
   */
  restoreExportElement(exportNode, previousStyle) {
    if (!exportNode) return
    
    // Restore semua style ke keadaan semula
    Object.keys(previousStyle).forEach(key => {
      exportNode.style[key] = previousStyle[key]
    })
    
    this.restoreSignaturePageBreaks()

    if (this.setSignatureDataUrl) {
      this.setSignatureDataUrl(null)
    }
    
    // Cleanup
    this.exportNode = null
  }

  applySignaturePageBreak(exportNode) {
    this.signatureBreakAdjustments = []
    if (!exportNode) return

    const targets = exportNode.querySelectorAll('[data-page-break="signature"]')
    if (!targets.length) return

    const pageWidthPx = exportNode.offsetWidth || exportNode.scrollWidth
    if (!pageWidthPx) return

    const pxPerMm = pageWidthPx / 297
    const pageHeightPx = 210 * pxPerMm

    targets.forEach((target) => {
      const top = target.offsetTop
      const height = target.offsetHeight
      if (!height || !pageHeightPx) return

      const currentPageBottom = Math.ceil((top + 1) / pageHeightPx) * pageHeightPx
      if (top + height > currentPageBottom) {
        const computed = window.getComputedStyle(target)
        const existingMargin = parseFloat(computed.marginTop) || 0
        const spacer = currentPageBottom - top
        if (spacer > 0) {
          this.signatureBreakAdjustments.push({
            element: target,
            previousMarginTop: target.style.marginTop,
          })
          target.style.marginTop = `${existingMargin + spacer}px`
        }
      }
    })
  }

  restoreSignaturePageBreaks() {
    if (!this.signatureBreakAdjustments) return
    this.signatureBreakAdjustments.forEach(({ element, previousMarginTop }) => {
      if (element) {
        element.style.marginTop = previousMarginTop || ''
      }
    })
    this.signatureBreakAdjustments = null
  }

  /**
   * Generate canvas dari elemen yang akan diexport
   */
  async generateCanvas(exportNode) {
    if (!exportNode) return null

    try {
      // Pastikan elemen memiliki lebar yang cukup
  const originalWidth = Math.max(exportNode.offsetWidth, exportNode.scrollWidth)
      
      // Set lebar minimal untuk memastikan tidak ada konten yang kepotong
      if (originalWidth < 1123) {
        exportNode.style.width = '1123px'
      }

      const canvas = await html2canvas(exportNode, {
        scale: 2, // Scale lebih tinggi untuk kualitas lebih baik
        useCORS: true,
        backgroundColor: '#ffffff',
        allowTaint: false,
        logging: false,
        windowWidth: Math.max(exportNode.scrollWidth, exportNode.offsetWidth),
        windowHeight: exportNode.scrollHeight,
        onclone: (doc, element) => {
          this.cleanCloneDocument(doc, element)
          
          // Pastikan semua elemen dalam clone memiliki lebar yang cukup
          const clonedNode = element || doc.querySelector('[data-print-root="true"]')
          if (clonedNode) {
            clonedNode.style.width = exportNode.style.width || '1123px'
            clonedNode.style.maxWidth = 'none'
            clonedNode.style.overflow = 'visible'
            clonedNode.style.boxSizing = 'border-box'
            
            // Handle semua elemen anak
            clonedNode.querySelectorAll('*').forEach(el => {
              if (el.style) {
                // Pastikan tidak ada elemen yang memotong konten
                el.style.overflow = 'visible'
                el.style.maxWidth = 'none'
                
                // Untuk tabel atau grid, pastikan lebar cukup
                if (el.tagName === 'TABLE' || el.tagName === 'TD' || el.tagName === 'TH') {
                  el.style.whiteSpace = 'normal'
                  el.style.wordBreak = 'break-word'
                }
              }
            })
          }
        },
      })
      
      return canvas
    } catch {
      return null
    }
  }

  /**
   * Bersihkan dokumen clone untuk export
   */
  cleanCloneDocument(doc, element) {
    // Cari root element
    const root = element || doc.querySelector('[data-print-root="true"]')
    if (!root) return

    // Set warna dasar
    if (doc.documentElement) {
      doc.documentElement.style.color = 'rgb(17, 24, 39)'
      doc.documentElement.style.backgroundColor = 'rgb(255, 255, 255)'
    }
    
    if (doc.body) {
      doc.body.style.color = 'rgb(17, 24, 39)'
      doc.body.style.backgroundColor = 'rgb(255, 255, 255)'
      doc.body.style.margin = '0'
      doc.body.style.padding = '0'
    }

    // Reset semua elemen
    root.querySelectorAll('*').forEach((el) => {
      // Skip jika element sudah tidak ada di DOM
      if (!el || !el.style) return
      
      try {
        el.style.color = 'rgb(17, 24, 39)'
        el.style.backgroundColor = 'rgb(255, 255, 255)'
        el.style.borderColor = 'rgb(17, 24, 39)'
        el.style.boxShadow = 'none'
        el.style.filter = 'none'
        el.style.maxWidth = 'none'
        el.style.overflow = 'visible'
      } catch {
        // Abaikan error untuk elemen yang tidak bisa diakses
      }
    })

    // Tambahkan style override
    const style = doc.createElement('style')
    style.textContent = `
      [data-print-root="true"],
      [data-print-root="true"] * {
        color: rgb(17, 24, 39) !important;
        background-color: rgb(255, 255, 255) !important;
        border-color: rgb(17, 24, 39) !important;
        box-shadow: none !important;
        filter: none !important;
        max-width: none !important;
        overflow: visible !important;
      }
      
      /* Pastikan teks tidak terpotong */
      table, td, th, div, span, p {
        white-space: normal !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
      }
    `
    doc.head.appendChild(style)
  }

  /**
   * Generate PDF dari canvas dengan orientasi yang sesuai
   */
  generatePDFFromCanvas(canvas) {
    if (!canvas) return null
    
    // Tentukan orientasi berdasarkan lebar canvas
    const orientation = canvas.width > canvas.height ? 'l' : 'p'
    
    const pdf = new jsPDF({
      orientation: orientation, // Gunakan orientasi dinamis
      unit: 'mm',
      format: 'a4',
      compress: true
    })
    
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
  const margin = 8
  const printableWidth = pdfWidth - margin * 2
  const printableHeight = pdfHeight - margin * 2
    
    // Hitung dimensi gambar agar muat di PDF
  const imgWidth = printableWidth
    const pxPerMm = canvas.width / imgWidth
    const pageHeightPx = printableHeight * pxPerMm

    const xOffset = margin + (printableWidth - imgWidth) / 2
    let position = 0
    let pageIndex = 0

    while (position < canvas.height) {
      const sliceHeight = Math.min(pageHeightPx, canvas.height - position)
      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = canvas.width
      pageCanvas.height = sliceHeight

      const ctx = pageCanvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(
          canvas,
          0,
          position,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        )
      }

      const pageImgData = pageCanvas.toDataURL('image/png')
      const renderedHeight = sliceHeight / pxPerMm

      if (pageIndex > 0) {
        pdf.addPage()
      }

      pdf.addImage(pageImgData, 'PNG', xOffset, margin, imgWidth, renderedHeight, undefined, 'FAST')

      position += sliceHeight
      pageIndex += 1
    }

    return pdf
  }

  /**
   * Tunggu semua gambar load
   */
  async waitForImages(node) {
    if (!node) return
    
    const images = Array.from(node.querySelectorAll('img'))
    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) {
              resolve()
            } else {
              img.onload = () => resolve()
              img.onerror = () => resolve() // Resolve even on error to continue
              // Timeout untuk gambar yang terlalu lama
              setTimeout(resolve, 3000)
            }
          })
      )
    )
  }

  /**
   * Ukur lebar konten yang sebenarnya
   */
  measureContentWidth(node) {
    if (!node) return 0
    
    // Clone node untuk pengukuran
    const clone = node.cloneNode(true)
    clone.style.position = 'fixed'
    clone.style.left = '-9999px'
    clone.style.top = '0'
    clone.style.visibility = 'hidden'
    clone.style.width = 'auto'
    clone.style.maxWidth = 'none'
    document.body.appendChild(clone)
    
    const width = clone.scrollWidth
    document.body.removeChild(clone)
    
    return width
  }

  /**
   * Main function untuk export PDF
   */
  async exportPDF() {
    // Validasi
    if (!this.printRef || !this.printRef.current) {
      if (this.setWorkflowNotice) {
        this.setWorkflowNotice({ 
          type: 'error', 
          text: 'Tidak ada konten untuk diexport.' 
        })
      }
      return
    }

    try {
      // Handle signature
      await this.handleSignature()

      const exportNode = this.printRef.current
      
      // Ukur lebar konten sebenarnya
  this.measureContentWidth(exportNode)
      
      // Tunggu semua gambar load
      await this.waitForImages(exportNode)
      
      // Setup posisi untuk export
      const previousStyle = this.setupExportElement(exportNode)

      // Beri sedikit delay agar rendering selesai
      await new Promise(resolve => setTimeout(resolve, 300))

      // Generate canvas
      const canvas = await this.generateCanvas(exportNode)
      
      // Restore posisi elemen
      this.restoreExportElement(exportNode, previousStyle)

      // Handle error jika canvas gagal
      if (!canvas) {
        if (this.setWorkflowNotice) {
          this.setWorkflowNotice({ 
            type: 'error', 
            text: 'Gagal membuat PDF. Coba muat ulang halaman dan ulangi export.' 
          })
        }
        return
      }

      // Generate dan save PDF
      const pdf = this.generatePDFFromCanvas(canvas, this.topicId)
      
      if (pdf) {
        const filename = `Form-Temuan-${this.topicId || 'export'}.pdf`
        if (this.mode === 'preview') {
          const url = pdf.output('bloburl')
          window.open(url, '_blank', 'noopener,noreferrer')
        } else {
          const blob = pdf.output('blob')
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = filename
          link.click()
          URL.revokeObjectURL(url)
        }
      }

      return pdf
      
    } catch (error) {
      if (this.setWorkflowNotice) {
        this.setWorkflowNotice({ 
          type: 'error', 
          text: 'Terjadi kesalahan saat membuat PDF: ' + (error.message || 'Unknown error') 
        })
      }
    }
  }
}

// Factory function untuk memudahkan penggunaan
export const createPDFGenerator = (deps) => {
  const generator = new PDFGenerator()
  generator.setDependencies(deps)
  return generator
}

// Helper function untuk single use
export async function generatePDF(deps) {
  const generator = createPDFGenerator(deps)
  return await generator.exportPDF()
}

export default PDFGenerator