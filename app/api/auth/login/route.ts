import { NextResponse } from "next/server"

import {
  buildSessionCookie,
  isSiteSecurityConfigured,
  verifySitePassword,
} from "@/lib/security/site-auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const formData = await request.formData()
  const password = String(formData.get("password") ?? "")
  const loginUrl = new URL("/login", request.url)

  if (!isSiteSecurityConfigured()) {
    loginUrl.searchParams.set("error", "config")
    return NextResponse.redirect(loginUrl, { status: 303 })
  }

  if (!password.trim()) {
    loginUrl.searchParams.set("error", "missing")
    return NextResponse.redirect(loginUrl, { status: 303 })
  }

  if (!verifySitePassword(password)) {
    loginUrl.searchParams.set("error", "invalid")
    return NextResponse.redirect(loginUrl, { status: 303 })
  }

  const response = NextResponse.redirect(new URL("/", request.url), {
    status: 303,
  })
  const sessionCookie = buildSessionCookie()

  response.cookies.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.options
  )

  return response
}
