"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"
import { onAuthStateChanged, signInAnonymously } from "firebase/auth"
import { Toaster } from "sonner"

import { auth, isFirebaseConfigured } from "@/firebase/config"

interface AppContextValue {
  isConfigured: boolean
  authReady: boolean
  authError: string | null
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [authReady, setAuthReady] = useState(
    !isFirebaseConfigured || Boolean(auth?.currentUser)
  )
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const firebaseAuth = auth

    if (!isFirebaseConfigured || !firebaseAuth) {
      return
    }

    let cancelled = false
    const currentHost = window.location.host
    const timeoutId = window.setTimeout(() => {
      if (cancelled) {
        return
      }

      setAuthError((currentError) => {
        if (currentError) {
          return currentError
        }

        if (currentHost.includes("ngrok")) {
          return `Connexion Firebase trop longue sur ${currentHost}. Si tu testes via ngrok, ajoute ce domaine dans Firebase Authentication > Settings > Authorized domains et utilise l'URL HTTPS.`
        }

        return "Connexion Firebase trop longue. Recharge la page ou vérifie la configuration Authentication."
      })
    }, 8000)

    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (cancelled) {
        return
      }

      if (user) {
        window.clearTimeout(timeoutId)
        setAuthError(null)
        setAuthReady(true)
        return
      }
    })

    if (!firebaseAuth.currentUser) {
      void (async () => {
        try {
          await signInAnonymously(firebaseAuth)
          if (cancelled) {
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
              : "La connexion anonyme Firebase a échoué."
          )
        }
      })()
    }

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
