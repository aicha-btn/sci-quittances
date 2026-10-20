import assert from "node:assert/strict"
import { test } from "node:test"

import {
  deletePropertyWithTenants,
  type PropertyDeletionDependencies,
} from "./property-deletion"

type Reference = {
  collection: "properties" | "tenants"
  id: string
  propertyId?: string
}

function createDeletionHarness(
  options: { findError?: Error; commitError?: Error } = {}
) {
  const tenantReferences: Reference[] = [
    {
      collection: "tenants",
      id: "tenant-demo-1",
      propertyId: "property-demo-1",
    },
    {
      collection: "tenants",
      id: "tenant-demo-2",
      propertyId: "property-demo-1",
    },
    {
      collection: "tenants",
      id: "tenant-other-property",
      propertyId: "property-demo-2",
    },
  ]
  const deletedReferences: Reference[] = []
  const queriedPropertyIds: string[] = []
  let batchCount = 0
  let commitCount = 0

  const dependencies: PropertyDeletionDependencies<Reference> = {
    async findTenantReferences(propertyId) {
      queriedPropertyIds.push(propertyId)

      if (options.findError) {
        throw options.findError
      }

      return tenantReferences.filter(
        (reference) => reference.propertyId === propertyId
      )
    },
    getPropertyReference(propertyId) {
      return { collection: "properties", id: propertyId }
    },
    createBatch() {
      batchCount += 1

      return {
        delete(reference) {
          deletedReferences.push(reference)
        },
        async commit() {
          commitCount += 1

          if (options.commitError) {
            throw options.commitError
          }
        },
      }
    },
  }

  return {
    dependencies,
    deletedReferences,
    queriedPropertyIds,
    getBatchCount: () => batchCount,
    getCommitCount: () => commitCount,
  }
}

test("deletes the targeted tenants and property in one committed batch", async () => {
  const harness = createDeletionHarness()

  await deletePropertyWithTenants("property-demo-1", harness.dependencies)

  assert.deepEqual(harness.queriedPropertyIds, ["property-demo-1"])
  assert.deepEqual(harness.deletedReferences, [
    {
      collection: "tenants",
      id: "tenant-demo-1",
      propertyId: "property-demo-1",
    },
    {
      collection: "tenants",
      id: "tenant-demo-2",
      propertyId: "property-demo-1",
    },
    { collection: "properties", id: "property-demo-1" },
  ])
  assert.equal(
    harness.deletedReferences.some(
      (reference) => reference.id === "tenant-other-property"
    ),
    false
  )
  assert.equal(harness.getCommitCount(), 1)
})

test("deletes the property even when it has no associated tenant", async () => {
  const harness = createDeletionHarness()

  await deletePropertyWithTenants("property-without-tenant", harness.dependencies)

  assert.deepEqual(harness.deletedReferences, [
    { collection: "properties", id: "property-without-tenant" },
  ])
  assert.equal(harness.getCommitCount(), 1)
})

test("propagates a batch commit failure", async () => {
  const commitError = new Error("Batch commit failed")
  const harness = createDeletionHarness({ commitError })

  await assert.rejects(
    deletePropertyWithTenants("property-demo-1", harness.dependencies),
    commitError
  )
  assert.equal(harness.getCommitCount(), 1)
})

test("propagates a tenant lookup failure before creating a batch", async () => {
  const findError = new Error("Tenant lookup failed")
  const harness = createDeletionHarness({ findError })

  await assert.rejects(
    deletePropertyWithTenants("property-demo-1", harness.dependencies),
    findError
  )
  assert.deepEqual(harness.deletedReferences, [])
  assert.equal(harness.getBatchCount(), 0)
  assert.equal(harness.getCommitCount(), 0)
})
