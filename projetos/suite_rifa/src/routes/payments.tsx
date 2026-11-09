import { createFileRoute } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { useCampaignList } from "@/hooks/useCampaigns";
import { usePayments, usePaymentMetrics } from "@/hooks/usePayments";
import { useRealtimePayments } from "@/hooks/useRealtimePayments";
import { PaymentMetricsCards } from "@/components/payments/PaymentMetricsCards";
import { PaymentHistoryTable } from "@/components/payments/PaymentHistoryTable";
import { GatewayConfigForm } from "@/components/payments/GatewayConfigForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/payments")({
  head: () => ({
    meta: [
      { title: "Pagamentos — RaffleHub" },
      { name: "description", content: "Histórico de pagamentos e configuração de gateways." },
    ],
  }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const { data: campaignsData } = useCampaignList({ limit: 1 });

  const firstCampaignId = campaignsData?.rows?.[0]?.id;

  return (
    <AppShell title="Pagamentos" actions={<CreditCard className="size-5 text-muted-foreground" />}>
      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="gateways">Gateways</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-4 space-y-4">
          {firstCampaignId ? (
            <PaymentsOverview campaignId={firstCampaignId} />
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-12 text-center">
              <p className="font-medium">Nenhuma campanha encontrada</p>
              <p className="text-sm text-muted-foreground">Crie uma campanha para ver pagamentos.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="gateways" className="mt-4">
          <GatewayConfigForm />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function PaymentsOverview({ campaignId }: { campaignId: string }) {
  const { data: metrics } = usePaymentMetrics(campaignId);
  const { data: paymentsData } = usePayments(campaignId, { limit: 50 });

  useRealtimePayments(campaignId);

  return (
    <div className="space-y-4">
      {metrics && <PaymentMetricsCards metrics={metrics} />}
      {paymentsData && paymentsData.items.length > 0 ? (
        <PaymentHistoryTable payments={paymentsData.items} />
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-12 text-center">
          <p className="font-medium">Nenhum pagamento registrado</p>
          <p className="text-sm text-muted-foreground">
            Pagamentos aparecem aqui quando participantes finalizam o checkout.
          </p>
        </div>
      )}
    </div>
  );
}
