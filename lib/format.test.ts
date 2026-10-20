import assert from "node:assert/strict"
import { test } from "node:test"

import {
  formatCurrency,
  formatDate,
  formatEntryDateLabel,
  formatMonthYear,
  formatSharedTenantEntryLabel,
  getPropertyTotal,
} from "./format"

test("formats integer, decimal and zero euro amounts in French", () => {
  assert.equal(formatCurrency(1234), "1 234,00 €")
  assert.equal(formatCurrency(1234.5), "1 234,50 €")
  assert.equal(formatCurrency(0), "0,00 €")
})

test("adds rent and charges without altering their values", () => {
  const property = { baseRent: 845.5, charges: 74.25 }

  assert.equal(getPropertyTotal(property), 919.75)
  assert.deepEqual(property, { baseRent: 845.5, charges: 74.25 })
})

test("formats the selected receipt month and year", () => {
  assert.equal(formatMonthYear(2, 2026), "Février 2026")
  assert.equal(formatMonthYear(12, 2025), "Décembre 2025")
})

test("formats date-only values without shifting the calendar day", () => {
  assert.equal(formatDate("2024-02-29"), "29 février 2024")
  assert.equal(formatDate("2026-01-01"), "01 janvier 2026")
})

test("handles missing dates and preserves useful entry details", () => {
  assert.equal(formatDate(null), "Non renseignée")
  assert.equal(formatDate("not-a-date"), "Non renseignée")
  assert.equal(
    formatEntryDateLabel("2025-09-01", "  Remise des clés le matin  "),
    "01 septembre 2025 - Remise des clés le matin"
  )
  assert.equal(
    formatSharedTenantEntryLabel([
      null,
      { entryDate: "2025-09-01", entryDateDetail: "Bail commun" },
      { entryDate: "2025-10-01", entryDateDetail: "" },
    ]),
    "01 septembre 2025 - Bail commun"
  )
})
