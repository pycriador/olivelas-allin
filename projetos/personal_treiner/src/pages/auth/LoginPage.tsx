import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { Dumbbell, Sparkles, User, Lock, ArrowRight, Sun, Moon } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, quickLogin } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toastError('Preencha seu e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        toastSuccess('Login efetuado com sucesso!');
        navigate(res.role === 'personal' || res.role === 'admin' ? '/personal/dashboard' : '/student/dashboard');
      } else {
        toastError(res.error || 'Credenciais inválidas.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (userId: string, targetRole: 'personal' | 'student') => {
    setLoading(true);
    try {
      const ok = await quickLogin(userId);
      if (ok) {
        toastSuccess(`Bem-vindo(a) ao sistema!`);
        navigate(targetRole === 'personal' ? '/personal/dashboard' : '/student/dashboard');
      } else {
        toastError('Não foi possível carregar este perfil de demonstração.');
      }
    } finally {
      setLoading(false);
    }
  };

  const trainerUsers = [
    {
      id: 'user-rafaela',
      name: 'Rafaela Silva',
      email: 'rafaela@rafaelapersonal.com.br',
      role: 'personal' as const,
      tag: 'Admin Global • 8 Alunos',
      desc: 'Super Administradora: acesso total, gestão de personais, alunos globais, financeiro e IA',
      avatarUrl: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=150&auto=format&fit=crop&q=80',
      badgeVariant: 'brand' as const,
      color: 'border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 transition-all shadow-2xs',
    },
    {
      id: 'user-carlos',
      name: 'Carlos Mendes',
      email: 'carlos@mendesfit.com.br',
      role: 'personal' as const,
      tag: 'Personal Trainer • 6 Alunos',
      desc: 'Especialista em Força & Hipertrofia Masculina: 6 alunos alocados',
      avatarUrl: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=150&auto=format&fit=crop&q=80',
      badgeVariant: 'info' as const,
      color: 'border-blue-500/30 bg-blue-50/70 dark:bg-blue-950/20 hover:bg-blue-100/60 dark:hover:bg-blue-900/30 transition-all shadow-2xs',
    },
    {
      id: 'user-mariana',
      name: 'Mariana Duarte',
      email: 'mariana@duartepersonal.com.br',
      role: 'personal' as const,
      tag: 'Personal Trainer • 6 Alunos',
      desc: 'Especialista em Funcional & Pilates: 6 alunos alocados',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      badgeVariant: 'neutral' as const,
      color: 'border-purple-500/30 bg-purple-50/70 dark:bg-purple-950/20 hover:bg-purple-100/60 dark:hover:bg-purple-900/30 transition-all shadow-2xs',
    },
  ];

  const studentUsers = [
    {
      id: 'user-student-1',
      name: 'Lucas Oliveira',
      email: 'lucas.oliveira@email.com',
      role: 'student' as const,
      tag: 'Aluno • Treinos 100% em Dia',
      desc: 'Área do Aluno: ficha de treino, execução de séries e financeiro em dia',
      color: 'border-slate-200/90 dark:border-white/[0.08] bg-slate-50/70 dark:bg-dark-cardElevated/50 hover:bg-slate-100 dark:hover:bg-dark-cardElevated transition-colors shadow-2xs',
    },
    {
      id: 'user-student-2',
      name: 'Beatriz Mendes',
      email: 'beatriz.mendes@email.com',
      role: 'student' as const,
      tag: 'Aluna • Treinos em Dia',
      desc: 'Área do Aluno: ficha de treino, execução de séries e financeiro em dia',
      color: 'border-slate-200/90 dark:border-white/[0.08] bg-slate-50/70 dark:bg-dark-cardElevated/50 hover:bg-slate-100 dark:hover:bg-dark-cardElevated transition-colors shadow-2xs',
    },
    {
      id: 'user-student-3',
      name: 'Rodrigo Albuquerque',
      email: 'rodrigo.albuquerque@email.com',
      role: 'student' as const,
      tag: 'Aluno • Financeiro Vencido',
      desc: 'Área do Aluno: mensalidade em atraso há 18 dias e treinos atrasados',
      color: 'border-slate-200/90 dark:border-white/[0.08] bg-slate-50/70 dark:bg-dark-cardElevated/50 hover:bg-slate-100 dark:hover:bg-dark-cardElevated transition-colors shadow-2xs',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-white flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Theme toggle in corner */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2.5 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors shadow-2xs"
        title="Alternar tema"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4 text-slate-400" /> : <Moon className="w-4 h-4" />}
      </button>

      <div className="max-w-md w-full space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <BrandLogo size="lg" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Olivelas - Personal Trainer TRAINING
          </h1>
          <p className="text-xs sm:text-sm font-normal text-slate-500 dark:text-dark-muted">
            Plataforma de Treinos Personalizados • Prescrição & Execução
          </p>
        </div>

        {/* Manual Login Form */}
        <Card className="p-5">
          <form onSubmit={handleManualLogin} className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Acesse sua conta
            </h2>
            <Input
              label="E-mail"
              type="email"
              placeholder="Informe seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
            />
            <Input
              label="Senha"
              type="password"
              placeholder="Informe sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
            />
            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              isLoading={loading}
            >
              Entrar na Plataforma
            </Button>
          </form>
        </Card>

        {/* Disclaimer / Architecture Notice */}
        <div className="text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
            Arquitetura preparada para substituição por Supabase Auth / JWT. Dados persistidos localmente via Repository Pattern.
          </p>
        </div>
      </div>
    </div>
  );
};
