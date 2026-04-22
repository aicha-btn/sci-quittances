"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"
import {
  getIdTokenResult,
  onAuthStateChanged,
  signInWithCustomToken,
  signOut,
  type User,
} from "firebase/auth"
import { Toaster } from "sonner"

import { auth, isFirebaseConfigured } from "@/firebase/config"

interface AppContextValue {
  isConfigured: boolean
  authReady: boolean
  authError: string | null
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const firebaseAuth = auth

    if (!isFirebaseConfigured || !firebaseAuth) {
      return
    }

    const activeAuth = firebaseAuth

    let cancelled = false
    let ensureSessionPromise: Promise<void> | null = null

    async function isOwnerUser(user: User) {
      const tokenResult = await getIdTokenResult(user, true)

      return (
        user.uid === "site-owner" && tokenResult.claims.app_role === "owner"
      )
    }

    async function fetchCustomToken() {
      const response = await fetch("/api/firebase/token", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      })

      if (response.status === 401) {
        throw new Error(
          "La session du site a expiré. Recharge la page et saisis à nouveau le mot de passe."
        )
      }

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null

        throw new Error(
          payload?.error ??
            "Impossible de récupérer le jeton Firebase sécurisé."
        )
      }

      const payload = (await response.json()) as { token?: string }

      if (!payload.token) {
        throw new Error("Le jeton Firebase sécurisé est manquant.")
      }

      return payload.token
    }

    async function ensureOwnerSession() {
      if (ensureSessionPromise) {
        return ensureSessionPromise
      }

      ensureSessionPromise = (async () => {
        if (activeAuth.currentUser) {
          const alreadyOwner = await isOwnerUser(activeAuth.currentUser).catch(
            () => false
          )

          if (alreadyOwner) {
            return
          }

          await signOut(activeAuth)
        }

        const customToken = await fetchCustomToken()
        await signInWithCustomToken(activeAuth, customToken)
      })().finally(() => {
        ensureSessionPromise = null
      })

      return ensureSessionPromise
    }

    const timeoutId = window.setTimeout(() => {
      if (cancelled) {
        return
      }

      setAuthError((currentError) => {
        if (currentError) {
          return currentError
        }

        return "Connexion Firebase trop longue. Vérifie la session du site, Firebase Admin et les règles Firestore."
      })
    }, 8000)

    const unsubscribe = onAuthStateChanged(activeAuth, async (user) => {
      if (cancelled) {
        return
      }

      if (!user) {
        setAuthReady(false)
        return
      }

      try {
        const hasOwnerClaim = await isOwnerUser(user)

        if (!hasOwnerClaim) {
          await signOut(activeAuth)
          return
        }

        window.clearTimeout(timeoutId)
        setAuthError(null)
        setAuthReady(true)
      } catch (error) {
        if (cancelled) {
          return
        }

        window.clearTimeout(timeoutId)
        setAuthReady(false)
        setAuthError(
          error instanceof Error
            ? error.message
            : "La vérification Firebase sécurisée a échoué."
        )
      }
    })

    void (async () => {
      try {
        await ensureOwnerSession()
      } catch (error) {
        try {
          await signOut(activeAuth)
        } catch {
          // No-op: a failed sign-out should not hide the real auth error.
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
      window.clearTimeout(timeoutId)
      unsubscribe()
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
