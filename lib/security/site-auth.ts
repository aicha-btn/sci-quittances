import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

export const SITE_SESSION_COOKIE_NAME = "quittance_site_session"
export const SITE_SESSION_VERSION = 2 as const
export const SITE_SESSION_DURATION_MS = 12 * 60 * 60 * 1000

const SITE_SESSION_CLOCK_TOLERANCE_MS = 60 * 1000

export type SiteSessionPayload = {
  v: typeof SITE_SESSION_VERSION
  role: "owner"
  iat: number
  exp: number
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`La variable d'environnement ${name} est obligatoire.`)
  }

  return value
}

function getSessionSecret() {
  return requireEnv("SITE_SESSION_SECRET")
}

export function getSitePassword() {
  return process.env.SITE_PASSWORD?.trim() ?? ""
}

export function isSiteSecurityConfigured() {
  return Boolean(getSitePassword() && process.env.SITE_SESSION_SECRET?.trim())
}

function signValue(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url")
}

export function verifySitePassword(password: string) {
  const expectedPassword = getSitePassword()

  if (!expectedPassword) {
    return false
  }

  const providedHash = Buffer.from(signValue(password), "utf8")
  const expectedHash = Buffer.from(signValue(expectedPassword), "utf8")

  return timingSafeEqual(providedHash, expectedHash)
}

function encodePayload(payload: SiteSessionPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")
}

function decodePayload(value: string): unknown {
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8")
    return JSON.parse(decoded) as unknown
  } catch {
    return null
  }
}

function isValidSiteSessionPayload(
  value: unknown,
  now: number
): value is SiteSessionPayload {
  if (!value || typeof value !== "object") {
    return false
  }

  const payload = value as Record<string, unknown>
  const issuedAt = payload.iat
  const expiresAt = payload.exp

  if (
    payload.v !== SITE_SESSION_VERSION ||
    payload.role !== "owner" ||
    !Number.isSafeInteger(issuedAt) ||
    !Number.isSafeInteger(expiresAt)
  ) {
    return false
  }

  const issuedAtMs = issuedAt as number
  const expiresAtMs = expiresAt as number

  return (
    issuedAtMs <= now + SITE_SESSION_CLOCK_TOLERANCE_MS &&
    expiresAtMs > now &&
    expiresAtMs > issuedAtMs &&
    expiresAtMs - issuedAtMs <= SITE_SESSION_DURATION_MS
  )
}

export function createSiteSessionToken(issuedAt = Date.now()) {
  const expiresAt = issuedAt + SITE_SESSION_DURATION_MS
  const payload: SiteSessionPayload = {
    v: SITE_SESSION_VERSION,
    role: "owner",
    iat: issuedAt,
    exp: expiresAt,
  }
  const encodedPayload = encodePayload(payload)

  return {
    token: `${encodedPayload}.${signValue(encodedPayload)}`,
    expiresAt,
  }
}

export function verifySiteSessionToken(
  token: string | undefined,
  now = Date.now()
) {
  if (!token) {
    return null
  }

  const tokenParts = token.split(".")

  if (tokenParts.length !== 2) {
    return null
  }

  const [encodedPayload, signature] = tokenParts

  if (!encodedPayload || !signature) {
    return null
  }

  const expectedSignature = signValue(encodedPayload)
  const providedSignature = Buffer.from(signature, "utf8")
  const expectedSignatureBuffer = Buffer.from(expectedSignature, "utf8")

  if (
    providedSignature.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(providedSignature, expectedSignatureBuffer)
  ) {
    return null
  }

  const payload = decodePayload(encodedPayload)

  if (!isValidSiteSessionPayload(payload, now)) {
    return null
  }

  return payload
}

export function buildSessionCookie(issuedAt = Date.now()) {
  const { token, expiresAt } = createSiteSessionToken(issuedAt)

  return {
    name: SITE_SESSION_COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(expiresAt),
    },
  }
}

export function buildExpiredSessionCookie() {
  return {
    name: SITE_SESSION_COOKIE_NAME,
    value: "",
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    },
  }
}

export async function getSiteSession() {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(SITE_SESSION_COOKIE_NAME)

  return verifySiteSessionToken(cookie?.value)
}
