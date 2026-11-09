import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, XCircle, DollarSign, TrendingUp } from "lucide-react";
import { formatMoney } from "@/services/types";
import type { CampaignPaymentMetrics } from "@/services/types";

interface PaymentMetricsCardsProps {
  metrics: CampaignPaymentMetrics;
  currency?: string;
}

export function PaymentMetricsCards({ metrics, currency = "BRL" }: PaymentMetricsCardsProps) {
  const cards = [
    {
      label: "Receita confirmada",
      value: formatMoney(metrics.total_revenue, currency),
      icon: DollarSign,
      color: "text-emerald-600",
    },
    {
      label: "Pagamentos confirmados",
      value: metrics.confirmed_count.toLocaleString("pt-BR"),
      icon: CheckCircle,
      color: "text-emerald-600",
    },
    {
      label: "Pendentes",
      value: metrics.pending_count.toLocaleString("pt-BR"),
      icon: Clock,
      color: "text-amber-600",
    },
    {
      label: "Falhas / Cancelados",
      value: (metrics.failed_count + metrics.cancelled_count).toLocaleString("pt-BR"),
      icon: XCircle,
      color: "text-destructive",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className={`rounded-lg bg-muted p-2 ${card.color}`}>
              <card.icon className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="font-display text-lg font-bold">{card.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
