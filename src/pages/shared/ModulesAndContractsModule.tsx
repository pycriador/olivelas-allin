import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  CheckCircle2,
  Edit3,
  FileSignature,
  Package,
  Plus,
  Save,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  CatalogModuleEntity,
  ContractEntity,
  ContractStatus,
  CurrencyCode,
  ModuleCategory,
  ModuleCommercialStatus,
} from '../../types/domain';
import { generateId, repositories } from '../../repositories/repositories';
import { formatCurrency, formatDateTime } from '../../i18n/translations';
import {
  AccessDeniedView,
  ArchiveRecordDialog,
  ModalDialog,
  PageHeader,
  StatusBadge,
  UnsavedChangesBanner,
  UrlDataTable,
} from '../../components/shared/SharedComponents';

export const GlobalModulesCatalogPage: React.FC = () => {
  const { modules, companyModules, session, hasPermission, getActor, refreshData, notify, t } =
    useApp();
  const [archiveTarget, setArchiveTarget] = useState<CatalogModuleEntity | null>(null);

  if (!hasPermission('modules', 'view')) {
    return (
      <AccessDeniedView
        reason="Seu papel atual não possui permissão para acessar o catálogo comercial de módulos."
        requiredPermission="modules:view"
      />
    );
  }

  const handleRestore = async (mod: CatalogModuleEntity) => {
    await repositories.modules.restore(mod.id, getActor());
    await refreshData();
    notify({ type: 'success', title: `Módulo ${mod.name[session.language]} restaurado.` });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: t('scope.global'), to: '/app/global' },
          { label: t('nav.modules') },
        ]}
        title="Catálogo Comercial de Módulos Allin"
        subtitle="Gerencie preços, categorias, limites de utilização, dependências técnicas e versões dos módulos contratáveis."
        scopeBadge={t('scope.global')}
        actions={
          hasPermission('modules', 'create') && (
            <Link to="/app/global/modulos/novo" className="btn btn-primary btn-sm">
              <Plus size={14} />
              Cadastrar Módulo Comercial
            </Link>
          )
        }
      />

      <UrlDataTable<CatalogModuleEntity>
        tableId="global-modules-table"
        caption="Catálogo comercial de módulos da plataforma Olivelas Allin"
        items={modules}
        defaultSortField="code"
        csvFilename="catalogo-modulos-allin.csv"
        searchPlaceholder="Buscar por código técnico, nome ou categoria..."
        statusExtractor={(m) => m.commercialStatus}
        searchExtractor={(m) =>
          `${m.code} ${m.name['pt-BR']} ${m.name.en} ${m.category} ${m.usageLimits}`
        }
        statusOptions={[
          { value: 'active', label: t('status.active') },
          { value: 'beta', label: 'Beta' },
          { value: 'discontinued', label: 'Descontinuado' },
          { value: 'archived', label: t('status.archived') },
        ]}
        isArchivedExtractor={(m) => m.archiveMetadata.isArchived}
        onArchiveClick={
          hasPermission('modules', 'archive') ? (item) => setArchiveTarget(item) : undefined
        }
        onRestoreClick={hasPermission('modules', 'archive') ? handleRestore : undefined}
        columns={[
          {
            key: 'code',
            header: 'Módulo / Código Técnico',
            sortable: true,
            csvValue: (m) => `${m.name[session.language]} (${m.code})`,
            render: (m) => (
              <div>
                <Link to={`/app/global/modulos/${m.id}`} className="font-semibold">
                  {m.name[session.language]}
                </Link>
                <div className="text-xs text-muted mono">
                  {m.code} • v{m.version}
                </div>
              </div>
            ),
          },
          {
            key: 'category',
            header: 'Categoria & Dependências',
            render: (m) => (
              <div className="flex flex-col gap-1">
                <span className="badge">{m.category}</span>
                <span className="text-xs text-muted">
                  Dep.: {m.dependencies.length > 0 ? m.dependencies.join(', ') : 'Nenhuma'}
                </span>
              </div>
            ),
          },
          {
            key: 'priceMonthly',
            header: 'Preço Mensal / Anual',
            sortable: true,
            isNumeric: true,
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
            header: 'Estado Comercial',
            sortable: true,
            render: (m) => <StatusBadge status={m.commercialStatus} />,
          },
          {
            key: 'tenants',
            header: 'Empresas Ativas',
            isNumeric: true,
            csvValue: (m) =>
              companyModules.filter((cm) => cm.moduleId === m.id && cm.status === 'active').length,
            render: (m) => {
              const count = companyModules.filter(
                (cm) => cm.moduleId === m.id && cm.status === 'active',
              ).length;
              return <span className="badge badge-teal">{count} empresa(s)</span>;
            },
          },
          {
            key: 'actions',
            header: 'Ficha & Edição',
            render: (m) => (
              <div className="flex items-center gap-1">
                <Link to={`/app/global/modulos/${m.id}`} className="btn btn-secondary btn-sm">
                  Detalhes
                </Link>
                {hasPermission('modules', 'edit') && (
                  <Link
                    to={`/app/global/modulos/${m.id}/editar`}
                    className="btn btn-ghost btn-sm"
                  >
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
                placeholder="Ex.: Allin Fiscal"
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
  const { modules, companyModules, companies, session, hasPermission, t } = useApp();

  const mod = modules.find((m) => m.id === moduloId);
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
          hasPermission('modules', 'edit') && (
            <Link to={`/app/global/modulos/${mod.id}/editar`} className="btn btn-primary btn-sm">
              <Edit3 size={14} />
              Editar Módulo
            </Link>
          )
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
      </div>

      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: '1rem' }}>Empresas com Vínculo neste Módulo</h2>
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Ciclo</th>
                <th>Estado</th>
                <th>Renovação</th>
                <th className="num">Valor Acordado</th>
              </tr>
            </thead>
            <tbody>
              {subscribedCompanies.map((sub) => {
                const comp = companies.find((c) => c.id === sub.companyId);
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
                    <td>{sub.billingCycle}</td>
                    <td>
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="tabular">{sub.renewalDate}</td>
                    <td className="num tabular font-semibold">
                      {formatCurrency(sub.agreedPrice, sub.currency, session.language)}
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
  const {
    companies,
    modules,
    companyModules,
    session,
    hasPermission,
    getActor,
    refreshData,
    notify,
  } = useApp();

  const company = companies.find((c) => c.id === empresaId);
  if (!company) return null;

  const canManage = hasPermission('modules', 'approve', company.id) || hasPermission('modules', 'edit', company.id);
  const mySubs = companyModules.filter((cm) => cm.companyId === company.id);

  const handleToggleSubscription = async (mod: CatalogModuleEntity) => {
    if (!canManage) return;
    const existing = mySubs.find((s) => s.moduleId === mod.id);
    const isActive = existing?.status === 'active';

    if (!isActive) {
      // Check module dependencies
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
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: company.tradeName, to: `/app/empresa/${company.id}` },
          { label: 'Módulos Contratados & Loja Modular' },
        ]}
        title={`Catálogo & Assinaturas Modulares — ${company.tradeName}`}
        subtitle="Contrate novos módulos sob demanda ou gerencie os módulos atualmente ativos no ambiente da sua empresa."
        scopeBadge={company.tradeName}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem',
        }}
      >
        {modules
          .filter((m) => !m.archiveMetadata.isArchived)
          .map((mod) => {
            const sub = mySubs.find((s) => s.moduleId === mod.id);
            const active = sub?.status === 'active';
            return (
              <div
                key={mod.id}
                className="card"
                style={{
                  border: active
                    ? '1px solid var(--accent-teal)'
                    : '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div className="card-body flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="badge">{mod.code}</span>
                    <StatusBadge status={active ? 'active' : 'pending'} />
                  </div>
                  <h3 style={{ fontSize: '1.05rem' }}>{mod.name[session.language]}</h3>
                  <p className="text-xs text-muted">{mod.description[session.language]}</p>
                  <div className="text-xs text-muted mt-2">
                    <strong>Limites:</strong> {mod.usageLimits}
                  </div>
                  {mod.dependencies.length > 0 && (
                    <div className="text-xs text-muted">
                      <strong>Dependências:</strong> {mod.dependencies.join(', ')}
                    </div>
                  )}
                </div>
                <div className="card-footer">
                  <span className="font-semibold tabular">
                    {formatCurrency(mod.priceMonthly, mod.currency, session.language)}/mês
                  </span>
                  {canManage ? (
                    <button
                      type="button"
                      disabled={mod.isCore && active}
                      onClick={() => handleToggleSubscription(mod)}
                      className={`btn btn-sm ${active ? 'btn-secondary' : 'btn-primary'}`}
                    >
                      <Package size={14} />
                      {mod.isCore && active
                        ? 'Módulo Base'
                        : active
                          ? 'Desativar Módulo'
                          : 'Contratar Módulo'}
                    </button>
                  ) : (
                    <span className="text-xs text-muted">Somente leitura</span>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export const ContractsListPage: React.FC<{ scope: 'global' | 'company' }> = ({ scope }) => {
  const { empresaId } = useParams<{ empresaId: string }>();
  const { contracts, companies, session, hasPermission, getActor, refreshData, notify, t } =
    useApp();
  const [archiveTarget, setArchiveTarget] = useState<ContractEntity | null>(null);

  const targetCompanyId = scope === 'company' ? empresaId : undefined;
  const company = targetCompanyId ? companies.find((c) => c.id === targetCompanyId) : null;
  const baseRoute =
    scope === 'global' ? '/app/global/contratos' : `/app/empresa/${empresaId}/contratos`;

  if (!hasPermission('contracts', 'view', targetCompanyId)) {
    return (
      <AccessDeniedView
        reason="Seu papel atual não possui permissão para visualizar contratos."
        requiredPermission="contracts:view"
      />
    );
  }

  const scopedContracts = targetCompanyId
    ? contracts.filter((c) => c.companyId === targetCompanyId)
    : contracts;

  const handleRestore = async (ct: ContractEntity) => {
    await repositories.contracts.restore(ct.id, getActor(ct.companyId));
    await refreshData();
    notify({ type: 'success', title: `Contrato ${ct.code} restaurado.` });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          {
            label: scope === 'global' ? t('scope.global') : company?.tradeName || 'Empresa',
            to: scope === 'global' ? '/app/global' : `/app/empresa/${empresaId}`,
          },
          { label: t('nav.contracts') },
        ]}
        title="Gestão de Contratos, Versionamento & Assinaturas"
        subtitle="Histórico imutável de versões contratuais, módulos vinculados, descontos e assinaturas demonstrativas."
        scopeBadge={scope === 'global' ? t('scope.global') : company?.tradeName}
        actions={
          scope === 'global' &&
          hasPermission('contracts', 'create') && (
            <Link to="/app/global/contratos/novo" className="btn btn-primary btn-sm">
              <Plus size={14} />
              Emitir Novo Contrato
            </Link>
          )
        }
      />

      <UrlDataTable<ContractEntity>
        tableId={`contracts-table-${scope}`}
        caption="Contratos comerciais e assinaturas registradas"
        items={scopedContracts}
        defaultSortField="createdAt"
        csvFilename={`contratos-${scope}.csv`}
        searchPlaceholder="Buscar por código do contrato, empresa ou plano..."
        statusExtractor={(c) => c.status}
        searchExtractor={(c) => `${c.code} ${c.companyName} ${c.planName} ${c.commercialResponsible}`}
        statusOptions={[
          { value: 'active', label: t('status.active') },
          { value: 'pending_signature', label: t('status.pending_signature') },
          { value: 'draft', label: t('status.draft') },
          { value: 'suspended', label: t('status.suspended') },
          { value: 'archived', label: t('status.archived') },
        ]}
        isArchivedExtractor={(c) => c.archiveMetadata.isArchived}
        onArchiveClick={
          hasPermission('contracts', 'archive', targetCompanyId)
            ? (item) => setArchiveTarget(item)
            : undefined
        }
        onRestoreClick={
          hasPermission('contracts', 'archive', targetCompanyId) ? handleRestore : undefined
        }
        columns={[
          {
            key: 'code',
            header: 'Contrato / Versão',
            sortable: true,
            csvValue: (c) => `${c.code} (v${c.version})`,
            render: (c) => (
              <div>
                <Link to={`${baseRoute}/${c.id}`} className="font-semibold mono">
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
            header: 'Empresa / Plano',
            sortable: true,
            render: (c) => (
              <div>
                <div className="font-semibold">{c.companyName}</div>
                <div className="text-xs text-muted">
                  {c.planName} ({c.moduleIds.length} módulos)
                </div>
              </div>
            ),
          },
          {
            key: 'startDate',
            header: 'Vigência & Ciclo',
            render: (c) => (
              <div className="text-xs tabular">
                <div>
                  {c.startDate} → {c.endDate}
                </div>
                <span className="text-muted">Ciclo: {c.billingCycle}</span>
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Estado',
            sortable: true,
            render: (c) => <StatusBadge status={c.status} />,
          },
          {
            key: 'finalValue',
            header: 'Valor Final',
            sortable: true,
            isNumeric: true,
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
            render: (c) => (
              <div className="flex items-center gap-1">
                <Link to={`${baseRoute}/${c.id}`} className="btn btn-secondary btn-sm">
                  <FileSignature size={13} />
                  Inspecionar / Assinar
                </Link>
                {scope === 'global' && hasPermission('contracts', 'edit') && (
                  <Link
                    to={`/app/global/contratos/${c.id}/editar`}
                    className="btn btn-ghost btn-sm"
                  >
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

export const ContractFormPage: React.FC<{ mode: 'create' | 'edit' }> = ({ mode }) => {
  const { contratoId } = useParams<{ contratoId: string }>();
  const { contracts, companies, modules, session, hasPermission, getActor, refreshData, notify, t } =
    useApp();
  const navigate = useNavigate();

  const existing = mode === 'edit' ? contracts.find((c) => c.id === contratoId) : undefined;

  const [companyId, setCompanyId] = useState(existing?.companyId || companies[0]?.id || 'emp-olivelas-matriz');
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
  const [status, setStatus] = useState<ContractStatus>(
    existing?.status || 'pending_signature',
  );
  const [commercialResponsible, setCommercialResponsible] = useState(
    existing?.commercialResponsible || 'Diego Vasconcelos',
  );
  const [clausesText, setClausesText] = useState(
    existing?.clausesText ||
      'CLÁUSULA 1 — OBJETO: Licenciamento modular SaaS na plataforma Olivelas Allin.\nCLÁUSULA 2 — ISOLAMENTO E AUDITORIA: Dados isolados por empresa e retenção integral sem exclusão física.',
  );
  const [versionSummary, setVersionSummary] = useState('Revisão contratual e ajuste de módulos.');
  const [isDirty, setIsDirty] = useState(false);

  if (!hasPermission('contracts', mode === 'create' ? 'create' : 'edit')) {
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
        currency: comp?.currency || 'BRL',
        status,
        commercialResponsible: commercialResponsible.trim(),
        clausesText,
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
      navigate(`/app/global/contratos/${newId}`);
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
          status,
          commercialResponsible: commercialResponsible.trim(),
          clausesText,
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
      navigate(`/app/global/contratos/${existing.id}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: t('scope.global'), to: '/app/global' },
          { label: t('nav.contracts'), to: '/app/global/contratos' },
          { label: mode === 'create' ? 'Novo Contrato' : `Editar ${existing?.code}` },
        ]}
        title={
          mode === 'create'
            ? 'Emitir Novo Contrato Modular'
            : `Gerar Nova Versão Contratual — ${existing?.code} (Atual: v${existing?.version})`
        }
      />

      <UnsavedChangesBanner isDirty={isDirty} onDiscard={() => navigate('/app/global/contratos')} />

      <form onSubmit={handleSave} onChange={() => setIsDirty(true)}>
        <div className="form-section">
          <div className="form-section-title">1. Partes, Vigência e Condições Comerciais</div>
          <div className="form-grid mt-2">
            <div className="field">
              <label htmlFor="ctr-comp">Empresa Contratante *</label>
              <select
                id="ctr-comp"
                className="select"
                disabled={mode === 'edit'}
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

        <div className="form-section">
          <div className="form-section-title">2. Módulos Incluídos no Contrato</div>
          <div className="form-grid mt-2">
            {modules.map((m) => {
              const checked = selectedModuleIds.includes(m.id);
              return (
                <label
                  key={m.id}
                  style={{
                    border: checked
                      ? '1px solid var(--accent-primary)'
                      : '1px solid var(--border-subtle)',
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: m.isCore ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
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

        <div className="form-section">
          <div className="form-section-title">3. Cláusulas Contratuais e Resumo da Versão</div>
          {mode === 'edit' && (
            <div className="field mb-4">
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
          <div className="field">
            <label htmlFor="ctr-clauses">Texto Integral das Cláusulas *</label>
            <textarea
              id="ctr-clauses"
              className="textarea mono"
              style={{ minHeight: 130 }}
              required
              value={clausesText}
              onChange={(e) => setClausesText(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link to="/app/global/contratos" className="btn btn-secondary">
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
    const hash = `SHA256-SIM-${Math.random().toString(16).substring(2, 14)}${Date.now().toString(16)}`;
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
            ipAddressSimulated: '177.92.40.18 (Simulado Local)',
            acceptanceHash: hash,
            isSimulated: true,
          },
        ],
      }),
      actor,
      `Assinatura eletrônica demonstrativa registrada no contrato ${contract.code} por ${signerName.trim()} (Hash: ${hash}).`,
      'sign_contract',
    );
    await refreshData();
    setSignModalOpen(false);
    notify({
      type: 'success',
      title: 'Assinatura Demonstrativa Registrada',
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
          <>
            {(hasPermission('contracts', 'approve', targetCompanyId) ||
              hasPermission('contracts', 'edit', targetCompanyId)) && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setSignModalOpen(true)}
              >
                <FileSignature size={14} />
                Assinar Eletronicamente (Simulado)
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
          </>
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
              Assinaturas Demonstrativas & Histórico de Versões
            </h2>
            <span className="badge badge-warning">Validade Simulada (Mock V1)</span>
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
                Este contrato aguarda assinatura eletrônica demonstrativa do representante autorizado.
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
                    <span className="badge badge-warning">Assinatura Simulada</span>
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
        title={`Assinatura Eletrônica Demonstrativa — ${contract.code}`}
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
              Registrar Assinatura Demonstrativa
            </button>
          </>
        }
      >
        <form
          id="contract-sign-form"
          onSubmit={handleSimulatedSignature}
          className="flex flex-col gap-3"
        >
          <div className="badge badge-warning">
            Aviso Legal: Assinatura eletrônica simulada localmente para fins de demonstração da Fundação V1.
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
              deste aceite demonstrativo na trilha de auditoria.
            </span>
          </label>
        </form>
      </ModalDialog>
    </div>
  );
};
