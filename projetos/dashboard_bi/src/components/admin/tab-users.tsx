import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { logAudit } from "@/lib/audit";
import { toast } from "sonner";
import { Send, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Database } from "@/integrations/supabase/types";

type Role = Database["public"]["Enums"]["app_role"];
const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["administrator", "dba", "developer", "analyst", "user"]),
});
type InviteValues = z.infer<typeof inviteSchema>;

const ROLES: Role[] = ["administrator", "dba", "developer", "analyst", "user"];

export function AdminUsersTab() {
  const { t } = useTranslation();
  const { org } = useCurrentOrg();
  const orgId = org?.id;
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const inviteForm = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "user" },
  });

  const users = useQuery({
    queryKey: ["admin-users", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data: members } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", orgId!);
      const userIds = (members ?? []).map((m) => m.user_id);
      if (!userIds.length) return [];
      const [profiles, roles] = await Promise.all([
        supabase.from("profiles").select("*").in("id", userIds),
        supabase
          .from("user_roles")
          .select("user_id, role")
          .eq("organization_id", orgId!)
          .in("user_id", userIds),
      ]);
      const roleMap = new Map<string, Role>();
      roles.data?.forEach((r) => roleMap.set(r.user_id, r.role));
      return (profiles.data ?? []).map((p) => ({
        ...p,
        role: roleMap.get(p.id) ?? ("user" as Role),
      }));
    },
  });

  const invite = useMutation({
    mutationFn: async (values: InviteValues) => {
      if (!orgId) throw new Error("no org");
      const email = values.email.trim().toLowerCase();
      const { error } = await supabase.from("invitations").insert({
        organization_id: orgId,
        email,
        role: values.role,
      });
      if (error) throw error;
      await logAudit({
        organizationId: orgId,
        action: "invitation.create",
        resource: "invitations",
        metadata: { email, role: values.role },
      });
    },
    onSuccess: () => {
      toast.success(t("admin.users.inviteSent"));
      setInviteOpen(false);
      inviteForm.reset({ email: "", role: "user" });
      qc.invalidateQueries({ queryKey: ["admin-invitations"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changeRole = useMutation({
    mutationFn: async (input: { userId: string; role: Role }) => {
      if (!orgId) throw new Error("no org");
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", input.userId)
        .eq("organization_id", orgId);
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: input.userId, organization_id: orgId, role: input.role });
      if (error) throw error;
      await logAudit({
        organizationId: orgId,
        action: "user.role.update",
        resource: "user_roles",
        resourceId: input.userId,
        metadata: { role: input.role },
      });
    },
    onSuccess: () => {
      toast.success(t("admin.users.roleUpdated"));
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (users.data ?? []).filter((u) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (u.full_name ?? "").toLowerCase().includes(s) ||
      (u.display_name ?? "").toLowerCase().includes(s)
    );
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>{t("admin.users.title")}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.users.subtitle")}</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Send className="mr-2 h-4 w-4" />
              {t("admin.users.invite")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.users.invite")}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={inviteForm.handleSubmit((values) => invite.mutate(values))}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="invite-email">{t("auth.email")}</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="usuario@empresa.com"
                  {...inviteForm.register("email")}
                />
                {inviteForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{t("errors.invalidEmail")}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-role">{t("admin.users.role")}</Label>
                <Select
                  value={inviteForm.watch("role")}
                  onValueChange={(v) => inviteForm.setValue("role", v as Role)}
                >
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="capitalize">
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setInviteOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={invite.isPending}>
                  {t("admin.users.sendInvite")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("common.search")}
            className="pl-9"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.users.name")}</TableHead>
              <TableHead>{t("admin.users.department")}</TableHead>
              <TableHead>{t("admin.users.role")}</TableHead>
              <TableHead>{t("admin.users.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="font-medium">{u.display_name ?? u.full_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{u.job_title ?? ""}</div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {u.department ?? "—"}
                </TableCell>
                <TableCell>
                  <Select
                    value={u.role}
                    onValueChange={(v) => changeRole.mutate({ userId: u.id, role: v as Role })}
                  >
                    <SelectTrigger className="h-8 w-36 capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r} className="capitalize">
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={u.status === "active" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {u.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {!filtered.length && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  —
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
