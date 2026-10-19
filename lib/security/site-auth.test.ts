import assert from "node:assert/strict"
import { after, before, test } from "node:test"

import {
  SITE_SESSION_COOKIE_NAME,
  buildExpiredSessionCookie,
  createSiteSessionToken,
  verifySiteSessionToken,
} from "./site-auth"

const originalSessionSecret = process.env.SITE_SESSION_SECRET

before(() => {
  process.env.SITE_SESSION_SECRET = "test-session-secret"
})

after(() => {
  if (originalSessionSecret === undefined) {
    delete process.env.SITE_SESSION_SECRET
  } else {
    process.env.SITE_SESSION_SECRET = originalSessionSecret
  }
})

test("a valid site session exposes its verified role and expiration", () => {
  const now = 1_800_000_000_000
  const expiresAt = now + 60_000
  const { token } = createSiteSessionToken(expiresAt)

  assert.deepEqual(verifySiteSessionToken(token, now), {
    role: "owner",
    exp: expiresAt,
  })
})

test("an expired site session is rejected", () => {
  const now = 1_800_000_000_000
  const { token } = createSiteSessionToken(now - 1)

  assert.equal(verifySiteSessionToken(token, now), null)
})

test("a tampered site session is rejected", () => {
  const now = 1_800_000_000_000
  const { token } = createSiteSessionToken(now + 60_000)
  const [payload, signature] = token.split(".")
  const tamperedSignature = `${signature.slice(0, -1)}${signature.endsWith("a") ? "b" : "a"}`

  assert.equal(
    verifySiteSessionToken(`${payload}.${tamperedSignature}`, now),
    null
  )
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
