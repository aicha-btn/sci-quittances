import assert from "node:assert/strict"
import { test } from "node:test"

import type { Property, Tenant } from "@/types/domain"

import {
  buildReceiptFileName,
  hydratePropertiesWithTenants,
  matchesReceiptTargetSearch,
  sortTenants,
} from "./receipt"

function property(overrides: Partial<Property> = {}): Property {
  return {
    id: "property-paris",
    residenceName: "Résidence Étoile",
    addressLine1: "12 rue Exemple",
    addressLine2: "",
    postalCode: "75000",
    city: "Paris",
    technicalReference: "IRL-ÉTÉ",
    baseRent: 900,
    charges: 100,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  }
}

function tenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: "tenant-camille",
    propertyId: "property-paris",
    tenantType: "individual",
    title: "Madame",
    companyName: "",
    firstName: "Camille",
    lastName: "Martin",
    entryDate: "2025-01-15",
    entryDateDetail: "",
    createdAt: null,
    updatedAt: null,
    ...overrides,
  }
}

test("hydrates sorted properties with only their sorted tenants", () => {
  const properties = [
    property(),
    property({
      id: "property-lyon",
      residenceName: "Résidence Démo",
      addressLine1: "4 avenue Fictive",
      postalCode: "69000",
      city: "Lyon",
      technicalReference: "IRL-LYON",
    }),
  ]
  const tenants = [
    tenant({ id: "tenant-martin", propertyId: "property-lyon" }),
    tenant({
      id: "tenant-company",
      propertyId: "property-lyon",
      tenantType: "company",
      companyName: "Société Démo SAS",
      title: "",
      firstName: "",
      lastName: "",
    }),
    tenant({ id: "tenant-orphan", propertyId: "property-unknown" }),
  ]

  const hydrated = hydratePropertiesWithTenants(properties, tenants)

  assert.deepEqual(
    hydrated.map(({ id, tenants: propertyTenants }) => ({
      id,
      tenantIds: propertyTenants.map(({ id: tenantId }) => tenantId),
    })),
    [
      {
        id: "property-lyon",
        tenantIds: ["tenant-martin", "tenant-company"],
      },
      { id: "property-paris", tenantIds: [] },
    ]
  )
  assert.equal(properties[0].id, "property-paris")
  assert.equal(tenants[0].id, "tenant-martin")
})

test("uses tenant ids as a deterministic tie-breaker", () => {
  const tenants = [
    tenant({ id: "tenant-z" }),
    tenant({ id: "tenant-a" }),
  ]

  assert.deepEqual(
    sortTenants(tenants).map(({ id }) => id),
    ["tenant-a", "tenant-z"]
  )
})

test("searches tenant, residence and reference without accents or case", () => {
  const target = {
    ...property(),
    tenants: [
      tenant({ firstName: "Élodie", lastName: "André" }),
    ],
  }

  assert.equal(matchesReceiptTargetSearch(target, "elodie andre"), true)
  assert.equal(matchesReceiptTargetSearch(target, "RESIDENCE ETOILE"), true)
  assert.equal(matchesReceiptTargetSearch(target, "irl-ete"), true)
  assert.equal(matchesReceiptTargetSearch(target, "adresse absente"), false)
})

test("an empty receipt search keeps every target", () => {
  assert.equal(
    matchesReceiptTargetSearch({ ...property(), tenants: [] }, "   "),
    true
  )
})

test("builds a stable individual receipt filename", () => {
  assert.equal(
    buildReceiptFileName(property(), [tenant()], 3, 2026),
    "quittance-2026-03-camille-martin.pdf"
  )
})

test("builds a shared receipt filename from the property reference", () => {
  assert.equal(
    buildReceiptFileName(
      property({ technicalReference: "IRL Démo / 42" }),
      [tenant(), tenant({ id: "tenant-2", firstName: "Alex" })],
      11,
      2026
    ),
    "quittance-2026-11-colocation-irl-demo-42.pdf"
  )
})
