import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CreditCard,
  Database,
  Edit3,
  Eye,
  KeyRound,
  Layers,
  Lock,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Wand2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  changeUserPasswordInSupabase,
  validatePasswordStrength,
} from '../../services/supabaseAuthService';
import {
  OLIVELAS_ECOSYSTEM_MODULES,
  syncUnifiedUserProfileToSupabase,
} from '../../services/olivelasEcosystemService';
import {
  computeCompanyLicenseSummary,
  getPlatformBillingRules,
} from '../../services/enterpriseFinanceAndContractsService';
import {
  IndividualPermissionOverride,
  LanguageCode,
  PermissionAction,
  PermissionGrant,
  PermissionResource,
  PermissionScope,
  RoleEntity,
  UserEntity,
} from '../../types/domain';
import { generateId, recordAuditEvent, repositories } from '../../repositories/repositories';
import { formatCurrency, formatDateTime } from '../../i18n/translations';
import {
  ACTION_LABELS,
  ALL_ACTIONS,
  ALL_RESOURCES,
  buildEffectivePermissionMatrix,
  getUserActiveRoles,
  RESOURCE_LABELS,
  validateNoPrivilegeEscalation,
} from '../../services/hbacService';
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

export interface CommercialPermissionPackage {
  id: string;
  name: string;
  badge: string;
  description: string;
  roleIdToEnsure: string;
  resourcesToAllow: Array<{ resource: PermissionResource; action: PermissionAction }>;
}

export const COMMERCIAL_PERMISSION_PACKAGES: CommercialPermissionPackage[] = [
  {
    id: 'pkg-starter-op',
    name: 'Pacote Starter — Operação & Atendimento',
    badge: 'Essencial',
    description: 'Libera Dashboard, Estoque (Visualização/Criação), Pedidos, CRM e Suporte sem acesso a dados financeiros sensíveis.',
    roleIdToEnsure: 'role-funcionario',
    resourcesToAllow: [
      { resource: 'dashboard', action: 'view' },
      { resource: 'inventory', action: 'view' },
      { resource: 'inventory', action: 'create' },
      { resource: 'orders', action: 'view' },
      { resource: 'orders', action: 'create' },
      { resource: 'crm', action: 'view' },
      { resource: 'tickets', action: 'view' },
    ],
  },
  {
    id: 'pkg-erp-manager',
    name: 'Pacote Gestor Multi-Loja — Financeiro, Contratos & Equipe',
    badge: 'Mais Contratado',
    description: 'Libera gestão de Estoque, Vendas, Financeiro, Contratos A4, Usuários/Filiais e Relatórios Curva ABC.',
    roleIdToEnsure: 'role-gerente',
    resourcesToAllow: [
      { resource: 'dashboard', action: 'view' },
      { resource: 'companies', action: 'view' },
      { resource: 'users', action: 'view' },
      { resource: 'users', action: 'edit' },
      { resource: 'contracts', action: 'view' },
      { resource: 'contracts', action: 'edit' },
      { resource: 'finance', action: 'view' },
      { resource: 'finance', action: 'edit' },
      { resource: 'reports', action: 'view' },
      { resource: 'inventory', action: 'view' },
      { resource: 'orders', action: 'view' },
    ],
  },
  {
    id: 'pkg-enterprise-full',
    name: 'Pacote Enterprise Full — Governança, API Hub & Auditoria Forense',
    badge: 'Enterprise + IA',
    description: 'Habilita todos os recursos operacionais, financeiros, contratos, API Studio De->Para e trilha de auditoria forense.',
    roleIdToEnsure: 'role-admin',
    resourcesToAllow: [
      { resource: 'dashboard', action: 'view' },
      { resource: 'companies', action: 'view' },
      { resource: 'users', action: 'view' },
      { resource: 'roles', action: 'view' },
      { resource: 'modules', action: 'view' },
      { resource: 'contracts', action: 'view' },
      { resource: 'finance', action: 'view' },
      { resource: 'tickets', action: 'view' },
      { resource: 'audit', action: 'view' },
      { resource: 'api_hub', action: 'view' },
      { resource: 'reports', action: 'view' },
    ],
  },
];

export interface ScreenDependencyRule {
  id: string;
  screenName: string;
  primaryResource: PermissionResource;
  primaryAction: PermissionAction;
  requiredResource: PermissionResource;
  requiredAction: PermissionAction;
  impactIfMissing: string;
  stillWorksNote: string;
}

export const SCREEN_DEPENDENCY_RULES: ScreenDependencyRule[] = [
  {
    id: 'dep-contracts-finance',
    screenName: 'Contratos & Assinaturas (/app/global/contratos)',
    primaryResource: 'contracts',
    primaryAction: 'view',
    requiredResource: 'finance',
    requiredAction: 'view',
    impactIfMissing: 'Sem finance:view, o operador visualiza o contrato A4, mas não consegue conciliar faturas nem ver o livro-razão financeiro da empresa.',
    stillWorksNote: 'A leitura das cláusulas contratuais e download em PDF/DOCX continuam funcionando normalmente.',
  },
  {
    id: 'dep-orders-inventory',
    screenName: 'Pedidos Comerciais & PDV (/operacao/vendas)',
    primaryResource: 'orders',
    primaryAction: 'create',
    requiredResource: 'inventory',
    requiredAction: 'view',
    impactIfMissing: 'Sem inventory:view, a emissão de pedidos não consegue consultar o saldo disponível de SKUs nem a Curva ABC.',
    stillWorksNote: 'A listagem histórica de pedidos faturados permanece acessível.',
  },
  {
    id: 'dep-users-companies',
    screenName: 'Gestão de Usuários & Alocação em Filiais (/app/global/usuarios)',
    primaryResource: 'users',
    primaryAction: 'edit',
    requiredResource: 'companies',
    requiredAction: 'view',
    impactIfMissing: 'Sem companies:view, o gestor não consegue visualizar a hierarquia Matriz/Filial nem a cota de 10 funcionários grátis ao vincular unidades.',
    stillWorksNote: 'A edição de nome, telefone e idioma do usuário continua operando.',
  },
  {
    id: 'dep-roles-audit',
    screenName: 'Governança de Papéis HBAC (/app/global/papeis)',
    primaryResource: 'roles',
    primaryAction: 'edit',
    requiredResource: 'audit',
    requiredAction: 'view',
    impactIfMissing: 'Sem audit:view, o administrador altera permissões HBAC mas não consegue inspecionar o Diff JSON Before/After na trilha de auditoria.',
    stillWorksNote: 'A matriz de permissões e anti-elevação de privilégios continuam ativas.',
  },
];

export const UsersListPage: React.FC<{ scope: 'global' | 'company' }> = ({ scope }) => {
  const { empresaId } = useParams<{ empresaId: string }>();
  const {
    users,
    roles,
    companies,
    session,
    hasPermission,
    getActor,
    refreshData,
    notify,
    t,
  } = useApp();
  const navigate = useNavigate();

  const [archiveTarget, setArchiveTarget] = useState<UserEntity | null>(null);
  const [inspectUser, setInspectUser] = useState<UserEntity | null>(null);

  const targetCompanyId = scope === 'company' ? empresaId : undefined;
  const company = targetCompanyId ? companies.find((c) => c.id === targetCompanyId) : null;
  const baseRoute = scope === 'global' ? '/app/global/usuarios' : `/app/empresa/${empresaId}/usuarios`;

  if (!hasPermission('users', 'view', targetCompanyId)) {
    return (
      <AccessDeniedView
        reason="Seu papel atual não possui permissão para visualizar o diretório de usuários."
        requiredPermission="users:view"
      />
    );
  }

  const billingRules = getPlatformBillingRules();
  const scopedUsers = targetCompanyId
    ? users.filter((u) => u.companyIds.includes(targetCompanyId))
    : users;

  const handleRestore = async (u: UserEntity) => {
    await repositories.users.restore(u.id, getActor(targetCompanyId));
    await refreshData();
    notify({ type: 'success', title: `Usuário ${u.name} restaurado.` });
  };

  return (
    <div className="flex flex-col gap-2.5">
      <PageHeader
        breadcrumbs={[
          {
            label: scope === 'global' ? t('scope.global') : company?.tradeName || 'Empresa',
            to: scope === 'global' ? '/app/global' : `/app/empresa/${empresaId}`,
          },
          { label: t('nav.users') },
        ]}
        title="Gestão de Usuários, Identidades, Perfil de Pagamento & Associação HBAC"
        subtitle={`Controle completo de vínculos por Matriz/Filial, pacotes HBAC e perfil de assinatura • ${scopedUsers.length} usuários no diretório`}
        scopeBadge={scope === 'global' ? t('scope.global') : company?.tradeName}
        actions={
          hasPermission('users', 'create', targetCompanyId) && (
            <Link to={`${baseRoute}/novo`} className="btn btn-primary btn-sm">
              <Plus size={14} />
              Novo Usuário
            </Link>
          )
        }
      />

      <UrlDataTable<UserEntity>
        tableId={`users-table-${scope}`}
        caption="Diretório de usuários e vínculos HBAC"
        items={scopedUsers}
        defaultSortField="createdAt"
        csvFilename={`usuarios-${scope}.csv`}
        searchPlaceholder="Buscar por nome, e-mail, telefone ou ID..."
        statusExtractor={(u) => u.status}
        searchExtractor={(u) => `${u.id} ${u.name} ${u.email} ${u.phone}`}
        statusOptions={[
          { value: 'active', label: t('status.active') },
          { value: 'pending', label: t('status.pending') },
          { value: 'suspended', label: t('status.suspended') },
          { value: 'archived', label: t('status.archived') },
        ]}
        isArchivedExtractor={(u) => u.archiveMetadata.isArchived}
        columns={[
          {
            key: 'name',
            header: 'Usuário & E-mail',
            width: '25%',
            sortable: true,
            csvValue: (u) => `${u.name} <${u.email}>`,
            render: (u) => (
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link to={`${baseRoute}/${u.id}/editar`} className="font-semibold">
                    {u.name}
                  </Link>
                  <code className="text-xs text-muted mono">{u.id}</code>
                </div>
                <div className="text-xs text-muted mono">
                  {u.email} • {u.phone}
                </div>
              </div>
            ),
          },
          {
            key: 'roles',
            header: 'Papéis HBAC & Nível',
            width: '22%',
            csvValue: (u) =>
              getUserActiveRoles(u, roles)
                .map((r) => r.name[session.language])
                .join('; '),
            render: (u) => (
              <div className="flex items-center gap-1 flex-wrap">
                {getUserActiveRoles(u, roles).map((r) => (
                  <span key={r.id} className="badge badge-info">
                    {r.name[session.language]} (N{r.hierarchyLevel})
                  </span>
                ))}
                {u.individualPermissions.length > 0 && (
                  <span className="badge badge-teal">
                    +{u.individualPermissions.length} exceção(ões)
                  </span>
                )}
              </div>
            ),
          },
          {
            key: 'companies',
            header: 'Unidades (Matriz / Filiais)',
            width: '23%',
            csvValue: (u) => u.companyIds.join('; '),
            render: (u) => (
              <div className="flex items-center gap-1 flex-wrap">
                {u.companyIds.length === 0 ? (
                  <span className="badge badge-neutral">Global (Plataforma)</span>
                ) : (
                  u.companyIds.map((cid) => {
                    const comp = companies.find((c) => c.id === cid);
                    return (
                      <span
                        key={cid}
                        className={`badge ${!comp?.isBranch ? 'badge-info' : 'badge-teal'}`}
                      >
                        {!comp?.isBranch ? 'Matriz:' : 'Filial:'} {comp?.tradeName || cid}
                      </span>
                    );
                  })
                )}
              </div>
            ),
          },
          {
            key: 'lastLoginAt',
            header: 'Último Acesso & Cadastro',
            width: '12%',
            sortable: true,
            render: (u) => (
              <div>
                <div className="text-xs font-medium">{formatDateTime(u.lastLoginAt, session.language)}</div>
                <div className="text-xs text-muted mono">Desde {formatDateTime(u.createdAt, session.language).slice(0, 10)}</div>
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Estado',
            width: '9%',
            sortable: true,
            render: (u) => <StatusBadge status={u.status} />,
          },
          {
            key: 'actions',
            header: 'Ações',
            width: '9%',
            isNumeric: true,
            render: (u) => (
              <ActionDropdownMenu
                label="Ações"
                items={[
                  ...(hasPermission('users', 'edit', targetCompanyId)
                    ? [
                        {
                          id: 'edit-user',
                          label: 'Editar & Vincular Empresas (ID Único)',
                          icon: <Edit3 size={14} />,
                          variant: 'primary' as const,
                          onClick: () => navigate(`${baseRoute}/${u.id}/editar`),
                        },
                      ]
                    : []),
                  {
                    id: 'hbac-matrix',
                    label: 'Matriz HBAC & Dependências',
                    icon: <ShieldCheck size={14} />,
                    onClick: () => navigate(`${baseRoute}/${u.id}`),
                  },
                  {
                    id: 'inspect-modal',
                    label: 'Resumo Rápido de Vínculos',
                    icon: <Eye size={14} />,
                    onClick: () => setInspectUser(u),
                  },
                  ...(hasPermission('users', 'archive', targetCompanyId)
                    ? [
                        u.archiveMetadata.isArchived
                          ? {
                              id: 'restore',
                              label: t('common.restore'),
                              icon: <RotateCcw size={14} />,
                              onClick: () => handleRestore(u),
                            }
                          : {
                              id: 'archive',
                              label: t('common.archive'),
                              icon: <Trash2 size={14} />,
                              variant: 'danger' as const,
                              onClick: () => setArchiveTarget(u),
                            },
                      ]
                    : []),
                ]}
              />
            ),
          },
        ]}
      />

      {/* Modal: Ficha Completa do Usuário, Unidades Matriz/Filial & Perfil de Pagamento (com X) */}
      <ModalDialog
        open={Boolean(inspectUser)}
        onClose={() => setInspectUser(null)}
        title={inspectUser ? `Ficha de Governança & Assinatura — ${inspectUser.name}` : 'Usuário'}
        description={inspectUser ? `${inspectUser.email} • Telefone: ${inspectUser.phone}` : ''}
        maxWidth="840px"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setInspectUser(null)}>
              Fechar
            </button>
            {inspectUser && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    const id = inspectUser.id;
                    setInspectUser(null);
                    navigate(`${baseRoute}/${id}/editar`);
                  }}
                >
                  <Edit3 size={14} /> Editar Cadastro &amp; Empresas
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const id = inspectUser.id;
                    setInspectUser(null);
                    navigate(`${baseRoute}/${id}`);
                  }}
                >
                  <ShieldCheck size={14} /> Abrir Matriz HBAC &amp; Dependências
                </button>
              </>
            )}
          </>
        }
      >
        {inspectUser && (
          <div className="flex flex-col gap-4">
            <div className="grid-3 text-xs">
              <div className="card card-body">
                <span className="text-muted uppercase block">Papéis Hierárquicos</span>
                <div className="flex gap-1 flex-wrap mt-1">
                  {getUserActiveRoles(inspectUser, roles).map((r) => (
                    <span key={r.id} className="badge badge-info">
                      {r.name[session.language]} (N{r.hierarchyLevel})
                    </span>
                  ))}
                </div>
              </div>
              <div className="card card-body">
                <span className="text-muted uppercase block">Exceções Individuais</span>
                <strong className="text-sm">{inspectUser.individualPermissions.length} regra(s)</strong>
                <span className="text-muted">Auditadas com rastreamento de origem</span>
              </div>
              <div className="card card-body">
                <span className="text-muted uppercase block">Último Acesso</span>
                <strong className="mono text-sm">
                  {formatDateTime(inspectUser.lastLoginAt, session.language)}
                </strong>
                <StatusBadge status={inspectUser.status} />
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title text-sm flex items-center gap-2">
                  <CreditCard size={15} /> Perfil de Pagamento &amp; Cota de Funcionários nas Unidades Vinculadas ({inspectUser.companyIds.length})
                </h3>
                <span className="badge badge-teal">
                  Franquia {billingRules.defaultFreeEmployeesPerStore} Grátis / Empresa
                </span>
              </div>
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Unidade (Matriz / Filial)</th>
                      <th>Funcionários Alocados</th>
                      <th>Licenças Excedentes</th>
                      <th className="num">Mensalidade Consolidada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspectUser.companyIds.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-xs text-muted">
                          Usuário de escopo Global da Plataforma (isento de cobrança por unidade).
                        </td>
                      </tr>
                    ) : (
                      inspectUser.companyIds.map((cid) => {
                        const comp = companies.find((c) => c.id === cid);
                        if (!comp) return null;
                        const lic = computeCompanyLicenseSummary(comp, companies, billingRules);
                        return (
                          <tr key={comp.id}>
                            <td>
                              <span className={`badge ${!comp.isBranch ? 'badge-info' : 'badge-teal'} mr-1`}>
                                {!comp.isBranch ? 'MATRIZ' : `FILIAL ${comp.branchCode || ''}`}
                              </span>
                              <strong>{comp.tradeName}</strong>
                            </td>
                            <td className="text-xs">
                              {lic.activeEmployeesCount} funcionário(s) ({Math.min(lic.activeEmployeesCount, lic.freeLimit)}/{lic.freeLimit} grátis)
                            </td>
                            <td className="text-xs">
                              {lic.extraEmployeesCount > 0 ? (
                                <span className="badge badge-warning">
                                  +{lic.extraEmployeesCount} extra(s) ({formatCurrency(lic.extraLicensesMonthlyCost, 'BRL', session.language)})
                                </span>
                              ) : (
                                <span className="badge badge-success">Dentro da Cota Gratuita</span>
                              )}
                            </td>
                            <td className="num font-semibold tabular">
                              {formatCurrency(lic.totalMonthlyBilling, 'BRL', session.language)}/mês
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
      </ModalDialog>

      <ArchiveRecordDialog
        open={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        recordTitle={archiveTarget ? `${archiveTarget.name} (${archiveTarget.email})` : ''}
        onConfirmArchive={async (reason) => {
          if (!archiveTarget) return;
          await repositories.users.archive(
            archiveTarget.id,
            reason,
            getActor(targetCompanyId),
          );
          await refreshData();
          notify({
            type: 'warning',
            title: `Usuário ${archiveTarget.name} arquivado sem exclusão física.`,
          });
        }}
      />
    </div>
  );
};

export const UserFormPage: React.FC<{ scope: 'global' | 'company'; mode: 'create' | 'edit' }> = ({
  scope,
  mode,
}) => {
  const { empresaId, usuarioId } = useParams<{ empresaId: string; usuarioId: string }>();
  const {
    currentUser,
    users,
    roles,
    companies,
    session,
    hasPermission,
    isCurrentGlobalStaff,
    getActor,
    refreshData,
    notify,
    t,
  } = useApp();
  const navigate = useNavigate();

  const targetCompanyId = scope === 'company' ? empresaId : undefined;
  const baseRoute = scope === 'global' ? '/app/global/usuarios' : `/app/empresa/${empresaId}/usuarios`;
  const existing = mode === 'edit' ? users.find((u) => u.id === usuarioId) : undefined;

  const [name, setName] = useState(existing?.name || '');
  const [email, setEmail] = useState(existing?.email || '');
  const [phone, setPhone] = useState(existing?.phone || '+55 (11) 98800-0000');
  const [status, setStatus] = useState<UserEntity['status']>(existing?.status || 'active');
  const [language, setLanguage] = useState<LanguageCode>(existing?.language || 'pt-BR');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(
    existing?.roleIds || ['role-funcionario'],
  );
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>(
    existing?.companyIds || (targetCompanyId ? [targetCompanyId] : ['emp-olivelas-matriz']),
  );
  const [companyToAddId, setCompanyToAddId] = useState<string>('');
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState<boolean>(false);
  const [hbacError, setHbacError] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setEmail(existing.email);
      setPhone(existing.phone);
      setStatus(existing.status);
      setLanguage(existing.language);
      setSelectedRoleIds(existing.roleIds);
      setSelectedCompanyIds(existing.companyIds);
    }
  }, [existing]);

  if (!currentUser || !hasPermission('users', mode === 'create' ? 'create' : 'edit', targetCompanyId)) {
    return (
      <AccessDeniedView
        reason="Seu papel atual não possui permissão para cadastrar ou editar usuários neste escopo."
        requiredPermission={`users:${mode}`}
      />
    );
  }

  const availableRoles = roles.filter(
    (r) =>
      !r.archiveMetadata.isArchived &&
      (scope === 'global' || r.scope !== 'global') &&
      (!r.companyId || !targetCompanyId || r.companyId === targetCompanyId),
  );

  const availableCompanies = isCurrentGlobalStaff
    ? companies
    : companies.filter((c) => currentUser.companyIds.includes(c.id));

  const memberCompanies = availableCompanies.filter((c) => selectedCompanyIds.includes(c.id));
  const unlinkedCompanies = availableCompanies.filter((c) => !selectedCompanyIds.includes(c.id));

  const toggleRole = (rid: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(rid) ? prev.filter((id) => id !== rid) : [...prev, rid],
    );
  };

  const handleAddCompanyToUser = (cid: string) => {
    if (!cid) return;
    setSelectedCompanyIds((prev) => (prev.includes(cid) ? prev : [...prev, cid]));
    setIsDirty(true);
    const addedComp = companies.find((c) => c.id === cid);
    notify({
      type: 'info',
      title: `Empresa "${addedComp?.tradeName || cid}" adicionada à lista do usuário.`,
    });
  };

  const handleRemoveCompanyFromUser = (cid: string) => {
    setSelectedCompanyIds((prev) => prev.filter((id) => id !== cid));
    setIsDirty(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setHbacError('');

    const check = validateNoPrivilegeEscalation({
      actor: currentUser,
      allRoles: roles,
      targetScope: scope,
      targetCompanyId,
      requestedRoleIds: selectedRoleIds,
      language: session.language,
    });

    if (!check.valid) {
      setHbacError(check.reason || 'Violação de política hierárquica HBAC.');
      return;
    }

    const actor = getActor(targetCompanyId);

    if (mode === 'create') {
      const newId = generateId('usr');
      const newUser: UserEntity = {
        id: newId,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        status,
        language,
        roleIds: selectedRoleIds,
        companyIds: selectedCompanyIds,
        individualPermissions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        archiveMetadata: { isArchived: false },
        changeHistory: [],
      };
      await repositories.users.create(
        newUser,
        actor,
        `Cadastro de usuário ${newUser.name} (${newUser.email}) com papéis [${selectedRoleIds.join(', ')}].`,
      );
      await syncUnifiedUserProfileToSupabase(newUser);
      await refreshData();
      notify({ type: 'success', title: `Usuário ${newUser.name} criado com sucesso.` });
      navigate(`${baseRoute}/${newId}`);
    } else if (existing) {
      const updatedUserObj: UserEntity = {
        ...existing,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        status,
        language,
        roleIds: selectedRoleIds,
        companyIds: selectedCompanyIds,
        updatedAt: new Date().toISOString(),
      };
      await repositories.users.update(
        existing.id,
        (curr) => ({
          ...curr,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          status,
          language,
          roleIds: selectedRoleIds,
          companyIds: selectedCompanyIds,
        }),
        actor,
        `Atualização de cadastro, papéis HBAC e empresas associadas (${selectedCompanyIds.length}) do usuário ${name.trim()}.`,
      );
      await syncUnifiedUserProfileToSupabase(updatedUserObj);
      await refreshData();
      notify({ type: 'success', title: t('msg.savedSuccess') });
      navigate(`${baseRoute}/${existing.id}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: t('nav.users'), to: baseRoute },
          { label: mode === 'create' ? 'Novo Usuário' : `Editar ${existing?.name}` },
        ]}
        title={mode === 'create' ? 'Cadastrar Novo Usuário' : `Editar Usuário — ${existing?.name}`}
        subtitle="Validação anti-elevação de privilégios HBAC ativa durante atribuição de papéis e empresas."
      />

      <UnsavedChangesBanner isDirty={isDirty} onDiscard={() => navigate(baseRoute)} />

      {hbacError && (
        <div
          style={{
            padding: '0.85rem 1rem',
            backgroundColor: 'var(--status-danger-bg)',
            border: '1px solid var(--status-danger-border)',
            color: 'var(--status-danger)',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
          }}
        >
          {hbacError}
        </div>
      )}

      <form onSubmit={handleSave} onChange={() => setIsDirty(true)}>
        <div className="form-section">
          <div className="form-section-title">1. Dados de Identidade & Preferências</div>
          <div className="form-grid mt-2">
            <div className="field">
              <label htmlFor="usr-name">Nome Completo *</label>
              <input
                id="usr-name"
                className="input"
                required
                minLength={3}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="usr-email">E-mail Corporativo *</label>
              <input
                id="usr-email"
                type="email"
                className="input mono"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="usr-phone">Telefone *</label>
              <input
                id="usr-phone"
                className="input"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="usr-status">Estado do Usuário</label>
              <select
                id="usr-status"
                className="select"
                value={status}
                onChange={(e) => setStatus(e.target.value as UserEntity['status'])}
              >
                <option value="active">Ativo</option>
                <option value="pending">Pendente</option>
                <option value="suspended">Suspenso</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="usr-lang">Idioma Preferido</label>
              <select
                id="usr-lang"
                className="select"
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">2. Atribuição de Papéis Hierárquicos (HBAC)</div>
          <div className="form-section-desc">
            Um usuário não pode conceder papéis de autoridade superior à sua própria na hierarquia.
          </div>
          <div className="form-grid">
            {availableRoles.map((r) => {
              const checked = selectedRoleIds.includes(r.id);
              return (
                <label
                  key={r.id}
                  style={{
                    border: checked
                      ? '1px solid var(--accent-primary)'
                      : '1px solid var(--border-subtle)',
                    backgroundColor: checked ? 'var(--accent-primary-soft)' : 'var(--bg-surface)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRole(r.id)}
                        style={{ marginRight: 6 }}
                      />
                      {r.name[session.language]}
                    </span>
                    <span className="badge">Nível {r.hierarchyLevel}</span>
                  </div>
                  <span className="text-xs text-muted">{r.description[session.language]}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="form-section">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <div>
              <div className="form-section-title">3. Empresas Associadas (Escopo Multiempresa)</div>
              <div className="form-section-desc">
                Lista de empresas das quais este usuário faz parte e controle de adição de novas unidades/empresas.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (unlinkedCompanies[0] && !companyToAddId) {
                  setCompanyToAddId(unlinkedCompanies[0].id);
                }
                setIsAddCompanyModalOpen(true);
              }}
              className="btn btn-primary btn-sm"
            >
              <Plus size={14} /> Adicionar Outra Empresa
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Coluna Esquerda: Lista de Empresas que o Usuário Faz Parte */}
            <div className="lg:col-span-7 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-muted">
                  Empresas das quais faz parte ({memberCompanies.length})
                </span>
                <span className="badge badge-teal">{memberCompanies.length} vinculada(s)</span>
              </div>

              {memberCompanies.length === 0 ? (
                <div className="p-5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                  <Building2 size={22} className="mx-auto text-muted" />
                  <div className="text-sm font-semibold">Nenhuma empresa vinculada</div>
                  <p className="text-xs text-muted">
                    Utilize o painel ao lado ou o botão <strong>Adicionar Outra Empresa</strong> para vincular empresas a este usuário.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {memberCompanies.map((comp) => (
                    <div
                      key={comp.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="stat-icon-box" style={{ width: 36, height: 36 }}>
                          <Building2 size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-sm">{comp.tradeName}</strong>
                            <StatusBadge status={comp.operationalStatus} />
                          </div>
                          <div className="text-xs text-muted">
                            {comp.legalName} • Doc: <span className="mono">{comp.taxId || comp.id}</span> • ID:{' '}
                            <code className="mono">{comp.id}</code>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveCompanyFromUser(comp.id)}
                        className="btn btn-ghost btn-sm text-rose-600 shrink-0"
                        title="Remover usuário desta empresa"
                      >
                        <Trash2 size={14} /> Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Coluna Direita (Do Lado): Adicionar Outras Empresas */}
            <div className="lg:col-span-5 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 bg-slate-50/30 dark:bg-slate-800/20">
              <div className="flex items-center justify-between">
                <strong className="text-sm flex items-center gap-2">
                  <Plus size={15} className="text-teal-600" /> Adicionar Outras Empresas
                </strong>
                <span className="badge badge-info">{unlinkedCompanies.length} disponível(is)</span>
              </div>

              {unlinkedCompanies.length === 0 ? (
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs space-y-1">
                  <div className="font-bold text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 size={15} /> Usuário já faz parte de todas as empresas cadastradas!
                  </div>
                  <p className="text-muted">
                    Caso deseje criar uma nova empresa na plataforma para vinculá-la, acesse{' '}
                    <Link to="/app/global/empresas/nova" className="underline font-semibold">
                      Cadastrar Nova Empresa
                    </Link>
                    .
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <select
                      aria-label="Selecionar empresa para adicionar"
                      className="select flex-1 text-xs"
                      value={companyToAddId || unlinkedCompanies[0]?.id || ''}
                      onChange={(e) => setCompanyToAddId(e.target.value)}
                    >
                      {unlinkedCompanies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.tradeName} ({c.taxId || c.id})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        handleAddCompanyToUser(companyToAddId || unlinkedCompanies[0]?.id || '')
                      }
                      className="btn btn-primary btn-sm shrink-0"
                    >
                      <Plus size={14} /> Adicionar
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] font-semibold uppercase text-muted block">
                      Ou adicione com 1 clique:
                    </span>
                    {unlinkedCompanies.map((c) => (
                      <div
                        key={c.id}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs bg-white dark:bg-slate-900"
                      >
                        <div>
                          <div className="font-semibold">{c.tradeName}</div>
                          <div className="text-[11px] text-muted mono">{c.id}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddCompanyToUser(c.id)}
                          className="btn btn-secondary btn-sm"
                        >
                          <Plus size={13} /> Vincular
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
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

      <ModalDialog
        open={isAddCompanyModalOpen}
        onClose={() => setIsAddCompanyModalOpen(false)}
        title="Adicionar Empresa ao Usuário"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddCompanyModalOpen(false)}
              className="btn btn-secondary"
            >
              Fechar
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-muted">
            Selecione as empresas que deseja vincular a <strong>{name || existing?.name || 'este usuário'}</strong>:
          </p>
          {unlinkedCompanies.length === 0 ? (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs">
              Todas as empresas disponíveis já estão associadas a este usuário.
            </div>
          ) : (
            <div className="space-y-2">
              {unlinkedCompanies.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-sm">{c.tradeName}</div>
                    <div className="text-xs text-muted">
                      {c.legalName} • Doc: <span className="mono">{c.taxId || c.id}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddCompanyToUser(c.id)}
                    className="btn btn-primary btn-sm"
                  >
                    <Plus size={14} /> Adicionar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </ModalDialog>
    </div>
  );
};

export const UserDetailAndMatrixPage: React.FC<{ scope: 'global' | 'company' }> = ({ scope }) => {
  const { empresaId, usuarioId } = useParams<{ empresaId: string; usuarioId: string }>();
  const {
    currentUser,
    users,
    roles,
    companies,
    session,
    hasPermission,
    getActor,
    refreshData,
    notify,
    t,
  } = useApp();

  const targetCompanyId = scope === 'company' ? empresaId : undefined;
  const baseRoute = scope === 'global' ? '/app/global/usuarios' : `/app/empresa/${empresaId}/usuarios`;

  const user = users.find((u) => u.id === usuarioId);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [ovrResource, setOvrResource] = useState<PermissionResource>('contracts');
  const [ovrAction, setOvrAction] = useState<PermissionAction>('view');
  const [ovrEffect, setOvrEffect] = useState<'allow' | 'deny'>('allow');
  const [ovrReason, setOvrReason] = useState('');
  const [ovrError, setOvrError] = useState('');

  // Redefinição de Senha Real no Supabase (public.profiles + pgcrypto bcrypt)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  if (!user) {
    return (
      <AccessDeniedView
        title="Usuário Não Encontrado"
        reason={`O usuário "${usuarioId}" não foi localizado.`}
        backTo={baseRoute}
      />
    );
  }

  // Enforce Tenant Isolation on direct URL access in company mode
  if (scope === 'company' && empresaId && !user.companyIds.includes(empresaId)) {
    return (
      <AccessDeniedView
        title="Isolamento Multiempresa de Usuários"
        reason={`O usuário "${user.name}" não pertence ao quadro da empresa "${empresaId}".`}
        backTo={baseRoute}
      />
    );
  }

  const effectiveMatrix = buildEffectivePermissionMatrix(
    user,
    roles,
    targetCompanyId || user.companyIds[0],
    session.language,
  );
  const userRoles = getUserActiveRoles(user, roles);

  const handleAddOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setOvrError('');
    if (!currentUser) return;

    if (ovrEffect === 'allow') {
      const check = validateNoPrivilegeEscalation({
        actor: currentUser,
        allRoles: roles,
        targetScope: scope === 'global' ? 'global' : 'company',
        targetCompanyId: targetCompanyId || user.companyIds[0],
        requestedGrants: [{ resource: ovrResource, action: ovrAction, scope: 'company' }],
        language: session.language,
      });
      if (!check.valid) {
        setOvrError(check.reason || 'Bloqueio de elevação de privilégio HBAC.');
        return;
      }
    }

    const newOvr: IndividualPermissionOverride = {
      id: generateId('ovr'),
      resource: ovrResource,
      action: ovrAction,
      scope: scope === 'global' ? 'global' : 'company',
      companyId: targetCompanyId || user.companyIds[0],
      effect: ovrEffect,
      grantedByUserId: currentUser.id,
      grantedByUserName: currentUser.name,
      reason: ovrReason.trim(),
      createdAt: new Date().toISOString(),
    };

    const actor = getActor(targetCompanyId);
    await repositories.users.update(
      user.id,
      (curr) => ({
        ...curr,
        individualPermissions: [...curr.individualPermissions, newOvr],
      }),
      actor,
      `${ovrEffect === 'allow' ? 'Concessão' : 'Revogação'} individual HBAC (${ovrResource}:${ovrAction}) para ${user.name}. Motivo: ${ovrReason.trim()}`,
      ovrEffect === 'allow' ? 'grant_permission' : 'revoke_permission',
    );
    await refreshData();
    setOvrReason('');
    setOverrideModalOpen(false);
    notify({
      type: 'success',
      title: 'Exceção Individual HBAC Registrada',
      description: 'A Matriz Efetiva e a Trilha de Auditoria foram atualizadas.',
    });
  };

  const handleRemoveOverride = async (ovrId: string) => {
    const actor = getActor(targetCompanyId);
    await repositories.users.update(
      user.id,
      (curr) => ({
        ...curr,
        individualPermissions: curr.individualPermissions.filter((o) => o.id !== ovrId),
      }),
      actor,
      `Remoção de exceção individual HBAC (${ovrId}) do usuário ${user.name}.`,
      'revoke_permission',
    );
    await refreshData();
    notify({ type: 'info', title: 'Exceção individual removida.' });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    const check = validatePasswordStrength(newPassword);
    if (!check.valid) {
      setPasswordError(check.message || 'Senha inválida.');
      return;
    }
    setSavingPassword(true);
    const res = await changeUserPasswordInSupabase(user.id, newPassword);
    setSavingPassword(false);
    if (!res.ok) {
      setPasswordError(res.message);
      return;
    }
    setNewPassword('');
    setPasswordModalOpen(false);
    notify({
      type: 'success',
      title: `Senha de ${user.name} atualizada no Supabase (public.profiles)!`,
      description: 'Hash bcrypt gravado e tentativas de login zeradas.',
    });
  };

  const handleToggleModuleGranularPerm = async (moduleSlug: string, action: PermissionAction) => {
    if (!hasPermission('roles', 'administer', targetCompanyId) && !hasPermission('users', 'edit', targetCompanyId)) {
      notify({ type: 'warning', title: 'Permissão administrativa necessária para alterar escopos granulares.' });
      return;
    }
    const permKey = `${moduleSlug}:${action}`;
    const currentList = user.granularPermissions || [];
    const exists = currentList.includes(permKey);
    const nextList = exists ? currentList.filter((k) => k !== permKey) : [...currentList, permKey];

    const actor = getActor(targetCompanyId);
    await repositories.users.update(
      user.id,
      (curr) => ({
        ...curr,
        granularPermissions: nextList,
      }),
      actor,
      `${exists ? 'Revogação' : 'Concessão'} granular no módulo (${permKey}) para ${user.name}.`,
      exists ? 'revoke_permission' : 'grant_permission',
    );
    await refreshData();
    notify({
      type: 'success',
      title: `Permissão granular ${permKey} ${exists ? 'removida' : 'concedida'} e sincronizada no Supabase.`,
    });
  };

  const handleApplyCommercialPackage = async (pkg: CommercialPermissionPackage) => {
    if (!currentUser) return;
    const actor = getActor(targetCompanyId);
    const now = new Date().toISOString();
    const newOverrides: IndividualPermissionOverride[] = pkg.resourcesToAllow.map((item) => ({
      id: generateId('ovr'),
      resource: item.resource,
      action: item.action,
      scope: scope === 'global' ? 'global' : 'company',
      companyId: targetCompanyId || user.companyIds[0],
      effect: 'allow',
      grantedByUserId: currentUser.id,
      grantedByUserName: currentUser.name,
      reason: `Aplicação do pacote comercial "${pkg.name}"`,
      createdAt: now,
    }));

    await repositories.users.update(
      user.id,
      (curr) => {
        const mergedRoles = curr.roleIds.includes(pkg.roleIdToEnsure)
          ? curr.roleIds
          : [...curr.roleIds, pkg.roleIdToEnsure];
        const existingNonConflict = curr.individualPermissions.filter(
          (o) => !pkg.resourcesToAllow.some((r) => r.resource === o.resource && r.action === o.action),
        );
        return {
          ...curr,
          roleIds: mergedRoles,
          individualPermissions: [...existingNonConflict, ...newOverrides],
        };
      },
      actor,
      `Aplicação do Pacote de Perfil Comercial "${pkg.name}" para ${user.name}.`,
      'grant_permission',
    );
    await refreshData();
    notify({
      type: 'success',
      title: `Pacote "${pkg.name}" aplicado com sucesso!`,
      description: `${pkg.resourcesToAllow.length} permissões operacionais garantidas para ${user.name}.`,
    });
  };

  const handleQuickFixDependency = async (rule: ScreenDependencyRule) => {
    if (!currentUser) return;
    const actor = getActor(targetCompanyId);
    const fixOverride: IndividualPermissionOverride = {
      id: generateId('ovr'),
      resource: rule.requiredResource,
      action: rule.requiredAction,
      scope: scope === 'global' ? 'global' : 'company',
      companyId: targetCompanyId || user.companyIds[0],
      effect: 'allow',
      grantedByUserId: currentUser.id,
      grantedByUserName: currentUser.name,
      reason: `Correção automática de dependência entre telas para ${rule.screenName}`,
      createdAt: new Date().toISOString(),
    };

    await repositories.users.update(
      user.id,
      (curr) => ({
        ...curr,
        individualPermissions: [
          ...curr.individualPermissions.filter(
            (o) => !(o.resource === rule.requiredResource && o.action === rule.requiredAction),
          ),
          fixOverride,
        ],
      }),
      actor,
      `Quick-Fix de dependência entre telas (${rule.requiredResource}:${rule.requiredAction}) aplicado para ${user.name}.`,
      'grant_permission',
    );
    await refreshData();
    notify({
      type: 'success',
      title: `Dependência ${rule.requiredResource}:${rule.requiredAction} habilitada!`,
      description: `O fluxo completo de ${rule.screenName} agora está 100% operacional.`,
    });
  };

  const billingRules = getPlatformBillingRules();

  const dependencyDiagnostics = SCREEN_DEPENDENCY_RULES.map((rule) => {
    const hasPrimary = effectiveMatrix.some(
      (c) => c.resource === rule.primaryResource && c.action === rule.primaryAction && c.allowed,
    );
    const hasRequired = effectiveMatrix.some(
      (c) => c.resource === rule.requiredResource && c.action === rule.requiredAction && c.allowed,
    );
    const status: 'OK' | 'WARNING' | 'INACTIVE' = !hasPrimary
      ? 'INACTIVE'
      : hasRequired
        ? 'OK'
        : 'WARNING';
    return { rule, hasPrimary, hasRequired, status };
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: t('nav.users'), to: baseRoute },
          { label: user.name },
        ]}
        title={`${user.name} — Inspetor de Matriz Efetiva HBAC & Segurança Supabase`}
        subtitle={`${user.email} • Telefone: ${user.phone} • Base Única: public.profiles • Criado em: ${formatDateTime(user.createdAt, session.language)}`}
        scopeBadge={`Papel Principal: ${userRoles[0]?.name[session.language] || 'Sem Papel'}`}
        actions={
          <>
            {hasPermission('users', 'edit', targetCompanyId) && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPasswordModalOpen(true)}
              >
                <KeyRound size={14} />
                Redefinir Senha (Supabase)
              </button>
            )}
            {hasPermission('roles', 'administer', targetCompanyId) && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setOverrideModalOpen(true)}
              >
                <Plus size={14} />
                Conceder / Revogar Exceção Individual
              </button>
            )}
            {hasPermission('users', 'edit', targetCompanyId) && (
              <Link to={`${baseRoute}/${user.id}/editar`} className="btn btn-secondary btn-sm">
                <Edit3 size={14} />
                Editar Cadastro e Papéis
              </Link>
            )}
          </>
        }
      />

      {/* Summary Cards: Roles, Scope, Individual Overrides */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1rem',
        }}
      >
        <div className="card card-body flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <strong>Papéis Ativos & Hierarquia</strong>
            <StatusBadge status={user.status} />
          </div>
          {userRoles.map((r) => (
            <div
              key={r.id}
              style={{
                padding: '0.6rem',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div className="flex items-center justify-between">
                <strong className="text-sm">{r.name[session.language]}</strong>
                <span className="badge badge-info">
                  Nível {r.hierarchyLevel} • Escopo: {r.scope}
                </span>
              </div>
              <p className="text-xs text-muted mt-2">{r.description[session.language]}</p>
            </div>
          ))}
          <div className="text-xs text-muted mt-2">
            <strong>Empresas Associadas:</strong>{' '}
            {user.companyIds.length === 0
              ? 'Escopo Global da Plataforma'
              : user.companyIds
                  .map((cid) => companies.find((c) => c.id === cid)?.tradeName || cid)
                  .join(', ')}
          </div>
        </div>

        <div className="card card-body flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <strong>Exceções Individuais Autorizadas ({user.individualPermissions.length})</strong>
            <span className="badge badge-teal">Rastreabilidade de Origem</span>
          </div>
          {user.individualPermissions.length === 0 ? (
            <p className="text-xs text-muted">
              Nenhuma exceção individual configurada. O usuário opera exclusivamente com as permissões
              diretas e herdadas de seus papéis.
            </p>
          ) : (
            user.individualPermissions.map((ovr) => (
              <div
                key={ovr.id}
                style={{
                  padding: '0.6rem',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                }}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={ovr.effect} />
                    <code className="text-xs font-semibold">
                      {ovr.resource}:{ovr.action}
                    </code>
                    <span className="text-xs text-muted">({ovr.scope})</span>
                  </div>
                  <span className="text-xs text-muted">
                    Concedido por <strong>{ovr.grantedByUserName}</strong>: &ldquo;{ovr.reason}&rdquo;
                  </span>
                </div>
                {hasPermission('roles', 'administer', targetCompanyId) && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleRemoveOverride(ovr.id)}
                    title="Revogar exceção"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pacotes de Perfil Comercial + Diagnóstico de Dependências entre Telas */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title flex items-center gap-2" style={{ fontSize: '0.98rem' }}>
                <Sparkles size={15} /> Pacotes de Perfil Comercial &amp; Liberação Rápida (1-Clique)
              </h2>
              <p className="text-xs text-muted">
                Aplique grupos prontos de permissões comerciais sem precisar configurar recurso por recurso.
              </p>
            </div>
          </div>
          <div className="card-body flex flex-col gap-2.5">
            {COMMERCIAL_PERMISSION_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                style={{
                  padding: '0.75rem',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: 210 }}>
                  <div className="flex items-center gap-2">
                    <strong className="text-sm">{pkg.name}</strong>
                    <span className="badge badge-teal">{pkg.badge}</span>
                  </div>
                  <p className="text-xs text-muted mt-1">{pkg.description}</p>
                </div>
                {hasPermission('roles', 'administer', targetCompanyId) && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleApplyCommercialPackage(pkg)}
                  >
                    <Wand2 size={13} /> Aplicar Pacote
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title flex items-center gap-2" style={{ fontSize: '0.98rem' }}>
                <AlertTriangle size={15} /> Diagnóstico Inteligente de Dependências entre Telas
              </h2>
              <p className="text-xs text-muted">
                Verifica automaticamente o que continua funcionando e o que perde integração caso uma permissão correlata esteja bloqueada.
              </p>
            </div>
          </div>
          <div className="card-body flex flex-col gap-2.5">
            {dependencyDiagnostics.map(({ rule, status }) => (
              <div
                key={rule.id}
                style={{
                  padding: '0.75rem',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  background:
                    status === 'WARNING'
                      ? 'color-mix(in srgb, var(--color-warning) 10%, var(--bg-surface))'
                      : 'var(--bg-subtle)',
                }}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <strong className="text-xs">{rule.screenName}</strong>
                  <span
                    className={`badge ${
                      status === 'OK'
                        ? 'badge-success'
                        : status === 'WARNING'
                          ? 'badge-warning'
                          : 'badge-neutral'
                    }`}
                  >
                    {status === 'OK'
                      ? 'Fluxo Integrado OK'
                      : status === 'WARNING'
                        ? `Falta ${rule.requiredResource}:${rule.requiredAction}`
                        : 'Tela Inativa'}
                  </span>
                </div>
                {status === 'WARNING' ? (
                  <div className="mt-1.5 flex flex-col gap-1 text-xs">
                    <div style={{ color: 'var(--status-danger)' }}>
                      <strong>Impacto:</strong> {rule.impactIfMissing}
                    </div>
                    <div className="text-muted">
                      <strong>Continua funcionando:</strong> {rule.stillWorksNote}
                    </div>
                    {hasPermission('roles', 'administer', targetCompanyId) && (
                      <div className="mt-1">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleQuickFixDependency(rule)}
                        >
                          <CheckCircle2 size={12} /> Corrigir Dependência ({rule.requiredResource}:{rule.requiredAction})
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted mt-1">{rule.stillWorksNote}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Perfil de Pagamento, Assinatura & Cota de Funcionários das Unidades Vinculadas */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title flex items-center gap-2" style={{ fontSize: '1.02rem' }}>
              <CreditCard size={16} /> Perfil de Pagamento, Unidades Vinculadas (Matriz / Filiais) &amp; Cota de {billingRules.defaultFreeEmployeesPerStore} Funcionários Grátis
            </h2>
            <p className="text-xs text-muted">
              Consolidação financeira das empresas e filiais associadas a {user.name}, incluindo franquia gratuita de equipe e licenças excedentes.
            </p>
          </div>
          <Link to="/app/global/meios-pagamento" className="btn btn-secondary btn-sm">
            Ir para Pagamentos por Empresa
          </Link>
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Empresa / Filial Associada</th>
                <th>Alocação de Funcionários</th>
                <th>Licenças Extras ({formatCurrency(billingRules.defaultExtraEmployeePrice, 'BRL', session.language)}/cada)</th>
                <th className="num">Mensalidade Total da Unidade</th>
              </tr>
            </thead>
            <tbody>
              {user.companyIds.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-xs text-muted">
                    Usuário com escopo Global da Plataforma (sem cobrança por filial).
                  </td>
                </tr>
              ) : (
                user.companyIds.map((cid) => {
                  const comp = companies.find((c) => c.id === cid);
                  if (!comp) return null;
                  const lic = computeCompanyLicenseSummary(comp, companies, billingRules);
                  return (
                    <tr key={comp.id}>
                      <td>
                        <div className="flex items-center gap-2">
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
                        <span className="badge badge-neutral">
                          {lic.activeEmployeesCount} funcionário(s) ({Math.min(lic.activeEmployeesCount, lic.freeLimit)}/{lic.freeLimit} grátis)
                        </span>
                      </td>
                      <td>
                        {lic.extraEmployeesCount > 0 ? (
                          <span className="badge badge-warning">
                            +{lic.extraEmployeesCount} extra(s) ({formatCurrency(lic.extraLicensesMonthlyCost, 'BRL', session.language)})
                          </span>
                        ) : (
                          <span className="badge badge-success">Isento (Dentro dos 10 Grátis)</span>
                        )}
                      </td>
                      <td className="num font-semibold tabular">
                        {formatCurrency(lic.totalMonthlyBilling, 'BRL', session.language)}/mês
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Effective Permission Matrix Table with Origin Tracking */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 style={{ fontSize: '1.05rem' }}>
              Matriz Efetiva de Permissões por Recurso, Ação e Origem (HBAC Origin Inspector)
            </h2>
            <p className="text-xs text-muted">
              Consulta consolidada separando claramente papel direto, herança hierárquica e exceção
              individual do usuário.
            </p>
          </div>
          <span className="badge badge-info">
            {effectiveMatrix.filter((c) => c.allowed).length} permissões ativas de{' '}
            {effectiveMatrix.length}
          </span>
        </div>

        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Recurso / Módulo</th>
                {ALL_ACTIONS.map((act) => (
                  <th key={act}>{ACTION_LABELS[act][session.language]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_RESOURCES.map((res) => (
                <tr key={res}>
                  <td>
                    <strong>{RESOURCE_LABELS[res][session.language]}</strong>
                    <div className="text-xs text-muted mono">{res}</div>
                  </td>
                  {ALL_ACTIONS.map((act) => {
                    const cell = effectiveMatrix.find(
                      (c) => c.resource === res && c.action === act,
                    );
                    if (!cell) return <td key={act}>-</td>;
                    return (
                      <td key={act}>
                        <div className="flex flex-col gap-0.5" title={cell.originLabel}>
                          <span
                            className={`badge ${
                              cell.allowed
                                ? cell.originType === 'individual_allow'
                                  ? 'badge-teal'
                                  : 'badge-success'
                                : cell.originType === 'individual_deny'
                                  ? 'badge-danger'
                                  : ''
                            }`}
                          >
                            {cell.allowed ? 'Permitido' : 'Bloqueado'}
                          </span>
                          <span
                            className="text-xs text-muted truncate"
                            style={{ fontSize: '0.65rem', maxWidth: '95px' }}
                          >
                            {cell.originLabel}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matriz de Permissões Granulares nos 16 Módulos Comerciais Olivelas */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 style={{ fontSize: '1.05rem' }} className="flex items-center gap-2">
              <Database size={16} />
              Permissões Granulares HBAC por Módulo Comercial Olivelas (16 Schemas PostgreSQL)
            </h2>
            <p className="text-xs text-muted">
              Controle granular de ações CRUD, exportação e administração em cada uma das 16 plataformas Olivelas sincronizado em <code>public.profiles.granular_permissions</code>.
            </p>
          </div>
          <span className="badge badge-teal">16 Módulos Integrados</span>
        </div>

        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Plataforma Olivelas / Schema SQL</th>
                {ALL_ACTIONS.map((act) => (
                  <th key={act}>{ACTION_LABELS[act][session.language]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {OLIVELAS_ECOSYSTEM_MODULES.map((mod) => {
                const baseCell = effectiveMatrix.find((c) => c.resource === 'modules');
                return (
                  <tr key={mod.id}>
                    <td>
                      <strong>{mod.brandName}</strong>
                      <div className="text-xs text-muted mono">
                        {mod.dbSchema} • {mod.slug}
                      </div>
                    </td>
                    {ALL_ACTIONS.map((act) => {
                      const permKey = `${mod.slug}:${act}`;
                      const hasExplicitGranular = (user.granularPermissions || []).includes(permKey);
                      const inheritedCell = effectiveMatrix.find(
                        (c) => c.resource === 'modules' && c.action === act,
                      );
                      const effectiveAllowed = hasExplicitGranular || Boolean(inheritedCell?.allowed);
                      return (
                        <td key={act}>
                          <button
                            type="button"
                            onClick={() => handleToggleModuleGranularPerm(mod.slug, act)}
                            className={`btn btn-sm ${
                              hasExplicitGranular
                                ? 'btn-primary'
                                : effectiveAllowed
                                ? 'btn-secondary'
                                : 'btn-ghost'
                            }`}
                            style={{ padding: '0.25rem 0.45rem', fontSize: '0.72rem' }}
                            title={
                              hasExplicitGranular
                                ? 'Concessão granular explícita neste módulo (clique para alternar)'
                                : baseCell?.originLabel || 'Clique para conceder permissão granular neste módulo'
                            }
                          >
                            {hasExplicitGranular
                              ? 'Granular'
                              : effectiveAllowed
                              ? 'Herdado'
                              : 'Restrito'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Redefinição de Senha no Supabase (public.profiles) */}
      <ModalDialog
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title={`Redefinir Senha no Supabase — ${user.name}`}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setPasswordModalOpen(false)}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              form="reset-supabase-pwd-form"
              disabled={savingPassword}
              className="btn btn-primary"
            >
              <Lock size={14} />
              {savingPassword ? 'Gravando Hash Bcrypt...' : 'Atualizar Senha em public.profiles'}
            </button>
          </>
        }
      >
        <form id="reset-supabase-pwd-form" onSubmit={handleResetPassword} className="flex flex-col gap-3">
          {passwordError && <p className="error">{passwordError}</p>}
          <p className="text-xs text-muted">
            A nova senha será criptografada via <code>pgcrypto</code> (bcrypt) na tabela única{' '}
            <code>public.profiles</code> e valerá imediatamente para o All In e todos os 16 módulos Olivelas.
          </p>
          <div className="field">
            <label htmlFor="new-supabase-pwd">Nova Senha Corporativa *</label>
            <input
              id="new-supabase-pwd"
              type="password"
              required
              minLength={8}
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
        </form>
      </ModalDialog>

      <ModalDialog
        open={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        title={`Configurar Exceção Individual HBAC — ${user.name}`}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setOverrideModalOpen(false)}
            >
              {t('common.cancel')}
            </button>
            <button type="submit" form="hbac-override-form" className="btn btn-primary">
              Registrar Exceção Auditada
            </button>
          </>
        }
      >
        <form id="hbac-override-form" onSubmit={handleAddOverride} className="flex flex-col gap-3">
          {ovrError && <p className="error">{ovrError}</p>}
          <div className="form-grid">
            <div className="field">
              <label htmlFor="ovr-resource">Recurso</label>
              <select
                id="ovr-resource"
                className="select"
                value={ovrResource}
                onChange={(e) => setOvrResource(e.target.value as PermissionResource)}
              >
                {ALL_RESOURCES.map((r) => (
                  <option key={r} value={r}>
                    {RESOURCE_LABELS[r][session.language]} ({r})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="ovr-action">Ação</label>
              <select
                id="ovr-action"
                className="select"
                value={ovrAction}
                onChange={(e) => setOvrAction(e.target.value as PermissionAction)}
              >
                {ALL_ACTIONS.map((a) => (
                  <option key={a} value={a}>
                    {ACTION_LABELS[a][session.language]} ({a})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="ovr-effect">Efeito da Regra</label>
              <select
                id="ovr-effect"
                className="select"
                value={ovrEffect}
                onChange={(e) => setOvrEffect(e.target.value as 'allow' | 'deny')}
              >
                <option value="allow">Conceder Exceção (ALLOW)</option>
                <option value="deny">Revogar Explicitamente (DENY)</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="ovr-reason">Justificativa de Governança *</label>
            <p id="ovr-reason-hint" className="hint">
              Ficará visível na Matriz Efetiva e na Trilha de Auditoria.
            </p>
            <textarea
              id="ovr-reason"
              className="textarea"
              required
              minLength={5}
              aria-describedby="ovr-reason-hint"
              value={ovrReason}
              onChange={(e) => setOvrReason(e.target.value)}
              placeholder="Ex.: Autorização temporária para conferência de contratos mensais..."
            />
          </div>
        </form>
      </ModalDialog>
    </div>
  );
};

export const RolesAndHbacPage: React.FC<{ scope: 'global' | 'company' }> = ({ scope }) => {
  const { empresaId } = useParams<{ empresaId: string }>();
  const {
    currentUser,
    roles,
    companies,
    session,
    hasPermission,
    getActor,
    refreshData,
    notify,
    t,
  } = useApp();

  const navigate = useNavigate();
  const targetCompanyId = scope === 'company' ? empresaId : undefined;
  const company = targetCompanyId ? companies.find((c) => c.id === targetCompanyId) : null;
  const baseRoute = scope === 'global' ? '/app/global/papeis' : `/app/empresa/${empresaId}/papeis`;

  const scopedRoles = roles.filter(
    (r) =>
      !r.archiveMetadata.isArchived &&
      (scope === 'global' || r.scope !== 'global') &&
      (!r.companyId || !targetCompanyId || r.companyId === targetCompanyId),
  );

  const [selectedRoleId, setSelectedRoleId] = useState<string>(
    scopedRoles[0]?.id || 'role-cliente',
  );
  const selectedRole = roles.find((r) => r.id === selectedRoleId) || scopedRoles[0];

  const [newRoleModalOpen, setNewRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleParentId, setNewRoleParentId] = useState('role-gerente');
  const [newRoleLevel, setNewRoleLevel] = useState(5);
  const [archiveRoleTarget, setArchiveRoleTarget] = useState<RoleEntity | null>(null);
  const [inspectRole, setInspectRole] = useState<RoleEntity | null>(null);

  if (!hasPermission('roles', 'view', targetCompanyId)) {
    return (
      <AccessDeniedView
        reason="Seu papel atual não possui permissão para acessar a configuração de papéis HBAC."
        requiredPermission="roles:view"
      />
    );
  }

  const canEditRoles = hasPermission('roles', 'edit', targetCompanyId);

  const handleToggleRolePermission = async (
    role: RoleEntity,
    resource: PermissionResource,
    action: PermissionAction,
  ) => {
    if (!currentUser || !canEditRoles) return;

    const exists = role.permissions.some(
      (p) => p.resource === resource && p.action === action,
    );

    if (!exists) {
      const check = validateNoPrivilegeEscalation({
        actor: currentUser,
        allRoles: roles,
        targetScope: role.scope,
        targetCompanyId,
        requestedGrants: [{ resource, action, scope: role.scope }],
        language: session.language,
      });
      if (!check.valid) {
        notify({
          type: 'error',
          title: 'Bloqueio de Elevação de Privilégio HBAC',
          description: check.reason,
        });
        return;
      }
    }

    const nextPermissions: PermissionGrant[] = exists
      ? role.permissions.filter((p) => !(p.resource === resource && p.action === action))
      : [...role.permissions, { resource, action, scope: role.scope }];

    const actor = getActor(targetCompanyId);
    await repositories.roles.update(
      role.id,
      (curr) => ({
        ...curr,
        permissions: nextPermissions,
      }),
      actor,
      `${exists ? 'Revogação' : 'Concessão'} da permissão ${resource}:${action} no papel "${role.name['pt-BR']}".`,
      exists ? 'revoke_permission' : 'grant_permission',
    );
    await refreshData();
    notify({
      type: 'success',
      title: `Permissão ${resource}:${action} ${exists ? 'removida' : 'adicionada'} no papel ${role.name[session.language]}.`,
    });
  };

  const handleCreateCustomRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newRoleName.trim()) return;
    const roleScope: PermissionScope = scope === 'global' ? 'global' : 'company';
    const check = validateNoPrivilegeEscalation({
      actor: currentUser,
      allRoles: roles,
      targetScope: roleScope,
      targetCompanyId,
      language: session.language,
    });
    if (!check.valid) {
      notify({ type: 'error', title: 'Erro HBAC', description: check.reason });
      return;
    }

    const newId = generateId('role');
    const created: RoleEntity = {
      id: newId,
      code: newRoleName.trim().toLowerCase().replace(/\s+/g, '_'),
      name: {
        'pt-BR': newRoleName.trim(),
        en: newRoleName.trim(),
        es: newRoleName.trim(),
      },
      description: {
        'pt-BR': newRoleDesc.trim(),
        en: newRoleDesc.trim(),
        es: newRoleDesc.trim(),
      },
      scope: roleScope,
      companyId: targetCompanyId,
      parentRoleId: newRoleParentId || null,
      hierarchyLevel: Number(newRoleLevel) || 5,
      isSystemRole: false,
      status: 'active',
      permissions: [{ resource: 'dashboard', action: 'view', scope: roleScope }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archiveMetadata: { isArchived: false },
      changeHistory: [],
    };

    await repositories.roles.create(
      created,
      getActor(targetCompanyId),
      `Criação de papel customizado HBAC "${created.name['pt-BR']}" (Nível ${created.hierarchyLevel}).`,
    );
    await refreshData();
    setSelectedRoleId(newId);
    setNewRoleName('');
    setNewRoleDesc('');
    setNewRoleModalOpen(false);
    notify({ type: 'success', title: `Papel "${created.name['pt-BR']}" criado com sucesso.` });
  };

  return (
    <div className="flex flex-col gap-2.5">
      <PageHeader
        breadcrumbs={[
          {
            label: scope === 'global' ? t('scope.global') : company?.tradeName || 'Empresa',
            to: scope === 'global' ? '/app/global' : `/app/empresa/${empresaId}`,
          },
          { label: t('nav.roles') },
        ]}
        title="Governança HBAC — Hierarquia de Papéis, Escopos e Matriz de Permissões"
        subtitle={`Configure papéis, relações pai-filho, escopos (Global / Empresa / Recurso) e permissões granulares • ${scopedRoles.length} papéis ativos`}
        scopeBadge={scope === 'global' ? t('scope.global') : company?.tradeName}
        actions={
          hasPermission('roles', 'create', targetCompanyId) && (
            <Link to={`${baseRoute}/novo`} className="btn btn-primary btn-sm">
              <Plus size={14} />
              Criar Papel Customizado
            </Link>
          )
        }
      />

      {/* Tabela de Papéis HBAC com Filtros e Paginação por URL */}
      <UrlDataTable<RoleEntity>
        tableId={`roles-table-${scope}`}
        caption="Papéis hierárquicos HBAC configurados na plataforma"
        items={scopedRoles}
        defaultSortField="hierarchyLevel"
        csvFilename={`papeis-hbac-${scope}.csv`}
        searchPlaceholder="Buscar papel por nome, código, escopo ou descrição..."
        statusExtractor={(r) => r.scope}
        searchExtractor={(r) => `${r.code} ${r.name['pt-BR']} ${r.description['pt-BR']} ${r.scope}`}
        statusOptions={[
          { value: 'global', label: 'Escopo Global' },
          { value: 'company', label: 'Escopo Empresa' },
          { value: 'resource', label: 'Escopo Recurso' },
        ]}
        isArchivedExtractor={(r) => r.archiveMetadata.isArchived}
        columns={[
          {
            key: 'name',
            header: 'Papel HBAC / Código',
            width: '30%',
            sortable: true,
            render: (r) => (
              <div>
                <Link to={`${baseRoute}/${r.id}/editar`} className="font-semibold">
                  {r.name[session.language]}
                </Link>
                <div>
                  <code className="text-xs text-muted mono">{r.code}</code>
                </div>
              </div>
            ),
          },
          {
            key: 'hierarchyLevel',
            header: 'Nível Hierárquico',
            width: '15%',
            sortable: true,
            render: (r) => <span className="badge badge-info">Nível {r.hierarchyLevel}</span>,
          },
          {
            key: 'parentRoleId',
            header: 'Papel Superior',
            width: '22%',
            render: (r) => {
              const parentRole = roles.find((p) => p.id === r.parentRoleId);
              return (
                <span className="text-xs">
                  {parentRole ? parentRole.name[session.language] : 'Raiz (N1)'}
                </span>
              );
            },
          },
          {
            key: 'permissionsCount',
            header: 'Regras / Escopo',
            width: '24%',
            render: (r) => (
              <div className="flex items-center gap-1.5">
                <StatusBadge status={r.scope} />
                <span className="badge">{r.permissions.length} regras</span>
              </div>
            ),
          },
          {
            key: 'actions',
            header: 'Ações',
            width: '9%',
            isNumeric: true,
            render: (r) => {
              const active = selectedRole?.id === r.id;
              return (
                <ActionDropdownMenu
                  label="Ações"
                  items={[
                    {
                      id: 'edit-role-page',
                      label: 'Editar Papel & Matriz (ID Único)',
                      icon: <Edit3 size={14} />,
                      variant: 'primary' as const,
                      onClick: () => navigate(`${baseRoute}/${r.id}/editar`),
                    },
                    {
                      id: 'select-matrix',
                      label: active ? 'Inspecionar Matriz HBAC' : 'Inspecionar Permissões',
                      icon: <ShieldCheck size={14} />,
                      onClick: () => {
                        setSelectedRoleId(r.id);
                        setInspectRole(r);
                      },
                    },
                    ...(!r.isSystemRole && hasPermission('roles', 'archive', targetCompanyId)
                      ? [
                          {
                            id: 'archive-role',
                            label: 'Arquivar Papel Customizado',
                            icon: <Trash2 size={14} />,
                            variant: 'danger' as const,
                            onClick: () => setArchiveRoleTarget(r),
                          },
                        ]
                      : []),
                  ]}
                />
              );
            },
          },
        ]}
      />

      {/* Modal: Inspeção Rápida do Papel HBAC (com X) */}
      <ModalDialog
        open={Boolean(inspectRole)}
        onClose={() => setInspectRole(null)}
        title={inspectRole ? `Papel HBAC — ${inspectRole.name[session.language]} (Nível ${inspectRole.hierarchyLevel})` : 'Papel'}
        description={inspectRole ? inspectRole.description[session.language] : ''}
        maxWidth="860px"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setInspectRole(null)}>
              Fechar
            </button>
            {inspectRole && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const id = inspectRole.id;
                  setInspectRole(null);
                  navigate(`${baseRoute}/${id}/editar`);
                }}
              >
                <Edit3 size={14} /> Abrir Página de Edição ({inspectRole.id})
              </button>
            )}
          </>
        }
      >
        {inspectRole && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={inspectRole.scope} />
              <span className="badge badge-info">Nível {inspectRole.hierarchyLevel}</span>
              <span className="badge badge-teal">{inspectRole.permissions.length} permissões diretas</span>
            </div>
            <div className="table-wrapper" style={{ maxHeight: '340px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Recurso / Módulo</th>
                    {ALL_ACTIONS.map((act) => (
                      <th key={act}>{ACTION_LABELS[act][session.language]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ALL_RESOURCES.map((res) => (
                    <tr key={res}>
                      <td>
                        <strong>{RESOURCE_LABELS[res][session.language]}</strong>
                        <div className="text-xs text-muted mono">{res}</div>
                      </td>
                      {ALL_ACTIONS.map((act) => {
                        const granted = inspectRole.permissions.some(
                          (p) => p.resource === res && p.action === act,
                        );
                        return (
                          <td key={act}>
                            <button
                              type="button"
                              disabled={!canEditRoles}
                              onClick={() => handleToggleRolePermission(inspectRole, res, act)}
                              className={`btn btn-sm ${granted ? 'btn-primary' : 'btn-secondary'}`}
                              style={{ width: '100%' }}
                            >
                              {granted ? 'Ativo' : 'Inativo'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ModalDialog>

      <ModalDialog
        open={newRoleModalOpen}
        onClose={() => setNewRoleModalOpen(false)}
        title="Criar Novo Papel Hierárquico HBAC"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setNewRoleModalOpen(false)}
            >
              {t('common.cancel')}
            </button>
            <button type="submit" form="create-role-form" className="btn btn-primary">
              Salvar Papel
            </button>
          </>
        }
      >
        <form id="create-role-form" onSubmit={handleCreateCustomRole} className="flex flex-col gap-3">
          <div className="field">
            <label htmlFor="new-role-name">Nome do Papel *</label>
            <input
              id="new-role-name"
              className="input"
              required
              minLength={3}
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="Ex.: Supervisor de Expedição"
            />
          </div>
          <div className="field">
            <label htmlFor="new-role-desc">Descrição e Responsabilidades *</label>
            <textarea
              id="new-role-desc"
              className="textarea"
              required
              value={newRoleDesc}
              onChange={(e) => setNewRoleDesc(e.target.value)}
            />
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="new-role-parent">Papel Superior na Hierarquia</label>
              <select
                id="new-role-parent"
                className="select"
                value={newRoleParentId}
                onChange={(e) => setNewRoleParentId(e.target.value)}
              >
                {scopedRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name[session.language]} (Nível {r.hierarchyLevel})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="new-role-level">Nível Hierárquico (2 a 10)</label>
              <input
                id="new-role-level"
                type="number"
                min={2}
                max={10}
                className="input tabular"
                value={newRoleLevel}
                onChange={(e) => setNewRoleLevel(Number(e.target.value))}
              />
            </div>
          </div>
        </form>
      </ModalDialog>

      <ArchiveRecordDialog
        open={Boolean(archiveRoleTarget)}
        onClose={() => setArchiveRoleTarget(null)}
        recordTitle={archiveRoleTarget ? archiveRoleTarget.name[session.language] : ''}
        onConfirmArchive={async (reason) => {
          if (!archiveRoleTarget) return;
          await repositories.roles.archive(
            archiveRoleTarget.id,
            reason,
            getActor(targetCompanyId),
          );
          await refreshData();
          notify({ type: 'warning', title: 'Papel arquivado com sucesso.' });
        }}
      />
    </div>
  );
};

export const RoleFormPage: React.FC<{ scope: 'global' | 'company'; mode: 'create' | 'edit' }> = ({
  scope,
  mode,
}) => {
  const { papelId, empresaId } = useParams<{ papelId: string; empresaId?: string }>();
  const navigate = useNavigate();
  const { roles, session, getActor, refreshData, notify, t } = useApp();

  const existing = mode === 'edit' ? roles.find((r) => r.id === papelId) : undefined;
  const baseRoute = scope === 'global' ? '/app/global/papeis' : `/app/empresa/${empresaId}/papeis`;

  const [name, setName] = useState(existing?.name['pt-BR'] || '');
  const [description, setDescription] = useState(existing?.description['pt-BR'] || '');
  const [parentRoleId, setParentRoleId] = useState<string>(existing?.parentRoleId || 'role-gerente');
  const [hierarchyLevel, setHierarchyLevel] = useState<number>(existing?.hierarchyLevel || 5);
  const [permissions, setPermissions] = useState<PermissionGrant[]>(
    existing?.permissions || [{ resource: 'dashboard', action: 'view', scope }],
  );

  if (mode === 'edit' && !existing) {
    return (
      <AccessDeniedView
        title="Papel Não Localizado"
        reason={`O papel "${papelId}" não foi encontrado.`}
        backTo={baseRoute}
      />
    );
  }

  const togglePerm = (resource: PermissionResource, action: PermissionAction) => {
    setPermissions((prev) => {
      const exists = prev.some((p) => p.resource === resource && p.action === action);
      if (exists) {
        return prev.filter((p) => !(p.resource === resource && p.action === action));
      }
      return [...prev, { resource, action, scope: existing?.scope || scope }];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const actor = getActor(empresaId);

    if (mode === 'create') {
      const newId = generateId('role');
      const created: RoleEntity = {
        id: newId,
        code: name.trim().toLowerCase().replace(/\s+/g, '_'),
        name: { 'pt-BR': name.trim(), en: name.trim(), es: name.trim() },
        description: { 'pt-BR': description.trim(), en: description.trim(), es: description.trim() },
        scope,
        companyId: empresaId,
        parentRoleId: parentRoleId || null,
        hierarchyLevel: Number(hierarchyLevel) || 5,
        isSystemRole: false,
        status: 'active',
        permissions,
        createdAt: now,
        updatedAt: now,
        archiveMetadata: { isArchived: false },
        changeHistory: [],
      };
      await repositories.roles.create(
        created,
        actor,
        `Criação de papel HBAC "${created.name['pt-BR']}".`,
      );
      await refreshData();
      notify({ type: 'success', title: `Papel "${created.name['pt-BR']}" criado.` });
      navigate(baseRoute);
    } else if (existing) {
      await repositories.roles.update(
        existing.id,
        (curr) => ({
          ...curr,
          name: { 'pt-BR': name.trim(), en: name.trim(), es: name.trim() },
          description: { 'pt-BR': description.trim(), en: description.trim(), es: description.trim() },
          parentRoleId: parentRoleId || null,
          hierarchyLevel: Number(hierarchyLevel) || curr.hierarchyLevel,
          permissions,
          updatedAt: now,
        }),
        actor,
        `Edição do papel HBAC "${name.trim()}" e sua matriz de permissões.`,
      );
      await refreshData();
      notify({ type: 'success', title: `Papel "${name.trim()}" atualizado.` });
      navigate(baseRoute);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: scope === 'global' ? t('scope.global') : t('scope.company'), to: baseRoute },
          { label: t('nav.roles'), to: baseRoute },
          { label: mode === 'create' ? 'Novo Papel' : `Editar ${existing?.name[session.language]}` },
        ]}
        title={
          mode === 'create'
            ? 'Criar Novo Papel Hierárquico HBAC'
            : `Editar Papel HBAC — ${existing?.name[session.language]} (ID: ${existing?.id})`
        }
        subtitle="Página dedicada de edição de papel e matriz de permissões com identificador único."
        actions={
          <Link to={baseRoute} className="btn btn-secondary btn-sm">
            {t('common.back')}
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="card">
          <div className="card-body grid-2">
            <div className="field">
              <label htmlFor="rf-name">Nome do Papel *</label>
              <input
                id="rf-name"
                className="input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="rf-level">Nível Hierárquico (1 a 10) *</label>
              <input
                id="rf-level"
                type="number"
                min={1}
                max={10}
                className="input tabular"
                value={hierarchyLevel}
                onChange={(e) => setHierarchyLevel(Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label htmlFor="rf-parent">Papel Superior na Hierarquia</label>
              <select
                id="rf-parent"
                className="select"
                value={parentRoleId}
                onChange={(e) => setParentRoleId(e.target.value)}
              >
                <option value="">Raiz (N1)</option>
                {roles
                  .filter((r) => r.id !== existing?.id)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name[session.language]} (Nível {r.hierarchyLevel})
                    </option>
                  ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="rf-desc">Descrição e Responsabilidades *</label>
              <input
                id="rf-desc"
                className="input"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Matriz de Permissões do Papel ({permissions.length} ativas)</h2>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Recurso / Módulo</th>
                  {ALL_ACTIONS.map((act) => (
                    <th key={act}>{ACTION_LABELS[act][session.language]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_RESOURCES.map((res) => (
                  <tr key={res}>
                    <td>
                      <strong>{RESOURCE_LABELS[res][session.language]}</strong>
                      <div className="text-xs text-muted mono">{res}</div>
                    </td>
                    {ALL_ACTIONS.map((act) => {
                      const granted = permissions.some(
                        (p) => p.resource === res && p.action === act,
                      );
                      return (
                        <td key={act}>
                          <button
                            type="button"
                            onClick={() => togglePerm(res, act)}
                            className={`btn btn-sm ${granted ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ width: '100%' }}
                          >
                            {granted ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-footer">
            <Link to={baseRoute} className="btn btn-secondary">
              {t('common.cancel')}
            </Link>
            <button type="submit" className="btn btn-primary">
              <Save size={14} /> {t('common.save')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

