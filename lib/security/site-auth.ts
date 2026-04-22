import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

export const SITE_SESSION_COOKIE_NAME = "quittance_site_session"

const SESSION_TTL_DAYS = 30

type SiteSessionPayload = {
  role: "owner"
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

function decodePayload(value: string) {
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8")
    return JSON.parse(decoded) as SiteSessionPayload
  } catch {
    return null
  }
}

function createSessionToken() {
  const expiresAt = Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
  const payload: SiteSessionPayload = {
    role: "owner",
    exp: expiresAt,
  }
  const encodedPayload = encodePayload(payload)

  return {
    token: `${encodedPayload}.${signValue(encodedPayload)}`,
    expiresAt,
  }
}

function verifySessionToken(token: string | undefined) {
  if (!token) {
    return null
  }

  const [encodedPayload, signature] = token.split(".")

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

  if (!payload || payload.role !== "owner" || payload.exp <= Date.now()) {
    return null
  }

  return payload
}

export function buildSessionCookie() {
  const { token, expiresAt } = createSessionToken()

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

export async function getSiteSession() {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(SITE_SESSION_COOKIE_NAME)

  return verifySessionToken(cookie?.value)
}
