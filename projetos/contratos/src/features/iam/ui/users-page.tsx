import { useState } from "react";
import { Mail, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/features/dashboard/ui/page-header";
import { useWorkspaceMembers } from "@/features/iam/hooks/use-members";
import { usePermissions } from "@/features/iam/hooks/use-permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { auditService } from "@/services/audit";
import { useWorkspaceStore } from "@/stores/workspace";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  workspace_admin: "Workspace Admin",
  manager: "Manager",
  editor: "Editor",
  reviewer: "Reviewer",
  viewer: "Viewer",
};

const STATUS_TONE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  invited: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  suspended: "bg-muted text-muted-foreground",
};

export function UsersPage() {
  const { members, isLoading } = useWorkspaceMembers();
  const { has } = usePermissions();
  const workspace = useWorkspaceStore((s) => s.workspace);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const canManage = has("users.manage");

  const { data: rolesByUser } = useQuery({
    queryKey: ["iam", "roles-by-user", workspace?.id],
    queryFn: async () => {
      const userIds = (members ?? []).map((m) => m.user_id);
      if (userIds.length === 0) return new Map<string, string[]>();
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds)
        .eq("workspace_id", workspace!.id);
      if (error) throw error;
      const map = new Map<string, string[]>();
      for (const row of data) {
        const current = map.get(row.user_id) ?? [];
        current.push(row.role);
        map.set(row.user_id, current);
      }
      return map;
    },
    enabled: !!workspace && (members?.length ?? 0) > 0,
  });

  const handleInvite = async () => {
    if (!inviteEmail || !workspace) return;
    await auditService.record({
      workspaceId: workspace.id,
      action: "invitation",
      entity: "users",
      entityId: inviteEmail,
      metadata: { email: inviteEmail, role: inviteRole },
    });
    toast.success("Convite registrado");
    setInviteOpen(false);
    setInviteEmail("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        description="Gerencie membros, papéis e acesso ao workspace."
        actions={
          canManage ? (
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="mr-2 size-4" />
              Convidar usuário
            </Button>
          ) : undefined
        }
      />

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : members && members.length > 0 ? (
            <div className="divide-y divide-border/60">
              {members.map((membership) => {
                const profile = membership.profile;
                const initials = (profile?.full_name ?? profile?.email ?? "?")
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                const userRoles = rolesByUser?.get(membership.user_id) ?? [];
                const roleLabel =
                  userRoles.length > 0 ? ROLE_LABEL[userRoles[0]!] : membership.status;
                return (
                  <div key={membership.id} className="flex items-center gap-4 px-6 py-4">
                    <Avatar className="size-9 rounded-lg">
                      <AvatarImage src={profile?.avatar_url ?? undefined} />
                      <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{profile?.full_name ?? "Usuário"}</p>
                        {profile?.mfa_enabled && (
                          <ShieldCheck className="size-3.5 text-primary" aria-label="MFA ativado" />
                        )}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{profile?.email}</p>
                    </div>
                    <div className="hidden md:block">
                      <Badge variant="secondary" className="font-medium">
                        {roleLabel}
                      </Badge>
                    </div>
                    <Badge className={STATUS_TONE[membership.status] ?? ""} variant="outline">
                      {membership.status}
                    </Badge>
                    <span className="hidden text-xs text-muted-foreground lg:block">
                      {membership.joined_at
                        ? formatDistanceToNow(new Date(membership.joined_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })
                        : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="Nenhum usuário no workspace"
              description="Convide membros e configure papéis para começar a colaborar."
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar usuário</DialogTitle>
            <DialogDescription>
              Envie um convite e atribua um papel para o novo membro do workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="novo@empresa.com"
                  className="pl-9"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Papel</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger id="invite-role">
                  <SelectValue placeholder="Selecione o papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="reviewer">Reviewer</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInvite} disabled={!inviteEmail}>
              Enviar convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
