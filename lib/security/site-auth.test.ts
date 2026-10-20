import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import { after, before, test } from "node:test"

import {
  SITE_SESSION_COOKIE_NAME,
  SITE_SESSION_DURATION_MS,
  SITE_SESSION_VERSION,
  buildExpiredSessionCookie,
  buildSessionCookie,
  createSiteSessionToken,
  verifySiteSessionToken,
} from "./site-auth"

const originalSessionSecret = process.env.SITE_SESSION_SECRET
const testSessionSecret = "test-session-secret"

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

function createSignedToken(payload: unknown) {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  )
  const signature = createHmac("sha256", testSessionSecret)
    .update(encodedPayload)
    .digest("base64url")

  return `${encodedPayload}.${signature}`
}

test("a new site session includes its version, issue time, and expiration", () => {
  const now = 1_800_000_000_000
  const { token, expiresAt } = createSiteSessionToken(now)

  assert.deepEqual(verifySiteSessionToken(token, now), {
    v: SITE_SESSION_VERSION,
    role: "owner",
    iat: now,
    exp: expiresAt,
  })
  assert.equal(expiresAt - now, SITE_SESSION_DURATION_MS)
})

test("a site session remains valid until its twelve-hour expiration", () => {
  const now = 1_800_000_000_000
  const { token } = createSiteSessionToken(now)

  assert.notEqual(
    verifySiteSessionToken(token, now + SITE_SESSION_DURATION_MS - 1),
    null
  )
})

test("a site session is rejected at its twelve-hour expiration", () => {
  const now = 1_800_000_000_000
  const { token } = createSiteSessionToken(now)

  assert.equal(
    verifySiteSessionToken(token, now + SITE_SESSION_DURATION_MS),
    null
  )
})

test("a legacy payload without the current version is rejected", () => {
  const now = 1_800_000_000_000
  const token = createSignedToken({
    role: "owner",
    exp: now + 30 * 24 * 60 * 60 * 1000,
  })

  assert.equal(verifySiteSessionToken(token, now), null)
})

test("a versioned payload without an issue time is rejected", () => {
  const now = 1_800_000_000_000
  const token = createSignedToken({
    v: SITE_SESSION_VERSION,
    role: "owner",
    exp: now + SITE_SESSION_DURATION_MS,
  })

  assert.equal(verifySiteSessionToken(token, now), null)
})

test("a session issued for longer than twelve hours is rejected", () => {
  const now = 1_800_000_000_000
  const token = createSignedToken({
    v: SITE_SESSION_VERSION,
    role: "owner",
    iat: now,
    exp: now + SITE_SESSION_DURATION_MS + 1,
  })

  assert.equal(verifySiteSessionToken(token, now), null)
})

test("a session whose expiration is not after its issue time is rejected", () => {
  const now = 1_800_000_000_000
  const token = createSignedToken({
    v: SITE_SESSION_VERSION,
    role: "owner",
    iat: now,
    exp: now,
  })

  assert.equal(verifySiteSessionToken(token, now), null)
})

test("a session issued too far in the future is rejected", () => {
  const now = 1_800_000_000_000
  const token = createSignedToken({
    v: SITE_SESSION_VERSION,
    role: "owner",
    iat: now + 60_001,
    exp: now + 60_001 + SITE_SESSION_DURATION_MS,
  })

  assert.equal(verifySiteSessionToken(token, now), null)
})

test("a tampered site session is rejected", () => {
  const now = 1_800_000_000_000
  const { token } = createSiteSessionToken(now)
  const [payload, signature] = token.split(".")
  const tamperedSignature = `${signature.slice(0, -1)}${signature.endsWith("a") ? "b" : "a"}`

  assert.equal(
    verifySiteSessionToken(`${payload}.${tamperedSignature}`, now),
    null
  )
})

test("the login cookie expires with the signed twelve-hour session", () => {
  const now = 1_800_000_000_000
  const cookie = buildSessionCookie(now)
  const payload = verifySiteSessionToken(cookie.value, now)

  assert.notEqual(payload, null)
  assert.equal(payload?.iat, now)
  assert.equal(payload?.exp, now + SITE_SESSION_DURATION_MS)
  assert.equal(cookie.options.expires.getTime(), payload?.exp)
  assert.equal(cookie.options.httpOnly, true)
  assert.equal(cookie.options.sameSite, "lax")
  assert.equal(cookie.options.path, "/")
})

test("the logout cookie clears the site session on every route", () => {
  const cookie = buildExpiredSessionCookie()

  assert.equal(cookie.name, SITE_SESSION_COOKIE_NAME)
  assert.equal(cookie.value, "")
  assert.equal(cookie.options.httpOnly, true)
  assert.equal(cookie.options.sameSite, "lax")
  assert.equal(cookie.options.path, "/")
  assert.equal(cookie.options.maxAge, 0)
  assert.equal(cookie.options.expires.getTime(), 0)
})
