import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { mockUsers } from '../mock-data/users';
import { Building2, Lock, Mail, ArrowRight, UserCheck, Shield, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const LoginView: React.FC = () => {
  const { loginAs, setCurrentView } = useApp();
  const [email, setEmail] = useState('willian.o.jesus@gmail.com');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      // Login as Willian Silva by default
      const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) || mockUsers[0];
      loginAs(user, 'condo-solar-park', 'resident');
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 mb-4">
          <Building2 className="w-8 h-8" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Condominium Platform
          </h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            v0.1 (Beta)
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Acesse todos os seus condomínios e imóveis com uma única conta
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-xl">
          <form onSubmit={handleStandardLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                E-mail de Acesso
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="seu.email@exemplo.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Senha
                </label>
                <a href="#" className="text-xs text-blue-600 hover:underline">
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Entrar na Plataforma
            </Button>
          </form>

          {/* Quick Persona Logins for Easy Mockup Evaluation */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Acesso Rápido para Avaliação:
              </span>
              <Badge variant="purple" size="sm">Mockup Mode</Badge>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => loginAs(mockUsers[0], 'condo-solar-park', 'resident')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 flex items-center justify-center font-bold text-xs">
                    WS
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      Willian Silva (Morador & Síndico)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      3 condomínios vinculados (Solar Park, Green Village, Jardim)
                    </p>
                  </div>
                </div>
                <Badge variant="primary" size="sm">Entrar</Badge>
              </button>

              <button
                type="button"
                onClick={() => loginAs(mockUsers[1], 'condo-solar-park', 'admin')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-purple-500 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-600 flex items-center justify-center font-bold text-xs">
                    PG
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                      Patrícia Gomes (Administradora Alpha)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Gestora profissional de condomínios
                    </p>
                  </div>
                </div>
                <Badge variant="purple" size="sm">Admin</Badge>
              </button>

              <button
                type="button"
                onClick={() => loginAs(mockUsers[2], 'condo-solar-park', 'global_admin')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-blue-400 flex items-center justify-center font-bold text-xs">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                      Carlos Eduardo (SuperAdmin SaaS)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Gestor Global de Tenants e Feature Flags
                    </p>
                  </div>
                </div>
                <Badge variant="neutral" size="sm">SuperAdmin</Badge>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setCurrentView('landing')}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              ← Voltar para a Landing Page
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
