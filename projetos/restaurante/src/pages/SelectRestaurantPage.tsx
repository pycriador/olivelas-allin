import { useNavigate } from 'react-router-dom';
import { Store, Plus, ArrowRight, MapPin, ChevronDown, UtensilsCrossed, Users, Settings, ShieldCheck, LayoutDashboard } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRestaurant } from '@/hooks/useRestaurant';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function SelectRestaurantPage() {
  const navigate = useNavigate();
  const { restaurants, setCurrentRestaurant, isGlobalAdmin } = useRestaurant();

  const handleSelect = (restaurant: any) => {
    setCurrentRestaurant(restaurant);
    navigate('/app');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="w-full flex items-center justify-between p-4 sm:p-6 max-w-7xl mx-auto border-b border-border/50">
        <Logo to="/app" />
        <div className="flex items-center gap-3">
          {isGlobalAdmin && (
            <Button
              size="sm"
              onClick={() => navigate('/admin')}
              className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 shadow-xs"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Painel Global Admin (SaaS)
            </Button>
          )}
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {isGlobalAdmin ? 'Painel Global de Restaurantes' : 'Selecione seu restaurante'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isGlobalAdmin
                ? 'Selecione qualquer restaurante da plataforma para gerenciar em Modo Suporte.'
                : 'Escolha a unidade que deseja operar ou gerenciar agora.'}
            </p>
            {isGlobalAdmin && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                  👑 Modo Global Admin Ativo
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/admin')}
                  className="h-7 text-xs border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 font-medium"
                >
                  <LayoutDashboard className="h-3.5 w-3.5 mr-1" />
                  Ir para Administração Geral da Aplicação →
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {restaurants.map((restaurant) => (
              <Card
                key={restaurant.id}
                className="border-border hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => handleSelect(restaurant)}
              >
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {restaurant.logo_url ? (
                        <img
                          src={restaurant.logo_url}
                          alt={restaurant.name}
                          className="h-full w-full object-cover rounded-lg"
                        />
                      ) : (
                        <Store className="h-6 w-6" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base text-foreground truncate">
                          {restaurant.name}
                        </h3>
                        <Badge variant="success" className="text-[10px] py-0 px-2 font-mono">
                          {restaurant.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span>
                          {restaurant.city || 'Sem cidade'}
                          {restaurant.state ? `, ${restaurant.state}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 flex items-center gap-1.5 data-[state=open]:bg-accent"
                        >
                          <span>Ações</span>
                          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel>Ações do Restaurante</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleSelect(restaurant)}
                          className="cursor-pointer"
                        >
                          <ArrowRight className="h-3.5 w-3.5 mr-2 text-primary" />
                          <span>Acessar Painel</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setCurrentRestaurant(restaurant);
                            navigate('/app/menu');
                          }}
                          className="cursor-pointer"
                        >
                          <UtensilsCrossed className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                          <span>Ver Cardápio</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setCurrentRestaurant(restaurant);
                            navigate('/app/team');
                          }}
                          className="cursor-pointer"
                        >
                          <Users className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                          <span>Gerenciar Equipe</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setCurrentRestaurant(restaurant);
                            navigate('/app/settings/restaurant');
                          }}
                          className="cursor-pointer"
                        >
                          <Settings className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                          <span>Configurações</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}

            {restaurants.length === 0 && (
              <Card className="border-dashed border-2 p-8 text-center space-y-4">
                <CardHeader>
                  <CardTitle className="text-lg">Nenhum restaurante encontrado</CardTitle>
                  <CardDescription className="text-xs">
                    Você ainda não está associado a nenhuma unidade de restaurante.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate('/app/setup/restaurant')}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Criar primeiro restaurante
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/setup/restaurant')}
              className="flex items-center gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Adicionar outro restaurante</span>
            </Button>

            {isGlobalAdmin && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/admin/restaurants')}
                className="flex items-center gap-1.5 text-xs border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Ver todos no Painel Admin</span>
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
