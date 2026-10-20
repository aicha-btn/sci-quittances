import {
  formatCurrency,
  formatMonthYear,
  formatSharedTenantEntryLabel,
  formatTenantGroup,
  getPropertyTotal,
} from "@/lib/format"
import type { ReceiptPdfData } from "@/types/domain"

export function buildRentReceiptViewModel(data: ReceiptPdfData) {
  const period = formatMonthYear(data.month, data.year)
  const total = getPropertyTotal(data.property)
  const propertyAddress = `${
    data.property.residenceName ? `${data.property.residenceName}, ` : ""
  }${data.property.addressLine1}${
    data.property.addressLine2 ? `, ${data.property.addressLine2}` : ""
  }, ${data.property.postalCode} ${data.property.city}`

  return {
    documentTitle: `Quittance ${period}`,
    period,
    landlordName: data.landlordSettings.companyName,
    landlordAddressLine1: data.landlordSettings.addressLine1,
    landlordAddressLine2: data.landlordSettings.addressLine2,
    landlordCityLine: `${data.landlordSettings.postalCode} ${data.landlordSettings.city}`,
    tenantLabel: formatTenantGroup(data.tenants, true),
    propertyAddress,
    entryLabel: formatSharedTenantEntryLabel(data.tenants),
    technicalReference: data.property.technicalReference,
    rent: formatCurrency(data.property.baseRent),
    charges: formatCurrency(data.property.charges),
    total: formatCurrency(total),
    signatureLabel: data.landlordSettings.signatureLabel,
  }
}
