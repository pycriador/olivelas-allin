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

export function RegisterPage() {
  const navigate = useNavigate();
  const { signUpWithEmail, signInWithGoogle, isMockAuth } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) {
      newErrors.name = 'Informe seu nome completo.';
    }

    if (!email.trim()) {
      newErrors.email = 'Informe o seu e-mail.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Insira um e-mail válido.';
    }

    if (!password) {
      newErrors.password = 'Crie uma senha.';
    } else if (password.length < 6) {
      newErrors.password = 'A senha deve ter no mínimo 6 caracteres.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirme sua senha.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await signUpWithEmail(email, password, name);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Conta criada com sucesso!');
        if (isMockAuth) {
          toast.info('Modo demonstração ativo (configure o Supabase para persistência real).');
        }
        navigate('/app');
      }
    } catch {
      toast.error('Não foi possível realizar o cadastro. Verifique os dados e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        toast.error(result.error);
      } else {
        if (isMockAuth) {
          toast.success('Conta criada via Google com sucesso!');
          navigate('/app');
        }
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
            Criar conta no Olivelas
          </CardTitle>
          <CardDescription className="text-sm">
            Cadastre-se para gerenciar as operações do seu restaurante.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5 text-left">
              <Label htmlFor="name" required>
                Nome
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome ou do gestor"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                error={Boolean(errors.name)}
                autoComplete="name"
                disabled={isLoading || isGoogleLoading}
                required
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1 font-medium">{errors.name}</p>
              )}
            </div>

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
              <Label htmlFor="password" required>
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                error={Boolean(errors.password)}
                autoComplete="new-password"
                disabled={isLoading || isGoogleLoading}
                required
              />
              {errors.password && (
                <p className="text-xs text-destructive mt-1 font-medium">{errors.password}</p>
              )}
            </div>

            <div className="space-y-1.5 text-left">
              <Label htmlFor="confirmPassword" required>
                Confirmar senha
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repita sua senha"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                error={Boolean(errors.confirmPassword)}
                autoComplete="new-password"
                disabled={isLoading || isGoogleLoading}
                required
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive mt-1 font-medium">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full font-semibold"
              isLoading={isLoading}
              loadingText="Criando conta..."
              disabled={isGoogleLoading}
            >
              Criar conta
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
            onClick={handleGoogleSignup}
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
            Já possui uma conta?{' '}
            <Link
              to="/login"
              className="font-semibold text-primary hover:underline transition-all underline-offset-4"
            >
              Entrar
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
