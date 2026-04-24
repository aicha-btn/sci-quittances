import { MONTH_OPTIONS } from "@/lib/constants"
import type { LandlordSettings, Property, Tenant } from "@/types/domain"

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
})

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
})

export function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

export function formatMonthYear(month: number, year: number) {
  const monthLabel = MONTH_OPTIONS.find((option) => option.value === month)?.label
  return `${monthLabel ?? month} ${year}`
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return "Non renseignée"
  }

  const date =
    typeof value === "string" ? new Date(`${value}T00:00:00`) : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Non renseignée"
  }

  return dateFormatter.format(date)
}

export function formatEntryDateLabel(
  entryDate: string | Date | null | undefined,
  detail?: string | null
) {
  const formattedDate = formatDate(entryDate)
  const cleanedDetail = detail?.trim()

  if (!cleanedDetail) {
    return formattedDate
  }

  return `${formattedDate} - ${cleanedDetail}`
}

export function formatTenantName(tenant: Tenant, includeTitle = false) {
  const parts = [
    includeTitle ? tenant.title : null,
    tenant.firstName.trim(),
    tenant.lastName.trim(),
  ].filter(Boolean)

  return parts.join(" ")
}

export function formatTenantGroup(tenants: Tenant[], includeTitle = false) {
  return tenants.map((tenant) => formatTenantName(tenant, includeTitle)).join(" / ")
}

export function formatAddressLines(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
}

export function formatPropertyAddress(property: Property, multiline = false) {
  const lines = formatAddressLines([
    property.residenceName,
    property.addressLine1,
    property.addressLine2,
    `${property.postalCode} ${property.city}`.trim(),
  ])

  return lines.join(multiline ? "\n" : ", ")
}

export function formatLandlordAddress(
  landlordSettings: LandlordSettings,
  multiline = false
) {
  const lines = formatAddressLines([
    landlordSettings.companyName,
    landlordSettings.addressLine1,
    landlordSettings.addressLine2,
    `${landlordSettings.postalCode} ${landlordSettings.city}`.trim(),
  ])

  return lines.join(multiline ? "\n" : ", ")
}

export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
}

export function getPropertyTotal(property: Pick<Property, "baseRent" | "charges">) {
  return property.baseRent + property.charges
}

export function slugify(value: string) {
  return normalizeSearch(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}
