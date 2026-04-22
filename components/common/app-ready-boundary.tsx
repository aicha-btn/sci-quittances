"use client"

import { ShieldAlert, WifiOff } from "lucide-react"

import { useAppContext } from "@/components/providers/app-provider"
import { EmptyState } from "@/components/common/empty-state"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function AppReadyBoundary({
  children,
}: {
  children: React.ReactNode
}) {
  const { authError, authReady, isConfigured } = useAppContext()

  if (!isConfigured) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Firebase n'est pas encore configuré"
        description="Ajoute les variables Firebase dans .env.local pour démarrer l'application. L'écran restera ensuite utilisable sans connexion visible."
      />
    )
  }

  if (authError) {
    return (
      <EmptyState
        icon={WifiOff}
        title="Connexion Firebase impossible"
        description={authError}
      />
    )
  }

  if (!authReady) {
    return (
      <Card className="border-white/60 bg-white/80 shadow-sm">
        <CardContent className="space-y-4 p-5">
          <Skeleton className="h-8 w-40 rounded-full" />
          <Skeleton className="h-24 w-full rounded-3xl" />
          <Skeleton className="h-24 w-full rounded-3xl" />
          <Skeleton className="h-24 w-full rounded-3xl" />
        </CardContent>
      </Card>
    )
  }

  return <>{children}</>
}
