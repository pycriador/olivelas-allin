import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, UserCheck, UserX, UserPlus, Share2, ShieldCheck, Wrench, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { customerService } from "@/modules/customers/service";
import type { Customer } from "@/modules/customers/types";
import { useMemo } from "react";

export const Route = createFileRoute("/_app/service-orders/customers/")({
  head: () => ({ meta: [{ title: "Dashboard Clientes — ServiceForge" }] }),
  component: CustomersDashboardPage,
});

function CustomersDashboardPage() {
  const { t } = useTranslation();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["customers", "stats"],
    queryFn: () => customerService.getStats(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => customerService.list(),
  });

  const recentCreated = useMemo(() =>
    [...customers].sort((a, b) => new Date(b.createdAt ?? "").getTime() - new Date(a.createdAt ?? "").getTime()).slice(0, 5),
  [customers]);

  const recentUpdated = useMemo(() =>
    [...customers].sort((a, b) => new Date(b.updatedAt ?? "").getTime() - new Date(a.updatedAt ?? "").getTime()).slice(0, 5),
  [customers]);

  const cards = useMemo(() => [
    { label: "Total de Clientes", value: stats?.total ?? customers.length, icon: Users, color: "text-blue-500" },
    { label: "Clientes Ativos", value: stats?.active ?? customers.filter((c) => c.status === "active").length, icon: UserCheck, color: "text-green-500" },
    { label: "Clientes Inativos", value: stats?.inactive ?? customers.filter((c) => c.status === "inactive").length, icon: UserX, color: "text-red-500" },
    { label: "Clientes Novos (este mês)", value: stats?.newThisMonth ?? customers.filter((c) => c.createdAt && new Date(c.createdAt) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).length, icon: UserPlus, color: "text-purple-500" },
    { label: "Clientes Compartilhados", value: stats?.shared ?? customers.filter((c) => (c.linkedCompanyIds?.length ?? 0) > 0).length, icon: Share2, color: "text-amber-500" },
    { label: "Clientes com Garantia", value: stats?.withWarranty ?? customers.filter((c) => (c.warranties?.length ?? 0) > 0).length, icon: ShieldCheck, color: "text-teal-500" },
    { label: "Clientes com OS em Aberto", value: stats?.withOpenOS ?? customers.filter((c) => (c.serviceOrders?.filter((so) => so.status !== "Entregue" && so.status !== "Cancelada")?.length ?? 0) > 0).length, icon: Wrench, color: "text-orange-500" },
  ], [stats, customers]);

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard de Clientes</h1>
          <p className="text-sm text-muted-foreground">Visão geral dos clientes cadastrados</p>
        </div>
        <Link to="/service-orders/customers/list" search={{ action: "new" } as any}>
          <Button><Plus className="mr-2 h-4 w-4" />Novo Cliente</Button>
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Últimos Cadastros</CardTitle></CardHeader>
          <CardContent>
            {recentCreated.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado</p>
            ) : (
              <div className="space-y-3">
                {recentCreated.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">{c.createdAt ? new Date(c.createdAt).toLocaleDateString("pt-BR") : "-"}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Últimas Alterações</CardTitle></CardHeader>
          <CardContent>
            {recentUpdated.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma alteração recente</p>
            ) : (
              <div className="space-y-3">
                {recentUpdated.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">{c.updatedAt ? new Date(c.updatedAt).toLocaleDateString("pt-BR") : "-"}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
