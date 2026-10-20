import assert from "node:assert/strict"
import { test } from "node:test"

import { buildReceiptFileName } from "@/lib/receipt"
import { buildRentReceiptViewModel } from "@/pdf/rent-receipt-data"
import { buildReceiptPdfBlob } from "@/pdf/rent-receipt"
import type { ReceiptPdfData } from "@/types/domain"

const receiptData: ReceiptPdfData = {
  landlordSettings: {
    id: "landlord-demo-1",
    companyName: "Camille Martin",
    addressLine1: "1 avenue Démo",
    addressLine2: "",
    postalCode: "75000",
    city: "Paris",
    signatureLabel: "Le bailleur, signature",
    createdAt: null,
    updatedAt: null,
  },
  property: {
    id: "property-demo-1",
    residenceName: "Résidence Démo",
    addressLine1: "12 rue Exemple",
    addressLine2: "",
    postalCode: "75000",
    city: "Paris",
    technicalReference: "IRL-DEMO-01",
    baseRent: 800,
    charges: 100,
    createdAt: null,
    updatedAt: null,
  },
  tenants: [
    {
      id: "tenant-demo-1",
      propertyId: "property-demo-1",
      tenantType: "individual",
      title: "Monsieur",
      companyName: "",
      firstName: "Alex",
      lastName: "Dupont",
      entryDate: "2025-01-01",
      entryDateDetail: "",
      createdAt: null,
      updatedAt: null,
    },
  ],
  month: 2,
  year: 2026,
}

test("prepares the business data rendered in a rent receipt", () => {
  const receipt = buildRentReceiptViewModel(receiptData)

  assert.deepEqual(receipt, {
    documentTitle: "Quittance Février 2026",
    period: "Février 2026",
    landlordName: "Camille Martin",
    landlordAddressLine1: "1 avenue Démo",
    landlordAddressLine2: "",
    landlordCityLine: "75000 Paris",
    tenantLabel: "Monsieur Alex Dupont",
    propertyAddress: "Résidence Démo, 12 rue Exemple, 75000 Paris",
    entryLabel: "01 janvier 2025",
    technicalReference: "IRL-DEMO-01",
    rent: "800,00 €",
    charges: "100,00 €",
    total: "900,00 €",
    signatureLabel: "Le bailleur, signature",
  })
  assert.equal(
    buildReceiptFileName(
      receiptData.property,
      receiptData.tenants,
      receiptData.month,
      receiptData.year
    ),
    "quittance-2026-02-alex-dupont.pdf"
  )
})

test("renders a non-empty PDF blob with the expected MIME type and signature", async () => {
  const blob = await buildReceiptPdfBlob(receiptData)
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const signature = new TextDecoder().decode(bytes.slice(0, 4))

  assert.equal(blob.type, "application/pdf")
  assert.ok(blob.size > 0)
  assert.equal(signature, "%PDF")
})
