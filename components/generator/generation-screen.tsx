"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Search, Settings2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { AppReadyBoundary } from "@/components/common/app-ready-boundary"
import { EmptyState } from "@/components/common/empty-state"
import { PageHeader } from "@/components/common/page-header"
import { PdfPreviewPanel } from "@/components/generator/pdf-preview-panel"
import { ReceiptTargetCard } from "@/components/generator/receipt-target-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLandlordSettings } from "@/hooks/use-landlord-settings"
import { useProperties } from "@/hooks/use-properties"
import { useTenants } from "@/hooks/use-tenants"
import { buildYearOptions, MONTH_OPTIONS } from "@/lib/constants"
import { buildReceiptFileName, hydratePropertiesWithTenants, matchesReceiptTargetSearch } from "@/lib/receipt"
import { buildReceiptPdfBlob, downloadPdf, printPdf } from "@/pdf/rent-receipt"

export function GenerationScreen() {
  const today = new Date()
  const [month, setMonth] = useState(String(today.getMonth() + 1))
  const [year, setYear] = useState(String(today.getFullYear()))
  const [search, setSearch] = useState("")
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewFileName, setPreviewFileName] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const { settings, error: settingsError } = useLandlordSettings()
  const { properties, error: propertiesError } = useProperties()
  const { tenants, error: tenantsError } = useTenants()

  const receiptTargets = hydratePropertiesWithTenants(properties, tenants).filter(
    (target) => target.tenants.length > 0
  )
  const filteredTargets = receiptTargets.filter((target) =>
    matchesReceiptTargetSearch(target, search)
  )
  const selectedTarget =
    receiptTargets.find((target) => target.id === selectedPropertyId) ?? null
  const canGenerate =
    Boolean(selectedTarget) &&
    Boolean(settings) &&
    (selectedTarget?.tenants.length ?? 0) > 0

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  async function handleGenerate() {
    if (!settings) {
      toast.error("Renseigne d'abord les paramètres bailleur.")
      return
    }

    if (!selectedTarget || selectedTarget.tenants.length === 0) {
      toast.error("Sélectionne une carte valide.")
      return
    }

    setIsGenerating(true)

    try {
      const blob = await buildReceiptPdfBlob({
        landlordSettings: settings,
        property: selectedTarget,
        tenants: selectedTarget.tenants,
        month: Number(month),
        year: Number(year),
      })
      const nextPreviewUrl = URL.createObjectURL(blob)
      const nextFileName = buildReceiptFileName(
        selectedTarget,
        selectedTarget.tenants,
        Number(month),
        Number(year)
      )

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      setPreviewUrl(nextPreviewUrl)
      setPreviewFileName(nextFileName)
      toast.success("Quittance générée.")
    } catch (generationError) {
      toast.error(
        generationError instanceof Error
          ? generationError.message
          : "Impossible de générer la quittance."
      )
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <AppReadyBoundary>
      <div className="space-y-5">
        <PageHeader
          title="Générer une quittance"
          description="Choisis le mois, trouve le bon bien, sélectionne la carte et ouvre immédiatement le PDF."
        />

        {settingsError || propertiesError || tenantsError ? (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="px-5 py-4 text-sm text-destructive">
              {settingsError || propertiesError || tenantsError}
            </CardContent>
          </Card>
        ) : null}

        {!settings ? (
          <Card className="border-amber-200 bg-amber-50 shadow-sm">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="font-medium text-slate-950">
                  Les paramètres bailleur sont requis avant la première quittance.
                </p>
                <p className="text-sm text-slate-600">
                  Nom, adresse et libellé de signature.
                </p>
              </div>
              <Button asChild>
                <Link href="/parametres">
                  <Settings2 className="size-4" />
                  Ouvrir les paramètres
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-white/70 bg-white/90 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="font-heading text-xl">Période et recherche</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_160px_140px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher un locataire, une adresse, une référence..."
                  className="pl-9"
                />
              </div>

              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Mois" />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Année" />
                </SelectTrigger>
                <SelectContent>
                  {buildYearOptions().map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="w-full"
            >
              <Sparkles className="size-4" />
              {isGenerating ? "Génération..." : "Générer la quittance"}
            </Button>
          </CardContent>
        </Card>

        {receiptTargets.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Aucune carte disponible"
            description="Ajoute un bien puis au moins un locataire pour afficher des cartes de génération."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild>
                  <Link href="/biens">Créer un bien</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/locataires">Ajouter un locataire</Link>
                </Button>
              </div>
            }
          />
        ) : filteredTargets.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Aucun résultat"
            description="Essaie avec un autre nom, une autre adresse ou la référence technique."
          />
        ) : (
          <div className="space-y-4">
            {filteredTargets.map((target) => (
              <ReceiptTargetCard
                key={target.id}
                property={target}
                selected={selectedPropertyId === target.id}
                onSelect={() => setSelectedPropertyId(target.id)}
              />
            ))}
          </div>
        )}

        {previewUrl ? (
          <PdfPreviewPanel
            previewUrl={previewUrl}
            isGenerating={isGenerating}
            fileName={previewFileName}
            onDownload={() => downloadPdf(previewUrl, previewFileName)}
            onPrint={() => void printPdf(previewUrl)}
            onClose={() => {
              URL.revokeObjectURL(previewUrl)
              setPreviewUrl(null)
              setPreviewFileName("")
            }}
          />
        ) : null}
      </div>
    </AppReadyBoundary>
  )
}
