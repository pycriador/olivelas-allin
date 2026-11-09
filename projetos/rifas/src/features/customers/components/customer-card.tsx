import { Mail, MapPin, Phone } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { Customer, CustomerWithStats } from "@/types/customer";
import { formatCurrency, formatDate } from "@/lib/format";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export interface CustomerCardProps {
  customer: Customer | CustomerWithStats;
}

export function CustomerCard({ customer }: CustomerCardProps) {
  const stats = "orders_count" in customer ? customer : null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Avatar className="size-11">
            <AvatarFallback>{initials(customer.full_name) || "?"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{customer.full_name}</p>
            {customer.phone ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone aria-hidden="true" className="size-3.5" />
                <span className="truncate">{customer.phone}</span>
              </p>
            ) : null}
            {customer.email ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail aria-hidden="true" className="size-3.5" />
                <span className="truncate">{customer.email}</span>
              </p>
            ) : null}
            {customer.city ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin aria-hidden="true" className="size-3.5" />
                <span className="truncate">{customer.city}</span>
              </p>
            ) : null}
          </div>
        </div>

        {stats ? (
          <>
            <Separator className="my-4" />
            <dl className="grid grid-cols-3 gap-2 text-center">
              <div>
                <dt className="text-xs text-muted-foreground">Pedidos</dt>
                <dd className="text-sm font-semibold tabular-nums">{stats.orders_count}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Total pago</dt>
                <dd className="text-sm font-semibold tabular-nums">
                  {formatCurrency(stats.total_spent)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Última compra</dt>
                <dd className="text-sm font-medium tabular-nums">
                  {stats.last_order_at ? formatDate(stats.last_order_at) : "—"}
                </dd>
              </div>
            </dl>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
