import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowUpRight, Boxes, Package, Receipt, Users } from "lucide-react";

import { AppShell } from "@/components/platform/AppShell";
import { EmptyState } from "@/components/common/StateBlocks";
import { Button } from "@/components/ui/button";
import { useAuthSession, useCurrentMember } from "@/hooks/useAuthSession";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABEL } from "@/types/domain";

export const Route = createFileRoute("/painel")({
  ssr: false,
  beforeLoad: async () => {},
  head: () => ({ meta: [{ title: "Painel | Olivelas" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuthSession();
  const memberQuery = useCurrentMember(user?.id);

  if (loading || memberQuery.isLoading)
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Carregando seu painel...
      </div>
    );
  if (memberQuery.isError || !memberQuery.data?.profile)
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
        <p>Não foi possível carregar seu acesso. Tente novamente.</p>
      </div>
    );
  if (memberQuery.data.profile.status !== "aprovado")
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
        <div>
          <p className="font-semibold">Acesso pendente</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Seu cadastro ainda precisa ser aprovado.
          </p>
          <Link to="/auth" className="mt-4 inline-block text-sm text-primary underline">
            Ver status
          </Link>
        </div>
      </div>
    );

  const { profile, roles } = memberQuery.data;
  return (
    <AppShell
      profile={profile}
      roles={roles}
      title="Painel"
      description="Uma visão rápida da sua operação."
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-accent">
              Bom dia, {profile.full_name?.split(" ")[0] ?? "equipe"}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Vamos organizar a próxima cesta?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              A base está pronta. Seus indicadores aparecerão conforme os módulos forem preenchidos.
            </p>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/usuarios">
              Gerenciar acessos <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </section>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Produtos ativos", icon: Package, value: "--" },
            { label: "Itens em estoque", icon: Boxes, value: "--" },
            { label: "Compras no mês", icon: Receipt, value: "--" },
            { label: "Usuários", icon: Users, value: "--" },
          ].map(({ label, icon: Icon, value }) => (
            <div key={label} className="glass rounded-2xl p-5">
              <Icon className="size-5 text-muted-foreground" />
              <p className="mt-6 text-2xl font-semibold">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </section>
        <EmptyState
          title="Seu painel começa aqui"
          description="Cadastre produtos, organize o estoque e publique a primeira versão do catálogo para ativar seus indicadores."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/">Conhecer a operação</Link>
            </Button>
          }
        />
        <p className="text-xs text-muted-foreground">
          Perfil: {roles.map((role) => ROLE_LABEL[role]).join(" · ")}
        </p>
      </div>
    </AppShell>
  );
}
