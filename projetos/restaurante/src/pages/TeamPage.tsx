import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Info,
  Eye,
  Mail,
  Clock,
  ChevronDown,
  UserCheck,
  UserX,
  Trash2,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/hooks/useRestaurant';
import { restaurantService } from '@/services/restaurantService';
import type { RestaurantMember, RestaurantInvitation, RoleId } from '@/types/restaurant';

const ROLES_LIST: { id: RoleId; name: string; desc: string; permissions: string[] }[] = [
  {
    id: 'restaurant_admin',
    name: 'Administrador',
    desc: 'Controle total do restaurante, configurações e equipe.',
    permissions: [
      'Visualizar e editar configurações do restaurante',
      'Adicionar, editar e remover membros da equipe',
      'Gerenciar cardápio e catálogo completo',
      'Gerenciar mapa de mesas',
      'Gerenciar pedidos, salão e cozinha',
      'Acessar fechamento de caixa e relatórios',
    ],
  },
  {
    id: 'manager',
    name: 'Gerente',
    desc: 'Gerenciamento operacional, produtos e atendimento.',
    permissions: [
      'Visualizar e editar dados operacionais do restaurante',
      'Visualizar membros da equipe',
      'Gerenciar cardápio e produtos',
      'Gerenciar mesas',
      'Gerenciar e cancelar pedidos',
      'Acessar visão de caixa e cozinha',
    ],
  },
  {
    id: 'waiter',
    name: 'Atendente / Garçom',
    desc: 'Operação de mesas, pedidos e atendimento no salão.',
    permissions: [
      'Visualizar status de mesas e comandas',
      'Lançar novos pedidos em mesas e balcão',
      'Atualizar itens de pedidos do salão',
      'Consultar cardápio digital',
    ],
  },
  {
    id: 'kitchen',
    name: 'Cozinha',
    desc: 'Operação e visualização dos pedidos na cozinha.',
    permissions: [
      'Acessar o display KDS da cozinha',
      'Atualizar status de preparação dos pratos',
      'Sinalizar itens prontos para retirada',
    ],
  },
  {
    id: 'cashier',
    name: 'Caixa',
    desc: 'Operação de caixa e fechamento de contas.',
    permissions: [
      'Visualizar mesas e comandas ativas',
      'Receber pagamentos',
      'Concluir fechamento de contas',
    ],
  },
];

export function TeamPage() {
  const { user } = useAuth();
  const { currentRestaurant, can, isGlobalAdmin } = useRestaurant();

  const [members, setMembers] = useState<RestaurantMember[]>([]);
  const [invitations, setInvitations] = useState<RestaurantInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [roleModalMember, setRoleModalMember] = useState<RestaurantMember | null>(null);
  const [removeModalMember, setRemoveModalMember] = useState<RestaurantMember | null>(null);
  const [viewPermissionsRole, setViewPermissionsRole] = useState<RoleId | null>(null);

  // Form state for adding member
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<RoleId>('waiter');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected role for role change modal
  const [selectedNewRole, setSelectedNewRole] = useState<RoleId>('waiter');

  // Permission flags
  const canAdd = can('users.create');
  const canEditRole = can('users.update');
  const canRemove = can('users.remove');

  const refreshMembers = async () => {
    if (!currentRestaurant) return;
    setIsLoading(true);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        restaurantService.getRestaurantMembers(currentRestaurant.id),
        restaurantService.getRestaurantInvitations(currentRestaurant.id),
      ]);
      if (membersRes.data) {
        setMembers(membersRes.data);
      }
      if (invitesRes.data) {
        setInvitations(invitesRes.data);
      }
    } catch {
      toast.error('Erro ao carregar dados da equipe.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (!currentRestaurant) {
      return;
    }

    Promise.all([
      restaurantService.getRestaurantMembers(currentRestaurant.id),
      restaurantService.getRestaurantInvitations(currentRestaurant.id),
    ]).then(([mRes, iRes]) => {
      if (isMounted) {
        if (mRes.data) setMembers(mRes.data);
        if (iRes.data) setInvitations(iRes.data);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentRestaurant]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) return;

    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error('Informe um e-mail válido.');
      return;
    }

    const memberName = newName.trim() || cleanEmail.split('@')[0];

    setIsSubmitting(true);
    try {
      const res = await restaurantService.addMember(
        currentRestaurant!.id,
        cleanEmail,
        memberName,
        newRole,
        user?.id
      );

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Membro/convite adicionado com sucesso!');
        setAddModalOpen(false);
        setNewEmail('');
        setNewName('');
        setNewRole('waiter');
        await refreshMembers();
      }
    } catch {
      toast.error('Falha ao adicionar membro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!currentRestaurant) return;
    try {
      const res = await restaurantService.cancelInvitation(inviteId, currentRestaurant.id, user?.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Convite cancelado com sucesso.');
        setInvitations((prev) => prev.filter((i) => i.id !== inviteId));
      }
    } catch {
      toast.error('Erro ao cancelar convite.');
    }
  };

  const handleSaveRoleChange = async () => {
    if (!roleModalMember || !currentRestaurant) return;

    setIsSubmitting(true);
    try {
      const res = await restaurantService.updateMemberRole(
        roleModalMember.id,
        selectedNewRole,
        currentRestaurant.id,
        user?.id
      );

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Papel do membro alterado com sucesso!');
        setRoleModalMember(null);
        await refreshMembers();
      }
    } catch {
      toast.error('Erro ao alterar o papel do usuário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (member: RestaurantMember) => {
    if (!currentRestaurant) return;
    const newStatus = member.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await restaurantService.updateMemberStatus(
        member.id,
        newStatus,
        currentRestaurant.id,
        user?.id
      );

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          newStatus === 'suspended'
            ? 'Usuário suspenso com sucesso.'
            : 'Usuário reativado com sucesso.'
        );
        await refreshMembers();
      }
    } catch {
      toast.error('Erro ao alterar status.');
    }
  };

  const handleConfirmRemove = async () => {
    if (!removeModalMember || !currentRestaurant) return;

    setIsSubmitting(true);
    try {
      const res = await restaurantService.removeMember(
        removeModalMember.id,
        currentRestaurant.id,
        user?.id
      );

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Membro removido da equipe com sucesso.');
        setRemoveModalMember(null);
        await refreshMembers();
      }
    } catch {
      toast.error('Erro ao remover membro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeAdminCount = members.filter(
    (m) => m.role_id === 'restaurant_admin' && m.status === 'active'
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Equipe do Restaurante
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Gerencie os acessos, cargos e permissões dos operadores da unidade.
          </p>
        </div>

        {canAdd && (
          <Button
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="text-xs flex items-center gap-1.5"
          >
            <UserPlus className="h-4 w-4" />
            <span>Adicionar membro</span>
          </Button>
        )}
      </div>

      {isGlobalAdmin && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
          <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Controle Global Admin:</strong> Você pode adicionar, redefinir papéis ou remover qualquer funcionário desta unidade para suporte.
          </span>
        </div>
      )}

      {/* Team Table Card */}
      <Card className="border-border shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Membros Ativos ({members.length})
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {activeAdminCount} administrador(es)
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Users className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium">Sua equipe ainda está vazia.</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Adicione os primeiros membros da equipe para começar a configurar a operação.
              </p>
              {canAdd && (
                <Button size="sm" onClick={() => setAddModalOpen(true)}>
                  Adicionar membro
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Nome &amp; E-mail</th>
                    <th className="py-3 px-4">Papel</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Entrada</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map((member) => {
                    const isSelf = member.user_id === user?.id;
                    const isLastAdmin =
                      member.role_id === 'restaurant_admin' && activeAdminCount <= 1;

                    return (
                      <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                              {member.profile?.full_name?.slice(0, 2) ||
                                member.profile?.email?.slice(0, 2) ||
                                'OP'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate">
                                {member.profile?.full_name || 'Sem nome'}
                                {isSelf && (
                                  <span className="ml-2 text-[10px] text-muted-foreground font-normal">
                                    (você)
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-muted-foreground font-mono truncate">
                                {member.profile?.email || 'e-mail pendente'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="font-medium text-[11px] py-0.5">
                              {member.role?.name || member.role_id.replace('_', ' ')}
                            </Badge>
                            <button
                              type="button"
                              onClick={() => setViewPermissionsRole(member.role_id)}
                              className="text-muted-foreground hover:text-primary transition-colors p-1"
                              title="Ver permissões herdadas"
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {member.status === 'active' ? (
                            <Badge variant="success" className="text-[10px] py-0 px-2 font-mono">
                              Ativo
                            </Badge>
                          ) : member.status === 'invited' ? (
                            <Badge variant="warning" className="text-[10px] py-0 px-2 font-mono">
                              Convidado
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px] py-0 px-2 font-mono">
                              Suspenso
                            </Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">
                          {new Date(member.joined_at).toLocaleDateString('pt-BR')}
                        </td>

                        <td className="py-3.5 px-4 text-right">
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
                              <DropdownMenuLabel>Ações do Colaborador</DropdownMenuLabel>

                              <DropdownMenuItem asChild className="cursor-pointer">
                                <Link to={`/app/team/${member.id}`}>
                                  <Eye className="h-3.5 w-3.5 mr-2 text-primary" />
                                  <span>Ver Detalhes</span>
                                </Link>
                              </DropdownMenuItem>

                              {canEditRole && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedNewRole(member.role_id);
                                    setRoleModalMember(member);
                                  }}
                                  disabled={isLastAdmin}
                                  className="cursor-pointer font-medium text-primary"
                                >
                                  <ShieldCheck className="h-3.5 w-3.5 mr-2" />
                                  <span>Promover / Alterar Papel (HBAC)</span>
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              {canRemove && (
                                <DropdownMenuItem
                                  onClick={() => handleToggleStatus(member)}
                                  disabled={isLastAdmin}
                                  className="cursor-pointer"
                                >
                                  {member.status === 'active' ? (
                                    <>
                                      <UserX className="h-3.5 w-3.5 mr-2 text-amber-500" />
                                      <span>Suspender Colaborador</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                                      <span>Reativar Colaborador</span>
                                    </>
                                  )}
                                </DropdownMenuItem>
                              )}

                              {canRemove && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setRemoveModalMember(member)}
                                    disabled={isLastAdmin}
                                    className="cursor-pointer text-destructive focus:text-destructive font-medium"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    <span>Remover da Equipe</span>
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations Card */}
      {invitations.length > 0 && (
        <Card className="border-border shadow-xs overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-base font-semibold">
                  Convites Pendentes ({invitations.length})
                </CardTitle>
              </div>
              <span className="text-xs text-muted-foreground">
                Aguardando aceitação pelos destinatários
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">E-mail Convidado</th>
                    <th className="py-3 px-4">Papel Proposto</th>
                    <th className="py-3 px-4">Enviado em</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-foreground font-mono">
                        {inv.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
                          {ROLES_LIST.find((r) => r.id === inv.role_id)?.name || inv.role_id}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">
                        {new Date(inv.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {canRemove && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs flex items-center gap-1.5 ml-auto data-[state=open]:bg-accent"
                              >
                                <span>Ações</span>
                                <ChevronDown className="h-3 w-3 opacity-60" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Ações do Convite</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  void navigator.clipboard.writeText(inv.email);
                                  toast.success('E-mail copiado para a área de transferência.');
                                }}
                                className="cursor-pointer"
                              >
                                <Copy className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                <span>Copiar E-mail</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleCancelInvite(inv.id)}
                                className="cursor-pointer text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                <span>Revogar Convite</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal: Adicionar / Convidar Membro */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-bold text-lg text-foreground">Convidar para a Equipe</h3>
                  <p className="text-xs text-muted-foreground">
                    Convide um usuário por e-mail para operar este restaurante.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <Label htmlFor="add-email" required>
                  E-mail do colaborador
                </Label>
                <Input
                  id="add-email"
                  type="email"
                  placeholder="email@operador.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
                <p className="text-[11px] text-muted-foreground">
                  Se a pessoa já tiver conta, o convite aparecerá no painel dela para ser aceito.
                </p>
              </div>

              <div className="space-y-1.5 text-left">
                <Label htmlFor="add-name">
                  Nome (Opcional)
                </Label>
                <Input
                  id="add-name"
                  placeholder="Nome do colaborador"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5 text-left">
                <Label htmlFor="add-role" required>
                  Papel no restaurante
                </Label>
                <select
                  id="add-role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as RoleId)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  disabled={isSubmitting}
                >
                  {ROLES_LIST.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} — {r.desc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Inherited Permissions Preview (Section 26) */}
              <div className="rounded-lg border border-border/80 bg-muted/30 p-3.5 space-y-2 text-left">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Permissões herdadas para {ROLES_LIST.find((r) => r.id === newRole)?.name}:</span>
                </div>
                <ul className="space-y-1 text-[11px] text-muted-foreground">
                  {ROLES_LIST.find((r) => r.id === newRole)?.permissions.map((p) => (
                    <li key={p} className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" isLoading={isSubmitting} loadingText="Enviando...">
                  Convidar / Adicionar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Papel */}
      {roleModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-base text-foreground">
                  Promover / Alterar Papel (HBAC)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {roleModalMember.profile?.full_name || 'Membro'} ({roleModalMember.profile?.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRoleModalMember(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Nível de acesso hierárquico (HBAC):</Label>
                <span className="text-[11px] text-muted-foreground">Herança por cargo</span>
              </div>
              <div className="space-y-2">
                {ROLES_LIST.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedNewRole(r.id)}
                    className={`flex items-start justify-between p-3 rounded-lg border text-left w-full transition-colors ${
                      selectedNewRole === r.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted/40'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-xs text-foreground">{r.name}</p>
                      <p className="text-[11px] text-muted-foreground">{r.desc}</p>
                    </div>
                    {selectedNewRole === r.id && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setRoleModalMember(null)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveRoleChange} isLoading={isSubmitting} loadingText="Salvando...">
                Confirmar alteração
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Remoção (Section 41) */}
      {removeModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl border border-destructive/30 bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="font-bold text-base text-foreground">
                Remover {removeModalMember.profile?.full_name || 'membro'}?
              </h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              O usuário perderá o acesso imediato a todas as operações, dados e telas deste restaurante.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setRemoveModalMember(null)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmRemove}
                isLoading={isSubmitting}
                loadingText="Removendo..."
              >
                Remover
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer / Modal: Detalhes de Permissões */}
      {viewPermissionsRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-base text-foreground">
                  Papel: {ROLES_LIST.find((r) => r.id === viewPermissionsRole)?.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewPermissionsRole(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              {ROLES_LIST.find((r) => r.id === viewPermissionsRole)?.desc}
            </p>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">Permissões herdadas do papel:</p>
              <ul className="space-y-1.5 text-xs text-foreground/90">
                {ROLES_LIST.find((r) => r.id === viewPermissionsRole)?.permissions.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <Button size="sm" onClick={() => setViewPermissionsRole(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
