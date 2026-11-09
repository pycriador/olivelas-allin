import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, PlugZap, Save, Shield } from "lucide-react";
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
  PAYMENT_GATEWAY_VALUES,
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

export function GatewaySettingsPanel() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "payment-gateways"],
    queryFn: () => listGatewaySettingsAdmin(),
  });

  const [selected, setSelected] = useState<PaymentGateway>("MERCADO_PAGO");
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [defaultGateway, setDefaultGateway] = useState<PaymentGateway | "NONE">("NONE");

  const views = query.data?.gateways ?? [];
  const current = useMemo(
    () => views.find((item) => item.gateway === selected) ?? null,
    [views, selected],
  );

  useEffect(() => {
    if (query.data?.defaultGateway) {
      setDefaultGateway(query.data.defaultGateway);
    } else if (query.data) {
      setDefaultGateway("NONE");
    }
  }, [query.data]);

  useEffect(() => {
    setDraft(emptyDraft(current));
  }, [current?.gateway, current?.enabled, current?.environment, current?.pixEnabled]);

  const saveMutation = useMutation({
    mutationFn: () =>
      saveGatewaySettingsAdmin({
        data: {
          gateway: selected,
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
    mutationFn: () => testGatewayConnectionAdmin({ data: { gateway: selected } }),
    onSuccess: async (result) => {
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      await queryClient.invalidateQueries({ queryKey: ["admin", "payment-gateways"] });
    },
    onError: (error: Error) => toast.error("Falha no teste", { description: error.message }),
  });

  const defaultMutation = useMutation({
    mutationFn: () =>
      setDefaultPaymentGatewayAdmin({
        data: { gateway: defaultGateway === "NONE" ? null : defaultGateway },
      }),
    onSuccess: async () => {
      toast.success("Gateway padrao atualizado");
      await queryClient.invalidateQueries({ queryKey: ["admin", "payment-gateways"] });
    },
    onError: (error: Error) =>
      toast.error("Falha ao definir padrao", { description: error.message }),
  });

  if (query.isPending) return <LoadingState label="Carregando gateways…" />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;

  const fields = GATEWAY_CREDENTIAL_FIELDS[selected];
  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${query.data?.webhookBasePath ?? "/api/public/payments/webhook"}/${selected.toLowerCase()}`
      : `${query.data?.webhookBasePath ?? "/api/public/payments/webhook"}/${selected.toLowerCase()}`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gateway padrao da plataforma</CardTitle>
          <CardDescription>
            Usado quando a campanha nao define um gateway especifico.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-0 flex-1 gap-2 sm:min-w-[220px]">
            <Label>Padrao global</Label>
            <Select
              value={defaultGateway}
              onValueChange={(value) => setDefaultGateway(value as PaymentGateway | "NONE")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Nenhum (primeiro habilitado)</SelectItem>
                {PAYMENT_GATEWAY_VALUES.map((gateway) => (
                  <SelectItem key={gateway} value={gateway}>
                    {PAYMENT_GATEWAY_LABELS[gateway]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            onClick={() => defaultMutation.mutate()}
            disabled={defaultMutation.isPending}
          >
            {defaultMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Salvar padrao
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {views.map((view) => (
          <button
            key={view.gateway}
            type="button"
            onClick={() => setSelected(view.gateway)}
            className={`rounded-xl border p-4 text-left transition ${
              selected === view.gateway ? "border-primary bg-primary/5" : "hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{PAYMENT_GATEWAY_LABELS[view.gateway]}</p>
              <Badge variant={view.enabled ? "default" : "secondary"}>
                {view.enabled ? "On" : "Off"}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {PAYMENT_ENVIRONMENT_LABELS[view.environment]}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {view.configured ? "Configurado" : "Incompleto"}
              {view.lastTestOk === true ? " · Teste OK" : ""}
              {view.lastTestOk === false ? " · Teste falhou" : ""}
            </p>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">{PAYMENT_GATEWAY_LABELS[selected]}</CardTitle>
              <CardDescription>
                Credenciais ficam apenas no servidor. Secrets nunca sao reexibidos apos salvar.
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <Shield className="size-3" />
              Admin only
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="gw-enabled">Habilitado</Label>
              <Switch
                id="gw-enabled"
                checked={draft.enabled}
                onCheckedChange={(checked) => setDraft((d) => ({ ...d, enabled: checked }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="gw-pix">PIX</Label>
              <Switch
                id="gw-pix"
                checked={draft.pixEnabled}
                onCheckedChange={(checked) => setDraft((d) => ({ ...d, pixEnabled: checked }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Ambiente</Label>
              <Select
                value={draft.environment}
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
              const filled = current?.filledCredentials.includes(field.key);
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
              disabled={saveMutation.isPending}
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
              disabled={testMutation.isPending}
            >
              {testMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <PlugZap className="size-4" />
              )}
              Testar conexao
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
