import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, TimerReset } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PaymentsListView } from "@/features/payments/components/payments-list";
import {
  expireStalePaymentsAdminFn,
  reconcileOpenPaymentsAdminFn,
} from "@/lib/payments/payment-admin.server";
import { usePermissions } from "@/hooks/use-permissions";

export const Route = createFileRoute("/_authenticated/admin/pagamentos")({
  head: () => ({
    meta: [
      { title: "Pagamentos — Admin — RaffleHub" },
      { name: "description", content: "Gestao de gateways e pagamentos da plataforma." },
    ],
  }),
  component: AdminPagamentosPage,
});

function AdminPagamentosPage() {
  return (
    <PermissionGuard permission="payments.view">
      <AdminPagamentosContent />
    </PermissionGuard>
  );
}

function AdminPagamentosContent() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const canManage = can("payments.manage");

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
  };

  const reconcileBatch = useMutation({
    mutationFn: () => reconcileOpenPaymentsAdminFn({ data: { limit: 50 } }),
    onSuccess: async (result) => {
      const changed = result.results.filter(
        (r) => r.outcome !== "UNCHANGED" && r.outcome !== "SKIPPED",
      ).length;
      toast.success(`Conciliados ${result.scanned} · ${changed} atualizados`);
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const expireBatch = useMutation({
    mutationFn: () => expireStalePaymentsAdminFn({ data: { limit: 100 } }),
    onSuccess: async (result) => {
      toast.success(`${result.expired} pagamento(s) expirados`);
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pagamentos</h1>
          <p className="text-sm text-muted-foreground">
            Gestao de gateways e pagamentos da plataforma.
          </p>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => expireBatch.mutate()}
              disabled={expireBatch.isPending}
            >
              {expireBatch.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <TimerReset className="size-4" />
              )}
              Expirar vencidos
            </Button>
            <Button
              size="sm"
              onClick={() => reconcileBatch.mutate()}
              disabled={reconcileBatch.isPending}
            >
              {reconcileBatch.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Conciliar abertos
            </Button>
          </div>
        ) : null}
      </div>

      <PaymentsListView showMetrics />
    </div>
  );
}
