import { Users, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { useUsers, useMemberships, useGroups, useGroupMembers } from "@/hooks/iam";
import { ListSkeleton } from "@/components/common/skeletons";
import { EmptyState } from "@/components/common/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/** Etapas 2/7/8 — Workspace atual, seus membros e grupos. */
export function WorkspacePanel() {
  const current = useWorkspaceStore((s) => s.current);
  const loading = useWorkspaceStore((s) => s.loading);
  const error = useWorkspaceStore((s) => s.error);
  const users = useUsers();
  const memberships = useMemberships();
  const groups = useGroups();
  const groupMembers = useGroupMembers();

  if (loading || memberships.isLoading || users.isLoading) return <ListSkeleton rows={4} />;
  if (error) return <EmptyState title="Erro ao carregar workspace" description={error} />;
  if (!current)
    return <EmptyState title="Nenhum workspace" description="O workspace é criado automaticamente no primeiro acesso." />;

  const nameOf = (id: string) => users.data?.find((u) => u.id === id)?.name || users.data?.find((u) => u.id === id)?.email || id;
  const members = (memberships.data ?? []).filter((m) => m.workspaceId === current.id);
  const wsGroups = (groups.data ?? []).filter((g) => !g.workspaceId || g.workspaceId === current.id);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{current.name}</h3>
            <p className="text-xs text-muted-foreground">/{current.slug}</p>
            {current.description ? <p className="mt-1 text-sm text-muted-foreground">{current.description}</p> : null}
          </div>
          <Badge variant="outline" className="text-[10px] uppercase">{current.status ?? "active"}</Badge>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Dono: {current.ownerId ? nameOf(current.ownerId) : "—"}</p>
      </div>

      <section className="space-y-2">
        <h4 className="flex items-center gap-2 text-sm font-medium"><Users className="h-4 w-4" /> Membros ({members.length})</h4>
        {members.length === 0 ? (
          <EmptyState title="Nenhum membro" description="Aprove solicitações de acesso para adicionar membros." />
        ) : (
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entrou em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{nameOf(m.userId)}</TableCell>
                    <TableCell className="text-muted-foreground">{m.roleId}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase">{m.status ?? "active"}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h4 className="flex items-center gap-2 text-sm font-medium"><Shield className="h-4 w-4" /> Grupos</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {wsGroups.map((g) => {
            const count = (groupMembers.data ?? []).filter((gm) => gm.groupId === g.id).length;
            return (
              <div key={g.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{g.name}</span>
                  <Badge variant="secondary" className="text-[10px]">{count} membro(s)</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{g.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
