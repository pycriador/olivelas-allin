import { createFileRoute } from "@tanstack/react-router";
import {
  DollarSign,
  Megaphone,
  Receipt,
  TrendingUp,
  UserCheck,
  Users,
  MessageCircle,
  ShoppingCart,
  Ticket,
  AlertCircle,
} from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useUserCounts } from "@/hooks/use-users";
import { useReservationMetrics } from "@/hooks/use-reservations";
import { useOrderMetrics } from "@/features/orders/hooks/use-orders";
import { useCampaignMetrics } from "@/features/campaigns/hooks/use-campaigns";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — RaffleHub" },
      { name: "description", content: "Visao da plataforma RaffleHub." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { profile, user, isGlobalAdmin, role } = useAuth();
  const isAdmin = isGlobalAdmin || role === "ADMIN";
  const createdBy = isAdmin ? undefined : (user?.id ?? undefined);

  const counts = useUserCounts();
  const orders = useOrderMetrics(createdBy).data;
  const campaigns = useCampaignMetrics(createdBy).data;
  const reservations = useReservationMetrics(createdBy).data;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Ola, ${profile?.name?.split(" ")[0] ?? "bem-vindo"}`}
        description={isAdmin ? "Visao executiva da plataforma." : "Visao das suas campanhas."}
        actions={<Badge variant="secondary">Tempo real</Badge>}
      />

      {/* KPIs principais */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Receita total"
          value={formatCurrency(orders?.revenue ?? 0)}
          icon={DollarSign}
          hint={`${orders?.paid ?? 0} pedidos pagos`}
        />
        <StatCard
          title="Campanhas"
          value={String(campaigns?.total ?? 0)}
          icon={Megaphone}
          hint={`${campaigns?.active ?? 0} ativas`}
        />
        {isAdmin ? (
          <StatCard
            title="Usuarios"
            value={String(counts.data?.active ?? 0)}
            icon={Users}
            hint={`${counts.data?.disabled ?? 0} desativados`}
          />
        ) : (
          <StatCard
            title="Rascunhos"
            value={String(campaigns?.drafts ?? 0)}
            icon={Megaphone}
            hint="campanhas em rascunho"
          />
        )}
        <StatCard
          title="Ticket medio"
          value={formatCurrency(orders?.averageTicket ?? 0)}
          icon={TrendingUp}
          hint="por pedido pago"
        />
      </section>

      {/* Vendas */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Vendas</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total pedidos"
            value={String(orders?.totalOrders ?? 0)}
            icon={Receipt}
            hint={`${orders?.open ?? 0} abertos`}
          />
          <StatCard
            title="Online"
            value={String(orders?.onlineOrders ?? orders?.whatsappOrders ?? 0)}
            icon={ShoppingCart}
            hint="via checkout"
          />
          <StatCard
            title="Manuais"
            value={String(orders?.manualOrders ?? 0)}
            icon={UserCheck}
            hint="venda direta"
          />
          <StatCard
            title="WhatsApp"
            value={String(orders?.whatsappOrders ?? 0)}
            icon={MessageCircle}
            hint="solicitacoes"
          />
        </div>
      </section>

      {/* Financeiro */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Financeiro</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Recebido"
            value={formatCurrency(orders?.revenue ?? 0)}
            icon={DollarSign}
          />
          <StatCard
            title="Pendente"
            value={String(orders?.waitingPayment ?? 0)}
            icon={AlertCircle}
            hint="aguardando pgto"
          />
          <StatCard title="Cancelado" value={String(orders?.cancelled ?? 0)} icon={AlertCircle} />
          <StatCard title="Expirado" value={String(orders?.expired ?? 0)} icon={AlertCircle} />
        </div>
      </section>

      {/* Numeros e reservas */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Numeros e Reservas</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Vendidos" value={String(orders?.numbersSold ?? 0)} icon={Ticket} />
          <StatCard
            title="Reservados"
            value={String(reservations?.reservedNumbers ?? 0)}
            icon={AlertCircle}
          />
          <StatCard
            title="Expirados"
            value={String(reservations?.expiredReservations ?? 0)}
            icon={AlertCircle}
          />
          <StatCard
            title="Clientes"
            value={String(orders?.customerCount ?? 0)}
            icon={Users}
            hint={`${orders?.recurringCustomers ?? 0} recorrentes`}
          />
        </div>
      </section>

      {/* Campanhas top */}
      {orders?.byCampaign?.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Top Campanhas por Receita</h2>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                {orders.byCampaign.map((c, i) => (
                  <div
                    key={c.campaign_id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{c.campaign_title}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.orders} pedidos · {c.paid} pagos
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold tabular-nums">{formatCurrency(c.revenue)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
