import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Store, Shield, Calendar, Mail, ChevronDown, Headphones, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AdminEmployeeDetailsPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [employee, setEmployee] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!employeeId) return;
    async function load() {
      try {
        if (!isSupabaseConfigured) {
          setEmployee({
            id: employeeId,
            restaurant: { id: 'rest-1', name: 'Olivelas Gastronomia' },
            profile: { id: 'user-1', full_name: 'Willian Jesus', email: 'willian.o.jesus@gmail.com' },
            role_id: 'restaurant_admin',
            status: 'active',
            joined_at: new Date().toISOString(),
          });
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('restaurant_members')
          .select('*, restaurants (id, name), profiles (id, full_name, email)')
          .eq('id', employeeId)
          .single();

        if (error) throw error;
        setEmployee(data);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [employeeId]);

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-muted-foreground">Carregando vínculo de funcionário...</div>;
  }

  if (!employee) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">Vínculo não encontrado</h2>
        <Button asChild variant="outline">
          <Link to="/admin/employees">Voltar para Funcionários</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="h-8 px-2">
            <Link to="/admin/employees">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-xl font-bold tracking-tight">Vínculo de Funcionário</h1>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-xs flex items-center gap-1.5 data-[state=open]:bg-accent"
            >
              <span>Ações</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Ações do Vínculo</DropdownMenuLabel>
            {employee.profiles?.id && (
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to={`/admin/users/${employee.profiles.id}`}>
                  <User className="h-3.5 w-3.5 mr-2 text-primary" />
                  <span>Ver Perfil do Usuário</span>
                </Link>
              </DropdownMenuItem>
            )}

            {employee.restaurants?.id && (
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to={`/admin/restaurants/${employee.restaurants.id}`}>
                  <Store className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <span>Ver Restaurante</span>
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {employee.restaurants?.id && (
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to={`/admin/restaurants/${employee.restaurants.id}/support`}>
                  <Headphones className="h-3.5 w-3.5 mr-2 text-amber-500" />
                  <span>Acessar Suporte</span>
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              {employee.profiles?.full_name || 'Funcionário'}
            </CardTitle>
            <Badge variant={employee.status === 'active' ? 'default' : 'secondary'} className="text-[10px] capitalize">
              {employee.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-border/60">
            <span className="text-muted-foreground">E-mail</span>
            <span>{employee.profiles?.email}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-border/60">
            <span className="text-muted-foreground">Restaurante</span>
            <Link
              to={`/admin/restaurants/${employee.restaurant_id}`}
              className="text-primary hover:underline font-semibold"
            >
              {employee.restaurants?.name || employee.restaurant_id}
            </Link>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-border/60">
            <span className="text-muted-foreground">Cargo / Papel</span>
            <span className="capitalize font-semibold">{employee.role_id?.replace('_', ' ')}</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-muted-foreground">Data de Ingresso</span>
            <span>{new Date(employee.joined_at).toLocaleString('pt-BR')}</span>
          </div>

          <div className="pt-4 flex gap-3">
            <Button asChild variant="outline" size="sm" className="flex-1 text-xs">
              <Link to={`/admin/users/${employee.user_id}`}>Ver Perfil do Usuário</Link>
            </Button>
            <Button asChild size="sm" className="flex-1 text-xs">
              <Link to={`/admin/restaurants/${employee.restaurant_id}`}>Ver Restaurante</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
