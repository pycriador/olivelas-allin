import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { auditService } from "@/modules/automation/service";
import type { AuditEntry } from "@/modules/automation/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_app/automation/audit")({
  head: () => ({ meta: [{ title: "Auditoria — ServiceForge" }] }),
  component: AutomationAuditPage,
});

const entityTypes = [
  "workflow", "template", "rule", "stateMachine", "approvalFlow",
  "job", "schedule", "script", "variable", "execution",
] as const;

const actionTypes = [
  "created", "updated", "deleted", "executed", "cancelled", "failed", "retried",
] as const;

const actionColors: Record<string, string> = {
  created: "bg-green-500",
  updated: "bg-blue-500",
  deleted: "bg-red-500",
  executed: "bg-purple-500",
  cancelled: "bg-amber-500",
  failed: "bg-red-700",
  retried: "bg-orange-500",
};

const entityColors: Record<string, string> = {
  workflow: "bg-indigo-500",
  template: "bg-teal-500",
  rule: "bg-cyan-500",
  stateMachine: "bg-pink-500",
  approvalFlow: "bg-violet-500",
  job: "bg-sky-500",
  schedule: "bg-emerald-500",
  script: "bg-rose-500",
  variable: "bg-lime-500",
  execution: "bg-orange-500",
};

function AutomationAuditPage() {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const { data: auditEntries = [] } = useQuery({
    queryKey: ["automation", "audit"],
    queryFn: () => auditService.list(),
  });

  const filtered = useMemo(() => {
    return auditEntries.filter((e) => {
      const matchSearch = e.entityName.toLowerCase().includes(search.toLowerCase());
      const matchEntity = entityFilter === "all" || e.entityType === entityFilter;
      const matchAction = actionFilter === "all" || e.action === actionFilter;
      return matchSearch && matchEntity && matchAction;
    });
  }, [auditEntries, search, entityFilter, actionFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Auditoria</h1>
          <p className="text-sm text-muted-foreground">Trilha de auditoria completa de automação</p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome da entidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-sm text-muted-foreground">Tipo:</span>
          <Button
            variant={entityFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setEntityFilter("all")}
          >
            Todos
          </Button>
          {entityTypes.map((type) => (
            <Button
              key={type}
              variant={entityFilter === type ? "default" : "outline"}
              size="sm"
              onClick={() => setEntityFilter(type)}
              className="capitalize"
            >
              {type === "stateMachine" ? "State Machine" : type === "approvalFlow" ? "Approval Flow" : type}
            </Button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-sm text-muted-foreground">Ação:</span>
          <Button
            variant={actionFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActionFilter("all")}
          >
            Todos
          </Button>
          {actionTypes.map((action) => (
            <Button
              key={action}
              variant={actionFilter === action ? "default" : "outline"}
              size="sm"
              onClick={() => setActionFilter(action)}
              className="capitalize"
            >
              {action}
            </Button>
          ))}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo de Entidade</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Nome da Entidade</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Data/Hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum registro de auditoria encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <Badge className={`${entityColors[entry.entityType] || "bg-gray-500"} text-white capitalize`}>
                      {entry.entityType === "stateMachine" ? "State Machine" : entry.entityType === "approvalFlow" ? "Approval Flow" : entry.entityType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${actionColors[entry.action] || "bg-gray-500"} text-white capitalize`}>
                      {entry.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{entry.entityName}</TableCell>
                  <TableCell>{entry.userId}</TableCell>
                  <TableCell>{entry.companyId || "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
