import {
  Activity,
  Archive,
  Copy,
  FileUp,
  Globe,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  RotateCcw,
  ShieldAlert,
  Trash2,
  ToggleLeft,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { CardSkeleton } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { AUDIT_ACTION_LABELS, type AuditLogWithActor } from "@/types/audit";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  LOGIN: LogIn,
  LOGOUT: LogOut,
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
  STATUS_CHANGE: ToggleLeft,
  ROLE_CHANGE: ShieldAlert,
  UPLOAD: FileUp,
  DOWNLOAD: FileUp,
  DUPLICATE: Copy,
  ARCHIVE: Archive,
  PUBLISH: Globe,
  RESTORE: RotateCcw,
  ERROR: ShieldAlert,
};

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function ActivityTimeline({
  items,
  isLoading,
  className,
}: {
  items: AuditLogWithActor[];
  isLoading?: boolean;
  className?: string;
}) {
  if (isLoading) return <CardSkeleton rows={4} />;
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="Sem atividades"
        description="Nenhum evento registrado até o momento."
      />
    );
  }

  return (
    <ol className={cn("space-y-4", className)}>
      {items.map((item) => {
        const Icon = ICONS[item.action] ?? Activity;
        return (
          <li key={item.id} className="flex gap-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {AUDIT_ACTION_LABELS[item.action as keyof typeof AUDIT_ACTION_LABELS] ??
                  item.action}
                {item.entity ? (
                  <span className="font-normal text-muted-foreground"> · {item.entity}</span>
                ) : null}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {item.actor_name ?? item.actor_email ?? "Sistema"} ·{" "}
                {dateTime.format(new Date(item.created_at))}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
