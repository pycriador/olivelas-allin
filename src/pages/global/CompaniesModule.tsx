import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  Building2,
  Edit3,
  Plus,
  Save,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CompanyEntity, CompanyStatus, CurrencyCode, LanguageCode } from '../../types/domain';
import { generateId, repositories } from '../../repositories/repositories';
import { formatCurrency, formatDateTime } from '../../i18n/translations';
import {
  AccessDeniedView,
  ArchiveRecordDialog,
  PageHeader,
  StatusBadge,
  UnsavedChangesBanner,
  UrlDataTable,
} from '../../components/shared/SharedComponents';
import { getUserActiveRoles } from '../../services/hbacService';

export const CompaniesListPage: React.FC = () => {
  const {
    companies,
    companyModules,
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

  if (!hasPermission('companies', 'view')) {
    return (
      <AccessDeniedView
        reason="Seu papel atual não possui permissão para listar empresas no Console Global."
        requiredPermission="companies:view"
      />
    );
  }

  const handleRestore = async (comp: CompanyEntity) => {
    await repositories.companies.restore(comp.id, getActor(comp.id));
    await refreshData();
    notify({ type: 'success', title: `Empresa ${comp.tradeName} restaurada com sucesso.` });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: t('scope.global'), to: '/app/global' },
          { label: t('nav.companies') },
        ]}
        title="Gestão Multiempresa — Cadastro & Governança de Tenants"
        subtitle="Isolamento lógico por empresa, controle de estado cadastral/operacional, módulos ativos e histórico auditado."
        scopeBadge={t('scope.global')}
        actions={
          hasPermission('companies', 'create') && (
            <Link to="/app/global/empresas/nova" className="btn btn-primary btn-sm">
              <Plus size={14} />
              Cadastrar Nova Empresa
            </Link>
          )
        }
      />

      <UrlDataTable<CompanyEntity>
        tableId="global-companies-table"
        caption="Empresas cadastradas na plataforma Olivelas Allin"
        items={companies}
        defaultSortField="createdAt"
        csvFilename="empresas-olivelas-allin.csv"
        searchPlaceholder="Buscar por razão social, nome fantasia, CNPJ ou ID..."
        statusExtractor={(c) => c.operationalStatus}
        searchExtractor={(c) =>
          `${c.id} ${c.legalName} ${c.tradeName} ${c.taxId || ''} ${c.address.city}`
        }
        statusOptions={[
          { value: 'active', label: t('status.active') },
          { value: 'pending', label: t('status.pending') },
          { value: 'suspended', label: t('status.suspended') },
          { value: 'archived', label: t('status.archived') },
        ]}
        isArchivedExtractor={(c) => c.archiveMetadata.isArchived}
        onArchiveClick={
          hasPermission('companies', 'archive') ? (item) => setArchiveTarget(item) : undefined
        }
        onRestoreClick={hasPermission('companies', 'archive') ? handleRestore : undefined}
        columns={[
          {
            key: 'tradeName',
            header: 'Empresa / Identificador',
            sortable: true,
            csvValue: (c) => `${c.tradeName} (${c.id})`,
            render: (c) => (
              <div>
                <Link to={`/app/global/empresas/${c.id}`} className="font-semibold">
                  {c.tradeName}
                </Link>
                <div className="text-xs text-muted">{c.legalName}</div>
                <code className="text-xs text-muted">{c.id}</code>
              </div>
            ),
          },
          {
            key: 'taxId',
            header: 'Doc. Fiscal / Local',
            render: (c) => (
              <div>
                <div className="mono text-xs">{c.taxId || 'Opcional / Não informado'}</div>
                <div className="text-xs text-muted">
                  {c.address.city}/{c.address.state} • {c.country}
                </div>
              </div>
            ),
          },
          {
            key: 'operationalStatus',
            header: 'Estado Operacional',
            sortable: true,
            render: (c) => <StatusBadge status={c.operationalStatus} />,
          },
          {
            key: 'currency',
            header: 'Moeda / Idioma',
            render: (c) => (
              <span className="text-xs mono">
                {c.currency} • {c.defaultLanguage}
              </span>
            ),
          },
          {
            key: 'modulesCount',
            header: 'Módulos Ativos',
            isNumeric: true,
            csvValue: (c) =>
              companyModules.filter((m) => m.companyId === c.id && m.status === 'active').length,
            render: (c) => {
              const count = companyModules.filter(
                (m) => m.companyId === c.id && m.status === 'active',
              ).length;
              return (
                <Link to={`/app/global/empresas/${c.id}/modulos`} className="badge badge-teal">
                  {count} ativo(s)
                </Link>
              );
            },
          },
          {
            key: 'quickActions',
            header: 'Navegação & Suporte',
            render: (c) => (
              <div className="flex items-center gap-1 flex-wrap">
                <Link to={`/app/global/empresas/${c.id}`} className="btn btn-secondary btn-sm">
                  Detalhes
                </Link>
                {hasPermission('companies', 'edit') && (
                  <Link
                    to={`/app/global/empresas/${c.id}/editar`}
                    className="btn btn-ghost btn-sm"
                  >
                    <Edit3 size={13} />
                    Editar
                  </Link>
                )}
                {isCurrentSuperAdmin && !c.archiveMetadata.isArchived && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={async () => {
                      await startSupportImpersonation(
                        c.id,
                        'Inspeção administrativa direta via listagem global de empresas.',
                      );
                      navigate(`/app/empresa/${c.id}`);
                    }}
                  >
                    <UserCheck size={13} />
                    Contexto
                  </button>
                )}
              </div>
            ),
          },
        ]}
      />

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

  const [legalName, setLegalName] = useState(existing?.legalName || '');
  const [tradeName, setTradeName] = useState(existing?.tradeName || '');
  const [taxId, setTaxId] = useState(existing?.taxId || '');
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
  const [contactName, setContactName] = useState(existing?.contacts[0]?.name || '');
  const [contactEmail, setContactEmail] = useState(existing?.contacts[0]?.email || '');
  const [contactPhone, setContactPhone] = useState(existing?.contacts[0]?.phone || '');
  const [street, setStreet] = useState(existing?.address.street || '');
  const [number, setNumber] = useState(existing?.address.number || '');
  const [district, setDistrict] = useState(existing?.address.district || '');
  const [city, setCity] = useState(existing?.address.city || '');
  const [stateCode, setStateCode] = useState(existing?.address.state || 'SP');
  const [postalCode, setPostalCode] = useState(existing?.address.postalCode || '');
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
        `Cadastro inicial da empresa ${newCompany.tradeName} (${newId}).`,
      );
      // Provision Allin Core automatically
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
        description: 'Módulo base Allin Core provisionado automaticamente.',
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
        `Atualização cadastral e operacional da empresa ${tradeName.trim()}.`,
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
            ? 'Cadastrar Nova Empresa Cliente (Provisionamento de Tenant)'
            : `Editar Empresa — ${existing?.tradeName}`
        }
        subtitle="Formulário estruturado por seções com validação e registro automático na trilha de auditoria."
        scopeBadge={t('scope.global')}
      />

      <UnsavedChangesBanner
        isDirty={isDirty}
        onDiscard={() => navigate(existing ? `/app/global/empresas/${existing.id}` : '/app/global/empresas')}
      />

      <form onSubmit={handleSave} onChange={() => setIsDirty(true)}>
        <div className="form-section">
          <div className="form-section-title">1. Identificação Societária & Fiscal</div>
          <div className="form-section-desc">
            Dados oficiais da pessoa jurídica ou unidade de negócio isolada.
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
        title={`${company.tradeName} (${company.id})`}
        subtitle={`${company.legalName} • Documento: ${company.taxId || 'Opcional'} • Estado: ${company.operationalStatus}`}
        scopeBadge={`Tenant ID: ${company.id}`}
        actions={
          <>
            {hasPermission('companies', 'edit') && (
              <Link
                to={`/app/global/empresas/${company.id}/editar`}
                className="btn btn-secondary btn-sm"
              >
                <Edit3 size={14} />
                Editar Empresa
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
          Ficha Cadastral & Governança
        </NavLink>
        <NavLink
          to={`/app/global/empresas/${company.id}/usuarios`}
          className={({ isActive }) => `tab-link ${isActive ? 'active' : ''}`}
        >
          Usuários Vinculados ({companyUsers.length})
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '1.25rem',
          }}
        >
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: '1rem' }}>Dados Societários e Localização</h2>
              <StatusBadge status={company.operationalStatus} />
            </div>
            <div className="card-body flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Identificador Único:</span>
                <code className="font-semibold">{company.id}</code>
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
                <span className="text-muted">Idioma / Moeda / Fuso:</span>
                <span className="mono">
                  {company.defaultLanguage} • {company.currency} • {company.timezone}
                </span>
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
              <h2 style={{ fontSize: '1rem' }}>Contatos & Histórico de Alterações</h2>
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

              <div className="text-xs font-semibold text-muted mt-2">
                HISTÓRICO DE REVISÕES DO REGISTRO ({company.changeHistory.length})
              </div>
              {company.changeHistory.map((chg) => (
                <div key={chg.id} className="text-xs text-muted">
                  <span className="tabular">{formatDateTime(chg.timestamp, session.language)}</span> —{' '}
                  <strong>{chg.actorName}</strong>: {chg.summary}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'usuarios' && (
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '1rem' }}>Usuários Associados a {company.tradeName}</h2>
            <Link to="/app/global/usuarios/novo" className="btn btn-primary btn-sm">
              <Plus size={14} />
              Novo Usuário
            </Link>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Papéis HBAC</th>
                  <th>Estado</th>
                  <th className="num">Ações</th>
                </tr>
              </thead>
              <tbody>
                {companyUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="font-semibold">{u.name}</td>
                    <td className="mono text-xs">{u.email}</td>
                    <td>
                      {getUserActiveRoles(u, roles).map((r) => (
                        <span key={r.id} className="badge badge-info" style={{ marginRight: 4 }}>
                          {r.name[session.language]}
                        </span>
                      ))}
                    </td>
                    <td>
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="num">
                      <Link to={`/app/global/usuarios/${u.id}`} className="btn btn-secondary btn-sm">
                        Inspecionar HBAC
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'modulos' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 style={{ fontSize: '1rem' }}>
                Módulos Comerciais Contratados por {company.tradeName}
              </h2>
              <p className="text-xs text-muted">
                Ative ou suspenda módulos individualmente para este tenant. A navegação do ambiente da
                empresa reflete imediatamente o estado ativo.
              </p>
            </div>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Módulo Comercial</th>
                  <th>Estado na Empresa</th>
                  <th className="num">Valor Mensal</th>
                  <th className="num">Ação</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((mod) => {
                  const sub = companySubs.find((s) => s.moduleId === mod.id);
                  const isActive = sub?.status === 'active';
                  return (
                    <tr key={mod.id}>
                      <td>
                        <code className="text-xs">{mod.code}</code>
                      </td>
                      <td>
                        <strong>{mod.name[session.language]}</strong>
                        <div className="text-xs text-muted">{mod.description[session.language]}</div>
                      </td>
                      <td>
                        <StatusBadge status={sub?.status || 'not_contracted'} />
                      </td>
                      <td className="num tabular">
                        {formatCurrency(mod.priceMonthly, mod.currency, session.language)}
                      </td>
                      <td className="num">
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'contratos' && (
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '1rem' }}>Contratos de {company.tradeName}</h2>
            <Link to="/app/global/contratos/novo" className="btn btn-primary btn-sm">
              Novo Contrato
            </Link>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Plano</th>
                  <th>Vigência</th>
                  <th>Versão</th>
                  <th>Estado</th>
                  <th className="num">Valor Final</th>
                  <th className="num">Ficha</th>
                </tr>
              </thead>
              <tbody>
                {companyContracts.map((ct) => (
                  <tr key={ct.id}>
                    <td className="mono font-semibold">{ct.code}</td>
                    <td>{ct.planName}</td>
                    <td className="text-xs tabular">
                      {ct.startDate} → {ct.endDate}
                    </td>
                    <td className="tabular">v{ct.version}</td>
                    <td>
                      <StatusBadge status={ct.status} />
                    </td>
                    <td className="num font-semibold tabular">
                      {formatCurrency(ct.finalValue, ct.currency, session.language)}
                    </td>
                    <td className="num">
                      <Link to={`/app/global/contratos/${ct.id}`} className="btn btn-secondary btn-sm">
                        Ver Contrato
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'financeiro' && (
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '1rem' }}>Cobranças e Faturamento de {company.tradeName}</h2>
            <Link to="/app/global/financeiro/cobrancas" className="btn btn-secondary btn-sm">
              Abrir Console Financeiro
            </Link>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fatura</th>
                  <th>Descrição</th>
                  <th>Vencimento</th>
                  <th>Meio</th>
                  <th>Estado</th>
                  <th className="num">Valor</th>
                </tr>
              </thead>
              <tbody>
                {companyCharges.map((ch) => (
                  <tr key={ch.id}>
                    <td className="mono font-semibold">{ch.code}</td>
                    <td>{ch.description}</td>
                    <td className="tabular">{ch.dueDate}</td>
                    <td>
                      <span className="badge">{ch.paymentMethodType.toUpperCase()}</span>
                    </td>
                    <td>
                      <StatusBadge status={ch.status} />
                    </td>
                    <td className="num font-semibold tabular">
                      {formatCurrency(ch.amount, ch.currency, session.language)}
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
