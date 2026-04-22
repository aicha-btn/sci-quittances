"use client"

import { useEffect, useRef, useState } from "react"
import { LoaderCircle, RotateCcw, ZoomIn, ZoomOut } from "lucide-react"
import { Document, Page, pdfjs } from "react-pdf"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

const MIN_ZOOM = 0.8
const MAX_ZOOM = 2.4
const ZOOM_STEP = 0.2

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
}

export function PdfZoomViewer({
  fileUrl,
  className,
}: {
  fileUrl: string
  className?: string
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [containerWidth, setContainerWidth] = useState(0)
  const [numPages, setNumPages] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(true)

  useEffect(() => {
    const node = viewportRef.current

    if (!node) {
      return
    }

    const updateWidth = () => {
      setContainerWidth(node.clientWidth)
    }

    updateWidth()

    const resizeObserver = new ResizeObserver(updateWidth)
    resizeObserver.observe(node)

    return () => resizeObserver.disconnect()
  }, [])

  const usableWidth = Math.max(280, containerWidth - 32)
  const pageWidth = containerWidth > 0 ? Math.round(usableWidth * zoom) : undefined

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-3 py-3">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Visualisation
          </p>
          <p className="text-sm text-slate-600">
            {numPages > 0 ? `${numPages} page${numPages > 1 ? "s" : ""}` : "PDF"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setZoom((currentZoom) => clampZoom(currentZoom - ZOOM_STEP))}
            disabled={zoom <= MIN_ZOOM}
          >
            <ZoomOut className="size-4" />
            Zoom -
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setZoom(1)}
            disabled={Math.abs(zoom - 1) < 0.01}
          >
            <RotateCcw className="size-4" />
            Ajuster
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setZoom((currentZoom) => clampZoom(currentZoom + ZOOM_STEP))}
            disabled={zoom >= MAX_ZOOM}
          >
            <ZoomIn className="size-4" />
            Zoom +
          </Button>
          <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
            {Math.round(zoom * 100)}%
          </div>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="min-h-0 flex-1 overflow-auto bg-[linear-gradient(180deg,_#edf2f7_0%,_#e2e8f0_100%)]"
        style={{ touchAction: "pan-x pan-y" }}
      >
        <div className="flex min-h-full min-w-full items-start justify-center p-3 sm:p-5">
          <Document
            file={fileUrl}
            loading={
              <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-[28px] bg-white px-6 py-12 text-slate-500 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.42)]">
                <LoaderCircle className="size-6 animate-spin" />
                <p className="text-sm">Chargement du PDF...</p>
              </div>
            }
            error={
              <div className="rounded-[28px] bg-white px-6 py-8 text-center text-sm text-destructive shadow-[0_16px_40px_-28px_rgba(15,23,42,0.42)]">
                {loadError ?? "Impossible d'afficher le PDF."}
              </div>
            }
            onLoadSuccess={({ numPages: nextNumPages }) => {
              setNumPages(nextNumPages)
              setLoadError(null)
            }}
            onLoadError={(error) => {
              setLoadError(error.message)
              setIsRendering(false)
            }}
            className="mx-auto"
          >
            <Page
              pageNumber={1}
              width={pageWidth}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              loading={
                <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-[28px] bg-white px-6 py-12 text-slate-500 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.42)]">
                  <LoaderCircle className="size-6 animate-spin" />
                  <p className="text-sm">Rendu de la page...</p>
                </div>
              }
              onRenderSuccess={() => setIsRendering(false)}
              className={cn(
                "overflow-hidden rounded-[28px] bg-white shadow-[0_18px_45px_-28px_rgba(15,23,42,0.46)]",
                isRendering && "opacity-90"
              )}
            />
          </Document>
        </div>
      </div>
    </div>
  )
}
