import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, MoreVertical, ShieldCheck, ShieldOff, Power, Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createUser, deleteUser } from "@/lib/admin-users.functions";

export const Route = createFileRoute("/_authenticated/admin/users")({ component: UsersPage });

const PAGE_SIZE = 10;

function UsersPage() {
  const { t } = useTranslation();
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [nu, setNu] = useState({ email: "", password: "", full_name: "", is_admin: false });
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [loading, isAdmin, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["users", q, page],
    queryFn: async () => {
      let query = supabase.from("profiles").select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
      if (q.trim()) query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);
      const { data, count, error } = await query;
      if (error) throw error;
      const ids = (data ?? []).map((p) => p.id);
      let rolesMap: Record<string, string[]> = {};
      if (ids.length) {
        const { data: r } = await supabase.from("user_roles").select("user_id, role").in("user_id", ids);
        rolesMap = (r ?? []).reduce<Record<string, string[]>>((acc, x) => {
          (acc[x.user_id] ||= []).push(x.role); return acc;
        }, {});
      }
      return { rows: data ?? [], total: count ?? 0, rolesMap };
    },
    enabled: isAdmin,
  });

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  const setActive = async (id: string, value: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_active: value }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("✓"); qc.invalidateQueries({ queryKey: ["users"] });
  };

  const toggleAdmin = async (id: string, makeAdmin: boolean) => {
    if (makeAdmin) {
      const { error } = await supabase.from("user_roles").insert({ user_id: id, role: "admin" });
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", id).eq("role", "admin");
      if (error) return toast.error(error.message);
    }
    toast.success("✓"); qc.invalidateQueries({ queryKey: ["users"] });
  };

  const remove = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteUser({ data: { id: confirmDelete } });
      toast.success("✓");
      qc.invalidateQueries({ queryKey: ["users"] });
      setConfirmDelete(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Error");
    } finally {
      setDeleting(false);
    }
  };

  const submitCreate = async () => {
    if (!nu.email || !nu.password || !nu.full_name) return;
    setCreating(true);
    try {
      await createUser({ data: nu });
      toast.success("✓");
      setCreateOpen(false);
      setNu({ email: "", password: "", full_name: "", is_admin: false });
      qc.invalidateQueries({ queryKey: ["users"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader title={t("users.title")} subtitle={t("users.subtitle")}
        action={
          <Button className="bg-brand shadow-glow" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />{t("users.newUser")}
          </Button>
        } />

      <Card className="border-border/60 shadow-soft">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={t("common.search")} className="pl-9" />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.name")}</TableHead>
              <TableHead>{t("common.role")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead>{t("common.createdAt")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ))
            ) : (data?.rows ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
            ) : (
              data!.rows.map((u) => {
                const initials = (u.full_name || u.email).split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase();
                const userRoles = data!.rolesMap[u.id] ?? [];
                const isUserAdmin = userRoles.includes("admin");
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.avatar_url ?? undefined} />
                          <AvatarFallback className="bg-brand text-primary-foreground text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{u.full_name || "—"}</span>
                          <span className="text-xs text-muted-foreground">{u.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isUserAdmin ? "default" : "secondary"} className={isUserAdmin ? "bg-brand" : ""}>
                        {isUserAdmin ? t("users.roleAdmin") : t("users.roleUser")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${u.is_active ? "text-success" : "text-muted-foreground"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? "bg-success" : "bg-muted-foreground"}`} />
                        {u.is_active ? t("common.active") : t("common.inactive")}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleAdmin(u.id, !isUserAdmin)}>
                            {isUserAdmin ? <ShieldOff className="mr-2 h-4 w-4" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                            {isUserAdmin ? "Remover admin" : "Tornar admin"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setActive(u.id, !u.is_active)}>
                            <Power className="mr-2 h-4 w-4" />
                            {u.is_active ? t("users.deactivate") : t("users.activate")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setConfirmDelete(u.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between border-t p-3 text-sm text-muted-foreground">
          <span>{data?.total ?? 0} {t("common.empty").toLowerCase().includes("nada") ? "registros" : "records"}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</Button>
            <span>{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</Button>
          </div>
        </div>
      </Card>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("users.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("users.confirmDeleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={remove} disabled={deleting} className="bg-destructive">
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("users.newUser")}</DialogTitle>
            <DialogDescription>{t("users.subtitle")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="u-name">{t("common.name")}</Label>
              <Input id="u-name" value={nu.full_name} onChange={(e) => setNu({ ...nu, full_name: e.target.value })} maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-email">{t("common.email")}</Label>
              <Input id="u-email" type="email" value={nu.email} onChange={(e) => setNu({ ...nu, email: e.target.value })} maxLength={255} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-pass">{t("auth.password")}</Label>
              <Input id="u-pass" type="password" value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} minLength={8} maxLength={128} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label htmlFor="u-admin">{t("users.roleAdmin")}</Label>
                <p className="text-xs text-muted-foreground">{t("common.role")}</p>
              </div>
              <Switch id="u-admin" checked={nu.is_admin} onCheckedChange={(v) => setNu({ ...nu, is_admin: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={submitCreate} disabled={creating || !nu.email || nu.password.length < 8 || !nu.full_name} className="bg-brand">
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
