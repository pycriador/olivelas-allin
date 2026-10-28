import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  ChargeEntity,
  CurrencyCode,
  InstallmentEntity,
  PaymentMethodConfigEntity,
  PaymentMethodType,
  PaymentRecordEntity,
  PaymentStatus,
} from '../../types/domain';
import { generateId, recordAuditEvent, repositories } from '../../repositories/repositories';
import { formatCurrency, formatDateTime } from '../../i18n/translations';
import { exportRowsToCsv } from '../../services/operationalUtils';
import {
  AccessDeniedView,
  ArchiveRecordDialog,
  ModalDialog,
  PageHeader,
  StatusBadge,
  UrlDataTable,
} from '../../components/shared/SharedComponents';

export type FinanceTab = 'overview' | 'cobrancas' | 'pagamentos' | 'parcelas' | 'conciliacao' | 'relatorios';

export const FinanceHubPage: React.FC<{ scope: 'global' | 'company'; activeTab: FinanceTab }> = ({
  scope,
  activeTab,
}) => {
  const { empresaId } = useParams<{ empresaId: string }>();
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
  const [reconcileRefCode, setReconcileRefCode] = useState('E1823612020261028SIM774');
  const [reconcileNotes, setReconcileNotes] = useState(
    'Liquidação confirmada via conciliação bancária demonstrativa.',
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
      `Conciliação e liquidação demonstrativa da cobrança ${reconcileTarget.code} (Ref: ${reconcileRefCode}).`,
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
    <div className="flex flex-col gap-4">
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
        subtitle="Controle contábil auditado de recebíveis, liquidações simuladas, inadimplência e relatórios financeiros."
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
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setNewChargeOpen(true)}
              >
                <Plus size={14} />
                Emitir Cobrança
              </button>
            )}
          </div>
        }
      />

      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Total Recebido / Liquidado</span>
          <span className="kpi-value">
            {formatCurrency(totalPaid, company?.currency || 'BRL', session.language)}
          </span>
          <span className="kpi-meta text-success">
            {activeCharges.filter((c) => c.status === 'paid').length} cobrança(s) paga(s)
          </span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">A Vencer / Em Processamento</span>
          <span className="kpi-value">
            {formatCurrency(totalPending, company?.currency || 'BRL', session.language)}
          </span>
          <span className="kpi-meta">
            {activeCharges.filter((c) => c.status === 'pending').length} título(s) em aberto
          </span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Inadimplência (Vencidos)</span>
          <span className="kpi-value text-danger">
            {formatCurrency(totalOverdue, company?.currency || 'BRL', session.language)}
          </span>
          <span className="kpi-meta">
            {activeCharges.filter((c) => c.status === 'overdue').length} título(s) vencido(s)
          </span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Taxa de Conciliação Bancária</span>
          <span className="kpi-value">
            {activeCharges.length > 0
              ? `${Math.round(
                  (activeCharges.filter((c) => c.reconciled).length / activeCharges.length) * 100,
                )}%`
              : '100%'}
          </span>
          <span className="kpi-meta">
            {scopedPayments.length} pagamento(s) registrado(s)
          </span>
        </div>
      </div>

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
          onArchiveClick={
            hasPermission('finance', 'archive', targetCompanyId)
              ? (item) => setArchiveChargeTarget(item)
              : undefined
          }
          onRestoreClick={
            hasPermission('finance', 'archive', targetCompanyId)
              ? async (item) => {
                  await repositories.charges.restore(item.id, getActor(item.companyId));
                  await refreshData();
                  notify({ type: 'success', title: `Cobrança ${item.code} restaurada.` });
                }
              : undefined
          }
          columns={[
            {
              key: 'code',
              header: 'Fatura / Empresa',
              sortable: true,
              csvValue: (c) => `${c.code} - ${c.companyName}`,
              render: (c) => (
                <div>
                  <span className="mono font-semibold">{c.code}</span>
                  <div className="text-xs text-muted">{c.companyName}</div>
                </div>
              ),
            },
            {
              key: 'description',
              header: 'Descrição / Contrato',
              render: (c) => (
                <div>
                  <div className="text-sm font-medium">{c.description}</div>
                  <code className="text-xs text-muted">Contrato: {c.contractId}</code>
                </div>
              ),
            },
            {
              key: 'amount',
              header: 'Valor / Parcelas',
              sortable: true,
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
              csvValue: (c) => `${c.dueDate} (${c.status})`,
              render: (c) => (
                <div className="flex flex-col gap-1">
                  <span className="mono text-xs">{c.dueDate}</span>
                  <div className="flex items-center gap-1">
                    <StatusBadge status={c.status} />
                    {c.reconciled && <span className="badge badge-teal">Conciliado</span>}
                  </div>
                </div>
              ),
            },
            {
              key: 'actions',
              header: 'Operação Contábil',
              render: (c) => (
                <div className="flex items-center gap-1 flex-wrap">
                  {!c.reconciled &&
                    !c.archiveMetadata.isArchived &&
                    hasPermission('finance', 'edit', targetCompanyId) && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setReconcileTarget(c);
                          setReconcileRefCode(`SIM-LIQ-${c.code}`);
                        }}
                      >
                        <CheckCircle2 size={13} />
                        Conciliar / Liquidar
                      </button>
                    )}
                  {c.reconciled && (
                    <span className="text-xs text-muted">
                      Por {c.reconciledBy || 'Sistema'}
                    </span>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}

      {activeTab === 'pagamentos' && (
        <UrlDataTable<PaymentRecordEntity>
          tableId={`payments-table-${scope}`}
          caption="Histórico de liquidações e comprovantes demonstrativos"
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
                Resumo por meio de pagamento e status de adimplência calculado sobre o IndexedDB local.
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
        title="Emitir Nova Cobrança Operacional (Simulada)"
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
              Operação demonstrativa: liquida a cobrança e todas as suas parcelas no IndexedDB e gera evento
              na trilha de auditoria.
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="rec-ref">
              Código de Autenticação / Hash Bancário Simulado *
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

export const PaymentMethodsPage: React.FC = () => {
  const { paymentMethods, hasPermission, getActor, refreshData, notify, t } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<PaymentMethodConfigEntity | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<PaymentMethodType>('pix');
  const [providerName, setProviderName] = useState('Provedor Sandbox Mock');
  const [maskedPreview, setMaskedPreview] = useState('TOK_SIM_****_9900');
  const [feePercentage, setFeePercentage] = useState(0.99);
  const [settlementDays, setSettlementDays] = useState(1);
  const [instructions, setInstructions] = useState('');

  if (!hasPermission('payment_methods', 'view') && !hasPermission('finance', 'view')) {
    return (
      <AccessDeniedView
        reason="Sem permissão para gerenciar os meios de pagamento globais da plataforma."
        requiredPermission="payment_methods:view"
      />
    );
  }

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
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: t('scope.global'), to: '/app/global' },
          { label: t('nav.paymentMethods') },
        ]}
        title="Meios de Pagamento & Provedores de Liquidação (Mock)"
        subtitle="Configuração de canais de recebimento com credenciais mascaradas e taxas operacionais."
        scopeBadge={t('scope.global')}
        actions={
          hasPermission('payment_methods', 'create') && (
            <div className="flex items-center gap-2 flex-wrap">
              <Link to="/app/global/meios-pagamento/novo" className="btn btn-primary btn-sm">
                <Plus size={14} />
                Novo Meio de Pagamento
              </Link>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(true)}>
                <Plus size={14} />
                Cadastro Rápido
              </button>
            </div>
          )
        }
      />

      <UrlDataTable<PaymentMethodConfigEntity>
        tableId="payment-methods-table"
        caption="Meios de pagamento configurados na plataforma Olivelas Allin"
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
        onArchiveClick={(pm) => setArchiveTarget(pm)}
        onRestoreClick={async (pm) => {
          await repositories.paymentMethods.restore(pm.id, getActor());
          await refreshData();
          notify({ type: 'success', title: `Meio de pagamento ${pm.name} restaurado.` });
        }}
        columns={[
          {
            key: 'name',
            header: 'Meio de Pagamento / Tipo',
            sortable: true,
            render: (pm) => (
              <div>
                <Link to={`/app/global/meios-pagamento/${pm.id}`} className="font-semibold">
                  {pm.name}
                </Link>
                <div>
                  <span className="badge badge-neutral uppercase">{pm.type}</span>
                </div>
              </div>
            ),
          },
          {
            key: 'providerName',
            header: 'Provedor / Credencial Mascarada',
            render: (pm) => (
              <div>
                <div className="text-sm">{pm.providerName}</div>
                <code className="text-xs text-muted">{pm.maskedCredentialPreview}</code>
              </div>
            ),
          },
          {
            key: 'feePercentage',
            header: 'Taxa / Prazo Liquidação',
            sortable: true,
            render: (pm) => (
              <div className="tabular text-xs">
                <div>Taxa: {pm.feePercentage}%</div>
                <div className="text-muted">Liquidação: D+{pm.settlementDays}</div>
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Estado',
            render: (pm) => <StatusBadge status={pm.status} />,
          },
          {
            key: 'actions',
            header: 'Governança',
            render: (pm) => (
              <div className="flex items-center gap-1 flex-wrap">
                <Link to={`/app/global/meios-pagamento/${pm.id}`} className="btn btn-secondary btn-sm">
                  <Eye size={13} />
                  Detalhes
                </Link>
                {hasPermission('payment_methods', 'edit') && (
                  <Link
                    to={`/app/global/meios-pagamento/${pm.id}/editar`}
                    className="btn btn-secondary btn-sm"
                  >
                    <Edit3 size={13} />
                    Editar
                  </Link>
                )}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleToggleStatus(pm)}
                >
                  <RefreshCw size={13} />
                  {pm.status === 'active' ? 'Pausar' : 'Ativar'}
                </button>
              </div>
            ),
          },
        ]}
      />

      <ModalDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Configurar Novo Meio de Pagamento Demonstrativo"
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
                Provedor Simulado *
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
  const [providerName, setProviderName] = useState(existing?.providerName || 'Provedor Sandbox Mock');
  const [maskedPreview, setMaskedPreview] = useState(
    existing?.maskedCredentialPreview || 'TOK_SIM_****_9900',
  );
  const [feePercentage, setFeePercentage] = useState<number>(existing?.feePercentage ?? 0.99);
  const [settlementDays, setSettlementDays] = useState<number>(existing?.settlementDays ?? 1);
  const [status, setStatus] = useState<'active' | 'inactive' | 'archived'>(existing?.status || 'active');
  const [instructions, setInstructions] = useState(
    existing?.instructions || 'Configuração demonstrativa segura sem chaves secretas ou PAN real.',
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
        title={mode === 'create' ? 'Novo Meio de Pagamento (Sandbox Mock)' : `Editar ${existing?.name}`}
        subtitle="Proibido inserir chaves privadas reais ou números completos de cartão. Todas as credenciais são mascaradas automaticamente."
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
              <label htmlFor="pmf-provider">Provedor Demonstrativo *</label>
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
