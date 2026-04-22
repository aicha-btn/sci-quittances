"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Tenant, TenantInput } from "@/types/domain"
import { tenantFormSchema, type TenantFormValues } from "@/validations/tenant"

interface TenantFormDialogProps {
  open: boolean
  propertyId: string
  tenant: Tenant | null
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: TenantInput) => Promise<void>
}

export function TenantFormDialog({
  open,
  propertyId,
  tenant,
  isPending,
  onOpenChange,
  onSubmit,
}: TenantFormDialogProps) {
  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      propertyId,
      title: "Monsieur",
      firstName: "",
      lastName: "",
      order: 1,
    },
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset({
      propertyId,
      title: tenant?.title ?? "Monsieur",
      firstName: tenant?.firstName ?? "",
      lastName: tenant?.lastName ?? "",
      order: tenant?.order ?? 1,
    })
  }, [form, open, propertyId, tenant])

  async function handleValidSubmit(values: TenantFormValues) {
    await onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-1rem)] rounded-[28px] p-0 sm:max-w-lg">
        <div className="flex flex-col">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle className="font-heading text-2xl">
              {tenant ? "Modifier le locataire" : "Nouveau locataire"}
            </DialogTitle>
            <DialogDescription>
              L’ordre sert à garder un affichage stable en colocation.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit(handleValidSubmit)}
            className="space-y-4 px-5 py-5"
          >
            <Controller
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormField
                  htmlFor="tenant-title"
                  label="Civilité"
                  required
                  error={form.formState.errors.title?.message}
                >
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="tenant-title" className="w-full">
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monsieur">Monsieur</SelectItem>
                      <SelectItem value="Madame">Madame</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              )}
            />

            <FormField
              htmlFor="firstName"
              label="Prénom"
              required
              error={form.formState.errors.firstName?.message}
            >
              <Input id="firstName" {...form.register("firstName")} />
            </FormField>

            <FormField
              htmlFor="lastName"
              label="Nom"
              required
              error={form.formState.errors.lastName?.message}
            >
              <Input id="lastName" {...form.register("lastName")} />
            </FormField>

            <FormField
              htmlFor="order"
              label="Ordre d'affichage"
              required
              error={form.formState.errors.order?.message}
            >
              <Input
                id="order"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                {...form.register("order", {
                  setValueAs: (value) =>
                    value === "" ? Number.NaN : Number(value),
                })}
              />
            </FormField>

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
