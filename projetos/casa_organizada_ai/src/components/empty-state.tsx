import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/utils"

export type EmptyStateProps = ComponentProps<"div"> & {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-10 text-center",
        className,
      )}
      {...props}
    >
      {icon && <div className="mb-4 text-muted-foreground/50">{icon}</div>}
      <h3 className="text-sm font-medium">{title}</h3>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
