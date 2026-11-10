import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Trash2,
  Share2,
  Users,
  Check,
  X,
  MoreVertical,
} from 'lucide-react';
import { api } from '../lib/api';
import { Form } from '../types';
import { useAuth } from '../stores/authStore';
import { useI18n } from '../i18n';
import { toast } from 'sonner';
import { useUrlParams } from '../hooks/useUrlParams';
import { PaginationBar } from '../components/PaginationBar';

export const FormsListPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useI18n();

  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Dropdown Menu
  const [activeDropdownFormId, setActiveDropdownFormId] = useState<string | null>(null);

  const { search, page, limit, getParam, setParam, setPage, setSearch } = useUrlParams(9);
  const filterRole = getParam('tab', 'all') as 'all' | 'mine' | 'shared';
  const filterStatus = getParam('status', 'all');

  // Share Modal
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [activeShareForm, setActiveShareForm] = useState<Form | null>(null);
  const [collabEmail, setCollabEmail] = useState('');
  const [collabRole, setCollabRole] = useState<'editor' | 'viewer'>('editor');
  const [inviting, setInviting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<Form | null>(null);

  useEffect(() => {
    loadForms();
    const handleOutsideClick = () => setActiveDropdownFormId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await api.getForms();
      setForms(data);
    } catch (err: any) {
      toast.error('Erro ao carregar lista de formulários.');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (form: Form) => {
    try {
      await api.duplicateForm(form.id);
      toast.success(`Cópia de "${form.title}" criada.`);
      loadForms();
    } catch (err: any) {
      toast.error('Erro ao duplicar formulário.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!formToDelete) return;
    try {
      await api.deleteForm(formToDelete.id);
      toast.success('Formulário excluído.');
      setDeleteModalOpen(false);
      setFormToDelete(null);
      loadForms();
    } catch (err: any) {
      toast.error('Erro ao excluir formulário.');
    }
  };

  const handleInviteCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShareForm || !collabEmail.trim()) return;

    setInviting(true);
    try {
      await api.addCollaborator(activeShareForm.id, collabEmail.trim(), collabRole);
      toast.success(`Acesso de ${collabRole === 'editor' ? 'Editor' : 'Visualizador'} concedido para ${collabEmail}!`);
      setCollabEmail('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao convidar colaborador.');
    } finally {
      setInviting(false);
    }
  };

  const handleCopyPublicLink = (shareCode: string) => {
    const url = `${window.location.origin}/f/${shareCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success('Link do formulário copiado para a área de transferência!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredForms = useMemo(() => {
    return forms.filter((f) => {
      const matchesSearch =
        !search ||
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(search.toLowerCase()));
      if (!matchesSearch) return false;

      if (filterRole === 'mine' && f.user_role !== 'owner') return false;
      if (filterRole === 'shared' && f.user_role !== 'editor' && f.user_role !== 'viewer') return false;

      if (filterStatus !== 'all' && f.status !== filterStatus) return false;

      return true;
    });
  }, [forms, search, filterRole, filterStatus]);

  const paginatedForms = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredForms.slice(start, start + limit);
  }, [filteredForms, page, limit]);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Meus Formulários</h1>
          <p className="text-xs text-muted-foreground">
            Crie, edite perguntas avançadas, configure acessos de equipe e acompanhe respostas.
          </p>
        </div>

        <Link
          to="/app/forms/new"
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Criar Novo Formulário
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-border glass flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por título ou descrição..."
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

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setParam('status', e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-border bg-background text-foreground font-medium"
          >
            <option value="all">Todos os Status</option>
            <option value="published">Publicado</option>
            <option value="draft">Rascunho</option>
          </select>

          {/* Role Tabs */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'mine', label: 'Meus Forms' },
              { id: 'shared', label: 'Compartilhados' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setParam('tab', tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filterRole === tab.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'hover:bg-surface text-muted-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Forms Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-muted-foreground">Carregando formulários...</div>
      ) : paginatedForms.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-border bg-surface/50 p-8 space-y-3">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <p className="text-sm font-semibold text-foreground">Nenhum formulário encontrado.</p>
          <p className="text-xs text-muted-foreground">Tente alterar os termos de busca ou crie um novo formulário.</p>
          <Link
            to="/app/forms/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary mt-2"
          >
            <Plus className="w-4 h-4" /> Criar Formulário
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedForms.map((form) => (
            <div
              key={form.id}
              className="rounded-2xl border border-border bg-surface shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden glass group"
            >
              {/* Card Header Top */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      form.status === 'published'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {form.status === 'published' ? 'Publicado' : 'Rascunho'}
                  </span>

                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {form.user_role === 'owner' ? 'Proprietário' : form.user_role === 'editor' ? 'Editor' : 'Visualizador'}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-foreground leading-snug group-hover:text-primary transition-colors">
                    {form.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {form.description || 'Nenhuma descrição informada.'}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span>
                    <strong>{form.fields_count || 0}</strong> perguntas
                  </span>
                  <span>
                    <strong>{form.responses_count || 0}</strong> respostas
                  </span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3 border-t border-border/80 bg-surface-elevated/40 flex items-center justify-between gap-2 relative">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/app/forms/${form.id}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
                  >
                    Editar
                  </Link>
                  <Link
                    to={`/app/forms/${form.id}/responses`}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-surface-hover transition-colors"
                  >
                    Respostas ({form.responses_count || 0})
                  </Link>
                </div>

                {/* Actions Dropdown Button */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdownFormId(activeDropdownFormId === form.id ? null : form.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                      activeDropdownFormId === form.id
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-border bg-background hover:bg-surface-hover text-foreground'
                    }`}
                  >
                    <span>Ações</span>
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  {/* Dropdown Menu */}
                  {activeDropdownFormId === form.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 bottom-full mb-1.5 w-52 rounded-2xl border border-border bg-surface shadow-2xl p-1.5 z-30 glass animate-in fade-in zoom-in-95 duration-100"
                    >
                      <Link
                        to={`/app/forms/${form.id}`}
                        onClick={() => setActiveDropdownFormId(null)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-surface-hover transition-colors"
                      >
                        <FileText className="w-4 h-4 text-primary" />
                        <span>Editar Formulário</span>
                      </Link>

                      <Link
                        to={`/app/forms/${form.id}/responses`}
                        onClick={() => setActiveDropdownFormId(null)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-surface-hover transition-colors"
                      >
                        <Users className="w-4 h-4 text-indigo-500" />
                        <span>Ver Respostas</span>
                      </Link>

                      <button
                        onClick={() => {
                          setActiveDropdownFormId(null);
                          setActiveShareForm(form);
                          setShareModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-surface-hover transition-colors text-left"
                      >
                        <Share2 className="w-4 h-4 text-emerald-500" />
                        <span>Compartilhar & Acesso</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveDropdownFormId(null);
                          handleDuplicate(form);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-surface-hover transition-colors text-left"
                      >
                        <Copy className="w-4 h-4 text-amber-500" />
                        <span>Duplicar Formulário</span>
                      </button>

                      <a
                        href={`/f/${form.share_code}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setActiveDropdownFormId(null)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-surface-hover transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-sky-500" />
                        <span>Abrir Link Público</span>
                      </a>

                      <div className="my-1 border-t border-border" />

                      <button
                        onClick={() => {
                          setActiveDropdownFormId(null);
                          setFormToDelete(form);
                          setDeleteModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors text-left"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Excluir Formulário</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* URL-bound pagination */}
      <PaginationBar
        totalItems={filteredForms.length}
        currentPage={page}
        pageSize={limit}
        onPageChange={setPage}
      />

      {/* Modal: Share & Collaborators */}
      {shareModalOpen && activeShareForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-surface rounded-2xl p-6 shadow-2xl border border-border space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-foreground">Compartilhar: {activeShareForm.title}</h2>
                <p className="text-xs text-muted-foreground">Distribuição pública e convite de editores/visualizadores.</p>
              </div>
              <button onClick={() => setShareModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            {/* Public Link Box */}
            <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Link Público para Resposta
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/f/${activeShareForm.share_code}`}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background font-mono select-all"
                />
                <button
                  onClick={() => handleCopyPublicLink(activeShareForm.share_code)}
                  className="px-3 py-2 rounded-lg text-xs font-bold text-white bg-primary hover:bg-primary-hover shrink-0 flex items-center gap-1.5"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Copiado!' : 'Copiar'}
                </button>
                <Link
                  to={`/f/${activeShareForm.share_code}`}
                  target="_blank"
                  className="p-2 rounded-lg border border-border hover:bg-surface text-muted-foreground shrink-0"
                  title="Abrir formulário"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Collaborators Invitation */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Convidar Colaborador (Editor ou Visualizador)
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Dê acesso de <strong>Editor</strong> para editar as perguntas ou apenas <strong>Visualizador</strong> para acompanhar as respostas coletadas.
              </p>

              <form onSubmit={handleInviteCollaborator} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="email"
                  required
                  placeholder="email@empresa.com"
                  value={collabEmail}
                  onChange={(e) => setCollabEmail(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <select
                  value={collabRole}
                  onChange={(e) => setCollabRole(e.target.value as any)}
                  className="text-xs px-3 py-2 rounded-xl border border-border bg-background"
                >
                  <option value="editor">Editor (edita perguntas)</option>
                  <option value="viewer">Visualizador (apenas respostas)</option>
                </select>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shrink-0 disabled:opacity-50"
                >
                  {inviting ? 'Concedendo...' : 'Conceder'}
                </button>
              </form>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShareModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-surface-hover"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {deleteModalOpen && formToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface rounded-2xl p-6 shadow-2xl border border-border space-y-4">
            <h2 className="text-base font-bold text-destructive">Confirmar Exclusão</h2>
            <p className="text-xs text-muted-foreground">
              Tem certeza que deseja excluir o formulário <strong>"{formToDelete.title}"</strong>? Todas as perguntas e respostas vinculadas serão removidas permanentemente.
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
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-destructive hover:bg-destructive/90 shadow-md"
              >
                Sim, Excluir Formulário
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
