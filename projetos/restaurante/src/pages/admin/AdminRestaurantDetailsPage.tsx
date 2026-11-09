import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, Headphones, Users, ChevronDown, ScrollText, UtensilsCrossed, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { restaurantService } from '@/services/restaurantService';
import { useRestaurant } from '@/hooks/useRestaurant';
import type { Restaurant, RestaurantMember } from '@/types/restaurant';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AdminRestaurantDetailsPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [members, setMembers] = useState<RestaurantMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setCurrentRestaurant } = useRestaurant();
  const navigate = useNavigate();

  const handleEnterRestaurant = (path = '/app') => {
    if (!restaurant) return;
    setCurrentRestaurant(restaurant);
    navigate(path);
  };

  useEffect(() => {
    if (!restaurantId) return;
    async function load() {
      try {
        const [restRes, memRes] = await Promise.all([
          restaurantService.getUserRestaurants('all', true),
          restaurantService.getRestaurantMembers(restaurantId!),
        ]);

        const matched = (restRes.data || []).find((r) => r.id === restaurantId);
        if (matched) setRestaurant(matched);
        if (memRes.data) setMembers(memRes.data);
      } catch {
        toast.error('Erro ao carregar detalhes do restaurante.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [restaurantId]);

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-muted-foreground">Carregando detalhes do restaurante...</div>;
  }

  if (!restaurant) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">Restaurante não encontrado</h2>
        <Button asChild variant="outline">
          <Link to="/admin/restaurants">Voltar para Restaurantes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="h-8 px-2">
            <Link to="/admin/restaurants">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {restaurant.name}
              <Badge variant={restaurant.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                {restaurant.status}
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground">ID do Tenant: {restaurant.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => handleEnterRestaurant('/app')}
            className="h-8 text-xs gap-1.5 font-semibold"
          >
            <Store className="h-3.5 w-3.5" />
            <span>Operar Restaurante</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs flex items-center gap-1.5 data-[state=open]:bg-accent"
              >
                <span>Ações</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Ações do Restaurante</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleEnterRestaurant('/app')}
                className="cursor-pointer text-primary font-medium"
              >
                <Store className="h-3.5 w-3.5 mr-2" />
                <span>Acessar Painel da Unidade</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => handleEnterRestaurant('/app/menu')}
                className="cursor-pointer"
              >
                <UtensilsCrossed className="h-3.5 w-3.5 mr-2" />
                <span>Ver Cardápio</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to={`/admin/restaurants/${restaurant.id}/support`}>
                  <Headphones className="h-3.5 w-3.5 mr-2 text-amber-500" />
                  <span>Iniciar Sessão de Suporte</span>
                </Link>
              </DropdownMenuItem>

            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to={`/admin/restaurants?tab=employees&restaurant_id=${restaurant.id}`}>
                <Users className="h-3.5 w-3.5 mr-2 text-primary" />
                <span>Gerenciar Funcionários</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to={`/admin/audit?restaurant_id=${restaurant.id}`}>
                <ScrollText className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <span>Ver Trilha de Auditoria</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Card */}
        <Card className="border-border md:col-span-1">
          <CardHeader className="text-center pb-2">
            <div className="h-20 w-20 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl mx-auto mb-3">
              {restaurant.logo_url ? (
                <img src={restaurant.logo_url} alt="" className="h-full w-full rounded-xl object-cover" />
              ) : (
                <Store className="h-10 w-10" />
              )}
            </div>
            <CardTitle className="text-base font-bold">{restaurant.name}</CardTitle>
            <div className="text-xs text-muted-foreground">{restaurant.legal_name || 'Razão social não informada'}</div>
          </CardHeader>
          <CardContent className="space-y-3 pt-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">Documento/CNPJ</span>
              <span className="font-mono">{restaurant.document || '-'}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">E-mail</span>
              <span>{restaurant.email || '-'}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">Telefone</span>
              <span>{restaurant.phone || '-'}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">WhatsApp</span>
              <span>{restaurant.whatsapp || '-'}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">Cidade / UF</span>
              <span>{restaurant.city ? `${restaurant.city}, ${restaurant.state || 'BR'}` : '-'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Members Column */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Membros da Equipe ({members.length})
                </span>
                <span className="text-xs text-muted-foreground font-normal">
                  Usuários com acesso a esta unidade
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {members.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Nenhum membro vinculado a esta unidade.</p>
              ) : (
                members.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-lg border border-border/70 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <h4 className="font-semibold text-foreground">{m.profile?.full_name || 'Sem nome'}</h4>
                      <p className="text-[11px] text-muted-foreground">
                        {m.profile?.email} · Papel:{' '}
                        <strong className="text-foreground capitalize">{m.role_id.replace('_', ' ')}</strong>
                      </p>
                    </div>

                    <Badge variant={m.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                      {m.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
