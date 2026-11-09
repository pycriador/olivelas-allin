import { createFileRoute } from "@tanstack/react-router";
import { Shield, BadgeCheck, Calendar, Mail, User as UserIcon, Zap } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { PLAN_LABELS, ROLE_LABELS, STATUS_LABELS } from "@/types/profile";

export const Route = createFileRoute("/_authenticated/iam")({
  head: () => ({
    meta: [{ title: "IAM — RaffleHub" }],
  }),
  component: IamPage,
});

function IamPage() {
  const { currentUser, isProfileLoading } = useAuth();

  if (isProfileLoading) return <IamSkeleton />;
  if (!currentUser) return null;

  const { name, email, avatarUrl, role, plan, status, isActive } = currentUser;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Identity & Access Management</h1>
        <p className="text-sm text-muted-foreground">IAM Sprint 1 — Identity Foundation</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="size-5" />
            Perfil do Usuário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="size-16 rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold">{name}</h2>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>

          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <InfoCard
              icon={Shield}
              label="Role"
              value={ROLE_LABELS[role] ?? role}
              subtitle={role}
              variant={role === "GLOBAL_ADMIN" ? "default" : "secondary"}
            />
            <InfoCard
              icon={Zap}
              label="Plano"
              value={plan ? (PLAN_LABELS[plan] ?? plan) : "—"}
              subtitle={plan ? plan : "N/A (Admin)"}
              variant="secondary"
            />
            <InfoCard
              icon={BadgeCheck}
              label="Status"
              value={STATUS_LABELS[status] ?? status}
              subtitle={status}
              variant={isActive ? "success" : "destructive"}
            />
            <InfoCard
              icon={Calendar}
              label="Sessão"
              value={isActive ? "Ativa" : "Bloqueada"}
              subtitle="IAM Sprint 1"
              variant="secondary"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-5" />
            Dados Técnicos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-80 overflow-auto rounded-md bg-muted p-4 text-xs">
            {JSON.stringify({ id: currentUser.id, role, plan, status, isActive }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  subtitle,
  variant,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtitle: string;
  variant: "default" | "secondary" | "success" | "destructive";
}) {
  const variantStyles = {
    default:
      "border-primary/40 bg-primary/5 text-primary dark:border-primary/30 dark:bg-primary/10",
    secondary: "border-border bg-card",
    success: "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400",
    destructive: "border-destructive/40 bg-destructive/5 text-destructive",
  };

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 ${variantStyles[variant]}`}>
      <Icon className="size-5 shrink-0 opacity-70" />
      <div className="min-w-0">
        <p className="text-xs font-medium opacity-70">{label}</p>
        <p className="text-sm font-semibold truncate">{value}</p>
        <p className="text-xs opacity-50">{subtitle}</p>
      </div>
    </div>
  );
}

function IamSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <Skeleton className="h-8 w-64" />
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}
