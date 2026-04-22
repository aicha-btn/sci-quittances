import { pdf } from "@react-pdf/renderer"

import type { ReceiptPdfData } from "@/types/domain"
import { RentReceiptDocument } from "@/pdf/rent-receipt-document"

export async function buildReceiptPdfBlob(data: ReceiptPdfData) {
  return pdf(<RentReceiptDocument data={data} />).toBlob()
}

export function downloadPdf(previewUrl: string, fileName: string) {
  const link = document.createElement("a")
  link.href = previewUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export function printPdf(previewUrl: string) {
  return new Promise<void>((resolve) => {
    const frame = document.createElement("iframe")
    frame.style.position = "fixed"
    frame.style.right = "0"
    frame.style.bottom = "0"
    frame.style.width = "0"
    frame.style.height = "0"
    frame.style.border = "0"
    frame.src = previewUrl

    frame.onload = () => {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()

      window.setTimeout(() => {
        frame.remove()
        resolve()
      }, 1000)
    }

    document.body.appendChild(frame)
  })
}
