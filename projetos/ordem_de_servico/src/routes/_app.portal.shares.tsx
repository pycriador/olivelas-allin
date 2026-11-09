import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { shareService, portalService } from "@/modules/portal/service";
import type { ShareLink } from "@/modules/portal/types";
import { PORTAL_CONSTANTS } from "@/modules/portal/types";

export const Route = createFileRoute("/_app/portal/shares")({
  head: () => ({ meta: [{ title: "Compartilhamentos — ServiceForge" }] }),
  component: PortalSharesPage,
});

const visibilityVariants: Record<string, "default" | "secondary" | "destructive"> = {
  public: "default", protected: "secondary", private: "destructive",
};

const visibilityLabels: Record<string, string> = {
  public: "Público", protected: "Protegido", private: "Privado",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default", expired: "secondary", revoked: "destructive", exhausted: "outline",
};

const statusLabels: Record<string, string> = {
  active: "Ativo", expired: "Expirado", revoked: "Revogado", exhausted: "Esgotado",
};

function PortalSharesPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ serviceOrderId: "", maxAccessCount: "", expiresInHours: "", password: "", visibility: "public" });

  const { data: shares = [] } = useQuery({ queryKey: ["portal", "shares"], queryFn: () => shareService.list() });

  const createMut = useMutation({
    mutationFn: () => portalService.generateShareLink(form.serviceOrderId, {
      maxAccessCount: form.maxAccessCount ? Number(form.maxAccessCount) : undefined,
      expiresInHours: form.expiresInHours ? Number(form.expiresInHours) : undefined,
      password: form.password || undefined,
      visibility: form.visibility,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portal", "shares"] }); setDialogOpen(false); setForm({ serviceOrderId: "", maxAccessCount: "", expiresInHours: "", password: "", visibility: "public" }); toast.success("Compartilhamento criado"); },
    onError: () => toast.error("Erro ao criar compartilhamento"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => shareService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portal", "shares"] }); toast.success("Compartilhamento removido"); },
  });

  const revokeMut = useMutation({
    mutationFn: (id: string) => shareService.update(id, { status: "revoked", revokedAt: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portal", "shares"] }); toast.success("Compartilhamento revogado"); },
  });

  const filtered = shares.filter((s) => {
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesVis = visibilityFilter === "all" || s.visibility === visibilityFilter;
    return matchesStatus && matchesVis;
  });

  const columns: Column<ShareLink>[] = [
    { key: "publicCode", header: "Código", render: (s) => <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">{s.publicCode}</code> },
    { key: "visibility", header: "Visibilidade", render: (s) => <Badge variant={visibilityVariants[s.visibility]}>{visibilityLabels[s.visibility]}</Badge> },
    { key: "status", header: "Status", render: (s) => <Badge variant={statusVariants[s.status]}>{statusLabels[s.status]}</Badge> },
    { key: "currentAccessCount", header: "Acessos", render: (s) => <span>{s.currentAccessCount}{s.maxAccessCount ? ` / ${s.maxAccessCount}` : ""}</span> },
    { key: "expiresAt", header: "Expiração", render: (s) => s.expiresAt ? <span className="text-sm">{new Date(s.expiresAt).toLocaleDateString("pt-BR")}</span> : <span className="text-muted-foreground">—</span> },
    { key: "qrCode", header: "QR Code", render: (s) => (
      <Button size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(s.qrCode)} title="Copiar QR Code">
        <QrCode className="h-4 w-4" />
      </Button>
    )},
    { key: "actions", header: "Ações", render: (s) => (
      <div className="flex gap-1">
        {s.status === "active" && (
          <Button size="sm" variant="ghost" onClick={() => revokeMut.mutate(s.id)} title="Revogar">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Compartilhamentos</h1>
          <p className="text-sm text-muted-foreground">Gerencie os links de compartilhamento</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {PORTAL_CONSTANTS.SHARE_STATUS.map((s) => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Visibilidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {PORTAL_CONSTANTS.SHARE_VISIBILITY.map((v) => <SelectItem key={v} value={v}>{visibilityLabels[v]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Novo Compartilhamento</Button>
        </div>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(s) => s.id}
        searchKeys={["publicCode"]}
        initialSortColumn="createdAt"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Compartilhamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ID da Ordem de Serviço</Label>
              <Input value={form.serviceOrderId} onChange={(e) => setForm({ ...form, serviceOrderId: e.target.value })} placeholder="ID da OS" />
            </div>
            <div className="space-y-2">
              <Label>Acessos Máximos</Label>
              <Input type="number" value={form.maxAccessCount} onChange={(e) => setForm({ ...form, maxAccessCount: e.target.value })} placeholder="Ilimitado se vazio" />
            </div>
            <div className="space-y-2">
              <Label>Expirar em (horas)</Label>
              <Input type="number" value={form.expiresInHours} onChange={(e) => setForm({ ...form, expiresInHours: e.target.value })} placeholder="Sem expiração se vazio" />
            </div>
            <div className="space-y-2">
              <Label>Senha (opcional)</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Proteger com senha" />
            </div>
            <div className="space-y-2">
              <Label>Visibilidade</Label>
              <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Público</SelectItem>
                  <SelectItem value="protected">Protegido</SelectItem>
                  <SelectItem value="private">Privado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => createMut.mutate()} disabled={!form.serviceOrderId}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        onConfirm={() => { if (deleteId) { deleteMut.mutate(deleteId); setDeleteId(null); } }}
      />
    </div>
  );
}
