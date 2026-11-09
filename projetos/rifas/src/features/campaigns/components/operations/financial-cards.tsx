import { Clock, DollarSign, Receipt, TrendingUp, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface FinancialCardsProps {
  expectedRevenue: number;
  receivedRevenue: number;
  reservedRevenue: number;
  averageTicket: number;
  orderCount: number;
  customerCount: number;
  className?: string;
}

export function FinancialCards({
  expectedRevenue,
  receivedRevenue,
  reservedRevenue,
  averageTicket,
  orderCount,
  customerCount,
  className,
}: FinancialCardsProps) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
      <FinanceItem
        title="Receita prevista"
        value={formatCurrency(expectedRevenue)}
        description="Total se todos os números forem vendidos"
        icon={DollarSign}
      />
      <FinanceItem
        title="Receita recebida"
        value={formatCurrency(receivedRevenue)}
        description="Pedidos pagos confirmados"
        icon={TrendingUp}
      />
      <FinanceItem
        title="Valor reservado"
        value={formatCurrency(reservedRevenue)}
        description="Reservas ativas pendentes"
        icon={Clock}
      />
      <FinanceItem
        title="Ticket médio"
        value={formatCurrency(averageTicket)}
        description="Por pedido pago"
        icon={Receipt}
      />
      <FinanceItem
        title="Pedidos"
        value={String(orderCount)}
        description="Total de pedidos na campanha"
        icon={Receipt}
      />
      <FinanceItem
        title="Clientes"
        value={String(customerCount)}
        description="Compradores únicos"
        icon={Users}
      />
    </div>
  );
}

function FinanceItem({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
          <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
        </span>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
