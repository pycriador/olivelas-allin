import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateGateway, useDeleteGateway, usePaymentGateways, useUpdateGateway } from "@/hooks/usePaymentGateways";
import { PAYMENT_GATEWAY_PROVIDER_LABEL } from "@/services/types";
import type { PaymentGatewayProvider } from "@/services/types";
import { Trash2 } from "lucide-react";

export function GatewayConfigForm() {
  const { data: gatewaysData } = usePaymentGateways();
  const createGateway = useCreateGateway();
  const updateGateway = useUpdateGateway();
  const deleteGateway = useDeleteGateway();

  const [label, setLabel] = useState("");
  const [provider, setProvider] = useState<PaymentGatewayProvider>("INFINITY_PAY");
  const [enabled, setEnabled] = useState(true);

  const gateways = gatewaysData?.items ?? [];

  const handleCreate = () => {
    if (!label.trim()) return;
    createGateway.mutate(
      { provider, label: label.trim(), enabled },
      { onSuccess: () => { setLabel(""); setEnabled(true); } },
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-display text-lg font-semibold">Gateways de Pagamento</h3>
        <p className="text-sm text-muted-foreground">
          Configure os provedores de pagamento para esta organização.
        </p>
      </div>

      {/* Existing Gateways */}
      {gateways.length > 0 && (
        <div className="space-y-3">
          {gateways.map((gw) => (
            <Card key={gw.id}>
              <CardContent className="flex items-center justify-between pt-6">
                <div className="space-y-1">
                  <p className="font-medium">{gw.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {PAYMENT_GATEWAY_PROVIDER_LABEL[gw.provider]} — {gw.enabled ? "Ativo" : "Inativo"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={gw.enabled}
                    onCheckedChange={(v) => updateGateway.mutate({ gatewayId: gw.id, data: { enabled: v } })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm("Remover este gateway?")) deleteGateway.mutate(gw.id);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create New Gateway */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Adicionar gateway</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Provedor</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as PaymentGatewayProvider)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PAYMENT_GATEWAY_PROVIDER_LABEL) as PaymentGatewayProvider[]).map((p) => (
                  <SelectItem key={p} value={p}>{PAYMENT_GATEWAY_PROVIDER_LABEL[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nome / Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: InfinityPay Principal"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            <Label>Ativo</Label>
          </div>
          <Button onClick={handleCreate} disabled={!label.trim() || createGateway.isPending}>
            {createGateway.isPending ? "Criando…" : "Adicionar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
