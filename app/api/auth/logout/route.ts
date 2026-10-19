import { NextResponse } from "next/server"

import { buildExpiredSessionCookie } from "@/lib/security/site-auth"

export const runtime = "nodejs"

export async function POST() {
  const response = NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  )
  const cookie = buildExpiredSessionCookie()

  response.cookies.set(cookie.name, cookie.value, cookie.options)

  return response
}
