import assert from "node:assert/strict"
import { test } from "node:test"

import { bootstrapFirebaseAuthPersistence } from "./firebase-auth-persistence"

type FakeAuth = {
  currentUser: { uid: string } | null
}

function createMigrationHarness({
  migrationComplete = false,
  currentUser = { uid: "legacy-user" },
  signOutError,
  persistenceError,
  keepCurrentUserAfterSignOut = false,
}: {
  migrationComplete?: boolean
  currentUser?: FakeAuth["currentUser"]
  signOutError?: Error
  persistenceError?: Error
  keepCurrentUserAfterSignOut?: boolean
} = {}) {
  const events: string[] = []
  const legacyAuth: FakeAuth = { currentUser }
  const memoryAuth: FakeAuth = { currentUser: null }
  let markerWritten = false

  const bootstrap = () =>
    bootstrapFirebaseAuthPersistence({
      migrationComplete,
      initializeLegacyAuth: () => {
        events.push("initialize-legacy")
        return legacyAuth
      },
      initializeMemoryAuth: () => {
        events.push("initialize-memory")
        return memoryAuth
      },
      waitForInitialAuthState: async () => {
        events.push("wait-for-initial-state")
      },
      signOut: async (auth) => {
        events.push("sign-out")

        if (signOutError) {
          throw signOutError
        }

        if (!keepCurrentUserAfterSignOut) {
          auth.currentUser = null
        }
      },
      setMemoryPersistence: async () => {
        events.push("set-memory-persistence")

        if (persistenceError) {
          throw persistenceError
        }
      },
      getCurrentUser: (auth) => {
        events.push("check-current-user")
        return auth.currentUser
      },
      markMigrationComplete: () => {
        events.push("mark-complete")
        markerWritten = true
      },
    })

  return {
    bootstrap,
    events,
    legacyAuth,
    memoryAuth,
    markerWritten: () => markerWritten,
  }
}

test("an existing persisted user is signed out before memory auth is ready", async () => {
  const harness = createMigrationHarness()

  const auth = await harness.bootstrap()

  assert.equal(auth, harness.legacyAuth)
  assert.equal(auth.currentUser, null)
  assert.deepEqual(harness.events, [
    "initialize-legacy",
    "wait-for-initial-state",
    "sign-out",
    "set-memory-persistence",
    "check-current-user",
    "mark-complete",
  ])
})

test("a browser without a persisted user completes the same controlled migration", async () => {
  const harness = createMigrationHarness({ currentUser: null })

  await harness.bootstrap()

  assert.equal(harness.markerWritten(), true)
  assert.equal(harness.events[0], "initialize-legacy")
  assert.equal(harness.events.at(-1), "mark-complete")
})

test("the marker is written only after sign-out and memory persistence succeed", async () => {
  const harness = createMigrationHarness()

  await harness.bootstrap()

  assert.equal(harness.markerWritten(), true)
  assert.ok(
    harness.events.indexOf("mark-complete") >
      harness.events.indexOf("set-memory-persistence")
  )
})

test("a sign-out failure stops migration without writing the marker", async () => {
  const harness = createMigrationHarness({
    signOutError: new Error("sign-out failed"),
  })

  await assert.rejects(harness.bootstrap(), /sign-out failed/)
  assert.equal(harness.markerWritten(), false)
  assert.equal(harness.events.includes("set-memory-persistence"), false)
})

test("a persistence failure stops migration without writing the marker", async () => {
  const harness = createMigrationHarness({
    persistenceError: new Error("persistence failed"),
  })

  await assert.rejects(harness.bootstrap(), /persistence failed/)
  assert.equal(harness.markerWritten(), false)
})

test("a remaining user stops migration without writing the marker", async () => {
  const harness = createMigrationHarness({ keepCurrentUserAfterSignOut: true })

  await assert.rejects(
    harness.bootstrap(),
    /migration did not clear the current user/
  )
  assert.equal(harness.markerWritten(), false)
})

test("completed migrations initialize directly with memory persistence", async () => {
  const harness = createMigrationHarness({ migrationComplete: true })

  const auth = await harness.bootstrap()

  assert.equal(auth, harness.memoryAuth)
  assert.equal(auth.currentUser, null)
  assert.deepEqual(harness.events, ["initialize-memory"])
  assert.equal(harness.markerWritten(), false)
})
