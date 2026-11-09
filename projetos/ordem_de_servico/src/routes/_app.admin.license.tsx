import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Shield, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/data-table";
import { licenseService } from "@/modules/admin/service";
import { DocButton } from "@/components/doc-button";
import type { LicenseInfo } from "@/modules/admin/types";

const planLabels: Record<string, string> = { free: "Gratuito", starter: "Starter", professional: "Professional", enterprise: "Enterprise" };
const planVariants: Record<string, "secondary" | "default" | "destructive"> = { free: "secondary", starter: "default", professional: "default", enterprise: "destructive" };
const statusLabels: Record<string, string> = { active: "Ativo", expired: "Expirado", suspended: "Suspenso" };
const statusVariants: Record<string, "default" | "secondary" | "destructive"> = { active: "default", expired: "secondary", suspended: "destructive" };

export const Route = createFileRoute("/_app/admin/license")({
  head: () => ({ meta: [{ title: "Admin Licenciamento — ServiceForge" }] }),
  component: AdminLicensePage,
});

function AdminLicensePage() {
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: current } = useQuery({ queryKey: ["admin", "license", "current"], queryFn: () => licenseService.getCurrent() });
  const { data: licenses = [] } = useQuery({ queryKey: ["admin", "license", "list"], queryFn: () => licenseService.list() });

  const deleteMut = useMutation({
    mutationFn: (id: string) => licenseService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "license"] }); toast.success("Licença excluída"); },
  });

  const columns: Column<LicenseInfo>[] = [
    { key: "plan", header: "Plano", sortable: true, sortFn: (a, b) => a.plan.localeCompare(b.plan), render: (l) => <Badge variant={planVariants[l.plan]}>{planLabels[l.plan]}</Badge> },
    { key: "status", header: "Status", render: (l) => <Badge variant={statusVariants[l.status]}>{statusLabels[l.status]}</Badge> },
    { key: "validFrom", header: "Válido De", render: (l) => <span className="text-sm">{new Date(l.validFrom).toLocaleDateString()}</span> },
    { key: "validTo", header: "Válido Até", render: (l) => <span className="text-sm">{new Date(l.validTo).toLocaleDateString()}</span> },
    { key: "maxUsers", header: "Máx. Usuários", render: (l) => <span className="text-sm">{l.maxUsers}</span> },
    { key: "actions", header: "Ações", render: (l) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(l.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Licenciamento</h1>
          <DocButton module="admin" page="license" title="Licenciamento" />
        </div>
        <p className="text-sm text-muted-foreground">Gerencie as licenças da plataforma</p>
      </div>

      {current && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Shield className="h-5 w-5" />Licença Atual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant={planVariants[current.plan]} className="text-sm px-3 py-1">{planLabels[current.plan]}</Badge>
              <Badge variant={statusVariants[current.status]} className="gap-1">
                {current.status === "active" ? <CheckCircle2 className="h-3 w-3" /> : current.status === "expired" ? <AlertTriangle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {statusLabels[current.status]}
              </Badge>
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div><span className="text-muted-foreground">Válido de:</span><span className="ml-2 font-medium">{new Date(current.validFrom).toLocaleDateString()}</span></div>
              <div><span className="text-muted-foreground">Válido até:</span><span className="ml-2 font-medium">{new Date(current.validTo).toLocaleDateString()}</span></div>
              <div><span className="text-muted-foreground">Máx. Usuários:</span><span className="ml-2 font-medium">{current.maxUsers}</span></div>
              <div><span className="text-muted-foreground">Armazenamento:</span><span className="ml-2 font-medium">{current.maxStorage} MB</span></div>
              <div><span className="text-muted-foreground">Empresas:</span><span className="ml-2 font-medium">{current.maxCompanies}</span></div>
              <div><span className="text-muted-foreground">Conectores:</span><span className="ml-2 font-medium">{current.maxConnectors}</span></div>
              <div><span className="text-muted-foreground">Req. IA:</span><span className="ml-2 font-medium">{current.maxAiRequests}</span></div>
              <div><span className="text-muted-foreground">Documentos:</span><span className="ml-2 font-medium">{current.maxDocuments}</span></div>
              <div><span className="text-muted-foreground">Workflows:</span><span className="ml-2 font-medium">{current.maxWorkflows}</span></div>
              <div><span className="text-muted-foreground">Relatórios:</span><span className="ml-2 font-medium">{current.maxReports}</span></div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Funcionalidades:</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {current.features.map((f, i) => <Badge key={i} variant="outline" className="text-xs">{f}</Badge>)}
                {current.features.length === 0 && <span className="text-xs text-muted-foreground">Nenhuma funcionalidade adicional</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Todas as Licenças</h2>
        <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["admin", "license"] })}>
          <RefreshCw className="mr-2 h-4 w-4" />Atualizar
        </Button>
      </div>

      <DataTable
        data={licenses}
        columns={columns}
        keyExtractor={(l) => l.id}
        searchKeys={["plan", "status"]}
        initialSortColumn="plan"
        searchPlaceholder="Pesquisar licenças..."
      />
    </div>
  );
}
