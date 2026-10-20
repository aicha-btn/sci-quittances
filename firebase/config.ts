import { FirebaseError, getApp, getApps, initializeApp } from "firebase/app"
import {
  getAuth,
  indexedDBLocalPersistence,
  inMemoryPersistence,
  initializeAuth,
  setPersistence,
  signOut,
  type Auth,
  type Persistence,
} from "firebase/auth"
import { getFirestore } from "firebase/firestore"

import {
  bootstrapFirebaseAuthPersistence,
  FIREBASE_AUTH_MEMORY_MIGRATION_KEY,
} from "@/lib/security/firebase-auth-persistence"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean)

const app = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null

export const firebaseApp = app
export const db = app ? getFirestore(app) : null

let authBootstrapPromise: Promise<Auth | null> | null = null

function initializeClientAuth(persistence: Persistence) {
  if (!app) {
    throw new Error("Firebase is not configured.")
  }

  try {
    return initializeAuth(app, { persistence })
  } catch (error) {
    if (
      error instanceof FirebaseError &&
      error.code === "auth/already-initialized"
    ) {
      return getAuth(app)
    }

    throw error
  }
}

export async function getFirebaseAuth() {
  if (!app || typeof window === "undefined") {
    return Promise.resolve(null)
  }

  if (!authBootstrapPromise) {
    authBootstrapPromise = bootstrapFirebaseAuthPersistence({
      migrationComplete:
        window.localStorage.getItem(FIREBASE_AUTH_MEMORY_MIGRATION_KEY) === "1",
      initializeLegacyAuth: () =>
        initializeClientAuth(indexedDBLocalPersistence),
      initializeMemoryAuth: () => initializeClientAuth(inMemoryPersistence),
      waitForInitialAuthState: (auth) => auth.authStateReady(),
      signOut,
      setMemoryPersistence: (auth) =>
        setPersistence(auth, inMemoryPersistence),
      getCurrentUser: (auth) => auth.currentUser,
      markMigrationComplete: () => {
        window.localStorage.setItem(FIREBASE_AUTH_MEMORY_MIGRATION_KEY, "1")
      },
    })
  }

  return authBootstrapPromise
}
