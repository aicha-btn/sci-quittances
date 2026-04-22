import "server-only"

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
}

export const isFirebaseAdminConfigured = Object.values(firebaseAdminConfig).every(
  Boolean
)

function getFirebaseAdminApp() {
  if (!isFirebaseAdminConfigured) {
    throw new Error(
      "Firebase Admin n'est pas configuré. Ajoute FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL et FIREBASE_ADMIN_PRIVATE_KEY."
    )
  }

  return getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: cert({
          projectId: firebaseAdminConfig.projectId,
          clientEmail: firebaseAdminConfig.clientEmail,
          privateKey: firebaseAdminConfig.privateKey,
        }),
        projectId: firebaseAdminConfig.projectId,
      })
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp())
}
