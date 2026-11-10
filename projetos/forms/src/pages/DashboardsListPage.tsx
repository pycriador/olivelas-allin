import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Trash2,
  Share2,
  FileText,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import { Dashboard } from '../types';
import { toast } from 'sonner';
import { useUrlParams } from '../hooks/useUrlParams';
import { PaginationBar } from '../components/PaginationBar';

export const DashboardsListPage: React.FC = () => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);

  const { search, page, limit, getParam, setParam, setPage, setSearch } = useUrlParams(9);
  const visibilityFilter = getParam('visibility', 'all');

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [dashToDelete, setDashToDelete] = useState<Dashboard | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const dashData = await api.getDashboards();
      setDashboards(dashData);
    } catch (err: any) {
      toast.error('Erro ao carregar lista de dashboards.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!dashToDelete) return;
    try {
      await api.deleteDashboard(dashToDelete.id);
      toast.success('Dashboard excluído com sucesso.');
      setDeleteModalOpen(false);
      setDashToDelete(null);
      loadData();
    } catch (err: any) {
      toast.error('Erro ao excluir dashboard.');
    }
  };

  const handleCopyLink = (shareCode: string) => {
    const url = `${window.location.origin}/d/${shareCode}`;
    navigator.clipboard.writeText(url);
    toast.success('Link do dashboard copiado para a área de transferência!');
  };

  const filteredDashboards = useMemo(() => {
    return dashboards.filter((d) => {
      const matchesSearch =
        !search ||
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        (d.description && d.description.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      if (visibilityFilter === 'public' && !d.is_public) return false;
      if (visibilityFilter === 'private' && d.is_public) return false;

      return true;
    });
  }, [dashboards, search, visibilityFilter]);

  const paginatedDashboards = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredDashboards.slice(start, start + limit);
  }, [filteredDashboards, page, limit]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Dashboards Interativos</h1>
          <p className="text-xs text-muted-foreground">
            Crie e personalize gráficos de pizza, linha, barras e métricas em tempo real, públicos ou privados.
          </p>
        </div>

        <Link
          to="/app/dashboards/new"
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Criar Novo Dashboard
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-border glass flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar dashboards por título ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            value={visibilityFilter}
            onChange={(e) => setParam('visibility', e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-border bg-background text-foreground font-medium"
          >
            <option value="all">Todas as Visibilidades</option>
            <option value="public">Públicos</option>
            <option value="private">Privados</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-muted-foreground">Carregando dashboards...</div>
      ) : paginatedDashboards.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-border bg-surface/50 p-8 space-y-3">
          <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <p className="text-sm font-semibold text-foreground">Nenhum dashboard interativo encontrado.</p>
          <p className="text-xs text-muted-foreground">Transforme suas respostas em gráficos analíticos dinâmicos.</p>
          <Link
            to="/app/dashboards/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary mt-2"
          >
            <Plus className="w-4 h-4" /> Criar Primeiro Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedDashboards.map((dash) => (
            <div
              key={dash.id}
              className="rounded-2xl border border-border bg-surface shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden glass group"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      dash.is_public
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {dash.is_public ? 'Público' : 'Privado'}
                  </span>

                  <span className="text-[10px] font-bold text-muted-foreground">
                    {dash.widgets_count || 0} widgets
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-foreground leading-snug group-hover:text-primary transition-colors">
                    {dash.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {dash.description || 'Nenhuma descrição informada.'}
                  </p>
                </div>

                {dash.form_title && (
                  <div className="p-2.5 rounded-xl bg-muted/40 text-[11px] text-muted-foreground flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">
                      Formulário: <strong>{dash.form_title}</strong>
                    </span>
                  </div>
                )}
              </div>

              <div className="px-5 py-3 border-t border-border/80 bg-surface-elevated/40 flex items-center justify-between gap-2">
                <Link
                  to={`/app/dashboards/${dash.id}`}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
                >
                  Abrir Editor
                </Link>

                <div className="flex items-center gap-1">
                  {dash.share_code && (
                    <button
                      onClick={() => handleCopyLink(dash.share_code!)}
                      className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary hover:bg-surface transition-colors"
                      title="Copiar Link Público"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {dash.share_code && (
                    <Link
                      to={`/d/${dash.share_code}`}
                      target="_blank"
                      className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                      title="Abrir Visualização Pública"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setDashToDelete(dash);
                      setDeleteModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Excluir Dashboard"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* URL-bound pagination */}
      <PaginationBar
        totalItems={filteredDashboards.length}
        currentPage={page}
        pageSize={limit}
        onPageChange={setPage}
      />

      {/* Modal: Delete Confirmation */}
      {deleteModalOpen && dashToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface rounded-2xl p-6 shadow-2xl border border-border space-y-4">
            <h2 className="text-base font-bold text-destructive">Confirmar Exclusão de Dashboard</h2>
            <p className="text-xs text-muted-foreground">
              Tem certeza que deseja excluir o dashboard <strong>"{dashToDelete.title}"</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-surface-hover"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-destructive hover:bg-destructive/90"
              >
                Excluir Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
