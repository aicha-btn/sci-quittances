import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatCurrency, formatPropertyAddress, formatTenantGroup } from "@/lib/format"
import { getPropertyTotal } from "@/lib/format"
import type { PropertyWithTenants } from "@/types/domain"

interface ReceiptTargetCardProps {
  property: PropertyWithTenants
  selected: boolean
  onSelect: () => void
}

export function ReceiptTargetCard({
  property,
  selected,
  onSelect,
}: ReceiptTargetCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-[28px] border p-5 text-left shadow-sm transition duration-150",
        selected
          ? "border-slate-950 bg-slate-950 text-white shadow-[0_18px_45px_-28px_rgba(15,23,42,0.75)]"
          : "border-white/70 bg-white/85 text-slate-900 hover:-translate-y-0.5 hover:border-amber-300 hover:bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-xl font-semibold">
              {formatTenantGroup(property.tenants)}
            </h3>
            <Badge
              variant={selected ? "secondary" : "outline"}
              className={cn(
                "rounded-full",
                selected ? "bg-white/15 text-white" : "border-slate-200 text-slate-600"
              )}
            >
              {property.tenants.length > 1 ? "Colocation" : "Location simple"}
            </Badge>
          </div>
          <div className={cn("space-y-1 text-sm", selected ? "text-white/80" : "text-slate-600")}>
            {property.residenceName ? <p>{property.residenceName}</p> : null}
            <p>{formatPropertyAddress(property)}</p>
            <p>IRL {property.technicalReference}</p>
          </div>
        </div>

        <div className="rounded-[20px] bg-black/5 px-3 py-2 text-right text-xs font-medium sm:min-w-28">
          <p className={selected ? "text-white/70" : "text-slate-500"}>Total</p>
          <p className="text-base font-semibold">
            {formatCurrency(getPropertyTotal(property))}
          </p>
        </div>
      </div>
    </button>
  )
}
