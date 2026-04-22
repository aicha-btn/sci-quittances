export const DEFAULT_SIGNATURE_LABEL = "Le bailleur, signature"
export const LANDLORD_SETTINGS_DOCUMENT_ID = "primary"

export const MONTH_OPTIONS = [
  { value: 1, label: "Janvier" },
  { value: 2, label: "Février" },
  { value: 3, label: "Mars" },
  { value: 4, label: "Avril" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Juin" },
  { value: 7, label: "Juillet" },
  { value: 8, label: "Août" },
  { value: 9, label: "Septembre" },
  { value: 10, label: "Octobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Décembre" },
] as const

export function buildYearOptions(referenceYear = new Date().getFullYear()) {
  return Array.from({ length: 7 }, (_, index) => referenceYear - 2 + index)
}
