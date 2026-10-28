import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Edit3,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
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
import { formatDateTime } from '../../i18n/translations';
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
  ArchiveRecordDialog,
  ModalDialog,
  PageHeader,
  StatusBadge,
  UnsavedChangesBanner,
  UrlDataTable,
} from '../../components/shared/SharedComponents';

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

  const [archiveTarget, setArchiveTarget] = useState<UserEntity | null>(null);

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

  const scopedUsers = targetCompanyId
    ? users.filter((u) => u.companyIds.includes(targetCompanyId))
    : users;

  const handleRestore = async (u: UserEntity) => {
    await repositories.users.restore(u.id, getActor(targetCompanyId));
    await refreshData();
    notify({ type: 'success', title: `Usuário ${u.name} restaurado.` });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          {
            label: scope === 'global' ? t('scope.global') : company?.tradeName || 'Empresa',
            to: scope === 'global' ? '/app/global' : `/app/empresa/${empresaId}`,
          },
          { label: t('nav.users') },
        ]}
        title="Gestão de Usuários, Identidades & Associação HBAC"
        subtitle="Controle completo de vínculos por empresa, papéis hierárquicos e exceções individuais auditadas."
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
        onArchiveClick={
          hasPermission('users', 'archive', targetCompanyId)
            ? (item) => setArchiveTarget(item)
            : undefined
        }
        onRestoreClick={
          hasPermission('users', 'archive', targetCompanyId) ? handleRestore : undefined
        }
        columns={[
          {
            key: 'name',
            header: 'Usuário / E-mail',
            sortable: true,
            csvValue: (u) => `${u.name} <${u.email}>`,
            render: (u) => (
              <div>
                <Link to={`${baseRoute}/${u.id}`} className="font-semibold">
                  {u.name}
                </Link>
                <div className="text-xs text-muted mono">{u.email}</div>
              </div>
            ),
          },
          {
            key: 'roles',
            header: 'Papéis HBAC',
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
            header: 'Empresas Associadas',
            csvValue: (u) => u.companyIds.join('; '),
            render: (u) => (
              <div className="flex items-center gap-1 flex-wrap">
                {u.companyIds.length === 0 ? (
                  <span className="text-xs text-muted">Global (Plataforma)</span>
                ) : (
                  u.companyIds.map((cid) => {
                    const comp = companies.find((c) => c.id === cid);
                    return (
                      <span key={cid} className="badge">
                        {comp?.tradeName || cid}
                      </span>
                    );
                  })
                )}
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Estado',
            sortable: true,
            render: (u) => <StatusBadge status={u.status} />,
          },
          {
            key: 'lastLoginAt',
            header: 'Último Acesso (Sim.)',
            render: (u) => (
              <span className="text-xs text-muted tabular">
                {formatDateTime(u.lastLoginAt, session.language)}
              </span>
            ),
          },
          {
            key: 'nav',
            header: 'Matriz & Edição',
            render: (u) => (
              <div className="flex items-center gap-1">
                <Link to={`${baseRoute}/${u.id}`} className="btn btn-secondary btn-sm">
                  <ShieldCheck size={13} />
                  Matriz HBAC
                </Link>
                {hasPermission('users', 'edit', targetCompanyId) && (
                  <Link to={`${baseRoute}/${u.id}/editar`} className="btn btn-ghost btn-sm">
                    <Edit3 size={13} />
                  </Link>
                )}
              </div>
            ),
          },
        ]}
      />

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
  const [hbacError, setHbacError] = useState('');
  const [isDirty, setIsDirty] = useState(false);

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

  const toggleRole = (rid: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(rid) ? prev.filter((id) => id !== rid) : [...prev, rid],
    );
  };

  const toggleCompany = (cid: string) => {
    setSelectedCompanyIds((prev) =>
      prev.includes(cid) ? prev.filter((id) => id !== cid) : [...prev, cid],
    );
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
      await refreshData();
      notify({ type: 'success', title: `Usuário ${newUser.name} criado com sucesso.` });
      navigate(`${baseRoute}/${newId}`);
    } else if (existing) {
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
        `Atualização de cadastro e papéis HBAC do usuário ${name.trim()}.`,
      );
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
          <div className="form-section-title">3. Empresas Associadas (Escopo Multiempresa)</div>
          <div className="form-grid mt-2">
            {availableCompanies.map((c) => {
              const checked = selectedCompanyIds.includes(c.id);
              return (
                <label
                  key={c.id}
                  style={{
                    border: checked
                      ? '1px solid var(--accent-teal)'
                      : '1px solid var(--border-subtle)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCompany(c.id)}
                  />
                  <div>
                    <div className="font-semibold text-sm">{c.tradeName}</div>
                    <div className="text-xs text-muted mono">{c.id}</div>
                  </div>
                </label>
              );
            })}
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

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: t('nav.users'), to: baseRoute },
          { label: user.name },
        ]}
        title={`${user.name} — Inspetor de Matriz Efetiva HBAC`}
        subtitle={`${user.email} • Telefone: ${user.phone} • Criado em: ${formatDateTime(user.createdAt, session.language)}`}
        scopeBadge={`Papel Principal: ${userRoles[0]?.name[session.language] || 'Sem Papel'}`}
        actions={
          <>
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
                        <div className="flex flex-col gap-1">
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
                          <span className="text-xs text-muted" style={{ fontSize: '0.68rem' }}>
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

  const targetCompanyId = scope === 'company' ? empresaId : undefined;
  const company = targetCompanyId ? companies.find((c) => c.id === targetCompanyId) : null;

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
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          {
            label: scope === 'global' ? t('scope.global') : company?.tradeName || 'Empresa',
            to: scope === 'global' ? '/app/global' : `/app/empresa/${empresaId}`,
          },
          { label: t('nav.roles') },
        ]}
        title="Governança HBAC — Hierarquia de Papéis, Escopos e Matriz de Permissões"
        subtitle="Configure papéis, relações pai-filho, escopos (Global / Empresa / Recurso) e permissões granulares sem permitir elevação de privilégios."
        scopeBadge={scope === 'global' ? t('scope.global') : company?.tradeName}
        actions={
          hasPermission('roles', 'create', targetCompanyId) && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setNewRoleModalOpen(true)}
            >
              <Plus size={14} />
              Criar Papel Customizado
            </button>
          )
        }
      />

      {/* Role Selector Strip */}
      <div className="kpi-grid">
        {scopedRoles.map((r) => {
          const active = selectedRole?.id === r.id;
          const parentRole = roles.find((p) => p.id === r.parentRoleId);
          return (
            <div
              key={r.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedRoleId(r.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedRoleId(r.id);
                }
              }}
              className="card"
              style={{
                padding: '1rem',
                cursor: 'pointer',
                border: active
                  ? '2px solid var(--accent-primary)'
                  : '1px solid var(--border-subtle)',
                backgroundColor: active ? 'var(--accent-primary-soft)' : 'var(--bg-surface)',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <strong>{r.name[session.language]}</strong>
                <span className="badge badge-info">Nível {r.hierarchyLevel}</span>
              </div>
              <p className="text-xs text-muted mt-2">{r.description[session.language]}</p>
              <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <span className="text-xs text-muted">
                  Superior: <strong>{parentRole ? parentRole.name[session.language] : 'Raiz (N1)'}</strong>
                </span>
                <span className="badge">{r.permissions.length} regras</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Permission Matrix Editor for Selected Role */}
      {selectedRole && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="flex items-center gap-2">
                <h2 style={{ fontSize: '1.05rem' }}>
                  Editor de Permissões do Papel: {selectedRole.name[session.language]}
                </h2>
                <StatusBadge status={selectedRole.scope} />
                <StatusBadge status={selectedRole.status} />
              </div>
              <p className="text-xs text-muted mt-2">
                Clique em qualquer célula para conceder ou revogar a ação para este papel. Todas as
                alterações são validadas pelo motor HBAC e gravadas na auditoria.
              </p>
            </div>
            {!selectedRole.isSystemRole && hasPermission('roles', 'archive', targetCompanyId) && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => setArchiveRoleTarget(selectedRole)}
              >
                Arquivar Papel Customizado
              </button>
            )}
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
                      const granted = selectedRole.permissions.some(
                        (p) => p.resource === res && p.action === act,
                      );
                      return (
                        <td key={act}>
                          <button
                            type="button"
                            disabled={!canEditRoles}
                            onClick={() => handleToggleRolePermission(selectedRole, res, act)}
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
