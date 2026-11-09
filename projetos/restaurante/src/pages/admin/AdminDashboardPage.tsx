import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Store,
  Headphones,
  ScrollText,
  ShieldCheck,
  ArrowRight,
  Activity,
  Plus,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { restaurantService } from '@/services/restaurantService';
import { iamService } from '@/services/iamService';
import { auditService } from '@/services/auditService';
import type { Restaurant } from '@/types/restaurant';
import type { AuditLog } from '@/types/audit';

export function AdminDashboardPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [restsRes, usersRes, logsRes] = await Promise.all([
          restaurantService.getUserRestaurants('all', true),
          iamService.getUsers({ page: 1, pageSize: 1 }),
          auditService.getAuditLogs({ page: 1, pageSize: 6 }),
        ]);

        if (!isMounted) return;
        setRestaurants(restsRes.data || []);
        setUsersCount(usersRes.total);
        setRecentLogs(logsRes.data || []);
      } catch (err) {
        console.error('Error loading admin dashboard:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeRestaurants = restaurants.filter((r) => r.status === 'active');
  const suspendedRestaurants = restaurants.filter((r) => r.status === 'suspended');

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Administração Global da Plataforma</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Painel Geral do SaaS
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Visão consolidada de tenants, identidades, segurança e auditoria em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="text-xs">
            <Link to="/admin/restaurants">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Novo Restaurante
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link to="/admin/support">
              <Headphones className="h-3.5 w-3.5 mr-1" />
              Central de Suporte
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total de Restaurantes
            </CardTitle>
            <Store className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? '...' : restaurants.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
              <span className="text-emerald-500 font-semibold">{activeRestaurants.length} ativos</span>
              {suspendedRestaurants.length > 0 && (
                <span className="text-amber-500 font-semibold">· {suspendedRestaurants.length} suspensos</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Usuários Registrados
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? '...' : usersCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Contas com perfis na plataforma
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Segurança & Auditoria
            </CardTitle>
            <ScrollText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">100%</div>
            <p className="text-[11px] text-emerald-500 font-medium mt-1">
              Logs Append-Only Ativos
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sessões de Suporte
            </CardTitle>
            <Headphones className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Auditoria Total</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Identidade real vinculada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Restaurants & Recent Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Restaurants Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Restaurantes na Plataforma ({restaurants.length})
            </h2>
            <Link
              to="/admin/restaurants"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {restaurants.slice(0, 5).map((r) => (
              <Card key={r.id} className="border-border hover:border-primary/40 transition-colors">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {r.logo_url ? (
                        <img src={r.logo_url} alt={r.name} className="h-full w-full object-cover rounded-lg" />
                      ) : (
                        <Store className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/restaurants/${r.id}`}
                          className="font-semibold text-sm hover:underline truncate text-foreground"
                        >
                          {r.name}
                        </Link>
                        <Badge variant={r.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                          {r.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {r.city ? `${r.city}, ${r.state || 'BR'}` : 'Localização não informada'} · Criado em{' '}
                        {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" asChild className="h-8 text-xs">
                      <Link to={`/admin/restaurants/${r.id}`}>Detalhes</Link>
                    </Button>
                    <Button size="sm" asChild className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white">
                      <Link to={`/admin/restaurants/${r.id}/support`}>Acessar Suporte</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Audit Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Eventos Recentes
            </h2>
            <Link
              to="/admin/audit"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              Auditoria <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <Card className="border-border">
            <CardContent className="p-4 space-y-3">
              {recentLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Nenhum log de auditoria recente.
                </p>
              ) : (
                recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg border border-border/60 bg-muted/20 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-[11px] text-primary">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Ator: {log.actor_name || log.actor_email || log.actor_user_id || 'Sistema'}
                    </p>
                    {log.restaurant_name && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 truncate">
                        Restaurante: {log.restaurant_name}
                      </p>
                    )}
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
