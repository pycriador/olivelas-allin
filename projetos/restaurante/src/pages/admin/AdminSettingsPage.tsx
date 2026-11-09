import { useState } from 'react';
import { Settings, Save, ShieldCheck, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AdminSettingsPage() {
  const [platformName, setPlatformName] = useState('Olivelas Restaurant');
  const [supportTimeoutHours, setSupportTimeoutHours] = useState('4');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Configurações da plataforma salvas com sucesso.');
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Configurações Globais da Plataforma
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Parâmetros do sistema SaaS, políticas de suporte e governança de auditoria.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-border">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-semibold">Identidade do SaaS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="platform-name" className="text-xs">Nome do Sistema</Label>
              <Input
                id="platform-name"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="text-xs max-w-md"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-semibold">Políticas de Suporte & Auditoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="timeout" className="text-xs">Tempo Limite da Sessão de Suporte (Horas)</Label>
              <Input
                id="timeout"
                type="number"
                value={supportTimeoutHours}
                onChange={(e) => setSupportTimeoutHours(e.target.value)}
                className="text-xs max-w-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Sessões de suporte ativas serão automaticamente encerradas com evento no log após este período.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>
                <strong>Modo Append-Only Ativo:</strong> Nenhuma alteração manual ou exclusão de registros da tabela <code>audit_logs</code> é permitida por RLS.
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} size="sm" className="text-xs">
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
}
