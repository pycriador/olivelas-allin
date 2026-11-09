import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Bot,
  BookOpen,
  CheckCircle2,
  Code2,
  Copy,
  Database,
  Download,
  Edit3,
  KeyRound,
  Layers,
  Lock,
  Maximize2,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../i18n/translations';
import { isSupabaseConfigured, supabaseUrl } from '../../lib/supabase/client';
import {
  askModuleRagCopilot,
  createModuleSchemaRecord,
  deleteModuleRagDocument,
  deleteModuleSchemaRecord,
  executeLiveModuleRestApi,
  fetchUnifiedProfilesFromSupabase,
  findEcosystemModuleBySlug,
  indexSchemaRecordsIntoRag,
  listAnySchemaTableRecords,
  listModuleRagDocuments,
  listModuleSchemaRecords,
  LiveModuleApiResponse,
  OLIVELAS_ECOSYSTEM_MODULES,
  OlivelasCopilotMessage,
  OlivelasEcosystemModuleSpec,
  OlivelasRagDocument,
  saveModuleRagDocument,
  syncUnifiedUserProfileToSupabase,
  toggleArchiveModuleSchemaRecord,
  updateModuleSchemaRecord,
} from '../../services/olivelasEcosystemService';
import { PermissionAction } from '../../types/domain';
import { OlivelasInteractiveModuleShowcase } from './OlivelasInteractiveModuleShowcase';

const ALL_ACTIONS: { action: PermissionAction; label: string; desc: string }[] = [
  { action: 'view', label: 'Visualizar (view)', desc: 'Leitura de registros, painéis, KPIs e documentos RAG' },
  { action: 'create', label: 'Criar (create)', desc: 'Inserção de novos registros no schema PostgreSQL e base RAG' },
  { action: 'edit', label: 'Editar (edit)', desc: 'Atualização de campos cadastrais, preços, status e metadados' },
  { action: 'archive', label: 'Arquivar (archive)', desc: 'Arquivamento e restauração lógica com trilha de auditoria' },
  { action: 'approve', label: 'Aprovar (approve)', desc: 'Homologação de alçadas, contratos, lotes e campanhas' },
  { action: 'export', label: 'Exportar (export)', desc: 'Extração de relatórios CSV e JSON auditados' },
  { action: 'administer', label: 'Administrar (administer)', desc: 'Governança de schema, exclusão definitiva e chaves de API' },
];

export const OlivelasEcosystemHub: React.FC = () => {
  const { empresaId, moduleSlug } = useParams<{ empresaId?: string; moduleSlug?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, session, companies, modules, roles, hasPermission, notify } = useApp();
  const language = session.language;
  const isDemoRoute = location.pathname.startsWith('/demo');
  const resolvedCompanyId = empresaId || session.activeCompanyId || 'emp-olivelas-matriz';
  const showToast = (title: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') =>
    notify({ type, title });
  const currentCompany = companies.find((c) => c.id === resolvedCompanyId);
  const selectedModule = useMemo(() => findEcosystemModuleBySlug(moduleSlug), [moduleSlug]);

  // Permissões HBAC efetivas do usuário logado para este módulo
  const permScope = selectedModule?.slug || 'modules';
  const canCreate = isDemoRoute || hasPermission(permScope, 'create') || hasPermission('modules', 'create');
  const canEdit = isDemoRoute || hasPermission(permScope, 'edit') || hasPermission('modules', 'edit');
  const canArchive = isDemoRoute || hasPermission(permScope, 'archive') || hasPermission('modules', 'archive');
  const canExport = isDemoRoute || hasPermission(permScope, 'export') || hasPermission('modules', 'export');
  const canAdminister = isDemoRoute || hasPermission(permScope, 'administer') || hasPermission('modules', 'administer');

  const [hubTab, setHubTab] = useState<'commercial' | 'examples'>('commercial');
  const [moduleViewTab, setModuleViewTab] = useState<'interactive' | 'database' | 'rag' | 'api' | 'hbac'>('interactive');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [unifiedProfiles, setUnifiedProfiles] = useState<
    Array<{ id: string; email: string; full_name: string; is_global_admin: boolean; status: string }>
  >([]);

  // Estado operacional do banco de dados do módulo
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [secondaryTableRecords, setSecondaryTableRecords] = useState<Record<string, unknown>[]>([]);
  const [loadingRecords, setLoadingRecords] = useState<boolean>(false);
  const [recordSearch, setRecordSearch] = useState<string>('');
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // Modais CRUD (Criar, Editar, Arquivar)
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<Record<string, unknown> | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [archiveTargetId, setArchiveTargetId] = useState<string | null>(null);
  const [archiveReason, setArchiveReason] = useState<string>('');

  // Estado RAG & Copiloto IA do Módulo
  const [ragDocs, setRagDocs] = useState<OlivelasRagDocument[]>([]);
  const [loadingRag, setLoadingRag] = useState<boolean>(false);
  const [isRagModalOpen, setIsRagModalOpen] = useState<boolean>(false);
  const [ragTitle, setRagTitle] = useState<string>('');
  const [ragCategory, setRagCategory] = useState<string>('manual');
  const [ragContent, setRagContent] = useState<string>('');
  const [ragTags, setRagTags] = useState<string>('');
  const [copilotPersona, setCopilotPersona] = useState<'executivo' | 'auditor_cfo' | 'arquitetura_sql'>('executivo');
  const [copilotQuestion, setCopilotQuestion] = useState<string>('');
  const [copilotMessages, setCopilotMessages] = useState<OlivelasCopilotMessage[]>([]);
  const [askingCopilot, setAskingCopilot] = useState<boolean>(false);

  // Estado API Studio REST do Módulo
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST' | 'PATCH' | 'DELETE'>('GET');
  const [apiTable, setApiTable] = useState<string>('');
  const [apiQuery, setApiQuery] = useState<string>('?select=*&limit=25');
  const [apiBody, setApiBody] = useState<string>('{\n  "status": "active"\n}');
  const [apiExecuting, setApiExecuting] = useState<boolean>(false);
  const [apiResponse, setApiResponse] = useState<LiveModuleApiResponse | null>(null);

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
      if (currentUser) {
        await syncUnifiedUserProfileToSupabase(currentUser);
      }
      const profiles = await fetchUnifiedProfilesFromSupabase();
      if (active) {
        setUnifiedProfiles(profiles);
      }
    }
    syncAndLoadProfiles();
    return () => {
      active = false;
    };
  }, [currentUser]);

  // Carrega dados reais do schema PostgreSQL e base RAG do módulo selecionado
  const loadSelectedModuleData = async (mod: OlivelasEcosystemModuleSpec, tableOverride?: string) => {
    setLoadingRecords(true);
    const res = await listModuleSchemaRecords(mod, resolvedCompanyId);
    setRecords(res.records);

    const targetTbl = tableOverride || selectedTable || mod.primaryTable;
    if (targetTbl !== mod.primaryTable) {
      const secRes = await listAnySchemaTableRecords(mod, targetTbl, resolvedCompanyId);
      setSecondaryTableRecords(secRes.records);
    } else {
      setSecondaryTableRecords(res.records);
    }
    setLoadingRecords(false);
  };

  const loadModuleRagData = async (mod: OlivelasEcosystemModuleSpec) => {
    setLoadingRag(true);
    const docs = await listModuleRagDocuments(mod, resolvedCompanyId);
    setRagDocs(docs);
    setLoadingRag(false);
  };

  useEffect(() => {
    if (selectedModule) {
      setSelectedTable(selectedModule.primaryTable);
      setApiTable(selectedModule.primaryTable);
      setApiResponse(null);
      setCopilotMessages([]);
      loadSelectedModuleData(selectedModule, selectedModule.primaryTable);
      loadModuleRagData(selectedModule);

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

  const handleSelectSchemaTable = async (tbl: string) => {
    if (!selectedModule) return;
    setSelectedTable(tbl);
    await loadSelectedModuleData(selectedModule, tbl);
  };

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

  const activeTableRecords = selectedModule && selectedTable !== selectedModule.primaryTable ? secondaryTableRecords : records;

  const filteredRecords = useMemo(() => {
    return activeTableRecords.filter((rec) => {
      const archiveMeta = rec.archive_metadata as { isArchived?: boolean } | undefined;
      const isArchived = Boolean(archiveMeta?.isArchived);
      if (!showArchived && isArchived) return false;
      if (!recordSearch.trim()) return true;
      return JSON.stringify(rec).toLowerCase().includes(recordSearch.toLowerCase());
    });
  }, [activeTableRecords, showArchived, recordSearch]);

  const handleQuickPersist = async (payload: Record<string, unknown>, message: string) => {
    if (!selectedModule) return;
    if (!canCreate) {
      showToast('Seu perfil HBAC não possui permissão "create" neste módulo.', 'warning');
      return;
    }
    await createModuleSchemaRecord(selectedModule, resolvedCompanyId, payload);
    await loadSelectedModuleData(selectedModule);
    showToast(message, 'success');
  };

  const openCreateModal = () => {
    if (!selectedModule) return;
    if (!canCreate) {
      showToast('Permissão HBAC "create" necessária para criar registros.', 'warning');
      return;
    }
    setEditingRecord(null);
    const initialForm: Record<string, string> = {};
    for (const field of selectedModule.fields) {
      if (field.type === 'select' && field.options?.[0]) {
        initialForm[field.key] = field.options[0].value;
      } else {
        initialForm[field.key] = '';
      }
    }
    setFormValues(initialForm);
    setIsCreateOpen(true);
  };

  const openEditModal = (rec: Record<string, unknown>) => {
    if (!selectedModule) return;
    if (!canEdit) {
      showToast('Permissão HBAC "edit" necessária para editar registros.', 'warning');
      return;
    }
    setEditingRecord(rec);
    const editForm: Record<string, string> = {};
    for (const field of selectedModule.fields) {
      editForm[field.key] = String(rec[field.key] ?? '');
    }
    setFormValues(editForm);
    setIsCreateOpen(true);
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
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

    if (editingRecord) {
      const recId = String(editingRecord.id || '');
      const result = await updateModuleSchemaRecord(selectedModule, recId, payload, selectedTable);
      await loadSelectedModuleData(selectedModule, selectedTable);
      setIsCreateOpen(false);
      setEditingRecord(null);
      showToast(
        result.persistedInSupabase
          ? `Registro ${recId} atualizado no Supabase (${selectedModule.dbSchema}.${selectedTable})!`
          : `Registro ${recId} atualizado com sucesso!`,
        'success',
      );
    } else {
      const result = await createModuleSchemaRecord(selectedModule, resolvedCompanyId, payload);
      await loadSelectedModuleData(selectedModule, selectedTable);
      setIsCreateOpen(false);
      showToast(
        result.persistedInSupabase
          ? `Registro gravado no Supabase (schema ${selectedModule.dbSchema}.${selectedModule.primaryTable})!`
          : `Registro salvo no módulo ${selectedModule.brandName}!`,
        'success',
      );
    }
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
    await loadSelectedModuleData(selectedModule, selectedTable);
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
    await loadSelectedModuleData(selectedModule, selectedTable);
    showToast(`Registro restaurado em ${selectedModule.dbSchema}.${selectedModule.primaryTable}.`, 'success');
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!selectedModule || !canAdminister) return;
    await deleteModuleSchemaRecord(selectedModule, recordId, selectedTable);
    await loadSelectedModuleData(selectedModule, selectedTable);
    showToast(`Registro ${recordId} removido de ${selectedModule.dbSchema}.${selectedTable}.`, 'info');
  };

  const handleExportCsv = () => {
    if (!selectedModule || filteredRecords.length === 0) return;
    if (!canExport) {
      showToast('Permissão HBAC "export" necessária para exportar relatórios.', 'warning');
      return;
    }
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
    a.download = `${selectedModule.dbSchema}_${selectedTable || selectedModule.primaryTable}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Arquivo CSV exportado com sucesso.', 'success');
  };

  const handleExportJson = () => {
    if (!selectedModule || filteredRecords.length === 0) return;
    if (!canExport) {
      showToast('Permissão HBAC "export" necessária para exportar JSON.', 'warning');
      return;
    }
    const blob = new Blob([JSON.stringify(filteredRecords, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedModule.dbSchema}_${selectedTable || selectedModule.primaryTable}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Snapshot JSON exportado com sucesso.', 'success');
  };

  // Handlers RAG & Copiloto IA
  const handleSaveRagDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule || !ragTitle.trim() || !ragContent.trim()) return;
    const tagsArr = ragTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const res = await saveModuleRagDocument(
      selectedModule,
      resolvedCompanyId,
      {
        title: ragTitle,
        category: ragCategory,
        content: ragContent,
        tags: tagsArr.length > 0 ? tagsArr : [selectedModule.dbSchema, selectedModule.primaryTable],
      },
      currentUser?.email || 'helena.vasconcelos@olivelasallin.com.br',
    );
    setRagDocs((prev) => [res.document, ...prev.filter((d) => d.id !== res.document.id)]);
    setIsRagModalOpen(false);
    setRagTitle('');
    setRagContent('');
    setRagTags('');
    showToast(
      res.persistedInSupabase
        ? 'Documento RAG gravado em public.allin_rag_documents no Supabase!'
        : 'Documento RAG adicionado à base do módulo!',
      'success',
    );
  };

  const handleIndexLiveTableIntoRag = async () => {
    if (!selectedModule) return;
    const res = await indexSchemaRecordsIntoRag(
      selectedModule,
      resolvedCompanyId,
      records,
      currentUser?.email || 'helena.vasconcelos@olivelasallin.com.br',
    );
    setRagDocs((prev) => [res.document, ...prev.filter((d) => d.id !== res.document.id)]);
    showToast(
      `Snapshot de ${records.length} registros de ${selectedModule.dbSchema}.${selectedModule.primaryTable} indexado no RAG!`,
      'success',
    );
  };

  const handleDeleteRagDoc = async (docId: string) => {
    await deleteModuleRagDocument(docId);
    setRagDocs((prev) => prev.filter((d) => d.id !== docId));
    showToast('Documento removido da base de conhecimento RAG.', 'info');
  };

  const handleAskCopilot = async (customPrompt?: string) => {
    if (!selectedModule) return;
    const q = (customPrompt ?? copilotQuestion).trim();
    if (!q) return;
    setAskingCopilot(true);
    const userMessage: OlivelasCopilotMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      persona: copilotPersona,
      content: q,
      citations: [],
      confidence: 'alta',
      createdAt: new Date().toISOString(),
    };
    setCopilotMessages((prev) => [...prev, userMessage]);
    setCopilotQuestion('');

    const answer = await askModuleRagCopilot({
      moduleSpec: selectedModule,
      companyId: resolvedCompanyId,
      question: q,
      persona: copilotPersona,
      records,
      ragDocs,
      actorEmail: currentUser?.email || 'helena.vasconcelos@olivelasallin.com.br',
      userId: currentUser?.id,
    });
    setCopilotMessages((prev) => [...prev, answer]);
    setAskingCopilot(false);
  };

  // Handler API Studio Live
  const handleRunLiveApi = async () => {
    if (!selectedModule) return;
    setApiExecuting(true);
    const res = await executeLiveModuleRestApi({
      moduleSpec: selectedModule,
      tableName: apiTable || selectedModule.primaryTable,
      method: apiMethod,
      queryString: apiQuery,
      requestBodyJson: apiBody,
      actorEmail: currentUser?.email || 'helena.vasconcelos@olivelasallin.com.br',
      companyId: resolvedCompanyId,
    });
    setApiResponse(res);
    setApiExecuting(false);
    if (apiMethod !== 'GET') {
      await loadSelectedModuleData(selectedModule, selectedTable);
    }
    showToast(`Requisição ${apiMethod} executada no Supabase (HTTP ${res.status} • ${res.durationMs}ms)`, 'info');
  };

  // ===========================================================================
  // VISÃO OPERACIONAL INDIVIDUAL DE UM DOS 16 MÓDULOS COMERCIAIS OLIVELAS
  // ===========================================================================
  if (selectedModule) {
    const activeRecordsCount = records.filter(
      (r) => !(r.archive_metadata as { isArchived?: boolean } | undefined)?.isArchived,
    ).length;

    const isPrimaryTableSelected = !selectedTable || selectedTable === selectedModule.primaryTable;
    const dynamicColumns =
      !isPrimaryTableSelected && filteredRecords.length > 0
        ? Object.keys(filteredRecords[0]).filter((k) => k !== 'id' && k !== 'archive_metadata').slice(0, 6)
        : [];

    return (
      <div
        className="space-y-5"
        style={isDemoRoute ? { maxWidth: 1360, margin: '1.5rem auto', padding: '0 1.5rem' } : undefined}
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
                  {selectedModule.dbSchema}.{selectedTable || selectedModule.primaryTable}
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
                onClick={() => loadSelectedModuleData(selectedModule, selectedTable)}
                className="btn btn-secondary btn-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loadingRecords ? 'animate-spin' : ''}`} />
                Sincronizar
              </button>
              {canExport && (
                <>
                  <button type="button" onClick={handleExportCsv} className="btn btn-secondary btn-sm">
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                  <button type="button" onClick={handleExportJson} className="btn btn-secondary btn-sm">
                    <Code2 className="w-4 h-4" />
                    JSON
                  </button>
                </>
              )}
              {canCreate && (
                <button type="button" onClick={openCreateModal} className="btn btn-primary btn-sm">
                  <Plus className="w-4 h-4" />
                  Novo Registro
                </button>
              )}
            </div>
          </div>

          {/* 5 Abas Completas do Módulo: Interface, CRUD Supabase, RAG & Copiloto IA, API REST, Permissões HBAC */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="segmented-tabs">
              <button
                type="button"
                onClick={() => setModuleViewTab('interactive')}
                className={`segmented-tab ${moduleViewTab === 'interactive' ? 'active' : ''}`}
              >
                <Play size={14} /> Interface Operacional
              </button>
              <button
                type="button"
                onClick={() => setModuleViewTab('database')}
                className={`segmented-tab ${moduleViewTab === 'database' ? 'active' : ''}`}
              >
                <Database size={14} /> CRUD Multi-Tabela
                <span className="badge badge-teal">{activeRecordsCount}</span>
              </button>
              <button
                type="button"
                onClick={() => setModuleViewTab('rag')}
                className={`segmented-tab ${moduleViewTab === 'rag' ? 'active' : ''}`}
              >
                <Bot size={14} /> RAG & Copiloto IA
                <span className="badge badge-info">{ragDocs.length}</span>
              </button>
              <button
                type="button"
                onClick={() => setModuleViewTab('api')}
                className={`segmented-tab ${moduleViewTab === 'api' ? 'active' : ''}`}
              >
                <Terminal size={14} /> API Studio REST
              </button>
              <button
                type="button"
                onClick={() => setModuleViewTab('hbac')}
                className={`segmented-tab ${moduleViewTab === 'hbac' ? 'active' : ''}`}
              >
                <ShieldCheck size={14} /> HBAC & Schema ({selectedModule.tables.length})
              </button>
            </div>

            <div className="text-xs text-muted flex items-center gap-3">
              <span>
                Schema: <code>{selectedModule.dbSchema}</code>
              </span>
              <span>
                Tenant: <strong>{currentCompany?.tradeName || resolvedCompanyId}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* ABA 1: INTERFACE OPERACIONAL AO VIVO */}
        {moduleViewTab === 'interactive' && (
          <OlivelasInteractiveModuleShowcase
            module={selectedModule}
            records={filteredRecords}
            onQuickPersist={handleQuickPersist}
            onOpenNewModal={openCreateModal}
          />
        )}

        {/* ABA 1 & 2: TABELA DE REGISTROS E CRUD MULTI-TABELA NO SUPABASE */}
        {(moduleViewTab === 'database' || moduleViewTab === 'interactive') && (
          <div className="space-y-4">
            {/* Seletor de Tabelas do Schema PostgreSQL */}
            <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Database size={16} className="text-teal-600" />
                <span className="text-xs font-bold uppercase text-muted">Tabelas no Schema:</span>
                {selectedModule.tables.map((tbl) => {
                  const isActiveTbl = (selectedTable || selectedModule.primaryTable) === tbl;
                  return (
                    <button
                      key={tbl}
                      type="button"
                      onClick={() => handleSelectSchemaTable(tbl)}
                      className={`btn btn-sm font-mono ${isActiveTbl ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {selectedModule.dbSchema}.{tbl}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-3 flex-1 justify-end">
                <div className="relative min-w-[240px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                  <input
                    type="text"
                    value={recordSearch}
                    onChange={(e) => setRecordSearch(e.target.value)}
                    placeholder={`Filtrar em ${selectedModule.dbSchema}.${selectedTable || selectedModule.primaryTable}...`}
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
                      {isPrimaryTableSelected
                        ? selectedModule.fields.map((field) => <th key={field.key}>{field.label}</th>)
                        : dynamicColumns.map((col) => <th key={col}>{col}</th>)}
                      <th>Governança</th>
                      <th className="text-right">Ações CRUD (HBAC)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={(isPrimaryTableSelected ? selectedModule.fields.length : dynamicColumns.length) + 3}
                          className="text-center py-8 opacity-70"
                        >
                          Nenhum registro encontrado em{' '}
                          <code>
                            {selectedModule.dbSchema}.{selectedTable || selectedModule.primaryTable}
                          </code>
                          .
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
                            {isPrimaryTableSelected
                              ? selectedModule.fields.map((field) => {
                                  const val = rec[field.key];
                                  if (field.type === 'currency') {
                                    return (
                                      <td key={field.key} className="font-semibold">
                                        {formatCurrency(Number(val || 0), 'BRL', language)}
                                      </td>
                                    );
                                  }
                                  return <td key={field.key}>{String(val ?? '—')}</td>;
                                })
                              : dynamicColumns.map((col) => (
                                  <td key={col} className="text-xs">
                                    {typeof rec[col] === 'object'
                                      ? JSON.stringify(rec[col])
                                      : String(rec[col] ?? '—')}
                                  </td>
                                ))}
                            <td>
                              {isArchived ? (
                                <span className="badge badge-warning" title={archiveMeta?.archiveReason}>
                                  Arquivado Logicamente
                                </span>
                              ) : (
                                <span className="badge badge-success">Ativo no Supabase</span>
                              )}
                            </td>
                            <td className="text-right">
                              <div className="inline-flex items-center gap-1.5">
                                {isPrimaryTableSelected && canEdit && (
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(rec)}
                                    className="btn btn-secondary btn-sm inline-flex items-center gap-1"
                                    title="Editar registro no Supabase"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    Editar
                                  </button>
                                )}
                                {canArchive &&
                                  (isArchived ? (
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
                                  ))}
                                {canAdminister && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRecord(idStr)}
                                    className="btn btn-ghost btn-sm text-rose-600 inline-flex items-center gap-1"
                                    title="Excluir registro (Permissão administer)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
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
            </div>
          </div>
        )}

        {/* ABA 3: RAG COMPLETO & COPILOTO IA DO MÓDULO */}
        {moduleViewTab === 'rag' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Coluna Esquerda: Base de Conhecimento RAG (public.allin_rag_documents) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="card p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="badge badge-teal mb-1">Base de Conhecimento RAG</span>
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-teal-600" />
                      Documentos Indexados ({ragDocs.length})
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleIndexLiveTableIntoRag}
                      className="btn btn-secondary btn-sm"
                      title="Indexar todos os registros ativos da tabela PostgreSQL no RAG"
                    >
                      <RefreshCw size={13} /> Indexar Tabela SQL
                    </button>
                    {canCreate && (
                      <button
                        type="button"
                        onClick={() => setIsRagModalOpen(true)}
                        className="btn btn-primary btn-sm"
                      >
                        <Plus size={13} /> Novo Doc RAG
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted">
                  Persistido em <code>public.allin_rag_documents</code> no Supabase. O Copiloto IA combina estes documentos com os registros reais de <code>{selectedModule.dbSchema}.{selectedModule.primaryTable}</code>.
                </p>

                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {loadingRag ? (
                    <div className="text-xs text-muted py-6 text-center">Carregando base RAG do Supabase...</div>
                  ) : (
                    ragDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="badge badge-info text-[10px] uppercase">{doc.category}</span>
                            <h4 className="text-sm font-bold mt-1">{doc.title}</h4>
                          </div>
                          {canAdminister && (
                            <button
                              type="button"
                              onClick={() => handleDeleteRagDoc(doc.id)}
                              className="btn btn-ghost btn-sm text-rose-500"
                              title="Remover documento RAG"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                        <p className="text-xs opacity-80 whitespace-pre-line line-clamp-4">{doc.content}</p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {doc.tags.map((t) => (
                            <span key={t} className="badge badge-neutral font-mono text-[10px]">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Coluna Direita: Copiloto IA Contextualizado (RAG + PostgreSQL Live) */}
            <div className="lg:col-span-7">
              <div className="card p-5 flex flex-col justify-between min-h-[560px] space-y-4">
                <div className="space-y-3 border-b border-slate-200 dark:border-slate-700 pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="stat-icon-box" style={{ width: 38, height: 38 }}>
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold">
                          Copiloto IA & Motor RAG — {selectedModule.brandName}
                        </h3>
                        <p className="text-xs text-muted">
                          Respostas fundamentadas em <code>{selectedModule.dbSchema}.{selectedModule.primaryTable}</code> ({activeRecordsCount} registros ativos) + {ragDocs.length} doc(s) RAG
                        </p>
                      </div>
                    </div>

                    <select
                      className="input text-xs py-1.5 px-3"
                      style={{ width: 'auto' }}
                      value={copilotPersona}
                      onChange={(e) =>
                        setCopilotPersona(e.target.value as 'executivo' | 'auditor_cfo' | 'arquitetura_sql')
                      }
                    >
                      <option value="executivo">Persona: Copiloto Executivo</option>
                      <option value="auditor_cfo">Persona: Auditor CFO & Compliance</option>
                      <option value="arquitetura_sql">Persona: Arquiteto SQL & API</option>
                    </select>
                  </div>

                  {/* Sugestões Rápidas de Prompt */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      `Resumo executivo dos registros ativos em ${selectedModule.dbSchema}.${selectedModule.primaryTable}`,
                      `Auditoria de governança, valores e regras de negócio deste módulo`,
                      `Como integrar via API REST PostgREST com o schema ${selectedModule.dbSchema}?`,
                    ].map((promptText) => (
                      <button
                        key={promptText}
                        type="button"
                        onClick={() => handleAskCopilot(promptText)}
                        className="btn btn-secondary btn-sm text-xs"
                      >
                        <Sparkles size={12} /> {promptText}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Histórico de Mensagens do Copiloto */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[360px] pr-1">
                  {copilotMessages.length === 0 ? (
                    <div className="p-6 text-center space-y-2 opacity-75">
                      <Bot className="w-8 h-8 mx-auto text-teal-600" />
                      <div className="text-sm font-semibold">
                        Copiloto RAG Pronto para Consulta em {selectedModule.brandName}
                      </div>
                      <p className="text-xs text-muted max-w-md mx-auto">
                        Faça uma pergunta sobre os registros cadastrados no banco de dados ou clique em uma das sugestões acima para executar a recuperação semântica (RAG).
                      </p>
                    </div>
                  ) : (
                    copilotMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-xl text-xs space-y-2 ${
                          msg.role === 'user'
                            ? 'bg-teal-600 text-white ml-10'
                            : 'border border-slate-200 dark:border-slate-700 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between opacity-75 text-[11px]">
                          <strong>
                            {msg.role === 'user' ? currentUser?.name || 'Você' : `Copiloto Olivelas (${msg.persona})`}
                          </strong>
                          <span>{new Date(msg.createdAt).toLocaleTimeString('pt-BR')}</span>
                        </div>
                        <div className="whitespace-pre-line leading-relaxed">{msg.content}</div>
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-1.5">
                            <span className="font-semibold text-[10px] opacity-75">Fontes RAG citadas:</span>
                            {msg.citations.map((cit) => (
                              <span key={cit.id} className="badge badge-teal text-[10px]">
                                {cit.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Input de Pergunta ao Copiloto */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskCopilot();
                  }}
                  className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700"
                >
                  <input
                    type="text"
                    value={copilotQuestion}
                    onChange={(e) => setCopilotQuestion(e.target.value)}
                    placeholder={`Pergunte ao Copiloto sobre ${selectedModule.brandName} (${selectedModule.dbSchema})...`}
                    className="input flex-1"
                  />
                  <button
                    type="submit"
                    disabled={askingCopilot || !copilotQuestion.trim()}
                    className="btn btn-primary"
                  >
                    <Send size={14} /> {askingCopilot ? 'Consultando RAG...' : 'Perguntar'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ABA 4: API STUDIO REST & ESCOPOS HBAC DO MÓDULO */}
        {moduleViewTab === 'api' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-6 space-y-4">
              <div className="card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="badge badge-teal mb-1">PostgREST Multi-Schema</span>
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-teal-600" />
                      Console de API REST Ao Vivo — <code>{selectedModule.dbSchema}</code>
                    </h3>
                  </div>
                  <span className="badge badge-success font-mono">Accept-Profile: {selectedModule.dbSchema}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold uppercase opacity-75">Método HTTP</label>
                    <select
                      className="input w-full mt-1 font-mono"
                      value={apiMethod}
                      onChange={(e) => setApiMethod(e.target.value as 'GET' | 'POST' | 'PATCH' | 'DELETE')}
                    >
                      <option value="GET">GET (Leitura)</option>
                      <option value="POST">POST (Criar)</option>
                      <option value="PATCH">PATCH (Atualizar)</option>
                      <option value="DELETE">DELETE (Remover)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold uppercase opacity-75">Tabela do Schema</label>
                    <select
                      className="input w-full mt-1 font-mono"
                      value={apiTable}
                      onChange={(e) => setApiTable(e.target.value)}
                    >
                      {selectedModule.tables.map((t) => (
                        <option key={t} value={t}>
                          {selectedModule.dbSchema}.{t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase opacity-75">
                    Query String PostgREST (Filtros, Ordenação, Paginação)
                  </label>
                  <input
                    type="text"
                    className="input w-full mt-1 font-mono text-xs"
                    value={apiQuery}
                    onChange={(e) => setApiQuery(e.target.value)}
                    placeholder="?select=*&limit=25"
                  />
                </div>

                {apiMethod !== 'GET' && (
                  <div>
                    <label className="text-xs font-semibold uppercase opacity-75">Payload JSON (Body)</label>
                    <textarea
                      rows={5}
                      className="input w-full mt-1 font-mono text-xs"
                      value={apiBody}
                      onChange={(e) => setApiBody(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-muted font-mono truncate max-w-xs">
                    {supabaseUrl}/rest/v1/{apiTable}
                  </div>
                  <button
                    type="button"
                    disabled={apiExecuting}
                    onClick={handleRunLiveApi}
                    className="btn btn-primary"
                  >
                    <Play size={14} /> {apiExecuting ? 'Executando no Supabase...' : 'Executar Requisição Real'}
                  </button>
                </div>
              </div>

              {/* Escopos de Segurança HBAC da API do Módulo */}
              <div className="card p-5 space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-teal-600" />
                  Escopos HBAC exigidos na API deste Módulo
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <code className="font-bold text-teal-600">{selectedModule.dbSchema}:read</code>
                    <p className="text-muted mt-0.5">Autoriza GET em todas as {selectedModule.tables.length} tabelas do schema.</p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <code className="font-bold text-teal-600">{selectedModule.dbSchema}:write</code>
                    <p className="text-muted mt-0.5">Autoriza POST e PATCH com validação de company_id.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Resposta HTTP Real & Comando cURL */}
            <div className="lg:col-span-6 space-y-4">
              <div className="card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold">Inspetor de Resposta Supabase PostgREST</h3>
                  {apiResponse && (
                    <div className="flex items-center gap-2">
                      <span
                        className={`badge ${
                          apiResponse.status >= 200 && apiResponse.status < 300 ? 'badge-success' : 'badge-warning'
                        } font-mono`}
                      >
                        HTTP {apiResponse.status} {apiResponse.statusText}
                      </span>
                      <span className="badge badge-neutral font-mono">{apiResponse.durationMs} ms</span>
                    </div>
                  )}
                </div>

                {apiResponse ? (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted">Comando cURL Equivalente:</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(apiResponse.curlCommand);
                            showToast('Comando cURL copiado para a área de transferência!', 'success');
                          }}
                          className="btn btn-ghost btn-sm text-xs"
                        >
                          <Copy size={12} /> Copiar cURL
                        </button>
                      </div>
                      <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto">
                        {apiResponse.curlCommand}
                      </pre>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-muted">Corpo da Resposta (JSON Live):</span>
                      <pre className="p-3.5 rounded-xl bg-slate-900 text-emerald-300 text-xs font-mono overflow-x-auto max-h-[340px]">
                        {JSON.stringify(apiResponse.responseBody, null, 2)}
                      </pre>
                    </div>
                  </>
                ) : (
                  <div className="py-16 text-center space-y-2 opacity-75">
                    <Terminal className="w-8 h-8 mx-auto text-teal-600" />
                    <div className="text-sm font-semibold">Pronto para disparar requisição HTTP real</div>
                    <p className="text-xs text-muted max-w-md mx-auto">
                      Clique em <strong>Executar Requisição Real</strong> ao lado para consultar diretamente o endpoint PostgREST do schema <code>{selectedModule.dbSchema}</code> no Supabase.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ABA 5: MATRIZ DE PERMISSÕES GRANULARES HBAC & ARQUITETURA DO MÓDULO */}
        {moduleViewTab === 'hbac' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="card p-5 lg:col-span-2 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="badge badge-teal mb-1">Segurança & Governança HBAC</span>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    Suas Permissões Efetivas em {selectedModule.brandName}
                  </h3>
                </div>
                <span className="badge badge-info">
                  Usuário: {currentUser?.name || 'Visitante Demo'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ALL_ACTIONS.map((item) => {
                  const granted =
                    isDemoRoute ||
                    hasPermission(permScope, item.action) ||
                    hasPermission('modules', item.action);
                  return (
                    <div
                      key={item.action}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="text-sm font-bold">{item.label}</div>
                        <p className="text-xs text-muted mt-0.5">{item.desc}</p>
                      </div>
                      <span className={`badge ${granted ? 'badge-success' : 'badge-warning'} shrink-0`}>
                        {granted ? 'Permitido' : 'Restrito'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                <span>
                  Papéis atribuídos: <strong>{currentUser?.roleIds.join(', ') || 'demo-full-access'}</strong>
                </span>
                <Link to="/app/global/usuarios" className="text-teal-600 font-semibold hover:underline">
                  Gerenciar Usuários & Matriz HBAC Completa →
                </Link>
              </div>
            </div>

            <div className="card p-5 space-y-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                Tabelas no Schema <code>{selectedModule.dbSchema}</code>
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedModule.tables.map((tbl) => (
                  <button
                    key={tbl}
                    type="button"
                    onClick={() => {
                      handleSelectSchemaTable(tbl);
                      setModuleViewTab('database');
                    }}
                    className={`badge ${tbl === selectedModule.primaryTable ? 'badge-teal' : 'badge-neutral'} font-mono cursor-pointer`}
                  >
                    {selectedModule.dbSchema}.{tbl}
                  </button>
                ))}
              </div>
              <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="text-xs font-semibold">Funcionalidades Homologadas:</div>
                {selectedModule.features.map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Criação / Edição de Registro no Schema */}
        {isCreateOpen && (
          <div className="modal-backdrop">
            <div className="modal-content max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  {editingRecord ? `Editar Registro (${String(editingRecord.id)})` : `Novo Registro — ${selectedModule.brandName}`}
                </h2>
                <span className="badge badge-info font-mono">
                  {selectedModule.dbSchema}.{selectedTable || selectedModule.primaryTable}
                </span>
              </div>
              <form onSubmit={handleSaveRecord} className="space-y-4">
                {selectedModule.fields.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-xs font-semibold uppercase opacity-80">{field.label}</label>
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
                    onClick={() => {
                      setIsCreateOpen(false);
                      setEditingRecord(null);
                    }}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingRecord ? 'Salvar Alterações no Supabase' : `Gravar em ${selectedModule.dbSchema}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Novo Documento RAG */}
        {isRagModalOpen && (
          <div className="modal-backdrop">
            <div className="modal-content max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Novo Documento RAG — {selectedModule.brandName}</h2>
                <span className="badge badge-teal font-mono">public.allin_rag_documents</span>
              </div>
              <form onSubmit={handleSaveRagDoc} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase opacity-80">Título do Documento</label>
                  <input
                    type="text"
                    required
                    value={ragTitle}
                    onChange={(e) => setRagTitle(e.target.value)}
                    placeholder="Ex.: Política de Alçadas e Procedimentos Operacionais"
                    className="input w-full mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase opacity-80">Categoria Semântica</label>
                  <select
                    className="input w-full mt-1"
                    value={ragCategory}
                    onChange={(e) => setRagCategory(e.target.value)}
                  >
                    <option value="manual">Manual Operacional</option>
                    <option value="politica">Política & Governança</option>
                    <option value="faq">Perguntas Frequentes (FAQ)</option>
                    <option value="api_spec">Especificação Técnica / SQL</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase opacity-80">Conteúdo de Conhecimento (Indexado pelo Copiloto)</label>
                  <textarea
                    rows={5}
                    required
                    value={ragContent}
                    onChange={(e) => setRagContent(e.target.value)}
                    placeholder="Descreva regras, procedimentos, tabelas ou diretrizes que o Copiloto IA deve utilizar nas respostas..."
                    className="input w-full mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase opacity-80">Tags (separadas por vírgula)</label>
                  <input
                    type="text"
                    value={ragTags}
                    onChange={(e) => setRagTags(e.target.value)}
                    placeholder={`${selectedModule.dbSchema}, ${selectedModule.primaryTable}, compliance`}
                    className="input w-full mt-1"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsRagModalOpen(false)} className="btn btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Indexar no Supabase RAG
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
                Informe a justificativa de auditoria para arquivar o registro em <code>{selectedModule.dbSchema}.{selectedModule.primaryTable}</code>:
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
      style={isDemoRoute ? { maxWidth: 1360, margin: '1.5rem auto', padding: '0 1.5rem' } : undefined}
    >
      {/* Banner Principal de Arquitetura Unificada (Padrão Visual gestao_estoque) */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge badge-teal">16 Módulos Comerciais em Produção</span>
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
              Plataformas Comerciais Olivelas All In — Operação 100% Real
            </h1>
            <p className="text-sm text-muted">
              Clique em qualquer uma das <strong>16 plataformas comerciais Olivelas</strong> abaixo para operar sua interface em tempo real, executar <strong>CRUD completo no Supabase</strong>, consultar o <strong>Copiloto IA com RAG dedicado</strong>, disparar chamadas no <strong>API Studio REST</strong> e auditar <strong>Permissões Granulares HBAC</strong>.
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
                      <span className="badge badge-info font-mono">{mod.dbSchema}</span>
                    </div>

                    <div>
                      <h2 className="text-lg font-bold">{mod.brandName}</h2>
                      <p className="text-xs text-muted mt-0.5">{mod.tagline}</p>
                    </div>

                    <p className="text-xs opacity-80 leading-relaxed">{mod.description}</p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="badge badge-success text-[10px]">CRUD Multi-Tabela</span>
                      <span className="badge badge-info text-[10px]">RAG & Copiloto IA</span>
                      <span className="badge badge-neutral text-[10px]">API REST + HBAC</span>
                    </div>

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
                      <span>Abrir Plataforma</span>
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
                <code>olivelas_supabase_auth_token</code> com hash bcrypt e permissões granulares HBAC.
              </p>
            </div>
          </div>
          <span className="badge badge-success flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Single Sign-On & Multi-Schema Ativo ({roles.length} Papéis HBAC)
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
                ? unifiedProfiles.slice(0, 8)
                : [
                    {
                      id: currentUser?.id || 'usr-super-admin',
                      full_name: currentUser?.name || 'Helena Vasconcelos',
                      email: currentUser?.email || 'helena.vasconcelos@olivelasallin.com.br',
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
