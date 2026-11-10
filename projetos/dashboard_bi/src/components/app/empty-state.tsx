import { Inbox, type LucideIcon } from "lucide-react";

export function EmptyState({
  message,
  title,
  description,
  icon: Icon = Inbox,
}: {
  message?: string;
  title?: string;
  description?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
      <Icon className="mb-3 h-8 w-8 text-muted-foreground" />
      {title && <p className="text-sm font-medium">{title}</p>}
      {(description || message) && (
        <p className="text-sm text-muted-foreground">{description ?? message}</p>
      )}
    </div>
  );
}
