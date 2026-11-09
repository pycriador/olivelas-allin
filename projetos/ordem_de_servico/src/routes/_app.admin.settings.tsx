import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Settings as SettingsIcon, Building2, Users, FileText, MessageSquare,
  Database, FileWarning, Palette, Globe, HardDrive, Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { globalConfigService } from "@/modules/admin/service";
import { DocButton } from "@/components/doc-button";
import { useTranslation } from "@/core/i18n/I18nProvider";
import type { GlobalConfig } from "@/modules/admin/types";
import type { LucideIcon } from "lucide-react";

const CATEGORIES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "system", label: "admin.systemSettings", icon: SettingsIcon },
  { id: "company", label: "admin.companySettings", icon: Building2 },
  { id: "user", label: "admin.userSettings", icon: Users },
  { id: "documents", label: "admin.documentSettings", icon: FileText },
  { id: "communication", label: "admin.communicationSettings", icon: MessageSquare },
  { id: "metadata", label: "admin.metadataSettings", icon: Layers },
  { id: "database", label: "admin.databaseSettings", icon: Database },
  { id: "logs", label: "admin.logSettings", icon: FileWarning },
  { id: "theme", label: "admin.themeSettings", icon: Palette },
  { id: "language", label: "admin.languageSettings", icon: Globe },
  { id: "backup", label: "admin.backupSettings", icon: HardDrive },
];

const settingsSchema = z.object({
  systemName: z.string().optional(),
  systemDescription: z.string().optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  sessionTimeout: z.coerce.number().optional(),
  maxLoginAttempts: z.coerce.number().optional(),
  requireMfa: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  allowRegistration: z.boolean().optional(),
  backupEnabled: z.boolean().optional(),
  backupInterval: z.string().optional(),
  backupRetention: z.coerce.number().optional(),
  logRetention: z.coerce.number().optional(),
  auditRetention: z.coerce.number().optional(),
  defaultLanguage: z.string().optional(),
  defaultTheme: z.string().optional(),
  companyDefaults: z.object({
    defaultTheme: z.string().optional(),
    defaultLanguage: z.string().optional(),
    documentFooter: z.string().optional(),
    defaultMessage: z.string().optional(),
  }).optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export const Route = createFileRoute("/_app/admin/settings")({
  head: () => ({ meta: [{ title: "Admin Configurações — ServiceForge" }] }),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("system");
  const { data: config } = useQuery({ queryKey: ["admin", "globalConfig"], queryFn: () => globalConfigService.get() });

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
  });

  const saveMut = useMutation({
    mutationFn: (data: SettingsForm) => globalConfigService.update(data as Partial<GlobalConfig>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "globalConfig"] }); toast.success("Configurações salvas"); },
  });

  const handleSave = (data: SettingsForm) => {
    saveMut.mutate(data);
  };

  const cfg = config;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{t("admin.settings")}</h1>
          <DocButton module="admin" page="settings" title="Configurações" />
        </div>
        <p className="text-sm text-muted-foreground">{t("admin.settingsCategories")}</p>
      </div>

      <div className="flex gap-4 flex-wrap">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(cat.id)}
            className="gap-2"
          >
            <cat.icon className="h-4 w-4" />
            {t(cat.label)}
          </Button>
        ))}
      </div>

      {cfg && (
        <form onSubmit={form.handleSubmit(handleSave)}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t(CATEGORIES.find((c) => c.id === activeCategory)?.label ?? "admin.systemSettings")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-xl">
              {activeCategory === "system" && (
                <>
                  <div className="space-y-2"><Label>{t("admin.systemName")}</Label><Input defaultValue={cfg.systemName} {...form.register("systemName")} /></div>
                  <div className="space-y-2"><Label>{t("admin.systemDescription")}</Label><Textarea defaultValue={cfg.systemDescription} {...form.register("systemDescription")} /></div>
                  <div className="space-y-2"><Label>{t("admin.timezone")}</Label>
                    <Select defaultValue={cfg.timezone} onValueChange={(v) => form.setValue("timezone", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">America/Sao_Paulo (UTC-3)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (UTC-5)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (UTC+0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>{t("admin.dateFormat")}</Label>
                    <Select defaultValue={cfg.dateFormat} onValueChange={(v) => form.setValue("dateFormat", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>{t("admin.sessionTimeout")}</Label><Input type="number" defaultValue={cfg.sessionTimeout} {...form.register("sessionTimeout")} /></div>
                  <div className="space-y-2"><Label>{t("admin.maxLoginAttempts")}</Label><Input type="number" defaultValue={cfg.maxLoginAttempts} {...form.register("maxLoginAttempts")} /></div>
                  <div className="flex items-center gap-2"><Switch defaultChecked={cfg.requireMfa} onCheckedChange={(v) => form.setValue("requireMfa", v)} /><Label>{t("admin.requireMfa")}</Label></div>
                  <div className="flex items-center gap-2"><Switch defaultChecked={cfg.maintenanceMode} onCheckedChange={(v) => form.setValue("maintenanceMode", v)} /><Label>{t("admin.maintenanceMode")}</Label></div>
                </>
              )}

              {activeCategory === "backup" && (
                <>
                  <div className="flex items-center gap-2"><Switch defaultChecked={cfg.backupEnabled} onCheckedChange={(v) => form.setValue("backupEnabled", v)} /><Label>{t("admin.backupEnabled")}</Label></div>
                  <div className="space-y-2"><Label>{t("admin.backupInterval")}</Label>
                    <Select defaultValue={cfg.backupInterval} onValueChange={(v) => form.setValue("backupInterval", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">{t("admin.daily")}</SelectItem>
                        <SelectItem value="weekly">{t("admin.weekly")}</SelectItem>
                        <SelectItem value="monthly">{t("admin.monthly")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>{t("admin.backupRetention")}</Label><Input type="number" defaultValue={cfg.backupRetention} {...form.register("backupRetention")} /></div>
                </>
              )}

              {activeCategory === "logs" && (
                <>
                  <div className="space-y-2"><Label>{t("admin.logRetention")}</Label><Input type="number" defaultValue={cfg.logRetention} {...form.register("logRetention")} /></div>
                  <div className="space-y-2"><Label>{t("admin.auditRetention")}</Label><Input type="number" defaultValue={cfg.auditRetention} {...form.register("auditRetention")} /></div>
                </>
              )}

              {activeCategory === "theme" && (
                <>
                  <div className="space-y-2"><Label>{t("admin.defaultTheme")}</Label>
                    <Select defaultValue={cfg.defaultTheme} onValueChange={(v) => form.setValue("defaultTheme", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {activeCategory === "language" && (
                <>
                  <div className="space-y-2"><Label>{t("admin.defaultLanguage")}</Label>
                    <Select defaultValue={cfg.defaultLanguage} onValueChange={(v) => form.setValue("defaultLanguage", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (BR)</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {activeCategory === "company" && (
                <>
                  <div className="space-y-2"><Label>{t("admin.defaultMessage")}</Label><Textarea defaultValue={cfg.companyDefaults.defaultMessage} onChange={(e) => form.setValue("companyDefaults.defaultMessage", e.target.value)} /></div>
                  <div className="space-y-2"><Label>{t("admin.documentFooter")}</Label><Input defaultValue={cfg.companyDefaults.documentFooter} onChange={(e) => form.setValue("companyDefaults.documentFooter", e.target.value)} /></div>
                </>
              )}

              {activeCategory !== "system" && activeCategory !== "backup" && activeCategory !== "logs" && activeCategory !== "theme" && activeCategory !== "language" && activeCategory !== "company" && (
                <p className="text-sm text-muted-foreground">Configurações disponíveis em breve.</p>
              )}

              <Button type="submit" disabled={saveMut.isPending}>{t("common.save")}</Button>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
