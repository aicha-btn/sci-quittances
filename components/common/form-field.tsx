import { Label } from "@/components/ui/label"

interface FormFieldProps {
  htmlFor: string
  label: string
  required?: boolean
  description?: string
  error?: string
  children: React.ReactNode
}

export function FormField({
  htmlFor,
  label,
  required,
  description,
  error,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={htmlFor} className="text-sm font-medium text-slate-900">
          {label}
        </Label>
        {required ? <span className="text-xs text-amber-700">*</span> : null}
      </div>
      {children}
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  )
}
