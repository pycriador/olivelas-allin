import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUsers, useApproveUser, useRejectUser } from "@/hooks/iam";
import { UserStatus } from "@/types/iam";
import { ListSkeleton } from "@/components/common/skeletons";
import { EmptyState } from "@/components/common/empty-state";

const fmt = (ts?: number) => (ts ? new Date(ts).toLocaleString("pt-BR") : "—");

/** Etapa 6 — Solicitações de acesso pendentes de aprovação do Global Admin. */
export function AccessRequestsPanel() {
  const users = useUsers();
  const approve = useApproveUser();
  const reject = useRejectUser();

  if (users.isLoading) return <ListSkeleton rows={4} />;
  if (users.isError)
    return (
      <EmptyState
        title="Não foi possível carregar as solicitações"
        description={users.error instanceof Error ? users.error.message : "Erro de conexão com o banco."}
        action={<Button onClick={() => void users.refetch()}>Tentar novamente</Button>}
      />
    );

  const pending = (users.data ?? []).filter((u) => u.status === UserStatus.Pending);

  const act = async (fn: Promise<unknown>, msg: string) => {
    try {
      await fn;
      toast.success(msg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Operação falhou");
    }
  };

  if (pending.length === 0)
    return <EmptyState title="Não existem solicitações pendentes." description="Novos usuários aparecem aqui após o primeiro login com Google." />;

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Solicitado em</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pending.map((u) => (
            <TableRow key={u.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    {u.avatar ? <AvatarImage src={u.avatar} alt={u.name} /> : null}
                    <AvatarFallback className="text-[10px]">{(u.name || u.email).slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{u.name || "—"}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>
              <TableCell className="text-muted-foreground">{fmt(u.createdAt)}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-[10px] uppercase">{u.status}</Badge>
              </TableCell>
              <TableCell className="space-x-2 text-right">
                <Button
                  size="sm"
                  className="gap-1"
                  disabled={approve.isPending}
                  onClick={() => act(approve.mutateAsync({ id: u.id }), "Acesso aprovado")}
                >
                  <Check className="h-4 w-4" /> Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  disabled={reject.isPending}
                  onClick={() => act(reject.mutateAsync(u.id), "Solicitação recusada")}
                >
                  <X className="h-4 w-4" /> Recusar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
