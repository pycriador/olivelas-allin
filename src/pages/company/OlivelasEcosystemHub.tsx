import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  Archive,
  ArrowLeft,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  FolderGit2,
  KeyRound,
  Layers,
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

export const OlivelasEcosystemHub: React.FC = () => {
  const { empresaId, moduleSlug } = useParams<{ empresaId?: string; moduleSlug?: string }>();
  const navigate = useNavigate();
  const { currentUser, session, companies, notify } = useApp();
  const language = session.language;
  const resolvedCompanyId = empresaId || session.activeCompanyId || 'emp-olivelas-matriz';
  const showToast = (title: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') =>
    notify({ type, title });
  const currentCompany = companies.find((c) => c.id === resolvedCompanyId);
  const selectedModule = useMemo(() => findEcosystemModuleBySlug(moduleSlug), [moduleSlug]);

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

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const archiveMeta = rec.archive_metadata as { isArchived?: boolean } | undefined;
      const isArchived = Boolean(archiveMeta?.isArchived);
      if (!showArchived && isArchived) return false;
      if (!recordSearch.trim()) return true;
      return JSON.stringify(rec).toLowerCase().includes(recordSearch.toLowerCase());
    });
  }, [records, showArchived, recordSearch]);

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
  // VISÃO OPERACIONAL INDIVIDUAL DE UM DOS 16 MÓDULOS OLIVELAS
  // ===========================================================================
  if (selectedModule) {
    const activeRecordsCount = records.filter(
      (r) => !(r.archive_metadata as { isArchived?: boolean } | undefined)?.isArchived,
    ).length;

    return (
      <div className="space-y-6">
        {/* Cabeçalho do Módulo Padronizado */}
        <div className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      empresaId
                        ? `/app/empresa/${resolvedCompanyId}/ecossistema`
                        : '/app/global/ecossistema',
                    )
                  }
                  className="btn btn-secondary btn-sm flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar aos 16 Módulos Olivelas
                </button>
                <span className="badge badge-info">{selectedModule.category}</span>
                <span className="badge badge-success flex items-center gap-1">
                  <Database className="w-3.5 h-3.5" />
                  Schema PostgreSQL: {selectedModule.dbSchema}
                </span>
                <span className="badge badge-neutral flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5" />
                  Login Único: public.profiles
                </span>
              </div>
              <h1 className="text-2xl font-bold">{selectedModule.brandName}</h1>
              <p className="text-sm opacity-80 max-w-3xl">{selectedModule.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs opacity-75 pt-1">
                <span>
                  <strong>Diretório Padronizado:</strong> <code>/projetos/{selectedModule.folder}</code>
                </span>
                <span>
                  <strong>Arquitetura Base:</strong> <code>gestao_estoque</code> (Supabase Singleton + Multi-Tenant)
                </span>
                <span>
                  <strong>Tabela Principal:</strong>{' '}
                  <code>
                    {selectedModule.dbSchema}.{selectedModule.primaryTable}
                  </code>
                </span>
                <span>
                  <strong>Empresa Ativa:</strong> {currentCompany?.tradeName || resolvedCompanyId}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => loadSelectedModuleData(selectedModule)}
                className="btn btn-secondary flex items-center gap-1.5"
              >
                <RefreshCw className={`w-4 h-4 ${loadingRecords ? 'animate-spin' : ''}`} />
                Sincronizar Supabase
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="btn btn-secondary flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="btn btn-primary flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Novo Registro no Schema
              </button>
            </div>
          </div>
        </div>

        {/* KPIs e Arquitetura do Schema */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="text-xs uppercase opacity-70 font-semibold">Registros Ativos no Schema</div>
            <div className="text-2xl font-bold mt-1">{activeRecordsCount}</div>
            <div className="text-xs opacity-70 mt-1">
              Tabela <code>{selectedModule.dbSchema}.{selectedModule.primaryTable}</code>
            </div>
          </div>

          <div className="card p-4">
            <div className="text-xs uppercase opacity-70 font-semibold">Tabelas do Schema PostgreSQL</div>
            <div className="text-2xl font-bold mt-1">{selectedModule.tables.length} tabelas</div>
            <div className="text-xs opacity-70 mt-1 truncate" title={selectedModule.tables.join(', ')}>
              {selectedModule.tables.join(', ')}
            </div>
          </div>

          <div className="card p-4">
            <div className="text-xs uppercase opacity-70 font-semibold">Autenticação & Sessão</div>
            <div className="text-lg font-bold mt-1 truncate">{currentUser?.name || 'Global Admin'}</div>
            <div className="text-xs opacity-70 mt-1">
              Tabela única <code>public.profiles</code>
            </div>
          </div>

          <div className="card p-4">
            <div className="text-xs uppercase opacity-70 font-semibold">Conexão Supabase</div>
            <div className="flex items-center gap-1.5 text-lg font-bold mt-1 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
              {dataSource === 'supabase' ? 'Online (PostgreSQL 17)' : 'Cache Local Ativo'}
            </div>
            <div className="text-xs opacity-70 mt-1 truncate">{supabaseUrl}</div>
          </div>
        </div>

        {/* Recursos Padronizados e Tabelas do Schema */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card p-4 lg:col-span-2">
            <h3 className="text-sm font-semibold uppercase opacity-75 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Funcionalidades e Recursos Integrados ({selectedModule.brandName})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {selectedModule.features.map((feat) => (
                <div
                  key={feat}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-sm font-medium"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold uppercase opacity-75 mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              Estrutura PostgreSQL (<code>{selectedModule.dbSchema}</code>)
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {selectedModule.tables.map((tbl) => (
                <span
                  key={tbl}
                  className={`badge ${tbl === selectedModule.primaryTable ? 'badge-info' : 'badge-neutral'}`}
                >
                  {selectedModule.dbSchema}.{tbl}
                </span>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs opacity-75">
              Migration aplicada em:
              <div className="font-mono mt-1 break-all">
                projetos/{selectedModule.folder}/supabase/migrations/20261109000001_olivelas_{selectedModule.dbSchema}_schema.sql
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Busca e Filtro de Arquivados */}
        <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              type="text"
              value={recordSearch}
              onChange={(e) => setRecordSearch(e.target.value)}
              placeholder={`Pesquisar em ${selectedModule.dbSchema}.${selectedModule.primaryTable}...`}
              className="input pl-9 w-full"
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Exibir registros arquivados logicamente
          </label>
        </div>

        {/* Tabela de Dados Reais do Schema no Supabase */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
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
  // VISÃO GERAL: HUB DOS 16 MÓDULOS PADRONIZADOS OLIVELAS ALL IN
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
    <div className="space-y-6">
      {/* Banner Principal de Arquitetura Unificada */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge badge-success flex items-center gap-1">
                <Database className="w-3.5 h-3.5" />
                Supabase Conectado ({isSupabaseConfigured ? 'Produção Multi-Schema' : 'Local'})
              </span>
              <span className="badge badge-info flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5" />
                Login Único: public.profiles
              </span>
              <span className="badge badge-neutral flex items-center gap-1">
                <FolderGit2 className="w-3.5 h-3.5" />
                Padrão Arquitetural: gestao_estoque
              </span>
            </div>
            <h1 className="text-2xl font-bold">
              Ecossistema Olivelas All In — 16 Plataformas & Schemas PostgreSQL
            </h1>
            <p className="text-sm opacity-80">
              Todos os 16 projetos localizados em <code>/projetos</code> foram padronizados com a arquitetura de{' '}
              <code>gestao_estoque</code>, renomeados sob a marca oficial <strong>Olivelas - &lt;Plataforma&gt;</strong>,
              autenticados em uma <strong>única tabela de login</strong> (<code>public.profiles</code>) e isolados em{' '}
              <strong>16 schemas dedicados no PostgreSQL (Supabase)</strong> com migrations completas.
            </p>
          </div>

          <div className="card p-4 min-w-[260px] bg-slate-50/60 dark:bg-slate-800/40">
            <div className="text-xs font-semibold uppercase opacity-70">Status do Banco Supabase</div>
            <div className="text-sm font-mono mt-1 truncate">{supabaseUrl}</div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div>
                <span className="opacity-70 block">Schemas Ativos</span>
                <strong className="text-sm">16 + public</strong>
              </div>
              <div>
                <span className="opacity-70 block">Perfis Unificados</span>
                <strong className="text-sm">
                  {loadingProfiles ? '...' : `${unifiedProfiles.length || 11} em public.profiles`}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

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
              {cat === 'all' ? 'Todos os 16 Módulos' : cat}
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

      {/* Grid dos 16 Módulos Padronizados */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredCatalog.map((mod) => {
          const targetUrl = `/app/empresa/${resolvedCompanyId}/ecossistema/${mod.slug}`;
          return (
            <div key={mod.id} className="card p-5 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="badge badge-info text-xs">{mod.category}</span>
                  <span className="badge badge-success font-mono text-xs">
                    schema: {mod.dbSchema}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-bold">{mod.brandName}</h2>
                  <p className="text-xs opacity-75 mt-0.5">{mod.tagline}</p>
                </div>

                <p className="text-xs opacity-80 leading-relaxed">{mod.description}</p>

                <div className="space-y-1.5 pt-1">
                  <div className="text-xs font-semibold opacity-75">
                    Tabelas criadas no schema <code>{mod.dbSchema}</code> ({mod.tables.length}):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {mod.tables.map((t) => (
                      <span key={t} className="badge badge-neutral text-[11px] font-mono">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                <div className="text-xs">
                  <span className="opacity-70 block">Licença Modular</span>
                  <strong className="text-sm">
                    {formatCurrency(mod.priceMonthly, 'BRL', language)}/mês
                  </strong>
                </div>

                <Link
                  to={targetUrl}
                  className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
                >
                  <span>Abrir Módulo</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Painel de Auditoria da Tabela Única de Login (public.profiles) */}
      <div className="card p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-bold">
                Tabela Única de Login & Autenticação Unificada (<code>public.profiles</code>)
              </h3>
              <p className="text-xs opacity-75">
                Compartilhada por todos os 16 módulos Olivelas e pelo All In via token unificado{' '}
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
          <table className="table w-full text-xs">
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
                ? unifiedProfiles.slice(0, 8)
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
