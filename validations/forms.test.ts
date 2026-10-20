import assert from "node:assert/strict"
import { test } from "node:test"

import { landlordSettingsFormSchema } from "./landlord-settings"
import { propertyFormSchema } from "./property"
import { tenantFormSchema } from "./tenant"

const validProperty = {
  residenceName: "Résidence Démo",
  addressLine1: "12 rue Exemple",
  addressLine2: "",
  postalCode: "75000",
  city: "Paris",
  technicalReference: "IRL-DEMO-01",
  baseRent: 850,
  charges: 0,
}

const validIndividualTenant = {
  propertyId: "property-demo",
  tenantType: "individual" as const,
  title: "Madame" as const,
  companyName: "",
  firstName: "Camille",
  lastName: "Martin",
  entryDate: "2025-09-01",
  entryDateDetail: "Bail initial",
}

const validLandlord = {
  companyName: "Bailleur Démo",
  addressLine1: "8 avenue Fictive",
  addressLine2: "",
  postalCode: "69000",
  city: "Lyon",
  signatureLabel: "Le bailleur, signature",
}

test("accepts and normalizes valid property values including zero charges", () => {
  const parsed = propertyFormSchema.parse({
    ...validProperty,
    addressLine1: "  12 rue Exemple  ",
    city: "  Paris ",
  })

  assert.equal(parsed.addressLine1, "12 rue Exemple")
  assert.equal(parsed.city, "Paris")
  assert.equal(parsed.charges, 0)
})

test("rejects invalid property identity, postal code and amounts", () => {
  const invalidValues = [
    { ...validProperty, addressLine1: "" },
    { ...validProperty, technicalReference: "" },
    { ...validProperty, postalCode: "7500" },
    { ...validProperty, baseRent: -1 },
    { ...validProperty, charges: "100" },
  ]

  for (const value of invalidValues) {
    assert.equal(propertyFormSchema.safeParse(value).success, false)
  }
})

test("accepts a complete individual tenant", () => {
  const result = tenantFormSchema.safeParse(validIndividualTenant)

  assert.equal(result.success, true)
})

test("accepts a company tenant without individual identity fields", () => {
  const result = tenantFormSchema.safeParse({
    ...validIndividualTenant,
    tenantType: "company",
    title: "",
    companyName: "Société Démo SAS",
    firstName: "",
    lastName: "",
  })

  assert.equal(result.success, true)
})

test("enforces identity fields for the selected tenant type", () => {
  const individual = tenantFormSchema.safeParse({
    ...validIndividualTenant,
    title: "",
    firstName: "",
    lastName: "",
  })
  const company = tenantFormSchema.safeParse({
    ...validIndividualTenant,
    tenantType: "company",
    title: "",
    companyName: "",
    firstName: "",
    lastName: "",
  })

  assert.equal(individual.success, false)
  assert.equal(company.success, false)
})

test("rejects missing or invalid tenant entry dates", () => {
  assert.equal(
    tenantFormSchema.safeParse({ ...validIndividualTenant, entryDate: "" })
      .success,
    false
  )
  assert.equal(
    tenantFormSchema.safeParse({
      ...validIndividualTenant,
      entryDate: "date-invalide",
    }).success,
    false
  )
})

test("accepts minimal and complete landlord settings", () => {
  assert.equal(landlordSettingsFormSchema.safeParse(validLandlord).success, true)
  assert.equal(
    landlordSettingsFormSchema.safeParse({
      ...validLandlord,
      addressLine2: "  Bâtiment Démo  ",
    }).success,
    true
  )
})

test("rejects incomplete or malformed landlord settings", () => {
  const invalidValues = [
    { ...validLandlord, companyName: "" },
    { ...validLandlord, addressLine1: "" },
    { ...validLandlord, postalCode: "ABCDE" },
    { ...validLandlord, city: "" },
    { ...validLandlord, signatureLabel: "" },
  ]

  for (const value of invalidValues) {
    assert.equal(landlordSettingsFormSchema.safeParse(value).success, false)
  }
})
