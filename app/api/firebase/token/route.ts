import { NextResponse } from "next/server"

import { getFirebaseAdminAuth, isFirebaseAdminConfigured } from "@/firebase/admin"
import { getSiteSession } from "@/lib/security/site-auth"

export const runtime = "nodejs"

export async function POST() {
  const session = await getSiteSession()

  if (!session) {
    return NextResponse.json(
      { error: "Session du site invalide ou expirée." },
      { status: 401 }
    )
  }

  if (!isFirebaseAdminConfigured) {
    return NextResponse.json(
      { error: "Firebase Admin n'est pas configuré côté serveur." },
      { status: 500 }
    )
  }

  const token = await getFirebaseAdminAuth().createCustomToken("site-owner", {
    app_role: "owner",
  })

  return NextResponse.json(
    { token },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  )
}
