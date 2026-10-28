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
  ScrollText,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateTime } from '../../i18n/translations';
import { ModalDialog, PageHeader, StatusBadge } from '../../components/shared/SharedComponents';
import { exportRowsToCsv } from '../../services/operationalUtils';

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
              if (mod.code === 'allin_estoque') targetRoute = `/app/empresa/${company.id}/operacao/estoque`;
              if (mod.code === 'allin_vendas') targetRoute = `/app/empresa/${company.id}/operacao/vendas`;
              if (mod.code === 'allin_crm') targetRoute = `/app/empresa/${company.id}/operacao/crm`;
              if (mod.code === 'allin_financeiro') targetRoute = `/app/empresa/${company.id}/financeiro`;
              if (mod.code === 'allin_equipe') targetRoute = `/app/empresa/${company.id}/papeis`;
              if (mod.code === 'allin_contratos') targetRoute = `/app/empresa/${company.id}/contratos`;
              if (mod.code === 'allin_suporte') targetRoute = `/app/empresa/${company.id}/tickets`;
              if (mod.code === 'allin_analytics') targetRoute = `/app/empresa/${company.id}/relatorios`;

              return (
                <div
                  key={sub.id}
                  className="card"
                  style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.6rem' }}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <strong>{mod.name[session.language]}</strong>
                      <StatusBadge status={sub.status} />
                    </div>
                    <p className="text-xs text-muted mt-2">{mod.description[session.language]}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <span className="text-xs text-muted tabular">
                      Renovação: {sub.renewalDate}
                    </span>
                    <Link to={targetRoute} className="text-xs font-semibold flex items-center gap-1">
                      Acessar <ArrowRight size={12} />
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

export const ReportsAnalyticsPage: React.FC<{ scope: 'global' | 'company' }> = ({ scope }) => {
  const { empresaId } = useParams<{ empresaId: string }>();
  const {
    companies,
    modules,
    companyModules,
    charges,
    tickets,
    auditEvents,
    session,
    hasPermission,
    t,
  } = useApp();

  const targetCompanyId = scope === 'company' ? empresaId : undefined;
  const company = targetCompanyId ? companies.find((c) => c.id === targetCompanyId) : null;

  if (!hasPermission('reports', 'view', targetCompanyId)) {
    return (
      <div className="card card-body">
        Sem permissão HBAC para visualizar relatórios analíticos.
      </div>
    );
  }

  const scopedSubs = targetCompanyId
    ? companyModules.filter((s) => s.companyId === targetCompanyId)
    : companyModules;
  const scopedCharges = targetCompanyId
    ? charges.filter((c) => c.companyId === targetCompanyId && !c.archiveMetadata.isArchived)
    : charges.filter((c) => !c.archiveMetadata.isArchived);
  const scopedTickets = targetCompanyId
    ? tickets.filter((tk) => tk.companyId === targetCompanyId && !tk.archiveMetadata.isArchived)
    : tickets.filter((tk) => !tk.archiveMetadata.isArchived);
  const scopedAudit = targetCompanyId
    ? auditEvents.filter((ae) => ae.companyId === targetCompanyId)
    : auditEvents;

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
    exportRowsToCsv(
      `analytics-${scope}-${targetCompanyId || 'global'}.csv`,
      ['Código Módulo', 'Módulo', 'Categoria', 'Assinaturas Ativas', 'Receita Contratada (BRL)'],
      moduleBreakdown.map((m) => [m.code, m.name, m.category, m.activeCount, m.revenue]),
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: scope === 'global' ? t('scope.global') : company?.tradeName || 'Empresa' },
          { label: t('nav.reports') },
        ]}
        title="Allin Analytics — Relatórios e Indicadores Operacionais"
        subtitle="Indicadores calculados em tempo real sobre os dados persistidos localmente no IndexedDB."
        scopeBadge={scope === 'global' ? t('scope.global') : company?.tradeName}
        actions={
          <button type="button" className="btn btn-primary btn-sm" onClick={handleExportAnalyticsCsv}>
            <Download size={14} />
            Exportar Relatório Analítico (CSV)
          </button>
        }
      />

      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Total Faturado (Liquidado)</span>
          <span className="kpi-value">
            {formatCurrency(
              scopedCharges
                .filter((c) => c.status === 'paid')
                .reduce((a, b) => a + b.amount, 0),
              'BRL',
              session.language,
            )}
          </span>
          <span className="kpi-meta">
            {scopedCharges.filter((c) => c.status === 'paid').length} cobrança(s) paga(s)
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Faturamento Pendente / A Vencer</span>
          <span className="kpi-value">
            {formatCurrency(
              scopedCharges
                .filter((c) => c.status === 'pending')
                .reduce((a, b) => a + b.amount, 0),
              'BRL',
              session.language,
            )}
          </span>
          <span className="kpi-meta">
            {scopedCharges.filter((c) => c.status === 'pending').length} cobrança(s) pendente(s)
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Inadimplência (Vencido)</span>
          <span className="kpi-value" style={{ color: 'var(--status-danger)' }}>
            {formatCurrency(
              scopedCharges
                .filter((c) => c.status === 'overdue')
                .reduce((a, b) => a + b.amount, 0),
              'BRL',
              session.language,
            )}
          </span>
          <span className="kpi-meta">
            {scopedCharges.filter((c) => c.status === 'overdue').length} fatura(s) em atraso
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Eventos Auditados no Escopo</span>
          <span className="kpi-value">{scopedAudit.length}</span>
          <span className="kpi-meta">
            {scopedTickets.length} chamado(s) registrado(s)
          </span>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: '1rem' }}>Desempenho e Adoção por Módulo Comercial</h2>
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
    </div>
  );
};
