import "server-only"

import type { SiteSessionPayload } from "./site-auth"

type FirebaseTokenResponseDependencies = {
  getSession: () => Promise<SiteSessionPayload | null>
  isFirebaseAdminConfigured: () => boolean
  createCustomToken: () => Promise<string>
  reportError?: (message: string) => void
}

const noStoreHeaders = {
  "Cache-Control": "no-store",
}

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: noStoreHeaders,
  })
}

export function createFirebaseTokenResponse(
  dependencies: FirebaseTokenResponseDependencies
) {
  return async function handleFirebaseTokenRequest() {
    try {
      const session = await dependencies.getSession()

      if (!session) {
        return jsonResponse({ error: "Accès non autorisé." }, 401)
      }

      if (!dependencies.isFirebaseAdminConfigured()) {
        dependencies.reportError?.("Firebase token service unavailable.")
        return jsonResponse({ error: "Service temporairement indisponible." }, 500)
      }

      const token = await dependencies.createCustomToken()

      return jsonResponse({ token, sessionExpiresAt: session.exp })
    } catch {
      dependencies.reportError?.("Firebase token creation failed.")
      return jsonResponse({ error: "Service temporairement indisponible." }, 500)
    }
  }
}
