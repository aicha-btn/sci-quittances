import assert from "node:assert/strict"
import test from "node:test"

import {
  buildLoginRateLimitResponse,
  createLoginRateLimitService,
  isLoginPasswordWithinLimit,
  LOGIN_RATE_LIMIT_MAX_FAILURES,
  LOGIN_RATE_LIMIT_WINDOW_MS,
  type LoginRateLimitStore,
} from "./login-rate-limit"

class InMemoryRateLimitStore implements LoginRateLimitStore {
  readonly sourceKeys = new Set<string>()
  transactionCount = 0
  private readonly states = new Map<
    string,
    { failedAttempts: number; windowStartedAtMs: number }
  >()
  private transactionQueue = Promise.resolve()

  transact<TResult>(
    sourceKey: string,
    update: Parameters<LoginRateLimitStore["transact"]>[1]
  ): Promise<TResult> {
    const transaction = this.transactionQueue.then(() => {
      this.transactionCount += 1
      this.sourceKeys.add(sourceKey)
      const mutation = update(this.states.get(sourceKey) ?? null)

      if (mutation.nextState === null) {
        this.states.delete(sourceKey)
      } else if (mutation.nextState) {
        this.states.set(sourceKey, mutation.nextState)
      }

      return mutation.result as TResult
    })

    this.transactionQueue = transaction.then(
      () => undefined,
      () => undefined
    )

    return transaction
  }
}

function requestFrom(ip: string) {
  return new Request("https://quittencia.test/api/auth/login", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
  })
}

function createTestService(store = new InMemoryRateLimitStore()) {
  let currentTime = 1_000_000
  const service = createLoginRateLimitService({
    store,
    now: () => currentTime,
    getSecret: () => "test-session-secret",
    reportUnavailable: () => undefined,
  })

  return {
    ...service,
    store,
    advanceTime(milliseconds: number) {
      currentTime += milliseconds
    },
  }
}

test("allows five failures and limits the following attempt", async () => {
  const service = createTestService()
  const request = requestFrom("203.0.113.10")

  for (let attempt = 0; attempt < LOGIN_RATE_LIMIT_MAX_FAILURES; attempt += 1) {
    assert.deepEqual(
      await service.evaluateLoginAttempt(request, () => false),
      { status: "invalid" }
    )
  }

  assert.deepEqual(await service.evaluateLoginAttempt(request, () => false), {
    status: "limited",
    retryAfterSeconds: LOGIN_RATE_LIMIT_WINDOW_MS / 1000,
  })
})

test("starts a fresh window after expiration", async () => {
  const service = createTestService()
  const request = requestFrom("203.0.113.11")

  for (let attempt = 0; attempt < LOGIN_RATE_LIMIT_MAX_FAILURES; attempt += 1) {
    await service.evaluateLoginAttempt(request, () => false)
  }

  service.advanceTime(LOGIN_RATE_LIMIT_WINDOW_MS)

  assert.deepEqual(await service.evaluateLoginAttempt(request, () => false), {
    status: "invalid",
  })
})

test("isolates counters and pseudonymizes source addresses", async () => {
  const service = createTestService()
  const firstRequest = requestFrom("203.0.113.12")
  const secondRequest = requestFrom("203.0.113.13")

  for (let attempt = 0; attempt < LOGIN_RATE_LIMIT_MAX_FAILURES; attempt += 1) {
    await service.evaluateLoginAttempt(firstRequest, () => false)
  }

  assert.deepEqual(
    await service.evaluateLoginAttempt(secondRequest, () => false),
    { status: "invalid" }
  )
  assert.equal(service.store.sourceKeys.size, 2)
  assert.equal(
    [...service.store.sourceKeys].some((key) => key.includes("203.0.113")),
    false
  )
})

test("a successful login resets the source counter", async () => {
  const service = createTestService()
  const request = requestFrom("203.0.113.14")

  for (let attempt = 0; attempt < 4; attempt += 1) {
    await service.evaluateLoginAttempt(request, () => false)
  }

  assert.deepEqual(await service.evaluateLoginAttempt(request, () => true), {
    status: "success",
  })

  for (let attempt = 0; attempt < LOGIN_RATE_LIMIT_MAX_FAILURES; attempt += 1) {
    assert.deepEqual(
      await service.evaluateLoginAttempt(request, () => false),
      { status: "invalid" }
    )
  }
})

test("serializes parallel attempts so only five failures pass", async () => {
  const service = createTestService()
  const request = requestFrom("203.0.113.15")
  const results = await Promise.all(
    Array.from({ length: 12 }, () =>
      service.evaluateLoginAttempt(request, () => false)
    )
  )

  assert.equal(results.filter(({ status }) => status === "invalid").length, 5)
  assert.equal(results.filter(({ status }) => status === "limited").length, 7)
})

test("fails open without exposing store failures", async () => {
  let unavailableReports = 0
  const service = createLoginRateLimitService({
    store: {
      async transact() {
        throw new Error("private firestore detail")
      },
    },
    getSecret: () => "test-session-secret",
    reportUnavailable: () => {
      unavailableReports += 1
    },
  })

  assert.deepEqual(
    await service.evaluateLoginAttempt(requestFrom("203.0.113.16"), () => false),
    { status: "invalid", rateLimitUnavailable: true }
  )
  assert.equal(unavailableReports, 1)
})

test("fails open when the pseudonymization secret is unavailable", async () => {
  let unavailableReports = 0
  const service = createLoginRateLimitService({
    store: new InMemoryRateLimitStore(),
    getSecret: () => {
      throw new Error("missing test secret")
    },
    reportUnavailable: () => {
      unavailableReports += 1
    },
  })

  assert.deepEqual(
    await service.evaluateLoginAttempt(requestFrom("203.0.113.17"), () => false),
    { status: "invalid", rateLimitUnavailable: true }
  )
  assert.equal(unavailableReports, 1)
})

test("fails open without creating a shared bucket when the source is missing", async () => {
  const store = new InMemoryRateLimitStore()
  const unavailableReasons: string[] = []
  let passwordChecks = 0
  const service = createLoginRateLimitService({
    store,
    getSecret: () => "test-session-secret",
    reportUnavailable: (reason) => {
      unavailableReasons.push(reason)
    },
  })
  const requestWithoutForwardedIp = new Request(
    "https://quittencia.test/api/auth/login",
    { method: "POST" }
  )

  assert.deepEqual(
    await service.evaluateLoginAttempt(requestWithoutForwardedIp, () => {
      passwordChecks += 1
      return false
    }),
    { status: "invalid", rateLimitUnavailable: true }
  )
  assert.equal(passwordChecks, 1)
  assert.equal(store.transactionCount, 0)
  assert.equal(store.sourceKeys.size, 0)
  assert.deepEqual(unavailableReasons, ["missing-source"])
})

test("rejects password values longer than 256 characters", () => {
  assert.equal(isLoginPasswordWithinLimit("a".repeat(256)), true)
  assert.equal(isLoginPasswordWithinLimit("a".repeat(257)), false)
})

test("builds a private 429 response with retry guidance", async () => {
  const response = buildLoginRateLimitResponse(321)

  assert.equal(response.status, 429)
  assert.equal(response.headers.get("retry-after"), "321")
  assert.equal(response.headers.get("cache-control"), "no-store")
  assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8")
  assert.equal(
    await response.text(),
    "Trop de tentatives. Réessaie dans quelques minutes."
  )
})
