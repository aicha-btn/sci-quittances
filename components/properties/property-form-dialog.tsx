"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { FormField } from "@/components/common/form-field"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { Property, PropertyInput } from "@/types/domain"
import {
  propertyFormSchema,
  type PropertyFormValues,
} from "@/validations/property"

interface PropertyFormDialogProps {
  open: boolean
  property: Property | null
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: PropertyInput) => Promise<void>
}

const defaultValues: PropertyFormValues = {
  residenceName: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  city: "",
  entryDate: "",
  entryDateDetail: "",
  technicalReference: "",
  baseRent: 0,
  charges: 0,
}

export function PropertyFormDialog({
  open,
  property,
  isPending,
  onOpenChange,
  onSubmit,
}: PropertyFormDialogProps) {
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) {
      return
    }

    if (!property) {
      form.reset(defaultValues)
      return
    }

    form.reset({
      residenceName: property.residenceName,
      addressLine1: property.addressLine1,
      addressLine2: property.addressLine2,
      postalCode: property.postalCode,
      city: property.city,
      entryDate: property.entryDate,
      entryDateDetail: property.entryDateDetail,
      technicalReference: property.technicalReference,
      baseRent: property.baseRent,
      charges: property.charges,
    })
  }, [form, open, property])

  async function handleValidSubmit(values: PropertyFormValues) {
    await onSubmit({
      ...values,
      residenceName: values.residenceName ?? "",
      addressLine2: values.addressLine2 ?? "",
      entryDateDetail: values.entryDateDetail ?? "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[calc(100%-1rem)] overflow-hidden rounded-[28px] p-0 sm:max-w-2xl">
        <div className="flex max-h-[92vh] flex-col">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle className="font-heading text-2xl">
              {property ? "Modifier le bien" : "Nouveau bien"}
            </DialogTitle>
            <DialogDescription>
              Adresse, date d'entrée, IRL, loyer et charges du bien.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit(handleValidSubmit)}
            className="flex flex-1 flex-col"
          >
            <div className="grid flex-1 gap-4 overflow-y-auto px-5 py-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField
                  htmlFor="residenceName"
                  label="Résidence"
                  description="Optionnel"
                  error={form.formState.errors.residenceName?.message}
                >
                  <Input id="residenceName" {...form.register("residenceName")} />
                </FormField>
              </div>

              <div className="sm:col-span-2">
                <FormField
                  htmlFor="addressLine1"
                  label="Adresse"
                  required
                  error={form.formState.errors.addressLine1?.message}
                >
                  <Input id="addressLine1" {...form.register("addressLine1")} />
                </FormField>
              </div>

              <div className="sm:col-span-2">
                <FormField
                  htmlFor="addressLine2"
                  label="Complément d'adresse"
                  description="Appartement, étage, bâtiment..."
                  error={form.formState.errors.addressLine2?.message}
                >
                  <Input id="addressLine2" {...form.register("addressLine2")} />
                </FormField>
              </div>

              <FormField
                htmlFor="postalCode"
                label="Code postal"
                required
                error={form.formState.errors.postalCode?.message}
              >
                <Input
                  id="postalCode"
                  inputMode="numeric"
                  maxLength={5}
                  {...form.register("postalCode")}
                />
              </FormField>

              <FormField
                htmlFor="city"
                label="Ville"
                required
                error={form.formState.errors.city?.message}
              >
                <Input id="city" {...form.register("city")} />
              </FormField>

              <FormField
                htmlFor="entryDate"
                label="Date d'entrée"
                required
                error={form.formState.errors.entryDate?.message}
              >
                <Input id="entryDate" type="date" {...form.register("entryDate")} />
              </FormField>

              <FormField
                htmlFor="entryDateDetail"
                label="Précision date d'entrée"
                description="Optionnel, par exemple cours 2e trimestre 2019"
                error={form.formState.errors.entryDateDetail?.message}
              >
                <Input
                  id="entryDateDetail"
                  placeholder="Ex. cours 2e trimestre 2019"
                  {...form.register("entryDateDetail")}
                />
              </FormField>

              <FormField
                htmlFor="technicalReference"
                label="IRL"
                description="Indice de référence des loyers, par exemple 124,32"
                required
                error={form.formState.errors.technicalReference?.message}
              >
                <Input
                  id="technicalReference"
                  placeholder="Ex. 124,32"
                  {...form.register("technicalReference")}
                />
              </FormField>

              <FormField
                htmlFor="baseRent"
                label="Loyer hors charges"
                required
                error={form.formState.errors.baseRent?.message}
              >
                <Input
                  id="baseRent"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  {...form.register("baseRent", {
                    setValueAs: (value) =>
                      value === "" ? Number.NaN : Number(value),
                  })}
                />
              </FormField>

              <FormField
                htmlFor="charges"
                label="Charges"
                required
                error={form.formState.errors.charges?.message}
              >
                <Input
                  id="charges"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  {...form.register("charges", {
                    setValueAs: (value) =>
                      value === "" ? Number.NaN : Number(value),
                  })}
                />
              </FormField>
            </div>

            <DialogFooter className="border-t bg-slate-50/80 px-5 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
