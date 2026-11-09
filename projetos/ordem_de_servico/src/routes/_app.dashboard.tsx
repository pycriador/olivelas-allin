import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2, Database as DatabaseIcon, HardDrive, Layers, User as UserIcon,
  Tag, Plus, Wrench, Users, Server, ShieldCheck, ArrowUpRight, Activity,
  CheckCircle2, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { companyService } from "@/modules/company/service";
import { databaseService } from "@/modules/database/service";
import { serviceOrderService } from "@/modules/service-orders/service";
import { customerService } from "@/modules/customers/service";
import { deviceService } from "@/modules/devices/service";
import { getStorage } from "@/core/providers/storage";
import { APP_VERSION, MODULES } from "@/core/constants";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { CONNECTION_TYPE_LABELS } from "@/modules/database/types";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ServiceForge" },
      { name: "description", content: "Visão geral da plataforma ServiceForge." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, currentCompany } = useAuth();
  const { t } = useTranslation();

  const { data: company } = useQuery({ queryKey: ["company", "active"], queryFn: () => companyService.getActive() });
  const { data: conn } = useQuery({ queryKey: ["db", "active"], queryFn: () => databaseService.getActive() });
  const { data: orders = [] } = useQuery({ queryKey: ["service-orders"], queryFn: () => serviceOrderService.list() });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: () => customerService.list() });
  const { data: devices = [] } = useQuery({ queryKey: ["devices"], queryFn: () => deviceService.list() });

  const activeOrders = orders.filter((o) => !["Entregue", "Cancelada"].includes(o.status));
  const completedOrders = orders.filter((o) => o.status === "Entregue");

  const statCards = [
    {
      title: "Ordens de Serviço Ativas",
      value: String(activeOrders.length),
      sub: `${orders.length} total registradas`,
      icon: Wrench,
      color: "text-primary",
      bg: "bg-primary/10",
      link: "/service-orders",
    },
    {
      title: "Clientes Cadastrados",
      value: String(customers.length),
      sub: "Base de atendimento ativa",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      link: "/service-orders/customers/list",
    },
    {
      title: "Equipamentos & Ativos",
      value: String(devices.length),
      sub: "Aparelhos vinculados",
      icon: Server,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      link: "/service-orders/assets/equipment",
    },
    {
      title: "Banco Supabase / PG",
      value: "Conectado",
      sub: conn ? `${conn.name} (${CONNECTION_TYPE_LABELS[conn.type]})` : "PostgreSQL 17 Pooler",
      icon: DatabaseIcon,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      link: "/database",
    },
  ];

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      {/* Top Banner (Olivelas Style) */}
      <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-primary text-primary-foreground text-xs font-semibold">
              {currentCompany?.name ?? "ServiceForge Matriz"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {currentCompany?.role?.replace("_", " ") ?? "ADMIN"}
            </Badge>
            <Badge variant="outline" className="text-xs font-mono">
              v{APP_VERSION}
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-2 text-foreground truncate">
            Painel de Controle Operacional
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
            Bem-vindo, {user?.name || "Administrador"}. Gestão integrada de Ordens de Serviço, Clientes e Ativos.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button asChild size="sm" className="gap-1.5 shadow-xs">
            <Link to="/service-orders/new">
              <Plus className="h-4 w-4" /> Nova OS
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/service-orders/customers/list">
              <Users className="h-4 w-4" /> Clientes
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-600/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
            <Link to="/system-tests">
              <ShieldCheck className="h-4 w-4" /> Evidências E2E
            </Link>
          </Button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 min-w-0">
        {statCards.map((it) => (
          <Link key={it.title} to={it.link} className="block group">
            <Card className="hover:border-primary/50 transition-all hover:shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                  {it.title}
                </CardTitle>
                <div className={`p-2 rounded-xl ${it.bg} ${it.color} shrink-0`}>
                  <it.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                  {it.value}
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
                  <span>{it.sub}</span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Orders Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 min-w-0">
        <Card className="lg:col-span-2 min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-5 border-b">
            <div>
              <CardTitle className="text-base font-semibold">Ordens de Serviço Recentes</CardTitle>
              <CardDescription className="text-xs">Últimos atendimentos abertos e em andamento</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs gap-1">
              <Link to="/service-orders">
                Ver Todas <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {orders.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhuma ordem de serviço cadastrada ainda.
              </div>
            ) : (
              <div className="overflow-x-auto min-w-0 w-full custom-scrollbar">
                <table className="w-full text-sm min-w-[550px]">
                  <thead>
                    <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30">
                      <th className="p-3">Nº OS</th>
                      <th className="p-3">Cliente</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Data</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {orders.slice(0, 5).map((so) => (
                      <tr key={so.id} className="hover:bg-muted/40 transition-colors">
                        <td className="p-3 font-semibold text-primary">
                          <Link to="/service-orders/$id" params={{ id: so.id }} className="hover:underline">
                            {so.number}
                          </Link>
                        </td>
                        <td className="p-3 font-medium text-foreground">{so.customerName}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs">
                            {so.statusLabel}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">{so.entryDate}</td>
                        <td className="p-3 text-right">
                          <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                            <Link to="/service-orders/$id" params={{ id: so.id }}>
                              Abrir
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System & Architecture Info Card */}
        <Card className="min-w-0">
          <CardHeader className="p-4 sm:p-5 border-b">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              Status da Arquitetura
            </CardTitle>
            <CardDescription className="text-xs">Módulos e ambiente integrado</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between text-xs py-1 border-b border-border/50">
              <span className="text-muted-foreground">Módulos Carregados</span>
              <span className="font-semibold text-foreground">{MODULES.length} ativos</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-border/50">
              <span className="text-muted-foreground">Provedor Storage</span>
              <span className="font-semibold text-foreground">{getStorage().name}</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-border/50">
              <span className="text-muted-foreground">Segurança RLS</span>
              <Badge className="bg-emerald-600 text-white text-[10px]">Ativa (security_invoker)</Badge>
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-border/50">
              <span className="text-muted-foreground">Sessão Atual</span>
              <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[140px]">{user?.email}</span>
            </div>

            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="w-full text-xs gap-1.5">
                <Link to="/how-it-works">
                  Manual Completo da Aplicação <ArrowUpRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
