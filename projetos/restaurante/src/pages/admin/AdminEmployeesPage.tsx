import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, Eye, Store, ChevronDown, User, Headphones } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilterBar } from '@/components/common/FilterBar';
import { PaginationControl } from '@/components/common/PaginationControl';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { restaurantService } from '@/services/restaurantService';
import type { Restaurant } from '@/types/restaurant';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EmployeeItem {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role_id: string;
  status: string;
  joined_at: string;
}

export function AdminEmployeesPage() {
  const {
    page,
    pageSize,
    search,
    role,
    status,
    searchParams,
    setFilter,
    setPage,
    setPageSize,
    resetFilters,
  } = useUrlFilters({ defaultPageSize: 10 });

  const restaurantFilter = searchParams.get('restaurantId') || '';

  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Load restaurants for filter dropdown
  useEffect(() => {
    restaurantService.getUserRestaurants('all', true).then((res) => {
      setRestaurants(res.data || []);
    });
  }, []);

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        const mock: EmployeeItem[] = [
          {
            id: 'emp-1',
            restaurant_id: 'rest-1',
            restaurant_name: 'Olivelas Gastronomia',
            user_id: 'user-1',
            user_name: 'Willian Jesus',
            user_email: 'willian.o.jesus@gmail.com',
            role_id: 'restaurant_admin',
            status: 'active',
            joined_at: new Date().toISOString(),
          },
        ];
        setEmployees(mock);
        setTotal(mock.length);
        setTotalPages(1);
        setIsLoading(false);
        return;
      }

      let query = supabase
        .from('restaurant_members')
        .select(`
          id,
          restaurant_id,
          user_id,
          role_id,
          status,
          joined_at
        `, { count: 'exact' });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      if (role && role !== 'all') {
        query = query.eq('role_id', role);
      }
      if (restaurantFilter) {
        query = query.eq('restaurant_id', restaurantFilter);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('joined_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const memberRows = data || [];
      const userIds = Array.from(new Set(memberRows.map((m) => m.user_id).filter(Boolean)));
      const restIds = Array.from(new Set(memberRows.map((m) => m.restaurant_id).filter(Boolean)));

      let profMap = new Map<string, { full_name: string | null; email: string | null }>();
      let restMap = new Map<string, string>();

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        (profiles || []).forEach((p) => profMap.set(p.id, p));
      }

      if (restIds.length > 0) {
        const { data: rests } = await supabase
          .from('restaurants')
          .select('id, name')
          .in('id', restIds);
        (rests || []).forEach((r) => restMap.set(r.id, r.name));
      }

      const items: EmployeeItem[] = memberRows.map((m) => ({
        id: m.id,
        restaurant_id: m.restaurant_id,
        restaurant_name: restMap.get(m.restaurant_id) || 'Restaurante',
        user_id: m.user_id,
        user_name: profMap.get(m.user_id)?.full_name || 'Sem nome',
        user_email: profMap.get(m.user_id)?.email || '',
        role_id: m.role_id,
        status: m.status,
        joined_at: m.joined_at,
      }));

      // Filter by search in-memory if name or email matches
      const filtered = search
        ? items.filter(
            (i) =>
              i.user_name.toLowerCase().includes(search.toLowerCase()) ||
              i.user_email.toLowerCase().includes(search.toLowerCase()) ||
              i.restaurant_name.toLowerCase().includes(search.toLowerCase())
          )
        : items;

      setEmployees(filtered);
      setTotal(count || filtered.length);
      setTotalPages(Math.ceil((count || filtered.length) / pageSize) || 1);
    } catch {
      toast.error('Erro ao carregar funcionários.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, role, status, restaurantFilter]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const filterFields = [
    {
      key: 'restaurantId',
      label: 'Todos os Restaurantes',
      options: restaurants.map((r) => ({ label: r.name, value: r.id })),
    },
    {
      key: 'role',
      label: 'Todos os Cargos',
      options: [
        { label: 'Administrador', value: 'restaurant_admin' },
        { label: 'Gerente', value: 'manager' },
        { label: 'Garçom', value: 'waiter' },
        { label: 'Cozinha', value: 'kitchen' },
        { label: 'Caixa', value: 'cashier' },
      ],
    },
    {
      key: 'status',
      label: 'Todos os Status',
      options: [
        { label: 'Ativos', value: 'active' },
        { label: 'Convidados', value: 'invited' },
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
            <Users className="h-6 w-6 text-primary" />
            Funcionários da Plataforma
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Visão consolidada de todas as associações entre usuários e restaurantes.
          </p>
        </div>
      </div>

      {/* URL Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={(val) => setFilter('search', val)}
        searchPlaceholder="Buscar por nome, e-mail ou restaurante..."
        filters={filterFields}
        filterValues={{ restaurantId: restaurantFilter, role, status }}
        onFilterChange={(key, val) => setFilter(key, val)}
        onReset={resetFilters}
        onRefresh={fetchEmployees}
        isLoading={isLoading}
      />

      {/* Table */}
      <Card className="border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border/70 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Funcionário</th>
                <th className="px-4 py-3">Restaurante</th>
                <th className="px-4 py-3">Cargo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Vínculo em</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Carregando funcionários...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum vínculo encontrado.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/admin/users/${emp.user_id}`} className="font-semibold text-foreground hover:underline">
                        {emp.user_name}
                      </Link>
                      <div className="text-[11px] text-muted-foreground">{emp.user_email}</div>
                    </td>

                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/restaurants/${emp.restaurant_id}`}
                        className="text-foreground hover:underline flex items-center gap-1.5"
                      >
                        <Store className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{emp.restaurant_name}</span>
                      </Link>
                    </td>

                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {emp.role_id.replace('_', ' ')}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      <Badge variant={emp.status === 'active' ? 'default' : 'secondary'} className="text-[10px] capitalize">
                        {emp.status}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(emp.joined_at).toLocaleDateString('pt-BR')}
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
                          <DropdownMenuLabel>Ações do Vínculo</DropdownMenuLabel>
                          <DropdownMenuItem asChild className="cursor-pointer">
                            <Link to={`/admin/employees/${emp.id}`}>
                              <Eye className="h-3.5 w-3.5 mr-2 text-primary" />
                              <span>Ver Detalhes do Vínculo</span>
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild className="cursor-pointer">
                            <Link to={`/admin/users/${emp.user_id}`}>
                              <User className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                              <span>Ver Cadastro do Usuário</span>
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild className="cursor-pointer">
                            <Link to={`/admin/restaurants/${emp.restaurant_id}`}>
                              <Store className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                              <span>Ver Restaurante</span>
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem asChild className="cursor-pointer">
                            <Link to={`/admin/restaurants/${emp.restaurant_id}/support`}>
                              <Headphones className="h-3.5 w-3.5 mr-2 text-amber-500" />
                              <span>Acessar Suporte</span>
                            </Link>
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
    </div>
  );
}
