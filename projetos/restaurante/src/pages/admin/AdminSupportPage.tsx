import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Headphones,
  Store,
  StopCircle,
  ArrowRight,
  ChevronDown,
  Eye,
  Users,
  UtensilsCrossed,
  ScrollText,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilterBar } from '@/components/common/FilterBar';
import { PaginationControl } from '@/components/common/PaginationControl';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { restaurantService } from '@/services/restaurantService';
import { iamService } from '@/services/iamService';
import type { Restaurant } from '@/types/restaurant';
import type { SupportSession } from '@/types/iam';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AdminSupportPage() {
  const { user } = useAuth();
  const { setCurrentRestaurant } = useRestaurant();
  const navigate = useNavigate();

  const {
    page,
    pageSize,
    search,
    status,
    setFilter,
    setPage,
    setPageSize,
    resetFilters,
  } = useUrlFilters({ defaultPageSize: 10 });

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activeSession, setActiveSession] = useState<SupportSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRestaurants = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await restaurantService.getUserRestaurants('all', true);
      let all = res.data || [];

      if (status && status !== 'all') {
        all = all.filter((r) => r.status === status);
      }
      if (search) {
        const q = search.toLowerCase();
        all = all.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            (r.city && r.city.toLowerCase().includes(q)) ||
            (r.document && r.document.toLowerCase().includes(q)) ||
            (r.id && r.id.toLowerCase().includes(q))
        );
      }

      setTotal(all.length);
      setTotalPages(Math.ceil(all.length / pageSize) || 1);

      const start = (page - 1) * pageSize;
      setRestaurants(all.slice(start, start + pageSize));
      setActiveSession(iamService.getActiveSupportSession());
    } catch {
      toast.error('Erro ao carregar restaurantes para suporte.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, status]);

  useEffect(() => {
    void fetchRestaurants();
  }, [fetchRestaurants]);

  const handleEndSession = async () => {
    if (!activeSession) return;
    try {
      const res = await iamService.endSupportSession(activeSession.id, user?.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Sessão de suporte finalizada com sucesso.');
        setActiveSession(null);
      }
    } catch {
      toast.error('Erro ao finalizar suporte.');
    }
  };

  const handleEnterContext = () => {
    if (!activeSession) return;
    const target = restaurants.find((r) => r.id === activeSession.restaurant_id);
    if (target) {
      setCurrentRestaurant(target);
    }
    navigate('/app');
  };

  const filterFields = [
    {
      key: 'status',
      label: 'Todos os Status',
      options: [
        { label: 'Ativos', value: 'active' },
        { label: 'Suspensos', value: 'suspended' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Headphones className="h-6 w-6 text-primary" />
            Central de Suporte aos Restaurantes
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Inicie acessos de suporte aos restaurantes com auditoria permanente de ações e segurança sem impersonation.
          </p>
        </div>
      </div>

      {/* Active Session Card if any */}
      {activeSession && (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                Sessão de Suporte Ativa
              </span>
              <Badge variant="outline" className="border-amber-500/40 text-amber-900 dark:text-amber-200 text-[10px]">
                Iniciada em {new Date(activeSession.started_at).toLocaleTimeString('pt-BR')}
              </Badge>
            </div>
            <CardTitle className="text-base font-bold text-amber-950 dark:text-amber-100">
              Restaurante ID: {activeSession.restaurant_id}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {activeSession.reason && (
              <p className="text-xs text-amber-900/90 dark:text-amber-200/90">
                <strong>Motivo registrado:</strong> {activeSession.reason}
              </p>
            )}
            <div className="flex items-center gap-2 pt-2">
              <Button size="sm" onClick={handleEnterContext} className="text-xs">
                Acessar Área do Restaurante
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
              <Button variant="destructive" size="sm" onClick={handleEndSession} className="text-xs">
                <StopCircle className="h-3.5 w-3.5 mr-1" />
                Finalizar Suporte
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* URL Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={(val) => setFilter('search', val)}
        searchPlaceholder="Buscar por restaurante, cidade, documento ou ID..."
        filters={filterFields}
        filterValues={{ status }}
        onFilterChange={(key, val) => setFilter(key, val)}
        onReset={resetFilters}
        onRefresh={fetchRestaurants}
        isLoading={isLoading}
      />

      {/* Table Card */}
      <Card className="border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border/70 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Restaurante</th>
                <th className="px-4 py-3">ID do Tenant</th>
                <th className="px-4 py-3">Localização</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Sessão Suporte</th>
                <th className="px-4 py-3">Cadastro em</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Carregando unidades para atendimento...
                  </td>
                </tr>
              ) : restaurants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum restaurante encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                restaurants.map((r) => {
                  const isCurrentActive = activeSession?.restaurant_id === r.id;
                  return (
                    <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {r.logo_url ? (
                              <img src={r.logo_url} alt="" className="h-full w-full object-cover rounded-lg" />
                            ) : (
                              <Store className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/admin/restaurants/${r.id}`}
                              className="font-semibold text-foreground hover:underline flex items-center gap-1.5"
                            >
                              {r.name}
                            </Link>
                            <div className="text-[11px] text-muted-foreground">
                              {r.document || r.legal_name || 'Sem documento cadastrado'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                          {r.id.slice(0, 8)}...
                        </span>
                      </td>

                      <td className="px-4 py-3 text-muted-foreground">
                        {r.city ? `${r.city}, ${r.state || 'BR'}` : '—'}
                      </td>

                      <td className="px-4 py-3">
                        <Badge
                          variant={r.status === 'active' ? 'default' : 'secondary'}
                          className="text-[10px] capitalize"
                        >
                          {r.status}
                        </Badge>
                      </td>

                      <td className="px-4 py-3">
                        {isCurrentActive ? (
                          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] flex items-center gap-1 w-fit">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Em Atendimento
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Disponível</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </td>

                      <td className="px-4 py-3 text-right">
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
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel>Ações de Suporte</DropdownMenuLabel>
                            <DropdownMenuItem asChild className="cursor-pointer">
                              <Link to={`/admin/restaurants/${r.id}/support`}>
                                <Headphones className="h-3.5 w-3.5 mr-2 text-amber-500" />
                                <span>Iniciar Suporte</span>
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild className="cursor-pointer">
                              <Link to={`/admin/restaurants/${r.id}`}>
                                <Eye className="h-3.5 w-3.5 mr-2 text-primary" />
                                <span>Ver Detalhes</span>
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild className="cursor-pointer">
                              <Link to={`/admin/restaurants?tab=employees&restaurant_id=${r.id}`}>
                                <Users className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                <span>Ver Funcionários</span>
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild className="cursor-pointer">
                              <Link to={`/admin/audit?restaurant_id=${r.id}`}>
                                <ScrollText className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                <span>Ver Auditoria</span>
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => {
                                setCurrentRestaurant(r);
                                navigate('/app/menu');
                              }}
                              className="cursor-pointer"
                            >
                              <UtensilsCrossed className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                              <span>Ver Cardápio</span>
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
          pageSizeOptions={[10, 20, 50]}
        />
      </Card>
    </div>
  );
}
