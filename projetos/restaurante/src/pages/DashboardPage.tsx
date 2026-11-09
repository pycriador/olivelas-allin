import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  Store,
  Users,
  UtensilsCrossed,
  LayoutGrid,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock,
  Mail,
  Check,
  X,
  Plus,
  User,
  Shield,
  Loader2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/hooks/useRestaurant';
import { restaurantService } from '@/services/restaurantService';
import type { RestaurantInvitation, RoleId } from '@/types/restaurant';

const ROLE_DISPLAY_NAMES: Record<RoleId, string> = {
  restaurant_admin: 'Administrador',
  manager: 'Gerente',
  waiter: 'Garçom',
  kitchen: 'Cozinha',
  cashier: 'Caixa',
};

export function DashboardPage() {
  const { user } = useAuth();
  const { currentRestaurant, restaurants, userRole, refreshRestaurants, setCurrentRestaurant } = useRestaurant();
  const [memberCount, setMemberCount] = useState<number>(1);
  const [invitations, setInvitations] = useState<RestaurantInvitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  });

  const displayName = user?.name || user?.email?.split('@')[0] || 'Usuário';

  // Load invitations for the user's email
  const fetchInvitations = useCallback(async () => {
    if (!user?.email) return;
    setLoadingInvitations(true);
    try {
      const res = await restaurantService.getUserInvitations(user.email);
      if (res.data) {
        setInvitations(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingInvitations(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (!currentRestaurant) {
      void fetchInvitations();
    }
  }, [currentRestaurant, fetchInvitations]);

  useEffect(() => {
    let isMounted = true;
    if (currentRestaurant) {
      restaurantService.getRestaurantMembers(currentRestaurant.id).then((res) => {
        if (isMounted && res.data) setMemberCount(res.data.length);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [currentRestaurant]);

  const handleAcceptInvite = async (invitation: RestaurantInvitation) => {
    if (!user) return;
    setActionInProgressId(invitation.id);
    try {
      const res = await restaurantService.acceptInvitation(invitation.id, user.id);
      if (!res.success) {
        toast.error(res.error || 'Erro ao aceitar convite.');
      } else {
        toast.success(`Convite aceito! Bem-vindo à equipe.`);
        await refreshRestaurants();
      }
    } catch {
      toast.error('Erro ao aceitar convite.');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDeclineInvite = async (invitationId: string) => {
    setActionInProgressId(invitationId);
    try {
      const res = await restaurantService.declineInvitation(invitationId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.info('Convite recusado.');
        setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      }
    } catch {
      toast.error('Erro ao recusar convite.');
    } finally {
      setActionInProgressId(null);
    }
  };

  // If user does not have an active restaurant selected, show Account & Onboarding Dashboard
  if (!currentRestaurant) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Account Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {greeting}, {displayName}.
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Bem-vindo ao seu painel. Aqui você gerencia sua conta, convites de equipe e seus restaurantes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="text-xs">
              <Link to="/app/setup/restaurant">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Criar Restaurante
              </Link>
            </Button>
          </div>
        </div>

        {/* Existing Restaurants Quick Selector (if user belongs to any restaurants but none is active) */}
        {restaurants.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" />
                Seus Restaurantes Vinculados
              </CardTitle>
              <CardDescription className="text-xs">
                Você pertence a {restaurants.length} {restaurants.length === 1 ? 'restaurante' : 'restaurantes'}. Selecione para acessar:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {restaurants.map((rest) => (
                  <button
                    key={rest.id}
                    type="button"
                    onClick={() => setCurrentRestaurant(rest)}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-accent text-left transition-colors group"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary">
                        {rest.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {rest.city ? `${rest.city}, ${rest.state || 'BR'}` : 'Brasil'}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Invitations Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Convites Pendentes
              </h2>
            </div>
            {loadingInvitations && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </div>

          {invitations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invitations.map((inv) => (
                <Card key={inv.id} className="border-primary/40 shadow-xs relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-amber-500" />
                  <CardHeader className="pb-3 pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Convite para equipe
                        </span>
                        <CardTitle className="text-base font-bold text-foreground mt-0.5">
                          {inv.restaurant?.name || 'Restaurante'}
                        </CardTitle>
                        {inv.restaurant?.city && (
                          <CardDescription className="text-xs flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {inv.restaurant.city}, {inv.restaurant.state || 'BR'}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                        {ROLE_DISPLAY_NAMES[inv.role_id] || inv.role_id}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3 text-xs text-muted-foreground">
                    <p>
                      Você foi convidado para participar como{' '}
                      <strong className="text-foreground">{ROLE_DISPLAY_NAMES[inv.role_id] || inv.role_id}</strong>.
                    </p>
                    <p className="text-[11px] text-muted-foreground/80 mt-1 flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3" /> Expira em{' '}
                      {new Date(inv.expires_at).toLocaleDateString('pt-BR')}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0 flex items-center justify-end gap-2 border-t border-border/50 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeclineInvite(inv.id)}
                      disabled={actionInProgressId === inv.id}
                      className="h-8 text-xs text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Recusar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptInvite(inv)}
                      disabled={actionInProgressId === inv.id}
                      className="h-8 text-xs"
                    >
                      {actionInProgressId === inv.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : (
                        <Check className="h-3.5 w-3.5 mr-1" />
                      )}
                      Aceitar Convite
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-border/70 bg-muted/20">
              <CardContent className="py-6 text-center text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Nenhum convite pendente para {user?.email}</p>
                <p className="text-[11px]">
                  Quando um administrador convidar você para fazer parte de um restaurante, o convite aparecerá aqui para você aceitar.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Two-Column Grid: Create Restaurant Hero & Account Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Criar Restaurante */}
          <Card className="border-border shadow-xs flex flex-col justify-between">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                <Store className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground">
                Criar meu Restaurante
              </CardTitle>
              <CardDescription className="text-xs">
                Inicie sua própria operação para gerenciar cardápio, produtos, equipe e atendimento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Multi-tenant seguro com isolamento de dados RLS</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Catálogo e cardápio digital por categorias</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Convite de funcionários por e-mail e controle de papéis</span>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button asChild className="w-full text-xs">
                <Link to="/app/setup/restaurant">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Criar Novo Restaurante
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Card: Configurações Básicas da Conta */}
          <Card className="border-border shadow-xs flex flex-col justify-between">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-accent text-accent-foreground flex items-center justify-center mb-2">
                <User className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground">
                Configurações da Conta
              </CardTitle>
              <CardDescription className="text-xs">
                Informações cadastrais e credenciais de segurança do seu perfil.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="rounded-md border border-border/80 bg-muted/30 p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Nome:</span>
                  <span className="font-semibold text-foreground">{user?.name || 'Não informado'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">E-mail:</span>
                  <span className="font-mono text-foreground">{user?.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status da Conta:</span>
                  <Badge variant="success" className="text-[10px] py-0">Ativa</Badge>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2 flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="w-full text-xs">
                <Link to="/app/profile">
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  Editar Perfil
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="w-full text-xs">
                <Link to="/app/settings">
                  <Shield className="h-3.5 w-3.5 mr-1.5" />
                  Segurança
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {greeting}, {displayName}.
          </h1>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            <span>Restaurante:</span>
            <strong className="text-foreground font-semibold">{currentRestaurant.name}</strong>
            <span>•</span>
            <Badge variant="outline" className="text-[10px] py-0 px-2 capitalize font-mono">
              {userRole ? userRole.replace('_', ' ') : 'Membro'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link to="/app/restaurant">
              <Store className="h-3.5 w-3.5 mr-1.5" />
              Editar Restaurante
            </Link>
          </Button>
          <Button asChild size="sm" className="text-xs">
            <Link to="/app/team">
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Gerenciar Equipe
            </Link>
          </Button>
        </div>
      </div>

      {/* Restaurant Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-border shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Unidade Ativa
              </span>
              <Badge variant="success" className="text-[10px] py-0 px-2 font-mono">
                {currentRestaurant.status}
              </Badge>
            </div>
            <CardTitle className="text-xl font-bold text-foreground">
              {currentRestaurant.name}
            </CardTitle>
            {currentRestaurant.legal_name && (
              <CardDescription className="text-xs font-mono">
                {currentRestaurant.legal_name}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">
                  {currentRestaurant.address
                    ? `${currentRestaurant.address}, ${currentRestaurant.city || ''}`
                    : 'Endereço não cadastrado'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="font-mono">Fuso: {currentRestaurant.timezone}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Isolamento Tenant RLS Ativo</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{memberCount} membro(s) na equipe</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick status card */}
        <Card className="border-border shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Moeda &amp; Região
            </span>
            <CardTitle className="text-2xl font-bold font-mono text-foreground pt-1">
              {currentRestaurant.currency} (R$)
            </CardTitle>
            <CardDescription className="text-xs">
              Padrão monetário para pedidos e comandas.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-md border border-border/70 bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
              Pronto para os módulos operacionais da Fase 03.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Setup Checklist (Section 19) */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Configuração Inicial &amp; Próximas Etapas
          </CardTitle>
          <CardDescription className="text-xs">
            Acompanhe o status dos módulos estruturais deste restaurante.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3.5">
          {/* Item 1: Restaurante Configurado (Done) */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Restaurante configurado
                </p>
                <p className="text-xs text-muted-foreground">
                  Dados cadastrais, moeda e identificação do tenant estabelecidos.
                </p>
              </div>
            </div>
            <Badge variant="success" className="text-[10px] font-mono shrink-0">
              Concluído
            </Badge>
          </div>

          {/* Item 2: Equipe configurada */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-3">
              {memberCount > 1 ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/60 shrink-0" />
              )}
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Equipe configurada
                </p>
                <p className="text-xs text-muted-foreground">
                  {memberCount} membro(s) cadastrado(s) com papéis e permissões RBAC.
                </p>
              </div>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/app/team" className="flex items-center gap-1 text-primary">
                <span>Gerenciar</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          {/* Item 3: Cardápio Cadastrado (Fase 03 - Concluído / Ativo) */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="h-3.5 w-3.5 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Cardápio do Restaurante</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Categorias, produtos, fotos, adicionais e controle de disponibilidade.
                </p>
              </div>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/app/menu" className="flex items-center gap-1 text-primary">
                <span>Acessar</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          {/* Item 4: Mesas & Tablets (Fase 04) */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20 opacity-70">
            <div className="flex items-center gap-3">
              <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Mesas e Tablets</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mapa físico de mesas, QR Codes e identificação de dispositivos no salão.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/50">
              Fase 04
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
