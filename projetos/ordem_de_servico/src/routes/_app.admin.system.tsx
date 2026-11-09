import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { globalConfigService, adminUserService, auditService } from "@/modules/admin/service";
import { companyService } from "@/modules/company/service";
import { databaseService } from "@/modules/database/service";
import { APP_VERSION, APP_NAME, MODULES } from "@/core/constants";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { DocButton } from "@/components/doc-button";
import { Server, Database, HardDrive, Clock, Activity, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_app/admin/system")({
  head: () => ({ meta: [{ title: "Admin Sistema — ServiceForge" }] }),
  component: AdminSystemPage,
});

function AdminSystemPage() {
  const { t } = useTranslation();
  const { data: config } = useQuery({ queryKey: ["admin", "globalConfig"], queryFn: () => globalConfigService.get() });
  const { data: companies = [] } = useQuery({ queryKey: ["admin", "companies"], queryFn: () => companyService.list() });
  const { data: users = [] } = useQuery({ queryKey: ["admin", "users", "list"], queryFn: () => adminUserService.list() });
  const { data: connections = [] } = useQuery({ queryKey: ["admin", "database", "list"], queryFn: () => databaseService.list() });
  const { data: auditCount } = useQuery({ queryKey: ["admin", "audit", "count"], queryFn: () => auditService.count() });

  const activeConns = connections.filter((c) => c.status === "active");

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{t("admin.system")}</h1>
          <DocButton module="admin" page="system" title="Sistema" />
        </div>
        <p className="text-sm text-muted-foreground">{t("admin.systemInfo")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium"><Server className="h-4 w-4 inline mr-1" /> {t("admin.serverStatus")}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Nome</span><span className="font-medium">{APP_NAME}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Versão</span><span className="font-medium">{APP_VERSION}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Online</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("admin.uptime")}</span><span className="font-medium flex items-center gap-1"><Clock className="h-3 w-3" /> 14d 6h 32m</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Fuso Horário</span><span className="font-medium">{config?.timezone ?? "America/Sao_Paulo"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Manutenção</span><span className="font-medium">{config?.maintenanceMode ? "Sim" : "Não"}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium"><Database className="h-4 w-4 inline mr-1" /> {t("admin.databaseInfo")}</CardTitle>
            <Database className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{t("admin.totalCompanies")}</span><span className="font-medium">{companies.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("admin.totalUsers")}</span><span className="font-medium">{users.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Conexões</span><span className="font-medium">{connections.length} ({activeConns.length} ativas)</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Provider</span><span className="font-medium">LocalStorage</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("admin.totalLogs")}</span><span className="font-medium">{auditCount ?? 0}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium"><HardDrive className="h-4 w-4 inline mr-1" /> {t("admin.cacheInfo")}</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Tamanho Estimado</span><span className="font-medium">~1.2 MB</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("admin.lastBackup")}</span><span className="font-medium">Hoje 03:00</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Retenção Logs</span><span className="font-medium">{config?.logRetention ?? 90} dias</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Retenção Auditoria</span><span className="font-medium">{config?.auditRetention ?? 365} dias</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Backup Automático</span><span className="font-medium">{config?.backupEnabled ? "Ativado" : "Desativado"}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Módulos da Plataforma ({MODULES.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {MODULES.map((m) => (
              <div key={m.id} className="flex items-center gap-2 rounded-md border p-3">
                <div className={`h-3 w-3 rounded-full ${m.category === "platform" ? "bg-blue-500" : m.category === "business" ? "bg-green-500" : "bg-purple-500"}`} />
                <div>
                  <div className="text-sm font-medium capitalize">{m.id}</div>
                  <div className="text-xs text-muted-foreground capitalize">{m.category}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
