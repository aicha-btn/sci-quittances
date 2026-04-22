"use client"

import { useEffect, useState } from "react"

import { useAppContext } from "@/components/providers/app-provider"
import { subscribeProperties } from "@/services/properties-service"
import type { Property } from "@/types/domain"

export function useProperties() {
  const { authReady, isConfigured } = useAppContext()
  const [properties, setProperties] = useState<Property[]>([])
  const [snapshotLoading, setSnapshotLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConfigured || !authReady) {
      return
    }

    const unsubscribe = subscribeProperties(
      (nextProperties) => {
        setProperties(nextProperties)
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
    properties,
    loading: isConfigured ? !authReady || snapshotLoading : false,
    error,
  }
}
