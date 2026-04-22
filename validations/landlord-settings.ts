import { z } from "zod"

const postalCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$/, "Le code postal doit contenir 5 chiffres")

export const landlordSettingsFormSchema = z.object({
  companyName: z.string().trim().min(1, "Le nom du bailleur est obligatoire"),
  addressLine1: z.string().trim().min(1, "L'adresse est obligatoire"),
  addressLine2: z.string().trim().max(120).optional().or(z.literal("")),
  postalCode: postalCodeSchema,
  city: z.string().trim().min(1, "La ville est obligatoire"),
  signatureLabel: z
    .string()
    .trim()
    .min(1, "Le libellé de signature est obligatoire")
    .max(120),
})

export type LandlordSettingsFormValues = z.infer<
  typeof landlordSettingsFormSchema
>
