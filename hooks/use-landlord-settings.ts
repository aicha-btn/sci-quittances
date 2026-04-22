"use client"

import { useEffect, useState } from "react"

import { useAppContext } from "@/components/providers/app-provider"
import { subscribeLandlordSettings } from "@/services/landlord-settings-service"
import type { LandlordSettings } from "@/types/domain"

export function useLandlordSettings() {
  const { authReady, isConfigured } = useAppContext()
  const [settings, setSettings] = useState<LandlordSettings | null>(null)
  const [snapshotLoading, setSnapshotLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConfigured || !authReady) {
      return
    }

    const unsubscribe = subscribeLandlordSettings(
      (nextSettings) => {
        setSettings(nextSettings)
        setError(null)
        setSnapshotLoading(false)
      },
      (nextError) => {
        setError(nextError.message)
        setSnapshotLoading(false)
      }
    )

    return () => unsubscribe()
  }, [authReady, isConfigured])

  return {
    settings,
    loading: isConfigured ? !authReady || snapshotLoading : false,
    error,
  }
}
