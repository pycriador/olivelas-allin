import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Building2,
  CreditCard,
  Download,
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
import { ModalDialog, PageHeader, StatusBadge } from '../../components/shared/SharedComponents';
import { exportRowsToCsv } from '../../services/operationalUtils';
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

export const CompanyDashboardPage: React.FC = () => {
  const { empresaId } = useParams<{ empresaId: string }>();
  const {
    companies,
    modules,
    companyModules,
    contracts,
    charges,
    tickets,
    auditEvents,
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

  return (
    <div className="flex flex-col gap-4">
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
          <span className="kpi-meta">de {modules.length} disponíveis no catálogo</span>
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

      {/* Active Modules Grid */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 style={{ fontSize: '1rem' }}>Módulos Ativos para {company.tradeName}</h2>
            <p className="text-xs text-muted">
              A navegação lateral e as rotas deste ambiente refletem exatamente os módulos contratados e
              suas permissões HBAC.
            </p>
          </div>
          <Link to={`/app/empresa/${company.id}/modulos`} className="btn btn-secondary btn-sm">
            Catálogo e Contratação
          </Link>
        </div>
        <div className="card-body">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '0.85rem',
            }}
          >
            {mySubs.map((sub) => {
              const mod = modules.find((m) => m.id === sub.moduleId);
              if (!mod) return null;
              let targetRoute = `/app/empresa/${company.id}/modulos`;
              if (!mod.isExample) {
                targetRoute = `/app/empresa/${company.id}/ecossistema/${mod.ecosystemSlug || mod.code}`;
              } else {
                if (mod.code === 'allin_estoque') targetRoute = `/app/empresa/${company.id}/operacao/estoque`;
                if (mod.code === 'allin_vendas') targetRoute = `/app/empresa/${company.id}/operacao/vendas`;
                if (mod.code === 'allin_crm') targetRoute = `/app/empresa/${company.id}/operacao/crm`;
                if (mod.code === 'allin_financeiro') targetRoute = `/app/empresa/${company.id}/financeiro`;
                if (mod.code === 'allin_equipe') targetRoute = `/app/empresa/${company.id}/papeis`;
                if (mod.code === 'allin_contratos') targetRoute = `/app/empresa/${company.id}/contratos`;
                if (mod.code === 'allin_suporte') targetRoute = `/app/empresa/${company.id}/tickets`;
                if (mod.code === 'allin_analytics') targetRoute = `/app/empresa/${company.id}/relatorios`;
              }

              return (
                <div
                  key={sub.id}
                  className="card card-interactive"
                  style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem' }}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`badge ${mod.isExample ? 'badge-warning' : 'badge-info'}`}>
                        {mod.isExample ? 'Exemplo Base' : mod.dbSchema ? `schema: ${mod.dbSchema}` : 'Olivelas Comercial'}
                      </span>
                      <StatusBadge status={sub.status} />
                    </div>
                    <strong className="block mt-2" style={{ fontSize: '0.98rem' }}>
                      {mod.name[session.language]}
                    </strong>
                    <p className="text-xs text-muted mt-1">{mod.description[session.language]}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <span className="text-xs text-muted tabular">
                      {formatCurrency(sub.agreedPrice, sub.currency, session.language)}/mês
                    </span>
                    <Link to={targetRoute} className="btn btn-primary btn-sm">
                      Abrir Interface <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

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
  | 'saas_finance'
  | 'abc_pareto'
  | 'valuation'
  | 'demand_turnover'
  | 'crm_ltv'
  | 'modules_sla';

export const ReportsAnalyticsPage: React.FC<{ scope: 'global' | 'company' }> = ({ scope }) => {
  const { empresaId } = useParams<{ empresaId: string }>();
  const {
    companies,
    modules,
    companyModules,
    contracts,
    charges,
    tickets,
    operationalItems,
    auditEvents,
    session,
    hasPermission,
    notify,
    t,
  } = useApp();

  const targetCompanyId = scope === 'company' ? empresaId : undefined;
  const company = targetCompanyId ? companies.find((c) => c.id === targetCompanyId) : null;

  const [activeTab, setActiveTab] = useState<AnalyticsReportTab>('saas_finance');
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
  const effectiveCompanyFilter = targetCompanyId || (selectedBranchId !== 'ALL' ? selectedBranchId : undefined);

  const scopedCompanies = effectiveCompanyFilter
    ? companies.filter((c) => c.id === effectiveCompanyFilter && !c.archiveMetadata.isArchived)
    : sortCompaniesHierarchically(companies.filter((c) => !c.archiveMetadata.isArchived));

  const scopedSubs = effectiveCompanyFilter
    ? companyModules.filter((s) => s.companyId === effectiveCompanyFilter)
    : companyModules;
  const scopedCharges = effectiveCompanyFilter
    ? charges.filter((c) => c.companyId === effectiveCompanyFilter && !c.archiveMetadata.isArchived)
    : charges.filter((c) => !c.archiveMetadata.isArchived);
  const scopedTickets = effectiveCompanyFilter
    ? tickets.filter((tk) => tk.companyId === effectiveCompanyFilter && !tk.archiveMetadata.isArchived)
    : tickets.filter((tk) => !tk.archiveMetadata.isArchived);
  const scopedAudit = effectiveCompanyFilter
    ? auditEvents.filter((ae) => ae.companyId === effectiveCompanyFilter)
    : auditEvents;
  const scopedItems = effectiveCompanyFilter
    ? operationalItems.filter((it) => it.companyId === effectiveCompanyFilter && !it.archiveMetadata.isArchived)
    : operationalItems.filter((it) => !it.archiveMetadata.isArchived);

  // 1. SaaS Finance & Employee License Breakdown per Company
  const companyFinancialRows = scopedCompanies.map((comp) => {
    const lic = computeCompanyLicenseSummary(comp, companies, billingRules, companyModules, contracts);
    const compContracts = contracts.filter((ct) => ct.companyId === comp.id && ct.status === 'active');
    const compPaid = charges
      .filter((ch) => ch.companyId === comp.id && ch.status === 'paid')
      .reduce((a, b) => a + b.amount, 0);
    const compPending = charges
      .filter((ch) => ch.companyId === comp.id && ch.status === 'pending')
      .reduce((a, b) => a + b.amount, 0);
    const compOverdue = charges
      .filter((ch) => ch.companyId === comp.id && ch.status === 'overdue')
      .reduce((a, b) => a + b.amount, 0);

    return {
      comp,
      lic,
      contractsCount: compContracts.length,
      paidTotal: compPaid,
      pendingTotal: compPending,
      overdueTotal: compOverdue,
    };
  });

  // 2. Inventory Items for Valuation, Pareto ABC & Turnover
  const inventoryItems = scopedItems.filter((it) => it.moduleType === 'inventory');
  const orderItems = scopedItems.filter((it) => it.moduleType === 'orders');
  const crmItems = scopedItems.filter((it) => it.moduleType === 'crm');

  const valuationRows = inventoryItems.map((it) => {
    const unitSale = it.amount;
    const unitCost = Math.round(unitSale * 0.58 * 100) / 100;
    const totalSaleValue = unitSale * it.quantity;
    const totalCostValue = unitCost * it.quantity;
    const projectedMargin = totalSaleValue - totalCostValue;
    const marginPct = totalSaleValue > 0 ? Math.round((projectedMargin / totalSaleValue) * 100) : 42;
    const compName = companies.find((c) => c.id === it.companyId)?.tradeName || it.companyId;
    return {
      ...it,
      compName,
      unitCost,
      unitSale,
      totalCostValue,
      totalSaleValue,
      projectedMargin,
      marginPct,
    };
  });

  // 3. Pareto ABC Curve Calculation
  const sortedByValue = [...valuationRows].sort((a, b) => b.totalSaleValue - a.totalSaleValue);
  const grandTotalInventorySale = sortedByValue.reduce((acc, r) => acc + r.totalSaleValue, 0) || 1;
  let cumulativeAcc = 0;
  const abcRows = sortedByValue.map((r) => {
    const sharePct = (r.totalSaleValue / grandTotalInventorySale) * 100;
    cumulativeAcc += sharePct;
    const abcClass: 'A' | 'B' | 'C' =
      cumulativeAcc <= 80 ? 'A' : cumulativeAcc <= 95 ? 'B' : 'C';
    const directive =
      abcClass === 'A'
        ? 'Classe A (Alta Prioridade — Reposição Contínua & Estoque de Segurança Rigoroso)'
        : abcClass === 'B'
          ? 'Classe B (Giro Intermediário — Revisão Quinzenal de Ponto de Pedido)'
          : 'Classe C (Cauda Longa — Reposição sob Demanda / Liquidação Promocional)';
    return {
      ...r,
      sharePct: Math.round(sharePct * 10) / 10,
      cumulativePct: Math.min(100, Math.round(cumulativeAcc * 10) / 10),
      abcClass,
      directive,
    };
  });

  // 4. Demand, Turnover & Reorder Suggestion
  const demandRows = valuationRows.map((r, idx) => {
    const avgDailyDemand = Math.max(0.5, Math.round(((r.quantity * 0.12) + (idx + 1) * 0.4) * 10) / 10);
    const coverageDays = Math.round(r.quantity / avgDailyDemand);
    const minSafetyStock = Math.ceil(avgDailyDemand * 15);
    const suggestedPurchase = Math.max(0, minSafetyStock * 2 - r.quantity);
    const gmroi = r.totalCostValue > 0 ? Math.round((r.projectedMargin / r.totalCostValue) * 100) / 100 : 1.72;
    return {
      ...r,
      avgDailyDemand,
      coverageDays,
      minSafetyStock,
      suggestedPurchase,
      gmroi,
    };
  });

  // 5. Module Breakdown
  const moduleBreakdown = modules.map((mod) => {
    const activeSubs = scopedSubs.filter(
      (s) => s.moduleId === mod.id && s.status === 'active',
    );
    const revenue = activeSubs.reduce((acc, s) => acc + s.agreedPrice, 0);
    return {
      code: mod.code,
      name: mod.name[session.language],
      category: mod.category,
      activeCount: activeSubs.length,
      revenue,
    };
  });

  const handleExportAnalyticsCsv = () => {
    if (activeTab === 'saas_finance') {
      exportRowsToCsv(
        `relatorio-faturamento-licencas-${scope}.csv`,
        ['Empresa', 'Tipo', 'Funcionários Alocados', 'Cota Grátis', 'Licenças Extras', 'Mensalidade Total (BRL)', 'Liquidado (BRL)', 'Em Atraso (BRL)'],
        companyFinancialRows.map((r) => [
          r.comp.tradeName,
          !r.comp.isBranch ? 'Matriz' : `Filial ${r.comp.branchCode || ''}`,
          r.lic.activeEmployeesCount,
          r.lic.freeLimit,
          r.lic.extraEmployeesCount,
          r.lic.totalMonthlyBilling,
          r.paidTotal,
          r.overdueTotal,
        ]),
      );
    } else if (activeTab === 'abc_pareto') {
      exportRowsToCsv(
        `relatorio-curva-abc-${scope}.csv`,
        ['SKU', 'Produto', 'Empresa', 'Qtd', 'Valor Total Venda', '% Participação', '% Acumulado', 'Classe ABC', 'Diretriz'],
        abcRows.map((r) => [
          r.code,
          r.title,
          r.compName,
          r.quantity,
          r.totalSaleValue,
          r.sharePct,
          r.cumulativePct,
          r.abcClass,
          r.directive,
        ]),
      );
    } else if (activeTab === 'valuation') {
      exportRowsToCsv(
        `relatorio-valuation-estoque-${scope}.csv`,
        ['SKU', 'Produto', 'Empresa', 'Saldo Qtd', 'Custo Total (BRL)', 'Venda Projetada (BRL)', 'Margem Bruta (BRL)', 'Margem %'],
        valuationRows.map((r) => [
          r.code,
          r.title,
          r.compName,
          r.quantity,
          r.totalCostValue,
          r.totalSaleValue,
          r.projectedMargin,
          r.marginPct,
        ]),
      );
    } else {
      exportRowsToCsv(
        `analytics-${scope}-${targetCompanyId || 'global'}.csv`,
        ['Código Módulo', 'Módulo', 'Categoria', 'Assinaturas Ativas', 'Receita Contratada (BRL)'],
        moduleBreakdown.map((m) => [m.code, m.name, m.category, m.activeCount, m.revenue]),
      );
    }
    notify({ type: 'success', title: 'Relatório CSV exportado com sucesso!' });
  };

  const handlePrintExecutiveA4 = () => {
    window.print();
    notify({
      type: 'info',
      title: 'Demonstrativo Executivo preparado para Impressão / PDF A4.',
    });
  };

  const totalGrossInventorySale = valuationRows.reduce((a, b) => a + b.totalSaleValue, 0);
  const totalGrossInventoryCost = valuationRows.reduce((a, b) => a + b.totalCostValue, 0);

  const paidSum = scopedCharges
    .filter((c) => c.status === 'paid')
    .reduce((a, b) => a + b.amount, 0);
  const pendingSum = scopedCharges
    .filter((c) => c.status === 'pending')
    .reduce((a, b) => a + b.amount, 0);
  const overdueSum = scopedCharges
    .filter((c) => c.status === 'overdue')
    .reduce((a, b) => a + b.amount, 0);

  return (
    <div className="flex flex-col gap-2.5">
      <PageHeader
        breadcrumbs={[
          { label: scope === 'global' ? t('scope.global') : company?.tradeName || 'Empresa' },
          { label: t('nav.reports') },
        ]}
        title="Allin Analytics — Relatórios Gerenciais, Financeiro SaaS, Curva ABC & Valuation"
        subtitle={`Liquidado: ${formatCurrency(paidSum, 'BRL', session.language)} • Pendente: ${formatCurrency(pendingSum, 'BRL', session.language)} • Vencido: ${formatCurrency(overdueSum, 'BRL', session.language)} • Valuation Estoque: ${formatCurrency(totalGrossInventorySale, 'BRL', session.language)} (${inventoryItems.length} SKUs)`}
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
                    {!c.isBranch ? `[MATRIZ] ${c.tradeName}` : `[FILIAL ${c.branchCode || ''}] ${c.tradeName}`}
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
              <option value="month">Mês Atual</option>
              <option value="quarter">Último Trimestre</option>
              <option value="year">Exercício 2026</option>
            </select>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handlePrintExecutiveA4}>
              <Printer size={14} />
              Imprimir A4
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleExportAnalyticsCsv}>
              <Download size={14} />
              Exportar CSV
            </button>
          </div>
        }
      />

      {/* Sub-navigation Tabs for the 6 Executive & Operational Reports */}
      <div className="subnav-tabs" role="tablist" aria-label="Abas de Relatórios Analíticos">
        <button
          type="button"
          className={`subnav-tab ${activeTab === 'saas_finance' ? 'active' : ''}`}
          onClick={() => setActiveTab('saas_finance')}
        >
          1. Receita SaaS &amp; Licenças ({companyFinancialRows.length})
        </button>
        <button
          type="button"
          className={`subnav-tab ${activeTab === 'abc_pareto' ? 'active' : ''}`}
          onClick={() => setActiveTab('abc_pareto')}
        >
          2. Curva ABC de Pareto ({abcRows.length})
        </button>
        <button
          type="button"
          className={`subnav-tab ${activeTab === 'valuation' ? 'active' : ''}`}
          onClick={() => setActiveTab('valuation')}
        >
          3. Valuation &amp; Margem ({valuationRows.length})
        </button>
        <button
          type="button"
          className={`subnav-tab ${activeTab === 'demand_turnover' ? 'active' : ''}`}
          onClick={() => setActiveTab('demand_turnover')}
        >
          4. Giro &amp; Compra Sugerida ({demandRows.length})
        </button>
        <button
          type="button"
          className={`subnav-tab ${activeTab === 'crm_ltv' ? 'active' : ''}`}
          onClick={() => setActiveTab('crm_ltv')}
        >
          5. Clientes, LTV &amp; Pedidos ({crmItems.length + orderItems.length})
        </button>
        <button
          type="button"
          className={`subnav-tab ${activeTab === 'modules_sla' ? 'active' : ''}`}
          onClick={() => setActiveTab('modules_sla')}
        >
          6. Adoção por Módulo ({moduleBreakdown.length})
        </button>
      </div>

      {/* TAB 1: SaaS Revenue, 10 Free Employees Quota & Delinquency per Company */}
      {activeTab === 'saas_finance' && (
        <div className="card url-data-table-card">
          <div className="card-header">
            <div>
              <h2 style={{ fontSize: '0.92rem' }}>
                Demonstrativo Financeiro por Empresa (Matriz / Filial) &amp; Alocação de Funcionários (10 Grátis)
              </h2>
              <p className="text-xs text-muted">
                Cálculo consolidado de mensalidade base, franquia gratuita de {billingRules.defaultFreeEmployeesPerStore} funcionários por empresa e cobrança de licenças excedentes.
              </p>
            </div>
            <span className="badge badge-teal">{companyFinancialRows.length} unidade(s)</span>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Empresa (Matriz / Filial)</th>
                  <th>Equipe &amp; Franquia ({billingRules.defaultFreeEmployeesPerStore} Grátis)</th>
                  <th className="num">Mensalidade + Extras</th>
                  <th className="num">Liquidado</th>
                  <th className="num">Pendente / Atraso</th>
                </tr>
              </thead>
              <tbody>
                {companyFinancialRows.map(({ comp, lic, paidTotal, pendingTotal, overdueTotal }) => (
                  <tr key={comp.id}>
                    <td>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`badge ${!comp.isBranch ? 'badge-info' : 'badge-teal'}`}>
                          {!comp.isBranch ? 'MATRIZ' : `FILIAL ${comp.branchCode || ''}`}
                        </span>
                        <Link to={`/app/global/empresas/${comp.id}`} className="font-semibold">
                          {comp.tradeName}
                        </Link>
                      </div>
                      <div className="text-xs text-muted mono">{comp.taxId}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="badge badge-neutral">
                          {lic.activeEmployeesCount} alocado(s) ({Math.min(lic.activeEmployeesCount, lic.freeLimit)}/{lic.freeLimit} grátis)
                        </span>
                        {lic.extraEmployeesCount > 0 ? (
                          <span className="badge badge-warning">
                            +{lic.extraEmployeesCount} extra(s) ({formatCurrency(lic.extraLicensesMonthlyCost, 'BRL', session.language)})
                          </span>
                        ) : (
                          <span className="badge badge-success">Isento de Extras</span>
                        )}
                      </div>
                    </td>
                    <td className="num font-semibold tabular">
                      {formatCurrency(lic.totalMonthlyBilling, 'BRL', session.language)}/mês
                    </td>
                    <td className="num tabular" style={{ color: 'var(--status-success)' }}>
                      {formatCurrency(paidTotal, 'BRL', session.language)}
                    </td>
                    <td className="num tabular">
                      <div>{formatCurrency(pendingTotal, 'BRL', session.language)} pend.</div>
                      {overdueTotal > 0 && (
                        <div className="text-xs font-bold" style={{ color: 'var(--status-danger)' }}>
                          {formatCurrency(overdueTotal, 'BRL', session.language)} vencido
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Pareto ABC Curve */}
      {activeTab === 'abc_pareto' && (
        <div className="card url-data-table-card">
          <div className="card-header">
            <div>
              <h2 style={{ fontSize: '0.92rem' }}>
                Curva ABC de Pareto (Classificação 80% A / 15% B / 5% C &amp; Diretriz Estratégica)
              </h2>
              <p className="text-xs text-muted">
                Ordenação decrescente por impacto financeiro no estoque para priorização de capital de giro e reposição.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="badge badge-success">
                Classe A: {abcRows.filter((r) => r.abcClass === 'A').length}
              </span>
              <span className="badge badge-info">
                Classe B: {abcRows.filter((r) => r.abcClass === 'B').length}
              </span>
              <span className="badge badge-neutral">
                Classe C: {abcRows.filter((r) => r.abcClass === 'C').length}
              </span>
            </div>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Classe</th>
                  <th>SKU / Produto &amp; Unidade</th>
                  <th className="num">Saldo</th>
                  <th className="num">Valor Total Venda</th>
                  <th className="num">% Part. / Acum.</th>
                  <th>Diretriz de Gestão de Estoque</th>
                </tr>
              </thead>
              <tbody>
                {abcRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span
                        className={`badge ${
                          row.abcClass === 'A'
                            ? 'badge-success'
                            : row.abcClass === 'B'
                              ? 'badge-info'
                              : 'badge-neutral'
                        } font-bold`}
                      >
                        Classe {row.abcClass}
                      </span>
                    </td>
                    <td>
                      <div className="font-semibold">{row.title}</div>
                      <div className="text-xs text-muted mono">
                        {row.code} • {row.compName}
                      </div>
                    </td>
                    <td className="num tabular">{row.quantity} un</td>
                    <td className="num font-semibold tabular">
                      {formatCurrency(row.totalSaleValue, 'BRL', session.language)}
                    </td>
                    <td className="num tabular text-xs">
                      <strong>{row.sharePct}%</strong>
                      <div className="text-muted">Acum: {row.cumulativePct}%</div>
                    </td>
                    <td className="text-xs text-muted">{row.directive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Inventory Valuation & Projected Gross Margin */}
      {activeTab === 'valuation' && (
        <div className="card url-data-table-card">
          <div className="card-header">
            <div>
              <h2 style={{ fontSize: '0.92rem' }}>
                Valuation Físico-Financeiro de Estoque, Custo Imobilizado &amp; Margem Bruta Projetada
              </h2>
              <p className="text-xs text-muted">
                Comparativo entre capital investido a preço de custo e potencial de realização a preço de venda.
              </p>
            </div>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU / Produto</th>
                  <th>Unidade / Categoria</th>
                  <th className="num">Saldo</th>
                  <th className="num">Custo Imobilizado</th>
                  <th className="num">Valuation Venda</th>
                  <th className="num">Margem Projetada</th>
                </tr>
              </thead>
              <tbody>
                {valuationRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="font-semibold">{row.title}</div>
                      <code className="text-xs text-muted">{row.code}</code>
                    </td>
                    <td>
                      <div className="text-xs font-medium">{row.compName}</div>
                      <span className="badge badge-neutral text-xs">{row.category}</span>
                    </td>
                    <td className="num tabular">{row.quantity} un</td>
                    <td className="num tabular">
                      {formatCurrency(row.totalCostValue, 'BRL', session.language)}
                    </td>
                    <td className="num font-semibold tabular">
                      {formatCurrency(row.totalSaleValue, 'BRL', session.language)}
                    </td>
                    <td className="num tabular">
                      <span className="badge badge-success">
                        +{formatCurrency(row.projectedMargin, 'BRL', session.language)} ({row.marginPct}%)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Demand, Coverage in Days, GMROI & Purchase Suggestion */}
      {activeTab === 'demand_turnover' && (
        <div className="card url-data-table-card">
          <div className="card-header">
            <div>
              <h2 style={{ fontSize: '0.92rem' }}>
                Análise de Demanda Diária, Cobertura de Estoque (Dias), GMROI &amp; Sugestão de Compra
              </h2>
              <p className="text-xs text-muted">
                Previsão de ruptura baseada no giro médio e recomendação automática de reposição para 30 dias.
              </p>
            </div>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU / Produto</th>
                  <th className="num">Saldo Atual</th>
                  <th className="num">Demanda / Dia</th>
                  <th className="num">Cobertura</th>
                  <th className="num">GMROI</th>
                  <th className="num">Sugestão de Compra</th>
                </tr>
              </thead>
              <tbody>
                {demandRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="font-semibold">{row.title}</div>
                      <div className="text-xs text-muted mono">
                        {row.code} • {row.compName}
                      </div>
                    </td>
                    <td className="num tabular">{row.quantity} un</td>
                    <td className="num tabular">{row.avgDailyDemand} un/dia</td>
                    <td className="num tabular">
                      <span
                        className={`badge ${
                          row.coverageDays < 15
                            ? 'badge-danger'
                            : row.coverageDays < 30
                              ? 'badge-warning'
                              : 'badge-success'
                        }`}
                      >
                        {row.coverageDays} dias
                      </span>
                    </td>
                    <td className="num mono text-xs">{row.gmroi}x</td>
                    <td className="num tabular font-semibold">
                      {row.suggestedPurchase > 0 ? (
                        <span className="badge badge-warning">Comprar +{row.suggestedPurchase} un</span>
                      ) : (
                        <span className="badge badge-teal">Estoque Saudável</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: CRM Customers, LTV & Commercial Orders */}
      {activeTab === 'crm_ltv' && (
        <div className="card url-data-table-card">
          <div className="card-header">
            <div>
              <h2 style={{ fontSize: '0.92rem' }}>
                Carteira de Clientes CRM, LTV Projetado &amp; Pedidos Comerciais Faturados
              </h2>
              <p className="text-xs text-muted">
                Visão unificada de contas B2B/B2C e pedidos registrados nos módulos operacionais das empresas.
              </p>
            </div>
            <span className="badge badge-info">
              {crmItems.length} conta(s) CRM • {orderItems.length} pedido(s)
            </span>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código / Tipo</th>
                  <th>Cliente / Pedido</th>
                  <th>Etapa / Canal</th>
                  <th className="num">Volume / Licenças</th>
                  <th className="num">LTV / Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {[...crmItems, ...orderItems].map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className={`badge ${item.moduleType === 'crm' ? 'badge-teal' : 'badge-info'} uppercase`}>
                        {item.moduleType}
                      </span>
                      <div className="mono text-xs mt-0.5">{item.code}</div>
                    </td>
                    <td className="font-semibold">{item.title}</td>
                    <td>
                      <span className="badge badge-neutral">{item.category}</span>
                    </td>
                    <td className="num tabular">{item.quantity}</td>
                    <td className="num font-semibold tabular">
                      {formatCurrency(item.amount, 'BRL', session.language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: Commercial Module Adoption (original table preserved + enhanced) */}
      {activeTab === 'modules_sla' && (
        <div className="card url-data-table-card">
          <div className="card-header">
            <h2 style={{ fontSize: '0.92rem' }}>Desempenho e Adoção por Módulo Comercial ({moduleBreakdown.length} módulos)</h2>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Módulo Comercial</th>
                  <th>Categoria</th>
                  <th className="num">Assinaturas Ativas</th>
                  <th className="num">Valor Contratado Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {moduleBreakdown.map((row) => (
                  <tr key={row.code}>
                    <td>
                      <code className="text-xs">{row.code}</code>
                    </td>
                    <td className="font-semibold">{row.name}</td>
                    <td>
                      <span className="badge">{row.category}</span>
                    </td>
                    <td className="num tabular">{row.activeCount}</td>
                    <td className="num font-semibold tabular">
                      {formatCurrency(row.revenue, 'BRL', session.language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
