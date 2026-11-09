import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, MailPlus, MoreHorizontal, Pause, Play, RefreshCw, Send, Trash2, UserCog, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { PermissionGate } from "@/components/app/PermissionGate";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser, useTenant } from "@/hooks/useTenant";
import { MembershipService } from "@/services/memberships";
import {
  ASSIGNABLE_ROLES,
  INVITATION_STATUS_LABEL,
  MEMBERSHIP_STATUS_LABEL,
  ROLE_LABEL,
  describeError,
  formatDateTime,
  formatDate,
} from "@/services/types";
import type { OrgRole, MembershipStatus, Invitation } from "@/services/types";

const ROLE_TONE: Record<string, string> = {
  OWNER: "bg-amber-500/10 text-amber-600",
  ADMIN: "bg-sky-500/10 text-sky-600",
  MEMBER: "bg-emerald-500/10 text-emerald-600",
  VIEWER: "bg-muted text-muted-foreground",
};

const MEMBER_TONE: Record<MembershipStatus, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-600",
  INVITED: "bg-amber-500/10 text-amber-600",
  SUSPENDED: "bg-destructive/10 text-destructive",
  REMOVED: "bg-muted text-muted-foreground",
};

const INVITE_TONE: Record<string, string> = {
  INVITED: "bg-amber-500/10 text-amber-600",
  ACCEPTED: "bg-emerald-500/10 text-emerald-600",
  EXPIRED: "bg-muted text-muted-foreground",
  REVOKED: "bg-destructive/10 text-destructive",
};

export const Route = createFileRoute("/settings/users")({
  head: () => ({
    meta: [
      { title: "Usuários — RaffleHub" },
      { name: "description", content: "Gerencie membros, papéis e convites da organização." },
      { property: "og:title", content: "Usuários — RaffleHub" },
      { property: "og:description", content: "Gerencie membros, papéis e convites da organização." },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const { user } = useCurrentUser();
  const { organizationId, organization } = useTenant();
  const queryClient = useQueryClient();
  const limit = 20;

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<OrgRole | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<MembershipStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteTicket, setInviteTicket] = useState<{ token: string } | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<null | { kind: "remove"; id: string; name: string }>(null);
  const [transferTarget, setTransferTarget] = useState<null | { id: string; name: string }>(null);
  const [confirmation, setConfirmation] = useState("");

  const debouncedSearch = useDebounce(search, 400);
  const orgId = organizationId as string;

  const membersQuery = useQuery({
    queryKey: ["members", orgId, debouncedSearch, roleFilter, statusFilter, page],
    queryFn: () =>
      MembershipService.listMembers(orgId, {
        search: debouncedSearch || undefined,
        role: roleFilter === "ALL" ? null : roleFilter,
        status: statusFilter === "ALL" ? null : statusFilter,
        limit,
        offset: (page - 1) * limit,
      }),
    enabled: Boolean(orgId),
  });
  const members = membersQuery.data?.rows ?? [];
  const total = membersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const invitationsQuery = useQuery({
    queryKey: ["invitations", orgId],
    queryFn: () => MembershipService.listInvitations(orgId),
    enabled: Boolean(orgId),
  });
  const invitations = invitationsQuery.data ?? [];

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["members", orgId] });
    void queryClient.invalidateQueries({ queryKey: ["invitations", orgId] });
  };

  const inviteMutation = useMutation({
    mutationFn: (input: { email: string; role: OrgRole; message?: string | undefined }) =>
      MembershipService.invite(orgId, input.email, input.role, input.message),
    onSuccess: (ticket) => {
      invalidate();
      setInviteOpen(false);
      setInviteTicket(ticket);
      toast.success("Convite enviado com sucesso.");
    },
    onError: (err) => toast.error(describeError(err)),
  });

  const resendMutation = useMutation({
    mutationFn: (invitationId: string) => MembershipService.resendInvitation(invitationId),
    onSuccess: (ticket) => {
      invalidate();
      setInviteTicket(ticket);
      toast.success("Convite reenviado.");
    },
    onError: (err) => toast.error(describeError(err)),
  });

  const revokeMutation = useMutation({
    mutationFn: (invitationId: string) => MembershipService.revokeInvitation(invitationId),
    onSuccess: () => {
      invalidate();
      toast.success("Convite cancelado.");
    },
    onError: (err) => toast.error(describeError(err)),
  });

  const roleMutation = useMutation({
    mutationFn: ({ membershipId, role }: { membershipId: string; role: OrgRole }) =>
      MembershipService.changeRole(membershipId, role),
    onSuccess: () => {
      invalidate();
      toast.success("Papel atualizado.");
    },
    onError: (err) => toast.error(describeError(err)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ membershipId, status }: { membershipId: string; status: "ACTIVE" | "SUSPENDED" }) =>
      MembershipService.setStatus(membershipId, status),
    onSuccess: () => {
      invalidate();
      toast.success("Acesso atualizado.");
    },
    onError: (err) => toast.error(describeError(err)),
  });

  const removeMutation = useMutation({
    mutationFn: (membershipId: string) => MembershipService.remove(membershipId),
    onSuccess: () => {
      invalidate();
      setConfirmTarget(null);
      toast.success("Usuário removido da organização.");
    },
    onError: (err) => toast.error(describeError(err)),
  });

  const transferMutation = useMutation({
    mutationFn: ({ membershipId, confirmation }: { membershipId: string; confirmation: string }) =>
      MembershipService.transferOwnership(membershipId, confirmation),
    onSuccess: () => {
      invalidate();
      setTransferTarget(null);
      setConfirmation("");
      toast.success("Propriedade transferida.");
    },
    onError: (err) => toast.error(describeError(err)),
  });

  const copyInviteLink = (token: string) => {
    const url = MembershipService.inviteLink(token);
    void navigator.clipboard?.writeText(url);
    toast.success("Link copiado.");
  };

  return (
    <AppShell
      title="Usuários"
      description="Membros, papéis e convites da organização ativa."
      actions={
        <PermissionGate permission="users.invite" silent>
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <MailPlus className="size-4" /> Convidar
          </Button>
        </PermissionGate>
      }
    >
      <PermissionGate permission="users.view">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Membros</CardTitle>
              <CardDescription>
                {total} {total === 1 ? "membro" : "membros"} na organização
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Input
                  placeholder="Buscar por nome ou e-mail…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="max-w-xs"
                />
                <Select
                  value={roleFilter}
                  onValueChange={(v) => {
                    setRoleFilter((v || "ALL") as OrgRole | "ALL");
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Papel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos os papéis</SelectItem>
                    {ASSIGNABLE_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter((v || "ALL") as MembershipStatus | "ALL");
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Situação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas as situações</SelectItem>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="INVITED">Convidado</SelectItem>
                    <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {membersQuery.isPending ? (
                <Skeleton className="h-48 w-full" />
              ) : members.length === 0 ? (
                <div className="rounded-lg border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
                  Nenhum membro encontrado.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Papel</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead>Entrou em</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((m) => {
                      const isSelf = m.user_id === user?.id;
                      return (
                        <TableRow key={m.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="size-9">
                                <AvatarImage src={m.avatar_url ?? undefined} alt={m.full_name ?? m.email ?? ""} />
                                <AvatarFallback>
                                  {(m.full_name ?? m.email ?? "?").slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate font-medium">
                                  {m.full_name ?? "Sem nome"}
                                  {isSelf && <span className="ml-1 text-xs text-muted-foreground">(você)</span>}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <PermissionGate permission="users.update" silent>
                              {m.role !== "OWNER" ? (
                                <Select
                                  value={m.role}
                                  onValueChange={(v) => roleMutation.mutate({ membershipId: m.id, role: v as OrgRole })}
                                >
                                  <SelectTrigger className="h-8 w-40" aria-label="Alterar papel">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ASSIGNABLE_ROLES.map((r) => (
                                      <SelectItem key={r} value={r}>
                                        {ROLE_LABEL[r]}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Badge className={ROLE_TONE[m.role]} variant="secondary">
                                  {ROLE_LABEL[m.role]}
                                </Badge>
                              )}
                            </PermissionGate>
                          </TableCell>
                          <TableCell>
                            <Badge className={MEMBER_TONE[m.status]} variant="secondary">
                              {MEMBERSHIP_STATUS_LABEL[m.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(m.created_at)}
                          </TableCell>
                          <TableCell>
                            <PermissionGate
                              permission={["users.update", "users.remove", "ownership.transfer"]}
                              silent
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="size-8" aria-label="Ações">
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {m.role !== "OWNER" && (
                                    <>
                                      {m.status === "ACTIVE" && (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            statusMutation.mutate({ membershipId: m.id, status: "SUSPENDED" })
                                          }
                                        >
                                          <Pause className="size-4" /> Suspender acesso
                                        </DropdownMenuItem>
                                      )}
                                      {m.status === "SUSPENDED" && (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            statusMutation.mutate({ membershipId: m.id, status: "ACTIVE" })
                                          }
                                        >
                                          <Play className="size-4" /> Reativar acesso
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() =>
                                          setConfirmTarget({
                                            kind: "remove",
                                            id: m.id,
                                            name: m.full_name ?? m.email ?? "este usuário",
                                          })
                                        }
                                      >
                                        <Trash2 className="size-4" /> Remover da organização
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {m.role === "OWNER" && m.status === "ACTIVE" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setTransferTarget({
                                          id: m.id,
                                          name: m.full_name ?? m.email ?? "este usuário",
                                        })
                                      }
                                    >
                                      <UserCog className="size-4" /> Tornar proprietário
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </PermissionGate>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Página {page} de {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Convites</CardTitle>
              <CardDescription>Pendentes e históricos de convites enviados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {invitationsQuery.isPending ? (
                <Skeleton className="h-32 w-full" />
              ) : invitations.length === 0 ? (
                <div className="rounded-lg border border-dashed px-6 py-8 text-center text-sm text-muted-foreground">
                  Nenhum convite enviado ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {invitations.map((inv: Invitation) => (
                    <div key={inv.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{inv.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {ROLE_LABEL[inv.role]} · {formatDateTime(inv.last_sent_at)}
                          </p>
                        </div>
                        <Badge className={INVITE_TONE[inv.status]} variant="secondary">
                          {INVITATION_STATUS_LABEL[inv.status]}
                        </Badge>
                      </div>
                      {inv.status === "INVITED" && (
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => resendMutation.mutate(inv.id)}
                            disabled={resendMutation.isPending}
                          >
                            <RefreshCw className="size-3.5" /> Reenviar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => revokeMutation.mutate(inv.id)}
                            disabled={revokeMutation.isPending}
                          >
                            <X className="size-3.5" /> Cancelar
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <InviteDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          onInvite={(input) => inviteMutation.mutate(input)}
          pending={inviteMutation.isPending}
        />

        <Dialog open={Boolean(inviteTicket)} onOpenChange={(o) => !o && setInviteTicket(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link do convite</DialogTitle>
              <DialogDescription>
                Compartilhe o link com a pessoa convidada. Ele é válido por até 7 dias e pode ser
                usado apenas uma vez.
              </DialogDescription>
            </DialogHeader>
            {inviteTicket && (
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-md border bg-muted px-3 py-2 text-xs">
                  {MembershipService.inviteLink(inviteTicket.token)}
                </code>
                <Button size="sm" variant="outline" onClick={() => copyInviteLink(inviteTicket.token)}>
                  <Copy className="size-4" />
                </Button>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setInviteTicket(null)}>Concluir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={Boolean(confirmTarget)} onOpenChange={(o) => !o && setConfirmTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover membro</AlertDialogTitle>
              <AlertDialogDescription>
                Remover <span className="font-medium">{confirmTarget?.name}</span> da organização
                revoga imediatamente o acesso à área administrativa.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={removeMutation.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  if (confirmTarget) removeMutation.mutate(confirmTarget.id);
                }}
              >
                {removeMutation.isPending ? "Removendo…" : "Remover"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={Boolean(transferTarget)} onOpenChange={(o) => !o && setTransferTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Transferir propriedade</AlertDialogTitle>
              <AlertDialogDescription>
                A propriedade será transferida para <span className="font-medium">{transferTarget?.name}</span>.
                Digite o nome da organização ({organization?.name}) para confirmar.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor="confirmation">Nome da organização</Label>
              <Input
                id="confirmation"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder={organization?.name ?? ""}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                disabled={transferMutation.isPending || confirmation.trim() !== organization?.name}
                onClick={(e) => {
                  e.preventDefault();
                  if (transferTarget) {
                    transferMutation.mutate({
                      membershipId: transferTarget.id,
                      confirmation: confirmation.trim(),
                    });
                  }
                }}
              >
                {transferMutation.isPending ? "Transferindo…" : "Confirmar transferência"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PermissionGate>
    </AppShell>
  );
}

function InviteDialog({
  open,
  onOpenChange,
  onInvite,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (input: { email: string; role: OrgRole; message?: string | undefined }) => void;
  pending: boolean;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("MEMBER");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const reset = () => {
    setEmail("");
    setRole("MEMBER");
    setMessage("");
    setError("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError("Informe um e-mail válido.");
      return;
    }
    setError("");
    onInvite({ email: trimmed, role, message: message.trim() || undefined });
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Convidar membro</DialogTitle>
            <DialogDescription>
              O convite é enviado por link único. O convidado precisa ter uma conta no RaffleHub.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">E-mail</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="nome@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Papel</Label>
              <Select value={role} onValueChange={(v) => setRole(v as OrgRole)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABEL[r]} — {r === "VIEWER" ? "apenas visualização" : r === "ADMIN" ? "gerencia tudo" : "opera o dia a dia"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-message">Mensagem (opcional)</Label>
              <Textarea
                id="invite-message"
                rows={2}
                placeholder="Mensagem que aparecerá no convite…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Enviando…" : (
                <>
                  <Send className="size-4" /> Enviar convite
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}