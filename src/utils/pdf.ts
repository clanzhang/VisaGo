// utils/pdf.ts
// 基于 jsPDF + html2canvas 的 PDF 生成工具

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export async function exportElementToPdf(
  element: HTMLElement,
  options: { filename?: string; title?: string } = {},
): Promise<void> {
  const { filename = 'document.pdf', title } = options
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  })

  const pdf = new jsPDF('p', 'pt', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 40
  const contentWidth = pageWidth - margin * 2

  const imgHeight = (canvas.height * contentWidth) / canvas.width
  const imgData = canvas.toDataURL('image/png')

  let heightLeft = imgHeight
  let position = margin

  if (title) {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(16)
    pdf.text(title, margin, margin + 16)
    position += 24
    heightLeft -= 24
  }

  pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight)
  heightLeft -= pageHeight - margin * 2

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight)
    heightLeft -= pageHeight - margin * 2
  }

  pdf.save(filename)
}
