import React, { useMemo, useState } from 'react';
import { Link, NavLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Archive,
  CheckCircle2,
  Cloud,
  Database,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileCode,
  FileSignature,
  FileText,
  Layers,
  MessageCircle,
  Package,
  Play,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  CatalogModuleEntity,
  CommercialPlanProposal,
  ContractEntity,
  ContractStatus,
  CurrencyCode,
  ModuleCategory,
  ModuleCommercialStatus,
} from '../../types/domain';
import { generateId, repositories } from '../../repositories/repositories';
import { formatCurrency, formatDateTime } from '../../i18n/translations';
import {
  buildModuleInstanceLaunchUrl,
  getModuleInstanceServerSpec,
  openModuleInstanceInNewTab,
} from '../../services/olivelasEcosystemService';
import {
  AccessDeniedView,
  ActionDropdownItem,
  ActionDropdownMenu,
  ArchiveRecordDialog,
  ModalDialog,
  PageHeader,
  StatusBadge,
  UnsavedChangesBanner,
  UrlDataTable,
} from '../../components/shared/SharedComponents';
import {
  CONTRACT_TEMPLATE_VARIABLES,
  DEFAULT_CONTRACT_TERMS_TEMPLATE,
  deleteCommercialProposal,
  exportContractAsDOCX,
  exportContractAsHTML,
  exportContractAsPDF,
  getGoogleDriveConfig,
  interpolateContractTerms,
  listCommercialProposals,
  saveGoogleDriveConfig,
  updateCommercialProposalStatus,
} from '../../services/enterpriseFinanceAndContractsService';

export const ModuleDetailsModal: React.FC<{
  module: CatalogModuleEntity | null;
  onClose: () => void;
}> = ({ module: mod, onClose }) => {
  const { companyModules, companies, currentUser, session, hasPermission } = useApp();

  if (!mod) return null;

  const subscribedCompanies = companyModules.filter((cm) => cm.moduleId === mod.id);
  const demoSlug = mod.ecosystemSlug || mod.code;
  const activeCompany =
    companies.find((c) => c.id === session.activeCompanyId) || companies[0];
  const launchInfo = !mod.isExample
    ? buildModuleInstanceLaunchUrl({
        moduleSlug: demoSlug,
        companyId: activeCompany?.id || 'emp-olivelas-matriz',
        companyName: activeCompany?.tradeName || 'Olivelas Nebula Holdings',
      })
    : null;

  const handleLaunchForCompany = (compId?: string, compName?: string) => {
    openModuleInstanceInNewTab({
      moduleSlug: demoSlug,
      companyId: compId || activeCompany?.id || 'emp-olivelas-matriz',
      companyName: compName || activeCompany?.tradeName || 'Olivelas Nebula Holdings',
      userId: currentUser?.id || 'usr-admin-global',
      userEmail: currentUser?.email || 'willian.o.jesus@gmail.com',
      userName: currentUser?.name || 'Willian Jesus',
      userRole: 'GLOBAL_ADMIN',
    });
  };

  return (
    <ModalDialog
      open={Boolean(mod)}
      onClose={onClose}
      size="lg"
      title={`${mod.name[session.language]} (${mod.code})`}
      subtitle={`Versão v${mod.version} • Categoria: ${mod.category}${mod.isStaticPage ? ' • Arquitetura: Página Estática (Front-end)' : mod.dbSchema ? ` • Schema Supabase: ${mod.dbSchema}` : ''}`}
      footer={
        <div className="flex items-center justify-between w-full gap-2 flex-wrap">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={14} />
            Fechar
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            {hasPermission('modules', 'edit') && (
              <Link
                to={`/app/global/modulos/${mod.id}/editar`}
                className="btn btn-secondary btn-sm"
                onClick={onClose}
              >
                <Edit3 size={14} />
                Editar Módulo
              </Link>
            )}
            {!mod.isExample && (
              <>
                <Link
                  to={`/app/global/ecossistema/${demoSlug}`}
                  className="btn btn-secondary btn-sm"
                  onClick={onClose}
                >
                  <Play size={14} />
                  Painel da Instância
                </Link>
                <button
                  type="button"
                  onClick={() => handleLaunchForCompany()}
                  className="btn btn-primary btn-sm"
                >
                  <ExternalLink size={14} />
                  Abrir Aplicação (Nova Aba SSO)
                </button>
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm text-muted" style={{ flex: 1 }}>
            {mod.description[session.language]}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <StatusBadge status={mod.commercialStatus} />
            {mod.isExample ? (
              <span className="badge badge-warning">Módulo de Exemplo / Fundação</span>
            ) : mod.isStaticPage ? (
              <span className="badge badge-neutral">Página Estática</span>
            ) : (
              <span className="badge badge-success">Plataforma Comercial Oficial</span>
            )}
          </div>
        </div>

        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-label">Preço Mensal</span>
            <span className="kpi-value" style={{ fontSize: '1.35rem' }}>
              {formatCurrency(mod.priceMonthly, mod.currency, session.language)}
            </span>
            <span className="kpi-meta">Vigência: {mod.effectiveDate}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Preço Anual</span>
            <span className="kpi-value" style={{ fontSize: '1.35rem' }}>
              {formatCurrency(mod.priceYearly, mod.currency, session.language)}
            </span>
            <span className="kpi-meta">Limites: {mod.usageLimits}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Empresas Assinantes</span>
            <span className="kpi-value" style={{ fontSize: '1.35rem' }}>
              {subscribedCompanies.filter((s) => s.status === 'active').length}
            </span>
            <span className="kpi-meta">
              {launchInfo
                ? `Porta :${launchInfo.port}${launchInfo.serverSpec.adminPath}`
                : 'Módulo de Fundação'}
            </span>
          </div>
          {mod.isStaticPage ? (
            <div className="kpi-card">
              <span className="kpi-label">Arquitetura</span>
              <span className="kpi-value" style={{ fontSize: '1.05rem' }}>
                Página Estática
              </span>
              <span className="kpi-meta">Front-end puro • Sem backend • SSO All In</span>
            </div>
          ) : (
            mod.dbSchema && (
              <div className="kpi-card">
                <span className="kpi-label">Schema PostgreSQL</span>
                <span className="kpi-value mono" style={{ fontSize: '1.05rem' }}>
                  {mod.dbSchema}
                </span>
                <span className="kpi-meta">
                  {mod.tables?.length || 1} tabela(s) • public.profiles SSO
                </span>
              </div>
            )
          )}
        </div>

        {mod.features && mod.features.length > 0 && (
          <div className="card" style={{ boxShadow: 'none' }}>
            <div className="card-header" style={{ padding: '0.75rem 1rem' }}>
              <strong className="text-xs uppercase">Recursos & Arquitetura da Aplicação</strong>
              {mod.projectFolder && (
                <span className="badge badge-info mono">/projetos/{mod.projectFolder}</span>
              )}
            </div>
            <div className="card-body grid-2" style={{ padding: '1rem' }}>
              <div>
                <strong className="text-xs uppercase text-muted block mb-2">
                  Funcionalidades Disponíveis
                </strong>
                <div className="flex flex-col gap-1.5">
                  {mod.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 size={14} style={{ color: 'var(--status-success)' }} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
              {mod.tables && (
                <div>
                  <strong className="text-xs uppercase text-muted block mb-2">
                    Tabelas no Schema ({mod.dbSchema})
                  </strong>
                  <div className="flex flex-wrap gap-1.5">
                    {mod.tables.map((tbl) => (
                      <span key={tbl} className="badge badge-teal mono">
                        {mod.dbSchema}.{tbl}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="card" style={{ boxShadow: 'none' }}>
          <div className="card-header" style={{ padding: '0.75rem 1rem' }}>
            <strong className="text-xs uppercase">
              Empresas com Vínculo neste Módulo ({subscribedCompanies.length})
            </strong>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Porta & Ciclo</th>
                  <th>Estado</th>
                  <th className="num">Valor Acordado</th>
                  <th className="num">Acesso SSO</th>
                </tr>
              </thead>
              <tbody>
                {subscribedCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted" style={{ padding: '1.25rem' }}>
                      Nenhuma empresa vinculada no momento.
                    </td>
                  </tr>
                ) : (
                  subscribedCompanies.map((sub) => {
                    const comp = companies.find((c) => c.id === sub.companyId);
                    const instInfo = buildModuleInstanceLaunchUrl({
                      moduleSlug: demoSlug,
                      companyId: sub.companyId,
                      companyName: comp?.tradeName || sub.companyId,
                    });
                    return (
                      <tr key={sub.id}>
                        <td>
                          <Link
                            to={`/app/global/empresas/${sub.companyId}`}
                            className="font-semibold"
                            onClick={onClose}
                          >
                            {comp?.tradeName || sub.companyId}
                          </Link>
                        </td>
                        <td>
                          <div
                            className="flex items-center gap-1.5 flex-wrap"
                            title={instInfo.instanceId}
                          >
                            <span className="badge badge-teal mono">:{instInfo.port}</span>
                            <span className="text-xs text-muted">{sub.billingCycle}</span>
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={sub.status} />
                        </td>
                        <td className="num tabular font-semibold">
                          {formatCurrency(sub.agreedPrice, sub.currency, session.language)}
                        </td>
                        <td className="num">
                          {!mod.isExample && (
                            <button
                              type="button"
                              onClick={() =>
                                handleLaunchForCompany(
                                  sub.companyId,
                                  comp?.tradeName || sub.companyId,
                                )
                              }
                              className="btn btn-primary btn-sm"
                            >
                              <ExternalLink size={12} />
                              Abrir Instância
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
    </ModalDialog>
  );
};

export const GlobalModulesCatalogPage: React.FC = () => {
  const {
    modules,
    companyModules,
    companies,
    currentUser,
    session,
    hasPermission,
    getActor,
    refreshData,
    notify,
    t,
  } = useApp();
  const [searchParams] = useSearchParams();
  const [archiveTarget, setArchiveTarget] = useState<CatalogModuleEntity | null>(null);
  const [detailModalModule, setDetailModalModule] = useState<CatalogModuleEntity | null>(null);

  const activeCompany =
    companies.find((c) => c.id === session.activeCompanyId) || companies[0];

  const handleOpenInstance = (moduleSlug: string, companyId?: string, companyName?: string) => {
    openModuleInstanceInNewTab({
      moduleSlug,
      companyId: companyId || activeCompany?.id || 'emp-olivelas-matriz',
      companyName: companyName || activeCompany?.tradeName || 'Olivelas Nebula Holdings',
      userId: currentUser?.id || 'usr-admin-global',
      userEmail: currentUser?.email || 'willian.o.jesus@gmail.com',
      userName: currentUser?.name || 'Willian Jesus',
      userRole: 'GLOBAL_ADMIN',
    });
  };

  if (!hasPermission('modules', 'view')) {
    return (
      <AccessDeniedView
        reason="Seu papel atual não possui permissão para acessar o catálogo comercial de módulos."
        requiredPermission="modules:view"
      />
    );
  }

  const commercialCount = modules.filter((m) => !m.isExample).length;
  const staticCount = modules.filter((m) => Boolean(m.isStaticPage)).length;
  const exampleCount = modules.filter((m) => Boolean(m.isExample)).length;
  const typeFilter = searchParams.get('type') || 'all';
  const unifiedItems = modules.filter((m) => {
    if (typeFilter === 'commercial') return !m.isExample;
    if (typeFilter === 'static') return Boolean(m.isStaticPage);
    if (typeFilter === 'examples') return Boolean(m.isExample);
    return true;
  });

  const handleRestore = async (mod: CatalogModuleEntity) => {
    await repositories.modules.restore(mod.id, getActor());
    await refreshData();
    notify({ type: 'success', title: `Módulo ${mod.name[session.language]} restaurado.` });
  };

  return (
    <div className="flex flex-col gap-2.5">
      <PageHeader
        breadcrumbs={[
          { label: t('scope.global'), to: '/app/global' },
          { label: t('nav.modules') },
        ]}
        title="Catálogo Comercial de Módulos Olivelas All In"
        subtitle={`Lista unificada com todos os ${modules.length} módulos (${commercialCount} plataformas comerciais Olivelas com schemas PostgreSQL dedicados e ${exampleCount} módulos base).`}
        scopeBadge={t('scope.global')}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/app/global/ecossistema" className="btn btn-secondary btn-sm">
              <Sparkles size={14} />
              Hub de Demonstração ({commercialCount} Plataformas)
            </Link>
            {hasPermission('modules', 'create') && (
              <Link to="/app/global/modulos/novo" className="btn btn-primary btn-sm">
                <Plus size={14} />
                Cadastrar Módulo Comercial
              </Link>
            )}
          </div>
        }
      />

      <UrlDataTable<CatalogModuleEntity>
        tableId="global-modules-table"
        caption="Catálogo unificado de módulos da plataforma Olivelas All In"
        items={unifiedItems}
        defaultSortField="code"
        csvFilename="catalogo-modulos-olivelas-allin.csv"
        searchPlaceholder="Buscar aplicação Olivelas, código, schema PostgreSQL, porta (:4101–:4137) ou categoria..."
        statusExtractor={(m) => m.commercialStatus}
        searchExtractor={(m) => {
          const demoSlug = m.ecosystemSlug || m.code;
          const srvSpec = getModuleInstanceServerSpec(demoSlug);
          const staticTag = m.isStaticPage ? 'página estática pagina estatica front-end sem backend' : '';
          return `${m.code} ${m.name['pt-BR']} ${m.name.en} ${m.category} ${m.usageLimits} ${m.dbSchema || ''} :${srvSpec.port} ${staticTag}`;
        }}
        statusOptions={[
          { value: 'active', label: t('status.active') },
          { value: 'beta', label: 'Beta' },
          { value: 'discontinued', label: 'Descontinuado' },
          { value: 'archived', label: t('status.archived') },
        ]}
        isArchivedExtractor={(m) => m.archiveMetadata.isArchived}
        extraFiltersRender={(params, updateParam) => (
          <select
            className="select"
            style={{ width: 'auto', minWidth: '185px', padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
            value={params.get('type') || 'all'}
            onChange={(e) => updateParam('type', e.target.value)}
            aria-label="Filtrar tipo de módulo"
          >
            <option value="all">Todos os Módulos ({modules.length})</option>
            <option value="commercial">Plataformas Comerciais ({commercialCount})</option>
            <option value="static">Páginas Estáticas ({staticCount})</option>
            <option value="examples">Módulos Base / Exemplos ({exampleCount})</option>
          </select>
        )}
        columns={[
          {
            key: 'code',
            header: 'Aplicação',
            sortable: true,
            width: '26%',
            csvValue: (m) =>
              `${m.name[session.language]} (${m.code})${m.isStaticPage ? ' [Página Estática]' : ''}`,
            render: (m) => (
              <div style={{ minWidth: 0 }}>
                <button
                  type="button"
                  onClick={() => setDetailModalModule(m)}
                  className="font-semibold truncate block w-full"
                  title={`${m.name[session.language]} — Clique para ver detalhes`}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--accent-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    font: 'inherit',
                    fontWeight: 600,
                  }}
                >
                  {m.name[session.language]}
                </button>
                <div
                  className="text-xs text-muted mono truncate"
                  title={
                    m.isStaticPage
                      ? `${m.code} • v${m.version} • Página Estática (Front-end sem backend)`
                      : `${m.code} • v${m.version}${m.dbSchema ? ` • schema: ${m.dbSchema}` : ''}`
                  }
                >
                  v{m.version} • {m.isStaticPage ? 'Página Estática' : m.dbSchema || m.code}
                </div>
              </div>
            ),
          },
          {
            key: 'category',
            header: 'Categoria',
            width: '18%',
            render: (m) => (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="badge badge-info">{m.category}</span>
                {m.isExample ? (
                  <span className="badge badge-warning">Base</span>
                ) : m.isStaticPage ? (
                  <span className="badge badge-neutral" title="Aplicação Front-end pura (sem backend)">
                    Página Estática
                  </span>
                ) : (
                  <span className="badge badge-success">Comercial</span>
                )}
              </div>
            ),
          },
          {
            key: 'instance',
            header: 'Porta & Rota SSO',
            width: '18%',
            csvValue: (m) => {
              if (m.isExample) return 'Módulo Base';
              const demoSlug = m.ecosystemSlug || m.code;
              const launchInfo = buildModuleInstanceLaunchUrl({
                moduleSlug: demoSlug,
                companyId: activeCompany?.id || 'emp-olivelas-matriz',
                companyName: activeCompany?.tradeName || 'Olivelas Nebula Holdings',
              });
              return `:${launchInfo.port}${launchInfo.serverSpec.adminPath}`;
            },
            render: (m) => {
              if (m.isExample) {
                return <span className="text-xs text-muted">Fundação</span>;
              }
              const demoSlug = m.ecosystemSlug || m.code;
              const launchInfo = buildModuleInstanceLaunchUrl({
                moduleSlug: demoSlug,
                companyId: activeCompany?.id || 'emp-olivelas-matriz',
                companyName: activeCompany?.tradeName || 'Olivelas Nebula Holdings',
              });
              return (
                <div className="flex items-center gap-1.5 flex-wrap" title={launchInfo.instanceId}>
                  <span className="badge badge-teal mono">:{launchInfo.port}</span>
                  <span className="text-xs text-muted mono truncate" style={{ maxWidth: '115px' }}>
                    {launchInfo.serverSpec.adminPath}
                  </span>
                </div>
              );
            },
          },
          {
            key: 'priceMonthly',
            header: 'Mensalidade',
            sortable: true,
            isNumeric: true,
            width: '15%',
            csvValue: (m) => m.priceMonthly,
            render: (m) => (
              <div>
                <div className="font-semibold tabular">
                  {formatCurrency(m.priceMonthly, m.currency, session.language)}/mês
                </div>
                <div className="text-xs text-muted tabular">
                  {formatCurrency(m.priceYearly, m.currency, session.language)}/ano
                </div>
              </div>
            ),
          },
          {
            key: 'commercialStatus',
            header: 'Status & Empresas',
            sortable: true,
            width: '15%',
            csvValue: (m) => {
              const count = companyModules.filter(
                (cm) => cm.moduleId === m.id && cm.status === 'active',
              ).length;
              return `${m.commercialStatus} (${count} empresas)`;
            },
            render: (m) => {
              const count = companyModules.filter(
                (cm) => cm.moduleId === m.id && cm.status === 'active',
              ).length;
              return (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <StatusBadge status={m.commercialStatus} />
                  <span className="badge badge-teal" title="Empresas ativas neste módulo">
                    {count} emp.
                  </span>
                </div>
              );
            },
          },
          {
            key: 'actions',
            header: 'Ações',
            isNumeric: true,
            width: '8%',
            render: (m) => {
              const demoSlug = m.ecosystemSlug || m.code;
              const isArchived = m.archiveMetadata.isArchived;
              const menuItems: ActionDropdownItem[] = [
                {
                  key: 'details',
                  label: 'Detalhes da Aplicação',
                  icon: <Eye size={14} />,
                  onClick: () => setDetailModalModule(m),
                },
              ];

              if (!m.isExample) {
                menuItems.push(
                  {
                    key: 'open-sso',
                    label: 'Abrir Aplicação (Nova Aba SSO)',
                    icon: <ExternalLink size={14} />,
                    onClick: () => handleOpenInstance(demoSlug),
                  },
                  {
                    key: 'hub',
                    label: 'Painel da Instância / Hub',
                    icon: <Play size={14} />,
                    to: `/app/global/ecossistema/${demoSlug}`,
                  },
                );
              }

              if (hasPermission('modules', 'edit')) {
                menuItems.push({
                  key: 'edit',
                  label: 'Editar Módulo',
                  icon: <Edit3 size={14} />,
                  to: `/app/global/modulos/${m.id}/editar`,
                  dividerBefore: true,
                });
              }

              if (hasPermission('modules', 'archive')) {
                if (isArchived) {
                  menuItems.push({
                    key: 'restore',
                    label: t('common.restore'),
                    icon: <RotateCcw size={14} />,
                    onClick: () => handleRestore(m),
                    dividerBefore: !hasPermission('modules', 'edit'),
                  });
                } else {
                  menuItems.push({
                    key: 'archive',
                    label: t('common.archive'),
                    icon: <Archive size={14} />,
                    variant: 'danger',
                    onClick: () => setArchiveTarget(m),
                    dividerBefore: !hasPermission('modules', 'edit'),
                  });
                }
              }

              return <ActionDropdownMenu label="Ações" items={menuItems} />;
            },
          },
        ]}
      />

      <ModuleDetailsModal
        module={detailModalModule}
        onClose={() => setDetailModalModule(null)}
      />

      <ArchiveRecordDialog
        open={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        recordTitle={archiveTarget ? archiveTarget.name[session.language] : ''}
        onConfirmArchive={async (reason) => {
          if (!archiveTarget) return;
          await repositories.modules.archive(archiveTarget.id, reason, getActor());
          await refreshData();
          notify({ type: 'warning', title: 'Módulo arquivado com sucesso.' });
        }}
      />
    </div>
  );
};

export const ModuleFormPage: React.FC<{ mode: 'create' | 'edit' }> = ({ mode }) => {
  const { moduloId } = useParams<{ moduloId: string }>();
  const { modules, session, hasPermission, getActor, refreshData, notify, t } = useApp();
  const navigate = useNavigate();

  const existing = mode === 'edit' ? modules.find((m) => m.id === moduloId) : undefined;

  const [code, setCode] = useState(existing?.code || 'allin_novo_modulo');
  const [namePt, setNamePt] = useState(existing?.name['pt-BR'] || '');
  const [descPt, setDescPt] = useState(existing?.description['pt-BR'] || '');
  const [category, setCategory] = useState<ModuleCategory>(existing?.category || 'operations');
  const [priceMonthly, setPriceMonthly] = useState(existing?.priceMonthly || 159);
  const [priceYearly, setPriceYearly] = useState(existing?.priceYearly || 1590);
  const [currency, setCurrency] = useState<CurrencyCode>(existing?.currency || 'BRL');
  const [usageLimits, setUsageLimits] = useState(
    existing?.usageLimits || 'Até 1.000 registros operacionais por mês.',
  );
  const [version, setVersion] = useState(existing?.version || '1.0.0');
  const [effectiveDate, setEffectiveDate] = useState(existing?.effectiveDate || '2026-10-28');
  const [commercialStatus, setCommercialStatus] = useState<ModuleCommercialStatus>(
    existing?.commercialStatus || 'active',
  );
  const [dependencies, setDependencies] = useState<string[]>(
    existing?.dependencies || ['allin_core'],
  );
  const [isDirty, setIsDirty] = useState(false);

  if (!hasPermission('modules', mode === 'create' ? 'create' : 'edit')) {
    return (
      <AccessDeniedView
        reason="Sem permissão para criar ou editar módulos comerciais."
        requiredPermission={`modules:${mode}`}
      />
    );
  }

  const toggleDep = (depCode: string) => {
    setDependencies((prev) =>
      prev.includes(depCode) ? prev.filter((c) => c !== depCode) : [...prev, depCode],
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const actor = getActor();
    if (mode === 'create') {
      const newId = generateId('mod');
      const record: CatalogModuleEntity = {
        id: newId,
        code: code.trim().toLowerCase(),
        name: { 'pt-BR': namePt.trim(), en: namePt.trim(), es: namePt.trim() },
        description: { 'pt-BR': descPt.trim(), en: descPt.trim(), es: descPt.trim() },
        category,
        priceMonthly: Number(priceMonthly),
        priceYearly: Number(priceYearly),
        currency,
        usageLimits: usageLimits.trim(),
        dependencies,
        commercialStatus,
        version: version.trim(),
        effectiveDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        archiveMetadata: { isArchived: false },
        changeHistory: [],
      };
      await repositories.modules.create(
        record,
        actor,
        `Cadastro do módulo comercial ${record.name['pt-BR']} (${record.code}).`,
      );
      await refreshData();
      notify({ type: 'success', title: 'Módulo cadastrado com sucesso.' });
      navigate(`/app/global/modulos/${newId}`);
    } else if (existing) {
      await repositories.modules.update(
        existing.id,
        (curr) => ({
          ...curr,
          code: code.trim().toLowerCase(),
          name: { ...curr.name, 'pt-BR': namePt.trim() },
          description: { ...curr.description, 'pt-BR': descPt.trim() },
          category,
          priceMonthly: Number(priceMonthly),
          priceYearly: Number(priceYearly),
          currency,
          usageLimits: usageLimits.trim(),
          dependencies,
          commercialStatus,
          version: version.trim(),
          effectiveDate,
        }),
        actor,
        `Atualização comercial do módulo ${namePt.trim()} (${code.trim()}).`,
      );
      await refreshData();
      notify({ type: 'success', title: t('msg.savedSuccess') });
      navigate(`/app/global/modulos/${existing.id}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: t('scope.global'), to: '/app/global' },
          { label: t('nav.modules'), to: '/app/global/modulos' },
          { label: mode === 'create' ? 'Novo Módulo' : existing?.name[session.language] || 'Editar' },
        ]}
        title={mode === 'create' ? 'Cadastrar Módulo Comercial' : `Editar Módulo — ${existing?.name[session.language]}`}
      />

      <UnsavedChangesBanner isDirty={isDirty} onDiscard={() => navigate('/app/global/modulos')} />

      <form onSubmit={handleSave} onChange={() => setIsDirty(true)}>
        <div className="form-section">
          <div className="form-section-title">1. Identificação Técnica e Comercial</div>
          <div className="form-grid mt-2">
            <div className="field">
              <label htmlFor="mod-name">Nome Comercial *</label>
              <input
                id="mod-name"
                className="input"
                required
                value={namePt}
                onChange={(e) => setNamePt(e.target.value)}
                placeholder="Ex.: Olivelas - Fiscal & NFe"
              />
            </div>
            <div className="field">
              <label htmlFor="mod-code">Código Técnico *</label>
              <input
                id="mod-code"
                className="input mono"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="mod-cat">Categoria</label>
              <select
                id="mod-cat"
                className="select"
                value={category}
                onChange={(e) => setCategory(e.target.value as ModuleCategory)}
              >
                <option value="core">Core</option>
                <option value="operations">Operações</option>
                <option value="finance">Financeiro</option>
                <option value="commercial">Comercial</option>
                <option value="people">Equipe & Pessoas</option>
                <option value="technical">Técnico / API</option>
                <option value="governance">Governança</option>
                <option value="support">Suporte</option>
                <option value="intelligence">Inteligência / Analytics</option>
              </select>
            </div>
          </div>

          <div className="field mt-4">
            <label htmlFor="mod-desc">Descrição Comercial e Escopo *</label>
            <textarea
              id="mod-desc"
              className="textarea"
              required
              value={descPt}
              onChange={(e) => setDescPt(e.target.value)}
            />
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">2. Precificação, Versão e Limites</div>
          <div className="form-grid mt-2">
            <div className="field">
              <label htmlFor="mod-price-m">Preço Mensal *</label>
              <input
                id="mod-price-m"
                type="number"
                min={0}
                className="input tabular"
                required
                value={priceMonthly}
                onChange={(e) => setPriceMonthly(Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label htmlFor="mod-price-y">Preço Anual *</label>
              <input
                id="mod-price-y"
                type="number"
                min={0}
                className="input tabular"
                required
                value={priceYearly}
                onChange={(e) => setPriceYearly(Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label htmlFor="mod-currency">Moeda</label>
              <select
                id="mod-currency"
                className="select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              >
                <option value="BRL">BRL</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="mod-version">Versão</label>
              <input
                id="mod-version"
                className="input mono"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="mod-date">Data de Vigência</label>
              <input
                id="mod-date"
                type="date"
                className="input tabular"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="mod-status">Estado Comercial</label>
              <select
                id="mod-status"
                className="select"
                value={commercialStatus}
                onChange={(e) => setCommercialStatus(e.target.value as ModuleCommercialStatus)}
              >
                <option value="active">Ativo</option>
                <option value="beta">Beta</option>
                <option value="discontinued">Descontinuado</option>
              </select>
            </div>
          </div>

          <div className="field mt-4">
            <label htmlFor="mod-limits">Limites de Utilização</label>
            <input
              id="mod-limits"
              className="input"
              value={usageLimits}
              onChange={(e) => setUsageLimits(e.target.value)}
            />
          </div>

          <div className="field mt-4">
            <label>Dependências de Outros Módulos</label>
            <div className="flex items-center gap-2 flex-wrap">
              {modules
                .filter((m) => m.id !== existing?.id)
                .map((m) => (
                  <label key={m.id} className="badge" style={{ cursor: 'pointer', padding: '0.35rem 0.6rem' }}>
                    <input
                      type="checkbox"
                      checked={dependencies.includes(m.code)}
                      onChange={() => toggleDep(m.code)}
                      style={{ marginRight: 4 }}
                    />
                    {m.name[session.language]} ({m.code})
                  </label>
                ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link to="/app/global/modulos" className="btn btn-secondary">
            {t('common.cancel')}
          </Link>
          <button type="submit" className="btn btn-primary">
            <Save size={15} />
            {t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
};

export const ModuleDetailPage: React.FC = () => {
  const { moduloId } = useParams<{ moduloId: string }>();
  const { modules, companyModules, companies, currentUser, session, hasPermission, t } = useApp();

  const mod = modules.find((m) => m.id === moduloId || m.code === moduloId);
  if (!mod) {
    return (
      <AccessDeniedView
        title="Módulo Não Encontrado"
        reason={`O módulo "${moduloId}" não existe no catálogo.`}
        backTo="/app/global/modulos"
      />
    );
  }

  const subscribedCompanies = companyModules.filter((cm) => cm.moduleId === mod.id);
  const demoSlug = mod.ecosystemSlug || mod.code;
  const activeCompany =
    companies.find((c) => c.id === session.activeCompanyId) || companies[0];

  const handleLaunchForCompany = (compId?: string, compName?: string) => {
    openModuleInstanceInNewTab({
      moduleSlug: demoSlug,
      companyId: compId || activeCompany?.id || 'emp-olivelas-matriz',
      companyName: compName || activeCompany?.tradeName || 'Olivelas Nebula Holdings',
      userId: currentUser?.id || 'usr-admin-global',
      userEmail: currentUser?.email || 'willian.o.jesus@gmail.com',
      userName: currentUser?.name || 'Willian Jesus',
      userRole: 'GLOBAL_ADMIN',
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: t('scope.global'), to: '/app/global' },
          { label: t('nav.modules'), to: '/app/global/modulos' },
          { label: mod.name[session.language] },
        ]}
        title={`${mod.name[session.language]} (${mod.code})`}
        subtitle={mod.description[session.language]}
        scopeBadge={`v${mod.version}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {!mod.isExample && (
              <>
                <button
                  type="button"
                  onClick={() => handleLaunchForCompany()}
                  className="btn btn-primary btn-sm"
                >
                  <ExternalLink size={14} />
                  Abrir Instância Completa (Nova Aba com SSO)
                </button>
                <Link
                  to={`/app/global/ecossistema/${demoSlug}`}
                  className="btn btn-secondary btn-sm"
                >
                  <Play size={14} />
                  Painel da Instância
                </Link>
              </>
            )}
            {hasPermission('modules', 'edit') && (
              <Link to={`/app/global/modulos/${mod.id}/editar`} className="btn btn-secondary btn-sm">
                <Edit3 size={14} />
                Editar Módulo
              </Link>
            )}
          </div>
        }
      />

      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Preço Mensal</span>
          <span className="kpi-value">
            {formatCurrency(mod.priceMonthly, mod.currency, session.language)}
          </span>
          <span className="kpi-meta">Vigência: {mod.effectiveDate}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Preço Anual</span>
          <span className="kpi-value">
            {formatCurrency(mod.priceYearly, mod.currency, session.language)}
          </span>
          <span className="kpi-meta">Categoria: {mod.category}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Empresas Assinantes</span>
          <span className="kpi-value">
            {subscribedCompanies.filter((s) => s.status === 'active').length}
          </span>
          <span className="kpi-meta">Limites: {mod.usageLimits}</span>
        </div>
        {mod.isStaticPage ? (
          <div className="kpi-card">
            <span className="kpi-label">Arquitetura</span>
            <span className="kpi-value" style={{ fontSize: '1.2rem' }}>
              Página Estática
            </span>
            <span className="kpi-meta">Front-end puro • Sem backend • SSO All In</span>
          </div>
        ) : (
          mod.dbSchema && (
            <div className="kpi-card">
              <span className="kpi-label">Schema PostgreSQL (Supabase)</span>
              <span className="kpi-value mono" style={{ fontSize: '1.2rem' }}>
                {mod.dbSchema}
              </span>
              <span className="kpi-meta">
                {mod.tables?.length || 4} tabelas dedicadas • Login único public.profiles
              </span>
            </div>
          )
        )}
      </div>

      {mod.features && mod.features.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '1rem' }}>Recursos & Tabelas do Módulo Comercial</h2>
            {mod.projectFolder && (
              <span className="badge badge-info mono">
                /projetos/{mod.projectFolder}
              </span>
            )}
          </div>
          <div className="card-body grid-2">
            <div>
              <strong className="text-xs uppercase text-muted block mb-2">
                Funcionalidades Disponíveis na Demonstração
              </strong>
              <div className="flex flex-col gap-1.5">
                {mod.features.map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 size={15} style={{ color: 'var(--status-success)' }} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
            {mod.tables && (
              <div>
                <strong className="text-xs uppercase text-muted block mb-2">
                  Tabelas no Schema PostgreSQL ({mod.dbSchema})
                </strong>
                <div className="flex flex-wrap gap-1.5">
                  {mod.tables.map((tbl) => (
                    <span key={tbl} className="badge badge-teal mono">
                      {mod.dbSchema}.{tbl}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: '1rem' }}>Empresas com Vínculo neste Módulo</h2>
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Porta & Ciclo</th>
                <th>Estado & Renovação</th>
                <th className="num">Valor Acordado</th>
                <th className="num">Acesso SSO</th>
              </tr>
            </thead>
            <tbody>
              {subscribedCompanies.map((sub) => {
                const comp = companies.find((c) => c.id === sub.companyId);
                const instInfo = buildModuleInstanceLaunchUrl({
                  moduleSlug: demoSlug,
                  companyId: sub.companyId,
                  companyName: comp?.tradeName || sub.companyId,
                });
                return (
                  <tr key={sub.id}>
                    <td>
                      <Link
                        to={`/app/global/empresas/${sub.companyId}`}
                        className="font-semibold"
                      >
                        {comp?.tradeName || sub.companyId}
                      </Link>
                    </td>
                    <td>
                      <div
                        className="flex items-center gap-1.5 flex-wrap"
                        title={instInfo.instanceId}
                      >
                        <span className="badge badge-teal mono">:{instInfo.port}</span>
                        <span className="text-xs text-muted">{sub.billingCycle}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusBadge status={sub.status} />
                        <span className="text-xs text-muted tabular">Renova: {sub.renewalDate}</span>
                      </div>
                    </td>
                    <td className="num tabular font-semibold">
                      {formatCurrency(sub.agreedPrice, sub.currency, session.language)}
                    </td>
                    <td className="num">
                      {!mod.isExample && (
                        <button
                          type="button"
                          onClick={() =>
                            handleLaunchForCompany(sub.companyId, comp?.tradeName || sub.companyId)
                          }
                          className="btn btn-primary btn-sm"
                        >
                          <ExternalLink size={12} />
                          Abrir Instância
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const CompanyModulesSubscriptionPage: React.FC = () => {
  const { empresaId } = useParams<{ empresaId: string }>();
  const [searchParams] = useSearchParams();
  const {
    companies,
    modules,
    companyModules,
    currentUser,
    session,
    hasPermission,
    getActor,
    refreshData,
    notify,
  } = useApp();
  const [detailModalModule, setDetailModalModule] = useState<CatalogModuleEntity | null>(null);

  const company = companies.find((c) => c.id === empresaId);
  if (!company) return null;

  const handleLaunchCompanyInstance = (moduleSlug: string) => {
    openModuleInstanceInNewTab({
      moduleSlug,
      companyId: company.id,
      companyName: company.tradeName,
      userId: currentUser?.id || 'usr-admin-global',
      userEmail: currentUser?.email || 'willian.o.jesus@gmail.com',
      userName: currentUser?.name || 'Willian Jesus',
      userRole: 'COMPANY_ADMIN',
    });
  };

  const canManage = hasPermission('modules', 'approve', company.id) || hasPermission('modules', 'edit', company.id);
  const mySubs = companyModules.filter((cm) => cm.companyId === company.id);

  const nonArchivedModules = modules.filter((m) => !m.archiveMetadata.isArchived);
  const commercialCount = nonArchivedModules.filter((m) => !m.isExample).length;
  const staticCount = nonArchivedModules.filter((m) => Boolean(m.isStaticPage)).length;
  const exampleCount = nonArchivedModules.filter((m) => Boolean(m.isExample)).length;
  const typeFilter = searchParams.get('type') || 'all';
  const visibleModules = nonArchivedModules.filter((m) => {
    if (typeFilter === 'commercial') return !m.isExample;
    if (typeFilter === 'static') return Boolean(m.isStaticPage);
    if (typeFilter === 'examples') return Boolean(m.isExample);
    return true;
  });

  const handleToggleSubscription = async (mod: CatalogModuleEntity) => {
    if (!canManage) return;
    const existing = mySubs.find((s) => s.moduleId === mod.id);
    const isActive = existing?.status === 'active';

    if (!isActive) {
      for (const depCode of mod.dependencies) {
        const depActive = mySubs.some((s) => s.moduleCode === depCode && s.status === 'active');
        if (!depActive && depCode !== 'allin_core') {
          notify({
            type: 'error',
            title: 'Dependência Modular Obrigatória',
            description: `Para contratar ${mod.name[session.language]}, ative primeiro o módulo ${depCode}.`,
          });
          return;
        }
      }
    }

    const actor = getActor(company.id);
    if (existing) {
      const nextStatus = isActive ? 'cancelled' : 'active';
      await repositories.companyModules.upsert(
        { ...existing, status: nextStatus },
        actor,
        `${isActive ? 'Cancelamento' : 'Reativação'} do módulo ${mod.name['pt-BR']} pela empresa ${company.tradeName}.`,
      );
    } else {
      await repositories.companyModules.upsert(
        {
          id: generateId('sub'),
          companyId: company.id,
          moduleId: mod.id,
          moduleCode: mod.code,
          status: 'active',
          billingCycle: 'monthly',
          agreedPrice: mod.priceMonthly,
          currency: mod.currency,
          activatedAt: new Date().toISOString(),
          renewalDate: '2027-10-28',
        },
        actor,
        `Contratação sob demanda do módulo ${mod.name['pt-BR']} pela empresa ${company.tradeName}.`,
      );
    }
    await refreshData();
    notify({
      type: 'success',
      title: `Módulo ${mod.name[session.language]} atualizado.`,
      description: 'O menu lateral da empresa foi sincronizado automaticamente.',
    });
  };

  return (
    <div className="flex flex-col gap-2.5">
      <PageHeader
        breadcrumbs={[
          { label: company.tradeName, to: `/app/empresa/${company.id}` },
          { label: 'Módulos Comerciais Olivelas & Loja Modular' },
        ]}
        title={`Módulos Comerciais Olivelas — ${company.tradeName}`}
        subtitle={`Lista unificada com ${nonArchivedModules.length} aplicações (${commercialCount} plataformas comerciais Olivelas e ${exampleCount} módulos base).`}
        scopeBadge={company.tradeName}
        actions={
          <Link to={`/app/empresa/${company.id}/ecossistema`} className="btn btn-primary btn-sm">
            <Sparkles size={14} />
            Ver Hub Completo ({commercialCount} Plataformas)
          </Link>
        }
      />

      <UrlDataTable<CatalogModuleEntity>
        tableId={`company-modules-table-${company.id}`}
        caption={`Módulos comerciais e assinaturas da empresa ${company.tradeName}`}
        items={visibleModules}
        defaultSortField="code"
        csvFilename={`modulos-${company.id}.csv`}
        searchPlaceholder="Buscar aplicação Olivelas, schema PostgreSQL, instância ou categoria..."
        statusExtractor={(mod) => {
          const sub = mySubs.find((s) => s.moduleId === mod.id);
          return sub?.status === 'active' ? 'active' : 'pending';
        }}
        searchExtractor={(mod) => {
          const demoSlug = mod.ecosystemSlug || mod.code;
          const srvSpec = getModuleInstanceServerSpec(demoSlug);
          const staticTag = mod.isStaticPage ? 'página estática pagina estatica front-end sem backend' : '';
          return `${mod.code} ${mod.name['pt-BR']} ${mod.category} ${mod.dbSchema || ''} :${srvSpec.port} ${mod.usageLimits} ${staticTag}`;
        }}
        statusOptions={[
          { value: 'active', label: 'Contratado / Ativo' },
          { value: 'pending', label: 'Disponível para Contratação' },
        ]}
        extraFiltersRender={(params, updateParam) => (
          <select
            className="select"
            style={{ width: 'auto', minWidth: '185px', padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
            value={params.get('type') || 'all'}
            onChange={(e) => updateParam('type', e.target.value)}
            aria-label="Filtrar tipo de módulo"
          >
            <option value="all">Todos os Módulos ({nonArchivedModules.length})</option>
            <option value="commercial">Plataformas Comerciais ({commercialCount})</option>
            <option value="static">Páginas Estáticas ({staticCount})</option>
            <option value="examples">Módulos Base / Exemplos ({exampleCount})</option>
          </select>
        )}
        columns={[
          {
            key: 'code',
            header: 'Aplicação',
            sortable: true,
            width: '26%',
            csvValue: (mod) =>
              `${mod.name[session.language]} (${mod.code})${mod.isStaticPage ? ' [Página Estática]' : ''}`,
            render: (mod) => (
              <div style={{ minWidth: 0 }}>
                <button
                  type="button"
                  onClick={() => setDetailModalModule(mod)}
                  className="font-semibold truncate block w-full"
                  title={`${mod.name[session.language]} — Clique para ver detalhes`}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--accent-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    font: 'inherit',
                    fontWeight: 600,
                  }}
                >
                  {mod.name[session.language]}
                </button>
                <div
                  className="text-xs text-muted mono truncate"
                  title={
                    mod.isStaticPage
                      ? `${mod.code} • v${mod.version} • Página Estática (Front-end sem backend)`
                      : `${mod.code} • v${mod.version}${mod.dbSchema ? ` • schema: ${mod.dbSchema}` : ''}`
                  }
                >
                  v{mod.version} • {mod.isStaticPage ? 'Página Estática' : mod.dbSchema || mod.code}
                </div>
              </div>
            ),
          },
          {
            key: 'category',
            header: 'Categoria',
            width: '18%',
            render: (mod) => (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="badge badge-info">{mod.category}</span>
                {mod.isExample ? (
                  <span className="badge badge-warning">Base</span>
                ) : mod.isStaticPage ? (
                  <span className="badge badge-neutral" title="Aplicação Front-end pura (sem backend)">
                    Página Estática
                  </span>
                ) : (
                  <span className="badge badge-success">Comercial</span>
                )}
              </div>
            ),
          },
          {
            key: 'instance',
            header: 'Porta & Rota SSO',
            width: '18%',
            csvValue: (mod) => {
              if (mod.isExample) return 'Módulo Base';
              const demoSlug = mod.ecosystemSlug || mod.code;
              const instInfo = buildModuleInstanceLaunchUrl({
                moduleSlug: demoSlug,
                companyId: company.id,
                companyName: company.tradeName,
              });
              return `:${instInfo.port}${instInfo.serverSpec.adminPath}`;
            },
            render: (mod) => {
              if (mod.isExample) {
                return <span className="text-xs text-muted">Fundação</span>;
              }
              const demoSlug = mod.ecosystemSlug || mod.code;
              const instInfo = buildModuleInstanceLaunchUrl({
                moduleSlug: demoSlug,
                companyId: company.id,
                companyName: company.tradeName,
              });
              return (
                <div className="flex items-center gap-1.5 flex-wrap" title={instInfo.instanceId}>
                  <span className="badge badge-teal mono">:{instInfo.port}</span>
                  <span className="text-xs text-muted mono truncate" style={{ maxWidth: '115px' }}>
                    {instInfo.serverSpec.adminPath}
                  </span>
                </div>
              );
            },
          },
          {
            key: 'priceMonthly',
            header: 'Mensalidade',
            sortable: true,
            isNumeric: true,
            width: '15%',
            csvValue: (mod) => mod.priceMonthly,
            render: (mod) => (
              <span className="font-semibold tabular">
                {formatCurrency(mod.priceMonthly, mod.currency, session.language)}/mês
              </span>
            ),
          },
          {
            key: 'status',
            header: 'Situação na Empresa',
            width: '15%',
            render: (mod) => {
              const sub = mySubs.find((s) => s.moduleId === mod.id);
              const active = sub?.status === 'active';
              return <StatusBadge status={active ? 'active' : 'pending'} />;
            },
          },
          {
            key: 'actions',
            header: 'Ações',
            isNumeric: true,
            width: '8%',
            render: (mod) => {
              const sub = mySubs.find((s) => s.moduleId === mod.id);
              const active = sub?.status === 'active';
              const demoSlug = mod.ecosystemSlug || mod.code;
              const targetDemoRoute = !mod.isExample
                ? `/app/empresa/${company.id}/ecossistema/${demoSlug}`
                : mod.code === 'allin_estoque'
                  ? `/app/empresa/${company.id}/operacao/estoque`
                  : mod.code === 'allin_vendas'
                    ? `/app/empresa/${company.id}/operacao/vendas`
                    : mod.code === 'allin_crm'
                      ? `/app/empresa/${company.id}/operacao/crm`
                      : `/app/empresa/${company.id}`;

              const menuItems: ActionDropdownItem[] = [
                {
                  key: 'details',
                  label: 'Detalhes da Aplicação',
                  icon: <Eye size={14} />,
                  onClick: () => setDetailModalModule(mod),
                },
              ];

              if (!mod.isExample) {
                menuItems.push(
                  {
                    key: 'open-sso',
                    label: 'Abrir Plataforma (Nova Aba SSO)',
                    icon: <ExternalLink size={14} />,
                    onClick: () => handleLaunchCompanyInstance(demoSlug),
                  },
                  {
                    key: 'hub',
                    label: 'Painel da Instância / Hub',
                    icon: <Play size={14} />,
                    to: targetDemoRoute,
                  },
                );
              } else {
                menuItems.push({
                  key: 'open-base',
                  label: 'Abrir Módulo Base',
                  icon: <Play size={14} />,
                  to: targetDemoRoute,
                });
              }

              if (canManage && !(mod.isCore && active)) {
                menuItems.push({
                  key: 'toggle-sub',
                  label: active ? 'Desativar Assinatura' : 'Contratar Módulo',
                  icon: <Package size={14} />,
                  variant: active ? 'danger' : 'default',
                  dividerBefore: true,
                  onClick: () => handleToggleSubscription(mod),
                });
              }

              return <ActionDropdownMenu label="Ações" items={menuItems} />;
            },
          },
        ]}
      />

      <ModuleDetailsModal
        module={detailModalModule}
        onClose={() => setDetailModalModule(null)}
      />
    </div>
  );
};

export const ContractsListPage: React.FC<{
  scope: 'global' | 'company';
  activeTab?: 'contratos' | 'propostas' | 'assinaturas' | 'editor';
}> = ({ scope, activeTab = 'contratos' }) => {
  const { empresaId } = useParams<{ empresaId: string }>();
  const navigate = useNavigate();
  const {
    contracts,
    companies,
    modules,
    currentUser,
    session,
    hasPermission,
    getActor,
    refreshData,
    notify,
    t,
  } = useApp();

  const [archiveTarget, setArchiveTarget] = useState<ContractEntity | null>(null);
  const [previewModalContract, setPreviewModalContract] = useState<ContractEntity | null>(null);
  const [signModalContract, setSignModalContract] = useState<ContractEntity | null>(null);
  const [signerName, setSignerName] = useState(currentUser?.name || 'Willian Jesus');
  const [signerEmail, setSignerEmail] = useState(
    currentUser?.email || 'willian.o.jesus@gmail.com',
  );
  const [signerDoc, setSignerDoc] = useState('***.842.190-**');
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  // Commercial Proposals state
  const [proposals, setProposals] = useState<CommercialPlanProposal[]>(() =>
    listCommercialProposals(),
  );

  // Google Drive modal state
  const [gdriveModalOpen, setGdriveModalOpen] = useState(false);
  const [gdriveConfig, setGdriveConfig] = useState(() => getGoogleDriveConfig());

  // Live Contract Manager / Editor state
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [mgrCode, setMgrCode] = useState(`CTR-2026-000${contracts.length + 1}`);
  const [mgrProviderName, setMgrProviderName] = useState(
    'Olivelas Tecnologia & Sistemas Allin Ltda.',
  );
  const [mgrProviderDoc, setMgrProviderDoc] = useState('48.192.001/0001-90');
  const [mgrProviderEmail, setMgrProviderEmail] = useState('contratos@olivelas.com.br');
  const [mgrProviderRep, setMgrProviderRep] = useState('Willian Jesus');
  const [mgrCompanyId, setMgrCompanyId] = useState(
    empresaId || companies[0]?.id || 'emp-olivelas-matriz',
  );
  const [mgrCustomerName, setMgrCustomerName] = useState(
    companies[0]?.legalName || 'Olivelas Atelier & Manufatura Ltda.',
  );
  const [mgrCustomerDoc, setMgrCustomerDoc] = useState(
    companies[0]?.taxId || '18.492.310/0001-54',
  );
  const [mgrCustomerEmail, setMgrCustomerEmail] = useState(
    companies[0]?.contacts[0]?.email || 'contato@olivelas-atelier.com.br',
  );
  const [mgrCustomerPhone, setMgrCustomerPhone] = useState(
    companies[0]?.contacts[0]?.phone || '+55 (11) 3482-9100',
  );
  const [mgrPlanName, setMgrPlanName] = useState('Allin Enterprise Multi-Loja & PDV');
  const [mgrModuleIds, setMgrModuleIds] = useState<string[]>([
    'mod_gestao_estoque',
    'mod-core',
    'mod-financeiro',
    'mod-contratos',
  ]);
  const [mgrCycle, setMgrCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [mgrDiscount, setMgrDiscount] = useState<number>(0);
  const [mgrFreeEmployeesQuota, setMgrFreeEmployeesQuota] = useState<number>(10);
  const [mgrPaymentTerms, setMgrPaymentTerms] = useState(
    'PIX Corporativo / Boleto Registrado (Vencimento dia 15)',
  );
  const [mgrStartDate, setMgrStartDate] = useState('2026-11-10');
  const [mgrEndDate, setMgrEndDate] = useState('2027-11-10');
  const [mgrStatus, setMgrStatus] = useState<ContractStatus>('active');
  const [mgrClauses, setMgrClauses] = useState(DEFAULT_CONTRACT_TERMS_TEMPLATE);

  const targetCompanyId = scope === 'company' ? empresaId : undefined;
  const company = targetCompanyId ? companies.find((c) => c.id === targetCompanyId) : null;
  const baseRoute =
    scope === 'global' ? '/app/global/contratos' : `/app/empresa/${empresaId}/contratos`;

  const scopedContracts = useMemo(
    () =>
      targetCompanyId
        ? contracts.filter((c) => c.companyId === targetCompanyId)
        : contracts,
    [contracts, targetCompanyId],
  );

  if (!hasPermission('contracts', 'view', targetCompanyId)) {
    return (
      <AccessDeniedView
        reason="Seu papel atual não possui permissão para visualizar contratos."
        requiredPermission="contracts:view"
      />
    );
  }

  const mgrGrossTotal = modules
    .filter((m) => mgrModuleIds.includes(m.id))
    .reduce((acc, m) => acc + (mgrCycle === 'yearly' ? m.priceYearly : m.priceMonthly), 0);
  const mgrFinalValue = Math.max(0, mgrGrossTotal - Number(mgrDiscount || 0));

  const livePreviewContract: ContractEntity = {
    id: editingContractId || 'ctr-preview',
    code: mgrCode,
    companyId: mgrCompanyId,
    companyName: mgrCustomerName,
    planName: mgrPlanName,
    moduleIds: mgrModuleIds,
    startDate: mgrStartDate,
    endDate: mgrEndDate,
    billingCycle: mgrCycle,
    totalValue: mgrGrossTotal,
    discountValue: Number(mgrDiscount || 0),
    finalValue: mgrFinalValue,
    currency: 'BRL',
    status: mgrStatus,
    commercialResponsible: mgrProviderRep,
    clausesText: mgrClauses,
    providerName: mgrProviderName,
    providerDocument: mgrProviderDoc,
    providerEmail: mgrProviderEmail,
    providerRepresentative: mgrProviderRep,
    customerDocument: mgrCustomerDoc,
    customerEmail: mgrCustomerEmail,
    customerPhone: mgrCustomerPhone,
    paymentTerms: mgrPaymentTerms,
    freeEmployeesQuota: mgrFreeEmployeesQuota,
    version: 1,
    versionHistory: [],
    signatures: editingContractId
      ? contracts.find((c) => c.id === editingContractId)?.signatures || []
      : [],
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archiveMetadata: { isArchived: false },
    changeHistory: [],
  };

  const loadContractIntoManager = (ct: ContractEntity) => {
    const comp = companies.find((c) => c.id === ct.companyId);
    setEditingContractId(ct.id);
    setMgrCode(ct.code);
    setMgrCompanyId(ct.companyId);
    setMgrCustomerName(ct.companyName);
    setMgrCustomerDoc(ct.customerDocument || comp?.taxId || '18.492.310/0001-54');
    setMgrCustomerEmail(
      ct.customerEmail || comp?.contacts[0]?.email || 'financeiro@empresa.com.br',
    );
    setMgrCustomerPhone(ct.customerPhone || comp?.contacts[0]?.phone || '+55 (11) 99999-0000');
    setMgrPlanName(ct.planName);
    setMgrModuleIds(ct.moduleIds);
    setMgrCycle(ct.billingCycle);
    setMgrDiscount(ct.discountValue);
    setMgrFreeEmployeesQuota(ct.freeEmployeesQuota ?? comp?.freeEmployeesLimit ?? 10);
    setMgrPaymentTerms(
      ct.paymentTerms || 'PIX Corporativo / Boleto Registrado (Vencimento dia 15)',
    );
    setMgrStartDate(ct.startDate);
    setMgrEndDate(ct.endDate);
    setMgrStatus(ct.status);
    setMgrClauses(ct.clausesText || DEFAULT_CONTRACT_TERMS_TEMPLATE);
    navigate(`${baseRoute}/editor`);
  };

  const handleGenerateContractFromProposal = (prop: CommercialPlanProposal) => {
    setEditingContractId(null);
    setMgrCode(`CTR-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    setMgrCustomerName(prop.companyName);
    setMgrCustomerDoc(prop.customerDocument);
    setMgrCustomerEmail(prop.customerEmail);
    setMgrCustomerPhone(prop.customerPhone);
    setMgrPlanName(prop.selectedPlanName);
    setMgrModuleIds(
      prop.selectedModuleIds.length > 0 ? prop.selectedModuleIds : ['mod_gestao_estoque', 'mod-core'],
    );
    setMgrCycle(prop.billingCycle);
    setMgrDiscount(0);
    setMgrFreeEmployeesQuota(10);
    setMgrPaymentTerms(
      `Pagamento via ${prop.preferredPaymentMethod.toUpperCase()} (${
        prop.estimatedEmployeesCount
      } funcionários previstos; 10 grátis na franquia)`,
    );
    setMgrClauses(DEFAULT_CONTRACT_TERMS_TEMPLATE);
    const updated = updateCommercialProposalStatus(prop.id, 'CONTRACT_GENERATED');
    setProposals(updated);
    navigate(`${baseRoute}/editor`);
    notify({
      type: 'success',
      title: `Proposta de ${prop.companyName} carregada no Gerenciador de Contratos!`,
      description: 'Revise a minuta A4 ao vivo e clique em Salvar Contrato.',
    });
  };

  const handleSaveContractFromManager = async (e: React.FormEvent) => {
    e.preventDefault();
    const actor = getActor(mgrCompanyId);
    const now = new Date().toISOString();

    if (editingContractId) {
      const existing = contracts.find((c) => c.id === editingContractId);
      if (existing) {
        const nextVer = existing.version + 1;
        await repositories.contracts.update(
          existing.id,
          (curr) => ({
            ...curr,
            code: mgrCode.trim(),
            companyId: mgrCompanyId,
            companyName: mgrCustomerName.trim(),
            planName: mgrPlanName.trim(),
            moduleIds: mgrModuleIds,
            startDate: mgrStartDate,
            endDate: mgrEndDate,
            billingCycle: mgrCycle,
            totalValue: mgrGrossTotal,
            discountValue: Number(mgrDiscount || 0),
            finalValue: mgrFinalValue,
            status: mgrStatus,
            commercialResponsible: mgrProviderRep.trim(),
            clausesText: mgrClauses,
            providerName: mgrProviderName.trim(),
            providerDocument: mgrProviderDoc.trim(),
            providerEmail: mgrProviderEmail.trim(),
            providerRepresentative: mgrProviderRep.trim(),
            customerDocument: mgrCustomerDoc.trim(),
            customerEmail: mgrCustomerEmail.trim(),
            customerPhone: mgrCustomerPhone.trim(),
            paymentTerms: mgrPaymentTerms.trim(),
            freeEmployeesQuota: mgrFreeEmployeesQuota,
            googleDriveWebLink: gdriveConfig.enabled ? gdriveConfig.webhookOrScriptUrl : undefined,
            googleDriveSyncedAt: gdriveConfig.enabled ? now : undefined,
            version: nextVer,
            versionHistory: [
              ...curr.versionHistory,
              {
                version: nextVer,
                createdAt: now,
                createdBy: actor.userName,
                summary: `Atualização no Gerenciador de Contratos A4 (v${nextVer}).`,
                totalValue: mgrFinalValue,
                moduleIds: mgrModuleIds,
              },
            ],
          }),
          actor,
          `Contrato ${mgrCode} atualizado no Gerenciador de Contratos (v${nextVer}).`,
        );
        await refreshData();
        notify({
          type: 'success',
          title: `Contrato ${mgrCode} (v${nextVer}) salvo e sincronizado!`,
        });
        navigate(baseRoute);
        return;
      }
    }

    const newId = generateId('ctr');
    const newRecord: ContractEntity = {
      ...livePreviewContract,
      id: newId,
      version: 1,
      googleDriveWebLink: gdriveConfig.enabled ? gdriveConfig.webhookOrScriptUrl : undefined,
      googleDriveSyncedAt: gdriveConfig.enabled ? now : undefined,
      versionHistory: [
        {
          version: 1,
          createdAt: now,
          createdBy: actor.userName,
          summary: 'Emissão pelo Gerenciador de Contratos A4.',
          totalValue: mgrFinalValue,
          moduleIds: mgrModuleIds,
        },
      ],
    };

    await repositories.contracts.create(
      newRecord,
      actor,
      `Emissão do contrato ${newRecord.code} para ${newRecord.companyName}.`,
    );
    await refreshData();
    setEditingContractId(newId);
    notify({
      type: 'success',
      title: `Novo contrato ${newRecord.code} salvo com sucesso!`,
      description: gdriveConfig.enabled
        ? `Sincronizado com pasta Google Drive "${gdriveConfig.folderName}".`
        : undefined,
    });
    navigate(baseRoute);
  };

  const handleQuickElectronicSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signModalContract || !acceptedTerms) return;
    const hash = `SHA256-OLIVELAS-${Math.random().toString(16).substring(2, 14)}${Date.now().toString(16)}`;
    const now = new Date().toISOString();
    const actor = getActor(signModalContract.companyId);

    await repositories.contracts.update(
      signModalContract.id,
      (curr) => ({
        ...curr,
        status: 'active',
        signatures: [
          ...curr.signatures,
          {
            id: generateId('sig'),
            signerName: signerName.trim(),
            signerEmail: signerEmail.trim(),
            signerDocument: signerDoc.trim(),
            signedAt: now,
            ipAddressSimulated: '177.92.40.18 (Assinatura Digital Auditada)',
            acceptanceHash: hash,
            isSimulated: true,
          },
        ],
      }),
      actor,
      `Assinatura eletrônica SHA-256 registrada no contrato ${signModalContract.code} por ${signerName.trim()}.`,
      'sign_contract',
    );
    await refreshData();
    setSignModalContract(null);
    notify({
      type: 'success',
      title: `Contrato ${signModalContract.code} assinado eletronicamente!`,
      description: `Carimbo SHA-256: ${hash.slice(0, 22)}...`,
    });
  };

  const handleRestore = async (ct: ContractEntity) => {
    await repositories.contracts.restore(ct.id, getActor(ct.companyId));
    await refreshData();
    notify({ type: 'success', title: `Contrato ${ct.code} restaurado.` });
  };

  const activeContractsCount = scopedContracts.filter(
    (c) => !c.archiveMetadata.isArchived && c.status === 'active',
  ).length;
  const pendingSigCount = scopedContracts.filter(
    (c) => !c.archiveMetadata.isArchived && c.status === 'pending_signature',
  ).length;
  const totalSignedValue = scopedContracts
    .filter((c) => !c.archiveMetadata.isArchived && c.status === 'active')
    .reduce((acc, c) => acc + c.finalValue, 0);

  const allSignatures = useMemo(
    () =>
      scopedContracts.flatMap((c) =>
        c.signatures.map((sig) => ({
          ...sig,
          contractId: c.id,
          contractCode: c.code,
          companyName: c.companyName,
          planName: c.planName,
          contractStatus: c.status,
          isArchived: c.archiveMetadata.isArchived,
        })),
      ),
    [scopedContracts],
  );

  return (
    <div className="flex flex-col gap-2.5">
      <PageHeader
        breadcrumbs={[
          {
            label: scope === 'global' ? t('scope.global') : company?.tradeName || 'Empresa',
            to: scope === 'global' ? '/app/global' : `/app/empresa/${empresaId}`,
          },
          { label: t('nav.contracts') },
        ]}
        title="Gestão de Contratos, Propostas Comerciais, Editor A4 & Assinatura Digital SHA-256"
        subtitle={`${activeContractsCount} vigentes • ${pendingSigCount} aguardando assinatura • ${proposals.length} propostas • Volume contratado: ${formatCurrency(totalSignedValue, 'BRL', session.language)}`}
        scopeBadge={scope === 'global' ? t('scope.global') : company?.tradeName}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {scope === 'global' && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setGdriveModalOpen(true)}
              >
                <Cloud size={14} />
                Google Drive ({gdriveConfig.enabled ? 'Ativo' : 'Off'})
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setEditingContractId(null);
                setMgrCode(`CTR-2026-000${contracts.length + 1}`);
                navigate(`${baseRoute}/editor`);
              }}
            >
              <FileCode size={14} />
              Estúdio &amp; Editor A4
            </button>
            {scope === 'global' && hasPermission('contracts', 'create') && (
              <Link to="/app/global/contratos/novo" className="btn btn-primary btn-sm">
                <Plus size={14} />
                Emitir Novo Contrato
              </Link>
            )}
          </div>
        }
      />

      {/* Navigation Tabs — identical pattern to /app/global/api-hub/ambientes */}
      <nav className="subnav-tabs" aria-label="Navegação de contratos">
        <NavLink
          to={baseRoute}
          end
          className={({ isActive }) =>
            `subnav-tab ${isActive || activeTab === 'contratos' ? 'active' : ''}`
          }
        >
          Contratos &amp; Assinaturas ({scopedContracts.length})
        </NavLink>
        {scope === 'global' && (
          <NavLink
            to={`${baseRoute}/propostas`}
            className={({ isActive }) =>
              `subnav-tab ${isActive || activeTab === 'propostas' ? 'active' : ''}`
            }
          >
            Propostas &amp; Solicitações ({proposals.length})
          </NavLink>
        )}
        <NavLink
          to={`${baseRoute}/assinaturas`}
          className={({ isActive }) =>
            `subnav-tab ${isActive || activeTab === 'assinaturas' ? 'active' : ''}`
          }
        >
          Certificados SHA-256 ({allSignatures.length})
        </NavLink>
        <NavLink
          to={`${baseRoute}/editor`}
          className={({ isActive }) =>
            `subnav-tab ${isActive || activeTab === 'editor' ? 'active' : ''}`
          }
        >
          Estúdio &amp; Minuta A4 ({scopedContracts.length})
        </NavLink>
      </nav>

      {/* TAB 1: CONTRACTS LIST TABLE */}
      {activeTab === 'contratos' && (
        <UrlDataTable<ContractEntity>
          tableId={`contracts-table-${scope}`}
          caption="Contratos comerciais, minutas A4 e assinaturas eletrônicas registradas"
          items={scopedContracts}
          defaultSortField="createdAt"
          csvFilename={`contratos-${scope}.csv`}
          searchPlaceholder="Buscar por código do contrato, empresa, plano ou responsável..."
          statusExtractor={(c) => c.status}
          searchExtractor={(c) =>
            `${c.code} ${c.companyName} ${c.planName} ${c.commercialResponsible}`
          }
          statusOptions={[
            { value: 'active', label: t('status.active') },
            { value: 'pending_signature', label: t('status.pending_signature') },
            { value: 'draft', label: t('status.draft') },
            { value: 'suspended', label: t('status.suspended') },
            { value: 'archived', label: t('status.archived') },
          ]}
          isArchivedExtractor={(c) => c.archiveMetadata.isArchived}
          columns={[
            {
              key: 'code',
              header: 'Contrato & Versão',
              sortable: true,
              width: '20%',
              csvValue: (c) => `${c.code} (v${c.version})`,
              render: (c) => (
                <div>
                  <Link
                    to={`${baseRoute}/${c.id}/editar`}
                    className="font-semibold mono text-left"
                    style={{ color: 'var(--brand-primary)' }}
                  >
                    {c.code}
                  </Link>
                  <div className="text-xs text-muted">
                    Versão v{c.version} • {c.signatures.length} assinatura(s)
                  </div>
                </div>
              ),
            },
            {
              key: 'companyName',
              header: 'Empresa Contratante & Plano',
              sortable: true,
              width: '28%',
              render: (c) => (
                <div>
                  <div className="font-semibold">{c.companyName}</div>
                  <div className="text-xs text-muted">
                    {c.planName} ({c.moduleIds.length} módulos • {c.freeEmployeesQuota ?? 10}{' '}
                    funcionários grátis)
                  </div>
                </div>
              ),
            },
            {
              key: 'startDate',
              header: 'Vigência & Ciclo',
              width: '20%',
              render: (c) => (
                <div className="text-xs tabular">
                  <div>
                    {c.startDate} → {c.endDate}
                  </div>
                  <span className="text-muted">
                    Ciclo: {c.billingCycle === 'yearly' ? 'Anual' : 'Mensal'}
                  </span>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Estado & Assinatura',
              sortable: true,
              width: '14%',
              render: (c) => (
                <div className="flex flex-col gap-1">
                  <StatusBadge status={c.status} />
                  {c.signatures.length > 0 ? (
                    <span className="badge badge-teal">SHA-256 Assinado</span>
                  ) : (
                    <span className="badge badge-warning">Pendente Aceite</span>
                  )}
                </div>
              ),
            },
            {
              key: 'finalValue',
              header: 'Valor Líquido',
              sortable: true,
              isNumeric: true,
              width: '11%',
              csvValue: (c) => c.finalValue,
              render: (c) => (
                <span className="font-semibold tabular">
                  {formatCurrency(c.finalValue, c.currency, session.language)}
                </span>
              ),
            },
            {
              key: 'actions',
              header: 'Ações',
              isNumeric: true,
              width: '8%',
              render: (c) => (
                <ActionDropdownMenu
                  label="Ações"
                  items={[
                    {
                      id: 'edit-page',
                      label: 'Editar Contrato & Minuta A4 (ID Único)',
                      icon: <Edit3 size={14} />,
                      variant: 'primary',
                      onClick: () => navigate(`${baseRoute}/${c.id}/editar`),
                    },
                    {
                      id: 'full-page',
                      label: 'Ficha & Assinatura Digital (SHA-256)',
                      icon: <FileSignature size={14} />,
                      onClick: () => navigate(`${baseRoute}/${c.id}`),
                    },
                    {
                      id: 'open-manager',
                      label: 'Abrir no Estúdio A4 Ao Vivo',
                      icon: <FileCode size={14} />,
                      onClick: () => loadContractIntoManager(c),
                    },
                    {
                      id: 'export-pdf',
                      label: 'Imprimir / Salvar em PDF (Folha A4)',
                      icon: <Printer size={14} />,
                      onClick: () => exportContractAsPDF(c, modules),
                    },
                    {
                      id: 'export-docx',
                      label: 'Baixar em Word (.DOCX)',
                      icon: <Download size={14} />,
                      onClick: () => exportContractAsDOCX(c, modules),
                    },
                    {
                      id: 'export-html',
                      label: 'Baixar em HTML',
                      icon: <FileText size={14} />,
                      onClick: () => exportContractAsHTML(c, modules),
                    },
                    ...(hasPermission('contracts', 'archive', targetCompanyId)
                      ? [
                          c.archiveMetadata.isArchived
                            ? {
                                id: 'restore',
                                label: 'Restaurar Contrato',
                                icon: <RotateCcw size={14} />,
                                onClick: () => handleRestore(c),
                              }
                            : {
                                id: 'archive',
                                label: 'Arquivar Contrato',
                                icon: <Archive size={14} />,
                                variant: 'danger' as const,
                                onClick: () => setArchiveTarget(c),
                              },
                        ]
                      : []),
                  ]}
                />
              ),
            },
          ]}
        />
      )}

      {/* TAB 2: COMMERCIAL PLAN PROPOSALS / REQUESTS */}
      {activeTab === 'propostas' && (
        <UrlDataTable<CommercialPlanProposal>
          tableId="commercial-proposals-table"
          caption="Solicitações de planos e propostas comerciais registradas para conversão em contrato"
          items={proposals}
          defaultSortField="createdAt"
          csvFilename="propostas-comerciais-allin.csv"
          searchPlaceholder="Buscar por empresa, responsável, CNPJ/CPF, e-mail ou plano..."
          statusExtractor={(p) => p.status}
          searchExtractor={(p) =>
            `${p.companyName} ${p.customerName} ${p.customerDocument} ${p.customerEmail} ${p.selectedPlanName}`
          }
          statusOptions={[
            { value: 'NEW', label: 'Nova Solicitação' },
            { value: 'CONTACTED', label: 'Em Negociação' },
            { value: 'CONTRACT_GENERATED', label: 'Minuta Gerada' },
            { value: 'SIGNED', label: 'Contrato Assinado' },
            { value: 'ARCHIVED', label: 'Arquivada' },
          ]}
          isArchivedExtractor={(p) => p.status === 'ARCHIVED'}
          columns={[
            {
              key: 'companyName',
              header: 'Empresa / Solicitante',
              sortable: true,
              width: '28%',
              render: (prop) => (
                <div>
                  <div className="font-semibold text-sm">{prop.companyName}</div>
                  <div className="text-xs text-muted">
                    Resp.: {prop.customerName} ({prop.customerDocument})
                  </div>
                  <div className="mono text-xs text-muted">{prop.customerEmail}</div>
                </div>
              ),
            },
            {
              key: 'selectedPlanName',
              header: 'Plano & Módulos Desejados',
              sortable: true,
              width: '26%',
              render: (prop) => (
                <div>
                  <div className="font-semibold text-xs">{prop.selectedPlanName}</div>
                  <div className="text-xs text-muted">
                    {prop.selectedModuleIds.length} módulos • Ciclo{' '}
                    {prop.billingCycle === 'yearly' ? 'Anual' : 'Mensal'}
                  </div>
                </div>
              ),
            },
            {
              key: 'estimatedMonthlyValue',
              header: 'Equipe Prevista & Valor',
              sortable: true,
              width: '20%',
              render: (prop) => (
                <div>
                  <div className="font-semibold tabular text-xs">
                    {formatCurrency(prop.estimatedMonthlyValue, 'BRL', session.language)}/mês
                  </div>
                  <div className="text-xs text-muted">
                    {prop.estimatedEmployeesCount} funcionários (
                    {Math.max(0, prop.estimatedEmployeesCount - 10)} extra)
                  </div>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Status Comercial',
              width: '18%',
              render: (prop) => (
                <select
                  className="select"
                  value={prop.status}
                  onChange={(e) => {
                    const next = updateCommercialProposalStatus(
                      prop.id,
                      e.target.value as CommercialPlanProposal['status'],
                    );
                    setProposals(next);
                  }}
                >
                  <option value="NEW">Nova Solicitação</option>
                  <option value="CONTACTED">Em Negociação</option>
                  <option value="CONTRACT_GENERATED">Minuta Gerada</option>
                  <option value="SIGNED">Contrato Assinado</option>
                  <option value="ARCHIVED">Arquivada</option>
                </select>
              ),
            },
            {
              key: 'actions',
              header: 'Ações',
              width: '8%',
              render: (prop) => (
                <ActionDropdownMenu
                  label="Ações"
                  items={[
                    {
                      id: 'generate-contract',
                      label: 'Gerar Minuta A4 & Contrato',
                      icon: <FileCode size={14} />,
                      variant: 'primary',
                      onClick: () => handleGenerateContractFromProposal(prop),
                    },
                    {
                      id: 'whatsapp',
                      label: 'Contatar via WhatsApp',
                      icon: <MessageCircle size={14} />,
                      onClick: () =>
                        window.open(
                          `https://wa.me/${prop.customerPhone.replace(/\D/g, '')}`,
                          '_blank',
                          'noopener,noreferrer',
                        ),
                    },
                    {
                      id: 'delete-proposal',
                      label: 'Remover Solicitação',
                      icon: <Trash2 size={14} />,
                      variant: 'danger',
                      onClick: () => setProposals(deleteCommercialProposal(prop.id)),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      )}

      {/* TAB 3: DIGITAL SIGNATURES & SHA-256 CERTIFICATES */}
      {activeTab === 'assinaturas' && (
        <UrlDataTable<(typeof allSignatures)[number]>
          tableId={`contract-signatures-table-${scope}`}
          caption="Certificados digitais e carimbos criptográficos SHA-256 de aceite contratual"
          items={allSignatures}
          defaultSortField="signedAt"
          csvFilename={`assinaturas-sha256-${scope}.csv`}
          searchPlaceholder="Buscar por signatário, e-mail, documento, código do contrato ou hash SHA-256..."
          statusExtractor={(s) => s.contractStatus}
          searchExtractor={(s) =>
            `${s.signerName} ${s.signerEmail} ${s.signerDocument} ${s.contractCode} ${s.companyName} ${s.acceptanceHash}`
          }
          statusOptions={[
            { value: 'active', label: t('status.active') },
            { value: 'pending_signature', label: t('status.pending_signature') },
            { value: 'suspended', label: t('status.suspended') },
          ]}
          isArchivedExtractor={(s) => s.isArchived}
          columns={[
            {
              key: 'contractCode',
              header: 'Contrato & Empresa',
              sortable: true,
              width: '24%',
              render: (s) => (
                <div>
                  <Link
                    to={`${baseRoute}/${s.contractId}`}
                    className="font-semibold mono text-left"
                    style={{ color: 'var(--brand-primary)' }}
                  >
                    {s.contractCode}
                  </Link>
                  <div className="text-xs text-muted">{s.companyName}</div>
                </div>
              ),
            },
            {
              key: 'signerName',
              header: 'Signatário & Documento',
              sortable: true,
              width: '24%',
              render: (s) => (
                <div>
                  <div className="font-semibold text-sm">{s.signerName}</div>
                  <div className="mono text-xs text-muted">
                    {s.signerEmail} • {s.signerDocument}
                  </div>
                </div>
              ),
            },
            {
              key: 'acceptanceHash',
              header: 'Hash Criptográfico SHA-256 & IP',
              width: '30%',
              render: (s) => (
                <div>
                  <code className="text-xs font-semibold" style={{ color: 'var(--brand-primary)' }}>
                    {s.acceptanceHash}
                  </code>
                  <div className="text-xs text-muted">{s.ipAddressSimulated}</div>
                </div>
              ),
            },
            {
              key: 'signedAt',
              header: 'Data / Hora do Aceite',
              sortable: true,
              width: '14%',
              render: (s) => (
                <span className="mono text-xs tabular">
                  {formatDateTime(s.signedAt, session.language)}
                </span>
              ),
            },
            {
              key: 'actions',
              header: 'Ações',
              width: '8%',
              render: (s) => (
                <ActionDropdownMenu
                  label="Ações"
                  items={[
                    {
                      id: 'view-cert',
                      label: 'Abrir Contrato & Certificado SHA-256',
                      icon: <FileSignature size={14} />,
                      variant: 'primary',
                      onClick: () => navigate(`${baseRoute}/${s.contractId}`),
                    },
                    {
                      id: 'edit-contract',
                      label: 'Editar Contrato (ID Único)',
                      icon: <Edit3 size={14} />,
                      onClick: () => navigate(`${baseRoute}/${s.contractId}/editar`),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      )}

      {/* TAB 4: LIVE CONTRACT MANAGER & A4 EDITOR */}
      {activeTab === 'editor' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
            gap: '1.25rem',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Contract Editor Form */}
          <form onSubmit={handleSaveContractFromManager} className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">
                  {editingContractId
                    ? `Editando Contrato ${mgrCode}`
                    : 'Gerenciador & Editor de Contratos'}
                </h2>
                <p className="card-subtitle">
                  Preencha os dados das partes, módulos e cláusulas com preview A4 ao vivo.
                </p>
              </div>
              <button type="submit" className="btn btn-primary btn-sm">
                <Save size={14} /> Salvar Contrato
              </button>
            </div>
            <div className="card-body flex flex-col gap-4">
              <div className="form-grid">
                <div className="field">
                  <label>Número do Contrato *</label>
                  <input
                    className="input mono"
                    required
                    value={mgrCode}
                    onChange={(e) => setMgrCode(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Vincular a Empresa Cadastrada</label>
                  <select
                    className="select"
                    value={mgrCompanyId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setMgrCompanyId(cid);
                      const found = companies.find((c) => c.id === cid);
                      if (found) {
                        setMgrCustomerName(found.legalName);
                        setMgrCustomerDoc(found.taxId || '18.492.310/0001-54');
                        setMgrCustomerEmail(found.contacts[0]?.email || 'contato@empresa.com.br');
                        setMgrCustomerPhone(found.contacts[0]?.phone || '+55 (11) 99999-0000');
                        setMgrFreeEmployeesQuota(found.freeEmployeesLimit ?? 10);
                      }
                    }}
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.isBranch ? '[FILIAL] ' : '[MATRIZ] '}
                        {c.tradeName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Contratada (Meu Nome / Razão Social) *</label>
                  <input
                    className="input"
                    required
                    value={mgrProviderName}
                    onChange={(e) => setMgrProviderName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Representante da Contratada *</label>
                  <input
                    className="input"
                    required
                    value={mgrProviderRep}
                    onChange={(e) => setMgrProviderRep(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Contratante (Cliente / Razão Social) *</label>
                  <input
                    className="input"
                    required
                    value={mgrCustomerName}
                    onChange={(e) => setMgrCustomerName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>CNPJ / CPF do Cliente *</label>
                  <input
                    className="input mono"
                    required
                    value={mgrCustomerDoc}
                    onChange={(e) => setMgrCustomerDoc(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>E-mail do Cliente *</label>
                  <input
                    type="email"
                    className="input"
                    required
                    value={mgrCustomerEmail}
                    onChange={(e) => setMgrCustomerEmail(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Telefone / WhatsApp do Cliente *</label>
                  <input
                    className="input"
                    required
                    value={mgrCustomerPhone}
                    onChange={(e) => setMgrCustomerPhone(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Plano / Produto Principal *</label>
                  <input
                    className="input"
                    required
                    value={mgrPlanName}
                    onChange={(e) => setMgrPlanName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Ciclo de Faturamento</label>
                  <select
                    className="select"
                    value={mgrCycle}
                    onChange={(e) => setMgrCycle(e.target.value as 'monthly' | 'yearly')}
                  >
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div className="field">
                  <label>Franquia de Funcionários Grátis</label>
                  <input
                    type="number"
                    min={0}
                    className="input tabular"
                    value={mgrFreeEmployeesQuota}
                    onChange={(e) => setMgrFreeEmployeesQuota(Number(e.target.value))}
                  />
                </div>
                <div className="field">
                  <label>Desconto Comercial (R$)</label>
                  <input
                    type="number"
                    min={0}
                    className="input tabular"
                    value={mgrDiscount}
                    onChange={(e) => setMgrDiscount(Number(e.target.value))}
                  />
                </div>
                <div className="field">
                  <label>Início de Vigência</label>
                  <input
                    type="date"
                    className="input tabular"
                    value={mgrStartDate}
                    onChange={(e) => setMgrStartDate(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Fim de Vigência</label>
                  <input
                    type="date"
                    className="input tabular"
                    value={mgrEndDate}
                    onChange={(e) => setMgrEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label>Forma e Condições de Pagamento</label>
                <input
                  className="input"
                  value={mgrPaymentTerms}
                  onChange={(e) => setMgrPaymentTerms(e.target.value)}
                />
              </div>

              {/* Dynamic Variable Chips */}
              <div>
                <div className="text-xs font-semibold text-muted mb-1">
                  VARIÁVEIS DINÂMICAS DO TEMPLATE (CLIQUE PARA INSERIR NAS CLÁUSULAS):
                </div>
                <div className="flex flex-wrap gap-1">
                  {CONTRACT_TEMPLATE_VARIABLES.map((v) => (
                    <button
                      key={v.token}
                      type="button"
                      className="badge badge-info mono"
                      style={{ cursor: 'pointer', border: 'none' }}
                      title={v.label}
                      onClick={() => setMgrClauses((prev) => `${prev}\n${v.token}`)}
                    >
                      {v.token}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <div className="flex items-center justify-between mb-1">
                  <label>Minuta Contratual & Cláusulas</label>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setMgrClauses(DEFAULT_CONTRACT_TERMS_TEMPLATE)}
                  >
                    Restaurar Modelo Oficial
                  </button>
                </div>
                <textarea
                  className="textarea mono text-xs"
                  style={{ minHeight: '220px' }}
                  value={mgrClauses}
                  onChange={(e) => setMgrClauses(e.target.value)}
                />
              </div>
            </div>
          </form>

          {/* Right Column: Live A4 Sheet Preview + Export Actions */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Preview em Tempo Real — Folha A4</h2>
                <p className="card-subtitle">
                  Valor Líquido Calculado:{' '}
                  <strong>{formatCurrency(mgrFinalValue, 'BRL', session.language)}</strong>
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => exportContractAsHTML(livePreviewContract, modules)}
                >
                  <FileText size={13} /> HTML
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => exportContractAsDOCX(livePreviewContract, modules)}
                >
                  <Download size={13} /> Word (.DOC)
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => exportContractAsPDF(livePreviewContract, modules)}
                >
                  <Printer size={13} /> Imprimir / PDF
                </button>
              </div>
            </div>
            <div
              className="card-body"
              style={{
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                margin: '1rem',
                padding: '1.5rem',
                maxHeight: '720px',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  borderBottom: '2px solid #1e3a8a',
                  paddingBottom: '12px',
                  marginBottom: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                    CONTRATO DE LICENCIAMENTO SaaS &amp; PRESTAÇÃO DE SERVIÇOS
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                    Contratada: {mgrProviderName} • Representante: {mgrProviderRep}
                  </div>
                </div>
                <span className="badge badge-info mono">{mgrCode}</span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  marginBottom: '14px',
                  fontSize: '0.78rem',
                }}
              >
                <div
                  style={{
                    padding: '10px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                  }}
                >
                  <strong>CONTRATADA:</strong> {mgrProviderName}
                  <br />
                  <span>CNPJ: {mgrProviderDoc}</span>
                  <br />
                  <span>E-mail: {mgrProviderEmail}</span>
                </div>
                <div
                  style={{
                    padding: '10px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                  }}
                >
                  <strong>CONTRATANTE:</strong> {mgrCustomerName}
                  <br />
                  <span>Doc: {mgrCustomerDoc}</span>
                  <br />
                  <span>
                    Contato: {mgrCustomerEmail} • {mgrCustomerPhone}
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: '10px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '6px',
                  marginBottom: '14px',
                  fontSize: '0.8rem',
                }}
              >
                <strong>Plano:</strong> {mgrPlanName} ({mgrCycle === 'yearly' ? 'Anual' : 'Mensal'})
                • <strong>Franquia Equipe:</strong> {mgrFreeEmployeesQuota} funcionários grátis •{' '}
                <strong>Valor Líquido:</strong>{' '}
                {formatCurrency(mgrFinalValue, 'BRL', session.language)}
              </div>

              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.8rem',
                  lineHeight: 1.6,
                  color: '#1e293b',
                }}
              >
                {interpolateContractTerms(mgrClauses, livePreviewContract, modules)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: A4 CONTRACT PREVIEW & SIGNATURES */}
      <ModalDialog
        open={Boolean(previewModalContract)}
        onClose={() => setPreviewModalContract(null)}
        title={
          previewModalContract
            ? `Minuta Contratual ${previewModalContract.code} (v${previewModalContract.version}) — ${previewModalContract.companyName}`
            : 'Minuta do Contrato'
        }
        description={
          previewModalContract
            ? `Plano: ${previewModalContract.planName} • Valor Líquido: ${formatCurrency(
                previewModalContract.finalValue,
                previewModalContract.currency,
                session.language,
              )}`
            : ''
        }
        maxWidth="880px"
      >
        {previewModalContract && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <StatusBadge status={previewModalContract.status} />
                <span className="badge badge-teal">
                  Franquia: {previewModalContract.freeEmployeesQuota ?? 10} funcionários grátis
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const target = previewModalContract;
                    setPreviewModalContract(null);
                    loadContractIntoManager(target);
                  }}
                >
                  <Edit3 size={13} /> Editar no Gerenciador A4
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => exportContractAsDOCX(previewModalContract, modules)}
                >
                  <Download size={13} /> Word (.DOC)
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => exportContractAsPDF(previewModalContract, modules)}
                >
                  <Printer size={13} /> Imprimir / Salvar PDF
                </button>
              </div>
            </div>

            <div
              style={{
                padding: '1.25rem',
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                maxHeight: '420px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                fontSize: '0.82rem',
                lineHeight: 1.65,
              }}
            >
              {interpolateContractTerms(
                previewModalContract.clausesText || DEFAULT_CONTRACT_TERMS_TEMPLATE,
                previewModalContract,
                modules,
              )}
            </div>

            <div className="card" style={{ padding: '0.9rem' }}>
              <div className="flex items-center justify-between mb-2">
                <strong className="text-xs uppercase">
                  Assinaturas Eletrônicas SHA-256 ({previewModalContract.signatures.length})
                </strong>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    const target = previewModalContract;
                    setPreviewModalContract(null);
                    setSignModalContract(target);
                  }}
                >
                  <FileSignature size={13} /> Assinar Eletronicamente
                </button>
              </div>
              {previewModalContract.signatures.length === 0 ? (
                <div className="text-xs text-muted">
                  Nenhuma assinatura registrada ainda. Clique em "Assinar Eletronicamente" para
                  registrar o aceite com hash SHA-256.
                </div>
              ) : (
                previewModalContract.signatures.map((sig) => (
                  <div key={sig.id} className="text-xs flex flex-col gap-0.5">
                    <strong>
                      {sig.signerName} ({sig.signerDocument}) — {sig.signerEmail}
                    </strong>
                    <span className="text-muted">
                      Assinado em {formatDateTime(sig.signedAt, session.language)} • Hash:{' '}
                      <code>{sig.acceptanceHash}</code>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </ModalDialog>

      {/* MODAL 2: ELECTRONIC SIGNATURE SHA-256 */}
      <ModalDialog
        open={Boolean(signModalContract)}
        onClose={() => setSignModalContract(null)}
        title={`Assinatura Eletrônica SHA-256 — ${signModalContract?.code || ''}`}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSignModalContract(null)}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              form="quick-sign-contract-form"
              className="btn btn-primary"
              disabled={!acceptedTerms}
            >
              <FileSignature size={14} /> Confirmar Assinatura Eletrônica
            </button>
          </>
        }
      >
        <form
          id="quick-sign-contract-form"
          onSubmit={handleQuickElectronicSign}
          className="flex flex-col gap-3"
        >
          <div className="field">
            <label>Nome Completo do Signatário *</label>
            <input
              className="input"
              required
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
            />
          </div>
          <div className="field">
            <label>E-mail Corporativo *</label>
            <input
              type="email"
              className="input mono"
              required
              value={signerEmail}
              onChange={(e) => setSignerEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Documento (CPF / CNPJ) *</label>
            <input
              className="input mono"
              required
              value={signerDoc}
              onChange={(e) => setSignerDoc(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-xs mt-1" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            <span>
              Confirmo o aceite integral das cláusulas contratuais e geração do hash SHA-256.
            </span>
          </label>
        </form>
      </ModalDialog>

      {/* MODAL 3: GOOGLE DRIVE SYNC CONFIGURATION */}
      <ModalDialog
        open={gdriveModalOpen}
        onClose={() => setGdriveModalOpen(false)}
        title="Integração Google Drive — Repositório de Contratos"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setGdriveModalOpen(false)}
            >
              Fechar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const saved = saveGoogleDriveConfig({
                  enabled: gdriveConfig.enabled,
                  folderId: gdriveConfig.folderId,
                  folderName: gdriveConfig.folderName,
                  webhookOrScriptUrl: gdriveConfig.webhookOrScriptUrl,
                  autoSyncOnSave: gdriveConfig.autoSyncOnSave,
                });
                setGdriveConfig(saved);
                setGdriveModalOpen(false);
                notify({
                  type: 'success',
                  title: 'Configuração do Google Drive salva com sucesso!',
                });
              }}
            >
              <Save size={14} /> Salvar Integração
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="field">
            <label>Nome da Pasta Corporativa no Google Drive</label>
            <input
              className="input"
              value={gdriveConfig.folderName}
              onChange={(e) =>
                setGdriveConfig({ ...gdriveConfig, folderName: e.target.value })
              }
            />
          </div>
          <div className="field">
            <label>ID da Pasta / Link do Repositório</label>
            <input
              className="input mono"
              value={gdriveConfig.webhookOrScriptUrl}
              onChange={(e) =>
                setGdriveConfig({ ...gdriveConfig, webhookOrScriptUrl: e.target.value })
              }
            />
          </div>
        </div>
      </ModalDialog>

      <ArchiveRecordDialog
        open={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        recordTitle={archiveTarget ? `${archiveTarget.code} (${archiveTarget.companyName})` : ''}
        onConfirmArchive={async (reason) => {
          if (!archiveTarget) return;
          await repositories.contracts.archive(
            archiveTarget.id,
            reason,
            getActor(archiveTarget.companyId),
          );
          await refreshData();
          notify({ type: 'warning', title: `Contrato ${archiveTarget.code} arquivado.` });
        }}
      />
    </div>
  );
};

export const ContractFormPage: React.FC<{ mode: 'create' | 'edit'; scope?: 'global' | 'company' }> = ({
  mode,
  scope = 'global',
}) => {
  const { contratoId, empresaId } = useParams<{ contratoId: string; empresaId?: string }>();
  const { contracts, companies, modules, session, hasPermission, getActor, refreshData, notify, t } =
    useApp();
  const navigate = useNavigate();

  const existing = mode === 'edit' ? contracts.find((c) => c.id === contratoId) : undefined;
  const baseRoute = scope === 'global' ? '/app/global/contratos' : `/app/empresa/${empresaId}/contratos`;

  const [companyId, setCompanyId] = useState(
    existing?.companyId || empresaId || companies[0]?.id || 'emp-olivelas-matriz',
  );
  const [planName, setPlanName] = useState(existing?.planName || 'Allin Modular Corporativo');
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>(
    existing?.moduleIds || ['mod-core', 'mod-financeiro'],
  );
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(
    existing?.billingCycle || 'monthly',
  );
  const [startDate, setStartDate] = useState(existing?.startDate || '2026-10-28');
  const [endDate, setEndDate] = useState(existing?.endDate || '2027-10-28');
  const [discountValue, setDiscountValue] = useState(existing?.discountValue || 0);
  const [freeEmployeesQuota, setFreeEmployeesQuota] = useState(existing?.freeEmployeesQuota ?? 10);
  const [status, setStatus] = useState<ContractStatus>(
    existing?.status || 'pending_signature',
  );
  const [commercialResponsible, setCommercialResponsible] = useState(
    existing?.commercialResponsible || 'Diego Vasconcelos',
  );
  const [clausesText, setClausesText] = useState(
    existing?.clausesText ||
      DEFAULT_CONTRACT_TERMS_TEMPLATE ||
      'CLÁUSULA 1 — OBJETO: Licenciamento modular SaaS na plataforma Olivelas Allin.\nCLÁUSULA 2 — ISOLAMENTO E AUDITORIA: Dados isolados por empresa e retenção integral sem exclusão física.',
  );
  const [versionSummary, setVersionSummary] = useState('Revisão contratual e ajuste de módulos.');
  const [isDirty, setIsDirty] = useState(false);

  if (!hasPermission('contracts', mode === 'create' ? 'create' : 'edit', empresaId)) {
    return (
      <AccessDeniedView
        reason="Sem permissão para emitir ou editar contratos."
        requiredPermission={`contracts:${mode}`}
      />
    );
  }

  const totalValue = modules
    .filter((m) => selectedModuleIds.includes(m.id))
    .reduce((acc, m) => acc + (billingCycle === 'monthly' ? m.priceMonthly : m.priceYearly), 0);
  const finalValue = Math.max(0, totalValue - Number(discountValue));
  const selectedComp = companies.find((c) => c.id === companyId);

  const baseDraftEntity: ContractEntity = {
    id: existing?.id || 'ctr-preview',
    code: existing?.code || 'CTR-2026-NOVO',
    companyId,
    companyName: selectedComp?.legalName || companyId,
    planName,
    moduleIds: selectedModuleIds,
    startDate,
    endDate,
    billingCycle,
    totalValue,
    discountValue: Number(discountValue),
    finalValue,
    freeEmployeesQuota,
    currency: selectedComp?.currency || 'BRL',
    status,
    commercialResponsible,
    clausesText,
    version: existing ? existing.version + 1 : 1,
    versionHistory: existing?.versionHistory || [],
    signatures: existing?.signatures || [],
    attachments: existing?.attachments || [],
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archiveMetadata: { isArchived: false },
    changeHistory: [],
  };

  const previewContractEntity: ContractEntity = {
    ...baseDraftEntity,
    clausesText: interpolateContractTerms(clausesText, baseDraftEntity, modules),
  };

  const toggleMod = (mid: string) => {
    if (mid === 'mod-core') return;
    setSelectedModuleIds((prev) =>
      prev.includes(mid) ? prev.filter((i) => i !== mid) : [...prev, mid],
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const comp = companies.find((c) => c.id === companyId);
    const actor = getActor(companyId);

    if (mode === 'create') {
      const newId = generateId('ctr');
      const code = `CTR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const record: ContractEntity = {
        id: newId,
        code,
        companyId,
        companyName: comp?.legalName || companyId,
        planName: planName.trim(),
        moduleIds: selectedModuleIds,
        startDate,
        endDate,
        billingCycle,
        totalValue,
        discountValue: Number(discountValue),
        finalValue,
        freeEmployeesQuota,
        currency: comp?.currency || 'BRL',
        status,
        commercialResponsible: commercialResponsible.trim(),
        clausesText: previewContractEntity.clausesText,
        version: 1,
        versionHistory: [
          {
            version: 1,
            createdAt: new Date().toISOString(),
            createdBy: actor.userName,
            summary: 'Emissão inicial do contrato.',
            totalValue: finalValue,
            moduleIds: selectedModuleIds,
          },
        ],
        signatures: [],
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        archiveMetadata: { isArchived: false },
        changeHistory: [],
      };
      await repositories.contracts.create(
        record,
        actor,
        `Emissão do contrato ${code} para ${record.companyName}.`,
      );
      await refreshData();
      notify({ type: 'success', title: `Contrato ${code} emitido com sucesso.` });
      navigate(`${baseRoute}/${newId}`);
    } else if (existing) {
      const nextVersion = existing.version + 1;
      await repositories.contracts.update(
        existing.id,
        (curr) => ({
          ...curr,
          planName: planName.trim(),
          moduleIds: selectedModuleIds,
          startDate,
          endDate,
          billingCycle,
          totalValue,
          discountValue: Number(discountValue),
          finalValue,
          freeEmployeesQuota,
          status,
          commercialResponsible: commercialResponsible.trim(),
          clausesText: previewContractEntity.clausesText,
          version: nextVersion,
          versionHistory: [
            ...curr.versionHistory,
            {
              version: nextVersion,
              createdAt: new Date().toISOString(),
              createdBy: actor.userName,
              summary: versionSummary.trim() || `Nova versão v${nextVersion}`,
              totalValue: finalValue,
              moduleIds: selectedModuleIds,
            },
          ],
        }),
        actor,
        `Geração da versão v${nextVersion} do contrato ${existing.code}: ${versionSummary.trim()}`,
      );
      await refreshData();
      notify({ type: 'success', title: `Versão v${nextVersion} gravada com sucesso.` });
      navigate(`${baseRoute}/${existing.id}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: scope === 'global' ? t('scope.global') : t('scope.company'), to: baseRoute },
          { label: t('nav.contracts'), to: baseRoute },
          { label: mode === 'create' ? 'Novo Contrato' : `Editar ${existing?.code}` },
        ]}
        title={
          mode === 'create'
            ? 'Emitir Novo Contrato Modular & Minuta A4'
            : `Editar Contrato & Minuta A4 — ${existing?.code} (ID: ${existing?.id} • v${existing?.version})`
        }
        subtitle="Edição dedicada com ID único, interpolação de variáveis e visualização de folha A4 ao vivo (HTML, DOCX e PDF)."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => exportContractAsHTML(previewContractEntity, modules)}
            >
              <FileText size={14} /> Baixar HTML
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => exportContractAsDOCX(previewContractEntity, modules)}
            >
              <Download size={14} /> Baixar DOCX
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => exportContractAsPDF(previewContractEntity, modules)}
            >
              <Printer size={14} /> Imprimir / PDF A4
            </button>
            <Link to={baseRoute} className="btn btn-secondary btn-sm">
              {t('common.back')}
            </Link>
          </div>
        }
      />

      <UnsavedChangesBanner isDirty={isDirty} onDiscard={() => navigate(baseRoute)} />

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <form onSubmit={handleSave} onChange={() => setIsDirty(true)} className="flex flex-col gap-4">
          <div className="form-section" style={{ marginBottom: 0 }}>
            <div className="form-section-title">1. Partes, Vigência e Condições Comerciais</div>
            <div className="form-grid mt-2">
              <div className="field">
                <label htmlFor="ctr-comp">Empresa Contratante *</label>
                <select
                  id="ctr-comp"
                  className="select"
                  disabled={mode === 'edit' || scope === 'company'}
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.tradeName} — {c.legalName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="ctr-plan">Nome do Plano / Pacote *</label>
                <input
                  id="ctr-plan"
                  className="input"
                  required
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="ctr-resp">Responsável Comercial *</label>
                <input
                  id="ctr-resp"
                  className="input"
                  required
                  value={commercialResponsible}
                  onChange={(e) => setCommercialResponsible(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="ctr-cycle">Periodicidade</label>
                <select
                  id="ctr-cycle"
                  className="select"
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value as 'monthly' | 'yearly')}
                >
                  <option value="monthly">Mensal</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="ctr-start">Início da Vigência</label>
                <input
                  id="ctr-start"
                  type="date"
                  className="input tabular"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="ctr-end">Fim da Vigência</label>
                <input
                  id="ctr-end"
                  type="date"
                  className="input tabular"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="ctr-disc">Desconto Comercial (BRL)</label>
                <input
                  id="ctr-disc"
                  type="number"
                  min={0}
                  className="input tabular"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                />
              </div>
              <div className="field">
                <label htmlFor="ctr-quota">Cota Grátis de Funcionários</label>
                <input
                  id="ctr-quota"
                  type="number"
                  min={1}
                  className="input tabular"
                  value={freeEmployeesQuota}
                  onChange={(e) => setFreeEmployeesQuota(Number(e.target.value))}
                />
              </div>
              <div className="field">
                <label htmlFor="ctr-status">Estado do Contrato</label>
                <select
                  id="ctr-status"
                  className="select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ContractStatus)}
                >
                  <option value="draft">Rascunho</option>
                  <option value="pending_signature">Aguardando Assinatura</option>
                  <option value="active">Ativo / Vigente</option>
                  <option value="suspended">Suspenso</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section" style={{ marginBottom: 0 }}>
            <div className="form-section-title">2. Módulos Incluídos no Contrato</div>
            <div className="form-grid mt-2">
              {modules.slice(0, 12).map((m) => {
                const checked = selectedModuleIds.includes(m.id);
                return (
                  <label
                    key={m.id}
                    style={{
                      border: checked
                        ? '1px solid var(--accent-primary)'
                        : '1px solid var(--border-subtle)',
                      padding: '0.55rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      cursor: m.isCore ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span className="text-xs">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={m.isCore}
                        onChange={() => toggleMod(m.id)}
                        style={{ marginRight: 6 }}
                      />
                      <strong>{m.name[session.language]}</strong>
                    </span>
                    <span className="text-xs tabular">
                      {formatCurrency(
                        billingCycle === 'monthly' ? m.priceMonthly : m.priceYearly,
                        m.currency,
                        session.language,
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="mt-4 text-sm">
              Valor Bruto: <strong>{formatCurrency(totalValue, 'BRL', session.language)}</strong> •
              Desconto: <strong>{formatCurrency(discountValue, 'BRL', session.language)}</strong> •
              Valor Final Acordado:{' '}
              <strong style={{ color: 'var(--accent-primary)' }}>
                {formatCurrency(finalValue, 'BRL', session.language)}
              </strong>
            </div>
          </div>

          <div className="form-section" style={{ marginBottom: 0 }}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="form-section-title">3. Cláusulas Contratuais e Variáveis de Minuta A4</div>
              <div className="flex gap-1 flex-wrap">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setClausesText(DEFAULT_CONTRACT_TERMS_TEMPLATE);
                    setIsDirty(true);
                  }}
                >
                  Restaurar Minuta Padrão A4
                </button>
                {CONTRACT_TEMPLATE_VARIABLES.slice(0, 4).map((v) => (
                  <button
                    key={v.token}
                    type="button"
                    className="btn btn-ghost btn-sm mono"
                    onClick={() => {
                      setClausesText((prev) => `${prev}\n${v.token}`);
                      setIsDirty(true);
                    }}
                  >
                    + {v.token}
                  </button>
                ))}
              </div>
            </div>
            {mode === 'edit' && (
              <div className="field mb-3 mt-2">
                <label htmlFor="ctr-ver-summary">Resumo do Aditivo / Nova Versão *</label>
                <input
                  id="ctr-ver-summary"
                  className="input"
                  required
                  value={versionSummary}
                  onChange={(e) => setVersionSummary(e.target.value)}
                />
              </div>
            )}
            <div className="field mt-2">
              <label htmlFor="ctr-clauses">Texto Integral das Cláusulas *</label>
              <textarea
                id="ctr-clauses"
                className="textarea mono"
                style={{ minHeight: 190 }}
                required
                value={clausesText}
                onChange={(e) => setClausesText(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link to={baseRoute} className="btn btn-secondary">
              {t('common.cancel')}
            </Link>
            <button type="submit" className="btn btn-primary">
              <Save size={15} />
              {t('common.save')}
            </button>
          </div>
        </form>

        {/* Live A4 Sheet Preview on the Dedicated Edit Page */}
        <div className="card" style={{ position: 'sticky', top: '4.5rem' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">Preview Folha A4 em Tempo Real</h2>
              <p className="text-xs text-muted">
                Documento pronto para assinatura SHA-256 e exportação em PDF/DOCX/HTML.
              </p>
            </div>
            <span className="badge badge-teal">A4 210×297mm</span>
          </div>
          <div
            className="card-body"
            style={{
              maxHeight: '78vh',
              overflowY: 'auto',
              background: '#f8fafc',
              color: '#0f172a',
              fontFamily: 'Georgia, serif',
              fontSize: '0.82rem',
              lineHeight: 1.6,
              padding: '1.5rem',
            }}
          >
            <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                INSTRUMENTO PARTICULAR DE LICENCIAMENTO SAAS — {previewContractEntity.code}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                Contratante: <strong>{previewContractEntity.companyName}</strong> ({selectedComp?.taxId || 'CNPJ Isento'}) • Plano:{' '}
                <strong>{previewContractEntity.planName}</strong> • Franquia: <strong>{freeEmployeesQuota} funcionários grátis</strong>
              </div>
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{previewContractEntity.clausesText}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ContractDetailAndSignaturePage: React.FC<{ scope: 'global' | 'company' }> = ({
  scope,
}) => {
  const { empresaId, contratoId } = useParams<{ empresaId: string; contratoId: string }>();
  const {
    currentUser,
    contracts,
    modules,
    session,
    hasPermission,
    getActor,
    refreshData,
    notify,
    t,
  } = useApp();

  const targetCompanyId = scope === 'company' ? empresaId : undefined;
  const baseRoute =
    scope === 'global' ? '/app/global/contratos' : `/app/empresa/${empresaId}/contratos`;

  const contract = contracts.find((c) => c.id === contratoId);
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signerName, setSignerName] = useState(currentUser?.name || '');
  const [signerEmail, setSignerEmail] = useState(currentUser?.email || '');
  const [signerDoc, setSignerDoc] = useState('***.842.190-**');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  if (!contract) {
    return (
      <AccessDeniedView
        title="Contrato Não Localizado"
        reason={`O contrato "${contratoId}" não foi encontrado.`}
        backTo={baseRoute}
      />
    );
  }

  if (scope === 'company' && empresaId && contract.companyId !== empresaId) {
    return (
      <AccessDeniedView
        title="Isolamento Multiempresa de Contratos"
        reason="Este contrato pertence a outra empresa e não pode ser acessado fora do seu tenant."
        backTo={baseRoute}
      />
    );
  }

  const handleSimulatedSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) return;
    const hash = `SHA256-OLIVELAS-${Math.random().toString(16).substring(2, 14)}${Date.now().toString(16)}`;
    const now = new Date().toISOString();
    const actor = getActor(contract.companyId);

    await repositories.contracts.update(
      contract.id,
      (curr) => ({
        ...curr,
        status: 'active',
        signatures: [
          ...curr.signatures,
          {
            id: generateId('sig'),
            signerName: signerName.trim(),
            signerEmail: signerEmail.trim(),
            signerDocument: signerDoc.trim(),
            signedAt: now,
            ipAddressSimulated: '177.92.40.18 (Verificado)',
            acceptanceHash: hash,
            isSimulated: true,
          },
        ],
      }),
      actor,
      `Assinatura eletrônica auditada registrada no contrato ${contract.code} por ${signerName.trim()} (Hash: ${hash}).`,
      'sign_contract',
    );
    await refreshData();
    setSignModalOpen(false);
    notify({
      type: 'success',
      title: 'Assinatura Eletrônica Auditada Registrada',
      description: `Contrato ${contract.code} ativado com carimbo de auditoria ${hash.slice(0, 18)}...`,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: t('nav.contracts'), to: baseRoute },
          { label: contract.code },
        ]}
        title={`Instrumento Contratual ${contract.code} — Versão v${contract.version}`}
        subtitle={`${contract.companyName} • Plano: ${contract.planName} • Vigência: ${contract.startDate} a ${contract.endDate}`}
        scopeBadge={`v${contract.version}`}
        actions={
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => exportContractAsHTML(contract, modules)}
            >
              <FileText size={14} />
              HTML
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => exportContractAsDOCX(contract, modules)}
            >
              <Download size={14} />
              Word (.DOC)
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => exportContractAsPDF(contract, modules)}
            >
              <Printer size={14} />
              Imprimir / PDF
            </button>
            {(hasPermission('contracts', 'approve', targetCompanyId) ||
              hasPermission('contracts', 'edit', targetCompanyId)) && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setSignModalOpen(true)}
              >
                <FileSignature size={14} />
                Assinar Eletronicamente (SHA-256)
              </button>
            )}
            {scope === 'global' && hasPermission('contracts', 'edit') && (
              <Link
                to={`/app/global/contratos/${contract.id}/editar`}
                className="btn btn-secondary btn-sm"
              >
                <Edit3 size={14} />
                Nova Versão / Aditivo
              </Link>
            )}
          </div>
        }
      />

      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Estado do Contrato</span>
          <div>
            <StatusBadge status={contract.status} />
          </div>
          <span className="kpi-meta">Responsável: {contract.commercialResponsible}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Valor Bruto / Desconto</span>
          <span className="kpi-value">
            {formatCurrency(contract.totalValue, contract.currency, session.language)}
          </span>
          <span className="kpi-meta">
            Desconto: {formatCurrency(contract.discountValue, contract.currency, session.language)}
          </span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Valor Líquido Recorrente</span>
          <span className="kpi-value" style={{ color: 'var(--accent-primary)' }}>
            {formatCurrency(contract.finalValue, contract.currency, session.language)}
          </span>
          <span className="kpi-meta">Periodicidade: {contract.billingCycle}</span>
        </div>
      </div>

      {/* Contract Clauses & Modules */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '1rem' }}>Cláusulas e Módulos Licenciados</h2>
          </div>
          <div className="card-body flex flex-col gap-3">
            <div className="flex items-center gap-1 flex-wrap">
              {contract.moduleIds.map((mid) => {
                const mod = modules.find((m) => m.id === mid);
                return (
                  <span key={mid} className="badge badge-teal">
                    {mod?.name[session.language] || mid}
                  </span>
                );
              })}
            </div>
            <pre
              className="mono text-xs"
              style={{
                whiteSpace: 'pre-wrap',
                padding: '1rem',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {contract.clausesText}
            </pre>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '1rem' }}>
              Assinaturas Eletrônicas & Histórico de Versões
            </h2>
            <span className="badge badge-success">Integridade SHA-256</span>
          </div>
          <div className="card-body flex flex-col gap-3">
            {contract.signatures.length === 0 ? (
              <div
                style={{
                  padding: '0.85rem',
                  backgroundColor: 'var(--status-warning-bg)',
                  border: '1px solid var(--status-warning-border)',
                  borderRadius: 'var(--radius-sm)',
                }}
                className="text-xs"
              >
                Este contrato aguarda assinatura eletrônica do representante autorizado.
              </div>
            ) : (
              contract.signatures.map((sig) => (
                <div
                  key={sig.id}
                  style={{
                    padding: '0.85rem',
                    border: '1px solid var(--status-success-border)',
                    backgroundColor: 'var(--status-success-bg)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                  className="flex flex-col gap-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <strong className="flex items-center gap-1">
                      <CheckCircle2 size={14} /> {sig.signerName} ({sig.signerDocument})
                    </strong>
                    <span className="badge badge-success">Assinatura Auditada</span>
                  </div>
                  <span className="mono">{sig.signerEmail}</span>
                  <span className="tabular">
                    Assinado em: {formatDateTime(sig.signedAt, session.language)} • IP:{' '}
                    {sig.ipAddressSimulated}
                  </span>
                  <code className="text-xs">{sig.acceptanceHash}</code>
                </div>
              ))
            )}

            <div className="text-xs font-semibold text-muted mt-2">
              HISTÓRICO DE VERSÕES DO CONTRATO ({contract.versionHistory.length})
            </div>
            {contract.versionHistory.map((ver) => (
              <div
                key={ver.version}
                style={{
                  padding: '0.6rem',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}
                className="text-xs"
              >
                <div className="flex justify-between font-semibold">
                  <span>Versão v{ver.version}</span>
                  <span className="tabular">
                    {formatCurrency(ver.totalValue, contract.currency, session.language)}
                  </span>
                </div>
                <div className="text-muted mt-2">
                  {ver.summary} — por {ver.createdBy} em{' '}
                  {formatDateTime(ver.createdAt, session.language)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ModalDialog
        open={signModalOpen}
        onClose={() => setSignModalOpen(false)}
        title={`Assinatura Eletrônica Auditada — ${contract.code}`}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSignModalOpen(false)}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              form="contract-sign-form"
              className="btn btn-primary"
              disabled={!acceptedTerms}
            >
              <FileSignature size={15} />
              Registrar Assinatura Auditada
            </button>
          </>
        }
      >
        <form
          id="contract-sign-form"
          onSubmit={handleSimulatedSignature}
          className="flex flex-col gap-3"
        >
          <div className="badge badge-info">
            Governança Contratual: Assinatura eletrônica com hash SHA-256 sincronizada no Supabase PostgreSQL e registrada na trilha de auditoria.
          </div>
          <div className="field">
            <label htmlFor="sig-name">Nome Completo do Signatário *</label>
            <input
              id="sig-name"
              className="input"
              required
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="sig-email">E-mail Corporativo *</label>
            <input
              id="sig-email"
              type="email"
              className="input mono"
              required
              value={signerEmail}
              onChange={(e) => setSignerEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="sig-doc">Documento Mascarado (CPF/Identidade) *</label>
            <input
              id="sig-doc"
              className="input mono"
              required
              value={signerDoc}
              onChange={(e) => setSignerDoc(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-xs mt-2" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            <span>
              Declaro que revisei as cláusulas da versão v{contract.version} e concordo com o registro
              deste aceite contratual na trilha de auditoria.
            </span>
          </label>
        </form>
      </ModalDialog>
    </div>
  );
};
