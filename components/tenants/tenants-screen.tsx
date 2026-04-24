"use client"

import Link from "next/link"
import { useState } from "react"
import { Home, Pencil, Plus, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

import { AppReadyBoundary } from "@/components/common/app-ready-boundary"
import { EmptyState } from "@/components/common/empty-state"
import { PageHeader } from "@/components/common/page-header"
import { TenantFormDialog } from "@/components/tenants/tenant-form-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useProperties } from "@/hooks/use-properties"
import { useTenants } from "@/hooks/use-tenants"
import {
  formatPropertyAddress,
  formatTenantEntryLabel,
  formatTenantName,
} from "@/lib/format"
import { sortProperties, sortTenants } from "@/lib/receipt"
import { createTenant, deleteTenant, updateTenant } from "@/services/tenants-service"
import type { Tenant, TenantInput } from "@/types/domain"

export function TenantsScreen({
  initialPropertyId,
}: {
  initialPropertyId?: string
}) {
  const { properties, error: propertiesError } = useProperties()
  const { tenants, error: tenantsError } = useTenants()
  const [selectedPropertyId, setSelectedPropertyId] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null)
  const [isPending, setIsPending] = useState(false)

  const orderedProperties = sortProperties(properties)
  const fallbackPropertyId =
    orderedProperties.find((property) => property.id === initialPropertyId)?.id ??
    orderedProperties[0]?.id ??
    ""
  const activePropertyId =
    orderedProperties.some((property) => property.id === selectedPropertyId)
      ? selectedPropertyId
      : fallbackPropertyId
  const selectedProperty =
    orderedProperties.find((property) => property.id === activePropertyId) ?? null
  const visibleTenants = sortTenants(
    tenants.filter((tenant) => tenant.propertyId === activePropertyId)
  )

  async function handleSubmit(values: TenantInput) {
    setIsPending(true)

    try {
      if (editingTenant) {
        await updateTenant(editingTenant.id, values)
        toast.success("Locataire mis à jour.")
      } else {
        await createTenant(values)
        toast.success("Locataire ajouté.")
      }

      setDialogOpen(false)
      setEditingTenant(null)
    } catch (submitError) {
      toast.error(
        submitError instanceof Error
          ? submitError.message
          : "Impossible d'enregistrer le locataire."
      )
    } finally {
      setIsPending(false)
    }
  }

  async function handleDelete() {
    if (!tenantToDelete) {
      return
    }

    setIsPending(true)

    try {
      await deleteTenant(tenantToDelete.id)
      toast.success("Locataire supprimé.")
      setTenantToDelete(null)
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : "Impossible de supprimer le locataire."
      )
    } finally {
      setIsPending(false)
    }
  }

  function openCreateDialog() {
    setEditingTenant(null)
    setDialogOpen(true)
  }

  function openEditDialog(tenant: Tenant) {
    setEditingTenant(tenant)
    setDialogOpen(true)
  }

  return (
    <AppReadyBoundary>
      <div className="space-y-5">
        <PageHeader
          title="Locataires"
          description="Ajoute les occupants d’un bien. En colocation, une seule quittance est générée avec tous les noms."
        />

        {propertiesError || tenantsError ? (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="px-5 py-4 text-sm text-destructive">
              {propertiesError || tenantsError}
            </CardContent>
          </Card>
        ) : null}

        {orderedProperties.length === 0 ? (
          <EmptyState
            icon={Home}
            title="Aucun bien disponible"
            description="Crée d'abord un bien avant d'ajouter des locataires."
            action={
              <Button asChild>
                <Link href="/biens">
                  <Plus className="size-4" />
                  Créer un bien
                </Link>
              </Button>
            }
          />
        ) : (
          <>
            <Card className="border-white/70 bg-white/88 shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">Bien concerné</p>
                    <Select
                      value={activePropertyId}
                      onValueChange={setSelectedPropertyId}
                    >
                      <SelectTrigger className="w-full min-w-[16rem] bg-white sm:w-[22rem]">
                        <SelectValue placeholder="Choisir un bien" />
                      </SelectTrigger>
                      <SelectContent>
                        {orderedProperties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.residenceName || property.addressLine1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={openCreateDialog} disabled={!activePropertyId}>
                    <Plus className="size-4" />
                    Ajouter un locataire
                  </Button>
                </div>

                {selectedProperty ? (
                  <div className="rounded-[24px] bg-amber-50 p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-950">
                      {selectedProperty.residenceName || selectedProperty.addressLine1}
                    </p>
                    <p>{formatPropertyAddress(selectedProperty)}</p>
                    <p>IRL {selectedProperty.technicalReference}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {visibleTenants.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Aucun locataire sur ce bien"
                description="Ajoute le premier locataire pour alimenter la génération de quittance."
                action={
                  <Button onClick={openCreateDialog}>
                    <Plus className="size-4" />
                    Ajouter un locataire
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                {visibleTenants.map((tenant) => (
                  <Card
                    key={tenant.id}
                    className="border-white/70 bg-white/88 shadow-sm"
                  >
                    <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <h3 className="font-heading text-xl font-semibold text-slate-950">
                          {formatTenantName(tenant, true)}
                        </h3>
                        <p className="text-sm text-slate-600">
                          Entrée: {formatTenantEntryLabel(tenant)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          onClick={() => openEditDialog(tenant)}
                        >
                          <Pencil className="size-4" />
                          Modifier
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => setTenantToDelete(tenant)}
                        >
                          <Trash2 className="size-4" />
                          Supprimer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {activePropertyId ? (
          <TenantFormDialog
            open={dialogOpen}
            propertyId={activePropertyId}
            tenant={editingTenant}
            isPending={isPending}
            onOpenChange={setDialogOpen}
            onSubmit={handleSubmit}
          />
        ) : null}

        <AlertDialog
          open={Boolean(tenantToDelete)}
          onOpenChange={(open) => {
            if (!open) {
              setTenantToDelete(null)
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce locataire ?</AlertDialogTitle>
              <AlertDialogDescription>
                La quittance du bien affichera ensuite les noms restants seulement.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={isPending}
                onClick={handleDelete}
              >
                {isPending ? "Suppression..." : "Supprimer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppReadyBoundary>
  )
}
