interface PageHeaderProps {
  title: string
  description: string
  action?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
          MVP quittances
        </p>
        <div className="space-y-1">
          <h2 className="font-heading text-2xl font-semibold text-slate-950 sm:text-3xl">
            {title}
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {action}
    </div>
  )
}
