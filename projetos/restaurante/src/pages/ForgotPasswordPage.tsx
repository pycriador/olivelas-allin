import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function ForgotPasswordPage() {
  const { resetPassword, isMockAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Digite seu e-mail para continuar.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Insira um e-mail válido.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword(email);
      if (result.error) {
        toast.error(result.error);
        setError(result.error);
      } else {
        setIsSubmitted(true);
        toast.success('Link de recuperação enviado com sucesso!');
        if (isMockAuth) {
          toast.info('Modo demonstração: em produção com Supabase, o link é enviado para a caixa de entrada.');
        }
      }
    } catch {
      toast.error('Não foi possível enviar o link de recuperação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="border-border/80 shadow-md">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Recuperar acesso
          </CardTitle>
          <CardDescription className="text-sm">
            {isSubmitted
              ? 'Verifique as instruções enviadas para o seu e-mail.'
              : 'Digite seu e-mail para receber as instruções de redefinição de senha.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isSubmitted ? (
            <div className="space-y-5 text-center py-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  E-mail enviado para:
                </p>
                <p className="font-mono text-sm text-primary font-semibold">
                  {email}
                </p>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Se este e-mail estiver cadastrado em nossa base, você receberá um link seguro para cadastrar uma nova senha.
              </p>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => setIsSubmitted(false)}
                >
                  Tentar com outro e-mail
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5 text-left">
                <Label htmlFor="email" required>
                  Digite seu e-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@restaurante.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  error={Boolean(error)}
                  autoComplete="email"
                  disabled={isLoading}
                  required
                />
                {error && (
                  <p className="text-xs text-destructive mt-1 font-medium">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full font-semibold"
                isLoading={isLoading}
                loadingText="Enviando link..."
              >
                Enviar link
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex justify-center border-t border-border/60 py-4 text-xs text-muted-foreground">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para o login
          </Link>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
