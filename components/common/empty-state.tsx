import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Card className="border-dashed bg-white/80 shadow-sm">
      <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/8 text-primary">
          <Icon className="size-6" />
        </div>
        <div className="space-y-2">
          <h3 className="font-heading text-xl font-semibold">{title}</h3>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  )
}
