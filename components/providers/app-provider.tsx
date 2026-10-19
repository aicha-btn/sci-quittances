"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import {
  getIdTokenResult,
  inMemoryPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithCustomToken,
  signOut,
  type User,
} from "firebase/auth"
import { Toaster } from "sonner"

import { auth, isFirebaseConfigured } from "@/firebase/config"
import { isSiteSessionExpired } from "@/lib/security/session-expiration"

interface AppContextValue {
  isConfigured: boolean
  authReady: boolean
  authError: string | null
}

type FirebaseTokenPayload = {
  token?: string
  sessionExpiresAt?: number
}

class SiteSessionExpiredError extends Error {}

const AppContext = createContext<AppContextValue | null>(null)
const SESSION_CHECK_INTERVAL_MS = 60_000

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured)
  const [authError, setAuthError] = useState<string | null>(null)
  const sessionExpiresAtRef = useRef<number | null>(null)
  const redirectingRef = useRef(false)

  useEffect(() => {
    const firebaseAuth = auth

    if (!isFirebaseConfigured || !firebaseAuth) {
      return
    }

    const activeAuth = firebaseAuth
    let cancelled = false
    let unsubscribeAuth = () => {}

    async function isOwnerUser(user: User) {
      const tokenResult = await getIdTokenResult(user, true)

      return (
        user.uid === "site-owner" && tokenResult.claims.app_role === "owner"
      )
    }

    async function redirectToLogin() {
      if (redirectingRef.current) {
        return
      }

      redirectingRef.current = true
      sessionExpiresAtRef.current = null
      setAuthReady(false)
      setAuthError(null)

      try {
        await signOut(activeAuth)
      } catch {
        // Hard navigation below still clears the in-memory Firebase session.
      } finally {
        window.location.replace("/login")
      }
    }

    async function fetchCustomToken() {
      const response = await fetch("/api/firebase/token", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      })

      if (response.status === 401) {
        throw new SiteSessionExpiredError()
      }

      if (!response.ok) {
        throw new Error("Impossible d’établir la session sécurisée.")
      }

      const payload = (await response.json()) as FirebaseTokenPayload

      if (
        !payload.token ||
        typeof payload.sessionExpiresAt !== "number" ||
        !Number.isFinite(payload.sessionExpiresAt)
      ) {
        throw new Error("La réponse de session sécurisée est invalide.")
      }

      return {
        token: payload.token,
        sessionExpiresAt: payload.sessionExpiresAt,
      }
    }

    const checkSessionExpiration = () => {
      if (isSiteSessionExpired(sessionExpiresAtRef.current)) {
        void redirectToLogin()
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSessionExpiration()
      }
    }

    const timeoutId = window.setTimeout(() => {
      if (!cancelled && !redirectingRef.current) {
        setAuthError(
          "Connexion Firebase trop longue. Vérifie ta connexion puis réessaie."
        )
      }
    }, 8000)
    const intervalId = window.setInterval(
      checkSessionExpiration,
      SESSION_CHECK_INTERVAL_MS
    )

    window.addEventListener("focus", checkSessionExpiration)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    void (async () => {
      try {
        await setPersistence(activeAuth, inMemoryPersistence)

        const { token, sessionExpiresAt } = await fetchCustomToken()

        if (isSiteSessionExpired(sessionExpiresAt)) {
          throw new SiteSessionExpiredError()
        }

        const credential = await signInWithCustomToken(activeAuth, token)
        const hasOwnerClaim = await isOwnerUser(credential.user)

        if (!hasOwnerClaim) {
          throw new Error("La session Firebase n’est pas autorisée.")
        }

        if (cancelled) {
          return
        }

        sessionExpiresAtRef.current = sessionExpiresAt
        window.clearTimeout(timeoutId)
        setAuthError(null)
        setAuthReady(true)

        unsubscribeAuth = onAuthStateChanged(activeAuth, (user) => {
          if (!cancelled && !user && !redirectingRef.current) {
            setAuthReady(false)
          }
        })
      } catch (error) {
        if (error instanceof SiteSessionExpiredError) {
          await redirectToLogin()
          return
        }

        try {
          await signOut(activeAuth)
        } catch {
          // Preserve the original, generic authentication error.
        }

        if (cancelled) {
          return
        }

        window.clearTimeout(timeoutId)
        setAuthReady(false)
        setAuthError(
          error instanceof Error
            ? error.message
            : "La connexion Firebase sécurisée a échoué."
        )
      }
    })()

    return () => {
      cancelled = true
      sessionExpiresAtRef.current = null
      window.clearTimeout(timeoutId)
      window.clearInterval(intervalId)
      window.removeEventListener("focus", checkSessionExpiration)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      unsubscribeAuth()
    }
  }, [])

  return (
    <AppContext.Provider
      value={{
        isConfigured: isFirebaseConfigured,
        authReady,
        authError,
      }}
    >
      {children}
      <Toaster position="top-center" richColors />
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)

  if (!context) {
    throw new Error("useAppContext doit être utilisé dans AppProvider")
  }

  return context
}
