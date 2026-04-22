import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore"

import { ensureDb, timestampToDate } from "@/services/firestore-helpers"
import type { Tenant, TenantInput } from "@/types/domain"

function mapTenant(id: string, data: Record<string, unknown>): Tenant {
  return {
    id,
    propertyId: String(data.propertyId ?? ""),
    title: (data.title as Tenant["title"]) ?? "Monsieur",
    firstName: String(data.firstName ?? ""),
    lastName: String(data.lastName ?? ""),
    order: Number(data.order ?? 1),
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  }
}

export function subscribeTenants(
  onData: (tenants: Tenant[]) => void,
  onError: (error: Error) => void
) {
  const firestore = ensureDb()

  return onSnapshot(
    collection(firestore, "tenants"),
    (snapshot) => {
      onData(
        snapshot.docs.map((documentSnapshot) =>
          mapTenant(
            documentSnapshot.id,
            documentSnapshot.data() as Record<string, unknown>
          )
        )
      )
    },
    (error) => onError(error)
  )
}

export async function createTenant(input: TenantInput) {
  const firestore = ensureDb()

  await addDoc(collection(firestore, "tenants"), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateTenant(id: string, input: TenantInput) {
  const firestore = ensureDb()

  await updateDoc(doc(firestore, "tenants", id), {
    ...input,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteTenant(id: string) {
  const firestore = ensureDb()

  await deleteDoc(doc(firestore, "tenants", id))
}
