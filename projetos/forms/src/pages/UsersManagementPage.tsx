import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Shield,
  Edit,
  Trash2,
  Mail,
  UserCheck,
  CheckCircle2,
  Lock,
  Filter,
  X,
  RefreshCw,
  MoreVertical,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../lib/api';
import { User, Group } from '../types';
import { toast } from 'sonner';
import { useUrlParams } from '../hooks/useUrlParams';
import { PaginationBar } from '../components/PaginationBar';

export const UsersManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { search, page, limit, getParam, setParam, setPage, setSearch } = useUrlParams(10);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const roleFilter = getParam('role', 'all');
  const groupFilter = getParam('group', 'all');
  const statusFilter = getParam('status', 'all');

  useEffect(() => {
    loadData();

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, groupsData] = await Promise.all([
        api.getUsers().catch(() => []),
        api.getGroups().catch(() => []),
      ]);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setGroups(Array.isArray(groupsData) ? groupsData : []);
    } catch (err: any) {
      toast.error('Erro ao carregar usuários e grupos.');
      setUsers([]);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDelete = (u: User) => {
    if (u.email === 'admin@olivelas.com') {
      toast.error('O Administrador Global raiz não pode ser excluído.');
      return;
    }
    setOpenDropdownId(null);
    setUserToDelete(u);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setDeleting(true);
      await api.deleteUser(userToDelete.id);
      toast.success(`Usuário ${userToDelete.full_name || userToDelete.email} excluído com sucesso.`);
      setUserToDelete(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir usuário.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered by Search, Role, Group, Status
  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];

    return users.filter((u) => {
      if (!u) return false;

      // Search term
      if (search && search.trim()) {
        const query = search.toLowerCase().trim();
        const name = (u.full_name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const dept = (u.department || '').toLowerCase();
        if (!name.includes(query) && !email.includes(query) && !dept.includes(query)) {
          return false;
        }
      }

      // Role filter
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;

      // Group filter
      if (groupFilter !== 'all') {
        const inGroup = Array.isArray(u.groups) && u.groups.some((g: any) => g && (g.id === groupFilter || g.name === groupFilter));
        if (!inGroup) return false;
      }

      return true;
    });
  }, [users, search, roleFilter, statusFilter, groupFilter]);

  // Safe Paginated slice
  const totalItems = filteredUsers.length;
  const maxPage = Math.max(1, Math.ceil(totalItems / limit));
  const safePage = Math.min(page, maxPage);

  const paginatedUsers = useMemo(() => {
    const start = (safePage - 1) * limit;
    return filteredUsers.slice(start, start + limit);
  }, [filteredUsers, safePage, limit]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Gestão de Usuários (IAM)</h1>
          <p className="text-xs text-muted-foreground">
            Controle de identidades, papéis globais, alocação de grupos e autenticação segura com URL e filtros.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border bg-surface hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-all shadow-xs"
            title="Recarregar lista de usuários"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/app/users/new"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Novo Usuário
          </Link>
        </div>
      </div>

      {/* Filter / Search Bar with URL bindings */}
      <div className="p-4 rounded-2xl bg-surface border border-border glass space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou departamento..."
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

          <div className="flex flex-wrap items-center gap-2">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setParam('role', e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-border bg-background text-foreground font-medium"
            >
              <option value="all">Todos os Papéis</option>
              <option value="admin">Administrador Global</option>
              <option value="creator">Criador de Forms</option>
              <option value="viewer">Visualizador</option>
            </select>

            {/* Group Filter */}
            <select
              value={groupFilter}
              onChange={(e) => setParam('group', e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-border bg-background text-foreground font-medium"
            >
              <option value="all">Todos os Grupos</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setParam('status', e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-border bg-background text-foreground font-medium"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativo</option>
              <option value="suspended">Suspenso</option>
              <option value="invited">Convidado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table (Responsive Table Shell / Mobile Cards) */}
      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-visible glass">
        <div className="responsive-table-shell overflow-x-visible">
          <table className="w-full text-left text-xs responsive-mobile-cards">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Nome & Identidade</th>
                <th className="py-3.5 px-4">Papel Global</th>
                <th className="py-3.5 px-4">Departamento</th>
                <th className="py-3.5 px-4">Grupos Associados</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Carregando usuários do sistema...
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    Nenhum usuário encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const isDropdownOpen = openDropdownId === u.id;
                  const initials = (u.full_name || u.email || 'U')
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr key={u.id} className="hover:bg-surface-hover/50 transition-colors">
                      {/* Nome & Identidade */}
                      <td data-mobile-label="Usuário" className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-foreground text-sm leading-snug">{u.full_name}</div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Papel Global */}
                      <td data-mobile-label="Papel" className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                              : u.role === 'creator'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800'
                              : 'bg-muted text-muted-foreground border border-border'
                          }`}
                        >
                          {u.role === 'admin' ? 'Administrador' : u.role === 'creator' ? 'Criador' : 'Visualizador'}
                        </span>
                      </td>

                      {/* Departamento */}
                      <td data-mobile-label="Departamento" className="py-3.5 px-4 text-muted-foreground text-xs">
                        {u.department || 'Geral'}
                      </td>

                      {/* Grupos Associados */}
                      <td data-mobile-label="Grupos" className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {Array.isArray(u.groups) && u.groups.length > 0 ? (
                            u.groups.map((g: any) => (
                              <Link
                                key={g.id || g.name}
                                to={`/app/groups/${g.id}/edit`}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white hover:opacity-85 transition-opacity"
                                style={{ backgroundColor: g.color || '#4f46e5' }}
                              >
                                {g.name}
                              </Link>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-[11px]">Nenhum grupo</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td data-mobile-label="Status" className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            u.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />{' '}
                          {u.status === 'active' ? 'Ativo' : u.status}
                        </span>
                      </td>

                      {/* Ações (Dropdown no Desktop, Botões no Mobile) */}
                      <td className="mobile-table-actions py-3.5 px-4 text-right">
                        {/* Mobile Buttons (< 768px) */}
                        <div className="flex md:hidden flex-col w-full gap-2 pt-2">
                          <Link
                            to={`/app/users/${u.id}/edit`}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-sm flex items-center justify-center gap-2 transition-all"
                          >
                            <Edit className="w-3.5 h-3.5" /> Editar Usuário
                          </Link>
                          {u.email !== 'admin@olivelas.com' && (
                            <button
                              onClick={() => handleRequestDelete(u)}
                              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold border border-destructive/30 text-destructive bg-destructive/5 hover:bg-destructive/10 flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Excluir Usuário
                            </button>
                          )}
                        </div>

                        {/* Desktop Dropdown Menu (>= 768px) */}
                        <div className="hidden md:inline-block relative text-left" ref={isDropdownOpen ? dropdownRef : undefined}>
                          <button
                            onClick={() => setOpenDropdownId(isDropdownOpen ? null : u.id)}
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors shadow-xs"
                            title="Ações do Usuário"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-surface rounded-2xl shadow-xl border border-border py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                              <Link
                                to={`/app/users/${u.id}/edit`}
                                onClick={() => setOpenDropdownId(null)}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-surface-hover transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>Editar Usuário</span>
                              </Link>

                              {u.email !== 'admin@olivelas.com' && (
                                <>
                                  <div className="border-t border-border my-1" />
                                  <button
                                    onClick={() => handleRequestDelete(u)}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Excluir Usuário</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* URL-bound pagination */}
        <div className="px-4 pb-2">
          <PaginationBar
            totalItems={filteredUsers.length}
            currentPage={safePage}
            pageSize={limit}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 glass">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0 border border-destructive/20 shadow-inner">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 min-w-0">
                <h3 className="text-base font-bold text-foreground">
                  Confirmar Exclusão
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tem certeza que deseja excluir o usuário{' '}
                  <strong className="text-foreground font-semibold">
                    {userToDelete.full_name || 'Usuário'} ({userToDelete.email})
                  </strong>
                  ?
                </p>
                <p className="text-[11px] text-muted-foreground/80">
                  Esta ação revogará imediatamente o acesso ao sistema, formulários e grupos vinculados.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-border hover:bg-surface-hover text-foreground transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md shadow-destructive/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sim, Excluir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
