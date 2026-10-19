import assert from "node:assert/strict"
import { test } from "node:test"

import { createFirebaseTokenResponse } from "./firebase-token-response"

const validSession = {
  role: "owner" as const,
  exp: 1_900_000_000_000,
}

test("the Firebase token endpoint rejects a missing session without caching", async () => {
  const handleRequest = createFirebaseTokenResponse({
    getSession: async () => null,
    isFirebaseAdminConfigured: () => true,
    createCustomToken: async () => "unused",
  })

  const response = await handleRequest()

  assert.equal(response.status, 401)
  assert.equal(response.headers.get("cache-control"), "no-store")
  assert.deepEqual(await response.json(), { error: "Accès non autorisé." })
})

test("the Firebase token endpoint returns the verified site expiration", async () => {
  const handleRequest = createFirebaseTokenResponse({
    getSession: async () => validSession,
    isFirebaseAdminConfigured: () => true,
    createCustomToken: async () => "firebase-custom-token",
  })

  const response = await handleRequest()

  assert.equal(response.status, 200)
  assert.equal(response.headers.get("cache-control"), "no-store")
  assert.deepEqual(await response.json(), {
    token: "firebase-custom-token",
    sessionExpiresAt: validSession.exp,
  })
})

test("the Firebase token endpoint returns a generic non-cacheable server error", async () => {
  const messages: string[] = []
  const handleRequest = createFirebaseTokenResponse({
    getSession: async () => validSession,
    isFirebaseAdminConfigured: () => true,
    createCustomToken: async () => {
      throw new Error("sensitive provider detail")
    },
    reportError: (message) => messages.push(message),
  })

  const response = await handleRequest()
  const body = await response.text()

  assert.equal(response.status, 500)
  assert.equal(response.headers.get("cache-control"), "no-store")
  assert.equal(body.includes("sensitive provider detail"), false)
  assert.deepEqual(JSON.parse(body), {
    error: "Service temporairement indisponible.",
  })
  assert.deepEqual(messages, ["Firebase token creation failed."])
})

test("an unconfigured Firebase Admin service returns the same generic error", async () => {
  const handleRequest = createFirebaseTokenResponse({
    getSession: async () => validSession,
    isFirebaseAdminConfigured: () => false,
    createCustomToken: async () => "unused",
  })

  const response = await handleRequest()

  assert.equal(response.status, 500)
  assert.equal(response.headers.get("cache-control"), "no-store")
  assert.deepEqual(await response.json(), {
    error: "Service temporairement indisponible.",
  })
})
