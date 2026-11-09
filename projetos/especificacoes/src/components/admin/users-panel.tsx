import { toast } from "sonner";
import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUsers, useRoles, useUpdateUser, useDeleteUser, useApproveUser, useRejectUser } from "@/hooks/iam";
import { UserStatus } from "@/types/iam";
import { ListSkeleton } from "@/components/common/skeletons";
import { EmptyState } from "@/components/common/empty-state";

const statusVariant = (s: string) =>
  s === UserStatus.Active ? "outline" : s === UserStatus.Pending ? "secondary" : "destructive";

export function UsersPanel() {
  const users = useUsers();
  const roles = useRoles();
  const update = useUpdateUser();
  const remove = useDeleteUser();
  const approve = useApproveUser();
  const reject = useRejectUser();

  if (users.isLoading || roles.isLoading) return <ListSkeleton rows={5} />;

  const act = async (fn: Promise<unknown>, msg: string) => {
    try {
      await fn;
      toast.success(msg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Operation failed");
    }
  };

  const rows = users.data ?? [];
  const pending = rows.filter((u) => u.status === UserStatus.Pending);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {rows.length} usuários · {pending.length} aguardando aprovação
        </p>
        <p className="text-xs text-muted-foreground">Contas são criadas via login com Google</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Nenhum usuário" description="Usuários aparecem aqui após o primeiro login com Google." />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Select
                      value={u.roleId}
                      onValueChange={(roleId) => act(update.mutateAsync({ id: u.id, patch: { roleId } }), "Papel atualizado")}
                    >
                      <SelectTrigger className="h-8 w-[190px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(roles.data ?? []).map((r) => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={statusVariant(u.status)}
                      className="cursor-pointer text-[10px] uppercase"
                      onClick={() =>
                        act(
                          update.mutateAsync({
                            id: u.id,
                            patch: {
                              status: u.status === UserStatus.Active ? UserStatus.Suspended : UserStatus.Active,
                            },
                          }),
                          "Status atualizado",
                        )
                      }
                    >
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {u.status === UserStatus.Pending ? (
                      <Button
                        size="sm"
                        className="mr-2 gap-1"
                        onClick={() => act(approve.mutateAsync({ id: u.id }), "Acesso aprovado")}
                      >
                        <Check className="h-4 w-4" /> Aprovar
                      </Button>
                    ) : null}
                    {u.status === UserStatus.Pending ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mr-2"
                        onClick={() => act(reject.mutateAsync(u.id), "Solicitação recusada")}
                      >
                        Recusar
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      title="Remover usuário"
                      onClick={() => act(remove.mutateAsync(u.id), "Usuário removido")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
