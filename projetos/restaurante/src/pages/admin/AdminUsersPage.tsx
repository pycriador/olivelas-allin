import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Eye,
  Shield,
  UserX,
  UserCheck,
  ChevronDown,
  Edit2,
  Trash2,
  Crown,
  KeyRound,
  ShieldAlert,
  Headphones,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilterBar } from '@/components/common/FilterBar';
import { PaginationControl } from '@/components/common/PaginationControl';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  CreateUserModal,
  EditUserModal,
  RoleConfirmModal,
  DeleteUserModal,
} from '@/components/admin/AdminUserModals';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { useAuth } from '@/hooks/useAuth';
import { iamService } from '@/services/iamService';
import type { PlatformUser, PlatformRoleId, UserStatus } from '@/types/iam';

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const {
    page,
    pageSize,
    search,
    status,
    role,
    setFilter,
    setPage,
    setPageSize,
    resetFilters,
  } = useUrlFilters({ defaultPageSize: 10 });

  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // CRUD Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<PlatformUser | null>(null);
  const [roleModal, setRoleModal] = useState<{
    user: PlatformUser;
    targetRole: PlatformRoleId;
    action: 'assign' | 'remove';
  } | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await iamService.getUsers({
        page,
        pageSize,
        search,
        status,
        role,
      });
      setUsers(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error('Erro ao carregar usuários.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, status, role]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (user: PlatformUser) => {
    const nextStatus: UserStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await iamService.updateUserStatus(user.id, nextStatus, currentUser?.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Usuário ${nextStatus === 'suspended' ? 'suspenso' : 'reativado'} com sucesso.`);
        await fetchUsers();
      }
    } catch {
      toast.error('Erro ao alterar status do usuário.');
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      const res = await iamService.resetUserPassword(email, currentUser?.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Instruções de redefinição enviadas para ${email}.`);
      }
    } catch {
      toast.error('Erro ao solicitar redefinição de senha.');
    }
  };

  const filterFields = [
    {
      key: 'status',
      label: 'Todos os Status',
      options: [
        { label: 'Ativos', value: 'active' },
        { label: 'Suspensos', value: 'suspended' },
        { label: 'Desativados', value: 'deactivated' },
      ],
    },
    {
      key: 'role',
      label: 'Todos os Papéis Globais',
      options: [
        { label: 'Global Admin', value: 'global_admin' },
        { label: 'Suporte Plataforma', value: 'platform_support' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Gestão Global de Usuários
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Administre contas, papéis de plataforma e associações aos restaurantes.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsCreateOpen(true)} className="text-xs">
          <UserPlus className="h-3.5 w-3.5 mr-1.5" />
          Novo Usuário
        </Button>
      </div>

      {/* URL Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={(val) => setFilter('search', val)}
        searchPlaceholder="Buscar por nome ou e-mail..."
        filters={filterFields}
        filterValues={{ status, role }}
        onFilterChange={(key, val) => setFilter(key, val)}
        onReset={resetFilters}
        onRefresh={fetchUsers}
        isLoading={isLoading}
      />

      {/* Table Card */}
      <Card className="border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border/70 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">Papel Plataforma</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Restaurantes</th>
                <th className="px-4 py-3">Criado em</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Carregando usuários...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum usuário encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSuper = u.platform_roles.includes('global_admin');
                  const isMainOwner = Boolean(u.email && u.email.toLowerCase() === 'willian.o.jesus@gmail.com');

                  return (
                    <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{u.full_name || 'Sem nome'}</div>
                        <div className="text-[11px] text-muted-foreground">{u.email}</div>
                      </td>

                      <td className="px-4 py-3">
                        {isSuper ? (
                          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px]">
                            👑 global_admin
                          </Badge>
                        ) : u.platform_roles.length > 0 ? (
                          <Badge variant="outline" className="text-[10px]">
                            {u.platform_roles.join(', ')}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Usuário Comum</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <Badge
                          variant={u.status === 'active' ? 'default' : 'destructive'}
                          className="text-[10px] capitalize"
                        >
                          {u.status}
                        </Badge>
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-muted-foreground">
                          {u.memberships_count} restaurante(s)
                        </span>
                      </td>

                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs flex items-center gap-1.5 data-[state=open]:bg-accent"
                            >
                              <span>Ações</span>
                              <ChevronDown className="h-3 w-3 opacity-60" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Ações do Usuário</DropdownMenuLabel>

                            <DropdownMenuItem asChild className="cursor-pointer">
                              <Link to={`/admin/users/${u.id}`}>
                                <Eye className="h-3.5 w-3.5 mr-2 text-primary" />
                                <span>Ver Detalhes</span>
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => setEditingUser(u)}
                              className="cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5 mr-2 text-primary" />
                              <span>Editar Dados</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* Platform Roles: Global Admin */}
                            {!isSuper ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  setRoleModal({
                                    user: u,
                                    targetRole: 'global_admin',
                                    action: 'assign',
                                  })
                                }
                                className="cursor-pointer text-amber-600 dark:text-amber-400 font-medium"
                              >
                                <Crown className="h-3.5 w-3.5 mr-2" />
                                <span>Tornar Administrador Global</span>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  setRoleModal({
                                    user: u,
                                    targetRole: 'global_admin',
                                    action: 'remove',
                                  })
                                }
                                disabled={isMainOwner}
                                className="cursor-pointer text-destructive"
                              >
                                <ShieldAlert className="h-3.5 w-3.5 mr-2" />
                                <span>Remover Administrador Global</span>
                              </DropdownMenuItem>
                            )}

                            {/* Platform Roles: Support */}
                            {!u.platform_roles.includes('platform_support') ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  setRoleModal({
                                    user: u,
                                    targetRole: 'platform_support',
                                    action: 'assign',
                                  })
                                }
                                className="cursor-pointer"
                              >
                                <Headphones className="h-3.5 w-3.5 mr-2 text-blue-500" />
                                <span>Tornar Suporte Plataforma</span>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  setRoleModal({
                                    user: u,
                                    targetRole: 'platform_support',
                                    action: 'remove',
                                  })
                                }
                                className="cursor-pointer text-muted-foreground"
                              >
                                <ShieldAlert className="h-3.5 w-3.5 mr-2" />
                                <span>Remover Suporte Plataforma</span>
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            {/* Password Reset */}
                            <DropdownMenuItem
                              onClick={() => {
                                if (u.email) {
                                  handleResetPassword(u.email);
                                } else {
                                  toast.error('Usuário não possui e-mail registrado.');
                                }
                              }}
                              className="cursor-pointer"
                            >
                              <KeyRound className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                              <span>Redefinir Senha</span>
                            </DropdownMenuItem>

                            {/* Suspend / Reactivate */}
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(u)}
                              disabled={isMainOwner}
                              className="cursor-pointer"
                            >
                              {u.status === 'active' ? (
                                <>
                                  <UserX className="h-3.5 w-3.5 mr-2 text-amber-500" />
                                  <span>Suspender Usuário</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                                  <span>Reativar Usuário</span>
                                </>
                              )}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* Delete User */}
                            <DropdownMenuItem
                              onClick={() => setDeletingUser(u)}
                              disabled={isMainOwner}
                              className="cursor-pointer text-destructive focus:text-destructive font-medium"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              <span>Excluir Usuário</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* URL Pagination */}
        <PaginationControl
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      {/* CRUD Modals */}
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={fetchUsers}
      />

      <EditUserModal
        user={editingUser}
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        onUpdated={fetchUsers}
      />

      {roleModal && (
        <RoleConfirmModal
          user={roleModal.user}
          targetRole={roleModal.targetRole}
          action={roleModal.action}
          isOpen={Boolean(roleModal)}
          onClose={() => setRoleModal(null)}
          onConfirmed={fetchUsers}
        />
      )}

      <DeleteUserModal
        user={deletingUser}
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        onDeleted={fetchUsers}
      />
    </div>
  );
}
