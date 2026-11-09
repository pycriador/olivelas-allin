import { Shield, ShieldCheck, User as UserIcon } from "lucide-react";

const ROLE_CONFIG: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  GLOBAL_ADMIN: {
    icon: Shield,
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  ADMIN: {
    icon: ShieldCheck,
    className: "bg-primary/10 text-primary border-primary/20",
  },
  PUBLISHER: {
    icon: UserIcon,
    className: "bg-muted text-muted-foreground border-muted-foreground/20",
  },
  USER: {
    icon: UserIcon,
    className: "bg-muted text-muted-foreground border-muted-foreground/20",
  },
};

const ROLE_LABELS: Record<string, string> = {
  GLOBAL_ADMIN: "Global Admin",
  ADMIN: "Administrador",
  PUBLISHER: "Criador",
  USER: "Usuario",
};

interface UserRoleBadgeProps {
  role: string;
  className?: string;
}

export function UserRoleBadge({ role, className = "" }: UserRoleBadgeProps) {
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG["USER"];
  const Icon = config!.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${config!.className} ${className}`}
    >
      <Icon className="size-3" aria-hidden="true" />
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}
