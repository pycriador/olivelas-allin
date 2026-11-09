import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Shield, Store, Calendar, Mail, Phone, UserCheck, UserX, ChevronDown, KeyRound, ScrollText } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { iamService } from '@/services/iamService';
import type { PlatformUser, UserStatus } from '@/types/iam';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AdminUserDetailsPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    iamService.getUserById(userId).then((res) => {
      if (res.data) setUser(res.data);
      setIsLoading(false);
    });
  }, [userId]);

  const handleToggleStatus = async () => {
    if (!user) return;
    const nextStatus: UserStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await iamService.updateUserStatus(user.id, nextStatus, currentUser?.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Usuário ${nextStatus === 'suspended' ? 'suspenso' : 'reativado'} com sucesso.`);
        setUser({ ...user, status: nextStatus });
      }
    } catch {
      toast.error('Erro ao alterar status.');
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) {
      toast.error('Usuário não possui e-mail cadastrado.');
      return;
    }
    try {
      const res = await iamService.resetUserPassword(user.email, currentUser?.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Instruções de redefinição de senha enviadas para ${user.email}.`);
      }
    } catch {
      toast.error('Erro ao solicitar redefinição.');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-muted-foreground">Carregando detalhes do usuário...</div>;
  }

  if (!user) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">Usuário não encontrado</h2>
        <Button asChild variant="outline">
          <Link to="/admin/users">Voltar para Usuários</Link>
        </Button>
      </div>
    );
  }

  const isSuper = user.platform_roles.includes('global_admin');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="h-8 px-2">
            <Link to="/admin/users">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {user.full_name || 'Sem nome cadastrado'}
              <Badge variant={user.status === 'active' ? 'default' : 'destructive'} className="text-[10px]">
                {user.status}
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
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
            <DropdownMenuLabel>Ações do Usuário</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleResetPassword} className="cursor-pointer">
              <KeyRound className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <span>Redefinir Senha</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleToggleStatus} className="cursor-pointer">
              {user.status === 'active' ? (
                <>
                  <UserX className="h-3.5 w-3.5 mr-2 text-amber-500" />
                  <span>Suspender Usuário</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                  <span>Reativar Usuário</span>
                </>
              )}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to={`/admin/audit?search=${encodeURIComponent(user.email || '')}`}>
                <ScrollText className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <span>Ver Trilha de Auditoria</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="border-border md:col-span-1">
          <CardHeader className="text-center pb-2">
            <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl mx-auto mb-3">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                user.full_name?.slice(0, 2).toUpperCase() || 'US'
              )}
            </div>
            <CardTitle className="text-base font-bold">{user.full_name || 'Sem nome cadastrado'}</CardTitle>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="flex items-center justify-between text-xs py-1 border-b border-border/60">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={user.status === 'active' ? 'default' : 'destructive'} className="text-[10px]">
                {user.status}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-b border-border/60">
              <span className="text-muted-foreground">Papel Global</span>
              {isSuper ? (
                <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">👑 Global Admin</span>
              ) : (
                <span className="text-muted-foreground text-[11px]">Usuário Comum</span>
              )}
            </div>

            {user.phone && (
              <div className="flex items-center justify-between text-xs py-1 border-b border-border/60">
                <span className="text-muted-foreground">Telefone</span>
                <span>{user.phone}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-muted-foreground">Cadastro</span>
              <span>{new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
            </div>

            {!isSuper && (
              <Button
                variant={user.status === 'active' ? 'destructive' : 'default'}
                size="sm"
                onClick={handleToggleStatus}
                className="w-full text-xs mt-4"
              >
                {user.status === 'active' ? (
                  <>
                    <UserX className="h-3.5 w-3.5 mr-1.5" />
                    Suspender Usuário
                  </>
                ) : (
                  <>
                    <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                    Reativar Usuário
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Affiliated Restaurants & Roles */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" />
                Restaurantes Vinculados ({user.restaurants?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {(!user.restaurants || user.restaurants.length === 0) ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Este usuário ainda não pertence a nenhuma unidade de restaurante.
                </p>
              ) : (
                user.restaurants.map((rest) => (
                  <div
                    key={rest.id}
                    className="p-3 rounded-lg border border-border/70 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <h4 className="font-semibold text-foreground">{rest.name}</h4>
                      <p className="text-[11px] text-muted-foreground capitalize">
                        Cargo: <strong>{rest.role_id.replace('_', ' ')}</strong> · Status: {rest.status}
                      </p>
                    </div>

                    <Button variant="outline" size="sm" asChild className="h-7 text-xs">
                      <Link to={`/admin/restaurants/${rest.id}`}>Ver Restaurante</Link>
                    </Button>
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
