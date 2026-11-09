import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { systemLogService } from "@/modules/admin/service";
import { DataTable, type Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { DocButton } from "@/components/doc-button";
import { useTranslation } from "@/core/i18n/I18nProvider";
import type { SystemLog } from "@/modules/admin/types";

export const Route = createFileRoute("/_app/admin/logs")({
  head: () => ({ meta: [{ title: "Admin Logs — ServiceForge" }] }),
  component: AdminLogsPage,
});

function AdminLogsPage() {
  const { t } = useTranslation();
  const { data: logs = [], refetch } = useQuery({
    queryKey: ["admin", "logs", "list"],
    queryFn: () => systemLogService.list(),
  });

  const levelBadge = (level: string) => {
    const map: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      info: "default", warning: "secondary", error: "destructive", debug: "outline",
    };
    const colors: Record<string, string> = {
      info: "", warning: "text-amber-600 border-amber-300", error: "", debug: "text-muted-foreground",
    };
    return <Badge variant={map[level] ?? "outline"} className={colors[level] ?? ""}>{level.toUpperCase()}</Badge>;
  };

  const handleExport = () => {
    const csv = [
      ["Nível", "Mensagem", "Módulo", "Usuário", "Timestamp", "Detalhes"].join(","),
      ...logs.map((l) => [l.level, l.message, l.module, l.userName ?? "", l.timestamp, l.details].map((v) => `"${v}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: Column<SystemLog>[] = [
    { key: "level", header: "Nível", render: (l) => levelBadge(l.level) },
    { key: "message", header: "Mensagem", sortable: true, sortFn: (a, b) => a.message.localeCompare(b.message), render: (l) => <span className="font-medium">{l.message}</span> },
    { key: "module", header: "Módulo", render: (l) => <span className="text-sm text-muted-foreground">{l.module}</span> },
    { key: "user", header: "Usuário", render: (l) => <span className="text-sm">{l.userName ?? "—"}</span> },
    { key: "timestamp", header: "Timestamp", sortable: true, sortFn: (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(), render: (l) => <span className="text-sm whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</span> },
    { key: "details", header: "Detalhes", render: (l) => <span className="text-xs text-muted-foreground max-w-[200px] truncate block" title={l.details}>{l.details}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{t("admin.logs")}</h1>
            <DocButton module="admin" page="logs" title="Logs" />
          </div>
          <p className="text-sm text-muted-foreground">Logs detalhados do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />{t("admin.export")}
          </Button>
        </div>
      </div>

      <DataTable
        data={logs}
        columns={columns}
        keyExtractor={(l) => l.id}
        searchKeys={["message", "module", "userName", "details", "level"]}
        pageSize={20}
        pageSizeOptions={[10, 20, 50, 100]}
        searchPlaceholder="Pesquisar logs..."
      />
    </div>
  );
}
