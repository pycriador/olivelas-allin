import React, { useMemo, useState } from 'react';
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  Archive,
  Building2,
  CreditCard,
  Edit3,
  ExternalLink,
  Eye,
  GitBranch,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  CatalogModuleEntity,
  ChargeEntity,
  CompanyAllocatedEmployee,
  CompanyEntity,
  CompanyStatus,
  ContractEntity,
  CurrencyCode,
  LanguageCode,
  OperationalEmployeeRole,
  PaymentMethodType,
  UserEntity,
} from '../../types/domain';
import { generateId, repositories } from '../../repositories/repositories';
import { formatCurrency, formatDateTime } from '../../i18n/translations';
import {
  buildModuleInstanceLaunchUrl,
  openModuleInstanceInNewTab,
} from '../../services/olivelasEcosystemService';
import {
  AccessDeniedView,
  ActionDropdownMenu,
  ArchiveRecordDialog,
  ModalDialog,
  PageHeader,
  StatusBadge,
  UnsavedChangesBanner,
  UrlDataTable,
} from '../../components/shared/SharedComponents';
import { getUserActiveRoles } from '../../services/hbacService';
import {
  computeCompanyLicenseSummary,
  getPlatformBillingRules,
  OPERATIONAL_EMPLOYEE_ROLES,
  sortCompaniesHierarchically,
} from '../../services/enterpriseFinanceAndContractsService';

export const CompaniesListPage: React.FC = () => {
  const {
    companies,
    companyModules,
    contracts,
    session,
    hasPermission,
    isCurrentSuperAdmin,
    startSupportImpersonation,
    getActor,
    refreshData,
    notify,
    t,
  } = useApp();
  const navigate = useNavigate();
  const [archiveTarget, setArchiveTarget] = useState<CompanyEntity | null>(null);
  const [selectedModalCompanyId, setSelectedModalCompanyId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<'overview' | 'employees' | 'branches' | 'licensing'>('employees');

  // New employee form inside modal
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpRole, setNewEmpRole] = useState<OperationalEmployeeRole>('SELLER');
  const [newEmpJobTitle, setNewEmpJobTitle] = useState('');
  const [newEmpDepartment, setNewEmpDepartment] = useState('Operações');
  const [newEmpApprovalLimit, setNewEmpApprovalLimit] = useState('500');

  // Branch attachment / quota override inside modal
  const [attachBranchId, setAttachBranchId] = useState('');
  const [customFreeQuota, setCustomFreeQuota] = useState('10');
  const [customExtraPrice, setCustomExtraPrice] = useState('19.90');

  const rules = useMemo(() => getPlatformBillingRules(), [companies]);

  const orderedCompanies = useMemo(
    () => sortCompaniesHierarchically(companies),
    [companies],
  );

  const summariesByCompanyId = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeCompanyLicenseSummary>>();
    for (const c of companies) {
      map.set(
        c.id,
        computeCompanyLicenseSummary(c, companies, rules, companyModules, contracts),
      );
    }
    return map;
  }, [companies, rules, companyModules, contracts]);

  if (!hasPermission('companies', 'view')) {
    return (
      <AccessDeniedView
        reason="Seu papel atual não possui permissão para listar empresas no Console Global."
        requiredPermission="companies:view"
      />
    );
  }

  const activeCompanies = companies.filter((c) => !c.archiveMetadata.isArchived);
  const matrizCount = activeCompanies.filter((c) => !c.isBranch).length;
  const branchCount = activeCompanies.filter((c) => c.isBranch).length;
  const totalActiveEmployees = Array.from(summariesByCompanyId.values()).reduce(
    (acc, s) => acc + s.activeEmployeesCount,
    0,
  );
  const totalExtraSeats = Array.from(summariesByCompanyId.values()).reduce(
    (acc, s) => acc + s.extraEmployeesCount,
    0,
  );
  const totalMonthlyPlatformRevenue = Array.from(summariesByCompanyId.values()).reduce(
    (acc, s) => acc + s.totalMonthlyBilling,
    0,
  );

  const selectedModalCompany = selectedModalCompanyId
    ? companies.find((c) => c.id === selectedModalCompanyId) || null
    : null;
  const selectedModalSummary = selectedModalCompany
    ? summariesByCompanyId.get(selectedModalCompany.id) || null
    : null;

  const openCompanyModal = (
    comp: CompanyEntity,
    initialTab: 'overview' | 'employees' | 'branches' | 'licensing' = 'employees',
  ) => {
    const summary = summariesByCompanyId.get(comp.id);
    setSelectedModalCompanyId(comp.id);
    setModalTab(initialTab);
    setCustomFreeQuota(String(summary?.freeLimit ?? rules.defaultFreeEmployeesPerStore));
    setCustomExtraPrice(String(summary?.extraEmployeePrice ?? rules.defaultExtraEmployeePrice));
    setAttachBranchId('');
  };

  const handleRestore = async (comp: CompanyEntity) => {
    await repositories.companies.restore(comp.id, getActor(comp.id));
    await refreshData();
    notify({ type: 'success', title: `Empresa ${comp.tradeName} restaurada com sucesso.` });
  };

  const handleAddEmployeeToCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModalCompany || !newEmpName.trim() || !newEmpEmail.trim()) return;

    const newEmployee: CompanyAllocatedEmployee = {
      id: generateId('emp-alloc'),
      name: newEmpName.trim(),
      email: newEmpEmail.trim().toLowerCase(),
      role: newEmpRole,
      jobTitle:
        newEmpJobTitle.trim() ||
        OPERATIONAL_EMPLOYEE_ROLES.find((r) => r.role === newEmpRole)?.label ||
        'Colaborador',
      department: newEmpDepartment.trim() || 'Operações',
      active: true,
      writeoffApprovalLimit: Math.max(0, Number(newEmpApprovalLimit) || 0),
      allocatedAt: new Date().toISOString(),
    };

    await repositories.companies.update(
      selectedModalCompany.id,
      (curr) => ({
        ...curr,
        allocatedEmployees: [...(curr.allocatedEmployees ?? []), newEmployee],
      }),
      getActor(selectedModalCompany.id),
      `Alocação do funcionário ${newEmployee.name} (${newEmployee.role}) na unidade ${selectedModalCompany.tradeName}.`,
    );

    await refreshData();
    setNewEmpName('');
    setNewEmpEmail('');
    setNewEmpJobTitle('');
    notify({
      type: 'success',
      title: `Funcionário ${newEmployee.name} alocado em ${selectedModalCompany.tradeName}.`,
      description: 'Cota de licenças e faturamento recalculados automaticamente.',
    });
  };

  const handleToggleEmployeeActive = async (comp: CompanyEntity, empId: string) => {
    await repositories.companies.update(
      comp.id,
      (curr) => ({
        ...curr,
        allocatedEmployees: (curr.allocatedEmployees ?? []).map((emp) =>
          emp.id === empId ? { ...emp, active: !emp.active } : emp,
        ),
      }),
      getActor(comp.id),
      `Alteração de status ativo/inativo de colaborador alocado em ${comp.tradeName}.`,
    );
    await refreshData();
    notify({ type: 'info', title: 'Status do funcionário atualizado na unidade.' });
  };

  const handleRemoveEmployee = async (comp: CompanyEntity, empId: string, empName: string) => {
    await repositories.companies.update(
      comp.id,
      (curr) => ({
        ...curr,
        allocatedEmployees: (curr.allocatedEmployees ?? []).filter((emp) => emp.id !== empId),
      }),
      getActor(comp.id),
      `Desalocação do funcionário ${empName} da unidade ${comp.tradeName}.`,
    );
    await refreshData();
    notify({
      type: 'warning',
      title: `Funcionário ${empName} removido da alocação da unidade.`,
    });
  };

  const handleAttachChildBranch = async () => {
    if (!selectedModalCompany || !attachBranchId) return;
    const targetBranch = companies.find((c) => c.id === attachBranchId);
    if (!targetBranch) return;

    await repositories.companies.update(
      targetBranch.id,
      (curr) => ({
        ...curr,
        isBranch: true,
        parentCompanyId: selectedModalCompany.id,
        branchCode:
          curr.branchCode && curr.branchCode.startsWith('FIL-')
            ? curr.branchCode
            : `FIL-${selectedModalCompany.address.state || 'BR'}-0${
                companies.filter((c) => c.parentCompanyId === selectedModalCompany.id).length + 1
              }`,
      }),
      getActor(selectedModalCompany.id),
      `Vinculação da unidade ${targetBranch.tradeName} como filial de ${selectedModalCompany.tradeName}.`,
    );
    await refreshData();
    setAttachBranchId('');
    notify({
      type: 'success',
      title: `${targetBranch.tradeName} vinculada como Filial de ${selectedModalCompany.tradeName}.`,
    });
  };

  const handleDetachBranchToMatriz = async (branchComp: CompanyEntity) => {
    await repositories.companies.update(
      branchComp.id,
      (curr) => ({
        ...curr,
        isBranch: false,
        parentCompanyId: undefined,
        branchCode: `MAT-${curr.address.state || 'BR'}-01`,
      }),
      getActor(branchComp.id),
      `Desvinculação de filial: ${branchComp.tradeName} promovida a Matriz independente.`,
    );
    await refreshData();
    notify({
      type: 'info',
      title: `${branchComp.tradeName} agora opera como Matriz independente.`,
    });
  };

  const handleSaveCompanyLicensingOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModalCompany) return;
    const parsedFree = Math.max(0, Number(customFreeQuota) || 0);
    const parsedExtra = Math.max(0, Number(customExtraPrice) || 0);

    await repositories.companies.update(
      selectedModalCompany.id,
      (curr) => ({
        ...curr,
        freeEmployeesLimit: parsedFree,
        extraEmployeePrice: parsedExtra,
      }),
      getActor(selectedModalCompany.id),
      `Configuração de cota de funcionários (${parsedFree} grátis; R$ ${parsedExtra.toFixed(
        2,
      )}/extra) para ${selectedModalCompany.tradeName}.`,
    );
    await refreshData();
    notify({
      type: 'success',
      title: `Cota de licenças de ${selectedModalCompany.tradeName} salva com sucesso.`,
    });
  };

  return (
    <div className="flex flex-col gap-2.5">
      <PageHeader
        breadcrumbs={[
          { label: t('scope.global'), to: '/app/global' },
          { label: t('nav.companies') },
        ]}
        title="Gestão Multiempresa — Matriz, Filiais, Equipe Alocada & Faturamento"
        subtitle={`${matrizCount} Matrizes • ${branchCount} Filiais (${activeCompanies.length} ativas) • ${totalActiveEmployees} funcionários alocados (+${totalExtraSeats} licenças extras) • MRR: ${formatCurrency(totalMonthlyPlatformRevenue, 'BRL', session.language)}`}
        scopeBadge={t('scope.global')}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/app/global/meios-pagamento" className="btn btn-secondary btn-sm">
              <CreditCard size={14} />
              Pagamentos & Regras (10 Grátis)
            </Link>
            {hasPermission('companies', 'create') && (
              <Link to="/app/global/empresas/nova" className="btn btn-primary btn-sm">
                <Plus size={14} />
                Nova Empresa / Filial
              </Link>
            )}
          </div>
        }
      />

      <UrlDataTable<CompanyEntity>
        tableId="global-companies-table"
        caption="Empresas Matrizes e Filiais cadastradas na plataforma Olivelas Allin"
        items={orderedCompanies}
        defaultSortField="createdAt"
        csvFilename="empresas-matriz-filiais-olivelas-allin.csv"
        searchPlaceholder="Buscar por Matriz, Filial, código (FIL-SUL-01), titular, CNPJ ou cidade..."
        statusExtractor={(c) => c.operationalStatus}
        searchExtractor={(c) =>
          `${c.id} ${c.legalName} ${c.tradeName} ${c.taxId || ''} ${c.branchCode || ''} ${
            c.managerName || ''
          } ${c.address.city}`
        }
        statusOptions={[
          { value: 'active', label: t('status.active') },
          { value: 'pending', label: t('status.pending') },
          { value: 'suspended', label: t('status.suspended') },
          { value: 'archived', label: t('status.archived') },
        ]}
        isArchivedExtractor={(c) => c.archiveMetadata.isArchived}
        columns={[
          {
            key: 'tradeName',
            header: 'Unidade (Matriz / Filial)',
            sortable: true,
            width: '25%',
            csvValue: (c) => `${c.isBranch ? '[FILIAL] ' : '[MATRIZ] '}${c.tradeName} (${c.id})`,
            render: (c) => {
              const summary = summariesByCompanyId.get(c.id);
              return (
                <div
                  style={{
                    paddingLeft: c.isBranch ? '0.65rem' : 0,
                    borderLeft: c.isBranch ? '2px solid var(--brand-primary)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {c.isBranch ? (
                      <span className="badge badge-info">└─ FILIAL</span>
                    ) : (
                      <span className="badge badge-teal">MATRIZ</span>
                    )}
                    <Link
                      to={`/app/global/empresas/${c.id}/editar`}
                      className="font-semibold text-left truncate"
                      style={{ color: 'var(--brand-primary)' }}
                    >
                      {c.tradeName}
                    </Link>
                  </div>
                  <div className="text-xs text-muted truncate">
                    <code>{c.branchCode || c.id}</code> • {c.legalName}
                    {!c.isBranch && summary && summary.childBranchesCount > 0
                      ? ` • ${summary.childBranchesCount} filial(is)`
                      : ''}
                  </div>
                </div>
              );
            },
          },
          {
            key: 'hierarchyAndOwner',
            header: 'Filiação & Titular Responsável',
            width: '22%',
            csvValue: (c) => {
              const s = summariesByCompanyId.get(c.id);
              return `${s?.adminOwnerName || ''} (${s?.parentCompanyName || 'Matriz Independente'})`;
            },
            render: (c) => {
              const s = summariesByCompanyId.get(c.id);
              return (
                <div style={{ minWidth: 0 }}>
                  <div className="font-semibold text-xs truncate">
                    {s?.adminOwnerName || 'Responsável'} •{' '}
                    <span className="mono text-muted font-medium">{s?.adminOwnerEmail}</span>
                  </div>
                  {c.isBranch && s?.parentCompanyName ? (
                    <div className="text-xs text-muted truncate">
                      Vinculada a: <strong>{s.parentCompanyName}</strong>
                    </div>
                  ) : (
                    <div className="text-xs text-muted truncate">
                      {c.address.city}/{c.address.state} • Doc: {c.taxId || 'Isento'}
                    </div>
                  )}
                </div>
              );
            },
          },
          {
            key: 'employeesLicensing',
            header: 'Equipe Alocada & Cota (10 Grátis)',
            width: '20%',
            csvValue: (c) => {
              const s = summariesByCompanyId.get(c.id);
              return `${s?.activeEmployeesCount || 0}/${s?.freeLimit || 10} grátis (+${
                s?.extraEmployeesCount || 0
              } extras)`;
            },
            render: (c) => {
              const s = summariesByCompanyId.get(c.id);
              if (!s) return null;
              return (
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="badge badge-neutral tabular">
                      {s.activeEmployeesCount} / {s.freeLimit} grátis
                    </span>
                    {s.extraEmployeesCount > 0 ? (
                      <span className="badge badge-warning">+{s.extraEmployeesCount} extra(s)</span>
                    ) : (
                      <span className="badge badge-success">Isento</span>
                    )}
                  </div>
                  <div className="text-xs text-muted tabular mt-0.5">
                    {s.extraEmployeesCount > 0
                      ? `+${formatCurrency(s.extraLicensesMonthlyCost, 'BRL', session.language)}/mês licenças`
                      : 'Dentro da franquia gratuita'}
                  </div>
                </div>
              );
            },
          },
          {
            key: 'billingTotal',
            header: 'Faturamento Mensal & Plano',
            width: '15%',
            isNumeric: true,
            csvValue: (c) => summariesByCompanyId.get(c.id)?.totalMonthlyBilling || 0,
            render: (c) => {
              const s = summariesByCompanyId.get(c.id);
              if (!s) return null;
              return (
                <div>
                  <div className="font-semibold tabular">
                    {formatCurrency(s.totalMonthlyBilling, 'BRL', session.language)}/mês
                  </div>
                  <div className="text-xs text-muted tabular">
                    {s.activeModulesCount} mód. • {s.preferredPaymentMethod.toUpperCase()}
                  </div>
                </div>
              );
            },
          },
          {
            key: 'operationalStatus',
            header: 'Estado',
            sortable: true,
            width: '10%',
            render: (c) => {
              const s = summariesByCompanyId.get(c.id);
              return (
                <div className="flex items-center gap-1 flex-wrap">
                  <StatusBadge status={c.operationalStatus} />
                  {s?.paymentStatus === 'PAST_DUE' && (
                    <span className="badge badge-danger">Vencida</span>
                  )}
                </div>
              );
            },
          },
          {
            key: 'quickActions',
            header: 'Ações',
            isNumeric: true,
            width: '8%',
            render: (c) => (
              <ActionDropdownMenu
                label="Ações"
                items={[
                  ...(hasPermission('companies', 'edit')
                    ? [
                        {
                          id: 'edit-company',
                          label: 'Editar Empresa, Equipe & Filiação (ID Único)',
                          icon: <Edit3 size={14} />,
                          variant: 'primary' as const,
                          onClick: () => navigate(`/app/global/empresas/${c.id}/editar`),
                        },
                      ]
                    : []),
                  {
                    id: 'hub-page',
                    label: 'Abrir Ficha Cadastral Completa',
                    icon: <Eye size={14} />,
                    onClick: () => navigate(`/app/global/empresas/${c.id}`),
                  },
                  {
                    id: 'company-billing',
                    label: 'Pagamentos & Faturas da Empresa',
                    icon: <CreditCard size={14} />,
                    onClick: () => navigate(`/app/global/empresas/${c.id}/financeiro`),
                  },
                  ...(isCurrentSuperAdmin && !c.archiveMetadata.isArchived
                    ? [
                        {
                          id: 'impersonate',
                          label: 'Ingressar no Contexto da Empresa (SSO)',
                          icon: <UserCheck size={14} />,
                          onClick: async () => {
                            await startSupportImpersonation(
                              c.id,
                              'Inspeção administrativa direta via listagem global de empresas.',
                            );
                            navigate(`/app/empresa/${c.id}`);
                          },
                        },
                      ]
                    : []),
                  ...(hasPermission('companies', 'archive')
                    ? [
                        c.archiveMetadata.isArchived
                          ? {
                              id: 'restore',
                              label: 'Restaurar Empresa',
                              icon: <RotateCcw size={14} />,
                              onClick: () => handleRestore(c),
                            }
                          : {
                              id: 'archive',
                              label: 'Arquivar Empresa',
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

      {/* Complete Modal for Company Details, Employee Allocation (10 Free Quota), and Matriz/Filial Hierarchy */}
      <ModalDialog
        open={Boolean(selectedModalCompany && selectedModalSummary)}
        onClose={() => setSelectedModalCompanyId(null)}
        title={
          selectedModalCompany
            ? `${selectedModalCompany.isBranch ? '[FILIAL]' : '[MATRIZ]'} ${
                selectedModalCompany.tradeName
              } (${selectedModalCompany.branchCode || selectedModalCompany.id})`
            : 'Gestão da Empresa'
        }
        description={
          selectedModalCompany && selectedModalSummary
            ? `${selectedModalCompany.legalName} • Titular: ${selectedModalSummary.adminOwnerName} (${selectedModalSummary.adminOwnerEmail})`
            : ''
        }
        maxWidth="920px"
      >
        {selectedModalCompany && selectedModalSummary && (
          <div className="flex flex-col gap-4">
            {/* Modal Navigation Tabs */}
            <div className="tabs-bar">
              <button
                type="button"
                className={`tab-link ${modalTab === 'employees' ? 'active' : ''}`}
                onClick={() => setModalTab('employees')}
              >
                <Users size={14} /> Alocação de Funcionários (
                {selectedModalSummary.activeEmployeesCount}/{selectedModalSummary.freeLimit} Grátis)
              </button>
              <button
                type="button"
                className={`tab-link ${modalTab === 'branches' ? 'active' : ''}`}
                onClick={() => setModalTab('branches')}
              >
                <GitBranch size={14} /> Hierarquia Matriz & Filiais (
                {selectedModalSummary.childBranchesCount})
              </button>
              <button
                type="button"
                className={`tab-link ${modalTab === 'licensing' ? 'active' : ''}`}
                onClick={() => setModalTab('licensing')}
              >
                <CreditCard size={14} /> Cota Gratuita & Faturamento da Unidade
              </button>
              <button
                type="button"
                className={`tab-link ${modalTab === 'overview' ? 'active' : ''}`}
                onClick={() => setModalTab('overview')}
              >
                <Building2 size={14} /> Dados Societários
              </button>
            </div>

            {/* TAB 1: EMPLOYEE ALLOCATION */}
            {modalTab === 'employees' && (
              <div className="flex flex-col gap-4">
                <div
                  className="card"
                  style={{
                    background: 'var(--bg-elevated)',
                    padding: '0.9rem 1.1rem',
                  }}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="font-semibold text-sm">
                        Resumo de Licenciamento de Equipe desta Unidade
                      </div>
                      <div className="text-xs text-muted">
                        Até {selectedModalSummary.freeLimit} funcionários ativos são gratuitos.
                        Excedentes somam{' '}
                        {formatCurrency(
                          selectedModalSummary.extraEmployeePrice,
                          'BRL',
                          session.language,
                        )}
                        /mês por colaborador ativo.
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-teal">
                        {selectedModalSummary.activeEmployeesCount} ativos /{' '}
                        {selectedModalSummary.freeLimit} grátis
                      </span>
                      {selectedModalSummary.extraEmployeesCount > 0 ? (
                        <span className="badge badge-warning">
                          +{selectedModalSummary.extraEmployeesCount} extra(s) = +
                          {formatCurrency(
                            selectedModalSummary.extraLicensesMonthlyCost,
                            'BRL',
                            session.language,
                          )}
                          /mês
                        </span>
                      ) : (
                        <span className="badge badge-success">Custo Extra: R$ 0,00</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form to allocate new employee */}
                <form
                  onSubmit={handleAddEmployeeToCompany}
                  className="card"
                  style={{ padding: '1rem' }}
                >
                  <div className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                    <UserPlus size={15} /> Alocar Novo Funcionário nesta Unidade (
                    {selectedModalCompany.tradeName})
                  </div>
                  <div className="form-grid">
                    <div className="field">
                      <label>Nome Completo *</label>
                      <input
                        className="input"
                        required
                        value={newEmpName}
                        onChange={(e) => setNewEmpName(e.target.value)}
                        placeholder="Ex.: Mariana Costa"
                      />
                    </div>
                    <div className="field">
                      <label>E-mail Corporativo *</label>
                      <input
                        type="email"
                        className="input"
                        required
                        value={newEmpEmail}
                        onChange={(e) => setNewEmpEmail(e.target.value)}
                        placeholder="mariana@empresa.com.br"
                      />
                    </div>
                    <div className="field">
                      <label>Papel Operacional na Unidade *</label>
                      <select
                        className="select"
                        value={newEmpRole}
                        onChange={(e) => {
                          const r = e.target.value as OperationalEmployeeRole;
                          setNewEmpRole(r);
                          const spec = OPERATIONAL_EMPLOYEE_ROLES.find((item) => item.role === r);
                          if (spec) setNewEmpApprovalLimit(String(spec.defaultApprovalLimit));
                        }}
                      >
                        {OPERATIONAL_EMPLOYEE_ROLES.map((r) => (
                          <option key={r.role} value={r.role}>
                            {r.label} ({r.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label>Cargo / Função</label>
                      <input
                        className="input"
                        value={newEmpJobTitle}
                        onChange={(e) => setNewEmpJobTitle(e.target.value)}
                        placeholder="Ex.: Conferente de Lotes / Caixa"
                      />
                    </div>
                    <div className="field">
                      <label>Setor / Departamento</label>
                      <input
                        className="input"
                        value={newEmpDepartment}
                        onChange={(e) => setNewEmpDepartment(e.target.value)}
                        placeholder="Ex.: Logística / Frente de Loja"
                      />
                    </div>
                    <div className="field">
                      <label>Alçada de Aprovação de Baixas (R$)</label>
                      <input
                        type="number"
                        min={0}
                        step="100"
                        className="input tabular"
                        value={newEmpApprovalLimit}
                        onChange={(e) => setNewEmpApprovalLimit(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-3">
                    <button type="submit" className="btn btn-primary btn-sm">
                      <Plus size={14} /> Alocar Funcionário na Unidade
                    </button>
                  </div>
                </form>

                {/* Allocated Employees Table */}
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '28%' }}>Colaborador & E-mail</th>
                        <th style={{ width: '24%' }}>Papel & Setor</th>
                        <th style={{ width: '16%' }}>Alçada de Baixa</th>
                        <th style={{ width: '18%' }}>Cota / Licença</th>
                        <th style={{ width: '14%' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedModalSummary.allocatedEmployees.map((emp, idx) => {
                        const roleInfo = OPERATIONAL_EMPLOYEE_ROLES.find(
                          (r) => r.role === emp.role,
                        );
                        const isWithinFreeQuota = idx < selectedModalSummary.freeLimit;
                        return (
                          <tr key={emp.id}>
                            <td>
                              <div className="font-semibold text-xs">{emp.name}</div>
                              <div className="mono text-xs text-muted">{emp.email}</div>
                            </td>
                            <td>
                              <span className={`badge badge-${roleInfo?.badgeVariant || 'info'}`}>
                                {roleInfo?.label || emp.role}
                              </span>
                              <div className="text-xs text-muted mt-0.5">
                                {emp.jobTitle || emp.role} • {emp.department || 'Geral'}
                              </div>
                            </td>
                            <td className="tabular text-xs font-semibold">
                              {formatCurrency(
                                emp.writeoffApprovalLimit ?? 0,
                                'BRL',
                                session.language,
                              )}
                            </td>
                            <td>
                              {!emp.active ? (
                                <span className="badge badge-neutral">Inativo (Não consome)</span>
                              ) : isWithinFreeQuota ? (
                                <span className="badge badge-success">
                                  Cota Gratuita ({idx + 1}/{selectedModalSummary.freeLimit})
                                </span>
                              ) : (
                                <span className="badge badge-warning">
                                  Licença Extra (+
                                  {formatCurrency(
                                    selectedModalSummary.extraEmployeePrice,
                                    'BRL',
                                    session.language,
                                  )}
                                  )
                                </span>
                              )}
                            </td>
                            <td>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() =>
                                    handleToggleEmployeeActive(selectedModalCompany, emp.id)
                                  }
                                >
                                  {emp.active ? 'Inativar' : 'Ativar'}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  title="Remover da unidade"
                                  onClick={() =>
                                    handleRemoveEmployee(selectedModalCompany, emp.id, emp.name)
                                  }
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: MATRIZ & FILIAIS HIERARCHY */}
            {modalTab === 'branches' && (
              <div className="flex flex-col gap-4">
                <div className="card" style={{ padding: '1rem' }}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="font-semibold text-sm">
                        Posição na Hierarquia Societária:{' '}
                        {selectedModalCompany.isBranch
                          ? `Filial (${selectedModalCompany.branchCode || 'FILIAL'})`
                          : `Empresa Matriz (${selectedModalCompany.branchCode || 'MATRIZ'})`}
                      </div>
                      <div className="text-xs text-muted">
                        {selectedModalCompany.isBranch
                          ? `Esta unidade responde à Matriz: ${
                              selectedModalSummary.parentCompanyName || 'Não definida'
                            }`
                          : 'Esta unidade é uma Matriz principal e pode possuir múltiplas filiais vinculadas.'}
                      </div>
                    </div>
                    {selectedModalCompany.isBranch && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDetachBranchToMatriz(selectedModalCompany)}
                      >
                        Promover a Matriz Independente
                      </button>
                    )}
                  </div>
                </div>

                {!selectedModalCompany.isBranch && (
                  <>
                    <div className="card" style={{ padding: '1rem' }}>
                      <div className="font-semibold text-sm mb-2">
                        Vincular Unidade Existente como Filial de {selectedModalCompany.tradeName}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          className="select"
                          style={{ maxWidth: '420px' }}
                          value={attachBranchId}
                          onChange={(e) => setAttachBranchId(e.target.value)}
                        >
                          <option value="">Selecione uma empresa para anexar como filial...</option>
                          {companies
                            .filter(
                              (c) =>
                                c.id !== selectedModalCompany.id &&
                                c.parentCompanyId !== selectedModalCompany.id &&
                                !c.archiveMetadata.isArchived,
                            )
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.tradeName} ({c.address.city}/{c.address.state})
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={!attachBranchId}
                          onClick={handleAttachChildBranch}
                        >
                          <GitBranch size={14} /> Anexar como Filial
                        </button>
                        <Link
                          to="/app/global/empresas/nova"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedModalCompanyId(null)}
                        >
                          <Plus size={14} /> Cadastrar Nova Filial do Zero
                        </Link>
                      </div>
                    </div>

                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Código & Filial Vinculada</th>
                            <th>Gerente / Responsável</th>
                            <th>Equipe Alocada</th>
                            <th>Faturamento Mensal</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {companies
                            .filter((c) => c.isBranch && c.parentCompanyId === selectedModalCompany.id)
                            .map((branch) => {
                              const bSum = summariesByCompanyId.get(branch.id);
                              return (
                                <tr key={branch.id}>
                                  <td>
                                    <span className="badge badge-info mr-1">
                                      {branch.branchCode || 'FILIAL'}
                                    </span>
                                    <strong>{branch.tradeName}</strong>
                                    <div className="text-xs text-muted">
                                      {branch.address.city}/{branch.address.state}
                                    </div>
                                  </td>
                                  <td>
                                    <div className="text-xs font-semibold">
                                      {bSum?.adminOwnerName}
                                    </div>
                                    <div className="mono text-xs text-muted">
                                      {bSum?.adminOwnerEmail}
                                    </div>
                                  </td>
                                  <td>
                                    <span className="badge badge-teal">
                                      {bSum?.activeEmployeesCount || 0} / {bSum?.freeLimit || 10}{' '}
                                      grátis
                                    </span>
                                  </td>
                                  <td className="tabular font-semibold">
                                    {formatCurrency(
                                      bSum?.totalMonthlyBilling || 0,
                                      'BRL',
                                      session.language,
                                    )}
                                  </td>
                                  <td>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => openCompanyModal(branch, 'employees')}
                                      >
                                        Ver Equipe
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => handleDetachBranchToMatriz(branch)}
                                      >
                                        Desvincular
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          {companies.filter(
                            (c) => c.isBranch && c.parentCompanyId === selectedModalCompany.id,
                          ).length === 0 && (
                            <tr>
                              <td colSpan={5} className="text-center text-muted text-xs">
                                Nenhuma filial vinculada a esta Matriz no momento.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 3: LICENSING QUOTA & BILLING PER COMPANY */}
            {modalTab === 'licensing' && (
              <form onSubmit={handleSaveCompanyLicensingOverride} className="flex flex-col gap-4">
                <div className="kpi-grid">
                  <div className="kpi-card">
                    <span className="kpi-label">Plano Base ({selectedModalSummary.planName})</span>
                    <span className="kpi-value tabular">
                      {formatCurrency(
                        selectedModalSummary.basePlanMonthlyCost,
                        'BRL',
                        session.language,
                      )}
                    </span>
                    <span className="kpi-meta">
                      {selectedModalSummary.activeModulesCount} módulos ativos
                    </span>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-label">Licenças Extras de Funcionários</span>
                    <span className="kpi-value tabular" style={{ color: 'var(--warning)' }}>
                      +
                      {formatCurrency(
                        selectedModalSummary.extraLicensesMonthlyCost,
                        'BRL',
                        session.language,
                      )}
                    </span>
                    <span className="kpi-meta">
                      {selectedModalSummary.extraEmployeesCount} excedente(s) ×{' '}
                      {formatCurrency(
                        selectedModalSummary.extraEmployeePrice,
                        'BRL',
                        session.language,
                      )}
                    </span>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-label">Mensalidade Total da Unidade</span>
                    <span className="kpi-value tabular" style={{ color: 'var(--success)' }}>
                      {formatCurrency(
                        selectedModalSummary.totalMonthlyBilling,
                        'BRL',
                        session.language,
                      )}
                    </span>
                    <span className="kpi-meta">
                      Próximo vencimento: {selectedModalSummary.nextBillingDueDate}
                    </span>
                  </div>
                </div>

                <div className="card" style={{ padding: '1rem' }}>
                  <div className="font-semibold text-sm mb-2">
                    Parametrizar Exceção Comercial de Cota para {selectedModalCompany.tradeName}
                  </div>
                  <div className="form-grid">
                    <div className="field">
                      <label>Franquia de Funcionários Grátis nesta Unidade</label>
                      <input
                        type="number"
                        min={0}
                        className="input tabular"
                        value={customFreeQuota}
                        onChange={(e) => setCustomFreeQuota(e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Valor Mensal por Funcionário Extra (R$)</label>
                      <input
                        type="number"
                        min={0}
                        step="0.10"
                        className="input tabular"
                        value={customExtraPrice}
                        onChange={(e) => setCustomExtraPrice(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <Link
                      to="/app/global/meios-pagamento"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedModalCompanyId(null)}
                    >
                      Ir para Pagamentos por Empresa
                    </Link>
                    <button type="submit" className="btn btn-primary btn-sm">
                      <Save size={14} /> Salvar Regra desta Unidade
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 4: OVERVIEW */}
            {modalTab === 'overview' && (
              <div className="card" style={{ padding: '1rem' }}>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">ID / Código da Unidade:</span>
                    <code className="font-semibold">
                      {selectedModalCompany.id} ({selectedModalCompany.branchCode || 'MATRIZ'})
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Razão Social:</span>
                    <strong>{selectedModalCompany.legalName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">CNPJ / Documento Fiscal:</span>
                    <span className="mono">{selectedModalCompany.taxId || 'Não informado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Endereço Completo:</span>
                    <span>
                      {selectedModalCompany.address.street}, {selectedModalCompany.address.number} —{' '}
                      {selectedModalCompany.address.district}, {selectedModalCompany.address.city}/
                      {selectedModalCompany.address.state}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Link
                    to={`/app/global/empresas/${selectedModalCompany.id}`}
                    className="btn btn-secondary btn-sm"
                  >
                    Abrir Ficha Completa da Empresa
                  </Link>
                  <Link
                    to={`/app/global/empresas/${selectedModalCompany.id}/editar`}
                    className="btn btn-primary btn-sm"
                  >
                    <Edit3 size={14} /> Editar Dados Cadastrais
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </ModalDialog>

      <ArchiveRecordDialog
        open={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        recordTitle={archiveTarget ? `${archiveTarget.tradeName} (${archiveTarget.id})` : ''}
        onConfirmArchive={async (reason) => {
          if (!archiveTarget) return;
          await repositories.companies.archive(
            archiveTarget.id,
            reason,
            getActor(archiveTarget.id),
          );
          await refreshData();
          notify({
            type: 'warning',
            title: `Empresa ${archiveTarget.tradeName} arquivada com histórico preservado.`,
          });
        }}
      />
    </div>
  );
};

export const CompanyFormPage: React.FC<{ mode: 'create' | 'edit' }> = ({ mode }) => {
  const { empresaId } = useParams<{ empresaId: string }>();
  const { companies, hasPermission, getActor, refreshData, notify, t } = useApp();
  const navigate = useNavigate();

  const existing = mode === 'edit' ? companies.find((c) => c.id === empresaId) : undefined;
  const rules = getPlatformBillingRules();

  const [legalName, setLegalName] = useState(existing?.legalName || '');
  const [tradeName, setTradeName] = useState(existing?.tradeName || '');
  const [taxId, setTaxId] = useState(existing?.taxId || '');
  const [isBranch, setIsBranch] = useState<boolean>(Boolean(existing?.isBranch));
  const [parentCompanyId, setParentCompanyId] = useState<string>(existing?.parentCompanyId || '');
  const [branchCode, setBranchCode] = useState<string>(
    existing?.branchCode || (existing?.isBranch ? 'FIL-01' : 'MAT-01'),
  );
  const [freeEmployeesLimit, setFreeEmployeesLimit] = useState<string>(
    String(existing?.freeEmployeesLimit ?? rules.defaultFreeEmployeesPerStore),
  );
  const [extraEmployeePrice, setExtraEmployeePrice] = useState<string>(
    String(existing?.extraEmployeePrice ?? rules.defaultExtraEmployeePrice),
  );
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState<PaymentMethodType>(
    existing?.preferredPaymentMethod || 'pix',
  );
  const [country, setCountry] = useState(existing?.country || 'Brasil');
  const [defaultLanguage, setDefaultLanguage] = useState<LanguageCode>(
    existing?.defaultLanguage || 'pt-BR',
  );
  const [timezone, setTimezone] = useState(existing?.timezone || 'America/Sao_Paulo');
  const [currency, setCurrency] = useState<CurrencyCode>(existing?.currency || 'BRL');
  const [operationalStatus, setOperationalStatus] = useState<CompanyStatus>(
    existing?.operationalStatus || 'active',
  );
  const [registrationStatus, setRegistrationStatus] = useState<CompanyStatus>(
    existing?.registrationStatus || 'active',
  );
  const [contactName, setContactName] = useState(
    existing?.managerName || existing?.contacts[0]?.name || '',
  );
  const [contactEmail, setContactEmail] = useState(existing?.contacts[0]?.email || '');
  const [contactPhone, setContactPhone] = useState(existing?.contacts[0]?.phone || '');
  const [street, setStreet] = useState(existing?.address.street || '');
  const [number, setNumber] = useState(existing?.address.number || '');
  const [district, setDistrict] = useState(existing?.address.district || '');
  const [city, setCity] = useState(existing?.address.city || '');
  const [stateCode, setStateCode] = useState(existing?.address.state || 'SP');
  const [postalCode, setPostalCode] = useState(existing?.address.postalCode || '');
  const [allocatedEmployees, setAllocatedEmployees] = useState<CompanyAllocatedEmployee[]>(
    () => existing?.allocatedEmployees || [],
  );
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpRole, setNewEmpRole] = useState<CompanyAllocatedEmployee['role']>('INVENTORY');
  const [newEmpJob, setNewEmpJob] = useState('Operador de Unidade');
  const [newEmpDept, setNewEmpDept] = useState('Operações');
  const [isDirty, setIsDirty] = useState(false);

  if (mode === 'create' && !hasPermission('companies', 'create')) {
    return (
      <AccessDeniedView
        reason="Sem permissão para cadastrar novas empresas."
        requiredPermission="companies:create"
      />
    );
  }

  if (mode === 'edit' && (!existing || !hasPermission('companies', 'edit'))) {
    return (
      <AccessDeniedView
        reason="Empresa não localizada ou seu papel não possui permissão de edição."
        requiredPermission="companies:edit"
      />
    );
  }

  const availableMatrizes = companies.filter(
    (c) => !c.isBranch && c.id !== existing?.id && !c.archiveMetadata.isArchived,
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const actor = getActor(existing?.id);
    if (mode === 'create') {
      const newId = generateId('emp');
      const newCompany: CompanyEntity = {
        id: newId,
        legalName: legalName.trim(),
        tradeName: tradeName.trim(),
        taxId: taxId.trim() || undefined,
        isBranch,
        parentCompanyId: isBranch && parentCompanyId ? parentCompanyId : undefined,
        branchCode: branchCode.trim() || (isBranch ? 'FIL-01' : 'MAT-01'),
        managerName: contactName.trim() || 'Responsável Principal',
        freeEmployeesLimit: Math.max(0, Number(freeEmployeesLimit) || 10),
        extraEmployeePrice: Math.max(0, Number(extraEmployeePrice) || 19.9),
        preferredPaymentMethod,
        paymentStatus: 'ACTIVE',
        nextBillingDueDate: '2026-12-15',
        allocatedEmployees: [
          {
            id: generateId('emp-alloc'),
            name: contactName.trim() || 'Responsável Principal',
            email: contactEmail.trim() || 'contato@empresa.com.br',
            role: 'STORE_ADMIN',
            jobTitle: 'Administrador Titular da Unidade',
            department: 'Diretoria',
            active: true,
            writeoffApprovalLimit: 50000,
            allocatedAt: new Date().toISOString(),
          },
        ],
        country: country.trim(),
        defaultLanguage,
        timezone,
        currency,
        registrationStatus,
        operationalStatus,
        contacts: [
          {
            name: contactName.trim() || 'Responsável Principal',
            role: 'Administrador da Empresa',
            email: contactEmail.trim() || 'contato@empresa.com.br',
            phone: contactPhone.trim() || '+55 (11) 90000-0000',
          },
        ],
        address: {
          street: street.trim(),
          number: number.trim(),
          district: district.trim(),
          city: city.trim(),
          state: stateCode.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        archiveMetadata: { isArchived: false },
        changeHistory: [],
      };
      await repositories.companies.create(
        newCompany,
        actor,
        `Cadastro inicial da ${isBranch ? 'filial' : 'matriz'} ${newCompany.tradeName} (${newId}).`,
      );
      await repositories.companyModules.upsert(
        {
          id: generateId('sub'),
          companyId: newId,
          moduleId: 'mod-core',
          moduleCode: 'allin_core',
          status: 'active',
          billingCycle: 'monthly',
          agreedPrice: 149,
          currency,
          activatedAt: new Date().toISOString(),
          renewalDate: '2027-10-28',
        },
        actor,
        `Provisionamento automático do módulo base Allin Core para ${newCompany.tradeName}.`,
      );
      await refreshData();
      notify({
        type: 'success',
        title: `Empresa ${newCompany.tradeName} criada com sucesso.`,
        description: 'Módulo base Allin Core e cota de 10 funcionários provisionados.',
      });
      navigate(`/app/global/empresas/${newId}`);
    } else if (existing) {
      await repositories.companies.update(
        existing.id,
        (curr) => ({
          ...curr,
          legalName: legalName.trim(),
          tradeName: tradeName.trim(),
          taxId: taxId.trim() || undefined,
          isBranch,
          parentCompanyId: isBranch && parentCompanyId ? parentCompanyId : undefined,
          branchCode: branchCode.trim() || (isBranch ? 'FIL-01' : 'MAT-01'),
          managerName: contactName.trim(),
          freeEmployeesLimit: Math.max(0, Number(freeEmployeesLimit) || 10),
          extraEmployeePrice: Math.max(0, Number(extraEmployeePrice) || 19.9),
          preferredPaymentMethod,
          allocatedEmployees,
          country: country.trim(),
          defaultLanguage,
          timezone,
          currency,
          registrationStatus,
          operationalStatus,
          contacts: [
            {
              name: contactName.trim(),
              role: curr.contacts[0]?.role || 'Administrador',
              email: contactEmail.trim(),
              phone: contactPhone.trim(),
            },
          ],
          address: {
            ...curr.address,
            street: street.trim(),
            number: number.trim(),
            district: district.trim(),
            city: city.trim(),
            state: stateCode.trim(),
            postalCode: postalCode.trim(),
            country: country.trim(),
          },
        }),
        actor,
        `Atualização cadastral, filiação e regras de licenciamento da empresa ${tradeName.trim()}.`,
      );
      await refreshData();
      notify({
        type: 'success',
        title: t('msg.savedSuccess'),
      });
      navigate(`/app/global/empresas/${existing.id}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: t('scope.global'), to: '/app/global' },
          { label: t('nav.companies'), to: '/app/global/empresas' },
          { label: mode === 'create' ? 'Nova Empresa' : `Editar ${existing?.tradeName}` },
        ]}
        title={
          mode === 'create'
            ? 'Cadastrar Nova Empresa Cliente (Matriz ou Filial)'
            : `Editar Empresa — ${existing?.tradeName}`
        }
        subtitle="Configuração societária, vínculo Matriz/Filial, franquia de funcionários gratuitos e parâmetros financeiros."
        scopeBadge={t('scope.global')}
      />

      <UnsavedChangesBanner
        isDirty={isDirty}
        onDiscard={() =>
          navigate(existing ? `/app/global/empresas/${existing.id}` : '/app/global/empresas')
        }
      />

      <form onSubmit={handleSave} onChange={() => setIsDirty(true)}>
        <div className="form-section">
          <div className="form-section-title">1. Identificação Societária, Matriz / Filial & Cota</div>
          <div className="form-section-desc">
            Defina se esta unidade opera como Matriz principal ou Filial subordinada e sua cota gratuita de equipe.
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="comp-trade-name">Nome Fantasia *</label>
              <p id="comp-trade-hint" className="hint">
                Nome comercial exibido nos cabeçalhos e seletores de contexto.
              </p>
              <input
                id="comp-trade-name"
                className="input"
                required
                minLength={2}
                aria-describedby="comp-trade-hint"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                placeholder="Ex.: Olivelas Atelier"
              />
            </div>

            <div className="field">
              <label htmlFor="comp-legal-name">Razão Social / Nome Empresarial *</label>
              <p id="comp-legal-hint" className="hint">
                Denominação jurídica para contratos e cobranças.
              </p>
              <input
                id="comp-legal-name"
                className="input"
                required
                minLength={3}
                aria-describedby="comp-legal-hint"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Ex.: Olivelas Atelier & Manufatura Ltda."
              />
            </div>

            <div className="field">
              <label htmlFor="comp-tax-id">Documento Fiscal (Opcional — CNPJ / NIF / EIN)</label>
              <p id="comp-tax-hint" className="hint">
                Opcional conforme especificação. Ex.: 14.892.301/0001-42
              </p>
              <input
                id="comp-tax-id"
                className="input mono"
                aria-describedby="comp-tax-hint"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="00.000.000/0001-00"
              />
            </div>

            <div className="field">
              <label htmlFor="comp-hierarchy-type">Tipo de Unidade (Matriz ou Filial)</label>
              <select
                id="comp-hierarchy-type"
                className="select"
                value={isBranch ? 'branch' : 'matriz'}
                onChange={(e) => {
                  const nextIsBranch = e.target.value === 'branch';
                  setIsBranch(nextIsBranch);
                  if (nextIsBranch && !parentCompanyId && availableMatrizes[0]) {
                    setParentCompanyId(availableMatrizes[0].id);
                  }
                }}
              >
                <option value="matriz">Empresa Matriz (Sede Principal)</option>
                <option value="branch">Unidade Filial (Subordinada a uma Matriz)</option>
              </select>
            </div>

            {isBranch && (
              <div className="field">
                <label htmlFor="comp-parent-matriz">Empresa Matriz Principal *</label>
                <select
                  id="comp-parent-matriz"
                  className="select"
                  required
                  value={parentCompanyId}
                  onChange={(e) => setParentCompanyId(e.target.value)}
                >
                  <option value="">Selecione a Matriz...</option>
                  {availableMatrizes.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.tradeName} ({m.taxId || m.id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="field">
              <label htmlFor="comp-branch-code">Código Interno da Unidade</label>
              <input
                id="comp-branch-code"
                className="input mono"
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                placeholder="Ex.: MAT-SP-01 ou FIL-SUL-01"
              />
            </div>

            <div className="field">
              <label htmlFor="comp-free-quota">Cota de Funcionários Grátis na Unidade</label>
              <input
                id="comp-free-quota"
                type="number"
                min={0}
                className="input tabular"
                value={freeEmployeesLimit}
                onChange={(e) => setFreeEmployeesLimit(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="comp-extra-price">Valor por Funcionário Extra (R$/mês)</label>
              <input
                id="comp-extra-price"
                type="number"
                min={0}
                step="0.10"
                className="input tabular"
                value={extraEmployeePrice}
                onChange={(e) => setExtraEmployeePrice(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="comp-pref-pm">Meio de Pagamento Preferencial</label>
              <select
                id="comp-pref-pm"
                className="select"
                value={preferredPaymentMethod}
                onChange={(e) => setPreferredPaymentMethod(e.target.value as PaymentMethodType)}
              >
                <option value="pix">PIX Corporativo Instantâneo</option>
                <option value="boleto">Boleto Bancário Registrado</option>
                <option value="credit_card">Cartão de Crédito Recorrente</option>
                <option value="bank_transfer">Transferência TED / Wire</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">2. Regionalização, Moeda & Estado Operacional</div>
          <div className="form-section-desc">
            Configurações padrão de idioma, fuso horário e status de acesso do tenant.
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="comp-country">País *</label>
              <input
                id="comp-country"
                className="input"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="comp-lang">Idioma Padrão</label>
              <select
                id="comp-lang"
                className="select"
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value as LanguageCode)}
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="comp-currency">Moeda Principal</label>
              <select
                id="comp-currency"
                className="select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              >
                <option value="BRL">BRL (R$)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="comp-tz">Fuso Horário</label>
              <input
                id="comp-tz"
                className="input mono"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="comp-reg-status">Estado Cadastral</label>
              <select
                id="comp-reg-status"
                className="select"
                value={registrationStatus}
                onChange={(e) => setRegistrationStatus(e.target.value as CompanyStatus)}
              >
                <option value="pending">Pendente</option>
                <option value="active">Ativa</option>
                <option value="suspended">Suspensa</option>
                <option value="archived">Arquivada</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="comp-op-status">Estado Operacional</label>
              <select
                id="comp-op-status"
                className="select"
                value={operationalStatus}
                onChange={(e) => setOperationalStatus(e.target.value as CompanyStatus)}
              >
                <option value="pending">Pendente</option>
                <option value="active">Ativa</option>
                <option value="suspended">Suspensa</option>
                <option value="archived">Arquivada</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">3. Contato Institucional & Endereço Sede</div>
          <div className="form-section-desc">
            Responsável pelo recebimento de notificações contratuais e faturamento.
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="comp-contact-name">Nome do Contato Principal *</label>
              <input
                id="comp-contact-name"
                className="input"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="comp-contact-email">E-mail Corporativo *</label>
              <input
                id="comp-contact-email"
                type="email"
                className="input"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="comp-contact-phone">Telefone Comercial *</label>
              <input
                id="comp-contact-phone"
                className="input"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="comp-street">Logradouro *</label>
              <input
                id="comp-street"
                className="input"
                required
                value={street}
                onChange={(e) => setStreet(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="comp-number">Número / Complemento *</label>
              <input
                id="comp-number"
                className="input"
                required
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="comp-district">Bairro *</label>
              <input
                id="comp-district"
                className="input"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="comp-city">Cidade *</label>
              <input
                id="comp-city"
                className="input"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="comp-state">UF / Estado *</label>
              <input
                id="comp-state"
                className="input"
                required
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="comp-zip">CEP / Código Postal *</label>
              <input
                id="comp-zip"
                className="input mono"
                required
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">
            4. Alocação de Funcionários na Unidade (Franquia de {freeEmployeesLimit || 10} Grátis)
          </div>
          <div className="form-section-desc">
            Gerencie os colaboradores alocados nesta Matriz ou Filial diretamente nesta página dedicada (ID: {existing?.id || 'nova'}).
          </div>

          <div className="form-grid mb-3">
            <div className="field">
              <label>Nome do Funcionário</label>
              <input
                className="input"
                value={newEmpName}
                onChange={(e) => setNewEmpName(e.target.value)}
                placeholder="Ex.: Mariana Costa"
              />
            </div>
            <div className="field">
              <label>E-mail Corporativo</label>
              <input
                className="input"
                value={newEmpEmail}
                onChange={(e) => setNewEmpEmail(e.target.value)}
                placeholder="mariana@empresa.com.br"
              />
            </div>
            <div className="field">
              <label>Papel Operacional</label>
              <select
                className="select"
                value={newEmpRole}
                onChange={(e) => setNewEmpRole(e.target.value as CompanyAllocatedEmployee['role'])}
              >
                {OPERATIONAL_EMPLOYEE_ROLES.map((r) => (
                  <option key={r.role} value={r.role}>
                    {r.role} ({r.label})
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  if (!newEmpName.trim() || !newEmpEmail.trim()) return;
                  setAllocatedEmployees((prev) => [
                    ...prev,
                    {
                      id: generateId('emp-alloc'),
                      name: newEmpName.trim(),
                      email: newEmpEmail.trim().toLowerCase(),
                      role: newEmpRole,
                      jobTitle: newEmpJob,
                      department: newEmpDept,
                      active: true,
                      writeoffApprovalLimit: newEmpRole === 'STOCK_APPROVER' ? 5000 : 500,
                      allocatedAt: new Date().toISOString(),
                    },
                  ]);
                  setNewEmpName('');
                  setNewEmpEmail('');
                  setIsDirty(true);
                }}
              >
                <UserPlus size={14} /> Alocar Funcionário na Unidade
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Funcionário &amp; E-mail</th>
                  <th>Papel / Departamento</th>
                  <th>Status na Cota ({freeEmployeesLimit || 10} Grátis)</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {allocatedEmployees.map((emp, idx) => {
                  const limit = Math.max(0, Number(freeEmployeesLimit) || 10);
                  const isWithinFree = idx < limit;
                  return (
                    <tr key={emp.id}>
                      <td>
                        <div className="font-semibold">{emp.name}</div>
                        <div className="mono text-xs text-muted">{emp.email}</div>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{emp.role}</span>{' '}
                        <span className="text-xs text-muted">{emp.department}</span>
                      </td>
                      <td>
                        {!emp.active ? (
                          <span className="badge badge-neutral">Inativo (Não consome cota)</span>
                        ) : isWithinFree ? (
                          <span className="badge badge-success">
                            Grátis ({idx + 1}/{limit})
                          </span>
                        ) : (
                          <span className="badge badge-warning">
                            Excedente (+R$ {extraEmployeePrice}/mês)
                          </span>
                        )}
                      </td>
                      <td>
                        <ActionDropdownMenu
                          label="Ações"
                          items={[
                            {
                              id: 'toggle',
                              label: emp.active ? 'Pausar Licença' : 'Ativar Licença',
                              icon: <UserCheck size={14} />,
                              onClick: () => {
                                setAllocatedEmployees((prev) =>
                                  prev.map((e) => (e.id === emp.id ? { ...e, active: !e.active } : e)),
                                );
                                setIsDirty(true);
                              },
                            },
                            {
                              id: 'remove',
                              label: 'Desalocar da Unidade',
                              icon: <Trash2 size={14} />,
                              variant: 'danger',
                              onClick: () => {
                                setAllocatedEmployees((prev) => prev.filter((e) => e.id !== emp.id));
                                setIsDirty(true);
                              },
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link
            to={existing ? `/app/global/empresas/${existing.id}` : '/app/global/empresas'}
            className="btn btn-secondary"
          >
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

export const CompanyDetailHubPage: React.FC<{
  tab: 'overview' | 'usuarios' | 'modulos' | 'contratos' | 'financeiro';
}> = ({ tab }) => {
  const { empresaId } = useParams<{ empresaId: string }>();
  const {
    companies,
    users,
    roles,
    modules,
    companyModules,
    contracts,
    charges,
    session,
    hasPermission,
    isCurrentSuperAdmin,
    startSupportImpersonation,
    getActor,
    refreshData,
    notify,
    t,
  } = useApp();
  const navigate = useNavigate();

  const company = companies.find((c) => c.id === empresaId);
  if (!company) {
    return (
      <AccessDeniedView
        title="Empresa Não Localizada"
        reason={`Não encontramos a empresa de ID "${empresaId}".`}
        backTo="/app/global/empresas"
      />
    );
  }

  const rules = getPlatformBillingRules();
  const licenseSummary = computeCompanyLicenseSummary(
    company,
    companies,
    rules,
    companyModules,
    contracts,
  );
  const childBranches = companies.filter(
    (c) => c.isBranch && c.parentCompanyId === company.id && !c.archiveMetadata.isArchived,
  );

  const companyUsers = users.filter((u) => u.companyIds.includes(company.id));
  const companySubs = companyModules.filter((cm) => cm.companyId === company.id);
  const companyContracts = contracts.filter((ct) => ct.companyId === company.id);
  const companyCharges = charges.filter((ch) => ch.companyId === company.id);

  const handleToggleModuleForCompany = async (modId: string, modCode: string, modPrice: number) => {
    const existingSub = companySubs.find((s) => s.moduleId === modId);
    const actor = getActor(company.id);
    if (existingSub) {
      const nextStatus = existingSub.status === 'active' ? 'cancelled' : 'active';
      await repositories.companyModules.upsert(
        {
          ...existingSub,
          status: nextStatus,
        },
        actor,
        `Alteração do estado do módulo ${modCode} na empresa ${company.tradeName} para ${nextStatus}.`,
      );
    } else {
      await repositories.companyModules.upsert(
        {
          id: generateId('sub'),
          companyId: company.id,
          moduleId: modId,
          moduleCode: modCode,
          status: 'active',
          billingCycle: 'monthly',
          agreedPrice: modPrice,
          currency: company.currency,
          activatedAt: new Date().toISOString(),
          renewalDate: '2027-10-28',
        },
        actor,
        `Ativação do módulo comercial ${modCode} para a empresa ${company.tradeName}.`,
      );
    }
    await refreshData();
    notify({
      type: 'success',
      title: `Módulo ${modCode} atualizado para ${company.tradeName}.`,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: t('scope.global'), to: '/app/global' },
          { label: t('nav.companies'), to: '/app/global/empresas' },
          { label: company.tradeName },
        ]}
        title={`${company.isBranch ? '[FILIAL]' : '[MATRIZ]'} ${company.tradeName} (${company.id})`}
        subtitle={`${company.legalName} • Código: ${company.branchCode || 'MATRIZ'} • Equipe Ativa: ${
          licenseSummary.activeEmployeesCount
        }/${licenseSummary.freeLimit} grátis • Mensalidade Total: ${formatCurrency(
          licenseSummary.totalMonthlyBilling,
          'BRL',
          session.language,
        )}`}
        scopeBadge={`Tenant ID: ${company.id}`}
        actions={
          <>
            {hasPermission('companies', 'edit') && (
              <Link
                to={`/app/global/empresas/${company.id}/editar`}
                className="btn btn-secondary btn-sm"
              >
                <Edit3 size={14} />
                Editar Empresa & Filiação
              </Link>
            )}
            {isCurrentSuperAdmin && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={async () => {
                  await startSupportImpersonation(
                    company.id,
                    `Acesso de suporte técnico via ficha cadastral de ${company.tradeName}.`,
                  );
                  navigate(`/app/empresa/${company.id}`);
                }}
              >
                <UserCheck size={14} />
                Ingressar no Ambiente da Empresa (Auditado)
              </button>
            )}
          </>
        }
      />

      {/* Dedicated URL Navigation Tabs */}
      <nav className="tabs-bar" aria-label="Sub-rotas da empresa">
        <NavLink
          to={`/app/global/empresas/${company.id}`}
          end
          className={({ isActive }) => `tab-link ${isActive ? 'active' : ''}`}
        >
          Ficha Cadastral, Filiais & Equipe ({licenseSummary.activeEmployeesCount})
        </NavLink>
        <NavLink
          to={`/app/global/empresas/${company.id}/usuarios`}
          className={({ isActive }) => `tab-link ${isActive ? 'active' : ''}`}
        >
          Usuários HBAC ({companyUsers.length})
        </NavLink>
        <NavLink
          to={`/app/global/empresas/${company.id}/modulos`}
          className={({ isActive }) => `tab-link ${isActive ? 'active' : ''}`}
        >
          Módulos Contratados ({companySubs.filter((s) => s.status === 'active').length})
        </NavLink>
        <NavLink
          to={`/app/global/empresas/${company.id}/contratos`}
          className={({ isActive }) => `tab-link ${isActive ? 'active' : ''}`}
        >
          Contratos ({companyContracts.length})
        </NavLink>
        <NavLink
          to={`/app/global/empresas/${company.id}/financeiro`}
          className={({ isActive }) => `tab-link ${isActive ? 'active' : ''}`}
        >
          Histórico Financeiro ({companyCharges.length})
        </NavLink>
      </nav>

      {tab === 'overview' && (
        <div className="flex flex-col gap-4">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: '1rem' }}>Dados Societários, Filiação e Localização</h2>
                <StatusBadge status={company.operationalStatus} />
              </div>
              <div className="card-body flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Identificador Único:</span>
                  <code className="font-semibold">{company.id}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Nível Hierárquico:</span>
                  <span className="font-semibold">
                    {company.isBranch
                      ? `Filial (${company.branchCode || 'FILIAL'}) — Matriz: ${
                          licenseSummary.parentCompanyName || company.parentCompanyId
                        }`
                      : `Matriz Principal (${company.branchCode || 'MATRIZ'}) — ${
                          childBranches.length
                        } filial(is)`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Razão Social:</span>
                  <strong>{company.legalName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Nome Fantasia:</span>
                  <strong>{company.tradeName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Documento Fiscal:</span>
                  <span className="mono">{company.taxId || 'Não informado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Cota de Funcionários:</span>
                  <span className="font-semibold">
                    {licenseSummary.activeEmployeesCount} ativos / {licenseSummary.freeLimit} grátis
                    ({licenseSummary.extraEmployeesCount} extra)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Mensalidade Total (Plano + Equipe):</span>
                  <strong style={{ color: 'var(--success)' }}>
                    {formatCurrency(licenseSummary.totalMonthlyBilling, 'BRL', session.language)}
                    /mês
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Endereço:</span>
                  <span>
                    {company.address.street}, {company.address.number} — {company.address.district},{' '}
                    {company.address.city}/{company.address.state} ({company.address.postalCode})
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: '1rem' }}>Contatos, Filiais & Histórico de Alterações</h2>
              </div>
              <div className="card-body flex flex-col gap-3">
                {company.contacts.map((ct, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.75rem',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div className="font-semibold text-sm">
                      {ct.name} <span className="text-xs text-muted">({ct.role})</span>
                    </div>
                    <div className="text-xs mono mt-2">
                      {ct.email} • {ct.phone}
                    </div>
                  </div>
                ))}

                {!company.isBranch && childBranches.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <div className="text-xs font-semibold text-muted">
                      FILIAIS VINCULADAS A ESTA MATRIZ ({childBranches.length})
                    </div>
                    {childBranches.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between text-xs"
                        style={{
                          padding: '0.5rem 0.75rem',
                          background: 'var(--bg-elevated)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <div>
                          <span className="badge badge-info mr-1">{b.branchCode || 'FILIAL'}</span>
                          <strong>{b.tradeName}</strong> ({b.address.city}/{b.address.state})
                        </div>
                        <Link
                          to={`/app/global/empresas/${b.id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          Abrir Filial
                        </Link>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-xs font-semibold text-muted mt-2">
                  HISTÓRICO DE REVISÕES DO REGISTRO ({company.changeHistory.length})
                </div>
                {company.changeHistory.map((chg) => (
                  <div key={chg.id} className="text-xs text-muted">
                    <span className="tabular">{formatDateTime(chg.timestamp, session.language)}</span>{' '}
                    — <strong>{chg.actorName}</strong>: {chg.summary}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Allocated Operational Employees Summary Card */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2 style={{ fontSize: '1rem' }}>
                  Funcionários Alocados na Unidade ({licenseSummary.activeEmployeesCount} ativos /{' '}
                  {licenseSummary.freeLimit} grátis)
                </h2>
                <p className="text-xs text-muted">
                  Controle de papéis operacionais, alçada de aprovação de baixas de estoque e cota de
                  licenças.
                </p>
              </div>
              <Link to="/app/global/empresas" className="btn btn-secondary btn-sm">
                <Users size={14} /> Gerenciar Alocação em Modal
              </Link>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Funcionário & E-mail</th>
                    <th>Papel Operacional</th>
                    <th>Cargo & Setor</th>
                    <th>Alçada de Baixa</th>
                    <th>Licenciamento</th>
                  </tr>
                </thead>
                <tbody>
                  {licenseSummary.allocatedEmployees.map((emp, idx) => {
                    const roleSpec = OPERATIONAL_EMPLOYEE_ROLES.find((r) => r.role === emp.role);
                    const isFree = idx < licenseSummary.freeLimit;
                    return (
                      <tr key={emp.id}>
                        <td>
                          <div className="font-semibold text-xs">{emp.name}</div>
                          <div className="mono text-xs text-muted">{emp.email}</div>
                        </td>
                        <td>
                          <span className={`badge badge-${roleSpec?.badgeVariant || 'info'}`}>
                            {roleSpec?.label || emp.role}
                          </span>
                        </td>
                        <td className="text-xs">
                          {emp.jobTitle || emp.role} • {emp.department || 'Operações'}
                        </td>
                        <td className="tabular text-xs font-semibold">
                          {formatCurrency(
                            emp.writeoffApprovalLimit ?? 0,
                            'BRL',
                            session.language,
                          )}
                        </td>
                        <td>
                          {!emp.active ? (
                            <span className="badge badge-neutral">Inativo</span>
                          ) : isFree ? (
                            <span className="badge badge-success">
                              Franquia Grátis ({idx + 1}/{licenseSummary.freeLimit})
                            </span>
                          ) : (
                            <span className="badge badge-warning">
                              Licença Extra (+
                              {formatCurrency(
                                licenseSummary.extraEmployeePrice,
                                'BRL',
                                session.language,
                              )}
                              /mês)
                            </span>
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
      )}

      {tab === 'usuarios' && (
        <UrlDataTable<UserEntity>
          tableId={`company-hub-users-${company.id}`}
          caption={`Usuários associados a ${company.tradeName}`}
          items={companyUsers}
          defaultSortField="name"
          csvFilename={`usuarios-${company.id}.csv`}
          searchPlaceholder="Buscar por nome, e-mail ou telefone..."
          statusExtractor={(u) => u.status}
          searchExtractor={(u) => `${u.name} ${u.email} ${u.phone}`}
          statusOptions={[
            { value: 'active', label: t('status.active') },
            { value: 'pending', label: t('status.pending') },
            { value: 'suspended', label: t('status.suspended') },
          ]}
          columns={[
            {
              key: 'name',
              header: 'Nome',
              sortable: true,
              render: (u) => <span className="font-semibold">{u.name}</span>,
            },
            {
              key: 'email',
              header: 'E-mail',
              sortable: true,
              render: (u) => <span className="mono text-xs">{u.email}</span>,
            },
            {
              key: 'roles',
              header: 'Papéis HBAC',
              render: (u) => (
                <div className="flex items-center gap-1 flex-wrap">
                  {getUserActiveRoles(u, roles).map((r) => (
                    <span key={r.id} className="badge badge-info">
                      {r.name[session.language]}
                    </span>
                  ))}
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Estado',
              render: (u) => <StatusBadge status={u.status} />,
            },
            {
              key: 'actions',
              header: 'Ações',
              render: (u) => (
                <Link to={`/app/global/usuarios/${u.id}`} className="btn btn-secondary btn-sm">
                  Inspecionar HBAC
                </Link>
              ),
            },
          ]}
        />
      )}

      {tab === 'modulos' && (
        <UrlDataTable<CatalogModuleEntity>
          tableId={`company-hub-modules-${company.id}`}
          caption={`Módulos comerciais contratados por ${company.tradeName}`}
          items={modules}
          defaultSortField="code"
          csvFilename={`modulos-contratados-${company.id}.csv`}
          searchPlaceholder="Buscar módulo comercial, código ou schema PostgreSQL..."
          statusExtractor={(mod) => {
            const sub = companySubs.find((s) => s.moduleId === mod.id);
            return sub?.status || 'not_contracted';
          }}
          searchExtractor={(mod) =>
            `${mod.code} ${mod.name['pt-BR']} ${mod.description['pt-BR']} ${mod.dbSchema || ''}`
          }
          statusOptions={[
            { value: 'active', label: 'Ativo / Contratado' },
            { value: 'not_contracted', label: 'Não Contratado' },
            { value: 'cancelled', label: 'Suspenso / Cancelado' },
          ]}
          columns={[
            {
              key: 'code',
              header: 'Código & Porta',
              sortable: true,
              render: (mod) => {
                const demoSlug = mod.ecosystemSlug || mod.code;
                const instInfo = !mod.isExample
                  ? buildModuleInstanceLaunchUrl({
                      moduleSlug: demoSlug,
                      companyId: company.id,
                      companyName: company.tradeName,
                    })
                  : null;
                return (
                  <div className="flex flex-col gap-1">
                    <code className="text-xs">{mod.code}</code>
                    {instInfo && (
                      <div title={instInfo.instanceId}>
                        <span className="badge badge-teal mono">
                          :{instInfo.port}
                          {instInfo.serverSpec.adminPath}
                        </span>
                      </div>
                    )}
                  </div>
                );
              },
            },
            {
              key: 'name',
              header: 'Módulo Comercial',
              render: (mod) => (
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <strong>{mod.name[session.language]}</strong>
                    {mod.isStaticPage && (
                      <span className="badge badge-neutral">Página Estática</span>
                    )}
                  </div>
                  <div className="text-xs text-muted">{mod.description[session.language]}</div>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Estado na Empresa',
              render: (mod) => {
                const sub = companySubs.find((s) => s.moduleId === mod.id);
                return <StatusBadge status={sub?.status || 'not_contracted'} />;
              },
            },
            {
              key: 'priceMonthly',
              header: 'Valor Mensal',
              sortable: true,
              isNumeric: true,
              render: (mod) => (
                <span className="tabular font-semibold">
                  {formatCurrency(mod.priceMonthly, mod.currency, session.language)}
                </span>
              ),
            },
            {
              key: 'actions',
              header: 'Acesso SSO & Ação',
              render: (mod) => {
                const sub = companySubs.find((s) => s.moduleId === mod.id);
                const isActive = sub?.status === 'active';
                const demoSlug = mod.ecosystemSlug || mod.code;
                return (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {!mod.isExample && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() =>
                          openModuleInstanceInNewTab({
                            moduleSlug: demoSlug,
                            companyId: company.id,
                            companyName: company.tradeName,
                          })
                        }
                      >
                        <ExternalLink size={12} />
                        Abrir Instância
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={mod.isCore && isActive}
                      className={`btn btn-sm ${isActive ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() =>
                        handleToggleModuleForCompany(mod.id, mod.code, mod.priceMonthly)
                      }
                    >
                      {mod.isCore && isActive
                        ? 'Base Obrigatória'
                        : isActive
                          ? 'Suspender Módulo'
                          : 'Ativar Módulo'}
                    </button>
                  </div>
                );
              },
            },
          ]}
        />
      )}

      {tab === 'contratos' && (
        <UrlDataTable<ContractEntity>
          tableId={`company-hub-contracts-${company.id}`}
          caption={`Contratos de ${company.tradeName}`}
          items={companyContracts}
          defaultSortField="code"
          csvFilename={`contratos-${company.id}.csv`}
          searchPlaceholder="Buscar por código do contrato ou plano..."
          statusExtractor={(ct) => ct.status}
          searchExtractor={(ct) => `${ct.code} ${ct.planName} ${ct.status}`}
          statusOptions={[
            { value: 'active', label: t('status.active') },
            { value: 'pending_signature', label: 'Aguardando Assinatura' },
            { value: 'draft', label: 'Rascunho' },
          ]}
          columns={[
            {
              key: 'code',
              header: 'Código & Versão',
              sortable: true,
              render: (ct) => (
                <div>
                  <span className="mono font-semibold">{ct.code}</span>
                  <div className="text-xs text-muted tabular">Versão v{ct.version}</div>
                </div>
              ),
            },
            {
              key: 'planName',
              header: 'Plano',
              render: (ct) => <span>{ct.planName}</span>,
            },
            {
              key: 'dates',
              header: 'Vigência',
              render: (ct) => (
                <span className="text-xs tabular">
                  {ct.startDate} → {ct.endDate}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Estado',
              render: (ct) => <StatusBadge status={ct.status} />,
            },
            {
              key: 'finalValue',
              header: 'Valor Final',
              sortable: true,
              isNumeric: true,
              render: (ct) => (
                <span className="font-semibold tabular">
                  {formatCurrency(ct.finalValue, ct.currency, session.language)}
                </span>
              ),
            },
            {
              key: 'actions',
              header: 'Ficha',
              render: (ct) => (
                <Link to={`/app/global/contratos/${ct.id}`} className="btn btn-secondary btn-sm">
                  Ver Contrato
                </Link>
              ),
            },
          ]}
        />
      )}

      {tab === 'financeiro' && (
        <UrlDataTable<ChargeEntity>
          tableId={`company-hub-charges-${company.id}`}
          caption={`Cobranças e faturamento de ${company.tradeName}`}
          items={companyCharges}
          defaultSortField="dueDate"
          csvFilename={`financeiro-${company.id}.csv`}
          searchPlaceholder="Buscar por código da fatura, descrição ou meio de pagamento..."
          statusExtractor={(ch) => ch.status}
          searchExtractor={(ch) => `${ch.code} ${ch.description} ${ch.paymentMethodType}`}
          statusOptions={[
            { value: 'paid', label: t('status.paid') },
            { value: 'pending', label: t('status.pending') },
            { value: 'overdue', label: t('status.overdue') },
          ]}
          columns={[
            {
              key: 'code',
              header: 'Fatura',
              sortable: true,
              render: (ch) => <span className="mono font-semibold">{ch.code}</span>,
            },
            {
              key: 'description',
              header: 'Descrição',
              render: (ch) => <span>{ch.description}</span>,
            },
            {
              key: 'dueDate',
              header: 'Vencimento',
              sortable: true,
              render: (ch) => <span className="tabular">{ch.dueDate}</span>,
            },
            {
              key: 'paymentMethodType',
              header: 'Meio',
              render: (ch) => <span className="badge">{ch.paymentMethodType.toUpperCase()}</span>,
            },
            {
              key: 'status',
              header: 'Estado',
              render: (ch) => <StatusBadge status={ch.status} />,
            },
            {
              key: 'amount',
              header: 'Valor',
              sortable: true,
              isNumeric: true,
              render: (ch) => (
                <span className="font-semibold tabular">
                  {formatCurrency(ch.amount, ch.currency, session.language)}
                </span>
              ),
            },
          ]}
        />
      )}
    </div>
  );
};
