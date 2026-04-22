import { Download, Printer, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PdfPreviewPanelProps {
  previewUrl: string
  isGenerating: boolean
  onDownload: () => void
  onPrint: () => void
  onClose: () => void
}

export function PdfPreviewPanel({
  previewUrl,
  isGenerating,
  onDownload,
  onPrint,
  onClose,
}: PdfPreviewPanelProps) {
  return (
    <Card className="overflow-hidden border-slate-900/10 bg-white/90 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.45)]">
      <CardHeader className="gap-4 border-b bg-slate-950 px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
            Aperçu PDF
          </p>
          <CardTitle className="font-heading text-xl">Quittance prête à imprimer</CardTitle>
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
            variant="ghost"
            onClick={onClose}
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
            Fermer
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <iframe
          title="Aperçu de la quittance"
          src={previewUrl}
          className="h-[65vh] w-full bg-slate-100"
        />
      </CardContent>
    </Card>
  )
}
