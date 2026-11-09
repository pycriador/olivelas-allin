import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { GoogleIcon } from '@/components/ui/google-icon';
import { useAuth } from '@/hooks/useAuth';
import { isGlobalAdminEmail } from '@/constants/admin';

export function LoginPage() {
  const navigate = useNavigate();
  const { signInWithEmail, signInWithGoogle, isMockAuth } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = 'Informe o seu e-mail.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Insira um formato de e-mail válido.';
    }

    if (!password) {
      newErrors.password = 'Informe sua senha.';
    } else if (password.length < 6) {
      newErrors.password = 'A senha deve ter no mínimo 6 caracteres.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await signInWithEmail(email, password);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Login realizado com sucesso!');
        if (isMockAuth) {
          toast.info('Modo demonstração ativo (configure as variáveis do Supabase para conexão real).');
        }
        const isGlobal = isGlobalAdminEmail(email);
        navigate(isGlobal ? '/admin' : '/app');
      }
    } catch {
      toast.error('Não foi possível realizar o login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        toast.error(result.error);
      } else {
        if (isMockAuth) {
          toast.success('Acesso com Google simulado com sucesso!');
          navigate('/app');
        }
        // In real Supabase OAuth, the browser will redirect to Google's consent screen
      }
    } catch {
      toast.error('Falha ao autenticar com o Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="border-border/80 shadow-md">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Bem-vindo ao Olivelas Restaurant
          </CardTitle>
          <CardDescription className="text-sm">
            Entre para acessar seu restaurante.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5 text-left">
              <Label htmlFor="email" required>
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@restaurante.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                error={Boolean(errors.email)}
                autoComplete="email"
                disabled={isLoading || isGoogleLoading}
                required
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1 font-medium">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" required>
                  Senha
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                error={Boolean(errors.password)}
                autoComplete="current-password"
                disabled={isLoading || isGoogleLoading}
                required
              />
              {errors.password && (
                <p className="text-xs text-destructive mt-1 font-medium">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full font-semibold"
              isLoading={isLoading}
              loadingText="Entrando..."
              disabled={isGoogleLoading}
            >
              Entrar
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2.5 font-medium"
            onClick={handleGoogleLogin}
            isLoading={isGoogleLoading}
            loadingText="Conectando..."
            disabled={isLoading}
          >
            <GoogleIcon className="h-4 w-4" />
            Continuar com Google
          </Button>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-border/60 py-4 text-xs text-muted-foreground">
          <p>
            Ainda não possui uma conta?{' '}
            <Link
              to="/register"
              className="font-semibold text-primary hover:underline transition-all underline-offset-4"
            >
              Criar conta
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
