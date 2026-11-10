import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, Shield, ArrowRight, UserCheck, Lock, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '../stores/authStore';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Informe seu e-mail cadastrado.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login efetuado com sucesso!');
      navigate('/app');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, label: string) => {
    setLoading(true);
    try {
      await login(demoEmail);
      toast.success(`Entrando como ${label}...`);
      navigate('/app');
    } catch (err: any) {
      toast.error(err.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-indigo-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
            <Layers className="w-7 h-7" />
          </div>
        </Link>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Olivelas <span className="text-indigo-400">IAM Forms</span>
        </h2>
        <p className="text-sm text-slate-400">
          Autenticação corporativa com controle de permissões HBAC
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@olivelas.com"
                  className="w-full text-sm pl-10 pr-3 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Senha de Acesso</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm pl-10 pr-3 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar no Sistema'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick-switch Profiles */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Acesso Rápido por Perfil (Supabase & Demo)
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('willian.o.jesus@gmail.com', 'Willian Jesus (Admin)')}
                className="p-2.5 rounded-xl border border-indigo-500/40 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-xs font-semibold text-left transition-colors flex flex-col col-span-2 sm:col-span-1"
              >
                <span className="font-bold flex items-center justify-between">
                  Willian Jesus <span className="text-[9px] bg-indigo-500 text-white px-1.5 py-0.2 rounded font-mono">SUPABASE</span>
                </span>
                <span className="text-[10px] text-slate-400">willian.o.jesus@gmail.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('py.criador@gmail.com', 'Py Criador (Criador)')}
                className="p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-semibold text-left transition-colors flex flex-col col-span-2 sm:col-span-1"
              >
                <span className="font-bold flex items-center justify-between">
                  Py Criador <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.2 rounded font-mono">SUPABASE</span>
                </span>
                <span className="text-[10px] text-slate-400">py.criador@gmail.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@olivelas.com', 'Administrador Global')}
                className="p-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-semibold text-left transition-colors flex flex-col"
              >
                <span className="font-bold">Admin Global</span>
                <span className="text-[10px] text-slate-400">admin@olivelas.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('creator@olivelas.com', 'Criador')}
                className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold text-left transition-colors flex flex-col"
              >
                <span className="font-bold">Criador de Forms</span>
                <span className="text-[10px] text-slate-400">creator@olivelas.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('editor@olivelas.com', 'Editor Convidado')}
                className="p-2.5 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-semibold text-left transition-colors flex flex-col"
              >
                <span className="font-bold">Editor Convidado</span>
                <span className="text-[10px] text-slate-400">editor@olivelas.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('viewer@olivelas.com', 'Visualizador')}
                className="p-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold text-left transition-colors flex flex-col"
              >
                <span className="font-bold">Visualizador</span>
                <span className="text-[10px] text-slate-400">viewer@olivelas.com</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
