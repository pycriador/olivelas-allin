import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { auditService } from "@/modules/admin/service";
import { listCloudAuditLogs, type AuditChange, type CloudAuditEntry } from "@/services/audit.service";
import { DataTable, type Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { DocButton } from "@/components/doc-button";
import { useTranslation } from "@/core/i18n/I18nProvider";
import type { AuditLog } from "@/modules/admin/types";

export const Route = createFileRoute("/_app/admin/audit")({
  head: () => ({ meta: [{ title: "Admin Auditoria — ServiceForge" }] }),
  component: AdminAuditPage,
});

type AuditRow = AuditLog & { changes?: AuditChange[] };

function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "object") {
    const s = JSON.stringify(v);
    return s.length > 60 ? `${s.slice(0, 60)}…` : s;
  }
  const s = String(v);
  return s.length > 60 ? `${s.slice(0, 60)}…` : s;
}

function cloudToRow(e: CloudAuditEntry): AuditRow {
  const d = new Date(e.createdAt);
  return {
    id: e.id,
    date: d.toLocaleDateString("pt-BR"),
    time: d.toLocaleTimeString("pt-BR"),
    userId: e.userId ?? "",
    userName: e.userName,
    companyId: e.companyId,
    companyName: "",
    module: e.action.split(".")[0] ?? "admin",
    screen: "",
    action: e.action,
    entity: e.resource ?? "",
    recordId: "",
    description: e.description,
    ip: "",
    browser: e.userAgent ?? "",
    os: "",
    sessionId: "",
    result: e.result === "failure" ? "error" : e.result === "info" ? "warning" : "success",
    duration: 0,
    origin: "cloud",
    timestamp: e.createdAt,
    changes: e.changes,
  };
}

function AdminAuditPage() {
  const { t } = useTranslation();
  const { data: localLogs = [] } = useQuery({
    queryKey: ["admin", "audit", "list"],
    queryFn: () => auditService.list(),
  });
  const { data: cloudLogs = [] } = useQuery({
    queryKey: ["admin", "audit", "cloud"],
    queryFn: () => listCloudAuditLogs(),
    retry: false,
  });

  const logs: AuditRow[] = [...cloudLogs.map(cloudToRow), ...localLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const handleExport = () => {
    const csv = [
      ["Data", "Hora", "Usuário", "Empresa", "Módulo", "Ação", "Entidade", "Alterações", "Resultado", "Origem", "Navegador"].join(","),
      ...logs.map((l) => [
        l.date, l.time, l.userName, l.companyName, l.module, l.action, l.entity,
        (l.changes ?? []).map((c) => `${c.field}: ${formatValue(c.from)} -> ${formatValue(c.to)}`).join("; "),
        l.result, l.origin, l.browser,
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resultBadge = (r: string) => {
    const map: Record<string, "default" | "destructive" | "secondary"> = { success: "default", error: "destructive", warning: "secondary" };
    return <Badge variant={map[r] ?? "secondary"}>{r}</Badge>;
  };

  const columns: Column<AuditRow>[] = [
    { key: "date", header: "Data", sortable: true, sortFn: (a, b) => a.timestamp.localeCompare(b.timestamp), render: (l) => <span className="text-sm whitespace-nowrap">{l.date}</span> },
    { key: "time", header: "Hora", render: (l) => <span className="text-sm text-muted-foreground">{l.time}</span> },
    { key: "user", header: "Usuário", sortable: true, sortFn: (a, b) => a.userName.localeCompare(b.userName), render: (l) => <span className="text-sm font-medium">{l.userName}</span> },
    { key: "company", header: "Empresa", render: (l) => <span className="text-sm">{l.companyName || "—"}</span> },
    { key: "module", header: "Módulo", render: (l) => <span className="text-sm capitalize">{l.module}</span> },
    { key: "action", header: "Ação", render: (l) => <span className="text-sm">{l.action}</span> },
    { key: "entity", header: "Entidade", render: (l) => <span className="text-sm text-muted-foreground">{l.entity}</span> },
    { key: "changes", header: "Alterações", render: (l) => {
      const changes = l.changes ?? [];
      if (changes.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
      const text = changes.map((c) => `${c.field}: ${formatValue(c.from)} → ${formatValue(c.to)}`).join("\n");
      return (
        <span className="text-xs text-muted-foreground max-w-[240px] truncate block whitespace-pre-line" title={text}>
          {changes.slice(0, 3).map((c) => (
            <span key={c.field} className="block">
              <span className="font-medium text-foreground">{c.field}</span>: {formatValue(c.from)} → {formatValue(c.to)}
            </span>
          ))}
          {changes.length > 3 && <span className="block">+{changes.length - 3} campos</span>}
        </span>
      );
    }},
    { key: "result", header: "Resultado", render: (l) => resultBadge(l.result) },
    { key: "origin", header: "Origem", render: (l) => (
      <Badge variant={l.origin === "cloud" ? "default" : "outline"}>{l.origin === "cloud" ? "Cloud" : l.origin}</Badge>
    )},
    { key: "description", header: "Descrição", render: (l) => <span className="text-sm text-muted-foreground max-w-[200px] truncate block" title={l.description}>{l.description}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{t("admin.audit")}</h1>
            <DocButton module="admin" page="audit" title="Auditoria" />
          </div>
          <p className="text-sm text-muted-foreground">Trilha de auditoria completa do sistema — quem fez, quando e o que alterou</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />{t("admin.export")}
        </Button>
      </div>

      <DataTable
        data={logs}
        columns={columns}
        keyExtractor={(l) => l.id}
        searchKeys={["userName", "companyName", "module", "action", "entity", "description"]}
        pageSize={20}
        pageSizeOptions={[10, 20, 50, 100]}
        searchPlaceholder="Pesquisar na auditoria..."
      />
    </div>
  );
}
