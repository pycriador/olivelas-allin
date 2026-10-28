import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  Edit3,
  KeyRound,
  Play,
  Plus,
  Save,
  ShieldAlert,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  ApiCollectionEntity,
  ApiEnvironmentEntity,
  ApiExecutionHistoryEntity,
  ApiServiceEntity,
  ApiTokenEntity,
  HttpMethod,
  PermissionScope,
} from '../../types/domain';
import { generateId, repositories } from '../../repositories/repositories';
import { formatDateTime } from '../../i18n/translations';
import { executeSimulatedHttpCall, interpolateVariables } from '../../services/operationalUtils';
import {
  AccessDeniedView,
  ArchiveRecordDialog,
  ModalDialog,
  PageHeader,
  StatusBadge,
  UnsavedChangesBanner,
  UrlDataTable,
} from '../../components/shared/SharedComponents';

export type ApiHubTab = 'servicos' | 'colecoes' | 'ambientes' | 'tokens' | 'historico';

export const ApiHubCatalogPage: React.FC<{ activeTab: ApiHubTab }> = ({ activeTab }) => {
  const {
    apiServices,
    apiCollections,
    apiEnvironments,
    apiTokens,
    apiHistory,
    companies,
    currentUser,
    session,
    hasPermission,
    getActor,
    refreshData,
    notify,
    t,
  } = useApp();

  const [archiveServiceTarget, setArchiveServiceTarget] = useState<ApiServiceEntity | null>(null);
  const [revokeTokenTarget, setRevokeTokenTarget] = useState<ApiTokenEntity | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  const [newCollectionOpen, setNewCollectionOpen] = useState(false);
  const [colName, setColName] = useState('');
  const [colCategory, setColCategory] = useState('Core Platform');
  const [colDesc, setColDesc] = useState('');

  const [newEnvOpen, setNewEnvOpen] = useState(false);
  const [envName, setEnvName] = useState('');
  const [envSlug, setEnvSlug] = useState('homolog-sim');
  const [envBaseUrl, setEnvBaseUrl] = useState('https://sandbox.api.olivelas-allin.local/v1');
  const [envTenantId, setEnvTenantId] = useState('emp-olivelas-matriz');

  const [newTokenOpen, setNewTokenOpen] = useState(false);
  const [tokName, setTokName] = useState('');
  const [tokScope, setTokScope] = useState<PermissionScope>('company');
  const [tokCompanyId, setTokCompanyId] = useState('emp-olivelas-matriz');
  const [tokExpiresAt, setTokExpiresAt] = useState('2027-12-31');

  if (!hasPermission('api_hub', 'view')) {
    return (
      <AccessDeniedView
        reason="Seu papel atual não possui permissão para acessar o console técnico Allin API Hub."
        requiredPermission="api_hub:view"
      />
    );
  }

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const col: ApiCollectionEntity = {
      id: generateId('col'),
      name: colName.trim(),
      category: colCategory.trim(),
      description: colDesc.trim(),
      createdAt: now,
      updatedAt: now,
      archiveMetadata: { isArchived: false },
      changeHistory: [],
    };
    await repositories.apiCollections.create(
      col,
      getActor(),
      `Criação de coleção HTTP "${col.name}" no API Hub.`,
    );
    await refreshData();
    setNewCollectionOpen(false);
    setColName('');
    setColDesc('');
    notify({ type: 'success', title: `Coleção ${col.name} criada.` });
  };

  const handleCreateEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const env: ApiEnvironmentEntity = {
      id: generateId('env'),
      name: envName.trim(),
      slug: envSlug.trim(),
      baseUrl: envBaseUrl.trim(),
      variables: {
        TENANT_ID: envTenantId,
        API_VERSION: '2026-10',
        TIMEOUT_MS: '3000',
      },
      isDefault: false,
      createdAt: now,
      updatedAt: now,
      archiveMetadata: { isArchived: false },
      changeHistory: [],
    };
    await repositories.apiEnvironments.create(
      env,
      getActor(),
      `Criação de ambiente simulado "${env.name}" (${env.baseUrl}).`,
    );
    await refreshData();
    setNewEnvOpen(false);
    setEnvName('');
    notify({ type: 'success', title: `Ambiente ${env.name} registrado.` });
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const suffix = Math.random().toString(16).slice(2, 6);
    const comp = companies.find((c) => c.id === tokCompanyId);
    const tok: ApiTokenEntity = {
      id: generateId('tok'),
      name: tokName.trim(),
      maskedPreview: `allin_${tokScope === 'global' ? 'live' : 'ten'}_sim_****_${suffix}`,
      scope: tokScope,
      companyId: tokScope === 'company' ? tokCompanyId : undefined,
      companyName: tokScope === 'company' ? comp?.legalName : undefined,
      permissions: ['api_hub:view', 'modules:view', 'orders:view'],
      expiresAt: `${tokExpiresAt}T23:59:59.000Z`,
      status: 'active',
      createdByUserId: currentUser?.id || 'usr-super-admin',
      createdByUserName: currentUser?.name || 'Super Admin',
      createdAt: now,
      updatedAt: now,
      archiveMetadata: { isArchived: false },
      changeHistory: [],
    };
    await repositories.apiTokens.create(
      tok,
      getActor(tok.companyId),
      `Emissão de token de API demonstrativo mascarado (${tok.maskedPreview}).`,
    );
    await refreshData();
    setNewTokenOpen(false);
    setTokName('');
    notify({
      type: 'success',
      title: `Token emitido com visualização mascarada: ${tok.maskedPreview}`,
    });
  };

  const handleConfirmRevokeToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeTokenTarget) return;
    const now = new Date().toISOString();
    await repositories.apiTokens.update(
      revokeTokenTarget.id,
      (curr) => ({
        ...curr,
        status: 'revoked',
        revokedAt: now,
        revokedReason: revokeReason.trim() || 'Revogação administrativa via API Hub.',
      }),
      getActor(revokeTokenTarget.companyId),
      `Revogação de token de API ${revokeTokenTarget.name} (${revokeTokenTarget.maskedPreview}). Motivo: ${revokeReason}`,
      'revoke_token',
    );
    await refreshData();
    setRevokeTokenTarget(null);
    setRevokeReason('');
    notify({ type: 'warning', title: 'Token revogado e auditado com sucesso.' });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: t('scope.global'), to: '/app/global' },
          { label: t('nav.apiHub'), to: '/app/global/api-hub/servicos' },
          { label: activeTab.toUpperCase() },
        ]}
        title="Allin API Hub — Governança de Serviços HTTP, Ambientes & Tokens"
        subtitle="Console estilo Postman para catalogação de endpoints, interpolação de variáveis, proteção Anti-SSRF e execução simulada."
        scopeBadge="SANDBOX SEGURO"
        actions={
          <div className="flex items-center gap-2">
            {activeTab === 'servicos' && hasPermission('api_hub', 'create') && (
              <Link to="/app/global/api-hub/servicos/novo" className="btn btn-primary btn-sm">
                <Plus size={14} />
                Novo Serviço HTTP
              </Link>
            )}
            {activeTab === 'colecoes' && hasPermission('api_hub', 'create') && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setNewCollectionOpen(true)}
              >
                <Plus size={14} />
                Nova Coleção
              </button>
            )}
            {activeTab === 'ambientes' && hasPermission('api_hub', 'create') && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setNewEnvOpen(true)}
              >
                <Plus size={14} />
                Novo Ambiente
              </button>
            )}
            {activeTab === 'tokens' && hasPermission('api_hub', 'create') && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setNewTokenOpen(true)}
              >
                <KeyRound size={14} />
                Gerar Token Mascarado
              </button>
            )}
          </div>
        }
      />

      <nav className="subnav-tabs" aria-label="Navegação do API Hub">
        <NavLink
          to="/app/global/api-hub/servicos"
          className={({ isActive }) => `subnav-tab ${isActive ? 'active' : ''}`}
        >
          Serviços HTTP ({apiServices.length})
        </NavLink>
        <NavLink
          to="/app/global/api-hub/colecoes"
          className={({ isActive }) => `subnav-tab ${isActive ? 'active' : ''}`}
        >
          Coleções ({apiCollections.length})
        </NavLink>
        <NavLink
          to="/app/global/api-hub/ambientes"
          className={({ isActive }) => `subnav-tab ${isActive ? 'active' : ''}`}
        >
          Ambientes & Variáveis ({apiEnvironments.length})
        </NavLink>
        <NavLink
          to="/app/global/api-hub/tokens"
          className={({ isActive }) => `subnav-tab ${isActive ? 'active' : ''}`}
        >
          Tokens de Acesso ({apiTokens.length})
        </NavLink>
        <NavLink
          to="/app/global/api-hub/historico"
          className={({ isActive }) => `subnav-tab ${isActive ? 'active' : ''}`}
        >
          Histórico de Execuções ({apiHistory.length})
        </NavLink>
      </nav>

      {activeTab === 'servicos' && (
        <UrlDataTable<ApiServiceEntity>
          tableId="api-services-table"
          caption="Catálogo de serviços HTTP e endpoints documentados no Allin API Hub"
          items={apiServices}
          defaultSortField="createdAt"
          csvFilename="api-hub-servicos.csv"
          searchPlaceholder="Buscar por nome do serviço, método HTTP, rota ou coleção..."
          statusExtractor={(s) => s.method}
          searchExtractor={(s) => `${s.name} ${s.method} ${s.path} ${s.description}`}
          statusOptions={[
            { value: 'GET', label: 'GET' },
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' },
            { value: 'PATCH', label: 'PATCH' },
            { value: 'DELETE', label: 'DELETE' },
          ]}
          isArchivedExtractor={(s) => s.archiveMetadata.isArchived}
          onArchiveClick={(s) => setArchiveServiceTarget(s)}
          onRestoreClick={async (s) => {
            await repositories.apiServices.restore(s.id, getActor());
            await refreshData();
            notify({ type: 'success', title: `Serviço ${s.name} restaurado.` });
          }}
          columns={[
            {
              key: 'method',
              header: 'Método / Endpoint',
              sortable: true,
              render: (s) => (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`method-badge method-${s.method}`}>{s.method}</span>
                    <Link to={`/app/global/api-hub/servicos/${s.id}`} className="font-semibold">
                      {s.name}
                    </Link>
                  </div>
                  <code className="text-xs text-muted">
                    {s.baseUrl}
                    {s.path}
                  </code>
                </div>
              ),
            },
            {
              key: 'collectionId',
              header: 'Coleção / Autenticação',
              render: (s) => {
                const col = apiCollections.find((c) => c.id === s.collectionId);
                return (
                  <div>
                    <div className="text-sm">{col?.name || s.collectionId}</div>
                    <span className="badge badge-neutral text-xs">{s.authType}</span>
                  </div>
                );
              },
            },
            {
              key: 'timeoutMs',
              header: 'Respostas Simuladas',
              render: (s) => (
                <div className="flex gap-1 flex-wrap">
                  {s.expectedResponses.map((r) => (
                    <span
                      key={r.statusCode}
                      className={`badge ${r.statusCode < 300 ? 'badge-success' : 'badge-warning'} mono`}
                    >
                      {r.statusCode}
                    </span>
                  ))}
                </div>
              ),
            },
            {
              key: 'actions',
              header: 'Console & Edição',
              render: (s) => (
                <div className="flex items-center gap-1">
                  <Link
                    to={`/app/global/api-hub/servicos/${s.id}`}
                    className="btn btn-primary btn-sm"
                  >
                    <Play size={13} />
                    Inspecionar / Testar
                  </Link>
                  {hasPermission('api_hub', 'edit') && (
                    <Link
                      to={`/app/global/api-hub/servicos/${s.id}/editar`}
                      className="btn btn-ghost btn-sm"
                    >
                      <Edit3 size={13} />
                      Editar
                    </Link>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}

      {activeTab === 'colecoes' && (
        <UrlDataTable<ApiCollectionEntity>
          tableId="api-collections-table"
          caption="Coleções de serviços HTTP organizadas por domínio"
          items={apiCollections}
          defaultSortField="createdAt"
          csvFilename="api-hub-colecoes.csv"
          searchPlaceholder="Buscar por nome da coleção ou categoria..."
          searchExtractor={(c) => `${c.name} ${c.category} ${c.description}`}
          isArchivedExtractor={(c) => c.archiveMetadata.isArchived}
          columns={[
            {
              key: 'name',
              header: 'Coleção',
              sortable: true,
              render: (c) => (
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-muted">{c.description}</div>
                </div>
              ),
            },
            {
              key: 'category',
              header: 'Domínio Técnico',
              render: (c) => <span className="badge badge-teal">{c.category}</span>,
            },
            {
              key: 'servicesCount',
              header: 'Endpoints Vinculados',
              render: (c) => {
                const count = apiServices.filter((s) => s.collectionId === c.id).length;
                return <span className="mono font-semibold">{count} serviço(s)</span>;
              },
            },
          ]}
        />
      )}

      {activeTab === 'ambientes' && (
        <div className="grid-2">
          {apiEnvironments.map((env) => (
            <div key={env.id} className="card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">{env.name}</h2>
                  <code className="text-xs text-muted">{env.baseUrl}</code>
                </div>
                {env.isDefault && <span className="badge badge-teal">Padrão</span>}
              </div>
              <div className="card-body">
                <div className="text-xs font-semibold uppercase text-muted mb-2">
                  Variáveis de Interpolação ({"{{VAR}}"})
                </div>
                <div className="flex flex-col gap-1">
                  {Object.entries(env.variables).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between items-center text-xs mono"
                      style={{
                        padding: '0.35rem 0.5rem',
                        background: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <strong>{`{{${k}}}`}</strong>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'tokens' && (
        <UrlDataTable<ApiTokenEntity>
          tableId="api-tokens-table"
          caption="Tokens de acesso com armazenamento mascarado e revogação auditada"
          items={apiTokens}
          defaultSortField="createdAt"
          csvFilename="api-hub-tokens.csv"
          searchPlaceholder="Buscar por nome do token, prefixo mascarado ou empresa..."
          statusExtractor={(tok) => tok.status}
          searchExtractor={(tok) => `${tok.name} ${tok.maskedPreview} ${tok.companyName || ''}`}
          statusOptions={[
            { value: 'active', label: t('status.active') },
            { value: 'revoked', label: t('status.revoked') },
            { value: 'expired', label: t('status.expired') },
          ]}
          isArchivedExtractor={(tok) => tok.archiveMetadata.isArchived}
          columns={[
            {
              key: 'name',
              header: 'Identificação / Token Mascarado',
              sortable: true,
              render: (tok) => (
                <div>
                  <div className="font-semibold">{tok.name}</div>
                  <code className="text-xs">{tok.maskedPreview}</code>
                </div>
              ),
            },
            {
              key: 'scope',
              header: 'Escopo / Empresa',
              render: (tok) => (
                <div>
                  <span className="badge badge-neutral uppercase">{tok.scope}</span>
                  <div className="text-xs text-muted mt-1">
                    {tok.companyName || 'Plataforma Global'}
                  </div>
                </div>
              ),
            },
            {
              key: 'expiresAt',
              header: 'Expira em / Último Uso',
              sortable: true,
              render: (tok) => (
                <div className="text-xs">
                  <div>Expira: {formatDateTime(tok.expiresAt, session.language)}</div>
                  <div className="text-muted">
                    Uso: {tok.lastUsedAt ? formatDateTime(tok.lastUsedAt, session.language) : 'Nunca utilizado'}
                  </div>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Estado',
              render: (tok) => <StatusBadge status={tok.status} />,
            },
            {
              key: 'actions',
              header: 'Segurança',
              render: (tok) =>
                tok.status === 'active' && hasPermission('api_hub', 'edit') ? (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => setRevokeTokenTarget(tok)}
                  >
                    Revogar Token
                  </button>
                ) : (
                  <span className="text-xs text-muted">{tok.revokedReason || 'Inativo'}</span>
                ),
            },
          ]}
        />
      )}

      {activeTab === 'historico' && (
        <UrlDataTable<ApiExecutionHistoryEntity>
          tableId="api-history-table"
          caption="Log cronológico de chamadas executadas no simulador local do API Hub"
          items={apiHistory}
          defaultSortField="executedAt"
          csvFilename="api-hub-historico.csv"
          searchPlaceholder="Buscar por serviço, URL resolvida ou executor..."
          statusExtractor={(h) => String(h.responseStatus)}
          searchExtractor={(h) => `${h.serviceName} ${h.resolvedUrl} ${h.executedByUserName}`}
          statusOptions={[
            { value: '200', label: '200 OK' },
            { value: '201', label: '201 Created' },
            { value: '401', label: '401 Unauthorized' },
            { value: '403', label: '403 Forbidden' },
            { value: '422', label: '422 Unprocessable' },
          ]}
          columns={[
            {
              key: 'executedAt',
              header: 'Data/Hora',
              sortable: true,
              render: (h) => <span className="mono text-xs">{formatDateTime(h.executedAt, session.language)}</span>,
            },
            {
              key: 'serviceName',
              header: 'Serviço / URL Resolvida',
              render: (h) => (
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`method-badge method-${h.method}`}>{h.method}</span>
                    <Link
                      to={`/app/global/api-hub/servicos/${h.serviceId}`}
                      className="font-semibold text-sm"
                    >
                      {h.serviceName}
                    </Link>
                  </div>
                  <code className="text-xs text-muted">{h.resolvedUrl}</code>
                </div>
              ),
            },
            {
              key: 'responseStatus',
              header: 'Status / Latência',
              sortable: true,
              render: (h) => (
                <div className="flex items-center gap-2">
                  <span
                    className={`badge ${
                      h.responseStatus >= 200 && h.responseStatus < 300
                        ? 'badge-success'
                        : 'badge-danger'
                    } mono`}
                  >
                    HTTP {h.responseStatus}
                  </span>
                  <span className="mono text-xs text-muted">{h.responseLatencyMs} ms</span>
                </div>
              ),
            },
            {
              key: 'executedByUserName',
              header: 'Operador / Ambiente',
              render: (h) => (
                <div className="text-xs">
                  <div className="font-medium">{h.executedByUserName}</div>
                  <div className="text-muted">{h.environmentName}</div>
                </div>
              ),
            },
          ]}
        />
      )}

      {/* Modals for Collection, Environment, Token Creation & Revocation */}
      <ModalDialog
        open={newCollectionOpen}
        onClose={() => setNewCollectionOpen(false)}
        title="Nova Coleção de Serviços HTTP"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setNewCollectionOpen(false)}>
              {t('common.cancel')}
            </button>
            <button type="submit" form="col-form" className="btn btn-primary">
              Criar Coleção
            </button>
          </>
        }
      >
        <form id="col-form" onSubmit={handleCreateCollection} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label" htmlFor="col-name">
              Nome da Coleção *
            </label>
            <input
              id="col-name"
              className="form-input"
              required
              value={colName}
              onChange={(e) => setColName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="col-cat">
              Categoria Técnica *
            </label>
            <input
              id="col-cat"
              className="form-input"
              required
              value={colCategory}
              onChange={(e) => setColCategory(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="col-desc">
              Descrição
            </label>
            <textarea
              id="col-desc"
              className="form-textarea"
              value={colDesc}
              onChange={(e) => setColDesc(e.target.value)}
            />
          </div>
        </form>
      </ModalDialog>

      <ModalDialog
        open={newEnvOpen}
        onClose={() => setNewEnvOpen(false)}
        title="Novo Ambiente de Execução Simulada"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setNewEnvOpen(false)}>
              {t('common.cancel')}
            </button>
            <button type="submit" form="env-form" className="btn btn-primary">
              Salvar Ambiente
            </button>
          </>
        }
      >
        <form id="env-form" onSubmit={handleCreateEnvironment} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label" htmlFor="env-name">
              Nome do Ambiente *
            </label>
            <input
              id="env-name"
              className="form-input"
              required
              value={envName}
              onChange={(e) => setEnvName(e.target.value)}
              placeholder="Ex.: Sandbox Multi-Região"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="env-url">
              Base URL ({'{{BASE_URL}}'}) *
            </label>
            <input
              id="env-url"
              className="form-input mono"
              required
              value={envBaseUrl}
              onChange={(e) => setEnvBaseUrl(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="env-tenant">
              Variável Padrão {"{{TENANT_ID}}"}
            </label>
            <select
              id="env-tenant"
              className="form-select"
              value={envTenantId}
              onChange={(e) => setEnvTenantId(e.target.value)}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.tradeName} ({c.id})
                </option>
              ))}
            </select>
          </div>
        </form>
      </ModalDialog>

      <ModalDialog
        open={newTokenOpen}
        onClose={() => setNewTokenOpen(false)}
        title="Emitir Novo Token de API Demonstrativo"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setNewTokenOpen(false)}>
              {t('common.cancel')}
            </button>
            <button type="submit" form="tok-form" className="btn btn-primary">
              Emitir Credencial Mascarada
            </button>
          </>
        }
      >
        <form id="tok-form" onSubmit={handleCreateToken} className="flex flex-col gap-4">
          <div className="banner banner-simulated">
            <ShieldCheck size={16} />
            <div>
              Segurança por design: o token nunca é armazenado em texto aberto; apenas seu prefixo
              mascarado é persistido no IndexedDB.
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="tok-name">
              Finalidade / Identificação do Token *
            </label>
            <input
              id="tok-name"
              className="form-input"
              required
              value={tokName}
              onChange={(e) => setTokName(e.target.value)}
              placeholder="Ex.: Integração ERP Contábil"
            />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="tok-scope">
                Escopo
              </label>
              <select
                id="tok-scope"
                className="form-select"
                value={tokScope}
                onChange={(e) => setTokScope(e.target.value as PermissionScope)}
              >
                <option value="company">Empresa Específica (Tenant)</option>
                <option value="global">Plataforma Global</option>
              </select>
            </div>
            {tokScope === 'company' && (
              <div className="form-group">
                <label className="form-label" htmlFor="tok-comp">
                  Empresa Associada
                </label>
                <select
                  id="tok-comp"
                  className="form-select"
                  value={tokCompanyId}
                  onChange={(e) => setTokCompanyId(e.target.value)}
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.tradeName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="tok-exp">
                Data de Expiração *
              </label>
              <input
                id="tok-exp"
                type="date"
                className="form-input"
                required
                value={tokExpiresAt}
                onChange={(e) => setTokExpiresAt(e.target.value)}
              />
            </div>
          </div>
        </form>
      </ModalDialog>

      <ModalDialog
        open={Boolean(revokeTokenTarget)}
        onClose={() => setRevokeTokenTarget(null)}
        title={`Revogar Token ${revokeTokenTarget?.maskedPreview || ''}`}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setRevokeTokenTarget(null)}
            >
              {t('common.cancel')}
            </button>
            <button type="submit" form="revoke-tok-form" className="btn btn-danger">
              Confirmar Revogação Imediata
            </button>
          </>
        }
      >
        <form id="revoke-tok-form" onSubmit={handleConfirmRevokeToken} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label" htmlFor="rev-reason">
              Motivo da Revogação (Obrigatório para Auditoria) *
            </label>
            <textarea
              id="rev-reason"
              className="form-textarea"
              required
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="Ex.: Rotação periódica de credenciais ou desligamento de conector."
            />
          </div>
        </form>
      </ModalDialog>

      <ArchiveRecordDialog
        open={Boolean(archiveServiceTarget)}
        onClose={() => setArchiveServiceTarget(null)}
        recordTitle={archiveServiceTarget?.name || ''}
        onConfirmArchive={async (reason) => {
          if (!archiveServiceTarget) return;
          await repositories.apiServices.archive(archiveServiceTarget.id, reason, getActor());
          await refreshData();
          notify({ type: 'warning', title: `Serviço HTTP ${archiveServiceTarget.name} arquivado.` });
        }}
      />
    </div>
  );
};

export const ApiServiceFormPage: React.FC<{ mode: 'create' | 'edit' }> = ({ mode }) => {
  const { servicoId } = useParams<{ servicoId: string }>();
  const { apiServices, apiCollections, hasPermission, getActor, refreshData, notify, t } = useApp();
  const navigate = useNavigate();

  const existing = mode === 'edit' ? apiServices.find((s) => s.id === servicoId) : undefined;

  const [name, setName] = useState(existing?.name || '');
  const [collectionId, setCollectionId] = useState(
    existing?.collectionId || apiCollections[0]?.id || 'col-erp-core',
  );
  const [method, setMethod] = useState<HttpMethod>(existing?.method || 'GET');
  const [baseUrl, setBaseUrl] = useState(existing?.baseUrl || '{{BASE_URL}}');
  const [path, setPath] = useState(existing?.path || '/tenants/{{TENANT_ID}}/status');
  const [description, setDescription] = useState(existing?.description || '');
  const [authType, setAuthType] = useState<'none' | 'bearer_token' | 'api_key'>(
    existing?.authType || 'bearer_token',
  );
  const [bodyTemplate, setBodyTemplate] = useState(existing?.bodyTemplate || '');
  const [isDirty, setIsDirty] = useState(false);

  if (!hasPermission('api_hub', mode === 'create' ? 'create' : 'edit')) {
    return (
      <AccessDeniedView
        reason="Sem permissão para cadastrar ou editar serviços HTTP no API Hub."
        requiredPermission={`api_hub:${mode}`}
      />
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    if (mode === 'create') {
      const newSrv: ApiServiceEntity = {
        id: generateId('srv'),
        collectionId,
        name: name.trim(),
        description: description.trim(),
        method,
        baseUrl: baseUrl.trim(),
        path: path.trim(),
        defaultHeaders: [{ key: 'Accept', value: 'application/json', enabled: true }],
        queryParams: [],
        authType,
        bodyType: method === 'GET' ? 'none' : 'json',
        bodyTemplate,
        timeoutMs: 2500,
        expectedResponses: [
          {
            statusCode: 200,
            label: '200 OK — Resposta Simulada Padrão',
            latencyMs: 64,
            headers: { 'content-type': 'application/json' },
            bodyJson: JSON.stringify(
              { status: 'OK_SIMULATED', endpoint: path.trim(), timestamp: now },
              null,
              2,
            ),
          },
        ],
        createdAt: now,
        updatedAt: now,
        archiveMetadata: { isArchived: false },
        changeHistory: [],
      };
      await repositories.apiServices.create(
        newSrv,
        getActor(),
        `Cadastro de novo serviço HTTP ${newSrv.method} ${newSrv.name}.`,
      );
      await refreshData();
      notify({ type: 'success', title: `Serviço HTTP ${newSrv.name} cadastrado.` });
      navigate(`/app/global/api-hub/servicos/${newSrv.id}`);
    } else if (existing) {
      await repositories.apiServices.update(
        existing.id,
        (curr) => ({
          ...curr,
          name: name.trim(),
          collectionId,
          method,
          baseUrl: baseUrl.trim(),
          path: path.trim(),
          description: description.trim(),
          authType,
          bodyTemplate,
        }),
        getActor(),
        `Atualização de especificação do serviço HTTP ${name.trim()}.`,
      );
      await refreshData();
      notify({ type: 'success', title: `Serviço ${name} atualizado.` });
      navigate(`/app/global/api-hub/servicos/${existing.id}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: t('scope.global'), to: '/app/global' },
          { label: t('nav.apiHub'), to: '/app/global/api-hub/servicos' },
          { label: mode === 'create' ? 'Novo Serviço HTTP' : existing?.name || 'Editar' },
        ]}
        title={mode === 'create' ? 'Cadastrar Novo Serviço HTTP' : `Editar Serviço: ${existing?.name}`}
        subtitle="Defina método, template de URL com variáveis de ambiente, política de autenticação e payload."
      />

      <UnsavedChangesBanner isDirty={isDirty} onDiscard={() => setIsDirty(false)} />

      <form onSubmit={handleSave} onChange={() => setIsDirty(true)} className="card">
        <div className="card-body flex flex-col gap-4">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="srv-name">
                Nome do Serviço *
              </label>
              <input
                id="srv-name"
                className="form-input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="srv-col">
                Coleção
              </label>
              <select
                id="srv-col"
                className="form-select"
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
              >
                {apiCollections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="srv-method">
                Método HTTP
              </label>
              <select
                id="srv-method"
                className="form-select mono"
                value={method}
                onChange={(e) => setMethod(e.target.value as HttpMethod)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="srv-auth">
                Autenticação Exigida
              </label>
              <select
                id="srv-auth"
                className="form-select"
                value={authType}
                onChange={(e) => setAuthType(e.target.value as 'none' | 'bearer_token' | 'api_key')}
              >
                <option value="bearer_token">Bearer Token (OAuth2 / JWT Simulado)</option>
                <option value="api_key">X-API-Key Header</option>
                <option value="none">Público / Sem Autenticação</option>
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="srv-base">
                Base URL *
              </label>
              <input
                id="srv-base"
                className="form-input mono"
                required
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="srv-path">
                Caminho do Endpoint (Path) *
              </label>
              <input
                id="srv-path"
                className="form-input mono"
                required
                value={path}
                onChange={(e) => setPath(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="srv-desc">
              Descrição Técnica *
            </label>
            <input
              id="srv-desc"
              className="form-input"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="srv-body">
              Corpo da Requisição Padrão (JSON Template)
            </label>
            <textarea
              id="srv-body"
              className="form-textarea mono"
              value={bodyTemplate}
              onChange={(e) => setBodyTemplate(e.target.value)}
              rows={5}
            />
          </div>
        </div>
        <div className="card-footer flex justify-between">
          <Link to="/app/global/api-hub/servicos" className="btn btn-secondary">
            {t('common.cancel')}
          </Link>
          <button type="submit" className="btn btn-primary">
            <Save size={14} />
            Salvar Serviço HTTP
          </button>
        </div>
      </form>
    </div>
  );
};

export const ApiServiceInspectorAndRunnerPage: React.FC = () => {
  const { servicoId } = useParams<{ servicoId: string }>();
  const {
    apiServices,
    apiEnvironments,
    apiTokens,
    currentUser,
    hasPermission,
    getActor,
    refreshData,
    notify,
    t,
  } = useApp();

  const service = apiServices.find((s) => s.id === servicoId);
  const [selectedEnvId, setSelectedEnvId] = useState(
    apiEnvironments.find((e) => e.isDefault)?.id || apiEnvironments[0]?.id || '',
  );
  const [selectedTokenId, setSelectedTokenId] = useState(
    apiTokens.find((tok) => tok.status === 'active')?.id || '',
  );
  const [selectedStatusCode, setSelectedStatusCode] = useState<number>(
    service?.expectedResponses[0]?.statusCode || 200,
  );
  const [customUrlOverride, setCustomUrlOverride] = useState('');
  const [customBody, setCustomBody] = useState(service?.bodyTemplate || '');
  const [lastExecution, setLastExecution] = useState<ApiExecutionHistoryEntity | null>(null);
  const [securityBlockError, setSecurityBlockError] = useState<string | null>(null);

  if (!hasPermission('api_hub', 'view')) {
    return (
      <AccessDeniedView
        reason="Sem permissão para inspecionar ou testar endpoints no API Hub."
        requiredPermission="api_hub:view"
      />
    );
  }

  if (!service) {
    return (
      <AccessDeniedView
        reason="Serviço HTTP não encontrado no catálogo do API Hub."
        requiredPermission="api_hub:view"
      />
    );
  }

  const selectedEnv = apiEnvironments.find((e) => e.id === selectedEnvId);
  const selectedToken = apiTokens.find((tok) => tok.id === selectedTokenId);

  const previewUrl =
    customUrlOverride.trim() ||
    `${interpolateVariables(service.baseUrl, selectedEnv).replace(/\/$/, '')}/${interpolateVariables(
      service.path,
      selectedEnv,
    ).replace(/^\//, '')}`;

  const handleRunSimulation = async () => {
    setSecurityBlockError(null);
    const serviceToRun: ApiServiceEntity = customUrlOverride.trim()
      ? { ...service, baseUrl: customUrlOverride.trim(), path: '' }
      : service;

    const result = executeSimulatedHttpCall({
      service: serviceToRun,
      environment: selectedEnv,
      token: selectedToken,
      selectedStatusCode,
      customBody,
      actorUserId: currentUser?.id || 'usr-super-admin',
      actorUserName: currentUser?.name || 'Super Admin',
    });

    if (!result.ok) {
      setSecurityBlockError(result.error || 'Execução bloqueada pela política Anti-SSRF.');
      notify({
        type: 'error',
        title: 'Bloqueio de Segurança (Anti-SSRF)',
        description: result.error,
      });
      return;
    }

    if (result.historyEntry) {
      await repositories.apiHistory.create(result.historyEntry, getActor());
      await refreshData();
      setLastExecution(result.historyEntry);
      notify({
        type: result.historyEntry.responseStatus < 300 ? 'success' : 'warning',
        title: `Simulação concluída: HTTP ${result.historyEntry.responseStatus} (${result.historyEntry.responseLatencyMs} ms)`,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: t('scope.global'), to: '/app/global' },
          { label: t('nav.apiHub'), to: '/app/global/api-hub/servicos' },
          { label: service.name },
        ]}
        title={service.name}
        subtitle={service.description}
        scopeBadge={`HTTP ${service.method}`}
        actions={
          <div className="flex items-center gap-2">
            {hasPermission('api_hub', 'edit') && (
              <Link
                to={`/app/global/api-hub/servicos/${service.id}/editar`}
                className="btn btn-secondary btn-sm"
              >
                <Edit3 size={14} />
                Editar Especificação
              </Link>
            )}
            <button type="button" className="btn btn-primary btn-sm" onClick={handleRunSimulation}>
              <Play size={14} />
              Executar Chamada Simulada
            </button>
          </div>
        }
      />

      <div className="banner banner-simulated">
        <Terminal size={16} />
        <div>
          <strong>Simulador Local Seguro (Anti-SSRF Ativo):</strong> Nenhuma requisição arbitrária
          para loopback (`localhost`, `127.0.0.1`) ou redes privadas é permitida. As respostas são
          processadas localmente e gravadas no histórico de auditoria.
        </div>
      </div>

      {securityBlockError && (
        <div className="banner banner-danger" role="alert">
          <ShieldAlert size={18} />
          <div>
            <strong>Execução Bloqueada por Política de Segurança:</strong> {securityBlockError}
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Configuração da Requisição (Request Builder)</h2>
            <span className={`method-badge method-${service.method}`}>{service.method}</span>
          </div>
          <div className="card-body flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label" htmlFor="run-url-preview">
                URL Resolvida com Variáveis do Ambiente (ou teste Anti-SSRF)
              </label>
              <span id="run-url-hint" className="form-hint">
                Deixe em branco para usar o template do serviço ({previewUrl}) ou informe uma URL para validar o filtro Anti-SSRF.
              </span>
              <input
                id="run-url-preview"
                aria-describedby="run-url-hint"
                className="form-input mono"
                value={customUrlOverride}
                onChange={(e) => setCustomUrlOverride(e.target.value)}
                placeholder={previewUrl}
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="run-env">
                  Ambiente de Variáveis
                </label>
                <select
                  id="run-env"
                  className="form-select"
                  value={selectedEnvId}
                  onChange={(e) => setSelectedEnvId(e.target.value)}
                >
                  {apiEnvironments.map((env) => (
                    <option key={env.id} value={env.id}>
                      {env.name} ({env.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="run-token">
                  Credencial / Token de API ({service.authType})
                </label>
                <select
                  id="run-token"
                  className="form-select"
                  value={selectedTokenId}
                  onChange={(e) => setSelectedTokenId(e.target.value)}
                >
                  <option value="">-- Sem Token (Testar 401) --</option>
                  {apiTokens.map((tok) => (
                    <option key={tok.id} value={tok.id}>
                      {tok.name} ({tok.maskedPreview}) [{tok.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="run-status">
                  Cenário de Resposta Esperado
                </label>
                <select
                  id="run-status"
                  className="form-select mono"
                  value={selectedStatusCode}
                  onChange={(e) => setSelectedStatusCode(Number(e.target.value))}
                >
                  {service.expectedResponses.map((r) => (
                    <option key={r.statusCode} value={r.statusCode}>
                      {r.label} ({r.latencyMs} ms)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {service.method !== 'GET' && (
              <div className="form-group">
                <label className="form-label" htmlFor="run-body">
                  Payload da Requisição (JSON)
                </label>
                <textarea
                  id="run-body"
                  className="form-textarea mono"
                  rows={6}
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Inspeção da Resposta (Response Inspector)</h2>
            {lastExecution && (
              <div className="flex items-center gap-2">
                <span
                  className={`badge ${
                    lastExecution.responseStatus < 300 ? 'badge-success' : 'badge-danger'
                  } mono`}
                >
                  HTTP {lastExecution.responseStatus}
                </span>
                <span className="mono text-xs text-muted">
                  {lastExecution.responseLatencyMs} ms
                </span>
              </div>
            )}
          </div>
          <div className="card-body flex flex-col gap-3">
            {!lastExecution ? (
              <div className="empty-state">
                <div className="empty-state-title">Aguardando Execução Simulada</div>
                <p className="text-xs text-muted">
                  Clique em &ldquo;Executar Chamada Simulada&rdquo; para interpolar variáveis,
                  validar o token e inspecionar os cabeçalhos e o payload JSON de retorno.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <div className="text-xs font-semibold uppercase text-muted mb-1">
                    URL Efetivamente Resolvida
                  </div>
                  <code className="text-xs">{lastExecution.resolvedUrl}</code>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-muted mb-1">
                    Response Headers
                  </div>
                  <pre className="code-block">
                    {JSON.stringify(lastExecution.responseHeaders, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-muted mb-1">
                    Response Body (JSON)
                  </div>
                  <pre className="code-block">{lastExecution.responseBody}</pre>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
