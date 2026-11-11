import React, { useMemo, useState } from 'react';
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  Archive,
  ArrowLeft,
  Building2,
  CheckCircle2,
  CreditCard,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  FileText,
  GitBranch,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  ChargeEntity,
  CompanyEntity,
  CurrencyCode,
  InstallmentEntity,
  PaymentMethodConfigEntity,
  PaymentMethodType,
  PaymentRecordEntity,
  PaymentStatus,
  PlatformBillingRules,
} from '../../types/domain';
import { generateId, recordAuditEvent, repositories } from '../../repositories/repositories';
import { formatCurrency, formatDateTime } from '../../i18n/translations';
import { exportRowsToCsv } from '../../services/operationalUtils';
import {
  AccessDeniedView,
  ActionDropdownMenu,
  ArchiveRecordDialog,
  ModalDialog,
  PageHeader,
  StatusBadge,
  UrlDataTable,
} from '../../components/shared/SharedComponents';
import {
  computeCompanyLicenseSummary,
  getPlatformBillingRules,
  savePlatformBillingRules,
  sortCompaniesHierarchically,
} from '../../services/enterpriseFinanceAndContractsService';

export type FinanceTab = 'overview' | 'cobrancas' | 'pagamentos' | 'parcelas' | 'conciliacao' | 'relatorios';

export const FinanceHubPage: React.FC<{ scope: 'global' | 'company'; activeTab: FinanceTab }> = ({
  scope,
  activeTab,
}) => {
  const { empresaId } = useParams<{ empresaId: string }>();
  const navigate = useNavigate();
  const {
    companies,
    contracts,
    charges,
    payments,
    installments,
    session,
    hasPermission,
    isModuleSubscribed,
    getActor,
    refreshData,
    notify,
    t,
  } = useApp();

  const targetCompanyId = scope === 'company' ? empresaId : undefined;
  const company = targetCompanyId ? companies.find((c) => c.id === targetCompanyId) : null;
  const baseRoute =
    scope === 'global' ? '/app/global/financeiro' : `/app/empresa/${empresaId}/financeiro`;

  const [newChargeOpen, setNewChargeOpen] = useState(false);
  const [chargeCompanyId, setChargeCompanyId] = useState(
    targetCompanyId || companies[0]?.id || 'emp-olivelas-matriz',
  );
  const [chargeDescription, setChargeDescription] = useState('');
  const [chargeAmount, setChargeAmount] = useState(1250);
  const [chargeDueDate, setChargeDueDate] = useState('2026-11-25');
  const [chargeMethod, setChargeMethod] = useState<PaymentMethodType>('pix');
  const [chargeInstallments, setChargeInstallments] = useState(1);

  const [archiveChargeTarget, setArchiveChargeTarget] = useState<ChargeEntity | null>(null);
  const [reconcileTarget, setReconcileTarget] = useState<ChargeEntity | null>(null);
  const [reconcileRefCode, setReconcileRefCode] = useState('E1823612020261028AUTH774');
  const [reconcileNotes, setReconcileNotes] = useState(
    'Liquidação confirmada via conciliação bancária auditada no Supabase PostgreSQL.',
  );

  if (!hasPermission('finance', 'view', targetCompanyId)) {
    return (
      <AccessDeniedView
        reason="Seu papel atual não possui permissão para visualizar ou operar o módulo Financeiro."
        requiredPermission="finance:view"
      />
    );
  }

  if (scope === 'company' && targetCompanyId && !isModuleSubscribed(targetCompanyId, 'allin_financeiro')) {
    return (
      <AccessDeniedView
        reason="A empresa selecionada não possui o módulo comercial Allin Financeiro contratado e ativo."
        requiredPermission="module:allin_financeiro"
      />
    );
  }

  const scopedCharges = targetCompanyId
    ? charges.filter((c) => c.companyId === targetCompanyId)
    : charges;
  const scopedPayments = targetCompanyId
    ? payments.filter((p) => p.companyId === targetCompanyId)
    : payments;
  const scopedInstallments = targetCompanyId
    ? installments.filter((i) => i.companyId === targetCompanyId)
    : installments;

  const activeCharges = scopedCharges.filter((c) => !c.archiveMetadata.isArchived);
  const totalPaid = activeCharges
    .filter((c) => c.status === 'paid')
    .reduce((acc, c) => acc + c.amount, 0);
  const totalPending = activeCharges
    .filter((c) => c.status === 'pending' || c.status === 'processing')
    .reduce((acc, c) => acc + c.amount, 0);
  const totalOverdue = activeCharges
    .filter((c) => c.status === 'overdue')
    .reduce((acc, c) => acc + c.amount, 0);

  const handleCreateCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetComp = companies.find((c) => c.id === chargeCompanyId);
    if (!targetComp) return;
    const activeContract = contracts.find(
      (ctr) => ctr.companyId === targetComp.id && !ctr.archiveMetadata.isArchived,
    );
    const newId = generateId('chg');
    const code = `FAT-2026-${String(charges.length + 1001)}`;
    const now = new Date().toISOString();

    const newCharge: ChargeEntity = {
      id: newId,
      code,
      companyId: targetComp.id,
      companyName: targetComp.legalName,
      contractId: activeContract?.id || 'ctr-avulso',
      description: chargeDescription.trim() || 'Cobrança Operacional Modular Allin',
      amount: Number(chargeAmount),
      currency: targetComp.currency,
      dueDate: chargeDueDate,
      status: 'pending',
      paymentMethodType: chargeMethod,
      installmentTotal: Number(chargeInstallments),
      reconciled: false,
      createdAt: now,
      updatedAt: now,
      archiveMetadata: { isArchived: false },
      changeHistory: [],
    };

    await repositories.charges.create(
      newCharge,
      getActor(targetComp.id),
      `Emissão de nova cobrança ${code} para ${targetComp.tradeName} (${formatCurrency(newCharge.amount, newCharge.currency, session.language)}).`,
    );

    const totalInst = Math.max(1, Number(chargeInstallments));
    const perInstAmount = Math.round((Number(chargeAmount) / totalInst) * 100) / 100;
    for (let idx = 1; idx <= totalInst; idx++) {
      await repositories.installments.upsert({
        id: generateId('inst'),
        chargeId: newId,
        chargeCode: code,
        companyId: targetComp.id,
        companyName: targetComp.legalName,
        installmentNumber: idx,
        totalInstallments: totalInst,
        amount: perInstAmount,
        currency: targetComp.currency,
        dueDate: chargeDueDate,
        status: 'pending',
      });
    }

    await refreshData();
    setNewChargeOpen(false);
    setChargeDescription('');
    notify({
      type: 'success',
      title: `Cobrança ${code} emitida com ${totalInst} parcela(s).`,
    });
  };

  const handleConfirmReconciliation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcileTarget) return;
    const actor = getActor(reconcileTarget.companyId);
    const now = new Date().toISOString();

    await repositories.charges.update(
      reconcileTarget.id,
      (curr) => ({
        ...curr,
        status: 'paid' as PaymentStatus,
        reconciled: true,
        reconciledAt: now,
        reconciledBy: actor.userName,
      }),
      actor,
      `Conciliação e liquidação auditada da cobrança ${reconcileTarget.code} (Ref: ${reconcileRefCode}).`,
      'reconcile_payment',
    );

    const payId = generateId('pay');
    const newPayment: PaymentRecordEntity = {
      id: payId,
      chargeId: reconcileTarget.id,
      chargeCode: reconcileTarget.code,
      companyId: reconcileTarget.companyId,
      companyName: reconcileTarget.companyName,
      amountPaid: reconcileTarget.amount,
      currency: reconcileTarget.currency,
      paidAt: now,
      methodType: reconcileTarget.paymentMethodType,
      referenceCode: reconcileRefCode.trim() || `SIM-REF-${Date.now()}`,
      notes: reconcileNotes.trim(),
      reconciled: true,
      createdAt: now,
      updatedAt: now,
      archiveMetadata: { isArchived: false },
      changeHistory: [],
    };
    await repositories.payments.create(
      newPayment,
      actor,
      `Registro de pagamento conciliado para fatura ${reconcileTarget.code}.`,
    );

    const relatedInst = installments.filter((i) => i.chargeId === reconcileTarget.id);
    for (const inst of relatedInst) {
      await repositories.installments.upsert({
        ...inst,
        status: 'paid',
        paidAt: now,
      });
    }

    await refreshData();
    setReconcileTarget(null);
    notify({
      type: 'success',
      title: `Fatura ${reconcileTarget.code} conciliada e liquidada com auditoria registrada.`,
    });
  };

  return (
    <div className="flex flex-col gap-2.5">
      <PageHeader
        breadcrumbs={[
          {
            label: scope === 'global' ? t('scope.global') : company?.tradeName || 'Empresa',
            to: scope === 'global' ? '/app/global' : `/app/empresa/${empresaId}`,
          },
          { label: t('nav.finance'), to: baseRoute },
          { label: activeTab.toUpperCase() },
        ]}
        title="Gestão Financeira, Cobranças, Parcelas & Conciliação"
        subtitle={`Recebido: ${formatCurrency(totalPaid, company?.currency || 'BRL', session.language)} • A vencer: ${formatCurrency(totalPending, company?.currency || 'BRL', session.language)} • Vencido: ${formatCurrency(totalOverdue, company?.currency || 'BRL', session.language)} • ${scopedPayments.length} pagamento(s) conciliado(s)`}
        scopeBadge={scope === 'global' ? t('scope.global') : company?.tradeName}
        actions={
          <div className="flex items-center gap-2">
            {scope === 'global' && hasPermission('payment_methods', 'view') && (
              <Link to="/app/global/meios-pagamento" className="btn btn-secondary btn-sm">
                <CreditCard size={14} />
                Meios de Pagamento
              </Link>
            )}
            {hasPermission('finance', 'create', targetCompanyId) && (
              <Link to={`${baseRoute}/cobrancas/nova`} className="btn btn-primary btn-sm">
                <Plus size={14} />
                Emitir Cobrança
              </Link>
            )}
          </div>
        }
      />

      <nav className="subnav-tabs" aria-label="Subnavegação financeira">
        <NavLink to={baseRoute} end className={({ isActive }) => `subnav-tab ${isActive ? 'active' : ''}`}>
          Visão Consolidada
        </NavLink>
        <NavLink
          to={`${baseRoute}/cobrancas`}
          className={({ isActive }) => `subnav-tab ${isActive ? 'active' : ''}`}
        >
          Cobranças ({scopedCharges.length})
        </NavLink>
        <NavLink
          to={`${baseRoute}/pagamentos`}
          className={({ isActive }) => `subnav-tab ${isActive ? 'active' : ''}`}
        >
          Pagamentos ({scopedPayments.length})
        </NavLink>
        <NavLink
          to={`${baseRoute}/parcelas`}
          className={({ isActive }) => `subnav-tab ${isActive ? 'active' : ''}`}
        >
          Parcelas ({scopedInstallments.length})
        </NavLink>
        {scope === 'global' && (
          <NavLink
            to={`${baseRoute}/conciliacao`}
            className={({ isActive }) => `subnav-tab ${isActive ? 'active' : ''}`}
          >
            Conciliação & Inadimplência
          </NavLink>
        )}
        <NavLink
          to={`${baseRoute}/relatorios`}
          className={({ isActive }) => `subnav-tab ${isActive ? 'active' : ''}`}
        >
          Relatórios Financeiros
        </NavLink>
      </nav>

      {(activeTab === 'overview' || activeTab === 'cobrancas' || activeTab === 'conciliacao') && (
        <UrlDataTable<ChargeEntity>
          tableId={`charges-table-${scope}-${activeTab}`}
          caption="Livro de cobranças, faturas contratuais e estado de conciliação"
          items={
            activeTab === 'conciliacao'
              ? scopedCharges.filter((c) => !c.reconciled || c.status === 'overdue')
              : scopedCharges
          }
          defaultSortField="dueDate"
          csvFilename={`cobrancas-${scope}.csv`}
          searchPlaceholder="Buscar por código da fatura, empresa, descrição ou método..."
          statusExtractor={(c) => c.status}
          searchExtractor={(c) => `${c.code} ${c.companyName} ${c.description} ${c.paymentMethodType}`}
          statusOptions={[
            { value: 'paid', label: t('status.paid') },
            { value: 'pending', label: t('status.pending') },
            { value: 'overdue', label: t('status.overdue') },
            { value: 'archived', label: t('status.archived') },
          ]}
          isArchivedExtractor={(c) => c.archiveMetadata.isArchived}
          columns={[
            {
              key: 'code',
              header: 'Fatura / Empresa',
              sortable: true,
              width: '24%',
              csvValue: (c) => `${c.code} - ${c.companyName}`,
              render: (c) => (
                <div>
                  <Link
                    to={`${baseRoute}/cobrancas/${c.id}/editar`}
                    className="mono font-semibold"
                    style={{ color: 'var(--brand-primary)' }}
                  >
                    {c.code}
                  </Link>
                  <div className="text-xs text-muted truncate">{c.companyName}</div>
                </div>
              ),
            },
            {
              key: 'description',
              header: 'Descrição / Contrato',
              width: '30%',
              render: (c) => (
                <div>
                  <div className="text-sm font-medium truncate">{c.description}</div>
                  <code className="text-xs text-muted">Contrato: {c.contractId}</code>
                </div>
              ),
            },
            {
              key: 'amount',
              header: 'Valor / Parcelas',
              sortable: true,
              width: '18%',
              csvValue: (c) => c.amount,
              render: (c) => (
                <div>
                  <div className="font-semibold tabular">
                    {formatCurrency(c.amount, c.currency, session.language)}
                  </div>
                  <div className="text-xs text-muted">
                    {c.installmentTotal}x • {c.paymentMethodType.toUpperCase()}
                  </div>
                </div>
              ),
            },
            {
              key: 'dueDate',
              header: 'Vencimento / Status',
              sortable: true,
              width: '20%',
              csvValue: (c) => `${c.dueDate} (${c.status})`,
              render: (c) => (
                <div className="flex flex-col gap-0.5">
                  <span className="mono text-xs">{c.dueDate}</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    <StatusBadge status={c.status} />
                    {c.reconciled && <span className="badge badge-teal">Conciliado</span>}
                  </div>
                </div>
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
                      id: 'edit-charge',
                      label: 'Editar & Conciliar Fatura (ID Único)',
                      icon: <Edit3 size={14} />,
                      variant: 'primary',
                      onClick: () => navigate(`${baseRoute}/cobrancas/${c.id}/editar`),
                    },
                    ...(!c.reconciled &&
                    !c.archiveMetadata.isArchived &&
                    hasPermission('finance', 'edit', targetCompanyId)
                      ? [
                          {
                            id: 'reconcile',
                            label: 'Liquidar / Conciliar Rápido',
                            icon: <CheckCircle2 size={14} />,
                            onClick: () => {
                              setReconcileTarget(c);
                              setReconcileRefCode(`SIM-LIQ-${c.code}`);
                            },
                          },
                        ]
                      : []),
                    ...(hasPermission('finance', 'archive', targetCompanyId)
                      ? [
                          c.archiveMetadata.isArchived
                            ? {
                                id: 'restore',
                                label: t('common.restore'),
                                icon: <RotateCcw size={14} />,
                                onClick: async () => {
                                  await repositories.charges.restore(c.id, getActor(c.companyId));
                                  await refreshData();
                                  notify({ type: 'success', title: `Cobrança ${c.code} restaurada.` });
                                },
                              }
                            : {
                                id: 'archive',
                                label: t('common.archive'),
                                icon: <Archive size={14} />,
                                variant: 'danger' as const,
                                onClick: () => setArchiveChargeTarget(c),
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

      {activeTab === 'pagamentos' && (
        <UrlDataTable<PaymentRecordEntity>
          tableId={`payments-table-${scope}`}
          caption="Histórico de liquidações e comprovantes bancários auditados"
          items={scopedPayments}
          defaultSortField="paidAt"
          csvFilename={`pagamentos-${scope}.csv`}
          searchPlaceholder="Buscar por código da fatura, referência bancária ou empresa..."
          statusExtractor={(p) => (p.reconciled ? 'paid' : 'pending')}
          searchExtractor={(p) => `${p.chargeCode} ${p.referenceCode} ${p.companyName} ${p.methodType}`}
          statusOptions={[
            { value: 'paid', label: 'Conciliado' },
            { value: 'pending', label: 'Pendente' },
          ]}
          isArchivedExtractor={(p) => p.archiveMetadata.isArchived}
          columns={[
            {
              key: 'chargeCode',
              header: 'Fatura / Empresa',
              sortable: true,
              render: (p) => (
                <div>
                  <span className="mono font-semibold">{p.chargeCode}</span>
                  <div className="text-xs text-muted">{p.companyName}</div>
                </div>
              ),
            },
            {
              key: 'amountPaid',
              header: 'Valor Pago',
              sortable: true,
              render: (p) => (
                <span className="font-semibold tabular">
                  {formatCurrency(p.amountPaid, p.currency, session.language)}
                </span>
              ),
            },
            {
              key: 'methodType',
              header: 'Meio / Ref. de Conciliação',
              render: (p) => (
                <div>
                  <span className="badge badge-neutral">{p.methodType.toUpperCase()}</span>
                  <div className="mono text-xs text-muted mt-1">{p.referenceCode}</div>
                </div>
              ),
            },
            {
              key: 'paidAt',
              header: 'Liquidado em',
              sortable: true,
              render: (p) => <span className="text-xs">{formatDateTime(p.paidAt, session.language)}</span>,
            },
          ]}
        />
      )}

      {activeTab === 'parcelas' && (
        <UrlDataTable<InstallmentEntity>
          tableId={`installments-table-${scope}`}
          caption="Cronograma analítico de parcelas por fatura"
          items={scopedInstallments}
          defaultSortField="dueDate"
          csvFilename={`parcelas-${scope}.csv`}
          searchPlaceholder="Buscar por fatura ou empresa..."
          statusExtractor={(i) => i.status}
          searchExtractor={(i) => `${i.chargeCode} ${i.companyName}`}
          statusOptions={[
            { value: 'paid', label: t('status.paid') },
            { value: 'pending', label: t('status.pending') },
            { value: 'overdue', label: t('status.overdue') },
          ]}
          columns={[
            {
              key: 'chargeCode',
              header: 'Fatura Origem',
              sortable: true,
              render: (i) => (
                <div>
                  <span className="mono font-semibold">{i.chargeCode}</span>
                  <div className="text-xs text-muted">{i.companyName}</div>
                </div>
              ),
            },
            {
              key: 'installmentNumber',
              header: 'Parcela',
              sortable: true,
              render: (i) => (
                <span className="badge badge-neutral mono">
                  {i.installmentNumber} / {i.totalInstallments}
                </span>
              ),
            },
            {
              key: 'amount',
              header: 'Valor da Parcela',
              sortable: true,
              render: (i) => (
                <span className="font-semibold tabular">
                  {formatCurrency(i.amount, i.currency, session.language)}
                </span>
              ),
            },
            {
              key: 'dueDate',
              header: 'Vencimento',
              sortable: true,
              render: (i) => <span className="mono text-xs">{i.dueDate}</span>,
            },
            {
              key: 'status',
              header: 'Situação',
              render: (i) => <StatusBadge status={i.status} />,
            },
          ]}
        />
      )}

      {activeTab === 'relatorios' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Demonstrativo Financeiro & Exportação Contábil</h2>
              <p className="card-subtitle">
                Resumo por meio de pagamento e status de adimplência sincronizado em tempo real com o Supabase PostgreSQL.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() =>
                exportRowsToCsv(
                  `relatorio-financeiro-${scope}.csv`,
                  ['Fatura', 'Empresa', 'Valor', 'Moeda', 'Vencimento', 'Metodo', 'Status', 'Conciliado'],
                  scopedCharges.map((c) => [
                    c.code,
                    c.companyName,
                    c.amount,
                    c.currency,
                    c.dueDate,
                    c.paymentMethodType,
                    c.status,
                    c.reconciled ? 'SIM' : 'NAO',
                  ]),
                )
              }
            >
              <Download size={14} />
              Exportar Demonstrativo CSV
            </button>
          </div>
          <div className="card-body grid-2">
            {(['pix', 'boleto', 'credit_card', 'bank_transfer'] as PaymentMethodType[]).map((m) => {
              const methodCharges = activeCharges.filter((c) => c.paymentMethodType === m);
              const sum = methodCharges.reduce((acc, c) => acc + c.amount, 0);
              return (
                <div key={m} className="card">
                  <div className="card-body flex justify-between items-center">
                    <div>
                      <div className="font-semibold uppercase text-xs text-muted">{m}</div>
                      <div className="text-lg font-bold tabular mt-1">
                        {formatCurrency(sum, company?.currency || 'BRL', session.language)}
                      </div>
                    </div>
                    <span className="badge badge-neutral">{methodCharges.length} título(s)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ModalDialog
        open={newChargeOpen}
        onClose={() => setNewChargeOpen(false)}
        title="Emitir Nova Cobrança Operacional"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setNewChargeOpen(false)}>
              {t('common.cancel')}
            </button>
            <button type="submit" form="new-charge-form" className="btn btn-primary">
              Emitir Cobrança & Parcelas
            </button>
          </>
        }
      >
        <form id="new-charge-form" onSubmit={handleCreateCharge} className="flex flex-col gap-4">
          {scope === 'global' && (
            <div className="form-group">
              <label className="form-label" htmlFor="chg-company">
                Empresa Destinatária
              </label>
              <select
                id="chg-company"
                className="form-select"
                value={chargeCompanyId}
                onChange={(e) => setChargeCompanyId(e.target.value)}
              >
                {companies
                  .filter((c) => !c.archiveMetadata.isArchived)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.tradeName} ({c.currency})
                    </option>
                  ))}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label" htmlFor="chg-desc">
              Descrição da Cobrança *
            </label>
            <span id="chg-desc-hint" className="form-hint">
              Descreva a competência ou aditivo contratual correspondente.
            </span>
            <input
              id="chg-desc"
              aria-describedby="chg-desc-hint"
              className="form-input"
              required
              value={chargeDescription}
              onChange={(e) => setChargeDescription(e.target.value)}
              placeholder="Ex.: Mensalidade Competência Dezembro/2026"
            />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="chg-amount">
                Valor Total *
              </label>
              <input
                id="chg-amount"
                type="number"
                min={1}
                step="0.01"
                className="form-input"
                required
                value={chargeAmount}
                onChange={(e) => setChargeAmount(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="chg-due">
                Data de Vencimento *
              </label>
              <input
                id="chg-due"
                type="date"
                className="form-input"
                required
                value={chargeDueDate}
                onChange={(e) => setChargeDueDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="chg-method">
                Meio de Pagamento
              </label>
              <select
                id="chg-method"
                className="form-select"
                value={chargeMethod}
                onChange={(e) => setChargeMethod(e.target.value as PaymentMethodType)}
              >
                <option value="pix">Pix Corporativo</option>
                <option value="boleto">Boleto Registrado</option>
                <option value="credit_card">Cartão Corporativo Tokenizado</option>
                <option value="bank_transfer">Transferência Bancária</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="chg-inst">
                Número de Parcelas
              </label>
              <input
                id="chg-inst"
                type="number"
                min={1}
                max={12}
                className="form-input"
                value={chargeInstallments}
                onChange={(e) => setChargeInstallments(Number(e.target.value))}
              />
            </div>
          </div>
        </form>
      </ModalDialog>

      <ModalDialog
        open={Boolean(reconcileTarget)}
        onClose={() => setReconcileTarget(null)}
        title={`Conciliar & Liquidar Fatura ${reconcileTarget?.code || ''}`}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setReconcileTarget(null)}>
              {t('common.cancel')}
            </button>
            <button type="submit" form="reconcile-form" className="btn btn-primary">
              Confirmar Liquidação Auditada
            </button>
          </>
        }
      >
        <form id="reconcile-form" onSubmit={handleConfirmReconciliation} className="flex flex-col gap-4">
          <div className="banner banner-simulated">
            <ShieldCheck size={16} />
            <div>
              Conciliação auditada: liquida a cobrança e todas as suas parcelas com sincronização imediata no Supabase PostgreSQL e registro na trilha de auditoria.
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="rec-ref">
              Código de Autenticação / Hash Bancário *
            </label>
            <input
              id="rec-ref"
              className="form-input mono"
              required
              value={reconcileRefCode}
              onChange={(e) => setReconcileRefCode(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="rec-notes">
              Observações de Conciliação
            </label>
            <textarea
              id="rec-notes"
              className="form-textarea"
              value={reconcileNotes}
              onChange={(e) => setReconcileNotes(e.target.value)}
            />
          </div>
        </form>
      </ModalDialog>

      <ArchiveRecordDialog
        open={Boolean(archiveChargeTarget)}
        onClose={() => setArchiveChargeTarget(null)}
        recordTitle={archiveChargeTarget ? `${archiveChargeTarget.code} (${archiveChargeTarget.companyName})` : ''}
        onConfirmArchive={async (reason) => {
          if (!archiveChargeTarget) return;
          await repositories.charges.archive(
            archiveChargeTarget.id,
            reason,
            getActor(archiveChargeTarget.companyId),
          );
          await refreshData();
          notify({
            type: 'warning',
            title: `Cobrança ${archiveChargeTarget.code} arquivada sem exclusão física.`,
          });
        }}
      />
    </div>
  );
};

export const PaymentMethodsPage: React.FC<{
  activeTab?: 'empresas' | 'canais' | 'cotas' | 'regras';
}> = ({ activeTab = 'empresas' }) => {
  const {
    paymentMethods,
    companies,
    companyModules,
    contracts,
    charges,
    payments,
    installments,
    session,
    hasPermission,
    getActor,
    refreshData,
    notify,
    t,
  } = useApp();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<PaymentMethodConfigEntity | null>(null);
  const [inspectChannelModal, setInspectChannelModal] = useState<PaymentMethodConfigEntity | null>(null);

  // Company Ledger & Payment Modal state
  const [ledgerCompanyId, setLedgerCompanyId] = useState<string | null>(null);
  const [manualPayAmount, setManualPayAmount] = useState<string>('');
  const [manualPayMethod, setManualPayMethod] = useState<PaymentMethodType>('pix');
  const [manualPayRef, setManualPayRef] = useState<string>('PIX-CONFIRMED-2026');
  const [manualPayDesc, setManualPayDesc] = useState<string>('Mensalidade Plano + Licenças de Equipe');

  // Global Billing Rules state
  const [rulesForm, setRulesForm] = useState<PlatformBillingRules>(() => getPlatformBillingRules());
  const [editingQuotaCompany, setEditingQuotaCompany] = useState<CompanyEntity | null>(null);
  const [companyFreeQuotaInput, setCompanyFreeQuotaInput] = useState<string>('10');
  const [companyExtraPriceInput, setCompanyExtraPriceInput] = useState<string>('19.90');

  // New Payment Method Channel form state
  const [name, setName] = useState('');
  const [type, setType] = useState<PaymentMethodType>('pix');
  const [providerName, setProviderName] = useState('Olivelas Pay Gateway');
  const [maskedPreview, setMaskedPreview] = useState('TOK_OLV_****_9900');
  const [feePercentage, setFeePercentage] = useState(0.99);
  const [settlementDays, setSettlementDays] = useState(1);
  const [instructions, setInstructions] = useState('');

  const orderedCompanies = useMemo(
    () => sortCompaniesHierarchically(companies.filter((c) => !c.archiveMetadata.isArchived)),
    [companies],
  );

  const companySummaries = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeCompanyLicenseSummary>>();
    for (const c of orderedCompanies) {
      map.set(
        c.id,
        computeCompanyLicenseSummary(c, companies, rulesForm, companyModules, contracts),
      );
    }
    return map;
  }, [orderedCompanies, companies, rulesForm, companyModules, contracts]);

  if (!hasPermission('payment_methods', 'view') && !hasPermission('finance', 'view')) {
    return (
      <AccessDeniedView
        reason="Sem permissão para gerenciar os meios de pagamento e faturamento por empresa da plataforma."
        requiredPermission="payment_methods:view"
      />
    );
  }

  const totalMonthlyRecurring = Array.from(companySummaries.values()).reduce(
    (acc, s) => acc + s.totalMonthlyBilling,
    0,
  );
  const totalExtraSeatRevenue = Array.from(companySummaries.values()).reduce(
    (acc, s) => acc + s.extraLicensesMonthlyCost,
    0,
  );
  const totalExtraSeatsCount = Array.from(companySummaries.values()).reduce(
    (acc, s) => acc + s.extraEmployeesCount,
    0,
  );
  const totalPaidAmount = charges
    .filter((c) => !c.archiveMetadata.isArchived && c.status === 'paid')
    .reduce((acc, c) => acc + c.amount, 0);
  const totalOpenOrOverdueAmount = charges
    .filter((c) => !c.archiveMetadata.isArchived && (c.status === 'pending' || c.status === 'overdue'))
    .reduce((acc, c) => acc + c.amount, 0);

  const selectedLedgerCompany = ledgerCompanyId
    ? companies.find((c) => c.id === ledgerCompanyId) || null
    : null;
  const selectedLedgerSummary = selectedLedgerCompany
    ? companySummaries.get(selectedLedgerCompany.id) || null
    : null;

  const openCompanyLedgerModal = (comp: CompanyEntity) => {
    const sum = companySummaries.get(comp.id);
    setLedgerCompanyId(comp.id);
    setManualPayAmount(String(sum?.totalMonthlyBilling || 500));
    setManualPayMethod(sum?.preferredPaymentMethod || 'pix');
    setManualPayRef(`LIQ-${comp.branchCode || 'EMP'}-${Date.now().toString().slice(-5)}`);
    setManualPayDesc(
      `Mensalidade ${sum?.planName || 'Allin'} (${sum?.activeEmployeesCount || 1} funcionários; ${
        sum?.extraEmployeesCount || 0
      } extra)`,
    );
  };

  const handleSettleChargeOneClick = async (charge: ChargeEntity) => {
    const actor = getActor(charge.companyId);
    const now = new Date().toISOString();
    const refCode = `LIQ-1CLICK-${charge.code}`;

    await repositories.charges.update(
      charge.id,
      (curr) => ({
        ...curr,
        status: 'paid' as PaymentStatus,
        reconciled: true,
        reconciledAt: now,
        reconciledBy: actor.userName,
      }),
      actor,
      `Baixa rápida de pagamento da fatura ${charge.code} (${charge.companyName}).`,
      'reconcile_payment',
    );

    await repositories.payments.create(
      {
        id: generateId('pay'),
        chargeId: charge.id,
        chargeCode: charge.code,
        companyId: charge.companyId,
        companyName: charge.companyName,
        amountPaid: charge.amount,
        currency: charge.currency,
        paidAt: now,
        methodType: charge.paymentMethodType,
        referenceCode: refCode,
        notes: 'Baixa confirmada no Controle de Pagamentos por Empresa.',
        reconciled: true,
        createdAt: now,
        updatedAt: now,
        archiveMetadata: { isArchived: false },
        changeHistory: [],
      },
      actor,
      `Pagamento registrado para a fatura ${charge.code}.`,
    );

    const relatedInst = installments.filter((i) => i.chargeId === charge.id);
    for (const inst of relatedInst) {
      await repositories.installments.upsert({
        ...inst,
        status: 'paid',
        paidAt: now,
      });
    }

    await repositories.companies.update(
      charge.companyId,
      (curr) => ({
        ...curr,
        paymentStatus: 'ACTIVE',
        operationalStatus: 'active',
      }),
      actor,
      `Regularização financeira automática da unidade após baixa da fatura ${charge.code}.`,
    );

    await refreshData();
    notify({
      type: 'success',
      title: `Fatura ${charge.code} baixada como PAGA!`,
      description: `Situação financeira de ${charge.companyName} regularizada.`,
    });
  };

  const handleRegisterCompanyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLedgerCompany || !selectedLedgerSummary) return;
    const actor = getActor(selectedLedgerCompany.id);
    const now = new Date().toISOString();
    const amountNum = Math.max(1, Number(manualPayAmount) || selectedLedgerSummary.totalMonthlyBilling);
    const code = `FAT-2026-${String(charges.length + 1010)}`;
    const newChargeId = generateId('chg');

    const newCharge: ChargeEntity = {
      id: newChargeId,
      code,
      companyId: selectedLedgerCompany.id,
      companyName: selectedLedgerCompany.legalName,
      contractId:
        contracts.find((ct) => ct.companyId === selectedLedgerCompany.id)?.id || 'ctr-padrao',
      description: manualPayDesc.trim() || `Mensalidade ${selectedLedgerCompany.tradeName}`,
      amount: amountNum,
      currency: selectedLedgerCompany.currency,
      dueDate: now.slice(0, 10),
      status: 'paid',
      paymentMethodType: manualPayMethod,
      installmentTotal: 1,
      reconciled: true,
      reconciledAt: now,
      reconciledBy: actor.userName,
      createdAt: now,
      updatedAt: now,
      archiveMetadata: { isArchived: false },
      changeHistory: [],
    };

    await repositories.charges.create(
      newCharge,
      actor,
      `Emissão e liquidação imediata da fatura ${code} para ${selectedLedgerCompany.tradeName}.`,
    );

    await repositories.payments.create(
      {
        id: generateId('pay'),
        chargeId: newChargeId,
        chargeCode: code,
        companyId: selectedLedgerCompany.id,
        companyName: selectedLedgerCompany.legalName,
        amountPaid: amountNum,
        currency: selectedLedgerCompany.currency,
        paidAt: now,
        methodType: manualPayMethod,
        referenceCode: manualPayRef.trim() || `REF-${Date.now()}`,
        notes: manualPayDesc.trim(),
        reconciled: true,
        createdAt: now,
        updatedAt: now,
        archiveMetadata: { isArchived: false },
        changeHistory: [],
      },
      actor,
      `Pagamento registrado no livro-razão da empresa ${selectedLedgerCompany.tradeName}.`,
    );

    await repositories.companies.update(
      selectedLedgerCompany.id,
      (curr) => ({
        ...curr,
        paymentStatus: 'ACTIVE',
        operationalStatus: 'active',
        preferredPaymentMethod: manualPayMethod,
      }),
      actor,
      `Atualização de status financeiro para EM DIA (${selectedLedgerCompany.tradeName}).`,
    );

    await refreshData();
    notify({
      type: 'success',
      title: `Pagamento de ${formatCurrency(amountNum, 'BRL', session.language)} registrado para ${selectedLedgerCompany.tradeName}.`,
    });
  };

  const handleSaveGlobalRules = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = savePlatformBillingRules(rulesForm);
    setRulesForm(saved);
    notify({
      type: 'success',
      title: 'Regras Globais de Cobrança & Cota de Funcionários salvas!',
      description: `Franquia padrão: ${saved.defaultFreeEmployeesPerStore} grátis/empresa • Excedente: R$ ${saved.defaultExtraEmployeePrice.toFixed(2)}/mês.`,
    });
  };

  const handleSaveCompanyQuotaModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuotaCompany) return;
    const freeLim = Math.max(0, Number(companyFreeQuotaInput) || 0);
    const extraPr = Math.max(0, Number(companyExtraPriceInput) || 0);

    await repositories.companies.update(
      editingQuotaCompany.id,
      (curr) => ({
        ...curr,
        freeEmployeesLimit: freeLim,
        extraEmployeePrice: extraPr,
      }),
      getActor(editingQuotaCompany.id),
      `Exceção de licenciamento salva para ${editingQuotaCompany.tradeName}: ${freeLim} grátis, R$ ${extraPr.toFixed(2)}/extra.`,
    );
    await refreshData();
    setEditingQuotaCompany(null);
    notify({
      type: 'success',
      title: `Regra de cota atualizada para ${editingQuotaCompany.tradeName}.`,
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const newMethod: PaymentMethodConfigEntity = {
      id: generateId('pm'),
      name: name.trim(),
      type,
      providerName: providerName.trim(),
      environment: 'sandbox_mock',
      status: 'active',
      maskedCredentialPreview: maskedPreview.trim() || 'TOK_SIM_****_0000',
      feePercentage: Number(feePercentage),
      settlementDays: Number(settlementDays),
      instructions: instructions.trim() || 'Configuração demonstrativa segura sem chaves reais.',
      createdAt: now,
      updatedAt: now,
      archiveMetadata: { isArchived: false },
      changeHistory: [],
    };
    await repositories.paymentMethods.create(
      newMethod,
      getActor(),
      `Configuração de novo meio de pagamento ${newMethod.name} (${newMethod.type}).`,
    );
    await refreshData();
    setModalOpen(false);
    setName('');
    notify({ type: 'success', title: `Meio de pagamento ${newMethod.name} cadastrado.` });
  };

  const handleToggleStatus = async (pm: PaymentMethodConfigEntity) => {
    const nextStatus = pm.status === 'active' ? 'inactive' : 'active';
    await repositories.paymentMethods.update(
      pm.id,
      (curr) => ({ ...curr, status: nextStatus }),
      getActor(),
      `Alteração de status do meio de pagamento ${pm.name} para ${nextStatus}.`,
    );
    await refreshData();
    notify({ type: 'info', title: `Meio ${pm.name} atualizado para ${nextStatus}.` });
  };

  return (
    <div className="flex flex-col gap-2.5">
      <PageHeader
        breadcrumbs={[
          { label: t('scope.global'), to: '/app/global' },
          { label: t('nav.paymentMethods') },
        ]}
        title="Pagamentos por Empresa, Licenciamento de Equipe (10 Grátis) & Meios de Liquidação"
        subtitle={`MRR: ${formatCurrency(totalMonthlyRecurring, 'BRL', session.language)} • Licenças extras: +${formatCurrency(totalExtraSeatRevenue, 'BRL', session.language)}/mês (${totalExtraSeatsCount} extras) • Recebido: ${formatCurrency(totalPaidAmount, 'BRL', session.language)} • PIX: ${rulesForm.pixKey}`}
        scopeBadge={t('scope.global')}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/app/global/financeiro" className="btn btn-secondary btn-sm">
              <Wallet size={14} />
              Livro de Cobranças & Parcelas
            </Link>
            {hasPermission('payment_methods', 'create') && (
              <Link to="/app/global/meios-pagamento/novo" className="btn btn-primary btn-sm">
                <Plus size={14} />
                Novo Meio de Pagamento
              </Link>
            )}
          </div>
        }
      />

      {/* Navigation Tabs — identical pattern to /app/global/api-hub/ambientes */}
      <nav className="subnav-tabs" aria-label="Navegação de meios de pagamento">
        <NavLink
          to="/app/global/meios-pagamento"
          end
          className={({ isActive }) =>
            `subnav-tab ${isActive || activeTab === 'empresas' ? 'active' : ''}`
          }
        >
          Pagamentos por Empresa ({orderedCompanies.length})
        </NavLink>
        <NavLink
          to="/app/global/meios-pagamento/canais"
          className={({ isActive }) =>
            `subnav-tab ${isActive || activeTab === 'canais' ? 'active' : ''}`
          }
        >
          Provedores &amp; Gateways ({paymentMethods.length})
        </NavLink>
        <NavLink
          to="/app/global/meios-pagamento/cotas"
          className={({ isActive }) =>
            `subnav-tab ${isActive || activeTab === 'cotas' ? 'active' : ''}`
          }
        >
          Cotas de Funcionários ({orderedCompanies.length})
        </NavLink>
        <NavLink
          to="/app/global/meios-pagamento/regras"
          className={({ isActive }) =>
            `subnav-tab ${isActive || activeTab === 'regras' ? 'active' : ''}`
          }
        >
          Regras Globais &amp; PIX
        </NavLink>
      </nav>

      {/* TAB 1: PAGAMENTOS POR EMPRESA (MATRIZ & FILIAIS) */}
      {activeTab === 'empresas' && (
        <UrlDataTable<CompanyEntity>
          tableId="company-payments-table"
          caption="Controle de pagamentos, assinaturas e licenças de funcionários por empresa (Matriz e Filiais)"
          items={orderedCompanies}
          defaultSortField=""
          csvFilename="pagamentos-por-empresa.csv"
          searchPlaceholder="Buscar por empresa, filial, titular, e-mail ou plano..."
          statusExtractor={(comp) => {
            const openCharge = charges.find(
              (ch) =>
                ch.companyId === comp.id &&
                !ch.archiveMetadata.isArchived &&
                (ch.status === 'pending' || ch.status === 'overdue'),
            );
            return openCharge ? openCharge.status : comp.operationalStatus;
          }}
          searchExtractor={(comp) => {
            const sum = companySummaries.get(comp.id);
            return `${comp.tradeName} ${comp.legalName} ${comp.branchCode || ''} ${
              sum?.adminOwnerName || ''
            } ${sum?.adminOwnerEmail || ''} ${sum?.planName || ''}`;
          }}
          statusOptions={[
            { value: 'active', label: t('status.active') },
            { value: 'pending', label: t('status.pending') },
            { value: 'overdue', label: t('status.overdue') },
            { value: 'suspended', label: t('status.suspended') },
          ]}
          isArchivedExtractor={(comp) => comp.archiveMetadata.isArchived}
          columns={[
            {
              key: 'tradeName',
              header: 'Empresa (Matriz / Filial) & Titular',
              sortable: true,
              width: '24%',
              render: (comp) => {
                const sum = companySummaries.get(comp.id);
                return (
                  <div
                    style={{
                      paddingLeft: comp.isBranch ? '0.85rem' : 0,
                      borderLeft: comp.isBranch ? '2px solid var(--brand-primary)' : 'none',
                    }}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {comp.isBranch ? (
                        <span className="badge badge-info">└─ FILIAL</span>
                      ) : (
                        <span className="badge badge-teal">MATRIZ</span>
                      )}
                      <Link
                        to={`/app/global/empresas/${comp.id}/editar`}
                        className="font-semibold text-left"
                        style={{ color: 'var(--brand-primary)' }}
                      >
                        {comp.tradeName}
                      </Link>
                    </div>
                    {sum && (
                      <>
                        <div className="text-xs text-muted mt-0.5">
                          Titular: <strong>{sum.adminOwnerName}</strong>
                        </div>
                        <div className="mono text-xs text-muted">{sum.adminOwnerEmail}</div>
                      </>
                    )}
                  </div>
                );
              },
            },
            {
              key: 'planName',
              header: 'Plano & Módulos',
              width: '18%',
              render: (comp) => {
                const sum = companySummaries.get(comp.id);
                if (!sum) return '—';
                return (
                  <div>
                    <div className="font-semibold text-xs">{sum.planName}</div>
                    <div className="text-xs text-muted">
                      Base: {formatCurrency(sum.basePlanMonthlyCost, 'BRL', session.language)} •{' '}
                      {sum.activeModulesCount} mód.
                    </div>
                    {comp.isBranch && sum.parentCompanyName && (
                      <div className="text-xs text-muted">Matriz: {sum.parentCompanyName}</div>
                    )}
                  </div>
                );
              },
            },
            {
              key: 'employeesCount',
              header: 'Alocação de Equipe (10 Grátis)',
              sortable: true,
              width: '20%',
              render: (comp) => {
                const sum = companySummaries.get(comp.id);
                if (!sum) return '—';
                return (
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="badge badge-neutral tabular">
                        {sum.activeEmployeesCount} / {sum.freeLimit} grátis
                      </span>
                      {sum.extraEmployeesCount > 0 ? (
                        <span className="badge badge-warning">
                          +{sum.extraEmployeesCount} extra = +
                          {formatCurrency(sum.extraLicensesMonthlyCost, 'BRL', session.language)}
                        </span>
                      ) : (
                        <span className="badge badge-success">Isento</span>
                      )}
                    </div>
                    <div className="text-xs text-muted mt-1">
                      {sum.hasCustomQuotaOverride
                        ? 'Regra customizada na unidade'
                        : `Padrão (${rulesForm.defaultFreeEmployeesPerStore} grátis)`}
                    </div>
                  </div>
                );
              },
            },
            {
              key: 'monthlyBilling',
              header: 'Mensalidade Total',
              width: '15%',
              render: (comp) => {
                const sum = companySummaries.get(comp.id);
                if (!sum) return '—';
                return (
                  <div>
                    <div className="font-bold tabular text-sm">
                      {formatCurrency(sum.totalMonthlyBilling, 'BRL', session.language)}/mês
                    </div>
                    <div className="text-xs text-muted">
                      Plano + {sum.extraEmployeesCount} licença(s)
                    </div>
                  </div>
                );
              },
            },
            {
              key: 'operationalStatus',
              header: 'Meio, Vencimento & Status',
              width: '15%',
              render: (comp) => {
                const sum = companySummaries.get(comp.id);
                const openCompanyCharge = charges.find(
                  (ch) =>
                    ch.companyId === comp.id &&
                    !ch.archiveMetadata.isArchived &&
                    (ch.status === 'pending' || ch.status === 'overdue'),
                );
                return (
                  <div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="badge badge-neutral uppercase">
                        {sum?.preferredPaymentMethod || 'pix'}
                      </span>
                      {openCompanyCharge ? (
                        <StatusBadge status={openCompanyCharge.status} />
                      ) : (
                        <StatusBadge status={comp.operationalStatus} />
                      )}
                    </div>
                    <div className="mono text-xs text-muted mt-1">
                      Venc.: {openCompanyCharge?.dueDate || sum?.nextBillingDueDate || '—'}
                    </div>
                  </div>
                );
              },
            },
            {
              key: 'actions',
              header: 'Ações',
              width: '10%',
              isNumeric: true,
              render: (comp) => {
                const openCompanyCharge = charges.find(
                  (ch) =>
                    ch.companyId === comp.id &&
                    !ch.archiveMetadata.isArchived &&
                    (ch.status === 'pending' || ch.status === 'overdue'),
                );
                return (
                  <ActionDropdownMenu
                    label="Ações"
                    items={[
                      {
                        id: 'edit-company-page',
                        label: 'Editar Empresa, Equipe & Cota (ID Único)',
                        icon: <Edit3 size={14} />,
                        variant: 'primary',
                        onClick: () => navigate(`/app/global/empresas/${comp.id}/editar`),
                      },
                      ...(openCompanyCharge
                        ? [
                            {
                              id: 'settle-1click',
                              label: `Baixar Fatura ${openCompanyCharge.code} como PAGA`,
                              icon: <CheckCircle2 size={14} />,
                              onClick: () => handleSettleChargeOneClick(openCompanyCharge),
                            },
                            {
                              id: 'edit-charge',
                              label: `Editar Fatura ${openCompanyCharge.code}`,
                              icon: <Wallet size={14} />,
                              onClick: () =>
                                navigate(
                                  `/app/global/financeiro/cobrancas/${openCompanyCharge.id}/editar`,
                                ),
                            },
                          ]
                        : []),
                      {
                        id: 'ledger-modal',
                        label: 'Livro-Razão & Comprovantes',
                        icon: <Wallet size={14} />,
                        onClick: () => openCompanyLedgerModal(comp),
                      },
                      {
                        id: 'company-employees',
                        label: 'Ficha da Empresa & Filiais',
                        icon: <GitBranch size={14} />,
                        onClick: () => navigate(`/app/global/empresas/${comp.id}`),
                      },
                      {
                        id: 'company-contract',
                        label: 'Ver Contratos da Empresa',
                        icon: <FileText size={14} />,
                        onClick: () => navigate(`/app/global/empresas/${comp.id}/contratos`),
                      },
                    ]}
                  />
                );
              },
            },
          ]}
        />
      )}

      {/* TAB 2: PROVEDORES & GATEWAYS */}
      {activeTab === 'canais' && (
        <UrlDataTable<PaymentMethodConfigEntity>
          tableId="payment-methods-table"
          caption="Meios de pagamento e provedores de liquidação configurados na plataforma Olivelas Allin"
          items={paymentMethods}
          defaultSortField="createdAt"
          csvFilename="meios-pagamento-allin.csv"
          searchPlaceholder="Buscar por nome, provedor ou tipo..."
          statusExtractor={(pm) => pm.status}
          searchExtractor={(pm) => `${pm.name} ${pm.providerName} ${pm.type}`}
          statusOptions={[
            { value: 'active', label: t('status.active') },
            { value: 'inactive', label: 'Inativo' },
            { value: 'archived', label: t('status.archived') },
          ]}
          isArchivedExtractor={(pm) => pm.archiveMetadata.isArchived}
          columns={[
            {
              key: 'name',
              header: 'Meio de Pagamento / Modalidade',
              sortable: true,
              width: '30%',
              render: (pm) => (
                <div>
                  <Link
                    to={`/app/global/meios-pagamento/${pm.id}/editar`}
                    className="font-semibold text-left"
                    style={{ color: 'var(--brand-primary)' }}
                  >
                    {pm.name}
                  </Link>
                  <div className="mt-1">
                    <span className="badge badge-neutral uppercase">{pm.type}</span>
                  </div>
                </div>
              ),
            },
            {
              key: 'providerName',
              header: 'Provedor / Credencial Mascarada',
              width: '32%',
              render: (pm) => (
                <div>
                  <div className="text-sm font-medium">{pm.providerName}</div>
                  <code className="text-xs text-muted">{pm.maskedCredentialPreview}</code>
                </div>
              ),
            },
            {
              key: 'feePercentage',
              header: 'Taxa & Prazo Liquidação',
              sortable: true,
              width: '20%',
              render: (pm) => (
                <div className="tabular text-xs">
                  <div className="font-semibold">Taxa: {pm.feePercentage}%</div>
                  <div className="text-muted">Liquidação: D+{pm.settlementDays}</div>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Estado',
              width: '10%',
              render: (pm) => <StatusBadge status={pm.status} />,
            },
            {
              key: 'actions',
              header: 'Ações',
              width: '10%',
              isNumeric: true,
              render: (pm) => (
                <ActionDropdownMenu
                  label="Ações"
                  items={[
                    ...(hasPermission('payment_methods', 'edit')
                      ? [
                          {
                            id: 'edit',
                            label: 'Editar Configurações (ID Único)',
                            icon: <Edit3 size={14} />,
                            variant: 'primary' as const,
                            onClick: () => navigate(`/app/global/meios-pagamento/${pm.id}/editar`),
                          },
                        ]
                      : []),
                    {
                      id: 'detail-page',
                      label: 'Abrir Ficha Completa',
                      icon: <FileSpreadsheet size={14} />,
                      onClick: () => navigate(`/app/global/meios-pagamento/${pm.id}`),
                    },
                    {
                      id: 'toggle',
                      label: pm.status === 'active' ? 'Pausar Canal' : 'Ativar Canal',
                      icon: <RefreshCw size={14} />,
                      onClick: () => handleToggleStatus(pm),
                    },
                    pm.archiveMetadata.isArchived
                      ? {
                          id: 'restore',
                          label: 'Restaurar Canal',
                          icon: <RotateCcw size={14} />,
                          onClick: async () => {
                            await repositories.paymentMethods.restore(pm.id, getActor());
                            await refreshData();
                            notify({
                              type: 'success',
                              title: `Meio de pagamento ${pm.name} restaurado.`,
                            });
                          },
                        }
                      : {
                          id: 'archive',
                          label: 'Arquivar Canal',
                          icon: <Archive size={14} />,
                          variant: 'danger' as const,
                          onClick: () => setArchiveTarget(pm),
                        },
                  ]}
                />
              ),
            },
          ]}
        />
      )}

      {/* TAB 3: COTAS DE FUNCIONÁRIOS & EXCEÇÕES POR UNIDADE */}
      {activeTab === 'cotas' && (
        <UrlDataTable<CompanyEntity>
          tableId="company-quotas-table"
          caption="Cota de funcionários gratuitos (10 grátis por padrão) e exceções por unidade (Matriz e Filiais)"
          items={orderedCompanies}
          defaultSortField=""
          csvFilename="cotas-funcionarios-empresas.csv"
          searchPlaceholder="Buscar por unidade, código de filial ou matriz..."
          statusExtractor={(comp) => comp.operationalStatus}
          searchExtractor={(comp) => {
            const s = companySummaries.get(comp.id);
            return `${comp.tradeName} ${comp.legalName} ${s?.branchCode || ''} ${
              s?.parentCompanyName || ''
            }`;
          }}
          statusOptions={[
            { value: 'active', label: t('status.active') },
            { value: 'suspended', label: t('status.suspended') },
            { value: 'onboarding', label: t('status.onboarding') },
          ]}
          isArchivedExtractor={(comp) => comp.archiveMetadata.isArchived}
          columns={[
            {
              key: 'tradeName',
              header: 'Unidade (Matriz / Filial) & Filiação',
              sortable: true,
              width: '28%',
              render: (comp) => {
                const s = companySummaries.get(comp.id);
                return (
                  <div
                    style={{
                      paddingLeft: comp.isBranch ? '0.65rem' : 0,
                      borderLeft: comp.isBranch ? '2px solid var(--accent-primary)' : 'none',
                    }}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`badge ${comp.isBranch ? 'badge-info' : 'badge-teal'}`}>
                        {comp.isBranch ? '└─ FILIAL' : 'MATRIZ'}
                      </span>
                      <Link
                        to={`/app/global/empresas/${comp.id}/editar`}
                        className="font-semibold text-sm truncate"
                        style={{ color: 'var(--accent-primary)' }}
                      >
                        {comp.tradeName}
                      </Link>
                    </div>
                    <div className="text-xs text-muted truncate mt-0.5">
                      <code>{s?.branchCode || comp.id}</code>
                      {comp.isBranch && s?.parentCompanyName
                        ? ` • Matriz: ${s.parentCompanyName}`
                        : ` • ${comp.legalName}`}
                    </div>
                  </div>
                );
              },
            },
            {
              key: 'employeesCount',
              header: 'Equipe Alocada',
              sortable: true,
              width: '16%',
              render: (comp) => {
                const s = companySummaries.get(comp.id);
                return (
                  <div className="flex flex-col gap-0.5">
                    <div>
                      <span className="badge badge-neutral tabular">
                        {s?.activeEmployeesCount ?? 0} colaborador(es)
                      </span>
                    </div>
                    <span className="text-xs text-muted truncate">
                      Titular: {s?.adminOwnerName || '—'}
                    </span>
                  </div>
                );
              },
            },
            {
              key: 'freeEmployeesLimit',
              header: 'Franquia Gratuita',
              width: '16%',
              render: (comp) => {
                const s = companySummaries.get(comp.id);
                return (
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold tabular text-xs">
                      Até {s?.freeLimit ?? 10} funcionários grátis
                    </span>
                    <div>
                      {s?.hasCustomQuotaOverride ? (
                        <span className="badge badge-info">Exceção Customizada</span>
                      ) : (
                        <span className="badge badge-teal">Padrão Global</span>
                      )}
                    </div>
                  </div>
                );
              },
            },
            {
              key: 'extraEmployees',
              header: 'Excedentes & Valor/Extra',
              width: '16%',
              render: (comp) => {
                const s = companySummaries.get(comp.id);
                if (!s) return '—';
                return (
                  <div className="flex flex-col gap-0.5">
                    <div>
                      {s.extraEmployeesCount > 0 ? (
                        <span className="badge badge-warning">+{s.extraEmployeesCount} extra(s)</span>
                      ) : (
                        <span className="badge badge-success">Dentro da Cota (0)</span>
                      )}
                    </div>
                    <span className="tabular text-xs text-muted">
                      {formatCurrency(s.extraEmployeePrice, 'BRL', session.language)} / extra
                    </span>
                  </div>
                );
              },
            },
            {
              key: 'extraCost',
              header: 'Adicional Mensal',
              width: '14%',
              isNumeric: true,
              render: (comp) => {
                const s = companySummaries.get(comp.id);
                return (
                  <div className="tabular">
                    <div className="font-bold text-sm">
                      +{formatCurrency(s?.extraLicensesMonthlyCost ?? 0, 'BRL', session.language)}/mês
                    </div>
                    <div className="text-xs text-muted">
                      MRR: {formatCurrency(s?.totalMonthlyBilling ?? 0, 'BRL', session.language)}
                    </div>
                  </div>
                );
              },
            },
            {
              key: 'actions',
              header: 'Ações',
              width: '10%',
              isNumeric: true,
              render: (comp) => (
                <ActionDropdownMenu
                  label="Ações"
                  items={[
                    {
                      id: 'edit-quota-page',
                      label: 'Editar Cota & Equipe (ID Único)',
                      icon: <Edit3 size={14} />,
                      variant: 'primary',
                      onClick: () => navigate(`/app/global/empresas/${comp.id}/editar`),
                    },
                    {
                      id: 'view-company',
                      label: 'Abrir Ficha da Unidade',
                      icon: <Building2 size={14} />,
                      onClick: () => navigate(`/app/global/empresas/${comp.id}`),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      )}

      {/* TAB 4: REGRAS GLOBAIS DE COBRANÇA & PIX */}
      {activeTab === 'regras' && (
        <form onSubmit={handleSaveGlobalRules} className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                Regras Globais de Licenciamento de Equipe (10 Funcionários Grátis) &amp; PIX Oficial
              </h2>
              <p className="card-subtitle">
                Parametrize a franquia gratuita de colaboradores por empresa/filial, o valor por
                assento extra e as diretrizes automáticas de inadimplência.
              </p>
            </div>
            <button type="submit" className="btn btn-primary btn-sm">
              <Save size={14} /> Salvar Regras Globais
            </button>
          </div>
          <div className="card-body flex flex-col gap-4">
            <div className="form-grid">
              <div className="field">
                <label>Cota Padrão de Funcionários Grátis por Empresa / Filial *</label>
                <p className="hint">
                  Quantidade de funcionários ativos inclusos gratuitamente em cada unidade.
                </p>
                <input
                  type="number"
                  min={0}
                  className="input tabular"
                  value={rulesForm.defaultFreeEmployeesPerStore}
                  onChange={(e) =>
                    setRulesForm({
                      ...rulesForm,
                      defaultFreeEmployeesPerStore: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                />
              </div>
              <div className="field">
                <label>Valor Mensal por Funcionário Excedente (R$) *</label>
                <p className="hint">
                  Cobrado automaticamente a partir do {rulesForm.defaultFreeEmployeesPerStore + 1}º
                  colaborador ativo.
                </p>
                <input
                  type="number"
                  min={0}
                  step="0.10"
                  className="input tabular"
                  value={rulesForm.defaultExtraEmployeePrice}
                  onChange={(e) =>
                    setRulesForm({
                      ...rulesForm,
                      defaultExtraEmployeePrice: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                />
              </div>
              <div className="field">
                <label>Prazo de Carência após Vencimento (Dias)</label>
                <p className="hint">
                  Dias de tolerância antes de marcar a empresa como inadimplente.
                </p>
                <input
                  type="number"
                  min={0}
                  max={60}
                  className="input tabular"
                  value={rulesForm.gracePeriodDays}
                  onChange={(e) =>
                    setRulesForm({
                      ...rulesForm,
                      gracePeriodDays: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                />
              </div>
              <div className="field">
                <label>Chave PIX Oficial para Recebimento B2B</label>
                <p className="hint">Exibida nas faturas e contratos gerados.</p>
                <input
                  className="input mono"
                  value={rulesForm.pixKey}
                  onChange={(e) => setRulesForm({ ...rulesForm, pixKey: e.target.value })}
                />
              </div>
              <div className="field">
                <label>WhatsApp da Central Financeira</label>
                <p className="hint">Canal para envio de comprovantes e negociação.</p>
                <input
                  className="input mono"
                  value={rulesForm.billingSupportWhatsapp}
                  onChange={(e) =>
                    setRulesForm({ ...rulesForm, billingSupportWhatsapp: e.target.value })
                  }
                />
              </div>
              <div className="field">
                <label>Bloqueio Preventivo por Inadimplência</label>
                <p className="hint">Suspender automaticamente após o prazo de carência.</p>
                <select
                  className="select"
                  value={rulesForm.autoBlockOverdue ? 'true' : 'false'}
                  onChange={(e) =>
                    setRulesForm({
                      ...rulesForm,
                      autoBlockOverdue: e.target.value === 'true',
                    })
                  }
                >
                  <option value="true">Ativado — Suspender após carência</option>
                  <option value="false">Desativado — Apenas alertar</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>Diretriz Contratual de Licenciamento de Equipe</label>
              <textarea
                className="textarea"
                value={rulesForm.notes}
                onChange={(e) => setRulesForm({ ...rulesForm, notes: e.target.value })}
              />
            </div>
          </div>
        </form>
      )}

      {/* MODAL 1: LIVRO-RAZÃO & BAIXA DE PAGAMENTO POR EMPRESA */}
      <ModalDialog
        open={Boolean(selectedLedgerCompany && selectedLedgerSummary)}
        onClose={() => setLedgerCompanyId(null)}
        title={
          selectedLedgerCompany
            ? `Livro-Razão & Pagamentos — ${selectedLedgerCompany.tradeName} (${
                selectedLedgerCompany.branchCode || 'MATRIZ'
              })`
            : 'Pagamentos da Empresa'
        }
        description={
          selectedLedgerSummary
            ? `Titular: ${selectedLedgerSummary.adminOwnerName} (${selectedLedgerSummary.adminOwnerEmail}) • Plano: ${selectedLedgerSummary.planName}`
            : ''
        }
        maxWidth="880px"
      >
        {selectedLedgerCompany && selectedLedgerSummary && (
          <div className="flex flex-col gap-4">
            <div className="kpi-grid">
              <div className="kpi-card">
                <span className="kpi-label">Mensalidade do Plano</span>
                <span className="kpi-value tabular">
                  {formatCurrency(
                    selectedLedgerSummary.basePlanMonthlyCost,
                    'BRL',
                    session.language,
                  )}
                </span>
                <span className="kpi-meta">
                  {selectedLedgerSummary.activeModulesCount} módulo(s) ativo(s)
                </span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Cota de Funcionários</span>
                <span className="kpi-value tabular">
                  {selectedLedgerSummary.activeEmployeesCount} / {selectedLedgerSummary.freeLimit}{' '}
                  grátis
                </span>
                <span className="kpi-meta">
                  +{selectedLedgerSummary.extraEmployeesCount} extra = +
                  {formatCurrency(
                    selectedLedgerSummary.extraLicensesMonthlyCost,
                    'BRL',
                    session.language,
                  )}
                </span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Total Mensal da Empresa</span>
                <span className="kpi-value tabular" style={{ color: 'var(--success)' }}>
                  {formatCurrency(
                    selectedLedgerSummary.totalMonthlyBilling,
                    'BRL',
                    session.language,
                  )}
                </span>
                <span className="kpi-meta">
                  Meio: {selectedLedgerSummary.preferredPaymentMethod.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Form to record payment or issue settled invoice */}
            <form
              onSubmit={handleRegisterCompanyPayment}
              className="card"
              style={{ padding: '1rem' }}
            >
              <div className="font-semibold text-sm mb-2">
                Registrar Recebimento / Baixar Mensalidade desta Empresa
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>Valor Recebido (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min={1}
                    required
                    className="input tabular"
                    value={manualPayAmount}
                    onChange={(e) => setManualPayAmount(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Meio de Liquidação *</label>
                  <select
                    className="select"
                    value={manualPayMethod}
                    onChange={(e) => setManualPayMethod(e.target.value as PaymentMethodType)}
                  >
                    <option value="pix">PIX Corporativo</option>
                    <option value="boleto">Boleto Bancário</option>
                    <option value="credit_card">Cartão de Crédito</option>
                    <option value="bank_transfer">Transferência TED</option>
                  </select>
                </div>
                <div className="field">
                  <label>Código / Comprovante *</label>
                  <input
                    className="input mono"
                    required
                    value={manualPayRef}
                    onChange={(e) => setManualPayRef(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Descrição / Competência *</label>
                  <input
                    className="input"
                    required
                    value={manualPayDesc}
                    onChange={(e) => setManualPayDesc(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <button type="submit" className="btn btn-primary btn-sm">
                  <CheckCircle2 size={14} /> Confirmar Recebimento & Regularizar Empresa
                </button>
              </div>
            </form>

            {/* Invoice History of this Company */}
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fatura</th>
                    <th>Descrição</th>
                    <th>Vencimento</th>
                    <th>Meio</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {charges
                    .filter((ch) => ch.companyId === selectedLedgerCompany.id)
                    .map((ch) => (
                      <tr key={ch.id}>
                        <td className="mono font-semibold text-xs">{ch.code}</td>
                        <td className="text-xs">{ch.description}</td>
                        <td className="mono text-xs">{ch.dueDate}</td>
                        <td>
                          <span className="badge badge-neutral uppercase">
                            {ch.paymentMethodType}
                          </span>
                        </td>
                        <td className="tabular font-semibold text-xs">
                          {formatCurrency(ch.amount, ch.currency, session.language)}
                        </td>
                        <td>
                          <StatusBadge status={ch.status} />
                        </td>
                        <td>
                          {ch.status !== 'paid' ? (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleSettleChargeOneClick(ch)}
                            >
                              Baixar PAGO
                            </button>
                          ) : (
                            <span className="text-xs text-muted">Liquidada</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ModalDialog>

      {/* MODAL 2: EDITAR COTA DE FUNCIONÁRIOS DA EMPRESA */}
      <ModalDialog
        open={Boolean(editingQuotaCompany)}
        onClose={() => setEditingQuotaCompany(null)}
        title={
          editingQuotaCompany
            ? `Cota de Funcionários — ${editingQuotaCompany.tradeName}`
            : 'Editar Cota da Empresa'
        }
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditingQuotaCompany(null)}
            >
              {t('common.cancel')}
            </button>
            <button type="submit" form="quota-override-form" className="btn btn-primary">
              <Save size={14} /> Salvar Cota da Empresa
            </button>
          </>
        }
      >
        <form
          id="quota-override-form"
          onSubmit={handleSaveCompanyQuotaModal}
          className="flex flex-col gap-4"
        >
          <div className="field">
            <label>Limite de Funcionários Grátis nesta Unidade *</label>
            <input
              type="number"
              min={0}
              required
              className="input tabular"
              value={companyFreeQuotaInput}
              onChange={(e) => setCompanyFreeQuotaInput(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Valor Mensal por Funcionário Extra (R$) *</label>
            <input
              type="number"
              min={0}
              step="0.10"
              required
              className="input tabular"
              value={companyExtraPriceInput}
              onChange={(e) => setCompanyExtraPriceInput(e.target.value)}
            />
          </div>
        </form>
      </ModalDialog>

      {/* MODAL 3: DETALHES DO CANAL DE LIQUIDAÇÃO */}
      <ModalDialog
        open={Boolean(inspectChannelModal)}
        onClose={() => setInspectChannelModal(null)}
        title={inspectChannelModal?.name || 'Detalhes do Meio de Pagamento'}
        description={
          inspectChannelModal
            ? `Provedor: ${inspectChannelModal.providerName} • Modalidade: ${inspectChannelModal.type.toUpperCase()}`
            : ''
        }
      >
        {inspectChannelModal && (
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Identificador Técnico:</span>
              <code className="mono">{inspectChannelModal.id}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Credencial Mascarada (Zero Segredos):</span>
              <code className="mono">{inspectChannelModal.maskedCredentialPreview}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Taxa Operacional:</span>
              <strong className="tabular">{inspectChannelModal.feePercentage}%</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Prazo de Liquidação:</span>
              <strong className="tabular">D+{inspectChannelModal.settlementDays}</strong>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted">Instruções de Conciliação:</span>
              <p className="text-xs">{inspectChannelModal.instructions}</p>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Link
                to={`/app/global/meios-pagamento/${inspectChannelModal.id}/editar`}
                className="btn btn-primary btn-sm"
                onClick={() => setInspectChannelModal(null)}
              >
                <Edit3 size={14} /> Editar Canal
              </Link>
            </div>
          </div>
        )}
      </ModalDialog>

      <ModalDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Configurar Novo Meio de Pagamento Corporativo"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </button>
            <button type="submit" form="pm-form" className="btn btn-primary">
              Salvar Configuração
            </button>
          </>
        }
      >
        <form id="pm-form" onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label" htmlFor="pm-name">
              Nome Comercial do Canal *
            </label>
            <input
              id="pm-name"
              className="form-input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Pix QR Dinâmico B2B"
            />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="pm-type">
                Modalidade
              </label>
              <select
                id="pm-type"
                className="form-select"
                value={type}
                onChange={(e) => setType(e.target.value as PaymentMethodType)}
              >
                <option value="pix">Pix</option>
                <option value="boleto">Boleto</option>
                <option value="credit_card">Cartão Tokenizado</option>
                <option value="bank_transfer">Transferência Bancária</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pm-provider">
                Provedor / Instituição de Liquidação *
              </label>
              <input
                id="pm-provider"
                className="form-input"
                required
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pm-fee">
                Taxa Operacional (%)
              </label>
              <input
                id="pm-fee"
                type="number"
                step="0.01"
                className="form-input"
                value={feePercentage}
                onChange={(e) => setFeePercentage(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pm-days">
                Liquidação (Dias D+)
              </label>
              <input
                id="pm-days"
                type="number"
                min={0}
                className="form-input"
                value={settlementDays}
                onChange={(e) => setSettlementDays(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="pm-mask">
              Identificador Mascarado (Nunca insira segredos reais) *
            </label>
            <input
              id="pm-mask"
              className="form-input mono"
              required
              value={maskedPreview}
              onChange={(e) => setMaskedPreview(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="pm-inst">
              Instruções Operacionais
            </label>
            <textarea
              id="pm-inst"
              className="form-textarea"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
        </form>
      </ModalDialog>

      <ArchiveRecordDialog
        open={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        recordTitle={archiveTarget?.name || ''}
        onConfirmArchive={async (reason) => {
          if (!archiveTarget) return;
          await repositories.paymentMethods.archive(archiveTarget.id, reason, getActor());
          await refreshData();
          notify({ type: 'warning', title: `Meio de pagamento ${archiveTarget.name} arquivado.` });
        }}
      />
    </div>
  );
};

export const PaymentMethodDetailPage: React.FC = () => {
  const { metodoId } = useParams<{ metodoId: string }>();
  const { paymentMethods, charges, session, hasPermission, t } = useApp();

  if (!hasPermission('payment_methods', 'view') && !hasPermission('finance', 'view')) {
    return (
      <AccessDeniedView
        reason="Sem permissão para inspecionar meios de pagamento globais."
        requiredPermission="payment_methods:view"
      />
    );
  }

  const method = paymentMethods.find((m) => m.id === metodoId);
  if (!method) {
    return (
      <AccessDeniedView
        title="Meio de Pagamento Não Encontrado"
        reason={`O identificador "${metodoId}" não corresponde a nenhum meio de pagamento configurado.`}
        backTo="/app/global/meios-pagamento"
      />
    );
  }

  const relatedCharges = charges.filter(
    (c) => c.paymentMethodType === method.type && !c.archiveMetadata.isArchived,
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: t('scope.global'), to: '/app/global' },
          { label: t('nav.paymentMethods'), to: '/app/global/meios-pagamento' },
          { label: method.name },
        ]}
        title={method.name}
        subtitle={`Provedor: ${method.providerName} • Modalidade: ${method.type.toUpperCase()} • Ambiente: ${method.environment}`}
        scopeBadge={t('scope.global')}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/app/global/meios-pagamento" className="btn btn-secondary btn-sm">
              <ArrowLeft size={14} />
              Voltar
            </Link>
            {hasPermission('payment_methods', 'edit') && (
              <Link
                to={`/app/global/meios-pagamento/${method.id}/editar`}
                className="btn btn-primary btn-sm"
              >
                <Edit3 size={14} />
                Editar Canal
              </Link>
            )}
          </div>
        }
      />

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Parâmetros Técnicos & Segurança</h2>
            <StatusBadge status={method.status} />
          </div>
          <div className="card-body flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">ID Técnico:</span>
              <code className="mono">{method.id}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Credencial Mascarada (Zero Segredos Reais):</span>
              <code className="mono">{method.maskedCredentialPreview}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Taxa Operacional (%):</span>
              <strong className="tabular">{method.feePercentage}%</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Prazo de Liquidação:</span>
              <strong className="tabular">D+{method.settlementDays}</strong>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted">Instruções de Liquidação / Governança:</span>
              <p className="text-xs">{method.instructions}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Faturas Operando nesta Modalidade ({relatedCharges.length})</h2>
          </div>
          <div className="card-body flex flex-col gap-2">
            {relatedCharges.map((chg) => (
              <div key={chg.id} className="card">
                <div className="card-body flex justify-between items-center gap-2 flex-wrap">
                  <div>
                    <code className="mono font-semibold">{chg.code}</code>
                    <div className="text-xs text-muted">{chg.companyName}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold tabular text-sm">
                      {formatCurrency(chg.amount, chg.currency, session.language)}
                    </span>
                    <StatusBadge status={chg.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const PaymentMethodFormPage: React.FC<{ mode: 'create' | 'edit' }> = ({ mode }) => {
  const { metodoId } = useParams<{ metodoId: string }>();
  const navigate = useNavigate();
  const { paymentMethods, hasPermission, getActor, refreshData, notify, t } = useApp();

  const existing = mode === 'edit' ? paymentMethods.find((m) => m.id === metodoId) : undefined;

  const [name, setName] = useState(existing?.name || '');
  const [type, setType] = useState<PaymentMethodType>(existing?.type || 'pix');
  const [providerName, setProviderName] = useState(existing?.providerName || 'Olivelas Pay Gateway');
  const [maskedPreview, setMaskedPreview] = useState(
    existing?.maskedCredentialPreview || 'TOK_OLV_****_9900',
  );
  const [feePercentage, setFeePercentage] = useState<number>(existing?.feePercentage ?? 0.99);
  const [settlementDays, setSettlementDays] = useState<number>(existing?.settlementDays ?? 1);
  const [status, setStatus] = useState<'active' | 'inactive' | 'archived'>(existing?.status || 'active');
  const [instructions, setInstructions] = useState(
    existing?.instructions || 'Configuração corporativa com credenciais mascaradas e conformidade PCI/LGPD.',
  );

  const requiredAction = mode === 'create' ? 'create' : 'edit';
  if (!hasPermission('payment_methods', requiredAction)) {
    return (
      <AccessDeniedView
        reason="Sem permissão para cadastrar ou editar meios de pagamento globais."
        requiredPermission={`payment_methods:${requiredAction}`}
        backTo="/app/global/meios-pagamento"
      />
    );
  }

  if (mode === 'edit' && !existing) {
    return (
      <AccessDeniedView
        title="Meio de Pagamento Não Encontrado"
        reason={`O identificador "${metodoId}" não existe.`}
        backTo="/app/global/meios-pagamento"
      />
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const safeMasked = maskedPreview.includes('*') || maskedPreview.includes('•')
      ? maskedPreview.trim()
      : `TOK_SIM_****_${maskedPreview.trim().slice(-4) || '0000'}`;

    if (mode === 'create') {
      const created: PaymentMethodConfigEntity = {
        id: generateId('pm'),
        name: name.trim(),
        type,
        providerName: providerName.trim(),
        environment: 'sandbox_mock',
        status,
        maskedCredentialPreview: safeMasked,
        feePercentage: Number(feePercentage),
        settlementDays: Number(settlementDays),
        instructions: instructions.trim(),
        createdAt: now,
        updatedAt: now,
        archiveMetadata: { isArchived: false },
        changeHistory: [],
      };
      await repositories.paymentMethods.create(
        created,
        getActor(),
        `Cadastro de meio de pagamento ${created.name} (${created.type}).`,
      );
      await refreshData();
      notify({ type: 'success', title: `Meio de pagamento "${created.name}" criado.` });
      navigate(`/app/global/meios-pagamento/${created.id}`);
    } else if (existing) {
      await repositories.paymentMethods.update(
        existing.id,
        (curr) => ({
          ...curr,
          name: name.trim(),
          type,
          providerName: providerName.trim(),
          status,
          maskedCredentialPreview: safeMasked,
          feePercentage: Number(feePercentage),
          settlementDays: Number(settlementDays),
          instructions: instructions.trim(),
        }),
        getActor(),
        `Edição do meio de pagamento ${name.trim()}.`,
      );
      await refreshData();
      notify({ type: 'success', title: `Meio de pagamento "${name.trim()}" atualizado.` });
      navigate(`/app/global/meios-pagamento/${existing.id}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: t('scope.global'), to: '/app/global' },
          { label: t('nav.paymentMethods'), to: '/app/global/meios-pagamento' },
          { label: mode === 'create' ? 'Novo Meio de Pagamento' : `Editar ${existing?.name}` },
        ]}
        title={mode === 'create' ? 'Novo Meio de Pagamento Corporativo' : `Editar ${existing?.name}`}
        subtitle="Proibido inserir chaves privadas em texto puro ou números completos de cartão. Todas as credenciais são mascaradas automaticamente."
        scopeBadge={t('scope.global')}
      />

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body flex flex-col gap-4">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="pmf-name">Nome Comercial do Meio *</label>
              <input
                id="pmf-name"
                className="input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Pix Corporativo Instantâneo"
              />
            </div>
            <div className="field">
              <label htmlFor="pmf-type">Modalidade *</label>
              <select
                id="pmf-type"
                className="select"
                value={type}
                onChange={(e) => setType(e.target.value as PaymentMethodType)}
              >
                <option value="pix">Pix</option>
                <option value="boleto">Boleto Registrado</option>
                <option value="credit_card">Cartão Corporativo Tokenizado</option>
                <option value="bank_transfer">Transferência Bancária</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="pmf-provider">Provedor / Adquirente *</label>
              <input
                id="pmf-provider"
                className="input"
                required
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="pmf-status">Estado Operacional</label>
              <select
                id="pmf-status"
                className="select"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive' | 'archived')}
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="pmf-fee">Taxa Operacional (%)</label>
              <input
                id="pmf-fee"
                type="number"
                step="0.01"
                min={0}
                className="input"
                value={feePercentage}
                onChange={(e) => setFeePercentage(Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label htmlFor="pmf-days">Prazo de Liquidação (D+)</label>
              <input
                id="pmf-days"
                type="number"
                min={0}
                className="input"
                value={settlementDays}
                onChange={(e) => setSettlementDays(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="pmf-mask">Identificador Mascarado (Sem Segredos Reais) *</label>
            <p className="hint">
              Qualquer valor sem máscara terá apenas os 4 últimos dígitos exibidos por segurança.
            </p>
            <input
              id="pmf-mask"
              className="input mono"
              required
              value={maskedPreview}
              onChange={(e) => setMaskedPreview(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="pmf-inst">Instruções Operacionais & Conciliação</label>
            <textarea
              id="pmf-inst"
              className="textarea"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
        </div>
        <div className="card-footer">
          <Link to="/app/global/meios-pagamento" className="btn btn-secondary">
            {t('common.cancel')}
          </Link>
          <button type="submit" className="btn btn-primary">
            <Save size={14} />
            {t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
};

export const ChargeFormPage: React.FC<{ scope: 'global' | 'company'; mode: 'create' | 'edit' }> = ({
  scope,
  mode,
}) => {
  const { cobrancaId, empresaId } = useParams<{ cobrancaId: string; empresaId?: string }>();
  const navigate = useNavigate();
  const { charges, companies, contracts, installments, getActor, refreshData, notify, t } = useApp();

  const existing = mode === 'edit' ? charges.find((c) => c.id === cobrancaId) : undefined;
  const baseRoute =
    scope === 'global' ? '/app/global/financeiro/cobrancas' : `/app/empresa/${empresaId}/financeiro/cobrancas`;

  const [companyId, setCompanyId] = useState(
    existing?.companyId || empresaId || companies[0]?.id || 'emp-olivelas-matriz',
  );
  const [description, setDescription] = useState(existing?.description || '');
  const [amount, setAmount] = useState(existing?.amount ?? 840);
  const [dueDate, setDueDate] = useState(existing?.dueDate || '2026-11-15');
  const [installmentTotal, setInstallmentTotal] = useState(existing?.installmentTotal ?? 1);
  const [paymentMethodType, setPaymentMethodType] = useState<PaymentMethodType>(
    existing?.paymentMethodType || 'pix',
  );
  const [status, setStatus] = useState<PaymentStatus>(existing?.status || 'pending');
  const [reconciled, setReconciled] = useState<boolean>(existing?.reconciled || false);

  if (mode === 'edit' && !existing) {
    return (
      <AccessDeniedView
        title="Fatura Não Encontrada"
        reason={`O identificador "${cobrancaId}" não existe.`}
        backTo={baseRoute}
      />
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetComp = companies.find((c) => c.id === companyId);
    if (!targetComp) return;
    const now = new Date().toISOString();
    const actor = getActor(targetComp.id);

    if (mode === 'create') {
      const targetContract = contracts.find((ct) => ct.companyId === targetComp.id);
      const newId = generateId('chg');
      const code = `FAT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const totalInst = Math.max(1, Number(installmentTotal) || 1);
      const numAmount = Number(amount) || 0;

      const newCharge: ChargeEntity = {
        id: newId,
        code,
        companyId: targetComp.id,
        companyName: targetComp.legalName,
        contractId: targetContract?.id || 'ctr-olivelas-01',
        description: description.trim() || `Fatura SaaS — ${targetComp.tradeName}`,
        amount: numAmount,
        currency: targetComp.currency,
        dueDate,
        status,
        paymentMethodType,
        installmentTotal: totalInst,
        reconciled,
        createdAt: now,
        updatedAt: now,
        archiveMetadata: { isArchived: false },
        changeHistory: [],
      };
      await repositories.charges.create(
        newCharge,
        actor,
        `Emissão da cobrança ${code} para ${targetComp.legalName}.`,
      );
      await refreshData();
      notify({ type: 'success', title: `Cobrança ${code} emitida.` });
      navigate(baseRoute);
    } else if (existing) {
      await repositories.charges.update(
        existing.id,
        (curr) => ({
          ...curr,
          description: description.trim(),
          amount: Number(amount) || curr.amount,
          dueDate,
          installmentTotal: Math.max(1, Number(installmentTotal) || 1),
          paymentMethodType,
          status: reconciled ? 'paid' : status,
          reconciled,
          reconciledAt: reconciled ? curr.reconciledAt || now : undefined,
          reconciledBy: reconciled ? curr.reconciledBy || actor.userName : undefined,
          updatedAt: now,
        }),
        actor,
        `Edição dedicada da cobrança ${existing.code}.`,
      );
      if (reconciled || status === 'paid') {
        const relatedInst = installments.filter((i) => i.chargeId === existing.id);
        for (const inst of relatedInst) {
          await repositories.installments.upsert({
            ...inst,
            status: 'paid',
            paidAt: now,
          });
        }
      }
      await refreshData();
      notify({ type: 'success', title: `Cobrança ${existing.code} atualizada.` });
      navigate(baseRoute);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: scope === 'global' ? t('scope.global') : t('scope.company'), to: baseRoute },
          { label: 'Cobranças', to: baseRoute },
          { label: mode === 'create' ? 'Nova Cobrança' : `Editar ${existing?.code}` },
        ]}
        title={
          mode === 'create'
            ? 'Emitir Nova Cobrança / Fatura Corporativa'
            : `Editar & Conciliar Fatura — ${existing?.code} (ID: ${existing?.id})`
        }
        subtitle="Página dedicada de edição e conciliação bancária com identificador único."
        actions={
          <Link to={baseRoute} className="btn btn-secondary btn-sm">
            <ArrowLeft size={14} /> {t('common.back')}
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body grid-2">
          <div className="field">
            <label htmlFor="chg-comp">Empresa Pagadora *</label>
            <select
              id="chg-comp"
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
            <label htmlFor="chg-desc">Descrição da Fatura *</label>
            <input
              id="chg-desc"
              className="input"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex.: Mensalidade SaaS + Licenças de Equipe"
            />
          </div>
          <div className="field">
            <label htmlFor="chg-amount">Valor Total (R$) *</label>
            <input
              id="chg-amount"
              type="number"
              step="0.01"
              min={0}
              required
              className="input tabular"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="chg-due">Data de Vencimento *</label>
            <input
              id="chg-due"
              type="date"
              required
              className="input tabular"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="chg-method">Meio de Liquidação *</label>
            <select
              id="chg-method"
              className="select"
              value={paymentMethodType}
              onChange={(e) => setPaymentMethodType(e.target.value as PaymentMethodType)}
            >
              <option value="pix">PIX Corporativo</option>
              <option value="boleto">Boleto Registrado</option>
              <option value="credit_card">Cartão Corporativo</option>
              <option value="bank_transfer">Transferência Bancária</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="chg-inst">Quantidade de Parcelas</label>
            <input
              id="chg-inst"
              type="number"
              min={1}
              max={12}
              className="input tabular"
              value={installmentTotal}
              onChange={(e) => setInstallmentTotal(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="chg-status">Status da Cobrança</label>
            <select
              id="chg-status"
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value as PaymentStatus)}
            >
              <option value="pending">Pendente / A Vencer</option>
              <option value="paid">Pago / Liquidado</option>
              <option value="overdue">Vencido / Em Atraso</option>
            </select>
          </div>
          <div className="field" style={{ justifyContent: 'flex-end' }}>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={reconciled}
                onChange={(e) => {
                  setReconciled(e.target.checked);
                  if (e.target.checked) setStatus('paid');
                }}
              />
              Conciliada Bancariamente (Baixar todas as parcelas como PAGAS)
            </label>
          </div>
        </div>
        <div className="card-footer">
          <Link to={baseRoute} className="btn btn-secondary">
            {t('common.cancel')}
          </Link>
          <button type="submit" className="btn btn-primary">
            <Save size={14} /> {t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
};

