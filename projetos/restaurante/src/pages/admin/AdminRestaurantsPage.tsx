import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store,
  Plus,
  Headphones,
  Eye,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Users,
  ChevronDown,
  UtensilsCrossed,
  Ban,
  MoreHorizontal,
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
import { AdminManageEmployeesModal } from '@/components/admin/AdminManageEmployeesModal';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { restaurantService } from '@/services/restaurantService';
import { useRestaurant } from '@/hooks/useRestaurant';
import type { Restaurant } from '@/types/restaurant';

export function AdminRestaurantsPage() {
  const { setCurrentRestaurant } = useRestaurant();
  const navigate = useNavigate();

  const handleEnterRestaurant = (r: Restaurant, path = '/app') => {
    setCurrentRestaurant(r);
    navigate(path);
  };

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
  const [isLoading, setIsLoading] = useState(true);

  // Employee management modal state
  const [selectedRestaurantForEmployees, setSelectedRestaurantForEmployees] =
    useState<Restaurant | null>(null);
  const [isEmployeesModalOpen, setIsEmployeesModalOpen] = useState(false);

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
            (r.document && r.document.toLowerCase().includes(q))
        );
      }

      setTotal(all.length);
      setTotalPages(Math.ceil(all.length / pageSize) || 1);

      const start = (page - 1) * pageSize;
      setRestaurants(all.slice(start, start + pageSize));
    } catch {
      toast.error('Erro ao carregar restaurantes.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, status]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const handleToggleRestaurantStatus = async (restaurant: Restaurant) => {
    const nextStatus = restaurant.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await restaurantService.updateRestaurant(restaurant.id, {
        status: nextStatus,
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          nextStatus === 'suspended'
            ? `Restaurante "${restaurant.name}" suspenso.`
            : `Restaurante "${restaurant.name}" ativado com sucesso.`
        );
        await fetchRestaurants();
      }
    } catch {
      toast.error('Erro ao atualizar status do restaurante.');
    }
  };

  const filterFields = [
    {
      key: 'status',
      label: 'Todos os Status',
      options: [
        { label: 'Ativos', value: 'active' },
        { label: 'Suspensos', value: 'suspended' },
        { label: 'Inativos', value: 'inactive' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            Restaurantes (Tenants)
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Gerencie todas as unidades da plataforma SaaS e inicie sessões de suporte com auditoria.
          </p>
        </div>

        <Button asChild size="sm" className="text-xs">
          <Link to="/app/setup/restaurant">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Criar Restaurante
          </Link>
        </Button>
      </div>

      {/* URL Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={(val) => setFilter('search', val)}
        searchPlaceholder="Buscar por nome, cidade ou CNPJ..."
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
                <th className="px-4 py-3">Localização</th>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Criado em</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Carregando restaurantes...
                  </td>
                </tr>
              ) : restaurants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum restaurante encontrado.
                  </td>
                </tr>
              ) : (
                restaurants.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">
                          {r.logo_url ? (
                            <img src={r.logo_url} alt="" className="h-full w-full object-cover rounded-lg" />
                          ) : (
                            <Store className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/admin/restaurants/${r.id}`}
                            className="font-semibold text-foreground hover:underline truncate block"
                          >
                            {r.name}
                          </Link>
                          <div className="text-[11px] text-muted-foreground truncate">{r.email || 'Sem e-mail'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {r.city ? `${r.city}, ${r.state || 'BR'}` : 'Não informado'}
                    </td>

                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {r.document || '-'}
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        variant={r.status === 'active' ? 'default' : 'secondary'}
                        className="text-[10px] capitalize"
                      >
                        {r.status}
                      </Badge>
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
                            className="h-7 text-xs flex items-center gap-1.5 data-[state=open]:bg-accent"
                          >
                            <span>Ações</span>
                            <ChevronDown className="h-3 w-3 opacity-60" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuLabel>Ações do Restaurante</DropdownMenuLabel>

                          <DropdownMenuItem
                            onClick={() => handleEnterRestaurant(r, '/app')}
                            className="cursor-pointer text-primary font-medium"
                          >
                            <Store className="h-3.5 w-3.5 mr-2" />
                            <span>Acessar Painel da Unidade</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleEnterRestaurant(r, '/app/menu')}
                            className="cursor-pointer"
                          >
                            <UtensilsCrossed className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            <span>Ver Cardápio</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedRestaurantForEmployees(r);
                              setIsEmployeesModalOpen(true);
                            }}
                            className="cursor-pointer"
                          >
                            <Users className="h-3.5 w-3.5 mr-2 text-primary" />
                            <span>Gerenciar Funcionários</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild className="cursor-pointer">
                            <Link to={`/admin/restaurants/${r.id}/support`}>
                              <Headphones className="h-3.5 w-3.5 mr-2 text-amber-500" />
                              <span>Acessar Suporte</span>
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild className="cursor-pointer">
                            <Link to={`/admin/restaurants/${r.id}`}>
                              <Eye className="h-3.5 w-3.5 mr-2" />
                              <span>Ver Detalhes</span>
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => handleToggleRestaurantStatus(r)}
                            className={`cursor-pointer ${
                              r.status === 'active'
                                ? 'text-destructive focus:text-destructive'
                                : 'text-emerald-600 focus:text-emerald-600'
                            }`}
                          >
                            {r.status === 'active' ? (
                              <>
                                <Ban className="h-3.5 w-3.5 mr-2" />
                                <span>Suspender Unidade</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                                <span>Ativar Unidade</span>
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
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

      {/* Employee Management Modal */}
      <AdminManageEmployeesModal
        restaurant={selectedRestaurantForEmployees}
        isOpen={isEmployeesModalOpen}
        onClose={() => {
          setIsEmployeesModalOpen(false);
          setSelectedRestaurantForEmployees(null);
        }}
      />
    </div>
  );
}
