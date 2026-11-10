import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  BarChart3,
  Users,
  Shield,
  Plus,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  Share2,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../lib/api';
import { Form, Dashboard, User } from '../types';
import { useAuth } from '../stores/authStore';
import { useI18n } from '../i18n';
import { toast } from 'sonner';

export const DashboardOverviewPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { t } = useI18n();

  const [forms, setForms] = useState<Form[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [formsData, dashData, usersData] = await Promise.all([
        api.getForms(),
        api.getDashboards(),
        api.getUsers().catch(() => []),
      ]);
      setForms(formsData);
      setDashboards(dashData);
      setUsersCount(usersData.length || 4);
    } catch (err: any) {
      toast.error('Erro ao carregar dados do painel.');
    } finally {
      setLoading(false);
    }
  };

  const totalResponses = forms.reduce((acc, f) => acc + (f.responses_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-surface/90 border border-border shadow-md glass">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Painel Executivo Olivelas IAM Forms</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Olá, {user.full_name}!
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus formulários de alta precisão, controle de acessos (IAM/HBAC), integrações Google e dashboards interativos.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between glass">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Formulários</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-black">{forms.length}</span>
            <span className="text-xs text-muted-foreground ml-2">criados</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between glass">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Respostas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-black">{totalResponses}</span>
            <span className="text-xs text-muted-foreground ml-2">envios</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between glass">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dashboards</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-black">{dashboards.length}</span>
            <span className="text-xs text-muted-foreground ml-2">ativos</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between glass">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">IAM Usuários</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-black">{usersCount}</span>
            <span className="text-xs text-muted-foreground ml-2">cadastrados</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="p-4 rounded-2xl bg-surface/70 border border-border glass flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Ações Rápidas:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/app/forms/new"
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Novo Formulário
          </Link>
          <Link
            to="/app/dashboards/new"
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-border bg-surface hover:bg-surface-hover transition-all flex items-center gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-500" /> Novo Dashboard
          </Link>
          <Link
            to="/app/integrations"
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-border bg-surface hover:bg-surface-hover transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> Conectar Google
          </Link>
        </div>
      </div>

      {/* Recent Forms Section */}
      <div className="rounded-2xl bg-surface border border-border shadow-sm p-5 glass space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Formulários Recentes</h2>
            <p className="text-xs text-muted-foreground">Últimos formulários criados ou compartilhados com você</p>
          </div>
          <Link to="/app/forms" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            Ver Todos <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {forms.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">Nenhum formulário encontrado.</p>
            <Link
              to="/app/forms/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary"
            >
              <Plus className="w-4 h-4" /> Criar Primeiro Formulário
            </Link>
          </div>
        ) : (
          <div className="responsive-table-shell overflow-x-auto">
            <table className="w-full text-left text-xs responsive-mobile-cards">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3">Título do Formulário</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Campos</th>
                  <th className="py-3 px-3">Respostas</th>
                  <th className="py-3 px-3">Seu Acesso</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {forms.slice(0, 5).map((form) => (
                  <tr key={form.id} className="hover:bg-surface-hover/60 transition-colors">
                    <td data-mobile-label="Título" className="py-3 px-3">
                      <div className="font-bold text-foreground">{form.title}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-xs">{form.description || 'Sem descrição'}</div>
                    </td>
                    <td data-mobile-label="Status" className="py-3 px-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        form.status === 'published' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {form.status === 'published' ? 'Publicado' : form.status}
                      </span>
                    </td>
                    <td data-mobile-label="Campos" className="py-3 px-3 font-semibold">
                      {form.fields_count || 0} perguntas
                    </td>
                    <td data-mobile-label="Respostas" className="py-3 px-3 font-semibold text-primary">
                      {form.responses_count || 0} envios
                    </td>
                    <td data-mobile-label="Acesso" className="py-3 px-3">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-muted">
                        {form.user_role === 'owner' ? 'Proprietário' : form.user_role === 'editor' ? 'Editor' : 'Visualizador'}
                      </span>
                    </td>
                    <td className="mobile-table-actions py-3 px-3 text-right space-x-2">
                      <Link
                        to={`/app/forms/${form.id}`}
                        className="px-2.5 py-1 rounded-lg border border-border text-[11px] font-semibold hover:bg-surface transition-colors"
                      >
                        Editar
                      </Link>
                      <Link
                        to={`/app/forms/${form.id}/responses`}
                        className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary/20 transition-colors"
                      >
                        Respostas
                      </Link>
                      <Link
                        to={`/f/${form.share_code}`}
                        target="_blank"
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground inline-flex items-center"
                        title="Ver formulário público"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
