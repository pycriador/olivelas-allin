import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, PlugZap, Save, Star } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LoadingState } from "@/components/common/loading-state";
import { ErrorState } from "@/components/common/status-states";
import {
  listGatewaySettingsAdmin,
  saveGatewaySettingsAdmin,
  setDefaultPaymentGatewayAdmin,
  testGatewayConnectionAdmin,
} from "@/lib/payments/gateway-admin.server";
import {
  GATEWAY_CREDENTIAL_FIELDS,
  PAYMENT_ENVIRONMENT_LABELS,
  PAYMENT_GATEWAY_LABELS,
  type GatewaySettingsView,
  type PaymentEnvironment,
  type PaymentGateway,
} from "@/types/payment";

type Draft = {
  enabled: boolean;
  environment: PaymentEnvironment;
  pixEnabled: boolean;
  credentials: Record<string, string>;
};

function emptyDraft(view?: GatewaySettingsView | null): Draft {
  return {
    enabled: view?.enabled ?? false,
    environment: view?.environment ?? "SANDBOX",
    pixEnabled: view?.pixEnabled ?? true,
    credentials: {},
  };
}

export function GatewayConfigPanel({
  gateway,
  readOnly = false,
}: {
  gateway: PaymentGateway;
  readOnly?: boolean;
}) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "payment-gateways"],
    queryFn: () => listGatewaySettingsAdmin(),
  });

  const [draft, setDraft] = useState<Draft>(emptyDraft());

  const view = useMemo(
    () => query.data?.gateways.find((item) => item.gateway === gateway) ?? null,
    [query.data, gateway],
  );

  useEffect(() => {
    setDraft(emptyDraft(view));
  }, [view?.gateway, view?.enabled, view?.environment, view?.pixEnabled]);

  const saveMutation = useMutation({
    mutationFn: () =>
      saveGatewaySettingsAdmin({
        data: {
          gateway,
          enabled: draft.enabled,
          environment: draft.environment,
          pixEnabled: draft.pixEnabled,
          credentials: draft.credentials,
        },
      }),
    onSuccess: async () => {
      toast.success("Gateway salvo");
      await queryClient.invalidateQueries({ queryKey: ["admin", "payment-gateways"] });
      setDraft((prev) => ({ ...prev, credentials: {} }));
    },
    onError: (error: Error) => toast.error("Falha ao salvar", { description: error.message }),
  });

  const testMutation = useMutation({
    mutationFn: () => testGatewayConnectionAdmin({ data: { gateway } }),
    onSuccess: async (result) => {
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      await queryClient.invalidateQueries({ queryKey: ["admin", "payment-gateways"] });
    },
    onError: (error: Error) => toast.error("Falha no teste", { description: error.message }),
  });

  const defaultMutation = useMutation({
    mutationFn: () => setDefaultPaymentGatewayAdmin({ data: { gateway } }),
    onSuccess: async () => {
      toast.success("Gateway padrao atualizado");
      await queryClient.invalidateQueries({ queryKey: ["admin", "payment-gateways"] });
    },
    onError: (error: Error) =>
      toast.error("Falha ao definir padrao", { description: error.message }),
  });

  if (query.isPending) return <LoadingState label="Carregando gateway..." />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;

  const isDefault = query.data?.defaultGateway === gateway;
  const fields = GATEWAY_CREDENTIAL_FIELDS[gateway];
  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${query.data?.webhookBasePath ?? "/api/public/payments/webhook"}/${gateway.toLowerCase()}`
      : `${query.data?.webhookBasePath ?? "/api/public/payments/webhook"}/${gateway.toLowerCase()}`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                {PAYMENT_GATEWAY_LABELS[gateway]}
                {isDefault ? (
                  <Badge variant="secondary" className="gap-1">
                    <Star className="size-3" />
                    Padrao
                  </Badge>
                ) : null}
              </CardTitle>
              <CardDescription>
                Credenciais ficam apenas no servidor. Secrets nunca sao reexibidos apos salvar.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={view?.enabled ? "default" : "secondary"}>
                {view?.enabled ? "Habilitado" : "Desabilitado"}
              </Badge>
              <Badge variant="outline">
                {PAYMENT_ENVIRONMENT_LABELS[view?.environment ?? "SANDBOX"]}
              </Badge>
              {view?.lastTestOk === true ? (
                <Badge variant="outline" className="gap-1 text-emerald-600">
                  <Check className="size-3" />
                  Teste OK
                </Badge>
              ) : view?.lastTestOk === false ? (
                <Badge variant="destructive">Teste falhou</Badge>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="gw-enabled">Habilitado</Label>
              <Switch
                id="gw-enabled"
                checked={draft.enabled}
                disabled={readOnly || saveMutation.isPending}
                onCheckedChange={(checked) => setDraft((d) => ({ ...d, enabled: checked }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="gw-pix">PIX</Label>
              <Switch
                id="gw-pix"
                checked={draft.pixEnabled}
                disabled={readOnly || saveMutation.isPending}
                onCheckedChange={(checked) => setDraft((d) => ({ ...d, pixEnabled: checked }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Ambiente</Label>
              <Select
                value={draft.environment}
                disabled={readOnly || saveMutation.isPending}
                onValueChange={(value) =>
                  setDraft((d) => ({ ...d, environment: value as PaymentEnvironment }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SANDBOX">{PAYMENT_ENVIRONMENT_LABELS.SANDBOX}</SelectItem>
                  <SelectItem value="PRODUCTION">
                    {PAYMENT_ENVIRONMENT_LABELS.PRODUCTION}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => {
              const filled = view?.filledCredentials.includes(field.key);
              return (
                <div key={field.key} className="grid gap-2">
                  <Label htmlFor={`cred-${field.key}`}>
                    {field.label}
                    {field.required ? " *" : ""}
                    {field.secret && filled ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (salvo — deixe vazio para manter)
                      </span>
                    ) : null}
                  </Label>
                  <Input
                    id={`cred-${field.key}`}
                    type={field.secret ? "password" : "text"}
                    autoComplete="off"
                    disabled={readOnly || saveMutation.isPending}
                    placeholder={
                      field.secret && filled ? "••••••••" : (field.placeholder ?? field.label)
                    }
                    value={draft.credentials[field.key] ?? ""}
                    onChange={(event) =>
                      setDraft((d) => ({
                        ...d,
                        credentials: { ...d.credentials, [field.key]: event.target.value },
                      }))
                    }
                  />
                </div>
              );
            })}
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">URL do webhook</p>
            <p className="mt-1 break-all font-mono">{webhookUrl}</p>
            <p className="mt-2">
              Configure esta URL no painel do provedor. A assinatura e validada quando o webhook
              secret estiver preenchido.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={readOnly || saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Salvar gateway
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => testMutation.mutate()}
              disabled={readOnly || testMutation.isPending}
            >
              {testMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <PlugZap className="size-4" />
              )}
              Testar conexao
            </Button>
            {!readOnly && !isDefault ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => defaultMutation.mutate()}
                disabled={defaultMutation.isPending}
              >
                {defaultMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Star className="size-4" />
                )}
                Tornar padrao
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
