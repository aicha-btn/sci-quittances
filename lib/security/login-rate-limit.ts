import "server-only"

import { createHmac } from "node:crypto"
import { Timestamp } from "firebase-admin/firestore"

import { getFirebaseAdminFirestore } from "../../firebase/admin"

export const LOGIN_RATE_LIMIT_COLLECTION = "__security_login_rate_limits"
export const LOGIN_RATE_LIMIT_MAX_FAILURES = 5
export const LOGIN_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
export const MAX_LOGIN_PASSWORD_LENGTH = 256

type LoginRateLimitState = {
  failedAttempts: number
  windowStartedAtMs: number
}

type LoginRateLimitMutation<TResult> = {
  result: TResult
  nextState?: LoginRateLimitState | null
}

export type LoginRateLimitStore = {
  transact<TResult>(
    sourceKey: string,
    update: (
      state: LoginRateLimitState | null
    ) => LoginRateLimitMutation<TResult>
  ): Promise<TResult>
}

export type LoginAttemptResult =
  | { status: "success"; rateLimitUnavailable?: boolean }
  | { status: "invalid"; rateLimitUnavailable?: boolean }
  | { status: "limited"; retryAfterSeconds: number }

type LoginRateLimitDependencies = {
  store: LoginRateLimitStore
  now: () => number
  getSecret: () => string
  reportUnavailable: (reason: "missing-source" | "backend") => void
}

function getTimestampMillis(value: unknown) {
  return value instanceof Timestamp ? value.toMillis() : null
}

function createFirestoreRateLimitStore(): LoginRateLimitStore {
  return {
    async transact(sourceKey, update) {
      const database = getFirebaseAdminFirestore()
      const document = database
        .collection(LOGIN_RATE_LIMIT_COLLECTION)
        .doc(sourceKey)

      return database.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(document)
        const data = snapshot.data()
        const failedAttempts = data?.failedAttempts
        const windowStartedAtMs = getTimestampMillis(data?.windowStartedAt)
        const currentState =
          Number.isInteger(failedAttempts) &&
          typeof failedAttempts === "number" &&
          failedAttempts >= 0 &&
          windowStartedAtMs !== null
            ? { failedAttempts, windowStartedAtMs }
            : null
        const mutation = update(currentState)

        if (mutation.nextState === null) {
          transaction.delete(document)
        } else if (mutation.nextState) {
          const windowStartedAt = Timestamp.fromMillis(
            mutation.nextState.windowStartedAtMs
          )

          transaction.set(document, {
            failedAttempts: mutation.nextState.failedAttempts,
            windowStartedAt,
            expiresAt: Timestamp.fromMillis(
              mutation.nextState.windowStartedAtMs +
                LOGIN_RATE_LIMIT_WINDOW_MS
            ),
            updatedAt: Timestamp.now(),
          })
        }

        return mutation.result
      })
    },
  }
}

function getRateLimitSecret() {
  const secret = process.env.SITE_SESSION_SECRET?.trim()

  if (!secret) {
    throw new Error("Login rate limit secret is unavailable.")
  }

  return secret
}

function getForwardedIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim()

  return firstForwardedIp || null
}

export function isLoginPasswordWithinLimit(password: string) {
  return password.length <= MAX_LOGIN_PASSWORD_LENGTH
}

export function buildLoginRateLimitResponse(retryAfterSeconds: number) {
  return new Response(
    "Trop de tentatives. Réessaie dans quelques minutes.",
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
        "Retry-After": String(retryAfterSeconds),
      },
    }
  )
}

export function createLoginRateLimitService(
  dependencies: Partial<LoginRateLimitDependencies> = {}
) {
  const store = dependencies.store ?? createFirestoreRateLimitStore()
  const now = dependencies.now ?? Date.now
  const getSecret = dependencies.getSecret ?? getRateLimitSecret
  const reportUnavailable =
    dependencies.reportUnavailable ??
    ((reason) => {
      const message =
        reason === "missing-source"
          ? "[security] Login rate limiter skipped: no reliable network source."
          : "[security] Login rate limiter unavailable; continuing in fail-open mode."

      console.warn(message)
    })

  function getSourceKey(request: Request) {
    const forwardedIp = getForwardedIp(request)

    if (!forwardedIp) {
      return null
    }

    return createHmac("sha256", getSecret())
      .update(`login-rate-limit:${forwardedIp}`)
      .digest("hex")
  }

  async function evaluateLoginAttempt(
    request: Request,
    verifyPassword: () => boolean
  ): Promise<LoginAttemptResult> {
    function continueWithoutRateLimit(
      reason: "missing-source" | "backend"
    ): LoginAttemptResult {
      reportUnavailable(reason)

      return verifyPassword()
        ? { status: "success", rateLimitUnavailable: true }
        : { status: "invalid", rateLimitUnavailable: true }
    }

    let sourceKey: string | null

    try {
      sourceKey = getSourceKey(request)
    } catch {
      return continueWithoutRateLimit("backend")
    }

    if (!sourceKey) {
      return continueWithoutRateLimit("missing-source")
    }

    try {
      return await store.transact<LoginAttemptResult>(sourceKey, (storedState) => {
        const currentTime = now()
        const state =
          !storedState ||
          currentTime >=
            storedState.windowStartedAtMs + LOGIN_RATE_LIMIT_WINDOW_MS
            ? { failedAttempts: 0, windowStartedAtMs: currentTime }
            : storedState
        const windowEndsAt =
          state.windowStartedAtMs + LOGIN_RATE_LIMIT_WINDOW_MS

        if (state.failedAttempts >= LOGIN_RATE_LIMIT_MAX_FAILURES) {
          return {
            result: {
              status: "limited" as const,
              retryAfterSeconds: Math.max(
                1,
                Math.ceil((windowEndsAt - currentTime) / 1000)
              ),
            },
          }
        }

        if (verifyPassword()) {
          return {
            result: { status: "success" as const },
            nextState: null,
          }
        }

        return {
          result: { status: "invalid" as const },
          nextState: {
            failedAttempts: state.failedAttempts + 1,
            windowStartedAtMs: state.windowStartedAtMs,
          },
        }
      })
    } catch {
      return continueWithoutRateLimit("backend")
    }
  }

  return { evaluateLoginAttempt, getSourceKey }
}

export const { evaluateLoginAttempt } = createLoginRateLimitService()
