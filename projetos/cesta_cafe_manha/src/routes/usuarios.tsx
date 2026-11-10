import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeft, Check, Clock3, ShieldCheck, UserRound, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/platform/AppShell";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateBlocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthSession, useCurrentMember } from "@/hooks/useAuthSession";
import { fetchMembers, setMemberRole, setMemberStatus } from "@/services/account";
import {
  ROLE_LABEL,
  ROLE_OPTIONS,
  STATUS_LABEL,
  type AccountMember,
  type AppRole,
} from "@/types/domain";

export const Route = createFileRoute("/usuarios")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  head: () => ({ meta: [{ title: "Usuários | Olivelas" }] }),
  component: UsersPage,
});

function UsersPage() {
  const { user, loading } = useAuthSession();
  const current = useCurrentMember(user?.id);
  const members = useQuery({
    queryKey: ["members"],
    queryFn: fetchMembers,
    enabled: current.data?.roles.includes("administrador") ?? false,
  });
  const queryClient = useQueryClient();

  if (loading || current.isLoading)
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Carregando usuários...
      </div>
    );
  if (!current.data?.profile || !current.data.roles.includes("administrador"))
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
        <div>
          <p className="font-semibold">Acesso restrito</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Somente administradores podem gerenciar acessos.
          </p>
          <Link to="/painel" className="mt-4 inline-block text-sm text-primary underline">
            Voltar ao painel
          </Link>
        </div>
      </div>
    );

  async function updateStatus(member: AccountMember, status: "aprovado" | "rejeitado") {
    await setMemberStatus(member.profile.id, status, user!.id);
    await queryClient.invalidateQueries({ queryKey: ["members"] });
  }

  async function updateRole(member: AccountMember, role: AppRole) {
    await setMemberRole(member.profile.id, role, user!.id);
    await queryClient.invalidateQueries({ queryKey: ["members"] });
  }

  return (
    <AppShell
      profile={current.data.profile}
      roles={current.data.roles}
      title="Usuários"
      description="Aprove ou rejeite acessos à sua operação."
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <Link
            to="/painel"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Painel
          </Link>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight">Equipe e permissões</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Novos acessos começam pendentes e entram como Consulta após o primeiro login.
          </p>
        </div>
        {members.isLoading && <LoadingState rows={4} />}
        {members.isError && (
          <ErrorState
            message="Confira sua conexão com o Lovable Cloud."
            onRetry={() => members.refetch()}
          />
        )}
        {members.data?.length === 0 && (
          <EmptyState
            title="Nenhum usuário encontrado"
            description="Quando alguém entrar com Google, o cadastro aparecerá aqui para aprovação."
          />
        )}
        {members.data && members.data.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="divide-y divide-border">
              {members.data.map((member) => (
                <MemberRow
                  key={member.profile.id}
                  member={member}
                  onRoleChange={(role) => updateRole(member, role)}
                  onStatusChange={(status) => updateStatus(member, status)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function MemberRow({
  member,
  onStatusChange,
  onRoleChange,
}: {
  member: AccountMember;
  onStatusChange: (status: "aprovado" | "rejeitado") => Promise<void>;
  onRoleChange: (role: AppRole) => Promise<void>;
}) {
  const { profile, roles } = member;
  const icon =
    profile.status === "aprovado" ? (
      <Check className="size-3.5" />
    ) : profile.status === "rejeitado" ? (
      <X className="size-3.5" />
    ) : (
      <Clock3 className="size-3.5" />
    );
  return (
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <UserRound className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{profile.full_name ?? "Sem nome"}</p>
          <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Badge variant="outline" className="gap-1">
          {icon}
          {STATUS_LABEL[profile.status]}
        </Badge>
        <label className="flex items-center gap-1 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          <select
            aria-label={`Função de ${profile.full_name ?? profile.email}`}
            value={roles[0] ?? "consulta"}
            onChange={(event) => onRoleChange(event.target.value as AppRole)}
            className="h-9 rounded-md border border-input bg-background px-2 text-xs"
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABEL[role]}
              </option>
            ))}
          </select>
        </label>
        {profile.status === "pendente" && (
          <>
            <Button size="sm" className="gap-1" onClick={() => onStatusChange("aprovado")}>
              <Check className="size-3.5" /> Aprovar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => onStatusChange("rejeitado")}
            >
              <X className="size-3.5" /> Rejeitar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
