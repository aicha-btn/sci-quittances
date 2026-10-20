import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import { after, before, test } from "node:test"

import { createFirebaseTokenResponse } from "./firebase-token-response"
import {
  SITE_SESSION_DURATION_MS,
  SITE_SESSION_VERSION,
  verifySiteSessionToken,
} from "./site-auth"

const originalSessionSecret = process.env.SITE_SESSION_SECRET
const testSessionSecret = "test-session-secret"
const validSessionIssuedAt = 1_856_800_000_000

before(() => {
  process.env.SITE_SESSION_SECRET = testSessionSecret
})

after(() => {
  if (originalSessionSecret === undefined) {
    delete process.env.SITE_SESSION_SECRET
  } else {
    process.env.SITE_SESSION_SECRET = originalSessionSecret
  }
})

const validSession = {
  v: SITE_SESSION_VERSION,
  role: "owner" as const,
  iat: validSessionIssuedAt,
  exp: validSessionIssuedAt + SITE_SESSION_DURATION_MS,
}

function createLegacySessionToken(expiresAt: number) {
  const encodedPayload = Buffer.from(
    JSON.stringify({ role: "owner", exp: expiresAt }),
    "utf8"
  ).toString("base64url")
  const signature = createHmac("sha256", testSessionSecret)
    .update(encodedPayload)
    .digest("base64url")

  return `${encodedPayload}.${signature}`
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

test("the Firebase token endpoint rejects a legacy site session without caching", async () => {
  const now = 1_800_000_000_000
  const legacyToken = createLegacySessionToken(
    now + 30 * 24 * 60 * 60 * 1000
  )
  const handleRequest = createFirebaseTokenResponse({
    getSession: async () => verifySiteSessionToken(legacyToken, now),
    isFirebaseAdminConfigured: () => true,
    createCustomToken: async () => "unused",
  })

  const response = await handleRequest()

  assert.equal(response.status, 401)
  assert.equal(response.headers.get("cache-control"), "no-store")
  assert.deepEqual(await response.json(), { error: "Accès non autorisé." })
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
