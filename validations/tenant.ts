import { z } from "zod"

export const tenantFormSchema = z.object({
  propertyId: z.string().trim().min(1, "Le bien est obligatoire"),
  tenantType: z.enum(["individual", "company"]),
  title: z.enum(["", "Monsieur", "Madame"]),
  companyName: z
    .string()
    .trim()
    .max(160, "La dénomination sociale doit rester courte")
    .optional()
    .or(z.literal("")),
  firstName: z.string().trim().max(80, "Le prénom doit rester court"),
  lastName: z.string().trim().max(80, "Le nom doit rester court"),
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
    .max(120, "La période d'entrée doit rester courte")
    .optional()
    .or(z.literal("")),
}).superRefine((values, ctx) => {
  if (values.tenantType === "individual") {
    if (!values.title) {
      ctx.addIssue({
        code: "custom",
        path: ["title"],
        message: "La civilité est obligatoire pour un particulier",
      })
    }

    if (!values.firstName.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["firstName"],
        message: "Le prénom est obligatoire pour un particulier",
      })
    }

    if (!values.lastName.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["lastName"],
        message: "Le nom est obligatoire pour un particulier",
      })
    }
  }

  if (values.tenantType === "company" && !(values.companyName ?? "").trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["companyName"],
      message: "La dénomination sociale est obligatoire pour une société",
    })
  }
})

export type TenantFormValues = z.infer<typeof tenantFormSchema>
