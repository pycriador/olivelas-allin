import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/hooks/useRestaurant';
import { restaurantService } from '@/services/restaurantService';
import type { RestaurantMember, RoleId } from '@/types/restaurant';

export function TeamMemberDetailsPage() {
  const { memberId } = useParams<{ memberId: string }>();
  const { user } = useAuth();
  const { currentRestaurant, can, isGlobalAdmin } = useRestaurant();
  const [member, setMember] = useState<RestaurantMember | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleId>('waiter');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const canEdit = can('users.update') || isGlobalAdmin;

  useEffect(() => {
    if (!currentRestaurant || !memberId) return;
    restaurantService.getRestaurantMembers(currentRestaurant.id).then((res) => {
      const matched = (res.data || []).find((m) => m.id === memberId);
      if (matched) {
        setMember(matched);
        setSelectedRole(matched.role_id);
      }
      setIsLoading(false);
    });
  }, [currentRestaurant, memberId]);

  const handleUpdateRole = async () => {
    if (!member || !currentRestaurant) return;
    setIsSaving(true);
    try {
      const res = await restaurantService.updateMemberRole(
        member.id,
        selectedRole,
        currentRestaurant.id,
        user?.id
      );
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Papel atualizado com sucesso.');
        setMember({ ...member, role_id: selectedRole });
      }
    } catch {
      toast.error('Erro ao atualizar papel.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!member || !currentRestaurant) return;
    const nextStatus = member.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await restaurantService.updateMemberStatus(
        member.id,
        nextStatus,
        currentRestaurant.id,
        user?.id
      );
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Membro ${nextStatus === 'suspended' ? 'suspenso' : 'reativado'} com sucesso.`);
        setMember({ ...member, status: nextStatus });
      }
    } catch {
      toast.error('Erro ao alterar status.');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-muted-foreground">Carregando dados do membro...</div>;
  }

  if (!member) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">Membro não encontrado</h2>
        <Button asChild variant="outline">
          <Link to="/app/team">Voltar para Equipe</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="h-8 px-2">
          <Link to="/app/team">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar para Equipe
          </Link>
        </Button>
        <h1 className="text-xl font-bold tracking-tight">Detalhes do Colaborador</h1>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              {member.profile?.full_name || 'Colaborador'}
            </CardTitle>
            <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className="text-[10px] capitalize">
              {member.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-border/60">
            <span className="text-muted-foreground">E-mail</span>
            <span>{member.profile?.email}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-border/60">
            <span className="text-muted-foreground">Cargo Atual</span>
            <span className="capitalize font-semibold">{member.role_id.replace('_', ' ')}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-border/60">
            <span className="text-muted-foreground">Entrou em</span>
            <span>{new Date(member.joined_at).toLocaleString('pt-BR')}</span>
          </div>

          {canEdit && (
            <div className="pt-2 space-y-3">
              <label className="font-semibold text-foreground block">Alterar Papel / Permissões</label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as RoleId)}
                  className="h-9 px-3 rounded-md border border-border/80 bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary flex-1"
                >
                  <option value="waiter">Garçom</option>
                  <option value="kitchen">Cozinha (KDS)</option>
                  <option value="cashier">Caixa</option>
                  <option value="manager">Gerente</option>
                  <option value="restaurant_admin">Administrador do Restaurante</option>
                </select>
                <Button
                  size="sm"
                  onClick={handleUpdateRole}
                  disabled={isSaving || selectedRole === member.role_id}
                  className="text-xs"
                >
                  Salvar Papel
                </Button>
              </div>
            </div>
          )}

          <div className="pt-4 flex items-center justify-between border-t border-border/60">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleStatus}
              className="text-xs"
            >
              {member.status === 'active' ? (
                <>
                  <UserX className="h-3.5 w-3.5 mr-1 text-amber-500" />
                  Suspender Acesso
                </>
              ) : (
                <>
                  <UserCheck className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                  Ativar Acesso
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
