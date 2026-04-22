import { TenantsScreen } from "@/components/tenants/tenants-screen"

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string }>
}) {
  const { propertyId } = await searchParams

  return <TenantsScreen initialPropertyId={propertyId} />
}
