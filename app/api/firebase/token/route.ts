import { getFirebaseAdminAuth, isFirebaseAdminConfigured } from "@/firebase/admin"
import { createFirebaseTokenResponse } from "@/lib/security/firebase-token-response"
import { getSiteSession } from "@/lib/security/site-auth"

export const runtime = "nodejs"

export const POST = createFirebaseTokenResponse({
  getSession: getSiteSession,
  isFirebaseAdminConfigured: () => isFirebaseAdminConfigured,
  createCustomToken: () =>
    getFirebaseAdminAuth().createCustomToken("site-owner", {
      app_role: "owner",
    }),
  reportError: (message) => console.error(`[auth] ${message}`),
})
