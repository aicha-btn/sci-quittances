"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"

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
      tenantType: "individual",
      title: "",
      companyName: "",
      firstName: "",
      lastName: "",
      entryDate: "",
      entryDateDetail: "",
    },
  })
  const tenantType =
    useWatch({
      control: form.control,
      name: "tenantType",
    }) ?? "individual"

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset({
      propertyId,
      tenantType: tenant?.tenantType ?? "individual",
      title: tenant?.title ?? "",
      companyName: tenant?.companyName ?? "",
      firstName: tenant?.firstName ?? "",
      lastName: tenant?.lastName ?? "",
      entryDate: tenant?.entryDate ?? "",
      entryDateDetail: tenant?.entryDateDetail ?? "",
    })
  }, [form, open, propertyId, tenant])

  async function handleValidSubmit(values: TenantFormValues) {
    await onSubmit({
      ...values,
      title: values.tenantType === "individual" ? values.title : "",
      companyName:
        values.tenantType === "company" ? values.companyName ?? "" : "",
      firstName: values.tenantType === "individual" ? values.firstName : "",
      lastName: values.tenantType === "individual" ? values.lastName : "",
      entryDateDetail: values.entryDateDetail ?? "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[calc(100%-1rem)] overflow-hidden rounded-[28px] p-0 sm:max-w-lg">
        <div className="flex max-h-[92vh] flex-col">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle className="font-heading text-2xl">
              {tenant ? "Modifier le locataire" : "Nouveau locataire"}
            </DialogTitle>
            <DialogDescription>
              Particulier ou société, avec date d&apos;entrée du locataire.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit(handleValidSubmit)}
            className="flex flex-1 flex-col"
          >
            <div className="space-y-4 overflow-y-auto px-5 py-5">
              <Controller
                control={form.control}
                name="tenantType"
                render={({ field }) => (
                  <FormField
                    htmlFor="tenant-type"
                    label="Type de locataire"
                    required
                    error={form.formState.errors.tenantType?.message}
                  >
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="tenant-type" className="w-full">
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Particulier</SelectItem>
                        <SelectItem value="company">Société</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
              />

              {tenantType === "company" ? (
                <FormField
                  htmlFor="companyName"
                  label="Dénomination sociale"
                  required
                  error={form.formState.errors.companyName?.message}
                >
                  <Input
                    id="companyName"
                    placeholder="Ex. SCI Martin"
                    {...form.register("companyName")}
                  />
                </FormField>
              ) : null}

              {tenantType === "individual" ? (
                <>
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
                </>
              ) : null}

              <FormField
                htmlFor="tenant-entryDate"
                label="Date d'entrée"
                required
                error={form.formState.errors.entryDate?.message}
              >
                <Input
                  id="tenant-entryDate"
                  type="date"
                  {...form.register("entryDate")}
                />
              </FormField>

              <FormField
                htmlFor="tenant-entryDateDetail"
                label="Période d'entrée"
                description="Optionnel, par exemple cours 2e trimestre 2019"
                error={form.formState.errors.entryDateDetail?.message}
              >
                <Input
                  id="tenant-entryDateDetail"
                  placeholder="Ex. cours 2e trimestre 2019"
                  {...form.register("entryDateDetail")}
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
