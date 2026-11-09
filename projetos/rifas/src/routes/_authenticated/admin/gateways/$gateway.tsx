import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/common/empty-state";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { gatewayPermission } from "@/lib/permissions";
import { GatewayConfigPanel } from "@/features/payments/components/gateway-config-panel";
import { PaymentsListView } from "@/features/payments/components/payments-list";
import { usePermissions } from "@/hooks/use-permissions";
import {
  PAYMENT_GATEWAY_LABELS,
  PAYMENT_GATEWAY_VALUES,
  type PaymentGateway,
} from "@/types/payment";

export const Route = createFileRoute("/_authenticated/admin/gateways/$gateway")({
  head: () => ({ meta: [{ title: "Gateway — Admin — RaffleHub" }] }),
  component: AdminGatewayPage,
});

function AdminGatewayPage() {
  const { gateway: rawGateway } = Route.useParams();
  const gateway = rawGateway.toUpperCase() as PaymentGateway;

  if (!PAYMENT_GATEWAY_VALUES.includes(gateway)) {
    return (
      <EmptyState
        title="Gateway nao encontrado"
        description={`Nenhum gateway cadastrado com o identificador "${rawGateway}".`}
      />
    );
  }

  return (
    <PermissionGuard
      anyOf={[gatewayPermission(gateway, "view"), gatewayPermission(gateway, "manage")]}
    >
      <GatewayContent gateway={gateway} />
    </PermissionGuard>
  );
}

function GatewayContent({ gateway }: { gateway: PaymentGateway }) {
  const { can } = usePermissions();
  const [tab, setTab] = useState("config");
  const canManage = can(gatewayPermission(gateway, "manage")) || can("payments.manage");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Voltar para Pagamentos">
            <Link to="/admin/pagamentos">
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-muted-foreground" aria-hidden="true" />
            <h1 className="text-2xl font-bold tracking-tight">{PAYMENT_GATEWAY_LABELS[gateway]}</h1>
          </div>
          <Badge variant="outline" className="font-mono text-[10px]">
            {gateway}
          </Badge>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="config">Configuracao</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
        </TabsList>
        <TabsContent value="config" className="mt-4">
          {canManage ? (
            <GatewayConfigPanel gateway={gateway} />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Voce nao tem permissao para editar a configuracao deste gateway.
              </p>
              <GatewayConfigPanel gateway={gateway} readOnly />
            </div>
          )}
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          <PaymentsListView gateway={gateway} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
