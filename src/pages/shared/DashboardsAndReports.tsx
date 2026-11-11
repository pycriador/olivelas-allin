import React, { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Building2,
  CreditCard,
  Download,
  ExternalLink,
  FileSignature,
  LifeBuoy,
  Package,
  Printer,
  ScrollText,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateTime } from '../../i18n/translations';
import {
  ActionDropdownMenu,
  ModalDialog,
  PageHeader,
  StatusBadge,
  UrlDataTable,
} from '../../components/shared/SharedComponents';
import {
  CatalogModuleEntity,
  ChargeEntity,
  CompanyEntity,
  CompanyModuleSubscription,
  ContractEntity,
  TicketEntity,
} from '../../types/domain';
import { getUserActiveRoles } from '../../services/hbacService';
import { exportRowsToCsv } from '../../services/operationalUtils';
import {
  buildModuleInstanceLaunchUrl,
  openModuleInstanceInNewTab,
} from '../../services/olivelasEcosystemService';
import {
  computeCompanyLicenseSummary,
  getPlatformBillingRules,
  sortCompaniesHierarchically,
} from '../../services/enterpriseFinanceAndContractsService';

export const GlobalDashboardPage: React.FC = () => {
  const {
    companies,
    users,
    modules,
    companyModules,
    contracts,
    charges,
    tickets,
    auditEvents,
    session,
    isCurrentSuperAdmin,
    startSupportImpersonation,
    t,
  } = useApp();
  const navigate = useNavigate();

  const [supportModalCompanyId, setSupportModalCompanyId] = useState<string | null>(null);
  const [supportReason, setSupportReason] = useState(
    'Atendimento técnico e conferência de módulos contratados.',
  );

  const activeCompanies = companies.filter((c) => !c.archiveMetadata.isArchived);
  const activeContracts = contracts.filter(
    (c) => !c.archiveMetadata.isArchived && c.status === 'active',
  );
  const monthlyRecurringRevenue = activeContracts.reduce(
    (acc, c) => acc + (c.billingCycle === 'monthly' ? c.finalValue : Math.round(c.finalValue / 12)),
    0,
  );
  const overdueCharges = charges.filter(
    (ch) => !ch.archiveMetadata.isArchived && ch.status === 'overdue',
  );
  const openTickets = tickets.filter(
    (tk) => !tk.archiveMetadata.isArchived && (tk.status === 'open' || tk.status === 'in_progress'),
  );

  const handleStartSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportModalCompanyId || !supportReason.trim()) return;
    await startSupportImpersonation(supportModalCompanyId, supportReason.trim());
    const targetId = supportModalCompanyId;
    setSupportModalCompanyId(null);
    navigate(`/app/empresa/${targetId}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[{ label: t('scope.global') }, { label: t('nav.dashboard') }]}
        title="Console Global de Governança Multiempresa"
        subtitle="Visão executiva consolidada de empresas clientes, contratos ativos, faturamento recorrente e trilha de auditoria."
        scopeBadge={t('scope.global')}
        actions={
          <>
            <Link to="/app/global/empresas/nova" className="btn btn-primary btn-sm">
              <Building2 size={14} />
              Nova Empresa
            </Link>
            <Link to="/app/global/contratos/novo" className="btn btn-secondary btn-sm">
              <FileSignature size={14} />
              Novo Contrato
            </Link>
          </>
        }
      />

      {/* Metric Strip */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Empresas Cadastradas</span>
          <span className="kpi-value">{activeCompanies.length}</span>
          <span className="kpi-meta">
            {activeCompanies.filter((c) => c.operationalStatus === 'active').length} ativas •{' '}
            {activeCompanies.filter((c) => c.operationalStatus === 'suspended').length} suspensa(s)
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Receita Mensal Recorrente (MRR Est.)</span>
          <span className="kpi-value">
            {formatCurrency(monthlyRecurringRevenue, 'BRL', session.language)}
          </span>
          <span className="kpi-meta">{activeContracts.length} contratos vigentes</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Assinaturas de Módulos Ativas</span>
          <span className="kpi-value">
            {companyModules.filter((cm) => cm.status === 'active').length}
          </span>
          <span className="kpi-meta">Distribuídas entre {modules.length} módulos do catálogo</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Cobranças em Atraso</span>
          <span className="kpi-value" style={{ color: overdueCharges.length > 0 ? 'var(--status-danger)' : undefined }}>
            {overdueCharges.length}
          </span>
          <span className="kpi-meta">
            Total vencido:{' '}
            {formatCurrency(
              overdueCharges.reduce((a, b) => a + b.amount, 0),
              'BRL',
              session.language,
            )}
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Tickets em Atendimento</span>
          <span className="kpi-value">{openTickets.length}</span>
          <span className="kpi-meta">{users.length} usuários totais na plataforma</span>
        </div>
      </div>

      {/* Two Column Operational Dispatch */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Companies & Support Context Access */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 style={{ fontSize: '1rem' }}>Empresas Clientes & Contexto de Suporte Auditado</h2>
              <p className="text-xs text-muted">
                Inspecione o escopo de cada empresa ou inicie sessão de suporte explícita.
              </p>
            </div>
            <Link to="/app/global/empresas" className="btn btn-secondary btn-sm">
              Ver Todas
            </Link>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Estado</th>
                  <th className="num">Módulos</th>
                  <th className="num">Ações</th>
                </tr>
              </thead>
              <tbody>
                {activeCompanies.map((comp) => {
                  const activeMods = companyModules.filter(
                    (cm) => cm.companyId === comp.id && cm.status === 'active',
                  );
                  return (
                    <tr key={comp.id}>
                      <td>
                        <Link to={`/app/global/empresas/${comp.id}`} className="font-semibold">
                          {comp.tradeName}
                        </Link>
                        <div className="text-xs text-muted mono">{comp.id}</div>
                      </td>
                      <td>
                        <StatusBadge status={comp.operationalStatus} />
                      </td>
                      <td className="num tabular">{activeMods.length}</td>
                      <td className="num">
                        <div className="flex items-center gap-1" style={{ justifyContent: 'flex-end' }}>
                          <Link
                            to={`/app/global/empresas/${comp.id}`}
                            className="btn btn-secondary btn-sm"
                          >
                            Ficha
                          </Link>
                          {isCurrentSuperAdmin && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => setSupportModalCompanyId(comp.id)}
                            >
                              <UserCheck size={13} />
                              Suporte
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

        {/* Recent Global Audit Trail */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 style={{ fontSize: '1rem' }}>Últimos Eventos na Trilha de Auditoria Global</h2>
              <p className="text-xs text-muted">
                Rastreabilidade imutável de mutações cadastrais, HBAC, contratos e API Hub.
              </p>
            </div>
            <Link to="/app/global/auditoria" className="btn btn-secondary btn-sm">
              Auditoria Completa
            </Link>
          </div>
          <div className="card-body flex flex-col gap-2">
            {auditEvents.slice(0, 6).map((evt) => (
              <div
                key={evt.id}
                style={{
                  padding: '0.65rem 0.85rem',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-info">{evt.module}</span>
                    <strong className="text-xs">{evt.actorName}</strong>
                    <span className="text-xs text-muted">({evt.actorRole})</span>
                  </div>
                  <span className="text-xs text-muted tabular">
                    {formatDateTime(evt.timestamp, session.language)}
                  </span>
                </div>
                <p className="text-xs">{evt.summary}</p>
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="mono">{evt.correlationId}</span>
                  <Link to={`/app/global/auditoria/${evt.id}`}>Inspecionar evento →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal for Support Impersonation */}
      <ModalDialog
        open={Boolean(supportModalCompanyId)}
        onClose={() => setSupportModalCompanyId(null)}
        title="Iniciar Contexto Administrativo de Suporte Auditado"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSupportModalCompanyId(null)}
            >
              {t('common.cancel')}
            </button>
            <button type="submit" form="support-impersonation-form" className="btn btn-primary">
              <UserCheck size={15} />
              Ingressar com Registro de Auditoria
            </button>
          </>
        }
      >
        <form id="support-impersonation-form" onSubmit={handleStartSupport} className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            O Super Admin ingressará temporariamente no ambiente da empresa{' '}
            <strong>{companies.find((c) => c.id === supportModalCompanyId)?.tradeName}</strong> sem
            alterar silenciosamente a identidade do usuário atendido. Todas as operações serão gravadas
            na auditoria sob sua identidade original.
          </p>
          <div className="field">
            <label htmlFor="support-reason-input">Justificativa do Acesso de Suporte</label>
            <p id="support-reason-hint" className="hint">
              Esta justificativa será exibida no cabeçalho da sessão e gravada na auditoria da empresa.
            </p>
            <textarea
              id="support-reason-input"
              className="textarea"
              required
              minLength={5}
              aria-describedby="support-reason-hint"
              value={supportReason}
              onChange={(e) => setSupportReason(e.target.value)}
            />
          </div>
        </form>
      </ModalDialog>
    </div>
  );
};

interface CompanyActiveModuleTableRow {
  id: string;
  sub: CompanyModuleSubscription;
  mod: CatalogModuleEntity;
  moduleName: string;
  code: string;
  category: CatalogModuleEntity['category'];
  isExample: boolean;
  dbSchema: string;
  targetRoute: string;
  dedicatedExternalUrl: string;
  port?: number;
  agreedPrice: number;
  currency: CatalogModuleEntity['currency'];
  billingCycle: string;
  renewalDate: string;
  status: CompanyModuleSubscription['status'];
}

export const CompanyDashboardPage: React.FC<{ standaloneTableOnly?: boolean }> = ({
  standaloneTableOnly = false,
}) => {
  const { empresaId } = useParams<{ empresaId: string }>();
  const [searchParams] = useSearchParams();
  const {
    companies,
    modules,
    companyModules,
    contracts,
    charges,
    tickets,
    auditEvents,
    currentUser,
    session,
    hasPermission,
    t,
  } = useApp();

  const company = companies.find((c) => c.id === empresaId);
  if (!company) return null;

  const mySubs = companyModules.filter(
    (cm) => cm.companyId === company.id && cm.status === 'active',
  );
  const myContracts = contracts.filter(
    (ct) => ct.companyId === company.id && !ct.archiveMetadata.isArchived,
  );
  const myCharges = charges.filter(
    (ch) => ch.companyId === company.id && !ch.archiveMetadata.isArchived,
  );
  const myTickets = tickets.filter(
    (tk) => tk.companyId === company.id && !tk.archiveMetadata.isArchived,
  );
  const myAudit = auditEvents.filter((ae) => ae.companyId === company.id);

  const activeModuleRows: CompanyActiveModuleTableRow[] = mySubs
    .map((sub): CompanyActiveModuleTableRow | null => {
      const mod = modules.find((m) => m.id === sub.moduleId);
      if (!mod) return null;
      let targetRoute = `/app/empresa/${company.id}/modulos`;
      let dedicatedExternalUrl = `${window.location.origin}/app/empresa/${company.id}/modulos`;
      let port: number | undefined;

      if (!mod.isExample) {
        const slug = mod.ecosystemSlug || mod.code;
        targetRoute = `/app/empresa/${company.id}/ecossistema/${slug}`;
        const launchInfo = buildModuleInstanceLaunchUrl({
          moduleSlug: slug,
          companyId: company.id,
          companyName: company.tradeName,
        });
        port = launchInfo.port;
        dedicatedExternalUrl = `http://localhost:${launchInfo.port}${launchInfo.serverSpec.adminPath}`;
      } else {
        if (mod.code === 'allin_estoque') targetRoute = `/app/empresa/${company.id}/operacao/estoque`;
        if (mod.code === 'allin_vendas') targetRoute = `/app/empresa/${company.id}/operacao/vendas`;
        if (mod.code === 'allin_crm') targetRoute = `/app/empresa/${company.id}/operacao/crm`;
        if (mod.code === 'allin_financeiro') targetRoute = `/app/empresa/${company.id}/financeiro`;
        if (mod.code === 'allin_equipe') targetRoute = `/app/empresa/${company.id}/papeis`;
        if (mod.code === 'allin_contratos') targetRoute = `/app/empresa/${company.id}/contratos`;
        if (mod.code === 'allin_suporte') targetRoute = `/app/empresa/${company.id}/tickets`;
        if (mod.code === 'allin_analytics') targetRoute = `/app/empresa/${company.id}/relatorios`;
        dedicatedExternalUrl = `${window.location.origin}${targetRoute}`;
      }

      return {
        id: sub.id,
        sub,
        mod,
        moduleName: mod.name[session.language],
        code: mod.code,
        category: mod.category,
        isExample: Boolean(mod.isExample),
        dbSchema: mod.dbSchema || mod.code,
        targetRoute,
        dedicatedExternalUrl,
        port,
        agreedPrice: sub.agreedPrice,
        currency: sub.currency,
        billingCycle: sub.billingCycle,
        renewalDate: sub.renewalDate,
        status: sub.status,
      };
    })
    .filter((r): r is CompanyActiveModuleTableRow => r !== null);

  const typeFilter = searchParams.get('type') || 'all';
  const filteredActiveModuleRows = activeModuleRows.filter((row) => {
    if (typeFilter === 'commercial') return !row.isExample;
    if (typeFilter === 'examples') return row.isExample;
    return true;
  });

  const commercialActiveCount = activeModuleRows.filter((r) => !r.isExample).length;
  const exampleActiveCount = activeModuleRows.filter((r) => r.isExample).length;

  const handleOpenModuleUrl = (row: CompanyActiveModuleTableRow) => {
    if (!row.isExample) {
      const slug = row.mod.ecosystemSlug || row.mod.code;
      openModuleInstanceInNewTab({
        moduleSlug: slug,
        companyId: company.id,
        companyName: company.tradeName,
        userId: currentUser?.id || 'usr-admin-global',
        userEmail: currentUser?.email || 'willian.o.jesus@gmail.com',
        userName: currentUser?.name || 'Willian Jesus',
        userRole: 'COMPANY_ADMIN',
      });
    } else {
      window.open(row.dedicatedExternalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const renderActiveModulesTable = () => (
    <UrlDataTable<CompanyActiveModuleTableRow>
      tableId={`company-active-modules-${company.id}`}
      caption={`Módulos ativos para ${company.tradeName}`}
      items={filteredActiveModuleRows}
      defaultSortField="moduleName"
      csvFilename={`modulos-ativos-${company.id}.csv`}
      searchPlaceholder="Buscar módulo ativo por nome, código, categoria, schema ou URL própria..."
      statusExtractor={(r) => r.status}
      searchExtractor={(r) =>
        `${r.moduleName} ${r.code} ${r.category} ${r.dbSchema} ${r.targetRoute} ${r.dedicatedExternalUrl} ${r.mod.description[session.language]}`
      }
      statusOptions={[
        { value: 'active', label: t('status.active') },
        { value: 'trial', label: 'Trial' },
        { value: 'suspended', label: t('status.suspended') },
      ]}
      extraFiltersRender={(params, updateParam) => (
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="select"
            style={{ width: 'auto', minWidth: '185px', padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
            value={params.get('type') || 'all'}
            onChange={(e) => updateParam('type', e.target.value)}
            aria-label="Filtrar tipo de módulo ativo"
          >
            <option value="all">Todos os Módulos Ativos ({activeModuleRows.length})</option>
            <option value="commercial">Plataformas Comerciais ({commercialActiveCount})</option>
            <option value="examples">Módulos Base ({exampleActiveCount})</option>
          </select>
          {!standaloneTableOnly && (
            <Link
              to={`/app/empresa/${company.id}/modulos-ativos`}
              className="btn btn-secondary btn-sm"
              title="Abrir tabela de módulos ativos em página exclusiva"
            >
              <ExternalLink size={13} />
              URL Própria da Tabela
            </Link>
          )}
          <Link to={`/app/empresa/${company.id}/modulos`} className="btn btn-primary btn-sm">
            <Package size={13} />
            Catálogo e Contratação
          </Link>
        </div>
      )}
      columns={[
        {
          key: 'moduleName',
          header: 'Módulo Ativo',
          width: '26%',
          sortable: true,
          csvValue: (r) => `${r.moduleName} (${r.code})`,
          render: (r) => (
            <div style={{ minWidth: 0 }}>
              <Link
                to={r.targetRoute}
                className="font-semibold truncate block"
                style={{ color: 'var(--accent-primary)' }}
                title={r.mod.description[session.language]}
              >
                {r.moduleName}
              </Link>
              <div className="text-xs text-muted mono truncate">
                {r.code} • v{r.mod.version}
              </div>
            </div>
          ),
        },
        {
          key: 'category',
          header: 'Tipo & Categoria',
          width: '18%',
          sortable: true,
          csvValue: (r) => `${r.category} (${r.isExample ? 'Base' : r.dbSchema})`,
          render: (r) => (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="badge badge-info">{r.category}</span>
              <span className={`badge ${r.isExample ? 'badge-warning' : 'badge-teal'} mono`}>
                {r.isExample ? 'Base' : r.dbSchema}
              </span>
            </div>
          ),
        },
        {
          key: 'dedicatedExternalUrl',
          header: 'URL Própria do Módulo',
          width: '26%',
          sortable: true,
          csvValue: (r) => r.dedicatedExternalUrl,
          render: (r) => (
            <div className="flex flex-col gap-0.5" style={{ minWidth: 0 }}>
              <a
                href={r.dedicatedExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  handleOpenModuleUrl(r);
                }}
                className="mono text-xs font-semibold truncate flex items-center gap-1"
                style={{ color: 'var(--accent-primary)' }}
                title={`Abrir URL própria: ${r.dedicatedExternalUrl}`}
              >
                <span className="truncate">{r.dedicatedExternalUrl.replace(/^https?:\/\//, '')}</span>
                <ExternalLink size={11} style={{ flexShrink: 0 }} />
              </a>
              <Link
                to={r.targetRoute}
                className="mono text-muted truncate"
                style={{ fontSize: '0.68rem' }}
                title={`Rota dedicada no All In: ${r.targetRoute}`}
              >
                {r.targetRoute}
              </Link>
            </div>
          ),
        },
        {
          key: 'agreedPrice',
          header: 'Mensalidade & Renovação',
          width: '14%',
          sortable: true,
          isNumeric: true,
          csvValue: (r) => r.agreedPrice,
          render: (r) => (
            <div className="tabular">
              <div className="font-semibold">
                {formatCurrency(r.agreedPrice, r.currency, session.language)}/mês
              </div>
              <div className="text-xs text-muted">Renova: {r.renewalDate}</div>
            </div>
          ),
        },
        {
          key: 'status',
          header: 'Estado',
          width: '8%',
          render: (r) => <StatusBadge status={r.status} />,
        },
        {
          key: 'actions',
          header: 'Ações',
          width: '8%',
          isNumeric: true,
          render: (r) => (
            <div className="flex items-center justify-end gap-1">
              <Link to={r.targetRoute} className="btn btn-primary btn-sm" title="Abrir no painel All In">
                Abrir <ArrowRight size={12} />
              </Link>
            </div>
          ),
        },
      ]}
    />
  );

  if (standaloneTableOnly) {
    return (
      <div className="flex flex-col gap-2.5">
        <PageHeader
          breadcrumbs={[
            { label: company.tradeName, to: `/app/empresa/${company.id}` },
            { label: 'Módulos Ativos' },
          ]}
          title={`Módulos Ativos — ${company.tradeName}`}
          subtitle={`${activeModuleRows.length} módulos contratados e ativos (${commercialActiveCount} plataformas comerciais Olivelas e ${exampleActiveCount} módulos base) com filtro de busca e URL própria.`}
          scopeBadge={company.tradeName}
          actions={
            <div className="flex items-center gap-2">
              <Link to={`/app/empresa/${company.id}`} className="btn btn-secondary btn-sm">
                Voltar ao Painel
              </Link>
              <Link to={`/app/empresa/${company.id}/modulos`} className="btn btn-primary btn-sm">
                <Package size={14} />
                Catálogo e Contratação
              </Link>
            </div>
          }
        />
        {renderActiveModulesTable()}
      </div>
    );
  }

  return (
    <div className="ecosystem-hub-page flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: company.tradeName },
          { label: t('nav.dashboard') },
        ]}
        title={`Ambiente Operacional — ${company.tradeName}`}
        subtitle={`${company.legalName} • Documento: ${company.taxId || 'Isento'} • Moeda: ${company.currency} • Fuso: ${company.timezone}`}
        scopeBadge={`Tenant Isolado: ${company.id}`}
        actions={
          <>
            <Link to={`/app/empresa/${company.id}/modulos-ativos`} className="btn btn-secondary btn-sm">
              <ExternalLink size={14} />
              Tabela de Módulos Ativos ({mySubs.length})
            </Link>
            {hasPermission('modules', 'view', company.id) && (
              <Link to={`/app/empresa/${company.id}/modulos`} className="btn btn-primary btn-sm">
                <Package size={14} />
                Gerenciar Módulos ({mySubs.length} ativos)
              </Link>
            )}
            {hasPermission('tickets', 'create', company.id) && (
              <Link to={`/app/empresa/${company.id}/tickets/novo`} className="btn btn-secondary btn-sm">
                <LifeBuoy size={14} />
                Abrir Chamado
              </Link>
            )}
          </>
        }
      />

      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Estado Operacional</span>
          <div>
            <StatusBadge status={company.operationalStatus} />
          </div>
          <span className="kpi-meta">Cadastro: {company.registrationStatus}</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Módulos Contratados Ativos</span>
          <span className="kpi-value">{mySubs.length}</span>
          <span className="kpi-meta">
            <Link to={`/app/empresa/${company.id}/modulos-ativos`}>
              Ver tabela exclusiva ({mySubs.length} de {modules.length})
            </Link>
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Contratos da Empresa</span>
          <span className="kpi-value">{myContracts.length}</span>
          <span className="kpi-meta">
            {myContracts.filter((c) => c.status === 'active').length} vigente(s)
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Cobranças em Aberto / Vencidas</span>
          <span className="kpi-value">
            {myCharges.filter((c) => c.status === 'pending' || c.status === 'overdue').length}
          </span>
          <span className="kpi-meta">
            {myCharges.filter((c) => c.status === 'paid').length} fatura(s) liquidada(s)
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Chamados de Suporte</span>
          <span className="kpi-value">{myTickets.length}</span>
          <span className="kpi-meta">
            {myTickets.filter((tk) => tk.status !== 'resolved' && tk.status !== 'closed').length} em aberto
          </span>
        </div>
      </div>

      {/* Active Modules Table with URL-persisted Search & Filters */}
      {renderActiveModulesTable()}

      {/* Recent Company Audit Events */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: '1rem' }}>Eventos Recentes de Auditoria da Empresa</h2>
          <Link to={`/app/empresa/${company.id}/auditoria`} className="btn btn-secondary btn-sm">
            Ver Trilha da Empresa
          </Link>
        </div>
        <div className="card-body flex flex-col gap-2">
          {myAudit.slice(0, 5).map((evt) => (
            <div
              key={evt.id}
              style={{
                padding: '0.65rem 0.85rem',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="badge badge-info">{evt.module}</span>
                  <strong className="text-xs">{evt.actorName}</strong>
                  <span className="text-xs text-muted">• {evt.summary}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted tabular">
                  {formatDateTime(evt.timestamp, session.language)}
                </span>
                <Link to={`/app/empresa/${company.id}/auditoria/${evt.id}`} className="text-xs">
                  Detalhes
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export type AnalyticsReportTab =
  | 'empresas_licencas'
  | 'modulos_ecossistema'
  | 'contratos_assinaturas'
  | 'financeiro_cobrancas'
  | 'usuarios_hbac'
  | 'governanca_sla';

interface AllInUserAllocationReportRow {
  id: string;
  name: string;
  email: string;
  roleLabel: string;
  department: string;
  companyId: string;
  companyName: string;
  isBranch: boolean;
  branchCode: string;
  parentCompanyName?: string;
  quotaStatus: 'FREE' | 'EXTRA' | 'GLOBAL' | 'INACTIVE';
  quotaBadgeText: string;
  monthlyLicenseCost: number;
  status: string;
  archiveMetadata: { isArchived: boolean };
}

export const ReportsAnalyticsPage: React.FC<{ scope: 'global' | 'company' }> = ({ scope }) => {
  const { empresaId } = useParams<{ empresaId: string }>();
  const {
    companies,
    users,
    roles,
    modules,
    companyModules,
    contracts,
    charges,
    paymentMethods,
    tickets,
    apiServices,
    auditEvents,
    session,
    hasPermission,
    notify,
    t,
  } = useApp();
  const navigate = useNavigate();

  const targetCompanyId = scope === 'company' ? empresaId : undefined;
  const company = targetCompanyId ? companies.find((c) => c.id === targetCompanyId) : null;

  const [activeTab, setActiveTab] = useState<AnalyticsReportTab>('empresas_licencas');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [periodPreset, setPeriodPreset] = useState<'all' | 'month' | 'quarter' | 'year'>('all');

  if (!hasPermission('reports', 'view', targetCompanyId)) {
    return (
      <div className="card card-body">
        Sem permissão HBAC para visualizar relatórios analíticos.
      </div>
    );
  }

  const billingRules = getPlatformBillingRules();
  const effectiveCompanyFilter =
    targetCompanyId || (selectedBranchId !== 'ALL' ? selectedBranchId : undefined);

  const scopedCompanies = effectiveCompanyFilter
    ? companies.filter((c) => c.id === effectiveCompanyFilter && !c.archiveMetadata.isArchived)
    : sortCompaniesHierarchically(companies.filter((c) => !c.archiveMetadata.isArchived));

  const scopedSubs = effectiveCompanyFilter
    ? companyModules.filter((s) => s.companyId === effectiveCompanyFilter)
    : companyModules;
  const scopedContracts = effectiveCompanyFilter
    ? contracts.filter((ct) => ct.companyId === effectiveCompanyFilter)
    : contracts;
  const scopedCharges = effectiveCompanyFilter
    ? charges.filter((c) => c.companyId === effectiveCompanyFilter)
    : charges;
  const scopedTickets = effectiveCompanyFilter
    ? tickets.filter((tk) => tk.companyId === effectiveCompanyFilter)
    : tickets;

  // 1. Relatório de Empresas (Matrizes & Filiais), Cota de 10 Funcionários Grátis & MRR
  const companySummariesMap = new Map(
    scopedCompanies.map((comp) => {
      const lic = computeCompanyLicenseSummary(
        comp,
        companies,
        billingRules,
        companyModules,
        contracts,
      );
      const compContracts = contracts.filter(
        (ct) => ct.companyId === comp.id && ct.status === 'active',
      );
      const paidTotal = charges
        .filter((ch) => ch.companyId === comp.id && ch.status === 'paid')
        .reduce((a, b) => a + b.amount, 0);
      const pendingTotal = charges
        .filter((ch) => ch.companyId === comp.id && ch.status === 'pending')
        .reduce((a, b) => a + b.amount, 0);
      const overdueTotal = charges
        .filter((ch) => ch.companyId === comp.id && ch.status === 'overdue')
        .reduce((a, b) => a + b.amount, 0);
      return [
        comp.id,
        {
          lic,
          contractsCount: compContracts.length,
          paidTotal,
          pendingTotal,
          overdueTotal,
        },
      ];
    }),
  );

  // 2. Relatório de Módulos do Ecossistema All In & Receita por Plataforma
  const moduleStatsMap = new Map(
    modules.map((mod) => {
      const activeSubs = scopedSubs.filter(
        (s) => s.moduleId === mod.id && s.status === 'active',
      );
      const subscriberNames = activeSubs
        .map((s) => companies.find((c) => c.id === s.companyId)?.tradeName || s.companyId)
        .filter(Boolean);
      const monthlyRevenue = activeSubs.reduce(
        (acc, s) => acc + (s.billingCycle === 'yearly' ? Math.round(s.agreedPrice / 12) : s.agreedPrice),
        0,
      );
      return [
        mod.id,
        {
          activeCount: activeSubs.length,
          subscriberNames,
          monthlyRevenue,
        },
      ];
    }),
  );

  // 5. Relatório Consolidado de Usuários HBAC & Colaboradores Alocados por Unidade (Cota 10 Grátis)
  const userAllocationRows: AllInUserAllocationReportRow[] = [
    ...users
      .filter((u) => !effectiveCompanyFilter || u.companyIds.includes(effectiveCompanyFilter))
      .map((u) => {
        const primaryComp = companies.find((c) => c.id === u.companyIds[0]);
        const activeRoles = getUserActiveRoles(u, roles);
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          roleLabel:
            activeRoles.map((r) => `${r.name[session.language]} (N${r.hierarchyLevel})`).join(', ') ||
            'Global Admin',
          department: u.department || 'Governança Global',
          companyId: primaryComp?.id || 'global',
          companyName:
            u.companyIds.length > 1
              ? `${primaryComp?.tradeName || 'Matriz'} (+${u.companyIds.length - 1} unidades)`
              : primaryComp?.tradeName || 'Console Global All In',
          isBranch: Boolean(primaryComp?.isBranch),
          branchCode: primaryComp?.branchCode || 'GLOBAL',
          parentCompanyName: undefined,
          quotaStatus: 'GLOBAL' as const,
          quotaBadgeText: `HBAC Global (${u.companyIds.length} empresas)`,
          monthlyLicenseCost: 0,
          status: u.status,
          archiveMetadata: u.archiveMetadata,
        };
      }),
    ...scopedCompanies.flatMap((comp) => {
      const sum = companySummariesMap.get(comp.id)?.lic;
      const limit = sum?.freeLimit ?? 10;
      const extraPrice = sum?.extraEmployeePrice ?? 19.9;
      return (comp.allocatedEmployees || []).map((emp, idx) => {
        const isFree = idx < limit;
        return {
          id: `${comp.id}-${emp.id}`,
          name: emp.name,
          email: emp.email,
          roleLabel: `${emp.role} (${emp.jobTitle || 'Operacional'})`,
          department: emp.department || 'Operações',
          companyId: comp.id,
          companyName: comp.tradeName,
          isBranch: Boolean(comp.isBranch),
          branchCode: comp.branchCode || (comp.isBranch ? 'FILIAL' : 'MATRIZ'),
          parentCompanyName: sum?.parentCompanyName,
          quotaStatus: !emp.active ? ('INACTIVE' as const) : isFree ? ('FREE' as const) : ('EXTRA' as const),
          quotaBadgeText: !emp.active
            ? 'Inativo (Sem Custo)'
            : isFree
              ? `Franquia Grátis (${idx + 1}/${limit})`
              : `Excedente (+${formatCurrency(extraPrice, 'BRL', session.language)}/mês)`,
          monthlyLicenseCost: !emp.active || isFree ? 0 : extraPrice,
          status: emp.active ? 'active' : 'suspended',
          archiveMetadata: { isArchived: false },
        };
      });
    }),
  ];

  const totalMrr = Array.from(companySummariesMap.values()).reduce(
    (acc, item) => acc + item.lic.totalMonthlyBilling,
    0,
  );
  const totalAllocatedStaff = Array.from(companySummariesMap.values()).reduce(
    (acc, item) => acc + item.lic.activeEmployeesCount,
    0,
  );
  const totalExtraStaff = Array.from(companySummariesMap.values()).reduce(
    (acc, item) => acc + item.lic.extraEmployeesCount,
    0,
  );
  const paidSum = scopedCharges
    .filter((c) => !c.archiveMetadata.isArchived && c.status === 'paid')
    .reduce((a, b) => a + b.amount, 0);
  const pendingSum = scopedCharges
    .filter((c) => !c.archiveMetadata.isArchived && c.status === 'pending')
    .reduce((a, b) => a + b.amount, 0);
  const overdueSum = scopedCharges
    .filter((c) => !c.archiveMetadata.isArchived && c.status === 'overdue')
    .reduce((a, b) => a + b.amount, 0);

  const handleExportAnalyticsCsv = () => {
    if (activeTab === 'empresas_licencas') {
      exportRowsToCsv(
        `relatorio-allin-empresas-licencas-${scope}.csv`,
        [
          'ID',
          'Unidade',
          'Hierarquia',
          'Matriz Pai',
          'Titular',
          'Plano Contratado',
          'Funcionários Ativos',
          'Cota Grátis',
          'Licenças Extras',
          'MRR Total (BRL)',
          'Liquidado (BRL)',
          'Em Atraso (BRL)',
        ],
        scopedCompanies.map((comp) => {
          const info = companySummariesMap.get(comp.id);
          return [
            comp.id,
            comp.tradeName,
            comp.isBranch ? `Filial (${comp.branchCode || 'FILIAL'})` : `Matriz (${comp.branchCode || 'MATRIZ'})`,
            info?.lic.parentCompanyName || 'Matriz Principal',
            info?.lic.adminOwnerName || '',
            info?.lic.planName || '',
            info?.lic.activeEmployeesCount || 0,
            info?.lic.freeLimit || 10,
            info?.lic.extraEmployeesCount || 0,
            info?.lic.totalMonthlyBilling || 0,
            info?.paidTotal || 0,
            info?.overdueTotal || 0,
          ];
        }),
      );
    } else if (activeTab === 'modulos_ecossistema') {
      exportRowsToCsv(
        `relatorio-allin-modulos-ecossistema-${scope}.csv`,
        ['Código', 'Módulo All In', 'Schema PostgreSQL', 'Categoria', 'Preço Mensal Tabela', 'Empresas Ativas', 'MRR Contratado (BRL)'],
        modules.map((m) => {
          const st = moduleStatsMap.get(m.id);
          return [
            m.code,
            m.name[session.language],
            m.dbSchema || 'public',
            m.category,
            m.priceMonthly,
            st?.activeCount || 0,
            st?.monthlyRevenue || 0,
          ];
        }),
      );
    } else if (activeTab === 'contratos_assinaturas') {
      exportRowsToCsv(
        `relatorio-allin-contratos-${scope}.csv`,
        ['Código', 'Plano Contratado', 'Empresa', 'Ciclo', 'Vigência Início', 'Vigência Fim', 'Valor Final (BRL)', 'Assinatura', 'Estado'],
        scopedContracts.map((ct) => [
          ct.code,
          ct.planName,
          ct.companyName,
          ct.billingCycle,
          ct.startDate,
          ct.endDate,
          ct.finalValue,
          ct.signatures[0] ? `${ct.signatures[0].signerName} (${ct.signatures[0].signedAt})` : 'Pendente',
          ct.status,
        ]),
      );
    } else if (activeTab === 'financeiro_cobrancas') {
      exportRowsToCsv(
        `relatorio-allin-financeiro-cobrancas-${scope}.csv`,
        ['Fatura', 'Empresa', 'Descrição', 'Vencimento', 'Meio de Pagamento', 'Valor (BRL)', 'Estado'],
        scopedCharges.map((ch) => [
          ch.code,
          ch.companyName,
          ch.description,
          ch.dueDate,
          ch.paymentMethodType,
          ch.amount,
          ch.status,
        ]),
      );
    } else if (activeTab === 'usuarios_hbac') {
      exportRowsToCsv(
        `relatorio-allin-usuarios-alocacao-${scope}.csv`,
        ['Nome', 'E-mail', 'Papel / Função', 'Unidade', 'Status na Cota (10 Grátis)', 'Custo Licença Extra (BRL)'],
        userAllocationRows.map((u) => [
          u.name,
          u.email,
          u.roleLabel,
          u.companyName,
          u.quotaBadgeText,
          u.monthlyLicenseCost,
        ]),
      );
    } else {
      exportRowsToCsv(
        `relatorio-allin-governanca-sla-${scope}.csv`,
        ['Protocolo', 'Assunto', 'Empresa', 'Prioridade', 'SLA Vencimento', 'Estado'],
        scopedTickets.map((tk) => [
          tk.code,
          tk.subject,
          tk.companyName,
          tk.priority,
          tk.slaDueAt,
          tk.status,
        ]),
      );
    }
    notify({ type: 'success', title: 'Relatório do All In exportado em CSV com sucesso!' });
  };

  const handlePrintExecutiveA4 = () => {
    window.print();
    notify({
      type: 'info',
      title: 'Relatório Executivo do All In preparado para Impressão / PDF A4.',
    });
  };

  return (
    <div className="flex flex-col gap-2.5">
      <PageHeader
        breadcrumbs={[
          { label: scope === 'global' ? t('scope.global') : company?.tradeName || 'Empresa' },
          { label: t('nav.reports') },
        ]}
        title="Relatórios Executivos do All In — Empresas, Módulos, Contratos, Faturamento SaaS & HBAC"
        subtitle={`MRR Consolidado: ${formatCurrency(totalMrr, 'BRL', session.language)}/mês • Equipe Alocada: ${totalAllocatedStaff} (${totalExtraStaff} licenças extras) • Liquidado: ${formatCurrency(paidSum, 'BRL', session.language)} • Pendente: ${formatCurrency(pendingSum, 'BRL', session.language)} • Vencido: ${formatCurrency(overdueSum, 'BRL', session.language)}`}
        scopeBadge={scope === 'global' ? t('scope.global') : company?.tradeName}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {scope === 'global' && (
              <select
                id="rep-branch-select"
                aria-label="Escopo de Consolidação"
                className="form-select"
                style={{ width: 'auto', minWidth: '185px', padding: '0.32rem 0.6rem', fontSize: '0.75rem' }}
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
              >
                <option value="ALL">Todas as Matrizes e Filiais ({companies.length})</option>
                {sortCompaniesHierarchically(companies).map((c) => (
                  <option key={c.id} value={c.id}>
                    {!c.isBranch ? `[MATRIZ] ${c.tradeName}` : `└─ [FILIAL ${c.branchCode || ''}] ${c.tradeName}`}
                  </option>
                ))}
              </select>
            )}
            <select
              id="rep-period-select"
              aria-label="Recorte Temporal"
              className="form-select"
              style={{ width: 'auto', minWidth: '140px', padding: '0.32rem 0.6rem', fontSize: '0.75rem' }}
              value={periodPreset}
              onChange={(e) => setPeriodPreset(e.target.value as typeof periodPreset)}
            >
              <option value="all">Todo o Histórico</option>
              <option value="month">Competência Mensal</option>
              <option value="quarter">Último Trimestre</option>
              <option value="year">Exercício 2026</option>
            </select>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handlePrintExecutiveA4}>
              <Printer size={14} />
              Imprimir A4
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleExportAnalyticsCsv}>
              <Download size={14} />
              Exportar CSV da Aba
            </button>
          </div>
        }
      />

      {/* Guias Padronizadas dos 6 Relatórios Oficiais do All In */}
      <nav className="subnav-tabs" aria-label="Relatórios do Ecossistema Olivelas All In">
        <button
          type="button"
          className={`subnav-tab ${activeTab === 'empresas_licencas' ? 'active' : ''}`}
          onClick={() => setActiveTab('empresas_licencas')}
        >
          1. Empresas, Filiais &amp; Cota de Equipe ({scopedCompanies.length})
        </button>
        <button
          type="button"
          className={`subnav-tab ${activeTab === 'modulos_ecossistema' ? 'active' : ''}`}
          onClick={() => setActiveTab('modulos_ecossistema')}
        >
          2. Receita &amp; Adoção por Módulo All In ({modules.length})
        </button>
        <button
          type="button"
          className={`subnav-tab ${activeTab === 'contratos_assinaturas' ? 'active' : ''}`}
          onClick={() => setActiveTab('contratos_assinaturas')}
        >
          3. Contratos SaaS &amp; Assinaturas ({scopedContracts.length})
        </button>
        <button
          type="button"
          className={`subnav-tab ${activeTab === 'financeiro_cobrancas' ? 'active' : ''}`}
          onClick={() => setActiveTab('financeiro_cobrancas')}
        >
          4. Faturamento, Cobranças &amp; Inadimplência ({scopedCharges.length})
        </button>
        <button
          type="button"
          className={`subnav-tab ${activeTab === 'usuarios_hbac' ? 'active' : ''}`}
          onClick={() => setActiveTab('usuarios_hbac')}
        >
          5. Usuários, Alocação &amp; HBAC ({userAllocationRows.length})
        </button>
        <button
          type="button"
          className={`subnav-tab ${activeTab === 'governanca_sla' ? 'active' : ''}`}
          onClick={() => setActiveTab('governanca_sla')}
        >
          6. Chamados SLA, API Hub &amp; Auditoria ({scopedTickets.length})
        </button>
      </nav>

      {/* ABA 1: EMPRESAS (MATRIZ & FILIAIS), COTA DE 10 FUNCIONÁRIOS GRÁTIS & MRR */}
      {activeTab === 'empresas_licencas' && (
        <UrlDataTable<CompanyEntity>
          tableId="report-allin-companies-table"
          caption="Relatório consolidado de Empresas (Matrizes e Filiais), franquia de 10 funcionários grátis, licenças excedentes e MRR no All In"
          items={scopedCompanies}
          defaultSortField=""
          csvFilename="relatorio-allin-empresas-filiais-licencas.csv"
          searchPlaceholder="Buscar por Matriz, Filial, titular, plano ou CNPJ..."
          statusExtractor={(c) => c.operationalStatus}
          searchExtractor={(c) => {
            const info = companySummariesMap.get(c.id);
            return `${c.id} ${c.tradeName} ${c.legalName} ${c.branchCode || ''} ${
              info?.lic.parentCompanyName || ''
            } ${info?.lic.adminOwnerName || ''} ${info?.lic.planName || ''}`;
          }}
          statusOptions={[
            { value: 'active', label: t('status.active') },
            { value: 'pending', label: t('status.pending') },
            { value: 'suspended', label: t('status.suspended') },
          ]}
          isArchivedExtractor={(c) => c.archiveMetadata.isArchived}
          columns={[
            {
              key: 'tradeName',
              header: 'Unidade (Matriz / Filial)',
              width: '25%',
              csvValue: (c) => `${c.isBranch ? '[FILIAL] ' : '[MATRIZ] '}${c.tradeName}`,
              render: (c) => {
                const info = companySummariesMap.get(c.id);
                return (
                  <div
                    style={{
                      paddingLeft: c.isBranch ? '0.65rem' : 0,
                      borderLeft: c.isBranch ? '2px solid var(--accent-primary)' : 'none',
                    }}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`badge ${c.isBranch ? 'badge-info' : 'badge-teal'}`}>
                        {c.isBranch ? '└─ FILIAL' : 'MATRIZ'}
                      </span>
                      <Link
                        to={`/app/global/empresas/${c.id}`}
                        className="font-semibold text-sm"
                        style={{ color: 'var(--accent-primary)' }}
                      >
                        {c.tradeName}
                      </Link>
                    </div>
                    <div className="text-xs text-muted truncate mt-0.5">
                      <code>{c.branchCode || c.id}</code> •{' '}
                      {c.isBranch && info?.lic.parentCompanyName ? (
                        <>
                          Matriz Pai: <strong>{info.lic.parentCompanyName}</strong>
                        </>
                      ) : (
                        <>
                          {c.legalName} ({info?.lic.childBranchesCount || 0} filiais)
                        </>
                      )}
                    </div>
                  </div>
                );
              },
            },
            {
              key: 'planAndModules',
              header: 'Plano Contratado & Titular',
              width: '20%',
              csvValue: (c) => companySummariesMap.get(c.id)?.lic.planName || '',
              render: (c) => {
                const info = companySummariesMap.get(c.id);
                return (
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-xs">{info?.lic.planName}</span>
                    <span className="text-xs text-muted">
                      Titular: <strong>{info?.lic.adminOwnerName}</strong> •{' '}
                      {info?.lic.activeModulesCount || 0} mód. ativos
                    </span>
                  </div>
                );
              },
            },
            {
              key: 'quota',
              header: `Equipe & Cota (${billingRules.defaultFreeEmployeesPerStore} Grátis)`,
              width: '21%',
              csvValue: (c) => {
                const info = companySummariesMap.get(c.id);
                return `${info?.lic.activeEmployeesCount || 0}/${info?.lic.freeLimit || 10} grátis (+${
                  info?.lic.extraEmployeesCount || 0
                } extras)`;
              },
              render: (c) => {
                const info = companySummariesMap.get(c.id);
                if (!info) return null;
                return (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="badge badge-neutral tabular">
                        {info.lic.activeEmployeesCount} / {info.lic.freeLimit} grátis
                      </span>
                      {info.lic.extraEmployeesCount > 0 ? (
                        <span className="badge badge-warning">
                          +{info.lic.extraEmployeesCount} extra = +
                          {formatCurrency(info.lic.extraLicensesMonthlyCost, 'BRL', session.language)}
                        </span>
                      ) : (
                        <span className="badge badge-success">Dentro da Cota</span>
                      )}
                    </div>
                    <span className="text-xs text-muted">
                      Base: {formatCurrency(info.lic.basePlanMonthlyCost, 'BRL', session.language)}/mês
                    </span>
                  </div>
                );
              },
            },
            {
              key: 'mrr',
              header: 'MRR Mensal Total',
              width: '13%',
              isNumeric: true,
              csvValue: (c) => companySummariesMap.get(c.id)?.lic.totalMonthlyBilling || 0,
              render: (c) => {
                const info = companySummariesMap.get(c.id);
                return (
                  <div>
                    <div className="font-bold tabular text-sm">
                      {formatCurrency(info?.lic.totalMonthlyBilling || 0, 'BRL', session.language)}/mês
                    </div>
                    <span className="badge badge-neutral uppercase text-xs">
                      {info?.lic.preferredPaymentMethod || 'pix'}
                    </span>
                  </div>
                );
              },
            },
            {
              key: 'financialStatus',
              header: 'Liquidado vs. Em Aberto',
              width: '13%',
              isNumeric: true,
              csvValue: (c) => companySummariesMap.get(c.id)?.paidTotal || 0,
              render: (c) => {
                const info = companySummariesMap.get(c.id);
                return (
                  <div className="tabular text-xs">
                    <div className="font-semibold" style={{ color: 'var(--status-success)' }}>
                      Pago: {formatCurrency(info?.paidTotal || 0, 'BRL', session.language)}
                    </div>
                    {(info?.overdueTotal || 0) > 0 ? (
                      <div className="font-bold" style={{ color: 'var(--status-danger)' }}>
                        Vencido: {formatCurrency(info?.overdueTotal || 0, 'BRL', session.language)}
                      </div>
                    ) : (
                      <div className="text-muted">
                        Pend.: {formatCurrency(info?.pendingTotal || 0, 'BRL', session.language)}
                      </div>
                    )}
                  </div>
                );
              },
            },
            {
              key: 'actions',
              header: 'Ações',
              width: '8%',
              isNumeric: true,
              render: (c) => (
                <ActionDropdownMenu
                  label="Ações"
                  items={[
                    {
                      id: 'open-company',
                      label: 'Abrir Ficha da Empresa',
                      icon: <Building2 size={14} />,
                      variant: 'primary',
                      onClick: () => navigate(`/app/global/empresas/${c.id}`),
                    },
                    {
                      id: 'edit-company',
                      label: 'Editar Empresa & Equipe (ID Único)',
                      icon: <Users size={14} />,
                      onClick: () => navigate(`/app/global/empresas/${c.id}/editar`),
                    },
                    {
                      id: 'company-finance',
                      label: 'Ver Pagamentos & Contratos',
                      icon: <CreditCard size={14} />,
                      onClick: () => navigate(`/app/global/empresas/${c.id}/financeiro`),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      )}

      {/* ABA 2: CATÁLOGO DE MÓDULOS DO ECOSSISTEMA ALL IN & RECEITA POR PLATAFORMA */}
      {activeTab === 'modulos_ecossistema' && (
        <UrlDataTable<CatalogModuleEntity>
          tableId="report-allin-modules-table"
          caption="Relatório de adoção comercial, schemas PostgreSQL dedicados e receita recorrente por módulo do ecossistema Olivelas All In"
          items={modules}
          defaultSortField="code"
          csvFilename="relatorio-allin-modulos-receita.csv"
          searchPlaceholder="Buscar por módulo comercial, código, schema PostgreSQL ou categoria..."
          statusExtractor={(m) => m.commercialStatus}
          searchExtractor={(m) =>
            `${m.code} ${m.name['pt-BR']} ${m.description['pt-BR']} ${m.dbSchema || ''} ${m.category}`
          }
          statusOptions={[
            { value: 'active', label: t('status.active') },
            { value: 'beta', label: 'Beta' },
            { value: 'legacy', label: 'Legado' },
          ]}
          isArchivedExtractor={(m) => m.archiveMetadata.isArchived}
          columns={[
            {
              key: 'code',
              header: 'Código & Schema SQL',
              width: '18%',
              sortable: true,
              csvValue: (m) => `${m.code} (${m.dbSchema || 'public'})`,
              render: (m) => (
                <div className="flex flex-col gap-1">
                  <code className="text-xs font-semibold mono">{m.code}</code>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className={`badge ${m.isExample ? 'badge-warning' : 'badge-teal'}`}>
                      {m.isExample ? 'Módulo Base' : `schema: ${m.dbSchema || m.code}`}
                    </span>
                  </div>
                </div>
              ),
            },
            {
              key: 'name',
              header: 'Plataforma / Módulo All In',
              width: '30%',
              sortable: true,
              csvValue: (m) => m.name[session.language],
              render: (m) => (
                <div className="flex flex-col gap-0.5">
                  <Link
                    to={`/app/global/modulos/${m.id}`}
                    className="font-semibold text-sm"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    {m.name[session.language]}
                  </Link>
                  <span className="text-xs text-muted truncate">{m.description[session.language]}</span>
                </div>
              ),
            },
            {
              key: 'priceMonthly',
              header: 'Preço de Tabela (Mensal / Anual)',
              width: '16%',
              isNumeric: true,
              sortable: true,
              csvValue: (m) => m.priceMonthly,
              render: (m) => (
                <div className="tabular text-xs">
                  <div className="font-semibold">
                    {formatCurrency(m.priceMonthly, m.currency, session.language)}/mês
                  </div>
                  <div className="text-muted">
                    {formatCurrency(m.priceYearly, m.currency, session.language)}/ano
                  </div>
                </div>
              ),
            },
            {
              key: 'subscribers',
              header: 'Empresas Assinantes Ativas',
              width: '16%',
              csvValue: (m) => moduleStatsMap.get(m.id)?.activeCount || 0,
              render: (m) => {
                const st = moduleStatsMap.get(m.id);
                return (
                  <div className="flex flex-col gap-0.5">
                    <div>
                      <span className="badge badge-info">{st?.activeCount || 0} empresa(s) ativa(s)</span>
                    </div>
                    <span className="text-xs text-muted truncate">
                      {st && st.subscriberNames.length > 0
                        ? st.subscriberNames.join(', ')
                        : 'Disponível para contratação'}
                    </span>
                  </div>
                );
              },
            },
            {
              key: 'monthlyRevenue',
              header: 'MRR Contratado',
              width: '12%',
              isNumeric: true,
              csvValue: (m) => moduleStatsMap.get(m.id)?.monthlyRevenue || 0,
              render: (m) => {
                const st = moduleStatsMap.get(m.id);
                return (
                  <span className="font-bold tabular text-sm" style={{ color: 'var(--status-success)' }}>
                    {formatCurrency(st?.monthlyRevenue || 0, 'BRL', session.language)}/mês
                  </span>
                );
              },
            },
            {
              key: 'actions',
              header: 'Ações',
              width: '8%',
              isNumeric: true,
              render: (m) => (
                <ActionDropdownMenu
                  label="Ações"
                  items={[
                    {
                      id: 'view-mod',
                      label: 'Ficha Técnica do Módulo',
                      icon: <Package size={14} />,
                      variant: 'primary',
                      onClick: () => navigate(`/app/global/modulos/${m.id}`),
                    },
                    {
                      id: 'edit-mod',
                      label: 'Editar Preço & Limites (ID Único)',
                      icon: <TrendingUp size={14} />,
                      onClick: () => navigate(`/app/global/modulos/${m.id}/editar`),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      )}

      {/* ABA 3: CONTRATOS SAAS, VIGÊNCIAS & ASSINATURAS ELETRÔNICAS */}
      {activeTab === 'contratos_assinaturas' && (
        <UrlDataTable<ContractEntity>
          tableId="report-allin-contracts-table"
          caption="Relatório de contratos comerciais, aditivos, vigência e assinatura eletrônica SHA-256 no All In"
          items={scopedContracts}
          defaultSortField="createdAt"
          csvFilename="relatorio-allin-contratos-assinaturas.csv"
          searchPlaceholder="Buscar por código do contrato, empresa, plano ou signatário..."
          statusExtractor={(ct) => ct.status}
          searchExtractor={(ct) =>
            `${ct.code} ${ct.planName} ${ct.companyName} ${ct.signatures[0]?.signerName || ''}`
          }
          statusOptions={[
            { value: 'active', label: t('status.active') },
            { value: 'pending_signature', label: t('status.pending_signature') },
            { value: 'draft', label: t('status.draft') },
            { value: 'expired', label: t('status.expired') },
          ]}
          isArchivedExtractor={(ct) => ct.archiveMetadata.isArchived}
          columns={[
            {
              key: 'code',
              header: 'Contrato & Versão',
              width: '22%',
              sortable: true,
              csvValue: (ct) => `${ct.code} - ${ct.planName}`,
              render: (ct) => (
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link
                      to={`/app/global/contratos/${ct.id}`}
                      className="font-semibold text-sm"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      {ct.code}
                    </Link>
                    <span className="badge badge-neutral">v{ct.version}</span>
                  </div>
                  <span className="text-xs text-muted truncate">{ct.planName}</span>
                </div>
              ),
            },
            {
              key: 'companyName',
              header: 'Empresa Contratante',
              width: '20%',
              sortable: true,
              render: (ct) => (
                <div className="flex flex-col gap-0.5">
                  <Link to={`/app/global/empresas/${ct.companyId}`} className="font-semibold text-xs">
                    {ct.companyName}
                  </Link>
                  <span className="text-xs text-muted mono">
                    {ct.moduleIds.length} módulo(s) vinculado(s)
                  </span>
                </div>
              ),
            },
            {
              key: 'startDate',
              header: 'Ciclo & Vigência Contratual',
              width: '18%',
              render: (ct) => (
                <div className="text-xs tabular">
                  <div>
                    <span className="badge badge-info uppercase">{ct.billingCycle}</span>
                  </div>
                  <div className="text-muted mt-0.5">
                    {ct.startDate} até {ct.endDate}
                  </div>
                </div>
              ),
            },
            {
              key: 'signatures',
              header: 'Assinatura Eletrônica & Hash',
              width: '19%',
              render: (ct) =>
                ct.signatures[0] ? (
                  <div className="text-xs">
                    <div className="font-semibold" style={{ color: 'var(--status-success)' }}>
                      Assinado por {ct.signatures[0].signerName}
                    </div>
                    <div className="text-muted mono truncate">
                      {formatDateTime(ct.signatures[0].signedAt, session.language)}
                    </div>
                  </div>
                ) : (
                  <span className="badge badge-warning">Aguardando Assinatura</span>
                ),
            },
            {
              key: 'finalValue',
              header: 'Valor & Estado',
              width: '13%',
              isNumeric: true,
              sortable: true,
              render: (ct) => (
                <div className="tabular">
                  <div className="font-bold text-sm">
                    {formatCurrency(ct.finalValue, ct.currency, session.language)}
                  </div>
                  <StatusBadge status={ct.status} />
                </div>
              ),
            },
            {
              key: 'actions',
              header: 'Ações',
              width: '8%',
              isNumeric: true,
              render: (ct) => (
                <ActionDropdownMenu
                  label="Ações"
                  items={[
                    {
                      id: 'view-contract',
                      label: 'Abrir Instrumento Contratual A4',
                      icon: <FileSignature size={14} />,
                      variant: 'primary',
                      onClick: () => navigate(`/app/global/contratos/${ct.id}`),
                    },
                    {
                      id: 'edit-contract',
                      label: 'Editar Contrato (ID Único)',
                      icon: <ScrollText size={14} />,
                      onClick: () => navigate(`/app/global/contratos/${ct.id}/editar`),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      )}

      {/* ABA 4: FATURAMENTO SAAS, COBRANÇAS, INADIMPLÊNCIA & MEIOS DE PAGAMENTO */}
      {activeTab === 'financeiro_cobrancas' && (
        <UrlDataTable<ChargeEntity>
          tableId="report-allin-charges-table"
          caption="Relatório financeiro de cobranças, faturas SaaS, meios de pagamento e inadimplência no All In"
          items={scopedCharges}
          defaultSortField="dueDate"
          csvFilename="relatorio-allin-financeiro-cobrancas.csv"
          searchPlaceholder="Buscar por código da fatura, empresa, meio de pagamento ou descrição..."
          statusExtractor={(ch) => ch.status}
          searchExtractor={(ch) =>
            `${ch.code} ${ch.companyName} ${ch.description} ${ch.paymentMethodType}`
          }
          statusOptions={[
            { value: 'paid', label: t('status.paid') },
            { value: 'pending', label: t('status.pending') },
            { value: 'overdue', label: t('status.overdue') },
          ]}
          isArchivedExtractor={(ch) => ch.archiveMetadata.isArchived}
          columns={[
            {
              key: 'code',
              header: 'Fatura & Descrição',
              width: '26%',
              sortable: true,
              render: (ch) => (
                <div className="flex flex-col gap-0.5">
                  <Link
                    to={`/app/global/financeiro/cobrancas/${ch.id}/editar`}
                    className="font-semibold text-sm mono"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    {ch.code}
                  </Link>
                  <span className="text-xs text-muted truncate">{ch.description}</span>
                </div>
              ),
            },
            {
              key: 'companyName',
              header: 'Empresa (Matriz / Filial)',
              width: '22%',
              sortable: true,
              render: (ch) => {
                const comp = companies.find((c) => c.id === ch.companyId);
                return (
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`badge ${comp?.isBranch ? 'badge-info' : 'badge-teal'}`}>
                        {comp?.isBranch ? '└─ FILIAL' : 'MATRIZ'}
                      </span>
                      <Link
                        to={`/app/global/empresas/${ch.companyId}`}
                        className="font-semibold text-xs"
                      >
                        {ch.companyName}
                      </Link>
                    </div>
                  </div>
                );
              },
            },
            {
              key: 'paymentMethodType',
              header: 'Canal / Gateway de Liquidação',
              width: '18%',
              render: (ch) => {
                const pm = paymentMethods.find((m) => m.type === ch.paymentMethodType);
                return (
                  <div className="flex flex-col gap-0.5">
                    <div>
                      <span className="badge badge-neutral uppercase">{ch.paymentMethodType}</span>
                    </div>
                    <span className="text-xs text-muted">
                      {pm ? `${pm.providerName} (Taxa ${pm.feePercentage}%)` : 'Liquidação Direta'}
                    </span>
                  </div>
                );
              },
            },
            {
              key: 'dueDate',
              header: 'Vencimento & Parcelas',
              width: '14%',
              sortable: true,
              render: (ch) => (
                <div className="tabular text-xs">
                  <div className="font-semibold mono">{ch.dueDate}</div>
                  <div className="text-muted">Parcelado em {ch.installmentTotal}x</div>
                </div>
              ),
            },
            {
              key: 'amount',
              header: 'Valor & Status',
              width: '12%',
              isNumeric: true,
              sortable: true,
              render: (ch) => (
                <div className="tabular">
                  <div className="font-bold text-sm">
                    {formatCurrency(ch.amount, ch.currency, session.language)}
                  </div>
                  <StatusBadge status={ch.status} />
                </div>
              ),
            },
            {
              key: 'actions',
              header: 'Ações',
              width: '8%',
              isNumeric: true,
              render: (ch) => (
                <ActionDropdownMenu
                  label="Ações"
                  items={[
                    {
                      id: 'edit-charge',
                      label: 'Editar Cobrança (ID Único)',
                      icon: <CreditCard size={14} />,
                      variant: 'primary',
                      onClick: () => navigate(`/app/global/financeiro/cobrancas/${ch.id}/editar`),
                    },
                    {
                      id: 'open-finance',
                      label: 'Ir para Financeiro & Conciliação',
                      icon: <BarChart3 size={14} />,
                      onClick: () => navigate('/app/global/financeiro/cobrancas'),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      )}

      {/* ABA 5: USUÁRIOS, ALOCAÇÃO MULTIEMPRESA (COTA 10 GRÁTIS) & PAPÉIS HBAC */}
      {activeTab === 'usuarios_hbac' && (
        <UrlDataTable<AllInUserAllocationReportRow>
          tableId="report-allin-users-hbac-table"
          caption="Relatório de identidades, colaboradores alocados nas Matrizes e Filiais, franquia de 10 funcionários grátis e papéis HBAC no All In"
          items={userAllocationRows}
          defaultSortField=""
          csvFilename="relatorio-allin-usuarios-alocacao-hbac.csv"
          searchPlaceholder="Buscar por colaborador, e-mail, papel HBAC, Matriz ou Filial..."
          statusExtractor={(u) => u.quotaStatus}
          searchExtractor={(u) =>
            `${u.name} ${u.email} ${u.roleLabel} ${u.companyName} ${u.department} ${u.quotaBadgeText}`
          }
          statusOptions={[
            { value: 'FREE', label: 'Dentro da Cota Gratuita (10 Grátis)' },
            { value: 'EXTRA', label: 'Licença Excedente Cobrada' },
            { value: 'GLOBAL', label: 'Escopo Global HBAC' },
            { value: 'INACTIVE', label: 'Inativo / Pausado' },
          ]}
          isArchivedExtractor={(u) => u.archiveMetadata.isArchived}
          columns={[
            {
              key: 'name',
              header: 'Usuário / Colaborador Alocado',
              width: '25%',
              render: (u) => (
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-sm">{u.name}</span>
                  <span className="text-xs text-muted mono">{u.email}</span>
                </div>
              ),
            },
            {
              key: 'roleLabel',
              header: 'Papel HBAC / Função Operacional',
              width: '22%',
              render: (u) => (
                <div className="flex flex-col gap-0.5">
                  <span className="badge badge-info">{u.roleLabel}</span>
                  <span className="text-xs text-muted">{u.department}</span>
                </div>
              ),
            },
            {
              key: 'companyName',
              header: 'Unidade Vinculada (Matriz / Filial)',
              width: '24%',
              render: (u) => (
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`badge ${
                        u.companyId === 'global'
                          ? 'badge-neutral'
                          : u.isBranch
                            ? 'badge-info'
                            : 'badge-teal'
                      }`}
                    >
                      {u.companyId === 'global'
                        ? 'GLOBAL'
                        : u.isBranch
                          ? `└─ FILIAL ${u.branchCode}`
                          : 'MATRIZ'}
                    </span>
                    <span className="font-semibold text-xs">{u.companyName}</span>
                  </div>
                  {u.isBranch && u.parentCompanyName && (
                    <span className="text-xs text-muted">
                      Matriz Pai: <strong>{u.parentCompanyName}</strong>
                    </span>
                  )}
                </div>
              ),
            },
            {
              key: 'quotaBadgeText',
              header: 'Enquadramento na Cota (10 Grátis)',
              width: '21%',
              render: (u) => (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`badge ${
                      u.quotaStatus === 'EXTRA'
                        ? 'badge-warning'
                        : u.quotaStatus === 'FREE'
                          ? 'badge-success'
                          : 'badge-teal'
                    }`}
                  >
                    {u.quotaBadgeText}
                  </span>
                </div>
              ),
            },
            {
              key: 'actions',
              header: 'Ações',
              width: '8%',
              isNumeric: true,
              render: (u) => (
                <ActionDropdownMenu
                  label="Ações"
                  items={[
                    ...(u.id.startsWith('usr-')
                      ? [
                          {
                            id: 'edit-usr',
                            label: 'Editar Usuário & HBAC (ID Único)',
                            icon: <ShieldCheck size={14} />,
                            variant: 'primary' as const,
                            onClick: () => navigate(`/app/global/usuarios/${u.id}/editar`),
                          },
                        ]
                      : [
                          {
                            id: 'edit-comp-staff',
                            label: 'Gerenciar Equipe na Empresa',
                            icon: <Building2 size={14} />,
                            variant: 'primary' as const,
                            onClick: () => navigate(`/app/global/empresas/${u.companyId}/editar`),
                          },
                        ]),
                  ]}
                />
              ),
            },
          ]}
        />
      )}

      {/* ABA 6: GOVERNANÇA OPERACIONAL — CHAMADOS SLA, API HUB & AUDITORIA FORENSE */}
      {activeTab === 'governanca_sla' && (
        <UrlDataTable<TicketEntity>
          tableId="report-allin-governance-tickets-table"
          caption={`Relatório de SLA de Chamados (${scopedTickets.length}), Conectores API Hub (${apiServices.length} serviços) e Trilha de Auditoria (${auditEvents.length} eventos)`}
          items={scopedTickets}
          defaultSortField="createdAt"
          csvFilename="relatorio-allin-chamados-sla.csv"
          searchPlaceholder="Buscar por protocolo de chamado, assunto, empresa ou responsável..."
          statusExtractor={(tk) => tk.status}
          searchExtractor={(tk) =>
            `${tk.code} ${tk.subject} ${tk.companyName} ${tk.assignedToUserName || ''} ${tk.priority}`
          }
          statusOptions={[
            { value: 'open', label: t('status.open') },
            { value: 'in_progress', label: t('status.in_progress') },
            { value: 'resolved', label: t('status.resolved') },
          ]}
          isArchivedExtractor={(tk) => tk.archiveMetadata.isArchived}
          columns={[
            {
              key: 'code',
              header: 'Protocolo & Assunto do Chamado',
              width: '28%',
              sortable: true,
              render: (tk) => (
                <div className="flex flex-col gap-0.5">
                  <Link
                    to={`/app/global/tickets/${tk.id}`}
                    className="font-semibold text-sm mono"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    {tk.code} — {tk.subject}
                  </Link>
                  <span className="text-xs text-muted truncate">{tk.description}</span>
                </div>
              ),
            },
            {
              key: 'companyName',
              header: 'Empresa Solicitante',
              width: '20%',
              render: (tk) => (
                <div className="flex flex-col gap-0.5">
                  <Link to={`/app/global/empresas/${tk.companyId}`} className="font-semibold text-xs">
                    {tk.companyName}
                  </Link>
                  <span className="text-xs text-muted">
                    Atendente: {tk.assignedToUserName || 'Fila Global'}
                  </span>
                </div>
              ),
            },
            {
              key: 'priority',
              header: 'Prioridade & Prazo SLA',
              width: '22%',
              render: (tk) => (
                <div className="flex flex-col gap-0.5">
                  <div>
                    <StatusBadge status={tk.priority} />
                  </div>
                  <span className="text-xs text-muted mono">
                    Meta SLA: {formatDateTime(tk.slaDueAt, session.language)}
                  </span>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Estado Operacional',
              width: '14%',
              render: (tk) => <StatusBadge status={tk.status} />,
            },
            {
              key: 'actions',
              header: 'Ações',
              width: '8%',
              isNumeric: true,
              render: (tk) => (
                <ActionDropdownMenu
                  label="Ações"
                  items={[
                    {
                      id: 'open-ticket',
                      label: 'Abrir Atendimento & Histórico',
                      icon: <LifeBuoy size={14} />,
                      variant: 'primary',
                      onClick: () => navigate(`/app/global/tickets/${tk.id}`),
                    },
                    {
                      id: 'edit-ticket',
                      label: 'Editar Chamado (ID Único)',
                      icon: <ScrollText size={14} />,
                      onClick: () => navigate(`/app/global/tickets/${tk.id}/editar`),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      )}
    </div>
  );
};
