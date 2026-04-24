import {
  addDoc,
  collection,
  deleteField,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore"

import { ensureDb, timestampToDate } from "@/services/firestore-helpers"
import type { Tenant, TenantInput } from "@/types/domain"

function mapTenant(id: string, data: Record<string, unknown>): Tenant {
  const firstName = String(data.firstName ?? "")
  const lastName = String(data.lastName ?? "")
  const companyName = String(data.companyName ?? data.identity ?? "")
  const storedTenantType = String(data.tenantType ?? "")
  const tenantType =
    storedTenantType === "company" ||
    (!storedTenantType && companyName.trim().length > 0 && !firstName && !lastName)
      ? "company"
      : "individual"

  return {
    id,
    propertyId: String(data.propertyId ?? ""),
    tenantType,
    title: (data.title as Tenant["title"]) ?? "",
    companyName,
    firstName,
    lastName,
    entryDate: String(data.entryDate ?? ""),
    entryDateDetail: String(data.entryDateDetail ?? ""),
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
  const normalizedInput =
    input.tenantType === "company"
      ? {
          ...input,
          title: "",
          firstName: "",
          lastName: "",
          companyName: input.companyName ?? "",
        }
      : {
          ...input,
          companyName: "",
        }

  await addDoc(collection(firestore, "tenants"), {
    ...normalizedInput,
    entryDateDetail: normalizedInput.entryDateDetail ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateTenant(id: string, input: TenantInput) {
  const firestore = ensureDb()
  const normalizedInput =
    input.tenantType === "company"
      ? {
          ...input,
          title: "",
          firstName: "",
          lastName: "",
          companyName: input.companyName ?? "",
        }
      : {
          ...input,
          companyName: "",
        }

  await updateDoc(doc(firestore, "tenants", id), {
    ...normalizedInput,
    entryDateDetail: normalizedInput.entryDateDetail ?? "",
    identity: deleteField(),
    order: deleteField(),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteTenant(id: string) {
  const firestore = ensureDb()

  await deleteDoc(doc(firestore, "tenants", id))
}
