import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable/index';
import { Mail, Lock, LogIn, UserPlus, ArrowLeft, Check } from 'lucide-react';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [params] = useSearchParams();
  const [isLogin, setIsLogin] = useState(params.get('mode') !== 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setError('');
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result.error) setError('Não foi possível entrar com o Google.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Preencha todos os campos.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      const { error } = await signUp(email, password);
      if (error) setError(error);
      else setSuccess('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-sm animate-fade-in">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </Link>

        <div className="mt-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
            Rotina da Casa
          </p>
          <h1 className="mt-3 font-heading text-3xl font-light tracking-tight text-foreground">
            {isLogin ? 'Entrar na sua rotina' : 'Criar sua conta'}
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            {isLogin ? 'Bem-vindo de volta.' : 'Leva menos de um minuto.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4 border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          {error && (
            <div className="border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>
          )}
          {success && (
            <div className="flex items-start gap-2 border border-success/30 bg-success/5 p-3 text-sm text-success">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0" />
              {success}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-2.5 border border-border bg-background px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-secondary"
          >
            <GoogleMark /> Continuar com Google
          </button>

          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">ou</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-border bg-background py-3 pl-10 pr-3.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-border bg-background py-3 pl-10 pr-3.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 border border-foreground bg-foreground px-4 py-3 text-xs font-medium uppercase tracking-[0.16em] text-background transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {loading ? 'Aguarde...' : isLogin ? (<><LogIn className="h-3.5 w-3.5" /> Entrar</>) : (<><UserPlus className="h-3.5 w-3.5" /> Criar conta</>)}
          </button>

          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
            className="w-full text-xs font-light text-muted-foreground transition-colors hover:text-foreground"
          >
            {isLogin ? 'Não tem conta? Criar agora' : 'Já tem conta? Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.45a5.5 5.5 0 0 1-2.39 3.62v3h3.86c2.26-2.08 3.58-5.15 3.58-8.8Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.94-2.93l-3.86-3c-1.08.72-2.45 1.15-4.08 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.26a7.2 7.2 0 0 1 0-4.52V6.65H1.28a12 12 0 0 0 0 10.7l3.99-3.09Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.65l3.99 3.09C6.22 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  );
}
