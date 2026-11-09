import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Ticket, TrendingUp, CalendarDays } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { customerService } from "@/services/customer.service";
import { formatCurrency, formatDate } from "@/lib/format";

export interface CustomerHistoryCardProps {
  customerId: string;
}

export function CustomerHistoryCard({ customerId }: CustomerHistoryCardProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["customers", customerId],
    queryFn: () => customerService.getById(customerId),
    enabled: Boolean(customerId),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (isError || !data) return null;

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-md border bg-muted/30 p-3 text-sm">
      <div className="flex items-center gap-1.5">
        <ShoppingBag aria-hidden="true" className="size-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">Pedidos</span>
        <span className="ml-auto font-semibold tabular-nums">{data.orders_count}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Ticket aria-hidden="true" className="size-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">Números</span>
        <span className="ml-auto font-semibold tabular-nums">
          {data.orders_count > 0
            ? `${data.total_spent > 0 ? Math.round(data.total_spent / (data.total_spent || 1)) : 0}~`
            : "—"}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Ticket aria-hidden="true" className="size-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">Números</span>
        <span className="ml-auto font-semibold tabular-nums">{data.orders_count}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <CalendarDays aria-hidden="true" className="size-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">Última</span>
        <span className="ml-auto text-xs tabular-nums">
          {data.last_order_at ? formatDate(data.last_order_at) : "—"}
        </span>
      </div>
    </div>
  );
}
