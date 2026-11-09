import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  FolderGit2,
  KeyRound,
  Layers,
  Layout,
  Maximize2,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../i18n/translations';
import { isSupabaseConfigured, supabaseUrl } from '../../lib/supabase/client';
import {
  createModuleSchemaRecord,
  fetchUnifiedProfilesFromSupabase,
  findEcosystemModuleBySlug,
  listModuleSchemaRecords,
  OLIVELAS_ECOSYSTEM_MODULES,
  OlivelasEcosystemModuleSpec,
  syncUnifiedUserProfileToSupabase,
  toggleArchiveModuleSchemaRecord,
} from '../../services/olivelasEcosystemService';
import { OlivelasInteractiveModuleShowcase } from './OlivelasInteractiveModuleShowcase';

export const OlivelasEcosystemHub: React.FC = () => {
  const { empresaId, moduleSlug } = useParams<{ empresaId?: string; moduleSlug?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, session, companies, modules, notify } = useApp();
  const language = session.language;
  const isDemoRoute = location.pathname.startsWith('/demo');
  const resolvedCompanyId = empresaId || session.activeCompanyId || 'emp-olivelas-matriz';
  const showToast = (title: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') =>
    notify({ type, title });
  const currentCompany = companies.find((c) => c.id === resolvedCompanyId);
  const selectedModule = useMemo(() => findEcosystemModuleBySlug(moduleSlug), [moduleSlug]);

  const [hubTab, setHubTab] = useState<'commercial' | 'examples'>('commercial');
  const [moduleViewTab, setModuleViewTab] = useState<'interactive' | 'database' | 'architecture'>('interactive');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [unifiedProfiles, setUnifiedProfiles] = useState<
    Array<{ id: string; email: string; full_name: string; is_global_admin: boolean; status: string }>
  >([]);
  const [loadingProfiles, setLoadingProfiles] = useState<boolean>(false);

  // Estado operacional do módulo selecionado
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [dataSource, setDataSource] = useState<'supabase' | 'local_cache'>('supabase');
  const [loadingRecords, setLoadingRecords] = useState<boolean>(false);
  const [recordSearch, setRecordSearch] = useState<string>('');
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [archiveTargetId, setArchiveTargetId] = useState<string | null>(null);
  const [archiveReason, setArchiveReason] = useState<string>('');

  const buildModuleRoute = (slug: string) => {
    if (isDemoRoute) return `/demo/${slug}`;
    if (empresaId) return `/app/empresa/${resolvedCompanyId}/ecossistema/${slug}`;
    return `/app/global/ecossistema/${slug}`;
  };

  const buildHubBaseRoute = () => {
    if (isDemoRoute) return `/demo`;
    if (empresaId) return `/app/empresa/${resolvedCompanyId}/ecossistema`;
    return `/app/global/ecossistema`;
  };

  // Sincroniza login único (public.profiles) ao abrir o Hub
  useEffect(() => {
    let active = true;
    async function syncAndLoadProfiles() {
      setLoadingProfiles(true);
      if (currentUser) {
        await syncUnifiedUserProfileToSupabase(currentUser);
      }
      const profiles = await fetchUnifiedProfilesFromSupabase();
      if (active) {
        setUnifiedProfiles(profiles);
        setLoadingProfiles(false);
      }
    }
    syncAndLoadProfiles();
    return () => {
      active = false;
    };
  }, [currentUser]);

  // Carrega dados reais do schema PostgreSQL do módulo selecionado
  const loadSelectedModuleData = async (mod: OlivelasEcosystemModuleSpec) => {
    setLoadingRecords(true);
    const res = await listModuleSchemaRecords(mod, resolvedCompanyId);
    setRecords(res.records);
    setDataSource(res.source);
    setLoadingRecords(false);
  };

  useEffect(() => {
    if (selectedModule) {
      loadSelectedModuleData(selectedModule);
      const initialForm: Record<string, string> = {};
      for (const field of selectedModule.fields) {
        if (field.type === 'select' && field.options?.[0]) {
          initialForm[field.key] = field.options[0].value;
        } else {
          initialForm[field.key] = '';
        }
      }
      setFormValues(initialForm);
    }
  }, [selectedModule, resolvedCompanyId]);

  const filteredCatalog = useMemo(() => {
    return OLIVELAS_ECOSYSTEM_MODULES.filter((mod) => {
      if (categoryFilter !== 'all' && mod.category !== categoryFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        mod.brandName.toLowerCase().includes(q) ||
        mod.dbSchema.toLowerCase().includes(q) ||
        mod.folder.toLowerCase().includes(q) ||
        mod.description.toLowerCase().includes(q) ||
        mod.tables.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [categoryFilter, searchQuery]);

  const exampleModules = useMemo(() => modules.filter((m) => m.isExample), [modules]);

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const archiveMeta = rec.archive_metadata as { isArchived?: boolean } | undefined;
      const isArchived = Boolean(archiveMeta?.isArchived);
      if (!showArchived && isArchived) return false;
      if (!recordSearch.trim()) return true;
      return JSON.stringify(rec).toLowerCase().includes(recordSearch.toLowerCase());
    });
  }, [records, showArchived, recordSearch]);

  const handleQuickPersist = async (payload: Record<string, unknown>, message: string) => {
    if (!selectedModule) return;
    await createModuleSchemaRecord(selectedModule, resolvedCompanyId, payload);
    await loadSelectedModuleData(selectedModule);
    showToast(message, 'success');
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule) return;

    const payload: Record<string, unknown> = {};
    for (const field of selectedModule.fields) {
      const raw = formValues[field.key] ?? '';
      if (field.type === 'number' || field.type === 'currency') {
        payload[field.key] = Number(raw || 0);
      } else {
        payload[field.key] = raw;
      }
    }

    const result = await createModuleSchemaRecord(selectedModule, resolvedCompanyId, payload);
    await loadSelectedModuleData(selectedModule);
    setIsCreateOpen(false);
    showToast(
      result.persistedInSupabase
        ? `Registro gravado no Supabase (schema ${selectedModule.dbSchema}.${selectedModule.primaryTable})!`
        : `Registro salvo no módulo ${selectedModule.brandName}!`,
      'success',
    );
  };

  const handleConfirmArchive = async () => {
    if (!selectedModule || !archiveTargetId || !archiveReason.trim()) return;
    await toggleArchiveModuleSchemaRecord(
      selectedModule,
      archiveTargetId,
      true,
      archiveReason.trim(),
      currentUser?.email || 'admin@olivelas.com.br',
    );
    setArchiveTargetId(null);
    setArchiveReason('');
    await loadSelectedModuleData(selectedModule);
    showToast(`Registro arquivado logicamente em ${selectedModule.dbSchema}.${selectedModule.primaryTable}.`, 'info');
  };

  const handleRestoreRecord = async (recordId: string) => {
    if (!selectedModule) return;
    await toggleArchiveModuleSchemaRecord(
      selectedModule,
      recordId,
      false,
      '',
      currentUser?.email || 'admin@olivelas.com.br',
    );
    await loadSelectedModuleData(selectedModule);
    showToast(`Registro restaurado em ${selectedModule.dbSchema}.${selectedModule.primaryTable}.`, 'success');
  };

  const handleExportCsv = () => {
    if (!selectedModule || filteredRecords.length === 0) return;
    const headers = selectedModule.fields.map((f) => f.key);
    const csvLines = [
      ['id', ...headers, 'company_id'].join(','),
      ...filteredRecords.map((r) =>
        ['id', ...headers, 'company_id']
          .map((k) => `"${String(r[k] ?? '').replace(/"/g, '""')}"`)
          .join(','),
      ),
    ];
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedModule.dbSchema}_${selectedModule.primaryTable}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ===========================================================================
  // VISÃO OPERACIONAL INDIVIDUAL DE UM DOS 16 MÓDULOS COMERCIAIS OLIVELAS
  // ===========================================================================
  if (selectedModule) {
    const activeRecordsCount = records.filter(
      (r) => !(r.archive_metadata as { isArchived?: boolean } | undefined)?.isArchived,
    ).length;

    return (
      <div
        className="space-y-5"
        style={isDemoRoute ? { maxWidth: 1320, margin: '1.5rem auto', padding: '0 1.5rem' } : undefined}
      >
        {/* Barra Superior de Navegação Rápida entre as 16 Plataformas Olivelas */}
        <div className="card p-3.5 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => navigate(buildHubBaseRoute())}
            className="btn btn-secondary btn-sm shrink-0"
          >
            <ArrowLeft size={14} /> Catálogo (16)
          </button>
          <div style={{ width: 1, height: 22, background: 'var(--border-subtle)', flexShrink: 0 }} />
          {OLIVELAS_ECOSYSTEM_MODULES.map((m) => {
            const isCurrent = m.slug === selectedModule.slug;
            return (
              <Link
                key={m.slug}
                to={buildModuleRoute(m.slug)}
                className={`btn btn-sm shrink-0 ${isCurrent ? 'btn-primary' : 'btn-ghost'}`}
              >
                {m.brandName.replace('Olivelas - ', '')}
              </Link>
            );
          })}
        </div>

        {/* Cabeçalho Moderno do Módulo (Padrão Visual gestao_estoque) */}
        <div className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge badge-teal">Módulo Comercial Oficial</span>
                <span className="badge badge-info">{selectedModule.category}</span>
                <span className="badge badge-success flex items-center gap-1 font-mono">
                  <Database className="w-3.5 h-3.5" />
                  {selectedModule.dbSchema}.{selectedModule.primaryTable}
                </span>
                <span className="badge badge-neutral flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5" />
                  SSO: public.profiles
                </span>
              </div>
              <h1 className="text-2xl font-bold">{selectedModule.brandName}</h1>
              <p className="text-sm text-muted max-w-3xl">{selectedModule.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!isDemoRoute && (
                <Link
                  to={`/demo/${selectedModule.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  title="Abrir esta interface em uma nova guia do navegador"
                >
                  <Maximize2 size={14} /> Abrir em Nova Guia
                </Link>
              )}
              <button
                type="button"
                onClick={() => loadSelectedModuleData(selectedModule)}
                className="btn btn-secondary btn-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loadingRecords ? 'animate-spin' : ''}`} />
                Sincronizar
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="btn btn-secondary btn-sm"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus className="w-4 h-4" />
                Novo Registro no Schema
              </button>
            </div>
          </div>

          {/* Abas Segmentadas da Interface do Módulo */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="segmented-tabs">
              <button
                type="button"
                onClick={() => setModuleViewTab('interactive')}
                className={`segmented-tab ${moduleViewTab === 'interactive' ? 'active' : ''}`}
              >
                <Play size={14} /> Interface de Demonstração Interativa
              </button>
              <button
                type="button"
                onClick={() => setModuleViewTab('database')}
                className={`segmented-tab ${moduleViewTab === 'database' ? 'active' : ''}`}
              >
                <Database size={14} /> Registros no Supabase
                <span className="badge badge-teal">{activeRecordsCount}</span>
              </button>
              <button
                type="button"
                onClick={() => setModuleViewTab('architecture')}
                className={`segmented-tab ${moduleViewTab === 'architecture' ? 'active' : ''}`}
              >
                <Layers size={14} /> Arquitetura & Tabelas ({selectedModule.tables.length})
              </button>
            </div>

            <div className="text-xs text-muted flex items-center gap-3">
              <span>
                Diretório: <code>/projetos/{selectedModule.folder}</code>
              </span>
              <span>
                Tenant: <strong>{currentCompany?.tradeName || resolvedCompanyId}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* ABA 1: INTERFACE INTERATIVA DO MÓDULO (SIMULADOR AO VIVO + PERSISTÊNCIA SUPABASE) */}
        {moduleViewTab === 'interactive' && (
          <OlivelasInteractiveModuleShowcase
            module={selectedModule}
            records={filteredRecords}
            onQuickPersist={handleQuickPersist}
            onOpenNewModal={() => setIsCreateOpen(true)}
          />
        )}

        {/* ABA 2: BANCO DE DADOS EM TEMPO REAL (TABELA CRUD SUPABASE) */}
        {(moduleViewTab === 'database' || moduleViewTab === 'interactive') && (
          <div className="space-y-4">
            <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-teal-600" />
                <strong className="text-sm">
                  Registros em Tempo Real (<code>{selectedModule.dbSchema}.{selectedModule.primaryTable}</code>)
                </strong>
              </div>
              <div className="flex flex-wrap items-center gap-3 flex-1 justify-end">
                <div className="relative min-w-[240px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                  <input
                    type="text"
                    value={recordSearch}
                    onChange={(e) => setRecordSearch(e.target.value)}
                    placeholder={`Filtrar em ${selectedModule.dbSchema}.${selectedModule.primaryTable}...`}
                    className="input pl-9 w-full"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                  />
                  Exibir arquivados
                </label>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>ID Registro</th>
                      {selectedModule.fields.map((field) => (
                        <th key={field.key}>{field.label}</th>
                      ))}
                      <th>Governança</th>
                      <th className="text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={selectedModule.fields.length + 3} className="text-center py-8 opacity-70">
                          Nenhum registro encontrado para os filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((rec) => {
                        const idStr = String(rec.id || '');
                        const archiveMeta = rec.archive_metadata as
                          | { isArchived?: boolean; archiveReason?: string }
                          | undefined;
                        const isArchived = Boolean(archiveMeta?.isArchived);

                        return (
                          <tr key={idStr} className={isArchived ? 'opacity-60' : ''}>
                            <td className="font-mono text-xs">{idStr}</td>
                            {selectedModule.fields.map((field) => {
                              const val = rec[field.key];
                              if (field.type === 'currency') {
                                return (
                                  <td key={field.key} className="font-semibold">
                                    {formatCurrency(Number(val || 0), 'BRL', language)}
                                  </td>
                                );
                              }
                              return <td key={field.key}>{String(val ?? '—')}</td>;
                            })}
                            <td>
                              {isArchived ? (
                                <span className="badge badge-warning" title={archiveMeta?.archiveReason}>
                                  Arquivado Logicamente
                                </span>
                              ) : (
                                <span className="badge badge-success">Ativo no Schema</span>
                              )}
                            </td>
                            <td className="text-right">
                              {isArchived ? (
                                <button
                                  type="button"
                                  onClick={() => handleRestoreRecord(idStr)}
                                  className="btn btn-secondary btn-sm inline-flex items-center gap-1"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  Restaurar
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setArchiveTargetId(idStr)}
                                  className="btn btn-secondary btn-sm inline-flex items-center gap-1"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                  Arquivar
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: ARQUITETURA POSTGRESQL, TABELAS & MIGRATIONS SQL */}
        {moduleViewTab === 'architecture' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="card p-5 lg:col-span-2 space-y-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                Funcionalidades Padronizadas ({selectedModule.brandName})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedModule.features.map((feat) => (
                  <div
                    key={feat}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 text-sm font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5 space-y-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                Tabelas no Schema <code>{selectedModule.dbSchema}</code>
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedModule.tables.map((tbl) => (
                  <span
                    key={tbl}
                    className={`badge ${tbl === selectedModule.primaryTable ? 'badge-teal' : 'badge-neutral'} font-mono`}
                  >
                    {selectedModule.dbSchema}.{tbl}
                  </span>
                ))}
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-muted space-y-1">
                <div>Migration SQL dedicada:</div>
                <div className="font-mono break-all text-[11px]">
                  projetos/{selectedModule.folder}/supabase/migrations/20261109000001_olivelas_{selectedModule.dbSchema}_schema.sql
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Criação de Registro no Schema */}
        {isCreateOpen && (
          <div className="modal-backdrop">
            <div className="modal-content max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  Novo Registro — {selectedModule.brandName}
                </h2>
                <span className="badge badge-info font-mono">
                  {selectedModule.dbSchema}.{selectedModule.primaryTable}
                </span>
              </div>
              <form onSubmit={handleCreateRecord} className="space-y-4">
                {selectedModule.fields.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-xs font-semibold uppercase opacity-80">
                      {field.label}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        className="input w-full"
                        value={formValues[field.key] ?? ''}
                        onChange={(e) =>
                          setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                      >
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type === 'number' || field.type === 'currency' ? 'number' : 'text'}
                        step="any"
                        required
                        placeholder={field.placeholder}
                        className="input w-full"
                        value={formValues[field.key] ?? ''}
                        onChange={(e) =>
                          setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                      />
                    )}
                  </div>
                ))}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Salvar no Schema {selectedModule.dbSchema}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Arquivamento Lógico */}
        {archiveTargetId && (
          <div className="modal-backdrop">
            <div className="modal-content max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-bold">Arquivar Registro Logicamente</h3>
              <p className="text-sm opacity-80">
                Nenhum registro é excluído fisicamente no ecossistema Olivelas All In. Informe a justificativa de auditoria:
              </p>
              <textarea
                rows={3}
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                placeholder="Motivo do arquivamento..."
                className="input w-full"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setArchiveTargetId(null);
                    setArchiveReason('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!archiveReason.trim()}
                  onClick={handleConfirmArchive}
                  className="btn btn-primary"
                >
                  Confirmar Arquivamento
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===========================================================================
  // VISÃO GERAL: HUB DOS 16 MÓDULOS COMERCIAIS OLIVELAS + 10 MÓDULOS DE EXEMPLO
  // ===========================================================================
  const categories = [
    'all',
    'Saúde & Bem-Estar',
    'Varejo & Gastronomia',
    'Operações & Imóveis',
    'Engenharia, Jurídico & IA',
    'Sorteios & Campanhas',
  ];

  return (
    <div
      className="space-y-6"
      style={isDemoRoute ? { maxWidth: 1320, margin: '1.5rem auto', padding: '0 1.5rem' } : undefined}
    >
      {/* Banner Principal de Arquitetura Unificada (Padrão Visual gestao_estoque) */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge badge-teal">16 Módulos Comerciais Ativos</span>
              <span className="badge badge-success flex items-center gap-1">
                <Database className="w-3.5 h-3.5" />
                Supabase ({isSupabaseConfigured ? 'Multi-Schema Online' : 'Local'})
              </span>
              <span className="badge badge-info flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5" />
                SSO: public.profiles
              </span>
            </div>
            <h1 className="text-2xl font-bold">
              Plataformas Comerciais Olivelas All In — Demonstração Interativa
            </h1>
            <p className="text-sm text-muted">
              Clique em qualquer uma das <strong>16 plataformas comerciais Olivelas</strong> abaixo para abrir imediatamente sua interface interativa no navegador, testar fluxos operacionais e gravar dados em tempo real no schema PostgreSQL correspondente. Os módulos genéricos anteriores foram preservados na aba <strong>Módulos de Exemplo</strong>.
            </p>
          </div>

          <div className="segmented-tabs">
            <button
              type="button"
              onClick={() => setHubTab('commercial')}
              className={`segmented-tab ${hubTab === 'commercial' ? 'active' : ''}`}
            >
              Módulos Comerciais Olivelas
              <span className="badge badge-teal">16</span>
            </button>
            <button
              type="button"
              onClick={() => setHubTab('examples')}
              className={`segmented-tab ${hubTab === 'examples' ? 'active' : ''}`}
            >
              Módulos de Exemplo
              <span className="badge badge-neutral">{exampleModules.length}</span>
            </button>
          </div>
        </div>
      </div>

      {hubTab === 'commercial' ? (
        <>
          {/* Filtros por Categoria e Busca */}
          <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`btn btn-sm ${categoryFilter === cat ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {cat === 'all' ? 'Todas as 16 Plataformas' : cat}
                </button>
              ))}
            </div>

            <div className="relative min-w-[260px] flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar plataforma Olivelas, schema PostgreSQL ou tabela..."
                className="input pl-9 w-full"
              />
            </div>
          </div>

          {/* Grid Elegante dos 16 Módulos Comerciais Olivelas */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredCatalog.map((mod) => {
              const targetUrl = buildModuleRoute(mod.slug);
              return (
                <div
                  key={mod.id}
                  onClick={() => navigate(targetUrl)}
                  className="card card-interactive p-6 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="badge badge-teal">{mod.category}</span>
                      <span className="badge badge-info font-mono">
                        {mod.dbSchema}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-lg font-bold">{mod.brandName}</h2>
                      <p className="text-xs text-muted mt-0.5">{mod.tagline}</p>
                    </div>

                    <p className="text-xs opacity-80 leading-relaxed">{mod.description}</p>

                    <div className="space-y-1.5 pt-1">
                      <div className="text-xs font-semibold text-muted">
                        Tabelas no schema <code>{mod.dbSchema}</code> ({mod.tables.length}):
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {mod.tables.map((t) => (
                          <span key={t} className="badge badge-neutral font-mono">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div
                    className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-xs">
                      <span className="text-muted block">Assinatura Comercial</span>
                      <strong className="text-base">
                        {formatCurrency(mod.priceMonthly, 'BRL', language)}/mês
                      </strong>
                    </div>

                    <Link
                      to={targetUrl}
                      className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
                    >
                      <span>Abrir Interface</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Grid dos 10 Módulos de Exemplo Migrados */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {exampleModules.map((ex) => (
            <div key={ex.id} className="card p-6 flex flex-col justify-between gap-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="badge badge-warning">Módulo de Exemplo</span>
                  <code className="text-xs">{ex.code}</code>
                </div>
                <h3 className="text-base font-bold">{ex.name[language]}</h3>
                <p className="text-xs text-muted">{ex.description[language]}</p>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-muted">{ex.usageLimits}</span>
                <strong>{formatCurrency(ex.priceMonthly, ex.currency, language)}/mês</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Painel de Auditoria da Tabela Única de Login (public.profiles) */}
      <div className="card p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="stat-icon-box" style={{ width: 36, height: 36 }}>
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Tabela Única de Login & Autenticação Unificada (<code>public.profiles</code>)
              </h3>
              <p className="text-xs text-muted">
                Compartilhada por todos os 16 módulos comerciais Olivelas e pelo All In via token unificado{' '}
                <code>olivelas_supabase_auth_token</code>.
              </p>
            </div>
          </div>
          <span className="badge badge-success flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Single Sign-On & Multi-Schema Ativo
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table w-full text-xs">
            <thead>
              <tr>
                <th>ID Perfil</th>
                <th>Nome Completo</th>
                <th>E-mail Corporativo</th>
                <th>Escopo</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(unifiedProfiles.length > 0
                ? unifiedProfiles.slice(0, 6)
                : [
                    {
                      id: currentUser?.id || 'usr-super-admin',
                      full_name: currentUser?.name || 'Clara Monteiro',
                      email: currentUser?.email || 'clara.monteiro@olivelas-allin.demo',
                      is_global_admin: true,
                      status: 'active',
                    },
                  ]
              ).map((prof) => (
                <tr key={prof.id}>
                  <td className="font-mono">{prof.id}</td>
                  <td className="font-semibold">{prof.full_name}</td>
                  <td>{prof.email}</td>
                  <td>
                    {prof.is_global_admin ? (
                      <span className="badge badge-info">Global Admin</span>
                    ) : (
                      <span className="badge badge-neutral">Tenant Member</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-success">{prof.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
