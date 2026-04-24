import { z } from "zod"

const postalCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$/, "Le code postal doit contenir 5 chiffres")

function amountField(label: string) {
  return z
    .number({ error: `Le ${label.toLowerCase()} doit être un nombre` })
    .min(0, `${label} doit être positif`)
}

export const propertyFormSchema = z.object({
  residenceName: z.string().trim().max(120).optional().or(z.literal("")),
  addressLine1: z.string().trim().min(1, "L'adresse est obligatoire"),
  addressLine2: z.string().trim().max(120).optional().or(z.literal("")),
  postalCode: postalCodeSchema,
  city: z.string().trim().min(1, "La ville est obligatoire"),
  entryDate: z
    .string()
    .trim()
    .min(1, "La date d'entrée est obligatoire")
    .refine(
      (value) => !Number.isNaN(new Date(`${value}T00:00:00`).getTime()),
      "La date d'entrée est invalide"
    ),
  entryDateDetail: z
    .string()
    .trim()
    .max(120, "La précision d'entrée doit rester courte")
    .optional()
    .or(z.literal("")),
  technicalReference: z
    .string()
    .trim()
    .min(1, "L'IRL est obligatoire"),
  baseRent: amountField("loyer"),
  charges: amountField("charges"),
})

export type PropertyFormValues = z.infer<typeof propertyFormSchema>
