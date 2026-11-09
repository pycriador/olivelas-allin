import { useEffect, useState } from 'react';
import { ArrowLeft, Shield, Trash2, Ban, CheckCircle2 } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UserRow {
  user_id: string;
  email: string | null;
  user_name: string;
  blocked: boolean;
  role: 'admin' | 'editor' | 'viewer';
}

export default function UserManagementPage() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('admin-manage-users', {
      body: { type: 'list' },
    });
    if (error) toast.error(error.message);
    else setUsers((data?.users ?? []) as UserRow[]);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (roleLoading) return <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>;
  if (!isAdmin) return <Navigate to="/settings" replace />;

  const setRole = async (uid: string, role: UserRow['role']) => {
    const { error } = await supabase.functions.invoke('admin-manage-users', {
      body: { type: 'set_role', user_id: uid, role },
    });
    if (error) return toast.error(error.message);
    toast.success('Papel atualizado');
    load();
  };

  const setBlocked = async (uid: string, blocked: boolean) => {
    const { error } = await supabase.functions.invoke('admin-manage-users', {
      body: { type: 'set_blocked', user_id: uid, blocked },
    });
    if (error) return toast.error(error.message);
    toast.success(blocked ? 'Usuário bloqueado' : 'Usuário desbloqueado');
    load();
  };

  const deleteUser = async (uid: string) => {
    if (!confirm('Excluir este usuário permanentemente? Esta ação não pode ser desfeita.')) return;
    const { error } = await supabase.functions.invoke('admin-manage-users', {
      body: { type: 'delete', user_id: uid },
    });
    if (error) return toast.error(error.message);
    toast.success('Usuário excluído');
    load();
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary-light)/0.3)_0%,_transparent_70%)] pb-12">
      <header className="px-5 pt-14 pb-6">
        <div className="max-w-2xl mx-auto">
          <Link to="/settings" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </Link>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5.5 h-5.5 text-primary" />
            </div>
            Gerenciar usuários
          </h1>
          <p className="text-sm text-muted-foreground/80 mt-2 ml-[3.25rem]">Defina papéis, bloqueie ou exclua contas.</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 space-y-3">
        {loading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Carregando usuários...</p>
          </div>
        )}

        {!loading && users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
          </div>
        )}

        {users.map((u) => {
          const isSelf = u.user_id === user?.id;
          return (
            <div
              key={u.user_id}
              className={cn(
                "rounded-xl border bg-card shadow-[var(--shadow-card)] p-5 space-y-4 transition-all",
                u.blocked && "opacity-60"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground break-all">{u.email ?? '(sem e-mail)'}</p>
                  {u.user_name && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5">{u.user_name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {u.blocked && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-destructive bg-destructive/10 px-2 py-1 rounded-full">
                      Bloqueado
                    </span>
                  )}
                  {isSelf && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                      Você
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-muted-foreground">Papel:</label>
                <select
                  value={u.role}
                  disabled={isSelf}
                  onChange={(e) => setRole(u.user_id, e.target.value as UserRow['role'])}
                  className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-shadow"
                >
                  <option value="viewer">Visualizador</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setBlocked(u.user_id, !u.blocked)}
                  disabled={isSelf}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-lg border transition-all",
                    u.blocked
                      ? "border-success/30 text-success hover:bg-success/5"
                      : "border-border/70 text-foreground/70 hover:bg-secondary/50 hover:border-border"
                  )}
                >
                  {u.blocked ? <><CheckCircle2 className="w-3.5 h-3.5" /> Desbloquear</> : <><Ban className="w-3.5 h-3.5" /> Bloquear</>}
                </button>
                <button
                  onClick={() => deleteUser(u.user_id)}
                  disabled={isSelf}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-lg border border-destructive/25 text-destructive hover:bg-destructive/5 disabled:opacity-50 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
