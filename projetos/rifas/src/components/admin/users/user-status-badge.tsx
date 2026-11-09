import { CheckCircle, Clock, MinusCircle, XCircle } from "lucide-react";

const FALLBACK_CONFIG = {
  label: "Desconhecido",
  className: "bg-muted text-muted-foreground border-muted-foreground/20",
  icon: MinusCircle,
};

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  ACTIVE: {
    label: "Ativo",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: CheckCircle,
  },
  INACTIVE: {
    label: "Inativo",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: MinusCircle,
  },
  PENDING: {
    label: "Pendente",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: Clock,
  },
  SUSPENDED: {
    label: "Suspenso",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    icon: XCircle,
  },
};

interface UserStatusBadgeProps {
  status: string;
  className?: string;
}

export function UserStatusBadge({ status, className = "" }: UserStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? FALLBACK_CONFIG;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${config.className} ${className}`}
    >
      <Icon className="size-3" aria-hidden="true" />
      {config.label}
    </span>
  );
}
