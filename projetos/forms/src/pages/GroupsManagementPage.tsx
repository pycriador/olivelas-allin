import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Users,
  Search,
  X,
  Settings2,
  Database,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { api } from '../lib/api';
import { Group } from '../types';
import { toast } from 'sonner';
import { useUrlParams } from '../hooks/useUrlParams';
import { PaginationBar } from '../components/PaginationBar';

interface ExtendedGroup extends Group {
  google_email?: string;
  google_status?: string;
  google_connected?: boolean;
}

export const GroupsManagementPage: React.FC = () => {
  const [groups, setGroups] = useState<ExtendedGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const { search, page, limit, setPage, setSearch } = useUrlParams(10);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadData();

    // Close dropdown on outside click
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
      const groupsData = await api.getGroups();
      setGroups(groupsData);
    } catch (err: any) {
      toast.error('Erro ao carregar grupos.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (g: Group) => {
    if (!window.confirm(`Tem certeza que deseja excluir o grupo "${g.name}"?`)) return;
    try {
      await api.deleteGroup(g.id);
      toast.success('Grupo excluído.');
      setOpenDropdownId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir grupo.');
    }
  };

  const filteredGroups = useMemo(() => {
    if (!search) return groups;
    const q = search.toLowerCase();
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q)) ||
        (g.google_email && g.google_email.toLowerCase().includes(q))
    );
  }, [groups, search]);

  const paginatedGroups = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredGroups.slice(start, start + limit);
  }, [filteredGroups, page, limit]);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Grupos & HBAC</h1>
          <p className="text-xs text-muted-foreground">
            Gestão de grupos departamentais, controle hierárquico e credenciais isoladas do Google Cloud por grupo.
          </p>
        </div>

        <Link
          to="/app/groups/new"
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Novo Grupo
        </Link>
      </div>

      {/* Search Bar with URL binding */}
      <div className="p-4 rounded-2xl bg-surface border border-border glass flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nome do grupo, descrição ou e-mail Google..."
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
      </div>

      {/* Table (Responsive Table Shell / Mobile Cards) */}
      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-visible glass">
        <div className="responsive-table-shell overflow-x-visible">
          <table className="w-full text-left text-xs responsive-mobile-cards">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Grupo IAM</th>
                <th className="py-3.5 px-4">Membros Alocados</th>
                <th className="py-3.5 px-4">Integração Google Sheets</th>
                <th className="py-3.5 px-4">Data de Criação</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    Carregando grupos...
                  </td>
                </tr>
              ) : paginatedGroups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    Nenhum grupo encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginatedGroups.map((group) => {
                  const isGoogleConnected = !!(group.google_connected && group.google_email);
                  const isDropdownOpen = openDropdownId === group.id;

                  return (
                    <tr key={group.id} className="hover:bg-surface-hover/50 transition-colors">
                      {/* Grupo */}
                      <td data-mobile-label="Grupo IAM" className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-4 h-4 rounded-full shadow-xs shrink-0"
                            style={{ backgroundColor: group.color || '#4f46e5' }}
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-foreground text-sm leading-snug">{group.name}</div>
                            <div className="text-[11px] text-muted-foreground line-clamp-1">
                              {group.description || 'Sem descrição informada.'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Membros */}
                      <td data-mobile-label="Membros" className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground inline-block">
                            {group.member_count || (group.members ? group.members.length : 0)} membros
                          </span>
                          {group.members && group.members.length > 0 && (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {group.members.slice(0, 3).map((m) => (
                                <span
                                  key={m.id}
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 text-foreground font-medium"
                                >
                                  {m.full_name}
                                </span>
                              ))}
                              {group.members.length > 3 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
                                  +{group.members.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Integração Google */}
                      <td data-mobile-label="Google Sheets" className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isGoogleConnected
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                            }`}
                          >
                            {isGoogleConnected ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            )}
                            {isGoogleConnected ? 'Conectado' : 'Não Configurado'}
                          </span>
                          {group.google_email && (
                            <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[190px]" title={group.google_email}>
                              {group.google_email}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Data de Criação */}
                      <td data-mobile-label="Criado em" className="py-3.5 px-4 text-muted-foreground text-[11px]">
                        {group.created_at ? new Date(group.created_at).toLocaleDateString('pt-BR') : '-'}
                      </td>

                      {/* Ações (Dropdown no Desktop, Botões Grandes no Mobile) */}
                      <td className="mobile-table-actions py-3.5 px-4 text-right">
                        {/* Mobile Buttons (< 768px): caixas e botões grandes para clicar */}
                        <div className="flex md:hidden flex-col w-full gap-2 pt-2">
                          <Link
                            to={`/app/groups/${group.id}/google`}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                          >
                            <Database className="w-4 h-4" />
                            {isGoogleConnected ? 'Gerenciar Google Sheets' : 'Configurar Google Sheets'}
                          </Link>
                          <div className="grid grid-cols-2 gap-2">
                            <Link
                              to={`/app/groups/${group.id}/edit`}
                              className="py-2.5 px-3 rounded-xl text-xs font-semibold border border-border bg-surface hover:bg-surface-hover flex items-center justify-center gap-1.5 transition-all text-foreground"
                            >
                              <Edit className="w-3.5 h-3.5" /> Editar
                            </Link>
                            <button
                              onClick={() => handleDeleteGroup(group)}
                              className="py-2.5 px-3 rounded-xl text-xs font-semibold border border-destructive/30 text-destructive bg-destructive/5 hover:bg-destructive/10 flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Excluir
                            </button>
                          </div>
                        </div>

                        {/* Desktop Dropdown Menu (>= 768px) */}
                        <div className="hidden md:inline-block relative text-left" ref={isDropdownOpen ? dropdownRef : undefined}>
                          <button
                            onClick={() => setOpenDropdownId(isDropdownOpen ? null : group.id)}
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors shadow-xs"
                            title="Ações do Grupo"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-52 bg-surface rounded-2xl shadow-xl border border-border py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                              <Link
                                to={`/app/groups/${group.id}/google`}
                                onClick={() => setOpenDropdownId(null)}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                              >
                                <Database className="w-3.5 h-3.5" />
                                <span>Configurar Google Sheets</span>
                              </Link>

                              <Link
                                to={`/app/groups/${group.id}/edit`}
                                onClick={() => setOpenDropdownId(null)}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-surface-hover transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>Editar Grupo</span>
                              </Link>

                              <div className="border-t border-border my-1" />

                              <button
                                onClick={() => handleDeleteGroup(group)}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Excluir Grupo</span>
                              </button>
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
            totalItems={filteredGroups.length}
            currentPage={page}
            pageSize={limit}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
};
