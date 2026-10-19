import assert from "node:assert/strict"
import { test } from "node:test"

import { isSiteSessionExpired } from "./session-expiration"

test("a site session remains active before its expiration", () => {
  assert.equal(isSiteSessionExpired(10_001, 10_000), false)
})

test("a site session requires logout at or after its expiration", () => {
  assert.equal(isSiteSessionExpired(10_000, 10_000), true)
  assert.equal(isSiteSessionExpired(9_999, 10_000), true)
})

test("an expiration that has not been loaded does not trigger logout", () => {
  assert.equal(isSiteSessionExpired(null, 10_000), false)
})
