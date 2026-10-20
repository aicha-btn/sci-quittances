export const FIREBASE_AUTH_MEMORY_MIGRATION_KEY =
  "quittentia:firebase-auth-memory-migration:v1"

type FirebaseAuthPersistenceDependencies<AuthType> = {
  migrationComplete: boolean
  initializeLegacyAuth: () => AuthType
  initializeMemoryAuth: () => AuthType
  waitForInitialAuthState: (auth: AuthType) => Promise<void>
  signOut: (auth: AuthType) => Promise<void>
  setMemoryPersistence: (auth: AuthType) => Promise<void>
  getCurrentUser: (auth: AuthType) => unknown | null
  markMigrationComplete: () => void
}

export async function bootstrapFirebaseAuthPersistence<AuthType>(
  dependencies: FirebaseAuthPersistenceDependencies<AuthType>
) {
  if (dependencies.migrationComplete) {
    return dependencies.initializeMemoryAuth()
  }

  const auth = dependencies.initializeLegacyAuth()

  await dependencies.waitForInitialAuthState(auth)
  await dependencies.signOut(auth)
  await dependencies.setMemoryPersistence(auth)

  if (dependencies.getCurrentUser(auth) !== null) {
    throw new Error("Firebase Auth migration did not clear the current user.")
  }

  dependencies.markMigrationComplete()

  return auth
}
