import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  AlertTriangle,
  Loader2,
  X,
  Mail,
  Clock,
  Ban,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { restaurantService } from '@/services/restaurantService';
import { useAuth } from '@/hooks/useAuth';
import type { Restaurant, RestaurantMember, RestaurantInvitation, RoleId } from '@/types/restaurant';

interface AdminManageEmployeesModalProps {
  restaurant: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
}

const ROLES: { id: RoleId; label: string; desc: string }[] = [
  { id: 'restaurant_admin', label: 'Administrador', desc: 'Controle total da unidade e funcionários.' },
  { id: 'manager', label: 'Gerente', desc: 'Operação, catálogo de cardápio e salão.' },
  { id: 'waiter', label: 'Garçom', desc: 'Atendimento e comandas nas mesas.' },
  { id: 'kitchen', label: 'Cozinha', desc: 'Visualização e preparação KDS.' },
  { id: 'cashier', label: 'Caixa', desc: 'Fechamento de contas e recebimentos.' },
];

export function AdminManageEmployeesModal({
  restaurant,
  isOpen,
  onClose,
}: AdminManageEmployeesModalProps) {
  const { user } = useAuth();

  const [members, setMembers] = useState<RestaurantMember[]>([]);
  const [invitations, setInvitations] = useState<RestaurantInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'members' | 'invitations' | 'add'>('members');

  // Form states
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<RoleId>('waiter');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Remove confirmation modal
  const [memberToRemove, setMemberToRemove] = useState<RestaurantMember | null>(null);

  const loadData = useCallback(async () => {
    if (!restaurant) return;
    setIsLoading(true);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        restaurantService.getRestaurantMembers(restaurant.id),
        restaurantService.getRestaurantInvitations(restaurant.id),
      ]);

      if (membersRes.data) {
        setMembers(membersRes.data);
      }
      if (invitesRes.data) {
        setInvitations(invitesRes.data);
      }
    } catch {
      toast.error('Erro ao carregar colaboradores do restaurante.');
    } finally {
      setIsLoading(false);
    }
  }, [restaurant]);

  useEffect(() => {
    if (isOpen && restaurant) {
      void loadData();
      setActiveTab('members');
      setEmail('');
      setName('');
      setRole('waiter');
    }
  }, [isOpen, restaurant, loadData]);

  if (!isOpen || !restaurant) return null;

  const handleAddOrInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error('Informe um e-mail válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Try add or invite
      const res = await restaurantService.addMember(
        restaurant.id,
        cleanEmail,
        name.trim() || cleanEmail.split('@')[0],
        role,
        user?.id
      );

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Funcionário/convite cadastrado com sucesso!');
        setEmail('');
        setName('');
        setRole('waiter');
        setActiveTab('members');
        await loadData();
      }
    } catch {
      toast.error('Falha ao adicionar funcionário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: RoleId) => {
    try {
      const res = await restaurantService.updateMemberRole(
        memberId,
        newRole,
        restaurant.id,
        user?.id
      );
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Papel do funcionário alterado com sucesso!');
        await loadData();
      }
    } catch {
      toast.error('Erro ao atualizar papel.');
    }
  };

  const handleStatusToggle = async (member: RestaurantMember) => {
    const newStatus = member.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await restaurantService.updateMemberStatus(
        member.id,
        newStatus,
        restaurant.id,
        user?.id
      );
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          newStatus === 'suspended' ? 'Funcionário suspenso.' : 'Funcionário reativado.'
        );
        await loadData();
      }
    } catch {
      toast.error('Erro ao alterar status.');
    }
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    setIsSubmitting(true);
    try {
      const res = await restaurantService.removeMember(
        memberToRemove.id,
        restaurant.id,
        user?.id
      );
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Funcionário removido com sucesso!');
        setMemberToRemove(null);
        await loadData();
      }
    } catch {
      toast.error('Erro ao remover funcionário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      const res = await restaurantService.cancelInvitation(inviteId, restaurant.id, user?.id);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
      <div className="relative w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border/80 flex items-center justify-between bg-muted/20">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">
                Gerenciar Funcionários
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Restaurante: <strong className="text-foreground">{restaurant.name}</strong> •{' '}
              <span className="font-mono text-[11px]">{restaurant.city || 'BR'}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-border/60 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'members'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Equipe Ativa</span>
            <span className="px-1.5 py-0.2 rounded-full bg-muted text-[10px] font-mono">
              {members.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invitations')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'invitations'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Convites Pendentes</span>
            {invitations.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-semibold">
                {invitations.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'add'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Adicionar Funcionário</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs">Carregando membros da equipe...</p>
            </div>
          ) : activeTab === 'members' ? (
            /* Members List */
            members.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground space-y-2">
                <Users className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <p className="text-xs font-medium">Nenhum membro cadastrado nesta unidade.</p>
                <Button size="sm" onClick={() => setActiveTab('add')} className="h-8 text-xs mt-2">
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                  Adicionar Primeiro Funcionário
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/60 rounded-lg border border-border/80 overflow-hidden">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {member.profile?.full_name?.slice(0, 2) ||
                          member.profile?.email?.slice(0, 2) ||
                          'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {member.profile?.full_name || 'Sem nome'}
                          </p>
                          <Badge
                            variant={member.status === 'active' ? 'default' : 'secondary'}
                            className="text-[9px] py-0 px-1.5 capitalize"
                          >
                            {member.status === 'active' ? 'Ativo' : 'Suspenso'}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono truncate">
                          {member.profile?.email || 'Sem e-mail'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {/* Role Selector */}
                      <select
                        value={member.role_id}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as RoleId)}
                        className="h-7 text-xs rounded-md border border-border bg-background px-2 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        {ROLES.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </select>

                      {/* Suspend / Reactivate */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusToggle(member)}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        title={member.status === 'active' ? 'Suspender membro' : 'Reativar membro'}
                      >
                        {member.status === 'active' ? (
                          <Ban className="h-3.5 w-3.5 text-amber-500" />
                        ) : (
                          <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMemberToRemove(member)}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                        title="Remover da equipe"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'invitations' ? (
            /* Pending Invitations List */
            invitations.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground space-y-2">
                <Mail className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <p className="text-xs font-medium">Nenhum convite pendente para este restaurante.</p>
                <p className="text-[11px]">
                  Use a aba "Adicionar Funcionário" para convidar novas pessoas por e-mail.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 rounded-lg border border-border/80 overflow-hidden">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {inv.email}
                        </span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
                          {ROLES.find((r) => r.id === inv.role_id)?.label || inv.role_id}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3" /> Enviado em{' '}
                        {new Date(inv.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelInvite(inv.id)}
                      className="h-7 text-xs text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Revogar
                    </Button>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Add or Invite Form */
            <form onSubmit={handleAddOrInvite} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-emp-email" required>
                  E-mail do Funcionário
                </Label>
                <Input
                  id="admin-emp-email"
                  type="email"
                  placeholder="exemplo@restaurante.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Se a pessoa já tiver conta, ela será adicionada ou receberá o convite no painel dela. Se ainda não tiver conta, verá o convite assim que se cadastrar.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-emp-name">Nome do Funcionário (Opcional)</Label>
                <Input
                  id="admin-emp-name"
                  type="text"
                  placeholder="Nome ou apelido da pessoa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-emp-role" required>
                  Cargo / Papel no Restaurante
                </Label>
                <select
                  id="admin-emp-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as RoleId)}
                  disabled={isSubmitting}
                  className="w-full h-9 text-xs rounded-md border border-border bg-background px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label} — {r.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('members')}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Voltar
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="text-xs">
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Adicionar / Convidar
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-border/80 flex items-center justify-between bg-muted/20 text-xs text-muted-foreground">
          <span>Global Admin: Gestão completa com auditoria RLS</span>
          <Button variant="outline" size="sm" onClick={onClose} className="h-7 text-xs">
            Fechar
          </Button>
        </div>
      </div>

      {/* Remove Confirmation Sub-Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
          <div className="w-full max-w-sm rounded-xl border border-destructive/30 bg-card p-5 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-bold">Remover Funcionário?</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tem certeza que deseja remover{' '}
              <strong className="text-foreground">
                {memberToRemove.profile?.full_name || memberToRemove.profile?.email}
              </strong>{' '}
              deste restaurante? O usuário perderá acesso imediato à operação da unidade.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMemberToRemove(null)}
                disabled={isSubmitting}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmRemove}
                disabled={isSubmitting}
                className="text-xs"
              >
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Confirmar Remoção
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
