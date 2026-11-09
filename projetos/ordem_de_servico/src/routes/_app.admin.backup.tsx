import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, RotateCcw, HardDrive, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/data-table";
import { DocButton } from "@/components/doc-button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { backupService } from "@/modules/admin/service";
import type { BackupDefinition } from "@/modules/admin/types";

const typeLabels: Record<string, string> = { manual: "Manual", scheduled: "Agendado", full: "Completo", incremental: "Incremental" };
const typeVariants: Record<string, "secondary" | "default" | "outline" | "destructive"> = { manual: "secondary", scheduled: "default", full: "outline", incremental: "destructive" };
const statusLabels: Record<string, string> = { completed: "Concluído", failed: "Falhou", in_progress: "Em Andamento" };
const statusVariants: Record<string, "default" | "destructive" | "secondary"> = { completed: "default", failed: "destructive", in_progress: "secondary" };

export const Route = createFileRoute("/_app/admin/backup")({
  head: () => ({ meta: [{ title: "Admin Backup & Restore — ServiceForge" }] }),
  component: AdminBackupPage,
});

function AdminBackupPage() {
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [restoreId, setRestoreId] = useState<string | null>(null);

  const { data: backups = [] } = useQuery({ queryKey: ["admin", "backup", "list"], queryFn: () => backupService.list() });

  const createMut = useMutation({
    mutationFn: () => backupService.createBackup("manual", "Backup manual", "admin"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "backup"] }); toast.success("Backup iniciado"); },
    onError: () => toast.error("Erro ao criar backup"),
  });

  const restoreMut = useMutation({
    mutationFn: (id: string) => backupService.restore(id, "admin"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "backup"] }); setRestoreId(null); toast.success("Restauração concluída"); },
    onError: () => toast.error("Erro ao restaurar backup"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => backupService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "backup"] }); toast.success("Backup excluído"); },
  });

  const formatSize = (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${bytes} B`;
  };

  const columns: Column<BackupDefinition>[] = [
    { key: "type", header: "Tipo", render: (b) => <Badge variant={typeVariants[b.type]}>{typeLabels[b.type]}</Badge> },
    { key: "status", header: "Status", render: (b) => (
      <Badge variant={statusVariants[b.status]} className="gap-1">
        {b.status === "completed" ? <CheckCircle2 className="h-3 w-3" /> : b.status === "failed" ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3 animate-spin" />}
        {statusLabels[b.status]}
      </Badge>
    )},
    { key: "fileName", header: "Arquivo", sortable: true, sortFn: (a, b) => a.fileName.localeCompare(b.fileName), render: (b) => (
      <div className="flex items-center gap-2">
        <HardDrive className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{b.fileName}</span>
      </div>
    )},
    { key: "size", header: "Tamanho", render: (b) => <span className="text-sm">{formatSize(b.size)}</span> },
    { key: "startedAt", header: "Iniciado Em", render: (b) => <span className="text-sm">{new Date(b.startedAt).toLocaleString()}</span> },
    { key: "completedAt", header: "Concluído Em", render: (b) => <span className="text-sm">{b.completedAt ? new Date(b.completedAt).toLocaleString() : "—"}</span> },
    { key: "createdBy", header: "Criado Por", render: (b) => <span className="text-sm">{b.createdBy}</span> },
    { key: "actions", header: "Ações", render: (b) => (
      <div className="flex gap-1">
        {b.status === "completed" && (
          <Button size="sm" variant="ghost" onClick={() => setRestoreId(b.id)}><RotateCcw className="h-4 w-4" /></Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Backup & Restore</h1>
            <DocButton module="admin" page="backup" title="Backup & Restore" />
          </div>
          <p className="text-sm text-muted-foreground">Gerencie backups e restaurações da plataforma</p>
        </div>
        <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
          <Plus className="mr-2 h-4 w-4" />Novo Backup
        </Button>
      </div>

      <DataTable
        data={backups}
        columns={columns}
        keyExtractor={(b) => b.id}
        searchKeys={["fileName", "type", "createdBy"]}
        initialSortColumn="startedAt"
        searchPlaceholder="Pesquisar backups..."
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        onConfirm={() => { if (deleteId) { deleteMut.mutate(deleteId); setDeleteId(null); } }}
      />

      <ConfirmDialog
        open={!!restoreId}
        onOpenChange={(o) => { if (!o) setRestoreId(null); }}
        onConfirm={() => { if (restoreId) { restoreMut.mutate(restoreId); } }}
        title="Restaurar Backup"
        description="Tem certeza que deseja restaurar este backup? Esta ação pode sobrescrever dados existentes."
      />
    </div>
  );
}
