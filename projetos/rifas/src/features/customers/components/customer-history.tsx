import { ShoppingBag } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useOrders } from "@/features/orders/hooks/use-orders";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { OrderSourceBadge } from "@/features/orders/components/order-source-badge";
import { formatCurrency, formatDate } from "@/lib/format";

export interface CustomerHistoryProps {
  customerId: string;
}

export function CustomerHistory({ customerId }: CustomerHistoryProps) {
  const { data, isLoading, isError } = useOrders({
    page: 1,
    pageSize: 10,
    filters: { customerId },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-destructive">Não foi possível carregar os pedidos.</p>;
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Nenhum pedido"
        description="Este cliente ainda não possui pedidos."
      />
    );
  }

  return (
    <ul className="divide-y rounded-md border">
      {items.map((order) => (
        <li key={order.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{order.campaign?.title ?? "Campanha"}</p>
            <p className="text-xs text-muted-foreground">
              {order.items.length} número{order.items.length === 1 ? "" : "s"} ·{" "}
              {formatDate(order.created_at)}
            </p>
          </div>
          <OrderSourceBadge source={order.source} />
          {order.payment_method ? <Badge variant="outline">{order.payment_method}</Badge> : null}
          <OrderStatusBadge status={order.status} />
          <span className="w-20 text-right text-sm font-semibold tabular-nums">
            {formatCurrency(order.total)}
          </span>
        </li>
      ))}
    </ul>
  );
}
