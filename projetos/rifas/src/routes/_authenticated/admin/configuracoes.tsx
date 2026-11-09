import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { LoadingState } from "@/components/common/loading-state";
import { ErrorState } from "@/components/common/status-states";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/contexts/theme-context";
import { useAuth } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/use-permissions";
import { GatewaySettingsPanel } from "@/features/payments/components/gateway-settings-panel";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import {
  SETTING_CATEGORY_DESCRIPTIONS,
  SETTING_CATEGORY_LABELS,
  type Setting,
  type SettingCategory,
  type SettingValue,
} from "@/types/settings";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configuracoes — Admin — RaffleHub" },
      { name: "description", content: "Configuracoes globais da plataforma." },
    ],
  }),
  component: AdminConfiguracoesPage,
});

function valueToText(value: SettingValue): string {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null) return "";
  return String(value);
}

function SettingField({
  setting,
  value,
  disabled,
  onChange,
}: {
  setting: Setting;
  value: SettingValue;
  disabled: boolean;
  onChange: (value: SettingValue) => void;
}) {
  const id = `${setting.category}-${setting.key}`;
  const label = setting.description ?? setting.key;

  if (typeof setting.value === "boolean") {
    return (
      <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
        <Label htmlFor={id} className="text-sm font-normal">
          {label}
        </Label>
        <Switch
          id={id}
          checked={Boolean(value)}
          disabled={disabled}
          onCheckedChange={(checked) => onChange(checked)}
        />
      </div>
    );
  }

  if (typeof setting.value === "number") {
    return (
      <div className="grid gap-2">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          type="number"
          value={value === null ? "" : String(value)}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value === "" ? 0 : Number(event.target.value))}
        />
      </div>
    );
  }

  if (Array.isArray(setting.value)) {
    return (
      <div className="grid gap-2">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          value={valueToText(value)}
          disabled={disabled}
          placeholder="valor1, valor2"
          onChange={(event) =>
            onChange(
              event.target.value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
            )
          }
        />
        <p className="text-xs text-muted-foreground">Separe os valores por virgula.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={valueToText(value)}
        disabled={disabled}
        maxLength={300}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function AdminConfiguracoesPage() {
  const { theme, setTheme } = useTheme();
  const { profile } = useAuth();
  const { can } = usePermissions();
  const canEdit = can("settings.edit");

  const settingsQuery = useSettings();
  const updateSettings = useUpdateSettings();
  const [draft, setDraft] = useState<Record<string, SettingValue>>({});

  const settings = useMemo(() => settingsQuery.data ?? [], [settingsQuery.data]);

  useEffect(() => {
    setDraft(Object.fromEntries(settings.map((setting) => [setting.id, setting.value])));
  }, [settings]);

  const categories = useMemo(() => {
    const unique = [...new Set(settings.map((setting) => setting.category))];
    return unique as SettingCategory[];
  }, [settings]);

  const dirty = settings.filter(
    (setting) =>
      setting.id in draft && JSON.stringify(draft[setting.id]) !== JSON.stringify(setting.value),
  );

  const handleSave = () => {
    updateSettings.mutate(
      {
        updates: dirty.map((setting) => ({
          id: setting.id,
          key: `${setting.category}.${setting.key}`,
          value: draft[setting.id] ?? null,
        })),
        previous: Object.fromEntries(
          dirty.map((setting) => [`${setting.category}.${setting.key}`, setting.value]),
        ),
      },
      {
        onSuccess: () => toast.success("Configuracoes salvas"),
        onError: (error) => toast.error("Falha ao salvar", { description: error.message }),
      },
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuracoes</h1>
          <p className="text-sm text-muted-foreground">Configuracoes globais da plataforma.</p>
        </div>
        {canEdit ? (
          <Button onClick={handleSave} disabled={dirty.length === 0 || updateSettings.isPending}>
            {updateSettings.isPending
              ? "Salvando..."
              : `Salvar${dirty.length ? ` (${dirty.length})` : ""}`}
          </Button>
        ) : (
          <Badge variant="secondary">Somente leitura</Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aparencia</CardTitle>
          <CardDescription>Preferencias desta conta neste dispositivo.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:max-w-sm">
          <div className="grid gap-2">
            <Label htmlFor="theme-select-admin">Tema</Label>
            <Select value={theme} onValueChange={(value) => setTheme(value as "light" | "dark")}>
              <SelectTrigger id="theme-select-admin" aria-label="Selecionar tema">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="dark">Escuro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="space-y-1 text-sm">
            <p className="font-medium">{profile?.name ?? "—"}</p>
            <p className="text-muted-foreground">{profile?.email ?? "—"}</p>
          </div>
          <Button asChild variant="outline" size="sm" className="w-fit">
            <Link to="/perfil">Editar perfil</Link>
          </Button>
        </CardContent>
      </Card>

      {canEdit ? (
        <section aria-label="Pagamentos e gateways" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Gateways de Pagamento</h2>
            <p className="text-sm text-muted-foreground">
              Credenciais dos gateways PIX (MercadoPago, InfinityPay, PagBank) disponiveis para
              todas as campanhas.
            </p>
          </div>
          <GatewaySettingsPanel />
        </section>
      ) : null}

      <section aria-label="Configuracoes globais" className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Parametros globais</h2>
        {settingsQuery.isPending ? (
          <LoadingState label="Carregando configuracoes..." />
        ) : settingsQuery.isError ? (
          <ErrorState onRetry={() => void settingsQuery.refetch()} />
        ) : (
          <Tabs defaultValue={categories[0] ?? "system"}>
            <TabsList className="flex-wrap">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {SETTING_CATEGORY_LABELS[category] ?? category}
                </TabsTrigger>
              ))}
            </TabsList>
            {categories.map((category) => (
              <TabsContent key={category} value={category}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {SETTING_CATEGORY_LABELS[category] ?? category}
                    </CardTitle>
                    <CardDescription>
                      {SETTING_CATEGORY_DESCRIPTIONS[category] ?? "Parametros da plataforma."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-5 md:grid-cols-2">
                    {settings
                      .filter((setting) => setting.category === category)
                      .map((setting) => (
                        <SettingField
                          key={setting.id}
                          setting={setting}
                          value={draft[setting.id] ?? setting.value}
                          disabled={!canEdit}
                          onChange={(value) =>
                            setDraft((current) => ({ ...current, [setting.id]: value }))
                          }
                        />
                      ))}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </section>
    </div>
  );
}
