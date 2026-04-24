export type TenantTitle = "Monsieur" | "Madame"

export interface LandlordSettings {
  id: string
  companyName: string
  addressLine1: string
  addressLine2: string
  postalCode: string
  city: string
  signatureLabel: string
  createdAt: Date | null
  updatedAt: Date | null
}

export type LandlordSettingsInput = Omit<
  LandlordSettings,
  "id" | "createdAt" | "updatedAt"
>

export interface Property {
  id: string
  residenceName: string
  addressLine1: string
  addressLine2: string
  postalCode: string
  city: string
  entryDate: string
  entryDateDetail: string
  technicalReference: string
  baseRent: number
  charges: number
  createdAt: Date | null
  updatedAt: Date | null
}

export type PropertyInput = Omit<Property, "id" | "createdAt" | "updatedAt">

export interface Tenant {
  id: string
  propertyId: string
  title: TenantTitle
  firstName: string
  lastName: string
  order: number
  createdAt: Date | null
  updatedAt: Date | null
}

export type TenantInput = Omit<Tenant, "id" | "createdAt" | "updatedAt">

export interface PropertyWithTenants extends Property {
  tenants: Tenant[]
}

export interface ReceiptPdfData {
  landlordSettings: LandlordSettings
  property: Property
  tenants: Tenant[]
  month: number
  year: number
}
