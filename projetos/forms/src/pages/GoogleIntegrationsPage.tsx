import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Layers,
  HardDrive,
  Download,
  Key,
  ShieldCheck,
  Cpu,
  Link as LinkIcon,
  Copy,
  Users,
  Search,
  X,
  Settings,
  Database,
} from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { useUrlParams } from '../hooks/useUrlParams';
import { PaginationBar } from '../components/PaginationBar';

interface GroupGoogleInfo {
  id: string;
  name: string;
  description?: string;
  color?: string;
  integrationId?: string;
  connectedEmail?: string;
  authMode: 'oauth' | 'service_account';
  isConnected: boolean;
  lastSyncAt?: string;
}

export const GoogleIntegrationsPage: React.FC = () => {
  const { search, page, limit, getParam, setParam, setPage, setSearch } = useUrlParams(6);

  const activeTab = getParam('tab', 'groups') as 'groups' | 'tools' | 'global_oauth' | 'global_sa';
  const statusFilter = getParam('status', 'all');

  const [status, setStatus] = useState<any>(null);
  const [groups, setGroups] = useState<GroupGoogleInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Sheets Creation & Sync (Tools)
  const [newSheetTitle, setNewSheetTitle] = useState('Respostas Formulários Olivelas 2026');
  const [createdSheet, setCreatedSheet] = useState<{ spreadsheetId?: string; spreadsheetUrl?: string } | null>(null);
  const [creatingSheet, setCreatingSheet] = useState(false);
  const [sheetId, setSheetId] = useState('1mqbaHKLTHSozWqTpklGPSKffp73DJyDlA1SITumvKsM');
  const [syncing, setSyncing] = useState(false);

  // Forms Import
  const [formUrl, setFormUrl] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [statusData, groupsData] = await Promise.all([
        api.getGoogleStatus().catch(() => ({ isConnected: false })),
        api.getGoogleGroupsStatus().catch(() => ({ groups: [] })),
      ]);
      setStatus(statusData);
      setGroups(groupsData.groups || []);
    } catch (err: any) {
      toast.error('Erro ao verificar integrações Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSheetTitle.trim()) return;

    setCreatingSheet(true);
    try {
      const res = await api.createGoogleSheet(newSheetTitle.trim());
      setCreatedSheet(res);
      setSheetId(res.spreadsheetId);
      toast.success(res.message || 'Planilha criada no Google Drive com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar planilha Google.');
    } finally {
      setCreatingSheet(false);
    }
  };

  const handleTestSyncSheets = async () => {
    if (!sheetId.trim()) {
      toast.error('Informe o ID da Planilha Google.');
      return;
    }
    setSyncing(true);
    try {
      const res = await api.syncGoogleSheets('halloween-2026', sheetId.trim());
      if (res.success) {
        toast.success(res.message || 'Sincronização com Google Sheets executada!');
      } else {
        toast.warning(res.message || 'Verifique as permissões de compartilhamento.', { duration: 6000 });
      }
    } catch (err: any) {
      toast.error(err.message || 'Falha na sincronização.');
    } finally {
      setSyncing(false);
    }
  };

  const handleImportForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUrl.trim()) {
      toast.error('Informe o link ou ID do Google Forms.');
      return;
    }

    setImporting(true);
    try {
      const res = await api.importGoogleForm(formUrl.trim());
      toast.success(res.message || 'Formulário importado com sucesso!');
      setFormUrl('');
    } catch (err: any) {
      toast.error(err.message || 'Falha ao importar Google Forms.');
    } finally {
      setImporting(false);
    }
  };

  // Filtered Groups
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const matchesSearch =
        !search ||
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        (g.connectedEmail && g.connectedEmail.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === 'connected' && !g.isConnected) return false;
      if (statusFilter === 'disconnected' && g.isConnected) return false;

      return true;
    });
  }, [groups, search, statusFilter]);

  const paginatedGroups = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredGroups.slice(start, start + limit);
  }, [filteredGroups, page, limit]);

  return (
    <div className="space-y-6">
      {/* Validation Division Notice Banner */}
      <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950">
            Divisão Validar
          </span>
          <span className="text-foreground font-semibold">
            Esta rota (<code>/app/integrations</code>) está em análise para deleção futura. O fluxo oficial de integração Google agora é feito por grupo em <strong>Governança &gt; Grupos</strong>.
          </span>
        </div>
        <Link
          to="/app/validate"
          className="px-3 py-1.5 rounded-xl border border-border bg-surface text-foreground font-bold hover:bg-surface-hover shrink-0"
        >
          Ver Painel Validar
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Integrações Google Cloud & HBAC
          </h1>
          <p className="text-xs text-muted-foreground">
            Gestão de credenciais por Grupo (Multi-Tenant), sincronização com Google Sheets e importador de Forms.
          </p>
        </div>

        <button
          onClick={loadAllData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-surface text-foreground hover:bg-surface-hover text-xs font-semibold shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
          Atualizar Status
        </button>
      </div>

      {/* Info Notice Banner */}
      <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 glass flex items-start gap-3">
        <Database className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-foreground">
            Arquitetura de Isolamento por Grupo (IAM Multi-Tenant)
          </h3>
          <p className="text-xs text-muted-foreground">
            As credenciais do Google Cloud (Service Account JSON ou OAuth) pertencem a cada <strong>Grupo</strong> da organização. Os formulários e dashboards vinculados a um grupo utilizam automaticamente as credenciais configuradas para aquele grupo.
          </p>
        </div>
      </div>

      {/* Navigation Tabs with URL synchronization */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        <button
          onClick={() => setParam('tab', 'groups')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'groups'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Credenciais por Grupo ({groups.length})
        </button>
        <button
          onClick={() => setParam('tab', 'tools')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'tools'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" /> Sincronização & Ferramentas
        </button>
      </div>

      {/* TAB 1: GROUPS GOOGLE CREDENTIALS */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          {/* Search & Status Filter */}
          <div className="p-4 rounded-2xl bg-surface border border-border glass flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar grupo ou e-mail de serviço..."
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

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setParam('status', e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl border border-border bg-background text-foreground font-medium"
              >
                <option value="all">Todos os Status</option>
                <option value="connected">Conectados</option>
                <option value="disconnected">Não Configurados</option>
              </select>
            </div>
          </div>

          {/* Groups List */}
          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">Carregando grupos e integrações...</div>
          ) : paginatedGroups.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground rounded-2xl border border-border bg-surface glass">
              Nenhum grupo encontrado com os filtros aplicados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedGroups.map((g) => (
                <div
                  key={g.id}
                  className="rounded-2xl border border-border bg-surface p-5 shadow-sm hover:shadow-md transition-all glass flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full shadow-sm"
                          style={{ backgroundColor: g.color || '#4f46e5' }}
                        />
                        <h3 className="font-bold text-sm text-foreground">{g.name}</h3>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          g.isConnected
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                        }`}
                      >
                        {g.isConnected ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {g.isConnected ? 'Conectado' : 'Pendente'}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {g.description || 'Grupo corporativo no Olivelas IAM Forms.'}
                    </p>

                    <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Autenticação:</span>
                        <span className="font-semibold text-foreground">
                          {g.authMode === 'service_account' ? 'Service Account JSON' : 'OAuth 2.0'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">E-mail:</span>
                        <span className="font-mono text-[10px] text-foreground truncate max-w-[170px]" title={g.connectedEmail || 'Não configurado'}>
                          {g.connectedEmail || 'Não configurado'}
                        </span>
                      </div>
                      {g.lastSyncAt && (
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                          <span>Último Sync:</span>
                          <span>{new Date(g.lastSyncAt).toLocaleString('pt-BR')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <Link
                      to={`/app/groups/${g.id}/google`}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-sm transition-all"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      {g.isConnected ? 'Gerenciar Credenciais' : 'Configurar Google'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* URL Pagination */}
          <PaginationBar
            totalItems={filteredGroups.length}
            currentPage={page}
            pageSize={limit}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* TAB 2: SHEETS SYNC & TOOLS */}
      {activeTab === 'tools' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sync Testing Card */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-4 glass">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Sincronizador Google Sheets</h3>
                  <p className="text-xs text-muted-foreground">
                    Validação em tempo real de gravação na planilha do Google Sheets.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold">ID da Planilha Google (Spreadsheet ID)</label>
                <input
                  type="text"
                  value={sheetId}
                  onChange={(e) => setSheetId(e.target.value)}
                  placeholder="Ex: 1mqbaHKLTHSozWqTpklGPSKffp73DJyDlA1SITumvKsM"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-background font-mono"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={handleTestSyncSheets}
                  disabled={syncing}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Sincronizando...' : 'Testar Sincronização Agora'}
                </button>
                <a
                  href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                >
                  Abrir Planilha <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Create New Sheet Card */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-4 glass">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Criar Planilha no Google Drive</h3>
                  <p className="text-xs text-muted-foreground">
                    Gera uma nova planilha no Drive da Conta conectada.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateSheet} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Título da Planilha</label>
                  <input
                    type="text"
                    value={newSheetTitle}
                    onChange={(e) => setNewSheetTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-background"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creatingSheet}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover disabled:opacity-50"
                >
                  {creatingSheet ? 'Criando...' : 'Criar Nova Planilha'}
                </button>
              </form>
            </div>
          </div>

          {/* Import Google Form Card */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-4 glass">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Importador de Google Forms</h3>
                <p className="text-xs text-muted-foreground">
                  Converta um formulário público existente do Google Forms diretamente para o Olivelas IAM Forms.
                </p>
              </div>
            </div>

            <form onSubmit={handleImportForm} className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  placeholder="URL pública ou ID do Google Forms..."
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-border bg-background"
                />
                <button
                  type="submit"
                  disabled={importing}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover disabled:opacity-50"
                >
                  {importing ? 'Importando...' : 'Importar Formulário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
