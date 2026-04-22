import { db } from "@/firebase/config"

export function ensureDb() {
  if (!db) {
    throw new Error("Firebase n'est pas configuré.")
  }

  return db
}

export function timestampToDate(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate()
  }

  if (value instanceof Date) {
    return value
  }

  return null
}
