import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2, Users, Shield, Database, HardDrive, Layers,
  FileText, Clock, PackageOpen, Activity, HeartPulse,
  Cable, Flag, Briefcase, Wrench, Archive,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminUserService, roleService, auditService, systemLogService, dashboardService, healthService, featureFlagService, providerService, jobService, backupService } from "@/modules/admin/service";
import { companyService } from "@/modules/company/service";
import { databaseService } from "@/modules/database/service";
import { DocButton } from "@/components/doc-button";
import { APP_VERSION, MODULES } from "@/core/constants";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { CONNECTION_TYPE_LABELS } from "@/modules/database/types";

export const Route = createFileRoute("/_app/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — ServiceForge" }] }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { t } = useTranslation();
  const { data: companies = [] } = useQuery({ queryKey: ["company", "list"], queryFn: () => companyService.list() });
  const { data: users = [] } = useQuery({ queryKey: ["admin", "users", "list"], queryFn: () => adminUserService.list() });
  const { data: roles = [] } = useQuery({ queryKey: ["admin", "roles", "list"], queryFn: () => roleService.list() });
  const { data: conn } = useQuery({ queryKey: ["db", "active"], queryFn: () => databaseService.getActive() });
  const { data: totalLogs } = useQuery({ queryKey: ["admin", "logs", "count"], queryFn: () => systemLogService.count() });
  const { data: totalAudit } = useQuery({ queryKey: ["admin", "audit", "count"], queryFn: () => auditService.count() });
  const { data: healthDash } = useQuery({ queryKey: ["admin", "health", "dash"], queryFn: () => healthService.getDashboard() });
  const { data: flags } = useQuery({ queryKey: ["admin", "flags", "list"], queryFn: () => featureFlagService.list() });
  const { data: providers } = useQuery({ queryKey: ["admin", "providers", "list"], queryFn: () => providerService.list() });
  const { data: jobs } = useQuery({ queryKey: ["admin", "jobs", "list"], queryFn: () => jobService.list() });
  const { data: backups } = useQuery({ queryKey: ["admin", "backups", "list"], queryFn: () => backupService.list() });

  const admins = users.filter(u => u.roleIds.length > 0 && roles.find(r => r.id === u.roleIds[0] && r.name === "Administrador Global"));
  const activeFlags = flags?.filter(f => f.enabled).length ?? 0;
  const activeProviders = providers?.filter(p => p.status === "active").length ?? 0;
  const runningJobs = jobs?.filter(j => j.status === "running").length ?? 0;
  const lastBackup = backups?.filter(b => b.status === "completed").sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];

  const items = [
    { icon: Building2, label: "Empresas", value: companies.length, color: "text-blue-600" },
    { icon: Users, label: "Usuários", value: users.length, color: "text-green-600" },
    { icon: Shield, label: "Administradores", value: admins.length, color: "text-red-600" },
    { icon: Database, label: "Conexão Ativa", value: conn ? `${conn.name}` : "—", color: "text-purple-600" },
    { icon: HardDrive, label: "Armazenamento", value: getStorage().name, color: "text-orange-600" },
    { icon: Layers, label: "Módulos", value: MODULES.length, color: "text-indigo-600" },
    { icon: FileText, label: "Logs", value: totalLogs ?? 0, color: "text-teal-600" },
    { icon: PackageOpen, label: "Auditoria", value: totalAudit ?? 0, color: "text-cyan-600" },
    { icon: HeartPulse, label: "Saúde", value: healthDash?.overall === "healthy" ? "Saudável" : healthDash?.overall === "degraded" ? "Degradado" : "Crítico", color: healthDash?.overall === "healthy" ? "text-green-600" : healthDash?.overall === "degraded" ? "text-amber-600" : "text-red-600" },
    { icon: Cable, label: "Provedores Ativos", value: activeProviders, color: "text-rose-600" },
    { icon: Flag, label: "Feature Flags", value: `${activeFlags}/${flags?.length ?? 0}`, color: "text-violet-600" },
    { icon: Briefcase, label: "Jobs Rodando", value: runningJobs, color: "text-blue-500" },
    { icon: Archive, label: "Backups", value: backups?.length ?? 0, color: "text-emerald-600" },
    { icon: Clock, label: "Último Backup", value: lastBackup ? new Date(lastBackup.startedAt).toLocaleDateString("pt-BR") : "—", color: "text-amber-600" },
    { icon: Activity, label: "Plataforma", value: "v" + APP_VERSION, color: "text-sky-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard Administrativo</h1>
            <DocButton module="admin" page="dashboard" title="Dashboard Administrativo" />
          </div>
          <p className="text-sm text-muted-foreground">Visão geral da plataforma ServiceForge</p>
        </div>
        <Badge variant={healthDash?.overall === "healthy" ? "default" : healthDash?.overall === "degraded" ? "secondary" : "destructive"}>
          {healthDash?.overall === "healthy" ? "Sistema Saudável" : healthDash?.overall === "degraded" ? "Desempenho Reduzido" : "Crítico"}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {items.map(it => (
          <Card key={it.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{it.label}</CardTitle>
              <it.icon className={`h-4 w-4 ${it.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold truncate">{it.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function getStorage() {
  return { name: "IndexedDB / LocalStorage" };
}
