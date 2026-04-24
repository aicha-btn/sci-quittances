import { formatPropertyAddress, formatTenantGroup, normalizeSearch, slugify } from "@/lib/format"
import type { Property, PropertyWithTenants, Tenant } from "@/types/domain"

export function sortTenants(tenants: Tenant[]) {
  return [...tenants].sort((left, right) => {
    const leftLabel =
      left.tenantType === "company"
        ? left.companyName.trim()
        : `${left.lastName} ${left.firstName}`.trim()
    const rightLabel =
      right.tenantType === "company"
        ? right.companyName.trim()
        : `${right.lastName} ${right.firstName}`.trim()

    const labelComparison = leftLabel.localeCompare(rightLabel, "fr")

    if (labelComparison !== 0) {
      return labelComparison
    }

    return left.id.localeCompare(right.id, "fr")
  })
}

export function sortProperties(properties: Property[]) {
  return [...properties].sort((left, right) => {
    const leftLabel = `${left.city} ${left.addressLine1} ${left.technicalReference}`
    const rightLabel = `${right.city} ${right.addressLine1} ${right.technicalReference}`

    return leftLabel.localeCompare(rightLabel, "fr")
  })
}

export function hydratePropertiesWithTenants(
  properties: Property[],
  tenants: Tenant[]
) {
  return sortProperties(properties).map((property) => ({
    ...property,
    tenants: sortTenants(
      tenants.filter((tenant) => tenant.propertyId === property.id)
    ),
  }))
}

export function matchesReceiptTargetSearch(
  property: PropertyWithTenants,
  searchTerm: string
) {
  if (!searchTerm.trim()) {
    return true
  }

  const searchIndex = normalizeSearch(
    [
      formatTenantGroup(property.tenants),
      property.residenceName,
      property.addressLine1,
      property.addressLine2,
      property.postalCode,
      property.city,
      property.technicalReference,
      formatPropertyAddress(property),
    ]
      .filter(Boolean)
      .join(" ")
  )

  return searchIndex.includes(normalizeSearch(searchTerm))
}

export function buildReceiptFileName(
  property: Property,
  tenants: Tenant[],
  month: number,
  year: number
) {
  const baseLabel =
    tenants.length > 1
      ? `colocation-${property.technicalReference}`
      : formatTenantGroup(tenants)

  const safeLabel = slugify(baseLabel || property.technicalReference)

  return `quittance-${year}-${String(month).padStart(2, "0")}-${safeLabel}.pdf`
}
