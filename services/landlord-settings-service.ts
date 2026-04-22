import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore"

import { LANDLORD_SETTINGS_DOCUMENT_ID } from "@/lib/constants"
import { ensureDb, timestampToDate } from "@/services/firestore-helpers"
import type { LandlordSettings, LandlordSettingsInput } from "@/types/domain"

function mapLandlordSettings(
  id: string,
  data: Record<string, unknown>
): LandlordSettings {
  return {
    id,
    companyName: String(data.companyName ?? ""),
    addressLine1: String(data.addressLine1 ?? ""),
    addressLine2: String(data.addressLine2 ?? ""),
    postalCode: String(data.postalCode ?? ""),
    city: String(data.city ?? ""),
    signatureLabel: String(data.signatureLabel ?? ""),
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  }
}

export function subscribeLandlordSettings(
  onData: (settings: LandlordSettings | null) => void,
  onError: (error: Error) => void
) {
  const firestore = ensureDb()
  const settingsRef = doc(
    firestore,
    "landlord_settings",
    LANDLORD_SETTINGS_DOCUMENT_ID
  )

  return onSnapshot(
    settingsRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null)
        return
      }

      onData(
        mapLandlordSettings(
          snapshot.id,
          snapshot.data() as Record<string, unknown>
        )
      )
    },
    (error) => onError(error)
  )
}

export async function saveLandlordSettings(input: LandlordSettingsInput) {
  const firestore = ensureDb()
  const settingsRef = doc(
    firestore,
    "landlord_settings",
    LANDLORD_SETTINGS_DOCUMENT_ID
  )
  const existingSnapshot = await getDoc(settingsRef)

  await setDoc(settingsRef, {
    ...input,
    addressLine2: input.addressLine2 ?? "",
    createdAt: existingSnapshot.exists()
      ? existingSnapshot.data().createdAt ?? serverTimestamp()
      : serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}
