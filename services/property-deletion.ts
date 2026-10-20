export type PropertyDeletionBatch<TReference> = {
  delete: (reference: TReference) => void
  commit: () => Promise<void>
}

export type PropertyDeletionDependencies<TReference> = {
  findTenantReferences: (propertyId: string) => Promise<TReference[]>
  getPropertyReference: (propertyId: string) => TReference
  createBatch: () => PropertyDeletionBatch<TReference>
}

export async function deletePropertyWithTenants<TReference>(
  propertyId: string,
  dependencies: PropertyDeletionDependencies<TReference>
) {
  const tenantReferences = await dependencies.findTenantReferences(propertyId)
  const batch = dependencies.createBatch()

  for (const tenantReference of tenantReferences) {
    batch.delete(tenantReference)
  }

  batch.delete(dependencies.getPropertyReference(propertyId))
  await batch.commit()
}
