import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, isAdmin, type AppRole } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/usuarios")({ component: Usuarios });

function Usuarios() {
  const { role } = useAuth();
  const qc = useQueryClient();
  if (role && !isAdmin(role)) return <Navigate to="/dashboard" replace />;

  const { data, isLoading } = useQuery({
    queryKey: ["users-admin"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const byUser = new Map<string, AppRole[]>();
      (roles ?? []).forEach((r: any) => {
        const arr = byUser.get(r.user_id) ?? [];
        arr.push(r.role);
        byUser.set(r.user_id, arr);
      });
      return (profiles ?? []).map((p: any) => {
        const list = byUser.get(p.id) ?? [];
        const ordered: AppRole[] = ["admin", "editor", "viewer"];
        const top = ordered.find((r) => list.includes(r)) ?? "viewer";
        return { ...p, role: top as AppRole };
      });
    },
  });

  async function changeRole(userId: string, newRole: AppRole) {
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (delErr) return toast.error(delErr.message);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    if (error) return toast.error(error.message);
    toast.success("Papel atualizado");
    qc.invalidateQueries({ queryKey: ["users-admin"] });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-display font-semibold">Usuários</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie quem pode visualizar, editar e administrar.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Membros</CardTitle>
          <CardDescription>{data?.length ?? 0} usuário(s) registrado(s).</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({length: 4}).map((_,i) => <div key={i} className="h-14 rounded bg-muted animate-pulse" />)}</div>
          ) : (
            <div className="divide-y">
              {data?.map((u: any) => (
                <div key={u.id} className="flex items-center gap-4 py-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={u.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {(u.full_name ?? u.email ?? "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{u.full_name ?? "Sem nome"}</div>
                    <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                  </div>
                  <Badge variant="secondary" className="capitalize">{u.role}</Badge>
                  <Select value={u.role} onValueChange={(v) => changeRole(u.id, v as AppRole)}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
