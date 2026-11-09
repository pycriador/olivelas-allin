import { useState } from 'react';
import { User, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

export function AdminProfilePage() {
  const { user, resetPassword } = useAuth();
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsSendingReset(true);
    try {
      const res = await resetPassword(user.email);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`E-mail de redefinição enviado com sucesso para ${user.email}.`);
      }
    } catch {
      toast.error('Erro ao solicitar redefinição de senha.');
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Meu Perfil Global Admin
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Informações do operador principal da plataforma Olivelas.
          </p>
        </div>
      </div>

      <Card className="border-border">
        <CardHeader className="text-center pb-2">
          <div className="h-20 w-20 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-2xl mx-auto mb-3">
            👑
          </div>
          <CardTitle className="text-lg font-bold">{user?.name || 'Willian Jesus'}</CardTitle>
          <div className="text-xs text-muted-foreground">{user?.email}</div>
          <div className="pt-2">
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs">
              👑 Global Admin (Superadmin)
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-border/60">
            <span className="text-muted-foreground">ID da Conta Auth</span>
            <span className="font-mono">{user?.id}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-border/60">
            <span className="text-muted-foreground">Privilégios</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Irrestrito (Todos os Tenants)</span>
          </div>

          <div className="pt-4 space-y-2">
            <h4 className="font-semibold text-foreground flex items-center gap-1.5">
              <KeyRound className="h-4 w-4 text-primary" />
              Segurança e Troca de Senha
            </h4>
            <p className="text-muted-foreground text-[11px]">
              Para alterar sua senha, solicite um link seguro que será enviado para seu e-mail corporativo cadastrado.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePasswordReset}
              disabled={isSendingReset}
              className="text-xs mt-2"
            >
              {isSendingReset ? 'Enviando...' : 'Solicitar Redefinição de Senha por E-mail'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
