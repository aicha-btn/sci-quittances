import { useState } from "react"
import dynamic from "next/dynamic"
import { Download, Expand, ExternalLink, Printer, X } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const PdfZoomViewer = dynamic(
  () =>
    import("@/components/generator/pdf-zoom-viewer").then(
      (module) => module.PdfZoomViewer
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[50vh] items-center justify-center bg-slate-100 text-sm text-slate-500">
        Chargement de l’aperçu...
      </div>
    ),
  }
)

interface PdfPreviewPanelProps {
  previewUrl: string
  isGenerating: boolean
  fileName: string
  onDownload: () => void
  onPrint: () => void
  onClose: () => void
}

export function PdfPreviewPanel({
  previewUrl,
  isGenerating,
  fileName,
  onDownload,
  onPrint,
  onClose,
}: PdfPreviewPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <>
      <Card className="overflow-hidden border-slate-900/10 bg-white/90 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.45)]">
        <CardHeader className="gap-4 border-b bg-slate-950 px-5 py-4 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
                Aperçu PDF
              </p>
              <CardTitle className="font-heading text-xl">
                Quittance prête à imprimer
              </CardTitle>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={onDownload}
                disabled={isGenerating}
                className="bg-white text-slate-950 hover:bg-white/90"
              >
                <Download className="size-4" />
                Télécharger
              </Button>
              <Button
                variant="secondary"
                onClick={onPrint}
                disabled={isGenerating}
                className="bg-white/15 text-white hover:bg-white/20"
              >
                <Printer className="size-4" />
                Imprimer
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsExpanded(true)}
                className="bg-white/15 text-white hover:bg-white/20"
              >
                <Expand className="size-4" />
                Plein écran
              </Button>
              <Button
                variant="secondary"
                asChild
                className="bg-white/15 text-white hover:bg-white/20"
              >
                <a href={previewUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" />
                  Ouvrir
                </a>
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-white hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
                Fermer
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          <PdfZoomViewer
            key={`inline-${previewUrl}`}
            fileUrl={previewUrl}
            className="h-[68vh] sm:h-[74vh]"
          />
        </CardContent>
      </Card>

      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="h-[96vh] max-w-[calc(100%-0.75rem)] overflow-hidden rounded-[28px] p-0 sm:max-w-6xl">
          <div className="flex h-full min-h-0 flex-col">
            <DialogHeader className="border-b px-5 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <DialogTitle className="font-heading text-2xl">
                    Aperçu plein écran
                  </DialogTitle>
                  <p className="text-sm text-slate-600">{fileName}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={onDownload} disabled={isGenerating}>
                    <Download className="size-4" />
                    Télécharger
                  </Button>
                  <Button variant="outline" onClick={onPrint} disabled={isGenerating}>
                    <Printer className="size-4" />
                    Imprimer
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div className="min-h-0 flex-1 p-3 sm:p-4">
              <PdfZoomViewer
                key={`dialog-${previewUrl}`}
                fileUrl={previewUrl}
                className="h-full"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
