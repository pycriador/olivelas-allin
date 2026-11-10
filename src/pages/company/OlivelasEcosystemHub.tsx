import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
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
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  Layers,
  Lock,
  Maximize2,
  Minimize2,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  Settings,
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
  buildModuleInstanceLaunchUrl,
  createModuleSchemaRecord,
  deleteModuleRagDocument,
  deleteModuleSchemaRecord,
  executeLiveModuleRestApi,
  fetchUnifiedProfilesFromSupabase,
  findEcosystemModuleBySlug,
  getModuleInstanceServerSpec,
  indexSchemaRecordsIntoRag,
  listAnySchemaTableRecords,
  listModuleRagDocuments,
  listModuleSchemaRecords,
  LiveModuleApiResponse,
  OLIVELAS_ECOSYSTEM_MODULES,
  OlivelasCopilotMessage,
  OlivelasEcosystemModuleSpec,
  OlivelasRagDocument,
  openModuleInstanceInNewTab,
  saveModuleRagDocument,
  syncUnifiedUserProfileToSupabase,
  toggleArchiveModuleSchemaRecord,
  updateModuleSchemaRecord,
} from '../../services/olivelasEcosystemService';
import {
  getDefaultPlatformSettings,
  getTableCatalogMetadata,
  loadModulePlatformSettings,
  OlivelasPlatformSettings,
  saveModulePlatformSettings,
} from '../../services/olivelasPlatformMenusCatalog';
import { CatalogModuleEntity, PermissionAction } from '../../types/domain';
import { UrlDataTable } from '../../components/shared/SharedComponents';
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
  const [moduleViewTab, setModuleViewTab] = useState<
    'live_app' | 'dashboard' | 'interactive' | 'workflow' | 'database' | 'rag' | 'api' | 'hbac' | 'settings'
  >('live_app');
  const [isFullscreenPlatform, setIsFullscreenPlatform] = useState<boolean>(false);
  const [settingsSubTab, setSettingsSubTab] = useState<'general' | 'rules' | 'integrations' | 'backup'>('general');
  const [platformSettings, setPlatformSettings] = useState<OlivelasPlatformSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
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

  const activeTableMeta = useMemo(() => {
    if (!selectedModule) return null;
    return getTableCatalogMetadata(selectedModule, selectedTable || selectedModule.primaryTable);
  }, [selectedModule, selectedTable]);

  useEffect(() => {
    if (selectedModule) {
      setSelectedTable(selectedModule.primaryTable);
      setApiTable(selectedModule.primaryTable);
      setApiResponse(null);
      setCopilotMessages([]);
      setModuleViewTab('live_app');
      loadSelectedModuleData(selectedModule, selectedModule.primaryTable);
      loadModuleRagData(selectedModule);
      loadModulePlatformSettings(selectedModule, resolvedCompanyId).then((cfg) =>
        setPlatformSettings(cfg),
      );

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
    setApiTable(tbl);
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
    await createModuleSchemaRecord(selectedModule, resolvedCompanyId, payload, selectedModule.primaryTable);
    await loadSelectedModuleData(selectedModule, selectedTable || selectedModule.primaryTable);
    showToast(message, 'success');
  };

  const openCreateModal = (tableOverride?: string) => {
    if (!selectedModule) return;
    if (!canCreate) {
      showToast('Permissão HBAC "create" necessária para criar registros.', 'warning');
      return;
    }
    const targetTbl = tableOverride || selectedTable || selectedModule.primaryTable;
    if (tableOverride && tableOverride !== selectedTable) {
      setSelectedTable(tableOverride);
      loadSelectedModuleData(selectedModule, tableOverride);
    }
    const meta = getTableCatalogMetadata(selectedModule, targetTbl);
    setEditingRecord(null);
    const initialForm: Record<string, string> = {};
    for (const field of meta.fields) {
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
    if (!selectedModule || !activeTableMeta) return;
    if (!canEdit) {
      showToast('Permissão HBAC "edit" necessária para editar registros.', 'warning');
      return;
    }
    setEditingRecord(rec);
    const editForm: Record<string, string> = {};
    for (const field of activeTableMeta.fields) {
      editForm[field.key] = String(rec[field.key] ?? '');
    }
    setFormValues(editForm);
    setIsCreateOpen(true);
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule || !activeTableMeta) return;
    const targetTbl = selectedTable || selectedModule.primaryTable;

    const payload: Record<string, unknown> = {};
    for (const field of activeTableMeta.fields) {
      const raw = formValues[field.key] ?? '';
      if (field.type === 'number' || field.type === 'currency') {
        payload[field.key] = Number(raw || 0);
      } else {
        payload[field.key] = raw;
      }
    }

    if (editingRecord) {
      const recId = String(editingRecord.id || '');
      const result = await updateModuleSchemaRecord(selectedModule, recId, payload, targetTbl);
      await loadSelectedModuleData(selectedModule, targetTbl);
      setIsCreateOpen(false);
      setEditingRecord(null);
      showToast(
        result.persistedInSupabase
          ? `Item ${recId} atualizado no Supabase (${selectedModule.dbSchema}.${targetTbl})!`
          : `Item ${recId} atualizado em ${activeTableMeta.menuLabel}!`,
        'success',
      );
    } else {
      const result = await createModuleSchemaRecord(selectedModule, resolvedCompanyId, payload, targetTbl);
      await loadSelectedModuleData(selectedModule, targetTbl);
      setIsCreateOpen(false);
      showToast(
        result.persistedInSupabase
          ? `Novo item gravado no Supabase (${selectedModule.dbSchema}.${targetTbl})!`
          : `Novo item adicionado em ${activeTableMeta.menuLabel}!`,
        'success',
      );
    }
  };

  const handleQuickStatusUpdate = async (rec: Record<string, unknown>, newStatus: string) => {
    if (!selectedModule || !canEdit) return;
    const targetTbl = selectedTable || selectedModule.primaryTable;
    const recId = String(rec.id || '');
    const statusField =
      activeTableMeta?.fields.find((f) => f.key === 'status' || f.key === 'kds_status' || f.key === 'risk_level')
        ?.key || 'status';
    await updateModuleSchemaRecord(selectedModule, recId, { [statusField]: newStatus }, targetTbl);
    await loadSelectedModuleData(selectedModule, targetTbl);
    showToast(`Status do item ${recId} atualizado para "${newStatus}" no Supabase!`, 'success');
  };

  const handleSavePlatformSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule || !platformSettings) return;
    setSavingSettings(true);
    const res = await saveModulePlatformSettings(
      selectedModule,
      resolvedCompanyId,
      platformSettings,
      currentUser?.email || 'helena.vasconcelos@olivelasallin.com.br',
    );
    setPlatformSettings(res.settings);
    setSavingSettings(false);
    showToast(
      res.persistedInSupabase
        ? `Configurações da plataforma ${selectedModule.brandName} salvas no Supabase!`
        : `Configurações da plataforma ${selectedModule.brandName} salvas com sucesso!`,
      'success',
    );
  };

  const handleResetPlatformSettings = async () => {
    if (!selectedModule) return;
    const defaults = getDefaultPlatformSettings(selectedModule);
    const res = await saveModulePlatformSettings(
      selectedModule,
      resolvedCompanyId,
      defaults,
      currentUser?.email || 'helena.vasconcelos@olivelasallin.com.br',
    );
    setPlatformSettings(res.settings);
    showToast('Configurações restauradas para o padrão de fábrica da plataforma.', 'info');
  };

  const handleConfirmArchive = async () => {
    if (!selectedModule || !archiveTargetId || !archiveReason.trim()) return;
    const targetTbl = selectedTable || selectedModule.primaryTable;
    await toggleArchiveModuleSchemaRecord(
      selectedModule,
      archiveTargetId,
      true,
      archiveReason.trim(),
      currentUser?.email || 'admin@olivelas.com.br',
      targetTbl,
    );
    setArchiveTargetId(null);
    setArchiveReason('');
    await loadSelectedModuleData(selectedModule, targetTbl);
    showToast(`Item arquivado logicamente em ${selectedModule.dbSchema}.${targetTbl}.`, 'info');
  };

  const handleRestoreRecord = async (recordId: string) => {
    if (!selectedModule) return;
    const targetTbl = selectedTable || selectedModule.primaryTable;
    await toggleArchiveModuleSchemaRecord(
      selectedModule,
      recordId,
      false,
      '',
      currentUser?.email || 'admin@olivelas.com.br',
      targetTbl,
    );
    await loadSelectedModuleData(selectedModule, targetTbl);
    showToast(`Item restaurado em ${selectedModule.dbSchema}.${targetTbl}.`, 'success');
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!selectedModule || !canAdminister) return;
    const targetTbl = selectedTable || selectedModule.primaryTable;
    await deleteModuleSchemaRecord(selectedModule, recordId, targetTbl);
    await loadSelectedModuleData(selectedModule, targetTbl);
    showToast(`Item ${recordId} removido de ${selectedModule.dbSchema}.${targetTbl}.`, 'info');
  };

  const handleExportCsv = () => {
    if (!selectedModule || !activeTableMeta || filteredRecords.length === 0) return;
    if (!canExport) {
      showToast('Permissão HBAC "export" necessária para exportar relatórios.', 'warning');
      return;
    }
    const headers = activeTableMeta.fields.map((f) => f.key);
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
  // PLATAFORMA COMPLETA DE UM DOS 16 MÓDULOS COMERCIAIS OLIVELAS
  // (Menus Laterais Completos, Cadastros/Itens de Todas as Tabelas, Workbench,
  //  Quadro Kanban, Copiloto IA RAG, API Studio, HBAC e Configurações Completas)
  // ===========================================================================
  if (selectedModule && activeTableMeta) {
    const activeRecordsCount = records.filter(
      (r) => !(r.archive_metadata as { isArchived?: boolean } | undefined)?.isArchived,
    ).length;

    const currentActiveTableCount = activeTableRecords.filter(
      (r) => !(r.archive_metadata as { isArchived?: boolean } | undefined)?.isArchived,
    ).length;

    // Cálculo dinâmico de métricas financeiras/numéricas reais da tabela principal
    let primaryMetricSum = 0;
    let primaryMetricLabel = 'Volume Operacional';
    for (const f of selectedModule.fields) {
      if (f.type === 'currency' || f.type === 'number') {
        primaryMetricLabel = f.label;
        for (const r of records) {
          if (!(r.archive_metadata as { isArchived?: boolean } | undefined)?.isArchived) {
            primaryMetricSum += Number(r[f.key] || 0);
          }
        }
        break;
      }
    }

    const activeRatePercent =
      records.length > 0 ? Math.round((activeRecordsCount / records.length) * 100) : 100;

    const instanceLaunch = buildModuleInstanceLaunchUrl({
      moduleSlug: selectedModule.slug,
      companyId: resolvedCompanyId,
      companyName: currentCompany?.tradeName || 'Olivelas Holding',
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      userName: currentUser?.name,
      userRole: 'admin',
    });

    return (
      <div
        className="space-y-4"
        style={
          isFullscreenPlatform
            ? {
                position: 'fixed',
                inset: 0,
                zIndex: 90,
                background: 'var(--bg-app)',
                overflowY: 'auto',
                padding: '1.25rem',
              }
            : isDemoRoute
              ? { maxWidth: 1440, margin: '1rem auto', padding: '0 1.25rem' }
              : undefined
        }
      >
        {/* BARRA SUPERIOR DA PLATAFORMA (TOPBAR DEDICADA DO MÓDULO) */}
        <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(
                  empresaId
                    ? `/app/empresa/${resolvedCompanyId}/modulos`
                    : '/app/global/modulos',
                )
              }
              className="btn btn-secondary btn-sm"
            >
              <ArrowLeft size={14} /> Voltar aos Módulos
            </button>

            <div className="flex items-center gap-2.5">
              <div className="stat-icon-box" style={{ width: 38, height: 38 }}>
                <Layers size={18} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-base font-bold">
                    {platformSettings?.platformDisplayName || selectedModule.brandName}
                  </strong>
                  <span className="badge badge-teal">{selectedModule.category}</span>
                  <span className="badge badge-success font-mono">
                    Instância: {instanceLaunch.instanceId} (:{instanceLaunch.serverSpec.port})
                  </span>
                </div>
                <div className="text-xs text-muted">
                  {selectedModule.tagline} • Empresa Alocada: <strong>{currentCompany?.tradeName || resolvedCompanyId}</strong> • SSO All In: <strong>{currentUser?.email || 'helena.vasconcelos@olivelasallin.com.br'}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                openModuleInstanceInNewTab({
                  moduleSlug: selectedModule.slug,
                  companyId: resolvedCompanyId,
                  companyName: currentCompany?.tradeName || 'Olivelas Holding',
                  userId: currentUser?.id,
                  userEmail: currentUser?.email,
                  userName: currentUser?.name,
                  userRole: 'admin',
                })
              }
              className="btn btn-primary btn-sm"
              title="Abrir a interface real completa do projeto em uma nova aba autenticada via SSO All In"
            >
              <Play size={14} /> Abrir Projeto Completo (Nova Aba SSO)
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreenPlatform((prev) => !prev)}
              className="btn btn-secondary btn-sm"
              title="Alternar Modo Tela Cheia da Plataforma"
            >
              {isFullscreenPlatform ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {isFullscreenPlatform ? 'Sair da Tela Cheia' : 'Modo Tela Cheia'}
            </button>

            <button
              type="button"
              onClick={() => loadSelectedModuleData(selectedModule, selectedTable)}
              className="btn btn-secondary btn-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingRecords ? 'animate-spin' : ''}`} />
              Sincronizar
            </button>

            <button
              type="button"
              onClick={() => setModuleViewTab('settings')}
              className={`btn btn-sm ${moduleViewTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Settings size={14} /> Configurações
            </button>
          </div>
        </div>

        {/* SHELL PRINCIPAL DA PLATAFORMA: MENU LATERAL COMPLETO + ÁREA DE TRABALHO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* MENU LATERAL DEDICADO DA PLATAFORMA (TODOS OS MENUS, ITENS E CONFIGURAÇÕES) */}
          <aside className="lg:col-span-3 card p-4 space-y-5">
            {/* Seção 1: Painel & Operação */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted px-2">
                1. Instância Alocada & Operação
              </div>
              <button
                type="button"
                onClick={() => setModuleViewTab('live_app')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  moduleViewTab === 'live_app'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Play size={15} /> Interface do Projeto (SSO)
                </span>
                <span className="badge badge-success text-[10px]">:{instanceLaunch.serverSpec.port}</span>
              </button>

              <button
                type="button"
                onClick={() => setModuleViewTab('dashboard')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  moduleViewTab === 'dashboard'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <LayoutDashboard size={15} /> Dashboard & Visão Geral
                </span>
                <span className="badge badge-neutral text-[10px]">KPIs</span>
              </button>

              <button
                type="button"
                onClick={() => setModuleViewTab('interactive')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  moduleViewTab === 'interactive'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Play size={15} /> Operação Ao Vivo (Workbench)
                </span>
                <span className="badge badge-teal text-[10px]">Live</span>
              </button>

              <button
                type="button"
                onClick={() => setModuleViewTab('workflow')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  moduleViewTab === 'workflow'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FolderKanban size={15} /> Quadro Kanban & Status
                </span>
                <span className="badge badge-info text-[10px]">{currentActiveTableCount}</span>
              </button>
            </div>

            {/* Seção 2: Cadastros & Itens do Sistema (Todas as Tabelas do Schema) */}
            <div className="space-y-1.5 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between px-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  2. Cadastros & Itens ({selectedModule.tables.length})
                </span>
                <span className="font-mono text-[10px] text-teal-600">{selectedModule.dbSchema}</span>
              </div>
              {selectedModule.tables.map((tbl) => {
                const tblMeta = getTableCatalogMetadata(selectedModule, tbl);
                const isSelectedTbl =
                  moduleViewTab === 'database' &&
                  (selectedTable || selectedModule.primaryTable) === tbl;
                return (
                  <button
                    key={tbl}
                    type="button"
                    onClick={() => {
                      handleSelectSchemaTable(tbl);
                      setModuleViewTab('database');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                      isSelectedTbl
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Database size={14} className="shrink-0" />
                      <span className="truncate">{tblMeta.menuLabel}</span>
                    </span>
                    <code className="text-[10px] opacity-75 shrink-0">{tbl}</code>
                  </button>
                );
              })}
            </div>

            {/* Seção 3: Inteligência Artificial, API & Equipe */}
            <div className="space-y-1.5 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted px-2">
                3. Inteligência, API & Equipe
              </div>
              <button
                type="button"
                onClick={() => setModuleViewTab('rag')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  moduleViewTab === 'rag'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Bot size={15} /> Copiloto IA & Base RAG
                </span>
                <span className="badge badge-info text-[10px]">{ragDocs.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setModuleViewTab('api')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  moduleViewTab === 'api'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Terminal size={15} /> Integrações & API Studio
                </span>
                <span className="badge badge-neutral text-[10px]">REST</span>
              </button>

              <button
                type="button"
                onClick={() => setModuleViewTab('hbac')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  moduleViewTab === 'hbac'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck size={15} /> Equipe & Permissões HBAC
                </span>
                <span className="badge badge-success text-[10px]">SSO</span>
              </button>
            </div>

            {/* Seção 4: Configurações da Plataforma */}
            <div className="space-y-1.5 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted px-2">
                4. Administração & Ajustes
              </div>
              <button
                type="button"
                onClick={() => setModuleViewTab('settings')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  moduleViewTab === 'settings'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Settings size={15} /> Configurações da Plataforma
                </span>
                <span className="badge badge-teal text-[10px]">Setup</span>
              </button>
            </div>
          </aside>

          {/* CONTEÚDO PRINCIPAL DO MENU SELECIONADO NA PLATAFORMA */}
          <main className="lg:col-span-9 space-y-5">
            {/* =============================================================== */}
            {/* MENU 0: INTERFACE REAL DO PROJETO (INSTÂNCIA ALOCADA + SSO)     */}
            {/* =============================================================== */}
            {moduleViewTab === 'live_app' && (
              <div className="space-y-4">
                <div className="card p-4 flex flex-wrap items-center justify-between gap-3 border-teal-500/30">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge badge-success">Instância Alocada em Execução</span>
                      <code className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {instanceLaunch.instanceId}
                      </code>
                      <span className="badge badge-teal font-mono">
                        Porta :{instanceLaunch.serverSpec.port}{instanceLaunch.serverSpec.adminPath}
                      </span>
                    </div>
                    <p className="text-xs text-muted">
                      Frontend completo do projeto <strong>{selectedModule.brandName}</strong> (<code>projetos/{selectedModule.folder}</code>) autenticado automaticamente via <strong>SSO All In</strong> e isolado para a empresa <strong>{currentCompany?.tradeName || resolvedCompanyId}</strong>.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openModuleInstanceInNewTab({
                          moduleSlug: selectedModule.slug,
                          companyId: resolvedCompanyId,
                          companyName: currentCompany?.tradeName || 'Olivelas Holding',
                          userId: currentUser?.id,
                          userEmail: currentUser?.email,
                          userName: currentUser?.name,
                          userRole: 'admin',
                        })
                      }
                      className="btn btn-primary btn-sm"
                    >
                      <Play size={14} /> Abrir em Nova Aba (Tela Cheia Real)
                    </button>
                  </div>
                </div>

                <div
                  className="card overflow-hidden border border-slate-200 dark:border-slate-700"
                  style={{ height: '78vh', minHeight: 680 }}
                >
                  <iframe
                    key={instanceLaunch.url}
                    src={instanceLaunch.url}
                    title={`Instância ${selectedModule.brandName} — ${currentCompany?.tradeName || resolvedCompanyId}`}
                    className="w-full h-full border-0 bg-white"
                    allow="clipboard-read; clipboard-write; fullscreen"
                  />
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* MENU 1: DASHBOARD EXECUTIVO & VISÃO GERAL DA PLATAFORMA         */}
            {/* =============================================================== */}
            {moduleViewTab === 'dashboard' && (
              <div className="space-y-5">
                {/* 4 KPIs Executivos em Tempo Real */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="card p-4 space-y-1">
                    <span className="text-xs text-muted">{selectedModule.kpis[0]?.label || 'Itens Ativos'}</span>
                    <div className="text-2xl font-extrabold">{activeRecordsCount}</div>
                    <span className="text-xs text-emerald-600 font-semibold">
                      ✓ Sincronizado em {selectedModule.dbSchema}.{selectedModule.primaryTable}
                    </span>
                  </div>

                  <div className="card p-4 space-y-1">
                    <span className="text-xs text-muted">{primaryMetricLabel}</span>
                    <div className="text-2xl font-extrabold text-teal-600">
                      {selectedModule.fields.some((f) => f.type === 'currency')
                        ? formatCurrency(primaryMetricSum, 'BRL', language)
                        : primaryMetricSum.toLocaleString('pt-BR')}
                    </div>
                    <span className="text-xs text-muted">Consolidado em tempo real</span>
                  </div>

                  <div className="card p-4 space-y-1">
                    <span className="text-xs text-muted">Taxa de Disponibilidade / SLA</span>
                    <div className="text-2xl font-extrabold">{activeRatePercent}%</div>
                    <span className="text-xs text-emerald-600 font-semibold">
                      SLA Alvo: {platformSettings?.slaAlertThresholdMinutes || 30} min
                    </span>
                  </div>

                  <div className="card p-4 space-y-1">
                    <span className="text-xs text-muted">Módulos & Tabelas do Schema</span>
                    <div className="text-2xl font-extrabold">{selectedModule.tables.length} Tabelas</div>
                    <span className="text-xs text-muted">
                      {ragDocs.length} doc(s) RAG • SSO Ativo
                    </span>
                  </div>
                </div>

                {/* Workbench Operacional Ao Vivo Integrado na Home da Plataforma */}
                <OlivelasInteractiveModuleShowcase
                  module={selectedModule}
                  records={filteredRecords}
                  onQuickPersist={handleQuickPersist}
                  onOpenNewModal={() => openCreateModal()}
                />

                {/* Mapa de Todos os Cadastros / Menus de Itens da Plataforma */}
                <div className="card p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold flex items-center gap-2">
                        <Layers size={18} className="text-teal-600" />
                        Menus de Cadastros & Tabelas de {selectedModule.brandName}
                      </h3>
                      <p className="text-xs text-muted">
                        Acesse qualquer cadastro abaixo para visualizar, criar, editar, filtrar ou exportar itens diretamente no banco PostgreSQL.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModuleViewTab('settings')}
                      className="btn btn-secondary btn-sm"
                    >
                      <Settings size={14} /> Configurar Parâmetros da Plataforma
                    </button>
                  </div>

                  <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                    <table className="data-table w-full text-xs">
                      <thead>
                        <tr>
                          <th>Menu / Cadastro</th>
                          <th>Tabela PostgreSQL</th>
                          <th>Descrição Operacional</th>
                          <th className="num">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedModule.tables.map((tbl) => {
                          const meta = getTableCatalogMetadata(selectedModule, tbl);
                          return (
                            <tr key={tbl}>
                              <td>
                                <strong className="text-sm">{meta.menuLabel}</strong>
                              </td>
                              <td>
                                <span className="badge badge-info font-mono text-[10px]">
                                  {selectedModule.dbSchema}.{tbl}
                                </span>
                              </td>
                              <td className="text-muted">{meta.description}</td>
                              <td className="num">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleSelectSchemaTable(tbl);
                                      setModuleViewTab('database');
                                    }}
                                    className="btn btn-primary btn-sm"
                                  >
                                    Abrir {meta.menuLabel}
                                  </button>
                                  {canCreate && (
                                    <button
                                      type="button"
                                      onClick={() => openCreateModal(tbl)}
                                      className="btn btn-secondary btn-sm"
                                      title={`Cadastrar novo ${meta.singularLabel}`}
                                    >
                                      <Plus size={13} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* MENU 2: OPERAÇÃO AO VIVO (WORKBENCH PRINCIPAL)                  */}
            {/* =============================================================== */}
            {moduleViewTab === 'interactive' && (
              <OlivelasInteractiveModuleShowcase
                module={selectedModule}
                records={filteredRecords}
                onQuickPersist={handleQuickPersist}
                onOpenNewModal={() => openCreateModal()}
              />
            )}

            {/* =============================================================== */}
            {/* MENU 3: QUADRO KANBAN & FLUXO DE STATUS DOS ITENS               */}
            {/* =============================================================== */}
            {moduleViewTab === 'workflow' && (
              <div className="card p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="badge badge-teal mb-1">Gestão Visual de Processos</span>
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <FolderKanban size={18} className="text-teal-600" />
                      Quadro Kanban — {activeTableMeta.menuLabel} (<code>{selectedModule.dbSchema}.{selectedTable}</code>)
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="select text-xs"
                      value={selectedTable || selectedModule.primaryTable}
                      onChange={(e) => handleSelectSchemaTable(e.target.value)}
                    >
                      {selectedModule.tables.map((t) => (
                        <option key={t} value={t}>
                          Tabela: {getTableCatalogMetadata(selectedModule, t).menuLabel} ({t})
                        </option>
                      ))}
                    </select>
                    {canCreate && (
                      <button
                        type="button"
                        onClick={() => openCreateModal()}
                        className="btn btn-primary btn-sm"
                      >
                        <Plus size={14} /> Novo {activeTableMeta.singularLabel}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      stageKey: 'pending',
                      title: '1. Pendente / Em Triagem',
                      badgeClass: 'badge-warning',
                      matcher: (st: string) =>
                        ['pending', 'open', 'waiting', 'draft', 'review', 'waiting_approval', 'curating'].includes(st),
                    },
                    {
                      stageKey: 'in_progress',
                      title: '2. Em Execução / Operação',
                      badgeClass: 'badge-info',
                      matcher: (st: string) =>
                        ['in_progress', 'preparing', 'in_repair', 'dispatched', 'drawing', 'auditing', 'evaluation', 'in_route'].includes(st),
                    },
                    {
                      stageKey: 'active',
                      title: '3. Concluído / Ativo / Homologado',
                      badgeClass: 'badge-success',
                      matcher: (st: string) =>
                        ![
                          'pending',
                          'open',
                          'waiting',
                          'draft',
                          'review',
                          'waiting_approval',
                          'curating',
                          'in_progress',
                          'preparing',
                          'in_repair',
                          'dispatched',
                          'drawing',
                          'auditing',
                          'evaluation',
                          'in_route',
                        ].includes(st),
                    },
                  ].map((col) => {
                    const colItems = filteredRecords.filter((r) => {
                      const rawStatus = String(
                        r.status || r.kds_status || r.risk_level || 'active',
                      ).toLowerCase();
                      return col.matcher(rawStatus);
                    });

                    return (
                      <div
                        key={col.stageKey}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-xs uppercase tracking-wider">{col.title}</strong>
                          <span className={`badge ${col.badgeClass}`}>{colItems.length}</span>
                        </div>

                        <div className="space-y-2.5">
                          {colItems.length === 0 ? (
                            <div className="text-xs text-muted py-6 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                              Nenhum item neste estágio
                            </div>
                          ) : (
                            colItems.map((rec) => {
                              const recId = String(rec.id || '');
                              const titleField = activeTableMeta.fields[0];
                              const subtitleField = activeTableMeta.fields[1];
                              return (
                                <div
                                  key={recId}
                                  className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <strong className="text-xs">
                                      {String(rec[titleField?.key || 'name'] || rec.title || rec.name || recId)}
                                    </strong>
                                    <code className="text-[10px] text-muted">{recId}</code>
                                  </div>
                                  {subtitleField && (
                                    <div className="text-xs text-muted">
                                      {subtitleField.label}:{' '}
                                      <strong>{String(rec[subtitleField.key] ?? '—')}</strong>
                                    </div>
                                  )}
                                  <div className="flex flex-wrap items-center justify-between gap-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-1">
                                      {col.stageKey !== 'pending' && (
                                        <button
                                          type="button"
                                          onClick={() => handleQuickStatusUpdate(rec, 'pending')}
                                          className="btn btn-ghost btn-sm text-[10px]"
                                        >
                                          ← Triagem
                                        </button>
                                      )}
                                      {col.stageKey !== 'in_progress' && (
                                        <button
                                          type="button"
                                          onClick={() => handleQuickStatusUpdate(rec, 'in_progress')}
                                          className="btn btn-secondary btn-sm text-[10px]"
                                        >
                                          Execução
                                        </button>
                                      )}
                                      {col.stageKey !== 'active' && (
                                        <button
                                          type="button"
                                          onClick={() => handleQuickStatusUpdate(rec, 'active')}
                                          className="btn btn-primary btn-sm text-[10px]"
                                        >
                                          ✓ Concluir
                                        </button>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => openEditModal(rec)}
                                      className="btn btn-ghost btn-sm text-[10px]"
                                    >
                                      <Edit3 size={11} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* MENU 4: CADASTROS & ITENS (TABELA CRUD COMPLETA COM PAGINAÇÃO)  */}
            {/* =============================================================== */}
            {(moduleViewTab === 'database' || moduleViewTab === 'interactive' || moduleViewTab === 'dashboard') && (
              <div className="space-y-4">
                <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Database size={16} className="text-teal-600" />
                      <h3 className="text-sm font-bold">
                        {activeTableMeta.menuLabel} — <code>{selectedModule.dbSchema}.{selectedTable || selectedModule.primaryTable}</code>
                      </h3>
                      <span className="badge badge-teal">{activeTableRecords.length} itens</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">{activeTableMeta.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {canExport && (
                      <button type="button" onClick={handleExportJson} className="btn btn-secondary btn-sm">
                        <Code2 size={13} /> JSON
                      </button>
                    )}
                    {canCreate && (
                      <button
                        type="button"
                        onClick={() => openCreateModal()}
                        className="btn btn-primary btn-sm"
                      >
                        <Plus size={13} /> Cadastrar {activeTableMeta.singularLabel}
                      </button>
                    )}
                  </div>
                </div>

                <UrlDataTable<{ id: string } & Record<string, unknown>>
                  tableId={`schema-table-${selectedModule.slug}-${selectedTable || selectedModule.primaryTable}`}
                  caption={`Registros de ${activeTableMeta.menuLabel} (${selectedModule.dbSchema}.${selectedTable || selectedModule.primaryTable})`}
                  items={activeTableRecords.map((r, idx) => ({
                    ...r,
                    id: String(r.id || `row-${idx}`),
                  }))}
                  defaultSortField="id"
                  csvFilename={`${selectedModule.dbSchema}_${selectedTable || selectedModule.primaryTable}.csv`}
                  searchPlaceholder={`Buscar em ${activeTableMeta.menuLabel}...`}
                  statusExtractor={(rec) =>
                    String(rec.status || rec.kds_status || rec.risk_level || 'active')
                  }
                  searchExtractor={(rec) => JSON.stringify(rec)}
                  statusOptions={[
                    { value: 'active', label: 'Ativo' },
                    { value: 'pending', label: 'Pendente' },
                    { value: 'in_progress', label: 'Em Execução' },
                    { value: 'completed', label: 'Concluído' },
                  ]}
                  isArchivedExtractor={(rec) =>
                    Boolean(
                      (rec.archive_metadata as { isArchived?: boolean } | undefined)?.isArchived,
                    )
                  }
                  onArchiveClick={
                    canArchive ? (rec) => setArchiveTargetId(String(rec.id)) : undefined
                  }
                  onRestoreClick={
                    canArchive ? (rec) => handleRestoreRecord(String(rec.id)) : undefined
                  }
                  columns={[
                    {
                      key: 'id',
                      header: 'ID',
                      sortable: true,
                      csvValue: (rec) => String(rec.id || ''),
                      render: (rec) => (
                        <span className="font-mono text-xs">{String(rec.id || '')}</span>
                      ),
                    },
                    ...activeTableMeta.fields.slice(0, 3).map((field) => ({
                      key: field.key,
                      header: field.label,
                      sortable: true,
                      isNumeric: field.type === 'currency' || field.type === 'number',
                      csvValue: (rec: { id: string } & Record<string, unknown>) =>
                        String(rec[field.key] ?? ''),
                      render: (rec: { id: string } & Record<string, unknown>) => {
                        const val = rec[field.key];
                        if (field.type === 'currency') {
                          return (
                            <span className="font-semibold tabular">
                              {formatCurrency(Number(val || 0), 'BRL', language)}
                            </span>
                          );
                        }
                        return <span>{String(val ?? '—')}</span>;
                      },
                    })),
                    {
                      key: 'gov_status',
                      header: 'Status',
                      render: (rec) => {
                        const archiveMeta = rec.archive_metadata as
                          | { isArchived?: boolean; archiveReason?: string }
                          | undefined;
                        const isArchived = Boolean(archiveMeta?.isArchived);
                        return isArchived ? (
                          <span className="badge badge-warning" title={archiveMeta?.archiveReason}>
                            Arquivado
                          </span>
                        ) : (
                          <span className="badge badge-success">Ativo</span>
                        );
                      },
                    },
                    {
                      key: 'row_actions',
                      header: 'Ações',
                      render: (rec) => {
                        const idStr = String(rec.id || '');
                        return (
                          <div className="inline-flex items-center gap-1 flex-wrap">
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => openEditModal(rec)}
                                className="btn btn-secondary btn-sm inline-flex items-center gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Editar
                              </button>
                            )}
                            {canAdminister && (
                              <button
                                type="button"
                                onClick={() => handleDeleteRecord(idStr)}
                                className="btn btn-ghost btn-sm text-rose-600 inline-flex items-center gap-1"
                                title="Excluir registro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      },
                    },
                  ]}
                />
              </div>
            )}

            {/* =============================================================== */}
            {/* MENU 5: CONFIGURAÇÕES COMPLETAS DA PLATAFORMA (SETTINGS)        */}
            {/* =============================================================== */}
            {moduleViewTab === 'settings' && platformSettings && (
              <form onSubmit={handleSavePlatformSettings} className="card p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
                  <div>
                    <span className="badge badge-teal mb-1">Centro de Configurações da Plataforma</span>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Settings size={18} className="text-teal-600" />
                      Configurações — {selectedModule.brandName}
                    </h2>
                    <p className="text-xs text-muted">
                      Personalize identidade, regras operacionais, automação WhatsApp, PIX, webhooks e backup do schema <code>{selectedModule.dbSchema}</code>.
                    </p>
                  </div>

                  <div className="segmented-tabs">
                    <button
                      type="button"
                      onClick={() => setSettingsSubTab('general')}
                      className={`segmented-tab ${settingsSubTab === 'general' ? 'active' : ''}`}
                    >
                      1. Unidade & Marca
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsSubTab('rules')}
                      className={`segmented-tab ${settingsSubTab === 'rules' ? 'active' : ''}`}
                    >
                      2. Regras & SLA
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsSubTab('integrations')}
                      className={`segmented-tab ${settingsSubTab === 'integrations' ? 'active' : ''}`}
                    >
                      3. PIX, WhatsApp & Webhook
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsSubTab('backup')}
                      className={`segmented-tab ${settingsSubTab === 'backup' ? 'active' : ''}`}
                    >
                      4. Backup & Banco SQL
                    </button>
                  </div>
                </div>

                {settingsSubTab === 'general' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold uppercase text-muted">
                        Nome de Exibição da Plataforma / Unidade
                      </label>
                      <input
                        type="text"
                        className="input w-full mt-1"
                        value={platformSettings.platformDisplayName}
                        onChange={(e) =>
                          setPlatformSettings({ ...platformSettings, platformDisplayName: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase text-muted">
                        CNPJ / Registro Profissional da Unidade
                      </label>
                      <input
                        type="text"
                        className="input w-full mt-1"
                        value={platformSettings.unitDocumentCnpj}
                        onChange={(e) =>
                          setPlatformSettings({ ...platformSettings, unitDocumentCnpj: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase text-muted">
                        E-mail Oficial de Operações & Suporte
                      </label>
                      <input
                        type="email"
                        className="input w-full mt-1"
                        value={platformSettings.supportEmail}
                        onChange={(e) =>
                          setPlatformSettings({ ...platformSettings, supportEmail: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase text-muted">
                        WhatsApp Business de Atendimento
                      </label>
                      <input
                        type="text"
                        className="input w-full mt-1"
                        value={platformSettings.whatsappNumber}
                        onChange={(e) =>
                          setPlatformSettings({ ...platformSettings, whatsappNumber: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase text-muted">
                        Horário de Funcionamento / Turnos
                      </label>
                      <input
                        type="text"
                        className="input w-full mt-1"
                        value={platformSettings.operatingHours}
                        onChange={(e) =>
                          setPlatformSettings({ ...platformSettings, operatingHours: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase text-muted">
                        Fuso Horário & Moeda Padrão
                      </label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <input
                          type="text"
                          className="input w-full"
                          value={platformSettings.timezone}
                          onChange={(e) =>
                            setPlatformSettings({ ...platformSettings, timezone: e.target.value })
                          }
                        />
                        <select
                          className="select w-full"
                          value={platformSettings.currency}
                          onChange={(e) =>
                            setPlatformSettings({
                              ...platformSettings,
                              currency: e.target.value as 'BRL' | 'USD' | 'EUR',
                            })
                          }
                        >
                          <option value="BRL">BRL (R$)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {settingsSubTab === 'rules' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-semibold uppercase text-muted">
                          Meta de SLA Operacional (Minutos)
                        </label>
                        <input
                          type="number"
                          className="input w-full mt-1"
                          value={platformSettings.slaAlertThresholdMinutes}
                          onChange={(e) =>
                            setPlatformSettings({
                              ...platformSettings,
                              slaAlertThresholdMinutes: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase text-muted">
                          Taxa de Serviço / Comissão Padrão (%)
                        </label>
                        <input
                          type="number"
                          className="input w-full mt-1"
                          value={platformSettings.serviceFeePercent}
                          onChange={(e) =>
                            setPlatformSettings({
                              ...platformSettings,
                              serviceFeePercent: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase text-muted">
                          Capacidade / Limite Diário de Operações
                        </label>
                        <input
                          type="number"
                          className="input w-full mt-1"
                          value={platformSettings.maxDailyCapacity}
                          onChange={(e) =>
                            setPlatformSettings({
                              ...platformSettings,
                              maxDailyCapacity: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        {
                          key: 'enableWhatsappAutomation' as const,
                          title: 'Automação de Lembretes & Confirmação WhatsApp',
                          desc: 'Dispara notificações automáticas a cada novo registro ou mudança de status.',
                        },
                        {
                          key: 'enableAiCopilotAutoIndex' as const,
                          title: 'Indexação Automática no Copiloto RAG',
                          desc: 'Sincroniza novos itens de todas as tabelas com a base semântica IA.',
                        },
                        {
                          key: 'enableStrictHbacAudit' as const,
                          title: 'Trilha de Auditoria Estrita HBAC & LGPD',
                          desc: 'Exige justificativa em arquivamentos e grava log de alterações por usuário.',
                        },
                        {
                          key: 'enablePublicShowcaseLink' as const,
                          title: 'Habilitar Link Externo de Demonstração (/demo)',
                          desc: 'Permite abertura em tela cheia para apresentação comercial e clientes.',
                        },
                      ].map((sw) => (
                        <label
                          key={sw.key}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 cursor-pointer"
                        >
                          <div>
                            <div className="text-sm font-bold">{sw.title}</div>
                            <div className="text-xs text-muted">{sw.desc}</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={platformSettings[sw.key]}
                            onChange={(e) =>
                              setPlatformSettings({ ...platformSettings, [sw.key]: e.target.checked })
                            }
                          />
                        </label>
                      ))}
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase text-muted">
                        Diretrizes e Políticas Específicas do Módulo
                      </label>
                      <textarea
                        rows={3}
                        className="input w-full mt-1"
                        value={platformSettings.customDomainRules}
                        onChange={(e) =>
                          setPlatformSettings({ ...platformSettings, customDomainRules: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                {settingsSubTab === 'integrations' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold uppercase text-muted">
                          Chave PIX Oficial para Checkout / Liquidação
                        </label>
                        <input
                          type="text"
                          className="input w-full mt-1 font-mono"
                          value={platformSettings.pixKey}
                          onChange={(e) =>
                            setPlatformSettings({ ...platformSettings, pixKey: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase text-muted">
                          Webhook URL para Eventos em Tempo Real
                        </label>
                        <input
                          type="text"
                          className="input w-full mt-1 font-mono"
                          value={platformSettings.webhookEndpointUrl}
                          onChange={(e) =>
                            setPlatformSettings({ ...platformSettings, webhookEndpointUrl: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase text-muted">
                        Template de Mensagem Automática WhatsApp (`{'{{cliente}}'}`, `{'{{id}}'}`)
                      </label>
                      <textarea
                        rows={3}
                        className="input w-full mt-1"
                        value={platformSettings.whatsappConfirmationTemplate}
                        onChange={(e) =>
                          setPlatformSettings({
                            ...platformSettings,
                            whatsappConfirmationTemplate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {settingsSubTab === 'backup' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-2 text-xs">
                      <div className="font-bold text-sm">Diagnóstico de Persistência PostgreSQL (Supabase)</div>
                      <div>
                        • Schema Dedicado: <code>{selectedModule.dbSchema}</code> ({selectedModule.tables.length} tabelas homologadas)
                      </div>
                      <div>
                        • Tabela de Configurações: <code>public.allin_entity_store</code> (chave:{' '}
                        <code>platform_settings_{selectedModule.dbSchema}_{resolvedCompanyId}</code>)
                      </div>
                      <div>
                        • Última atualização: <strong>{new Date(platformSettings.updatedAt).toLocaleString('pt-BR')}</strong> por{' '}
                        <code>{platformSettings.updatedBy}</code>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleExportJson}
                        className="btn btn-secondary"
                      >
                        <Download size={15} /> Exportar Snapshot Completo da Plataforma (JSON)
                      </button>
                      <button
                        type="button"
                        onClick={handleResetPlatformSettings}
                        className="btn btn-secondary"
                      >
                        <RotateCcw size={15} /> Restaurar Padrões de Fábrica
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-xs text-muted">
                    Todas as alterações entram em vigor imediatamente na plataforma e são salvas no Supabase.
                  </span>
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="btn btn-primary"
                  >
                    <Save size={15} />
                    {savingSettings ? 'Salvando no Supabase...' : 'Salvar Configurações da Plataforma'}
                  </button>
                </div>
              </form>
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
          </main>
        </div>

        {/* Modal de Criação / Edição de Registro em Qualquer Tabela do Schema */}
        {isCreateOpen && (
          <div className="modal-backdrop">
            <div className="modal-content max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  {editingRecord
                    ? `Editar ${activeTableMeta.singularLabel} (${String(editingRecord.id)})`
                    : `Novo ${activeTableMeta.singularLabel} — ${activeTableMeta.menuLabel}`}
                </h2>
                <span className="badge badge-info font-mono">
                  {selectedModule.dbSchema}.{selectedTable || selectedModule.primaryTable}
                </span>
              </div>
              <form onSubmit={handleSaveRecord} className="space-y-4">
                {activeTableMeta.fields.map((field) => (
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
                    {editingRecord
                      ? 'Salvar Alterações no Supabase'
                      : `Gravar em ${selectedModule.dbSchema}.${selectedTable || selectedModule.primaryTable}`}
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
        <UrlDataTable<OlivelasEcosystemModuleSpec>
          tableId={`ecosystem-commercial-table-${resolvedCompanyId}`}
          caption="Catálogo em formato de tabela das 16 plataformas comerciais Olivelas All In"
          items={OLIVELAS_ECOSYSTEM_MODULES}
          defaultSortField="brandName"
          csvFilename="plataformas-comerciais-olivelas.csv"
          searchPlaceholder="Buscar plataforma Olivelas, schema PostgreSQL, instância, porta ou tabela..."
          statusExtractor={(mod) => mod.category}
          searchExtractor={(mod) => {
            const srvSpec = getModuleInstanceServerSpec(mod.slug);
            return `${mod.brandName} ${mod.slug} ${mod.dbSchema} ${mod.folder} ${mod.category} ${mod.description} :${srvSpec.port} ${mod.tables.join(' ')}`;
          }}
          statusOptions={categories
            .filter((c) => c !== 'all')
            .map((c) => ({ value: c, label: c }))}
          columns={[
            {
              key: 'brandName',
              header: 'Plataforma Comercial Olivelas',
              sortable: true,
              csvValue: (mod) => `${mod.brandName} (${mod.slug})`,
              render: (mod) => (
                <div>
                  <div className="font-bold text-sm">{mod.brandName}</div>
                  <div className="text-xs text-muted">{mod.tagline}</div>
                  <code className="text-[11px] text-muted mono">projetos/{mod.folder}</code>
                </div>
              ),
            },
            {
              key: 'category',
              header: 'Categoria & Schema PostgreSQL',
              sortable: true,
              csvValue: (mod) => `${mod.category} (${mod.dbSchema})`,
              render: (mod) => (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="badge badge-teal">{mod.category}</span>
                    <span className="badge badge-info font-mono">{mod.dbSchema}</span>
                  </div>
                  <div className="text-xs text-muted">
                    {mod.tables.length} tabelas: <code>{mod.tables.slice(0, 4).join(', ')}</code>
                    {mod.tables.length > 4 ? ` +${mod.tables.length - 4}` : ''}
                  </div>
                </div>
              ),
            },
            {
              key: 'instance',
              header: 'Porta & Rota SSO',
              csvValue: (mod) => {
                const srvSpec = getModuleInstanceServerSpec(mod.slug);
                const instId = `inst_${resolvedCompanyId.replace(/[^a-zA-Z0-9_-]/g, '_')}_${mod.slug}`;
                return `${instId} (:${srvSpec.port}${srvSpec.adminPath})`;
              },
              render: (mod) => {
                const srvSpec = getModuleInstanceServerSpec(mod.slug);
                const instId = `inst_${resolvedCompanyId.replace(/[^a-zA-Z0-9_-]/g, '_')}_${mod.slug}`;
                return (
                  <div className="flex items-center gap-1.5 flex-wrap" title={instId}>
                    <span className="badge badge-teal font-mono">:{srvSpec.port}</span>
                    <span className="text-xs text-muted font-mono">{srvSpec.adminPath}</span>
                  </div>
                );
              },
            },
            {
              key: 'priceMonthly',
              header: 'Assinatura Mensal',
              sortable: true,
              isNumeric: true,
              csvValue: (mod) => mod.priceMonthly,
              render: (mod) => (
                <strong className="tabular">
                  {formatCurrency(mod.priceMonthly, 'BRL', language)}/mês
                </strong>
              ),
            },
            {
              key: 'actions',
              header: 'Acesso SSO & Governança',
              render: (mod) => {
                const targetUrl = buildModuleRoute(mod.slug);
                return (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() =>
                        openModuleInstanceInNewTab({
                          moduleSlug: mod.slug,
                          companyId: resolvedCompanyId,
                          companyName: currentCompany?.tradeName || 'Olivelas Holding',
                          userId: currentUser?.id,
                          userEmail: currentUser?.email,
                          userName: currentUser?.name,
                          userRole: 'admin',
                        })
                      }
                      className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
                    >
                      <span>Abrir Plataforma</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      to={targetUrl}
                      className="btn btn-secondary btn-sm"
                      title="Painel de Governança, RAG & API do Módulo"
                    >
                      Governança
                    </Link>
                  </div>
                );
              },
            },
          ]}
        />
      ) : (
        <UrlDataTable<CatalogModuleEntity>
          tableId="ecosystem-examples-table"
          caption="Módulos de exemplo migrados da fundação"
          items={exampleModules}
          defaultSortField="code"
          csvFilename="modulos-exemplo-allin.csv"
          searchPlaceholder="Buscar módulo de exemplo por código, nome ou descrição..."
          statusExtractor={(ex) => ex.category}
          searchExtractor={(ex) => `${ex.code} ${ex.name[language]} ${ex.description[language]} ${ex.usageLimits}`}
          columns={[
            {
              key: 'code',
              header: 'Código Técnico',
              sortable: true,
              render: (ex) => <code className="text-xs font-mono">{ex.code}</code>,
            },
            {
              key: 'name',
              header: 'Módulo de Exemplo',
              render: (ex) => (
                <div>
                  <div className="font-bold text-sm">{ex.name[language]}</div>
                  <div className="text-xs text-muted">{ex.description[language]}</div>
                </div>
              ),
            },
            {
              key: 'usageLimits',
              header: 'Limites Operacionais',
              render: (ex) => <span className="text-xs text-muted">{ex.usageLimits}</span>,
            },
            {
              key: 'priceMonthly',
              header: 'Valor Mensal',
              sortable: true,
              isNumeric: true,
              render: (ex) => (
                <strong className="tabular">
                  {formatCurrency(ex.priceMonthly, ex.currency, language)}/mês
                </strong>
              ),
            },
          ]}
        />
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

        <div className="table-wrapper">
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
