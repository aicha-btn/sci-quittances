import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore"

import { ensureDb, timestampToDate } from "@/services/firestore-helpers"
import type { Property, PropertyInput } from "@/types/domain"

function mapProperty(id: string, data: Record<string, unknown>): Property {
  return {
    id,
    residenceName: String(data.residenceName ?? ""),
    addressLine1: String(data.addressLine1 ?? ""),
    addressLine2: String(data.addressLine2 ?? ""),
    postalCode: String(data.postalCode ?? ""),
    city: String(data.city ?? ""),
    entryDate: String(data.entryDate ?? ""),
    technicalReference: String(data.technicalReference ?? ""),
    baseRent: Number(data.baseRent ?? 0),
    charges: Number(data.charges ?? 0),
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  }
}

export function subscribeProperties(
  onData: (properties: Property[]) => void,
  onError: (error: Error) => void
) {
  const firestore = ensureDb()

  return onSnapshot(
    collection(firestore, "properties"),
    (snapshot) => {
      onData(
        snapshot.docs.map((documentSnapshot) =>
          mapProperty(
            documentSnapshot.id,
            documentSnapshot.data() as Record<string, unknown>
          )
        )
      )
    },
    (error) => onError(error)
  )
}

export async function createProperty(input: PropertyInput) {
  const firestore = ensureDb()

  await addDoc(collection(firestore, "properties"), {
    ...input,
    residenceName: input.residenceName ?? "",
    addressLine2: input.addressLine2 ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateProperty(id: string, input: PropertyInput) {
  const firestore = ensureDb()

  await updateDoc(doc(firestore, "properties", id), {
    ...input,
    residenceName: input.residenceName ?? "",
    addressLine2: input.addressLine2 ?? "",
    updatedAt: serverTimestamp(),
  })
}

export async function deleteProperty(id: string) {
  const firestore = ensureDb()
  const tenantsQuery = query(
    collection(firestore, "tenants"),
    where("propertyId", "==", id)
  )
  const tenantsSnapshot = await getDocs(tenantsQuery)
  const batch = writeBatch(firestore)

  tenantsSnapshot.forEach((tenantSnapshot) => {
    batch.delete(tenantSnapshot.ref)
  })

  batch.delete(doc(firestore, "properties", id))

  await batch.commit()
}
