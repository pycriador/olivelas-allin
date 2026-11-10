import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Key,
  Plus,
  Trash2,
  Shield,
  Code,
  Search,
  X,
  Edit3,
  CheckCircle2,
  Users,
  Copy,
  Check,
  Building2,
  Terminal,
  ExternalLink,
  Lock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { api } from '../lib/api';
import { ApiToken, Group } from '../types';
import { toast } from 'sonner';
import { useUrlParams } from '../hooks/useUrlParams';
import { PaginationBar } from '../components/PaginationBar';

export interface ScopeDefinition {
  id: string;
  category: string;
  label: string;
  description: string;
}

export const HBAC_SCOPES: ScopeDefinition[] = [
  // Formulários
  { id: 'forms:read', category: 'Formulários', label: 'forms:read', description: 'Visualizar formulários, perguntas e configurações' },
  { id: 'forms:write', category: 'Formulários', label: 'forms:write', description: 'Criar e atualizar campos, títulos e regras' },
  { id: 'forms:delete', category: 'Formulários', label: 'forms:delete', description: 'Excluir formulários e arquivos vinculados' },
  // Respostas
  { id: 'responses:read', category: 'Respostas', label: 'responses:read', description: 'Consultar, filtrar e exportar respostas submetidas' },
  { id: 'responses:write', category: 'Respostas', label: 'responses:write', description: 'Submeter respostas via API (Headless / Webhook)' },
  // Usuários
  { id: 'users:read', category: 'Usuários & Equipe', label: 'users:read', description: 'Listar usuários, cargos e perfis cadastrados' },
  { id: 'users:write', category: 'Usuários & Equipe', label: 'users:write', description: 'Criar e atualizar usuários da organização' },
  // Grupos
  { id: 'groups:read', category: 'Grupos & Hierarquia', label: 'groups:read', description: 'Consultar grupos, regras de acesso e membros' },
  { id: 'groups:write', category: 'Grupos & Hierarquia', label: 'groups:write', description: 'Criar grupos e atribuir papéis hierárquicos' },
  // Dashboards
  { id: 'dashboards:read', category: 'Dashboards', label: 'dashboards:read', description: 'Consultar painéis analíticos, métricas e widgets' },
  { id: 'dashboards:write', category: 'Dashboards', label: 'dashboards:write', description: 'Criar e reordenar gráficos, tabelas e cards' },
  // Google Sync
  { id: 'google:sync', category: 'Integrações Google', label: 'google:sync', description: 'Disparar sincronização com Google Sheets/Drive' },
];

export const ApiTokensPage: React.FC = () => {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const { search, page, limit, setPage, setSearch } = useUrlParams(10);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingToken, setEditingToken] = useState<ApiToken | null>(null);
  const [editName, setEditName] = useState('');
  const [editGroupId, setEditGroupId] = useState('');
  const [editScopes, setEditScopes] = useState<string[]>([]);
  const [editIsActive, setEditIsActive] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<ApiToken | null>(null);

  // Quick Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGroupId, setNewGroupId] = useState('');
  const [newExpiresInDays, setNewExpiresInDays] = useState(30);
  const [newScopes, setNewScopes] = useState<string[]>([
    'forms:read',
    'responses:read',
    'dashboards:read',
  ]);
  const [creating, setCreating] = useState(false);
  const [newGeneratedToken, setNewGeneratedToken] = useState<string | null>(null);

  // Active Code Example Tab
  const [activeTab, setActiveTab] = useState<'forms' | 'responses' | 'submit' | 'users' | 'groups' | 'sync'>('forms');
  const [copiedExample, setCopiedExample] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tokensData, groupsData] = await Promise.all([
        api.getTokens(),
        api.getGroups(),
      ]);
      setTokens(tokensData);
      setGroups(groupsData);
      if (groupsData.length > 0 && !newGroupId) {
        setNewGroupId(groupsData[0].id);
      }
    } catch (err: any) {
      toast.error('Erro ao carregar dados de tokens e grupos.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (t: ApiToken) => {
    setEditingToken(t);
    setEditName(t.name);
    setEditGroupId(t.group_id || (groups[0]?.id || ''));
    setEditScopes(t.scopes || []);
    setEditIsActive(t.is_active !== false);
    setEditModalOpen(true);
  };

  const handleToggleEditScope = (scopeId: string) => {
    if (editScopes.includes(scopeId)) {
      setEditScopes(editScopes.filter((s) => s !== scopeId));
    } else {
      setEditScopes([...editScopes, scopeId]);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingToken) return;

    if (!editName.trim()) {
      toast.error('Informe um nome válido para o token.');
      return;
    }
    if (editScopes.length === 0) {
      toast.error('Selecione pelo menos uma permissão de escopo.');
      return;
    }

    setSavingEdit(true);
    try {
      await api.updateToken(editingToken.id, {
        name: editName.trim(),
        group_id: editGroupId || null,
        scopes: editScopes,
        is_active: editIsActive,
      });

      toast.success('Permissões e grupo do token atualizados com sucesso!');
      setEditModalOpen(false);
      setEditingToken(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar permissões do token.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!tokenToDelete) return;
    try {
      await api.deleteToken(tokenToDelete.id);
      toast.success('Token revogado e excluído com sucesso.');
      setDeleteModalOpen(false);
      setTokenToDelete(null);
      loadData();
    } catch (err: any) {
      toast.error('Erro ao revogar token.');
    }
  };

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error('Informe um nome para o token.');
      return;
    }
    if (newScopes.length === 0) {
      toast.error('Selecione pelo menos um escopo.');
      return;
    }

    setCreating(true);
    try {
      const res = await api.createToken({
        name: newName.trim(),
        group_id: newGroupId || undefined,
        scopes: newScopes,
        expires_in_days: newExpiresInDays,
      });

      setNewGeneratedToken(res.raw_token);
      toast.success('Token gerado com sucesso!');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar novo token.');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedExample(true);
    toast.success('Comando copiado para a área de transferência!');
    setTimeout(() => setCopiedExample(false), 2000);
  };

  const filteredTokens = useMemo(() => {
    if (!search) return tokens;
    const q = search.toLowerCase();
    return tokens.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.token_prefix && t.token_prefix.toLowerCase().includes(q)) ||
        (t.group_name && t.group_name.toLowerCase().includes(q)) ||
        (t.scopes && t.scopes.some((s) => s.toLowerCase().includes(q)))
    );
  }, [tokens, search]);

  const paginatedTokens = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredTokens.slice(start, start + limit);
  }, [filteredTokens, page, limit]);

  // Code snippets by category
  const codeExamples = {
    forms: {
      title: '1. Resgatar Formulários (GET /api/forms)',
      desc: 'Consulta todos os formulários e detalhes cadastrados para o grupo vinculado.',
      scope: 'forms:read',
      curl: `curl -X GET "http://localhost:3001/api/forms" \\
  -H "Authorization: Bearer oif_live_SEU_TOKEN_AQUI" \\
  -H "Content-Type: application/json"`,
    },
    responses: {
      title: '2. Resgatar Respostas de um Formulário (GET /api/forms/:id/responses)',
      desc: 'Retorna todas as respostas coletadas para exportação ou relatórios em tempo real.',
      scope: 'responses:read',
      curl: `curl -X GET "http://localhost:3001/api/forms/8c139c8c-1e82-45e0-9fd0-e90f6b5b2db7/responses" \\
  -H "Authorization: Bearer oif_live_SEU_TOKEN_AQUI" \\
  -H "Content-Type: application/json"`,
    },
    submit: {
      title: '3. Submeter Resposta Headless via API (POST /api/forms/:id/responses)',
      desc: 'Permite que seu front-end personalizado ou aplicativo móvel envie respostas diretamente.',
      scope: 'responses:write',
      curl: `curl -X POST "http://localhost:3001/api/forms/8c139c8c-1e82-45e0-9fd0-e90f6b5b2db7/responses" \\
  -H "Authorization: Bearer oif_live_SEU_TOKEN_AQUI" \\
  -H "Content-Type: application/json" \\
  -d '{
    "respondent_email": "morador@olivelas.com",
    "answers": {
      "bloco": "Bloco D",
      "apartamento": "16",
      "participa_halloween": true,
      "quantidade_criancas": 0
    }
  }'`,
    },
    users: {
      title: '4. Consultar Usuários & Permissões (GET /api/users)',
      desc: 'Lista os usuários cadastrados e seus papéis no sistema.',
      scope: 'users:read',
      curl: `curl -X GET "http://localhost:3001/api/users" \\
  -H "Authorization: Bearer oif_live_SEU_TOKEN_AQUI" \\
  -H "Content-Type: application/json"`,
    },
    groups: {
      title: '5. Consultar Grupos do Sistema (GET /api/groups)',
      desc: 'Consulta os grupos hierárquicos, cores e configurações vinculadas.',
      scope: 'groups:read',
      curl: `curl -X GET "http://localhost:3001/api/groups" \\
  -H "Authorization: Bearer oif_live_SEU_TOKEN_AQUI" \\
  -H "Content-Type: application/json"`,
    },
    sync: {
      title: '6. Disparar Sincronização Google Sheets (POST /api/dashboards/:id/sync)',
      desc: 'Executa a coleta e cálculo de métricas em tempo real a partir de planilhas conectadas.',
      scope: 'google:sync',
      curl: `curl -X POST "http://localhost:3001/api/dashboards/23dcbf92-127c-4419-b155-292fca0b9a3e/sync" \\
  -H "Authorization: Bearer oif_live_SEU_TOKEN_AQUI" \\
  -H "Content-Type: application/json"`,
    },
  };

  const categories = Array.from(new Set(HBAC_SCOPES.map((s) => s.category)));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Tokens de API & HBAC Granular</h1>
          <p className="text-xs text-muted-foreground">
            Gerenciamento de credenciais vinculadas a grupos com controle rígido de escopos e exemplos práticos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setNewName('');
              setNewGeneratedToken(null);
              setCreateModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Gerar Novo Token
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-border glass flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nome do token, grupo, prefixo ou escopo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
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
        <div className="text-xs text-muted-foreground font-semibold">
          {filteredTokens.length} token(s) cadastrado(s)
        </div>
      </div>

      {/* Tokens List Table */}
      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden glass">
        <div className="responsive-table-shell overflow-x-auto">
          <table className="w-full text-left text-xs responsive-mobile-cards">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Nome do Token</th>
                <th className="py-3 px-4">Grupo Vinculado</th>
                <th className="py-3 px-4">Prefixo</th>
                <th className="py-3 px-4">Escopos HBAC</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Expiração</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Carregando tokens e permissões...
                  </td>
                </tr>
              ) : paginatedTokens.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Nenhum token encontrado.
                  </td>
                </tr>
              ) : (
                paginatedTokens.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td data-mobile-label="Nome" className="py-3 px-4">
                      <div className="font-bold text-foreground text-sm">{t.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        Criado por: {t.user_name || t.user_email || 'Sistema'}
                      </div>
                    </td>
                    <td data-mobile-label="Grupo" className="py-3 px-4">
                      {t.group_name ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border"
                          style={{
                            borderColor: t.group_color ? `${t.group_color}55` : '#6366f155',
                            backgroundColor: t.group_color ? `${t.group_color}18` : '#6366f118',
                            color: t.group_color || '#6366f1',
                          }}
                        >
                          <Building2 className="w-3 h-3" />
                          {t.group_name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">Nenhum</span>
                      )}
                    </td>
                    <td data-mobile-label="Prefixo" className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                      <span className="bg-background px-2 py-1 rounded-md border border-border">
                        {t.token_prefix}
                      </span>
                    </td>
                    <td data-mobile-label="Escopos" className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(t.scopes || []).map((s) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-primary/10 text-primary border border-primary/20"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td data-mobile-label="Status" className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          t.is_active !== false
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                            : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {t.is_active !== false ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td data-mobile-label="Expiração" className="py-3 px-4 text-muted-foreground text-xs">
                      {t.expires_at ? new Date(t.expires_at).toLocaleDateString('pt-BR') : 'Nunca Expira'}
                    </td>
                    <td className="mobile-table-actions py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="px-2.5 py-1.5 rounded-lg border border-border text-foreground hover:bg-surface-hover hover:border-primary/50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          title="Editar Permissões HBAC e Grupo"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-primary" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => {
                            setTokenToDelete(t);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Revogar Token"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* URL Pagination */}
        <div className="px-4 pb-2">
          <PaginationBar
            totalItems={filteredTokens.length}
            currentPage={page}
            pageSize={limit}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Interactive Usage Examples & Documentation */}
      <div className="rounded-2xl border border-border bg-slate-900 text-slate-200 p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-400" />
              Guia de Integração REST & Exemplos Práticos
            </h3>
            <p className="text-xs text-slate-400">
              Copie exemplos funcionais de requisições autenticadas com controle granular de acesso (HBAC).
            </p>
          </div>
          <div className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 text-emerald-400 font-bold border border-slate-700">
            Authorization: Bearer oif_live_...
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          {(
            [
              { id: 'forms', label: '1. Listar Forms' },
              { id: 'responses', label: '2. Ver Respostas' },
              { id: 'submit', label: '3. Enviar Resposta' },
              { id: 'users', label: '4. Listar Usuários' },
              { id: 'groups', label: '5. Listar Grupos' },
              { id: 'sync', label: '6. Sync Google' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Selected Code Box */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-white">
                {codeExamples[activeTab].title}
              </div>
              <p className="text-xs text-slate-400">{codeExamples[activeTab].desc}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
                Escopo: {codeExamples[activeTab].scope}
              </span>
              <button
                onClick={() => handleCopyCode(codeExamples[activeTab].curl)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                {copiedExample ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedExample ? 'Copiado!' : 'Copiar cURL'}
              </button>
            </div>
          </div>

          <pre className="overflow-x-auto p-4 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 font-mono text-xs leading-relaxed select-all">
            {codeExamples[activeTab].curl}
          </pre>
        </div>
      </div>

      {/* Modal: Edit Token Permissions & Group */}
      {editModalOpen && editingToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-surface rounded-2xl p-6 shadow-2xl border border-border space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Editar Permissões HBAC & Grupo do Token
                </h2>
                <p className="text-xs text-muted-foreground font-mono">
                  Identificador: {editingToken.token_prefix}
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-5">
              {/* Token Name & Group */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Nome do Token *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">
                    Grupo Vinculado (Isolamento HBAC) *
                  </label>
                  <select
                    value={editGroupId}
                    onChange={(e) => setEditGroupId(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20">
                <div>
                  <span className="text-xs font-bold text-foreground block">Status do Token</span>
                  <span className="text-[11px] text-muted-foreground">
                    Quando inativo, as requisições autenticadas serão recusadas com HTTP 403 Forbidden.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Granular Scopes Checklist by Category */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Escopos de Permissão HBAC (Granular)
                  </h3>
                  <div className="text-xs font-semibold text-primary">
                    {editScopes.length} escopo(s) selecionado(s)
                  </div>
                </div>

                <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                  {categories.map((cat) => (
                    <div key={cat} className="space-y-2">
                      <div className="text-[11px] font-bold text-foreground flex items-center gap-1.5 border-b border-border/60 pb-1">
                        <Layers className="w-3.5 h-3.5 text-primary" />
                        {cat}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {HBAC_SCOPES.filter((s) => s.category === cat).map((scope) => {
                          const isChecked = editScopes.includes(scope.id);
                          return (
                            <div
                              key={scope.id}
                              onClick={() => handleToggleEditScope(scope.id)}
                              className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                                isChecked
                                  ? 'border-primary bg-primary/10 shadow-sm'
                                  : 'border-border bg-background hover:bg-surface-hover'
                              }`}
                            >
                              <div className="pr-2">
                                <span className="text-xs font-mono font-bold text-foreground block">
                                  {scope.label}
                                </span>
                                <span className="text-[10px] text-muted-foreground block mt-0.5">
                                  {scope.description}
                                </span>
                              </div>
                              {isChecked ? (
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              ) : (
                                <div className="w-4 h-4 rounded border border-border shrink-0 mt-0.5" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-surface-hover"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-md disabled:opacity-50"
                >
                  {savingEdit ? 'Salvando...' : 'Salvar Permissões'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Create Token */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-surface rounded-2xl p-6 shadow-2xl border border-border space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary" />
                  Gerar Novo Token de API (HBAC)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Gere chaves autenticadas vinculadas ao grupo da sua organização.
                </p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                ✕
              </button>
            </div>

            {newGeneratedToken ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Token Gerado com Sucesso!</h3>
                    <p className="text-xs text-muted-foreground">
                      Copie o token agora. Por razões de segurança, ele <strong>nunca mais será exibido</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-background border border-border flex items-center justify-between gap-3 font-mono text-xs">
                  <span className="text-foreground font-bold break-all">{newGeneratedToken}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(newGeneratedToken)}
                    className="px-3.5 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-md"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copiar
                  </button>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setCreateModalOpen(false)}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover"
                  >
                    Concluir e Fechar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleQuickCreate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Nome do Token *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Pipeline CI/CD ou Sync Halloween"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Grupo Vinculado *</label>
                    <select
                      value={newGroupId}
                      onChange={(e) => setNewGroupId(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    >
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Validade do Token</label>
                  <select
                    value={newExpiresInDays}
                    onChange={(e) => setNewExpiresInDays(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  >
                    <option value={7}>7 Dias</option>
                    <option value={30}>30 Dias (Recomendado)</option>
                    <option value={90}>90 Dias</option>
                    <option value={365}>1 Ano</option>
                    <option value={0}>Nunca Expira (Permanente)</option>
                  </select>
                </div>

                {/* Scopes Selection */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Selecione os Escopos HBAC
                    </span>
                    <span className="text-xs font-semibold text-primary">
                      {newScopes.length} selecionado(s)
                    </span>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {categories.map((cat) => (
                      <div key={cat} className="space-y-1.5">
                        <div className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-primary" />
                          {cat}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {HBAC_SCOPES.filter((s) => s.category === cat).map((scope) => {
                            const isChecked = newScopes.includes(scope.id);
                            return (
                              <div
                                key={scope.id}
                                onClick={() => {
                                  if (isChecked) {
                                    setNewScopes(newScopes.filter((s) => s !== scope.id));
                                  } else {
                                    setNewScopes([...newScopes, scope.id]);
                                  }
                                }}
                                className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                                  isChecked
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border bg-background hover:bg-surface-hover'
                                }`}
                              >
                                <div className="pr-2">
                                  <span className="text-xs font-mono font-bold text-foreground block">
                                    {scope.label}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                                    {scope.description}
                                  </span>
                                </div>
                                {isChecked ? (
                                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                ) : (
                                  <div className="w-4 h-4 rounded border border-border shrink-0 mt-0.5" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-surface-hover"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-md disabled:opacity-50"
                  >
                    {creating ? 'Gerando...' : 'Gerar Token'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Delete/Revoke Confirmation */}
      {deleteModalOpen && tokenToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface rounded-2xl p-6 shadow-2xl border border-border space-y-4">
            <h2 className="text-base font-bold text-destructive">Confirmar Revogação de Token</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tem certeza que deseja revogar o token <strong>"{tokenToDelete.name}"</strong> (prefixo: <code>{tokenToDelete.token_prefix}</code>)?
              <br />
              Todas as integrações que utilizam esta chave perderão o acesso imediatamente.
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
                Sim, Revogar Token
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
