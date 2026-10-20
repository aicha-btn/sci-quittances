"use client"

import { useState } from "react"
import { signOut } from "firebase/auth"
import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getFirebaseAuth } from "@/firebase/config"

export function LogoutButton() {
  const [isPending, setIsPending] = useState(false)
  const [hasError, setHasError] = useState(false)

  async function handleLogout() {
    if (isPending) {
      return
    }

    setIsPending(true)
    setHasError(false)

    const auth = await getFirebaseAuth().catch(() => null)

    if (auth) {
      try {
        await signOut(auth)
      } catch {
        // The server logout remains authoritative and must still run.
      }
    }

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("Logout failed")
      }

      window.location.replace("/login")
    } catch {
      setHasError(true)
      setIsPending(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={isPending}
      aria-label={hasError ? "Réessayer la déconnexion" : "Se déconnecter"}
      title={hasError ? "Déconnexion impossible, réessaie" : "Se déconnecter"}
      className="w-8 bg-white/70 px-0 text-slate-700 hover:bg-white hover:text-slate-950 sm:w-auto sm:px-3"
    >
      <LogOut aria-hidden="true" />
      <span className="hidden sm:inline">
        {isPending ? "Déconnexion…" : hasError ? "Réessayer" : "Déconnexion"}
      </span>
    </Button>
  )
}
