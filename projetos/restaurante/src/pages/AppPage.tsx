import { useNavigate } from 'react-router-dom';
import { LogOut, CheckCircle2, Building2, Store, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

export function AppPage() {
  const navigate = useNavigate();
  const { user, signOut, isMockAuth } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Sessão encerrada com sucesso.');
      navigate('/login');
    } catch {
      toast.error('Erro ao encerrar a sessão.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Authenticated Top Navigation */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo to="/app" />

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md bg-muted/50 border border-border/60 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-muted-foreground truncate max-w-[180px]">
                {user?.email || 'operador'}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl space-y-6">
          {/* Status Alert if in Mock Auth */}
          {isMockAuth && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <Clock className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-semibold">Ambiente de Demonstração</p>
                <p className="opacity-90">
                  Autenticação simulada ativada. Configure <code className="font-mono text-[11px] bg-amber-500/20 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> e <code className="font-mono text-[11px] bg-amber-500/20 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> para conectar ao banco em produção.
                </p>
              </div>
            </div>
          )}

          {/* Provisional Authenticated Area Card */}
          <Card className="border-border shadow-sm text-center">
            <CardHeader className="pb-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">
                Olivelas Restaurant
              </CardTitle>
              <div className="flex items-center justify-center gap-2 pt-1">
                <Badge variant="success" className="font-mono text-xs">
                  Autenticado
                </Badge>
                {user?.name && (
                  <span className="text-xs text-muted-foreground">
                    Olá, <strong>{user.name}</strong>
                  </span>
                )}
              </div>
              <CardDescription className="text-sm pt-2">
                Você está autenticado no sistema.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-2">
              <div className="rounded-lg border border-border/80 bg-muted/30 p-5 text-left space-y-3">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <Store className="h-4 w-4 text-primary" />
                  <span>Próxima etapa:</span>
                </div>
                <p className="text-sm font-medium text-foreground">
                  Configuração do restaurante.
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Nas próximas fases você poderá cadastrar os dados fiscais do seu estabelecimento, definir o layout de mesas físicas, registrar o cardápio com preços e categorias, e conectar a estação da cozinha (KDS).
                </p>
              </div>

              {/* Roadmap indicator */}
              <div className="space-y-2 text-left">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  Planejamento de Módulos (Fases Futuras)
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-md border border-border/60 bg-card flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Cadastro da Unidade</span>
                  </div>
                  <div className="p-2.5 rounded-md border border-border/60 bg-card flex items-center gap-2 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-border" />
                    <span>Mapa de Mesas</span>
                  </div>
                  <div className="p-2.5 rounded-md border border-border/60 bg-card flex items-center gap-2 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-border" />
                    <span>Cardápio Digital</span>
                  </div>
                  <div className="p-2.5 rounded-md border border-border/60 bg-card flex items-center gap-2 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-border" />
                    <span>KDS Cozinha</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="w-full sm:w-auto px-6 text-sm"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
