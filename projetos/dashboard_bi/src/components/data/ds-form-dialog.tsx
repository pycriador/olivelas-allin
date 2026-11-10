import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, PlugZap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { z } from "zod";
import { dataSourceInputSchema, type DataSourceInput } from "@/lib/datasources/ds-schemas";
import { ENGINE_LIST, engineSpec } from "@/lib/datasources/registry";
import { saveDataSource, testConnection } from "@/lib/datasources/datasources.functions";
import type { Database } from "@/integrations/supabase/types";

// Credential columns are never readable by the browser.
type Row = Omit<
  Database["public"]["Tables"]["data_sources"]["Row"],
  "secret_ciphertext" | "ssl_ca_certificate" | "ssl_client_certificate" | "ssl_client_key"
>;

type FormValues = z.input<typeof dataSourceInputSchema>;

const EMPTY: FormValues = {
  name: "",
  description: "",
  type: "postgresql",
  environment: "development",
  host: "",
  port: 5432,
  databaseName: "",
  defaultSchema: "public",
  username: "",
  password: "",
  sslEnabled: true,
  timeoutMs: 15000,
  tags: [],
  syncMode: "manual",
  syncFrequency: "manual",
  active: true,
};

export function DsFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: Row | null;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const save = useServerFn(saveDataSource);
  const test = useServerFn(testConnection);

  const form = useForm<FormValues, unknown, DataSourceInput>({
    resolver: zodResolver(dataSourceInputSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      editing
        ? {
            id: editing.id,
            name: editing.name,
            description: editing.description ?? "",
            type: editing.type,
            environment: editing.environment,
            host: editing.host ?? "",
            port: editing.port,
            databaseName: editing.database_name ?? "",
            defaultSchema: editing.default_schema ?? "",
            username: editing.username ?? "",
            password: "",
            sslEnabled: editing.ssl_enabled,
            timeoutMs: editing.timeout_ms,
            tags: editing.tags ?? [],
            syncMode: editing.sync_mode,
            syncFrequency: editing.sync_frequency,
            active: editing.active,
          }
        : EMPTY,
    );
  }, [open, editing, form]);

  const type = form.watch("type");
  const spec = engineSpec(type);

  const saving = useMutation({
    mutationFn: (values: DataSourceInput) => save({ data: values }),
    onSuccess: () => {
      toast.success(t("ds.toast.saved"));
      void qc.invalidateQueries({ queryKey: ["data-sources"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testing = useMutation({
    mutationFn: () => test({ data: { draft: form.getValues() } }),
    onSuccess: (r) => {
      if (r.ok) toast.success(`${r.serverVersion} · ${r.latencyMs}ms · ${r.tableCount} tabelas`);
      else toast.error(r.message);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? t("ds.form.editTitle") : t("ds.form.newTitle")}</DialogTitle>
          <DialogDescription>{t(spec.hintKey)}</DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={form.handleSubmit((v) => saving.mutate(v))}
        >
          <div className="grid gap-2">
            <Label>{t("ds.field.name")}</Label>
            <Input {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{t("errors.required")}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label>{t("ds.field.type")}</Label>
            <Select
              value={type}
              onValueChange={(v) => {
                const next = engineSpec(v as FormValues["type"]);
                form.setValue("type", next.type);
                form.setValue("port", next.defaultPort);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENGINE_LIST.map((e) => (
                  <SelectItem key={e.type} value={e.type}>
                    {e.label}
                    {e.connectable ? "" : ` · ${t("ds.catalogOnly")}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label>{t("ds.field.description")}</Label>
            <Textarea rows={2} {...form.register("description")} />
          </div>

          <div className="grid gap-2">
            <Label>{t("ds.field.environment")}</Label>
            <Select
              value={form.watch("environment")}
              onValueChange={(v) => form.setValue("environment", v as FormValues["environment"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["production", "staging", "development"] as const).map((e) => (
                  <SelectItem key={e} value={e}>
                    {t(`ds.env.${e}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>{t(spec.hostLabelKey)}</Label>
            <Input {...form.register("host")} />
          </div>

          {spec.needsPort && (
            <div className="grid gap-2">
              <Label>{t("ds.field.port")}</Label>
              <Input type="number" {...form.register("port", { valueAsNumber: true })} />
            </div>
          )}
          {spec.needsDatabase && (
            <div className="grid gap-2">
              <Label>{t("ds.field.database")}</Label>
              <Input {...form.register("databaseName")} />
            </div>
          )}
          {spec.needsSchema && (
            <div className="grid gap-2">
              <Label>{t("ds.field.schema")}</Label>
              <Input {...form.register("defaultSchema")} />
            </div>
          )}
          {spec.needsUsername && (
            <div className="grid gap-2">
              <Label>{t("ds.field.username")}</Label>
              <Input {...form.register("username")} autoComplete="off" />
            </div>
          )}
          <div className="grid gap-2">
            <Label>{t("ds.field.password")}</Label>
            <Input
              type="password"
              placeholder={editing ? t("ds.field.passwordKeep") : ""}
              autoComplete="new-password"
              {...form.register("password")}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <Label className="text-sm">{t("ds.field.ssl")}</Label>
            <Switch
              checked={form.watch("sslEnabled")}
              onCheckedChange={(v) => form.setValue("sslEnabled", v)}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label className="text-sm">{t("ds.field.active")}</Label>
            <Switch
              checked={form.watch("active")}
              onCheckedChange={(v) => form.setValue("active", v)}
            />
          </div>

          <DialogFooter className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              disabled={testing.isPending}
              onClick={() => testing.mutate()}
            >
              {testing.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlugZap className="h-4 w-4" />
              )}
              {t("ds.action.test")}
            </Button>
            <Button type="submit" disabled={saving.isPending}>
              {saving.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
