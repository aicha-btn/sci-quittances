"use client"

import { useEffect, useState } from "react"

import { useAppContext } from "@/components/providers/app-provider"
import { subscribeTenants } from "@/services/tenants-service"
import type { Tenant } from "@/types/domain"

export function useTenants() {
  const { authReady, isConfigured } = useAppContext()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [snapshotLoading, setSnapshotLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConfigured || !authReady) {
      return
    }

    const unsubscribe = subscribeTenants(
      (nextTenants) => {
        setTenants(nextTenants)
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
    tenants,
    loading: isConfigured ? !authReady || snapshotLoading : false,
    error,
  }
}
