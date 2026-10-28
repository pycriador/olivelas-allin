import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  KeyRound,
  Layers,
  Lock,
  Package,
  ScrollText,
  ShieldCheck,
  Terminal,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../i18n/translations';
import { getUserActiveRoles } from '../../services/hbacService';
import { StatusBadge } from '../../components/shared/SharedComponents';
import { recordAuditEvent } from '../../repositories/repositories';

export const LandingPage: React.FC = () => {
  const { modules, session, t } = useApp();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedSimModules, setSelectedSimModules] = useState<string[]>([
    'mod-core',
    'mod-estoque',
    'mod-financeiro',
    'mod-equipe',
  ]);

  const toggleSimModule = (modId: string) => {
    if (modId === 'mod-core') return; // Core is mandatory base
    setSelectedSimModules((prev) =>
      prev.includes(modId) ? prev.filter((id) => id !== modId) : [...prev, modId],
    );
  };

  const simulatedTotal = modules
    .filter((m) => selectedSimModules.includes(m.id))
    .reduce((acc, m) => acc + (billingCycle === 'monthly' ? m.priceMonthly : m.priceYearly), 0);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 1.5rem' }} className="flex flex-col gap-4">
      {/* Hero Section */}
      <section
        className="card"
        style={{
          padding: '2.5rem',
          border: '1px solid var(--border-strong)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          alignItems: 'center',
        }}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="badge badge-info">{t('landing.hero.eyebrow')}</span>
            <span className="badge badge-teal">HBAC + IndexedDB Local</span>
          </div>
          <h1 style={{ fontSize: '2.1rem', lineHeight: 1.2 }}>{t('landing.hero.title')}</h1>
          <p className="text-muted" style={{ fontSize: '0.95rem', maxWidth: '60ch' }}>
            {t('landing.hero.subtitle')}
          </p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <Link to="/login" className="btn btn-primary">
              {t('landing.hero.ctaPrimary')}
              <ArrowRight size={15} />
            </Link>
            <Link to="/planos" className="btn btn-secondary">
              {t('landing.hero.ctaSecondary')}
            </Link>
          </div>
        </div>

        {/* Architectural Proof Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <strong className="text-sm">Arquitetura de Governança Multiempresa</strong>
            <span className="badge badge-success">Fundação V1 Operacional</span>
          </div>
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            <div className="card" style={{ padding: '0.75rem' }}>
              <div className="kpi-label">Módulos Comerciais</div>
              <div className="kpi-value">10</div>
              <div className="kpi-meta">Contratáveis sob demanda</div>
            </div>
            <div className="card" style={{ padding: '0.75rem' }}>
              <div className="kpi-label">Papéis HBAC</div>
              <div className="kpi-value">6 + Custom</div>
              <div className="kpi-meta">Matriz efetiva rastreável</div>
            </div>
            <div className="card" style={{ padding: '0.75rem' }}>
              <div className="kpi-label">Isolamento Tenant</div>
              <div className="kpi-value">100%</div>
              <div className="kpi-meta">Proteção de rota por empresa</div>
            </div>
            <div className="card" style={{ padding: '0.75rem' }}>
              <div className="kpi-label">Exclusão Física</div>
              <div className="kpi-value">Zero</div>
              <div className="kpi-meta">Arquivamento com histórico</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits for Small Businesses & Governance Pillars */}
      <section className="kpi-grid" style={{ marginTop: '1rem' }}>
        <div className="card card-body flex flex-col gap-2">
          <div className="flex items-center gap-2 font-semibold">
            <Layers size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>Contratação Modular sem Desperdício</span>
          </div>
          <p className="text-sm text-muted">
            Pequenas e médias empresas iniciam com o <strong>Allin Core</strong> e ativam Estoque,
            Financeiro, Vendas, CRM ou API Hub apenas quando a operação exigir.
          </p>
        </div>

        <div className="card card-body flex flex-col gap-2">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck size={18} style={{ color: 'var(--accent-teal)' }} />
            <span>Controle de Acesso Hierárquico (HBAC)</span>
          </div>
          <p className="text-sm text-muted">
            Delegação segura de permissões sem elevação de privilégios. Consulte a matriz efetiva de
            cada colaborador e a origem exata de cada autorização.
          </p>
        </div>

        <div className="card card-body flex flex-col gap-2">
          <div className="flex items-center gap-2 font-semibold">
            <ScrollText size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>Auditoria Imutável & Retenção Contábil</span>
          </div>
          <p className="text-sm text-muted">
            Nenhum registro de negócio sofre exclusão física. Arquivamentos exigem justificativa e
            todas as mutações gravam estado anterior e novo.
          </p>
        </div>

        <div className="card card-body flex flex-col gap-2">
          <div className="flex items-center gap-2 font-semibold">
            <Terminal size={18} style={{ color: 'var(--accent-teal)' }} />
            <span>Allin API Hub Integrado</span>
          </div>
          <p className="text-sm text-muted">
            Console técnico estilo Postman para gerenciamento de coleções HTTP, variáveis por ambiente,
            tokens com escopo e simulador com proteção anti-SSRF.
          </p>
        </div>
      </section>

      {/* Interactive Modular Catalog & Simulator */}
      <section className="card mt-2">
        <div className="card-header">
          <div>
            <h2 style={{ fontSize: '1.15rem' }}>
              Catálogo de Módulos & Simulador de Contratação Modular
            </h2>
            <p className="text-xs text-muted">
              Valores meramente ilustrativos para demonstração comercial do modelo SaaS modular.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-warning">Preços Demonstrativos / Ilustrativos</span>
            <button
              type="button"
              className={`btn btn-sm ${billingCycle === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setBillingCycle('monthly')}
            >
              Ciclo Mensal
            </button>
            <button
              type="button"
              className={`btn btn-sm ${billingCycle === 'yearly' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setBillingCycle('yearly')}
            >
              Ciclo Anual (2 meses bonificados)
            </button>
          </div>
        </div>

        <div className="card-body">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '0.85rem',
            }}
          >
            {modules.map((mod) => {
              const selected = selectedSimModules.includes(mod.id);
              const price = billingCycle === 'monthly' ? mod.priceMonthly : mod.priceYearly;
              return (
                <div
                  key={mod.id}
                  onClick={() => toggleSimModule(mod.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleSimModule(mod.id);
                    }
                  }}
                  style={{
                    border: selected
                      ? '1px solid var(--accent-primary)'
                      : '1px solid var(--border-subtle)',
                    backgroundColor: selected ? 'var(--accent-primary-soft)' : 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    cursor: mod.isCore ? 'default' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <strong>{mod.name[session.language]}</strong>
                      <span className="badge">{mod.code}</span>
                    </div>
                    <p className="text-xs text-muted">{mod.description[session.language]}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <span className="font-semibold tabular">
                      {formatCurrency(price, mod.currency, session.language)} /{' '}
                      {billingCycle === 'monthly' ? 'mês' : 'ano'}
                    </span>
                    <span className={`badge ${selected ? 'badge-success' : ''}`}>
                      {mod.isCore ? 'Base Obrigatória' : selected ? 'Selecionado' : 'Incluir'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card-footer">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm">
              Módulos selecionados: <strong>{selectedSimModules.length}</strong> de {modules.length}
            </span>
            <span className="text-sm">•</span>
            <span className="text-sm">
              Investimento estimado (ilustrativo):{' '}
              <strong className="tabular" style={{ fontSize: '1.05rem', color: 'var(--accent-primary)' }}>
                {formatCurrency(simulatedTotal, 'BRL', session.language)}
              </strong>{' '}
              / {billingCycle === 'monthly' ? 'mês' : 'ano'}
            </span>
          </div>
          <Link to="/login" className="btn btn-primary btn-sm">
            Testar Contratação no Console
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="card mt-2">
        <div className="card-header">
          <h2 style={{ fontSize: '1.1rem' }}>Perguntas Frequentes (FAQ)</h2>
        </div>
        <div className="card-body form-grid">
          <div className="flex flex-col gap-1">
            <strong>1. Como funciona o isolamento entre empresas no Olivelas Allin?</strong>
            <p className="text-xs text-muted">
              Cada empresa possui seu identificador único (`empresaId`), contratos, módulos ativos e
              usuários. Mesmo que um usuário altere manualmente o ID na URL, o guardião de escopo
              bloqueia o acesso se a empresa não pertencer ao seu vínculo autorizado.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <strong>2. O que acontece quando um registro é arquivado?</strong>
            <p className="text-xs text-muted">
              Seguindo boas práticas de governança corporativa, nenhum registro sofre `DELETE` físico. O
              arquivamento exige justificativa, registra data e autor, e pode ser filtrado ou restaurado
              com preservação integral do histórico.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <strong>3. O que é a Matriz Efetiva HBAC?</strong>
            <p className="text-xs text-muted">
              É o inspetor que calcula em tempo real todas as permissões de um usuário combinando seus
              papéis diretos, herança hierárquica e exceções individuais, exibindo a origem exata de cada
              permissão e impedindo elevação de privilégios.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <strong>4. Os dados persistem ao recarregar o navegador?</strong>
            <p className="text-xs text-muted">
              Sim. Toda a aplicação utiliza <strong>IndexedDB</strong> estruturado através de uma camada
              desacoplada de repositórios. Você pode criar registros, recarregar a página e também
              restaurar o seed original quando desejar.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export const LoginPage: React.FC = () => {
  const { users, roles, companies, currentUser, loginAsUser, session, notify } = useApp();
  const navigate = useNavigate();

  const [selectedUserId, setSelectedUserId] = useState<string>(
    currentUser?.id || 'usr-super-admin',
  );
  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];
  const userRoles = selectedUser ? getUserActiveRoles(selectedUser, roles) : [];
  const isGlobalUser = userRoles.some((r) => r.scope === 'global');

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    selectedUser?.companyIds[0] || 'emp-olivelas-matriz',
  );
  const [destinationMode, setDestinationMode] = useState<'global' | 'company'>(
    isGlobalUser ? 'global' : 'company',
  );

  const handleUserSelect = (uid: string) => {
    setSelectedUserId(uid);
    const u = users.find((item) => item.id === uid);
    if (u) {
      const rList = getUserActiveRoles(u, roles);
      const global = rList.some((r) => r.scope === 'global');
      setDestinationMode(global ? 'global' : 'company');
      if (u.companyIds.length > 0) {
        setSelectedCompanyId(u.companyIds[0]);
      } else {
        setSelectedCompanyId('emp-olivelas-matriz');
      }
    }
  };

  const handleEnterSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const targetCompany = destinationMode === 'company' ? selectedCompanyId : undefined;
    await loginAsUser(selectedUser.id, targetCompany);
    notify({
      type: 'success',
      title: `Sessão iniciada: ${selectedUser.name}`,
      description: `Papel: ${userRoles.map((r) => r.name[session.language]).join(', ')}`,
    });
    if (destinationMode === 'global' && isGlobalUser) {
      navigate('/app/global');
    } else {
      navigate(`/app/empresa/${selectedCompanyId}`);
    }
  };

  return (
    <div style={{ maxWidth: 1080, margin: '2rem auto', padding: '0 1.5rem' }}>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="flex items-center gap-2">
              <KeyRound size={18} style={{ color: 'var(--accent-primary)' }} />
              <h1 style={{ fontSize: '1.25rem' }}>
                Autenticação Demonstrativa & Seletor de Contexto HBAC
              </h1>
            </div>
            <p className="text-xs text-muted mt-2">
              Recurso exclusivo da Fundação Mock V1: selecione qualquer um dos 6 papéis da hierarquia
              para inspecionar permissões, rotas protegidas e isolamento multiempresa sem senhas reais.
            </p>
          </div>
          <span className="badge badge-warning">Autenticação Simulada — Mock V1</span>
        </div>

        <form onSubmit={handleEnterSession} className="card-body">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* Left column: Role cards */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">
                1. Escolha o Perfil de Demonstração (6 Papéis + Multi-tenant)
              </label>
              <div className="flex flex-col gap-2">
                {users.map((u) => {
                  const uRoles = getUserActiveRoles(u, roles);
                  const active = u.id === selectedUserId;
                  const linkedCompanies = companies.filter((c) => u.companyIds.includes(c.id));
                  return (
                    <div
                      key={u.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleUserSelect(u.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleUserSelect(u.id);
                        }
                      }}
                      style={{
                        border: active
                          ? '2px solid var(--accent-primary)'
                          : '1px solid var(--border-subtle)',
                        backgroundColor: active ? 'var(--accent-primary-soft)' : 'var(--bg-surface)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <strong>{u.name}</strong>
                        <span className="badge badge-info">
                          {uRoles[0]?.name[session.language]} (Nível {uRoles[0]?.hierarchyLevel})
                        </span>
                      </div>
                      <span className="text-xs text-muted mono">{u.email}</span>
                      <div className="flex items-center gap-1 flex-wrap mt-2">
                        <span className="text-xs text-muted">Escopo:</span>
                        {uRoles.some((r) => r.scope === 'global') && (
                          <span className="badge">Console Global</span>
                        )}
                        {linkedCompanies.map((c) => (
                          <span key={c.id} className="badge badge-teal">
                            {c.tradeName}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right column: Context & Scope summary */}
            {selectedUser && (
              <div className="flex flex-col gap-3">
                <div className="form-section" style={{ marginBottom: 0 }}>
                  <div className="form-section-title">2. Configurar Contexto de Entrada</div>
                  <div className="form-section-desc">
                    Defina em qual ambiente iniciar a sessão de <strong>{selectedUser.name}</strong>.
                  </div>

                  {isGlobalUser && (
                    <div className="field mb-4">
                      <label>Ambiente Inicial</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className={`btn btn-sm ${destinationMode === 'global' ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setDestinationMode('global')}
                        >
                          Console Global (/app/global)
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${destinationMode === 'company' ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setDestinationMode('company')}
                        >
                          Ambiente de Empresa (/app/empresa/:id)
                        </button>
                      </div>
                    </div>
                  )}

                  {(destinationMode === 'company' || !isGlobalUser) && (
                    <div className="field mb-4">
                      <label htmlFor="login-company-select">
                        Empresa Selecionada para o Contexto
                      </label>
                      <p id="login-company-hint" className="hint">
                        Usuários vinculados a múltiplas empresas podem alternar o contexto a qualquer momento.
                      </p>
                      <select
                        id="login-company-select"
                        className="select"
                        aria-describedby="login-company-hint"
                        value={selectedCompanyId}
                        onChange={(e) => setSelectedCompanyId(e.target.value)}
                      >
                        {(isGlobalUser
                          ? companies
                          : companies.filter((c) => selectedUser.companyIds.includes(c.id))
                        ).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.tradeName} — {c.legalName} ({c.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div
                    style={{
                      padding: '0.85rem',
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">RESUMO HBAC DO PERFIL</span>
                      <StatusBadge status={selectedUser.status} />
                    </div>
                    <p className="text-xs text-muted">
                      {userRoles[0]?.description[session.language]}
                    </p>
                    <div className="text-xs">
                      <strong>Permissões diretas no papel:</strong>{' '}
                      <span className="tabular">{userRoles[0]?.permissions.length || 0}</span> regras
                      ativas
                    </div>
                    {selectedUser.individualPermissions.length > 0 && (
                      <div className="text-xs" style={{ color: 'var(--accent-teal)' }}>
                        <strong>Exceções individuais HBAC:</strong>{' '}
                        {selectedUser.individualPermissions.length} concessão auditada (
                        {selectedUser.individualPermissions.map((p) => `${p.resource}:${p.action}`).join(', ')})
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-4">
                    <Link to="/recuperar-senha" className="text-xs">
                      Recuperar acesso (Fluxo Simulado)
                    </Link>
                    <button type="submit" className="btn btn-primary">
                      <UserCheck size={16} />
                      Iniciar Sessão Demonstrativa
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export const RecoverPasswordPage: React.FC = () => {
  const { getActor, notify } = useApp();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    await recordAuditEvent({
      actor: getActor(),
      module: 'auth',
      action: 'update',
      entityType: 'PasswordRecoverySimulation',
      entityId: email.trim(),
      summary: `Solicitação simulada de recuperação de acesso para o e-mail ${email.trim()}.`,
    });
    setSubmitted(true);
    notify({
      type: 'info',
      title: 'Fluxo de Recuperação Simulado',
      description: 'O protocolo demonstrativo foi registrado na trilha de auditoria local.',
    });
  };

  return (
    <div style={{ maxWidth: 560, margin: '3rem auto', padding: '0 1.5rem' }}>
      <div className="card">
        <div className="card-header">
          <h1 style={{ fontSize: '1.15rem' }}>Recuperação Simulada de Acesso</h1>
          <span className="badge badge-warning">Simulado</span>
        </div>
        <div className="card-body">
          {submitted ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2" style={{ color: 'var(--status-success)' }}>
                <CheckCircle2 size={18} />
                <strong>Instruções Simuladas Registradas</strong>
              </div>
              <p className="text-sm text-muted">
                Como esta é a Fundação Mock V1 executada localmente sem servidor de e-mail externo,
                nenhum e-mail real foi disparado para <code>{email}</code>. O evento foi gravado na
                auditoria local e você pode autenticar-se diretamente pelo seletor de perfis.
              </p>
              <Link to="/login" className="btn btn-primary">
                Voltar para Tela de Login Demonstrativo
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <p className="text-sm text-muted">
                Informe o e-mail corporativo para simular o protocolo de redefinição de credencial e
                registrar o evento na trilha de auditoria.
              </p>
              <div className="field">
                <label htmlFor="recover-email">E-mail Corporativo</label>
                <p id="recover-email-hint" className="hint">
                  Formato esperado: nome@empresa.com.br
                </p>
                <input
                  id="recover-email"
                  type="email"
                  required
                  className="input"
                  aria-describedby="recover-email-hint"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="helena.oliveira@olivelas-atelier.com.br"
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <Link to="/login" className="btn btn-secondary">
                  Cancelar
                </Link>
                <button type="submit" className="btn btn-primary">
                  Simular Envio de Recuperação
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export const PlansPage: React.FC = () => {
  const { modules, session } = useApp();
  return (
    <div style={{ maxWidth: 1200, margin: '2rem auto', padding: '0 1.5rem' }} className="flex flex-col gap-4">
      <div className="card">
        <div className="card-header">
          <div>
            <h1 style={{ fontSize: '1.35rem' }}>Planos e Catálogo Comercial de Módulos Allin</h1>
            <p className="text-sm text-muted">
              Contrate individualmente cada módulo ou combine pacotes sob medida. Preços ilustrativos.
            </p>
          </div>
          <span className="badge badge-warning">Valores Demonstrativos</span>
        </div>
        <div className="card-body">
          <div className="table-wrapper" tabIndex={0} role="region" aria-label="Tabela de Módulos Comerciais">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Módulo Comercial</th>
                  <th>Categoria</th>
                  <th>Dependências</th>
                  <th>Limites Operacionais</th>
                  <th className="num">Mensal (BRL)</th>
                  <th className="num">Anual (BRL)</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <code className="text-xs">{m.code}</code>
                    </td>
                    <td>
                      <strong>{m.name[session.language]}</strong>
                      <div className="text-xs text-muted">{m.description[session.language]}</div>
                    </td>
                    <td>
                      <span className="badge">{m.category}</span>
                    </td>
                    <td>
                      {m.dependencies.length === 0 ? (
                        <span className="text-xs text-muted">Nenhuma (Base)</span>
                      ) : (
                        m.dependencies.map((d) => (
                          <code key={d} className="text-xs" style={{ marginRight: 4 }}>
                            {d}
                          </code>
                        ))
                      )}
                    </td>
                    <td className="text-xs">{m.usageLimits}</td>
                    <td className="num font-semibold">
                      {formatCurrency(m.priceMonthly, m.currency, session.language)}
                    </td>
                    <td className="num font-semibold">
                      {formatCurrency(m.priceYearly, m.currency, session.language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => (
  <div style={{ maxWidth: 880, margin: '2rem auto', padding: '0 1.5rem' }}>
    <div className="card">
      <div className="card-header">
        <h1 style={{ fontSize: '1.25rem' }}>Termos de Uso — Olivelas Allin (Fundação Mock V1)</h1>
        <span className="badge badge-info">Documento Institucional</span>
      </div>
      <div className="card-body flex flex-col gap-3 text-sm">
        <p>
          <strong>1. Objeto da Plataforma:</strong> O Olivelas Allin é uma plataforma SaaS multiempresa
          modular projetada para permitir que pequenas e médias empresas contratem e operem apenas os
          módulos de gestão necessários ao seu momento operacional.
        </p>
        <p>
          <strong>2. Natureza do Ambiente Mock V1:</strong> Esta instância executa 100% localmente no
          navegador utilizando armazenamento persistente IndexedDB. Assinaturas contratuais, conciliações
          financeiras, chaves Pix/Boleto e chamadas do API Hub são claramente identificadas como
          simuladas.
        </p>
        <p>
          <strong>3. Política de Não Exclusão Física:</strong> Para conformidade de auditoria, nenhuma
          entidade de negócio (empresas, contratos, cobranças, usuários, tickets ou tokens) sofre deleção
          física. O arquivamento preserva o histórico completo.
        </p>
      </div>
    </div>
  </div>
);

export const PrivacyPage: React.FC = () => (
  <div style={{ maxWidth: 880, margin: '2rem auto', padding: '0 1.5rem' }}>
    <div className="card">
      <div className="card-header">
        <h1 style={{ fontSize: '1.25rem' }}>
          Política de Privacidade, Segurança e Isolamento Multiempresa
        </h1>
        <span className="badge badge-teal">Governança & Proteção de Dados</span>
      </div>
      <div className="card-body flex flex-col gap-3 text-sm">
        <p>
          <strong>1. Isolamento Lógico por Tenant:</strong> Todos os registros operacionais possuem
          vínculo estrito com o identificador da empresa (`companyId`). A camada de rotas e o motor HBAC
          impedem leitura cruzada entre empresas por manipulação de URL.
        </p>
        <p>
          <strong>2. Mascaramento de Credenciais e Dados Sensíveis:</strong> Tokens de API, chaves de
          meios de pagamento e documentos de signatários são armazenados e exibidos de forma mascarada,
          sem exposição de segredos reais ou números completos de cartão (PAN).
        </p>
        <p>
          <strong>3. Acesso de Suporte Auditado:</strong> Quando o Super Admin ingressa no contexto
          administrativo de uma empresa para suporte, a sessão mantém a identidade original do operador
          e grava evento explícito na trilha de auditoria.
        </p>
      </div>
    </div>
  </div>
);
