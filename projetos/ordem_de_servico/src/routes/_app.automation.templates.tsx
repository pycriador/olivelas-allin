import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, ToggleLeft, ToggleRight, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/data-table";
import type { Column } from "@/components/data-table";
import { templateService, workflowService } from "@/modules/automation/service";
import type { WorkflowTemplate } from "@/modules/automation/types";
import { AUTOMATION_CONSTANTS } from "@/modules/automation/types";

export const Route = createFileRoute("/_app/automation/templates")({
  head: () => ({ meta: [{ title: "Templates de Workflow — ServiceForge" }] }),
  component: TemplatesPage,
});

const categoryOptions = AUTOMATION_CONSTANTS.WORKFLOW_CATEGORIES.map((c) => ({
  value: c,
  label: c.charAt(0).toUpperCase() + c.slice(1).replace(/([A-Z])/g, " $1"),
}));

function TemplatesPage() {
  const qc = useQueryClient();
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const { data: templates = [] } = useQuery({
    queryKey: ["automation", "templates"],
    queryFn: () => templateService.list(),
  });

  const publishMut = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      templateService.update(id, { isPublished, updatedAt: new Date().toISOString() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automation", "templates"] });
      toast.success("Template atualizado com sucesso");
    },
    onError: () => toast.error("Erro ao atualizar template"),
  });

  const duplicateMut = useMutation({
    mutationFn: async (template: WorkflowTemplate) => {
      const now = new Date().toISOString();
      const newWorkflow = {
        ...template.workflow,
        name: `Cópia de ${template.name}`,
        isTemplate: false,
        status: "draft" as const,
        version: 1,
        createdBy: "system",
        createdAt: now,
        updatedAt: now,
        executionCount: 0,
        avgDuration: 0,
      };
      const created = await workflowService.create(newWorkflow);
      await templateService.create({
        name: `Cópia de ${template.name}`,
        description: template.description,
        category: template.category,
        icon: template.icon,
        workflow: created,
        isPublished: false,
        isArchived: false,
        version: 1,
        usageCount: 0,
        tags: template.tags,
        createdBy: "system",
        createdAt: now,
        updatedAt: now,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automation", "templates"] });
      qc.invalidateQueries({ queryKey: ["automation", "workflows"] });
      toast.success("Template duplicado com sucesso");
    },
    onError: () => toast.error("Erro ao duplicar template"),
  });

  const filtered = templates.filter((t) => {
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    return true;
  });

  const columns: Column<WorkflowTemplate>[] = [
    {
      key: "name",
      header: "Nome",
      sortable: true,
      sortFn: (a, b) => a.name.localeCompare(b.name),
      render: (t) => <span className="font-medium">{t.name}</span>,
    },
    {
      key: "category",
      header: "Categoria",
      render: (t) => (
        <Badge variant="outline" className="text-xs">
          {categoryOptions.find((o) => o.value === t.category)?.label ?? t.category}
        </Badge>
      ),
    },
    {
      key: "isPublished",
      header: "Publicado",
      render: (t) =>
        t.isPublished ? (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs">Sim</Badge>
        ) : (
          <Badge variant="outline" className="text-xs">Não</Badge>
        ),
    },
    {
      key: "isArchived",
      header: "Arquivado",
      render: (t) =>
        t.isArchived ? (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 text-xs">Sim</Badge>
        ) : (
          <Badge variant="outline" className="text-xs">Não</Badge>
        ),
    },
    {
      key: "usageCount",
      header: "Usos",
      sortable: true,
      sortFn: (a, b) => a.usageCount - b.usageCount,
      render: (t) => <span>{t.usageCount}</span>,
    },
    {
      key: "version",
      header: "Versão",
      render: (t) => <span className="text-muted-foreground">v{t.version}</span>,
    },
    {
      key: "createdBy",
      header: "Criado Por",
      render: (t) => <span className="text-muted-foreground">{t.createdBy}</span>,
    },
    {
      key: "actions",
      header: "Ações",
      render: (t) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => publishMut.mutate({ id: t.id, isPublished: !t.isPublished })}
            title={t.isPublished ? "Despublicar" : "Publicar"}
          >
            {t.isPublished ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => duplicateMut.mutate(t)} title="Duplicar">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Templates de Workflow</h1>
          <p className="text-sm text-muted-foreground">Gerencie templates de workflow reutilizáveis</p>
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categoryOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(t) => t.id}
        searchable
        searchKeys={["name"]}
        searchPlaceholder="Pesquisar templates..."
        emptyMessage="Nenhum template encontrado"
      />
    </div>
  );
}
