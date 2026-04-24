"use client"

import Link from "next/link"
import { useState } from "react"
import { Home, Pencil, Plus, Trash2, UsersRound } from "lucide-react"
import { toast } from "sonner"

import { AppReadyBoundary } from "@/components/common/app-ready-boundary"
import { EmptyState } from "@/components/common/empty-state"
import { PageHeader } from "@/components/common/page-header"
import { PropertyFormDialog } from "@/components/properties/property-form-dialog"
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
import { useProperties } from "@/hooks/use-properties"
import { useTenants } from "@/hooks/use-tenants"
import { formatCurrency, formatPropertyAddress, getPropertyTotal } from "@/lib/format"
import { sortProperties } from "@/lib/receipt"
import { createProperty, deleteProperty, updateProperty } from "@/services/properties-service"
import type { Property, PropertyInput } from "@/types/domain"

export function PropertiesScreen() {
  const { properties, error } = useProperties()
  const { tenants } = useTenants()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null)
  const [isPending, setIsPending] = useState(false)

  const orderedProperties = sortProperties(properties)

  async function handleSubmit(values: PropertyInput) {
    setIsPending(true)

    try {
      if (editingProperty) {
        await updateProperty(editingProperty.id, values)
        toast.success("Bien mis à jour.")
      } else {
        await createProperty(values)
        toast.success("Bien ajouté.")
      }

      setDialogOpen(false)
      setEditingProperty(null)
    } catch (submitError) {
      toast.error(
        submitError instanceof Error
          ? submitError.message
          : "Impossible d'enregistrer le bien."
      )
    } finally {
      setIsPending(false)
    }
  }

  async function handleDelete() {
    if (!propertyToDelete) {
      return
    }

    setIsPending(true)

    try {
      await deleteProperty(propertyToDelete.id)
      toast.success("Bien supprimé.")
      setPropertyToDelete(null)
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : "Impossible de supprimer le bien."
      )
    } finally {
      setIsPending(false)
    }
  }

  function openCreateDialog() {
    setEditingProperty(null)
    setDialogOpen(true)
  }

  function openEditDialog(property: Property) {
    setEditingProperty(property)
    setDialogOpen(true)
  }

  return (
    <AppReadyBoundary>
      <div className="space-y-5">
        <PageHeader
          title="Biens"
          description="Chaque bien porte le loyer, les charges et la référence technique commune."
          action={
            <Button size="lg" onClick={openCreateDialog}>
              <Plus className="size-4" />
              Ajouter un bien
            </Button>
          }
        />

        {error ? (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="px-5 py-4 text-sm text-destructive">
              {error}
            </CardContent>
          </Card>
        ) : null}

        {orderedProperties.length === 0 ? (
          <EmptyState
            icon={Home}
            title="Aucun bien pour l'instant"
            description="Commence par enregistrer ton premier bien pour pouvoir y rattacher des locataires puis générer des quittances."
            action={
              <Button onClick={openCreateDialog}>
                <Plus className="size-4" />
                Créer le premier bien
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {orderedProperties.map((property) => {
              const propertyTenants = tenants.filter(
                (tenant) => tenant.propertyId === property.id
              )

              return (
                <Card
                  key={property.id}
                  className="border-white/70 bg-white/88 shadow-sm"
                >
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <h3 className="font-heading text-xl font-semibold text-slate-950">
                          {property.residenceName || property.addressLine1}
                        </h3>
                        <div className="space-y-1 text-sm text-slate-600">
                          <p>{formatPropertyAddress(property)}</p>
                          <p>IRL {property.technicalReference}</p>
                        </div>
                      </div>
                      <div className="rounded-[22px] bg-amber-50 px-4 py-3 text-right">
                        <p className="text-xs uppercase tracking-[0.2em] text-amber-700">
                          Total
                        </p>
                        <p className="text-lg font-semibold text-slate-950">
                          {formatCurrency(getPropertyTotal(property))}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                      <span>{formatCurrency(property.baseRent)} de loyer</span>
                      <span>•</span>
                      <span>{formatCurrency(property.charges)} de charges</span>
                      <span>•</span>
                      <span>
                        {propertyTenants.length} locataire
                        {propertyTenants.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => openEditDialog(property)}
                      >
                        <Pencil className="size-4" />
                        Modifier
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href={`/locataires?propertyId=${property.id}`}>
                          <UsersRound className="size-4" />
                          Locataires
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setPropertyToDelete(property)}
                      >
                        <Trash2 className="size-4" />
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <PropertyFormDialog
          open={dialogOpen}
          property={editingProperty}
          isPending={isPending}
          onOpenChange={setDialogOpen}
          onSubmit={handleSubmit}
        />

        <AlertDialog
          open={Boolean(propertyToDelete)}
          onOpenChange={(open) => {
            if (!open) {
              setPropertyToDelete(null)
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce bien ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action supprime aussi les locataires rattachés à ce bien.
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
