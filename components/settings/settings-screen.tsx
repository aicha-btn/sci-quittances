"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { AppReadyBoundary } from "@/components/common/app-ready-boundary"
import { FormField } from "@/components/common/form-field"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useLandlordSettings } from "@/hooks/use-landlord-settings"
import { DEFAULT_SIGNATURE_LABEL } from "@/lib/constants"
import { saveLandlordSettings } from "@/services/landlord-settings-service"
import {
  landlordSettingsFormSchema,
  type LandlordSettingsFormValues,
} from "@/validations/landlord-settings"

export function SettingsScreen() {
  const { settings, error } = useLandlordSettings()
  const [isPending, setIsPending] = useState(false)
  const form = useForm<LandlordSettingsFormValues>({
    resolver: zodResolver(landlordSettingsFormSchema),
    defaultValues: {
      companyName: "",
      addressLine1: "",
      addressLine2: "",
      postalCode: "",
      city: "",
      signatureLabel: DEFAULT_SIGNATURE_LABEL,
    },
  })

  useEffect(() => {
    form.reset({
      companyName: settings?.companyName ?? "",
      addressLine1: settings?.addressLine1 ?? "",
      addressLine2: settings?.addressLine2 ?? "",
      postalCode: settings?.postalCode ?? "",
      city: settings?.city ?? "",
      signatureLabel: settings?.signatureLabel || DEFAULT_SIGNATURE_LABEL,
    })
  }, [form, settings])

  async function handleSubmit(values: LandlordSettingsFormValues) {
    setIsPending(true)

    try {
      await saveLandlordSettings({
        ...values,
        addressLine2: values.addressLine2 ?? "",
      })
      toast.success("Paramètres bailleur enregistrés.")
    } catch (submitError) {
      toast.error(
        submitError instanceof Error
          ? submitError.message
          : "Impossible d'enregistrer les paramètres."
      )
    } finally {
      setIsPending(false)
    }
  }

  return (
    <AppReadyBoundary>
      <div className="space-y-5">
        <PageHeader
          title="Paramètres bailleur"
          description="Ces informations apparaissent en haut de chaque quittance."
        />

        {error ? (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="px-5 py-4 text-sm text-destructive">
              {error}
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-white/70 bg-white/88 shadow-sm">
          <CardContent className="p-5">
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="grid gap-4 sm:grid-cols-2"
            >
              <div className="sm:col-span-2">
                <FormField
                  htmlFor="companyName"
                  label="Nom du bailleur ou de la société"
                  required
                  error={form.formState.errors.companyName?.message}
                >
                  <Input id="companyName" {...form.register("companyName")} />
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
                  description="Optionnel"
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

              <div className="sm:col-span-2">
                <FormField
                  htmlFor="signatureLabel"
                  label="Libellé de signature"
                  required
                  error={form.formState.errors.signatureLabel?.message}
                >
                  <Input
                    id="signatureLabel"
                    {...form.register("signatureLabel")}
                  />
                </FormField>
              </div>

              <div className="sm:col-span-2 flex justify-end pt-2">
                <Button type="submit" size="lg" disabled={isPending}>
                  {isPending ? "Enregistrement..." : "Enregistrer les paramètres"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppReadyBoundary>
  )
}
