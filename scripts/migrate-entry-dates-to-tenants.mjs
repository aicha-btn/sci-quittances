import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getFirestore, FieldValue } from "firebase-admin/firestore"

function required(name) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`La variable ${name} est obligatoire pour la migration.`)
  }

  return value
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: required("FIREBASE_ADMIN_PROJECT_ID"),
      clientEmail: required("FIREBASE_ADMIN_CLIENT_EMAIL"),
      privateKey: required("FIREBASE_ADMIN_PRIVATE_KEY").replace(/\\n/g, "\n"),
    }),
  })
}

const db = getFirestore()
const propertiesSnapshot = await db.collection("properties").get()

let propertiesScanned = 0
let propertiesMigrated = 0
let propertiesSkipped = 0
let tenantsUpdated = 0

for (const propertyDoc of propertiesSnapshot.docs) {
  propertiesScanned += 1

  const propertyData = propertyDoc.data()
  const entryDate =
    typeof propertyData.entryDate === "string" ? propertyData.entryDate.trim() : ""
  const entryDateDetail =
    typeof propertyData.entryDateDetail === "string"
      ? propertyData.entryDateDetail.trim()
      : ""

  if (!entryDate && !entryDateDetail) {
    propertiesSkipped += 1
    continue
  }

  const tenantsSnapshot = await db
    .collection("tenants")
    .where("propertyId", "==", propertyDoc.id)
    .get()

  if (tenantsSnapshot.empty) {
    propertiesSkipped += 1
    continue
  }

  const batch = db.batch()
  let updatedForProperty = false

  for (const tenantDoc of tenantsSnapshot.docs) {
    const tenantData = tenantDoc.data()
    const nextEntryDate =
      typeof tenantData.entryDate === "string" ? tenantData.entryDate.trim() : ""
    const nextEntryDateDetail =
      typeof tenantData.entryDateDetail === "string"
        ? tenantData.entryDateDetail.trim()
        : ""

    const patch = {}

    if (!nextEntryDate && entryDate) {
      patch.entryDate = entryDate
    }

    if (!nextEntryDateDetail && entryDateDetail) {
      patch.entryDateDetail = entryDateDetail
    }

    if (!nextEntryDateDetail && !entryDateDetail && tenantData.entryDateDetail === undefined) {
      patch.entryDateDetail = ""
    }

    if (Object.keys(patch).length > 0) {
      batch.update(tenantDoc.ref, patch)
      tenantsUpdated += 1
      updatedForProperty = true
    }
  }

  batch.update(propertyDoc.ref, {
    entryDate: FieldValue.delete(),
    entryDateDetail: FieldValue.delete(),
  })

  await batch.commit()
  propertiesMigrated += 1

  if (!updatedForProperty && (entryDate || entryDateDetail)) {
    // Still count as migrated: old property fields have been removed.
  }
}

console.log(
  JSON.stringify(
    {
      propertiesScanned,
      propertiesMigrated,
      propertiesSkipped,
      tenantsUpdated,
    },
    null,
    2
  )
)
