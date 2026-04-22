import { redirect } from "next/navigation"

import { AppShell } from "@/components/layout/app-shell"
import { AppProvider } from "@/components/providers/app-provider"
import { getSiteSession } from "@/lib/security/site-auth"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSiteSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <AppProvider>
      <AppShell>{children}</AppShell>
    </AppProvider>
  )
}
