import { Shield, Palette, Globe, Key, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useLanguage, AppLanguage } from '@/contexts/LanguageContext';

export function SettingsPage() {
  const { user, signOut, isMockAuth } = useAuth();
  const { theme, setTheme } = useTheme();
  const { currentRestaurant } = useRestaurant();
  const { language, setLanguage } = useLanguage();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Desconectado com sucesso.');
      window.location.href = '/';
    } catch {
      toast.error('Erro ao sair.');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="pb-2 border-b border-border/60">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Configurações Gerais</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Parâmetros do sistema, segurança de sessão e preferências da plataforma.
        </p>
      </div>

      {/* Conta & Identidade */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            <span>Conta &amp; Acesso</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Dados de autenticação gerenciados pelo Supabase Auth.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg border border-border/70 bg-muted/20 space-y-1">
              <span className="text-muted-foreground">E-mail autenticado</span>
              <p className="font-semibold text-foreground font-mono truncate">{user?.email}</p>
            </div>

            <div className="p-3 rounded-lg border border-border/70 bg-muted/20 space-y-1">
              <span className="text-muted-foreground">ID do Usuário (UUID)</span>
              <p className="font-semibold text-foreground font-mono text-[11px] truncate">
                {user?.id || '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aparência */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <span>Aparência</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Escolha o esquema de cores para sua estação de trabalho.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'system', label: 'Sistema' },
              { id: 'light', label: 'Claro' },
              { id: 'dark', label: 'Escuro' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id as any)}
                className={`p-3 rounded-lg border text-xs font-semibold text-center transition-all ${
                  theme === t.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-muted/40 text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Idioma */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <span>Idioma da Aplicação</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <button
              type="button"
              onClick={() => {
                setLanguage('pt-BR');
                toast.success('Idioma alterado para Português (Brasil)');
              }}
              className={`p-3 rounded-lg border text-left flex items-center justify-between transition-colors ${
                language === 'pt-BR'
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40'
              }`}
            >
              <span>Português (PT-BR)</span>
              <span className="text-[10px] font-mono font-bold">
                {language === 'pt-BR' ? 'Ativo' : 'Selecionar'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLanguage('en');
                toast.success('Language changed to English (US)');
              }}
              className={`p-3 rounded-lg border text-left flex items-center justify-between transition-colors ${
                language === 'en'
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40'
              }`}
            >
              <span>English (EN)</span>
              <span className="text-[10px] font-mono font-bold">
                {language === 'en' ? 'Active' : 'Select'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLanguage('es');
                toast.success('Idioma cambiado a Español');
              }}
              className={`p-3 rounded-lg border text-left flex items-center justify-between transition-colors ${
                language === 'es'
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40'
              }`}
            >
              <span>Español (ES)</span>
              <span className="text-[10px] font-mono font-bold">
                {language === 'es' ? 'Activo' : 'Seleccionar'}
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Sessão & Segurança */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>Sessão &amp; Tenant Ativo</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Detalhes da conexão e isolamento de segurança.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Restaurante Tenant ID:</span>
              <span className="font-mono text-foreground font-semibold">{currentRestaurant?.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Modo de Autenticação:</span>
              <span className="font-mono text-foreground">
                {isMockAuth ? 'Demonstração Local' : 'Supabase PostgreSQL RLS'}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Encerrar sessão em todos os dispositivos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
