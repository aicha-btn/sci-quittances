import { z } from "zod"

export const tenantFormSchema = z.object({
  propertyId: z.string().trim().min(1, "Le bien est obligatoire"),
  title: z.enum(["Monsieur", "Madame"], {
    error: "La civilité est obligatoire",
  }),
  firstName: z.string().trim().min(1, "Le prénom est obligatoire"),
  lastName: z.string().trim().min(1, "Le nom est obligatoire"),
  order: z
    .number({ error: "L'ordre d'affichage doit être un nombre" })
    .int("L'ordre doit être un nombre entier")
    .min(1, "L'ordre doit être supérieur ou égal à 1"),
})

export type TenantFormValues = z.infer<typeof tenantFormSchema>
