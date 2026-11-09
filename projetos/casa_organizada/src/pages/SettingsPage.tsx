import { Settings, Baby, Dog, RotateCcw, Download, Upload, LogOut, Shield, ClipboardList, ChevronRight, User, Palette } from 'lucide-react';
import { Link } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import { useRoutine } from '@/hooks/useRoutine';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { settings, updateSettings, resetDay, state } = useRoutine();
  const { signOut, user } = useAuth();
  const { isAdmin, isEditor, role } = useUserRole();

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rotina-inteligente-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          localStorage.setItem('rotina-inteligente-state', JSON.stringify(data));
          window.location.reload();
        } catch {
          alert('Arquivo inválido');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary-light)/0.3)_0%,_transparent_70%)] pb-24">
      <header className="px-5 pt-14 pb-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings className="w-5.5 h-5.5 text-primary" />
            </div>
            Configurações
          </h1>
          {user && (
            <p className="text-sm text-muted-foreground/80 mt-2 ml-[3.25rem]">{user.email}</p>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 space-y-4">
        {/* Profile card */}
        <div className="rounded-xl border bg-card shadow-[var(--shadow-card)] p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-bold text-sm text-foreground">Seu nome</h3>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Como devemos te chamar?</p>
            </div>
          </div>
          <input
            type="text"
            value={settings.userName}
            onChange={(e) => updateSettings({ userName: e.target.value })}
            placeholder="Digite seu nome..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
          />
        </div>

        {/* Role badge */}
        {role && (
          <div className="rounded-xl border bg-card shadow-[var(--shadow-card)] p-4 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Seu papel</span>
            <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-primary/10 text-primary">
              {role === 'admin' ? 'Administrador' : role === 'editor' ? 'Editor' : 'Visualizador'}
            </span>
          </div>
        )}

        {/* Admin section */}
        {(isAdmin || isEditor) && (
          <div className="rounded-xl border bg-card shadow-[var(--shadow-card)] p-5 space-y-3">
            <div className="flex items-center gap-2.5 mb-1">
              <Shield className="w-4.5 h-4.5 text-primary" />
              <h3 className="font-heading font-bold text-sm text-foreground">Administração</h3>
            </div>
            {isEditor && (
              <Link
                to="/global-form"
                className="flex items-center justify-between px-4 py-3 rounded-lg border border-border/70 hover:border-primary/30 hover:bg-primary/[0.02] transition-all group"
              >
                <span className="flex items-center gap-2.5 text-sm font-medium text-foreground/80 group-hover:text-foreground">
                  <ClipboardList className="w-4.5 h-4.5 text-primary/70" />
                  Editar tarefas globais
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" />
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin/users"
                className="flex items-center justify-between px-4 py-3 rounded-lg border border-border/70 hover:border-primary/30 hover:bg-primary/[0.02] transition-all group"
              >
                <span className="flex items-center gap-2.5 text-sm font-medium text-foreground/80 group-hover:text-foreground">
                  <Shield className="w-4.5 h-4.5 text-primary/70" />
                  Gerenciar usuários
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" />
              </Link>
            )}
          </div>
        )}

        {/* Modules */}
        <div className="rounded-xl border bg-card shadow-[var(--shadow-card)] p-5 space-y-4">
          <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
            <Palette className="w-4.5 h-4.5 text-muted-foreground" />
            Módulos
          </h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[hsl(var(--pet-bg))] flex items-center justify-center">
                <Dog className="w-4.5 h-4.5 icon-pet" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Modo Pet</p>
                <p className="text-xs text-muted-foreground/70">Tarefas para cuidar dos bichinhos</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ petMode: !settings.petMode })}
              className={cn(
                "w-12 h-7 rounded-full transition-all duration-300 relative flex-shrink-0",
                settings.petMode ? "bg-pet" : "bg-muted/70"
              )}
            >
              <div className={cn(
                "absolute top-0.5 w-6 h-6 rounded-full bg-card shadow-sm transition-all duration-300",
                settings.petMode ? "translate-x-5.5" : "translate-x-0.5"
              )} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[hsl(var(--baby-bg))] flex items-center justify-center">
                <Baby className="w-4.5 h-4.5 icon-baby" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Modo Bebê</p>
                <p className="text-xs text-muted-foreground/70">Higienização extra e cuidados</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ babyMode: !settings.babyMode })}
              className={cn(
                "w-12 h-7 rounded-full transition-all duration-300 relative flex-shrink-0",
                settings.babyMode ? "bg-baby" : "bg-muted/70"
              )}
            >
              <div className={cn(
                "absolute top-0.5 w-6 h-6 rounded-full bg-card shadow-sm transition-all duration-300",
                settings.babyMode ? "translate-x-5.5" : "translate-x-0.5"
              )} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="rounded-xl border bg-card shadow-[var(--shadow-card)] p-5 space-y-3">
          <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
            Ações
          </h3>

          <button
            onClick={resetDay}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border/70 text-sm font-medium text-foreground/80 hover:bg-secondary/50 hover:border-border transition-all"
          >
            <RotateCcw className="w-4.5 h-4.5 text-muted-foreground" />
            Resetar tarefas do dia
          </button>

          <button
            onClick={exportJSON}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border/70 text-sm font-medium text-foreground/80 hover:bg-secondary/50 hover:border-border transition-all"
          >
            <Download className="w-4.5 h-4.5 text-muted-foreground" />
            Exportar rotina (JSON)
          </button>

          <button
            onClick={importJSON}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border/70 text-sm font-medium text-foreground/80 hover:bg-secondary/50 hover:border-border transition-all"
          >
            <Upload className="w-4.5 h-4.5 text-muted-foreground" />
            Importar rotina (JSON)
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-destructive/25 text-destructive text-sm font-semibold hover:bg-destructive/5 transition-all"
        >
          <LogOut className="w-4.5 h-4.5" />
          Sair da conta
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
