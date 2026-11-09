import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Database,
  ExternalLink,
  KeyRound,
  Layers,
  Lock,
  Package,
  Play,
  ScrollText,
  ShieldCheck,
  Sparkles,
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
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [catalogTab, setCatalogTab] = useState<'commercial' | 'examples'>('commercial');
  const [selectedSimModules, setSelectedSimModules] = useState<string[]>([
    'mod_gestao_estoque',
    'mod_personal_treiner',
    'mod_agendamento_simples',
    'mod_restaurante',
  ]);

  const commercialModules = modules.filter((m) => !m.isExample);
  const exampleModules = modules.filter((m) => Boolean(m.isExample));
  const displayedModules = catalogTab === 'commercial' ? commercialModules : exampleModules;

  const toggleSimModule = (modId: string) => {
    setSelectedSimModules((prev) =>
      prev.includes(modId) ? prev.filter((id) => id !== modId) : [...prev, modId],
    );
  };

  const simulatedTotal = modules
    .filter((m) => selectedSimModules.includes(m.id))
    .reduce((acc, m) => acc + (billingCycle === 'monthly' ? m.priceMonthly : m.priceYearly), 0);

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '2.25rem 1.5rem' }} className="flex flex-col gap-6">
      {/* Hero Section Modernizada (Padrão Gestao Estoque) */}
      <section
        className="card"
        style={{
          padding: '2.75rem',
          border: '1px solid var(--border-subtle)',
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--accent-primary-soft) 55%, var(--bg-surface)) 0%, var(--bg-surface) 60%)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '2.5rem',
          alignItems: 'center',
        }}
      >
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="badge badge-info">
              <Sparkles size={12} /> {t('landing.hero.eyebrow')}
            </span>
            <span className="badge badge-teal">
              <Database size={12} /> 16 Schemas PostgreSQL no Supabase
            </span>
          </div>
          <h1 style={{ fontSize: '2.35rem', lineHeight: 1.15, fontWeight: 800 }}>
            Ecossistema Olivelas All In: 16 Plataformas Comerciais em Uma Única Arquitetura
          </h1>
          <p className="text-muted" style={{ fontSize: '0.98rem', maxWidth: '62ch', lineHeight: 1.6 }}>
            Padronizado sob o design e arquitetura do <strong>Olivelas - Gestão de Estoque & PDV</strong>, com login
            único em <code>public.profiles</code>, 16 schemas dedicados no PostgreSQL (Supabase) e demonstração
            interativa de cada módulo diretamente no navegador.
          </p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <Link to="/demo/allin_gestao_estoque" className="btn btn-primary btn-lg">
              <Play size={16} />
              Testar Demonstração dos 16 Módulos
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              {t('landing.hero.ctaPrimary')}
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Architectural Proof Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-md)',
          }}
          className="flex flex-col gap-3.5"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <strong className="text-sm">Arquitetura Multi-Schema & Governança HBAC</strong>
            <span className="badge badge-success">Supabase Online</span>
          </div>
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
            <div className="kpi-card" style={{ padding: '0.95rem' }}>
              <div className="kpi-label">Módulos Comerciais</div>
              <div className="kpi-value">{commercialModules.length}</div>
              <div className="kpi-meta">Plataformas Olivelas oficiais</div>
            </div>
            <div className="kpi-card" style={{ padding: '0.95rem' }}>
              <div className="kpi-label">Módulos de Exemplo</div>
              <div className="kpi-value">{exampleModules.length}</div>
              <div className="kpi-meta">Estrutura base migrada</div>
            </div>
            <div className="kpi-card" style={{ padding: '0.95rem' }}>
              <div className="kpi-label">Schemas PostgreSQL</div>
              <div className="kpi-value">16 + public</div>
              <div className="kpi-meta">Isolados no Supabase</div>
            </div>
            <div className="kpi-card" style={{ padding: '0.95rem' }}>
              <div className="kpi-label">Login Unificado</div>
              <div className="kpi-value">SSO</div>
              <div className="kpi-meta">Tabela única public.profiles</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits for Small Businesses & Governance Pillars */}
      <section className="kpi-grid">
        <div className="card card-body flex flex-col gap-2">
          <div className="flex items-center gap-2.5 font-semibold">
            <span className="icon-box">
              <Layers size={18} />
            </span>
            <span>16 Plataformas Olivelas Prontas para Uso</span>
          </div>
          <p className="text-sm text-muted">
            Gestão de Estoque & PDV, Personal Trainer, Consultório & Odonto, Clínicas, Condomínios,
            Restaurantes & KDS, Delivery, Supermercado, Rifas, Contratos e Vitrine IA.
          </p>
        </div>

        <div className="card card-body flex flex-col gap-2">
          <div className="flex items-center gap-2.5 font-semibold">
            <span className="icon-box icon-box-teal">
              <ShieldCheck size={18} />
            </span>
            <span>Controle de Acesso Hierárquico (HBAC)</span>
          </div>
          <p className="text-sm text-muted">
            Delegação segura de permissões sem elevação de privilégios. Consulte a matriz efetiva de
            cada colaborador e a origem exata de cada autorização.
          </p>
        </div>

        <div className="card card-body flex flex-col gap-2">
          <div className="flex items-center gap-2.5 font-semibold">
            <span className="icon-box">
              <ScrollText size={18} />
            </span>
            <span>Auditoria Imutável & Retenção Contábil</span>
          </div>
          <p className="text-sm text-muted">
            Nenhum registro de negócio sofre exclusão física. Arquivamentos exigem justificativa e
            todas as mutações gravam estado anterior e novo.
          </p>
        </div>

        <div className="card card-body flex flex-col gap-2">
          <div className="flex items-center gap-2.5 font-semibold">
            <span className="icon-box icon-box-teal">
              <Terminal size={18} />
            </span>
            <span>Demonstração Interativa em 1 Clique</span>
          </div>
          <p className="text-sm text-muted">
            Clique em qualquer plataforma Olivelas abaixo para abrir imediatamente no navegador a
            interface operacional do módulo conectada ao seu schema no Supabase.
          </p>
        </div>
      </section>

      {/* Interactive Modular Catalog & Live Demo Launcher */}
      <section className="card">
        <div className="card-header">
          <div>
            <h2 style={{ fontSize: '1.2rem' }}>
              Catálogo Comercial de Módulos Olivelas & Demonstração ao Vivo
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Clique em <strong>"Abrir Demonstração"</strong> em qualquer plataforma Olivelas para abrir sua interface funcional no navegador.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="segmented-tabs">
              <button
                type="button"
                className={`segmented-tab ${catalogTab === 'commercial' ? 'active' : ''}`}
                onClick={() => setCatalogTab('commercial')}
              >
                <Sparkles size={13} />
                16 Módulos Comerciais Olivelas
              </button>
              <button
                type="button"
                className={`segmented-tab ${catalogTab === 'examples' ? 'active' : ''}`}
                onClick={() => setCatalogTab('examples')}
              >
                <Layers size={13} />
                10 Módulos de Exemplo
              </button>
            </div>

            <div className="segmented-tabs">
              <button
                type="button"
                className={`segmented-tab ${billingCycle === 'monthly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('monthly')}
              >
                Mensal
              </button>
              <button
                type="button"
                className={`segmented-tab ${billingCycle === 'yearly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('yearly')}
              >
                Anual (-16%)
              </button>
            </div>
          </div>
        </div>

        <div className="card-body">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
              gap: '1.1rem',
            }}
          >
            {displayedModules.map((mod) => {
              const selected = selectedSimModules.includes(mod.id);
              const price = billingCycle === 'monthly' ? mod.priceMonthly : mod.priceYearly;
              const demoSlug = mod.ecosystemSlug || mod.code;
              const demoPath = !mod.isExample ? `/demo/${demoSlug}` : '/login';

              return (
                <div
                  key={mod.id}
                  onClick={() => navigate(demoPath)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(demoPath);
                    }
                  }}
                  className="card card-interactive"
                  style={{
                    border: selected
                      ? '1px solid var(--accent-primary)'
                      : '1px solid var(--border-subtle)',
                    backgroundColor: selected ? 'var(--accent-primary-soft)' : 'var(--bg-surface)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.9rem',
                  }}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="badge badge-info">{mod.category}</span>
                      {mod.dbSchema ? (
                        <span className="badge badge-success mono">
                          schema: {mod.dbSchema}
                        </span>
                      ) : (
                        <span className="badge badge-warning">Exemplo Base</span>
                      )}
                    </div>
                    <strong style={{ fontSize: '1.05rem' }}>{mod.name[session.language]}</strong>
                    <p className="text-xs text-muted leading-relaxed">
                      {mod.description[session.language]}
                    </p>
                  </div>

                  <div
                    className="flex items-center justify-between pt-3 gap-2 flex-wrap"
                    style={{ borderTop: '1px solid var(--border-subtle)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div>
                      <span className="font-bold tabular" style={{ fontSize: '0.95rem', color: 'var(--accent-primary)' }}>
                        {formatCurrency(price, mod.currency, session.language)}
                      </span>
                      <span className="text-xs text-muted">
                        /{billingCycle === 'monthly' ? 'mês' : 'ano'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleSimModule(mod.id)}
                        className="btn btn-secondary btn-sm"
                      >
                        {selected ? 'No Pacote ✓' : '+ Simular'}
                      </button>
                      <Link
                        to={demoPath}
                        className="btn btn-primary btn-sm"
                      >
                        <Play size={12} />
                        Abrir Demo
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card-footer">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm">
              Módulos no simulador: <strong>{selectedSimModules.length}</strong>
            </span>
            <span className="text-sm">•</span>
            <span className="text-sm">
              Investimento estimado:{' '}
              <strong className="tabular" style={{ fontSize: '1.1rem', color: 'var(--accent-primary)' }}>
                {formatCurrency(simulatedTotal, 'BRL', session.language)}
              </strong>{' '}
              / {billingCycle === 'monthly' ? 'mês' : 'ano'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/demo/allin_gestao_estoque" className="btn btn-secondary btn-sm">
              <Play size={13} />
              Abrir Demo Gestão de Estoque
            </Link>
            <Link to="/login" className="btn btn-primary btn-sm">
              Entrar no Console All In
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="card">
        <div className="card-header">
          <h2 style={{ fontSize: '1.1rem' }}>Perguntas Frequentes (FAQ)</h2>
        </div>
        <div className="card-body form-grid">
          <div className="flex flex-col gap-1">
            <strong>1. Como funcionam os 16 módulos comerciais Olivelas?</strong>
            <p className="text-xs text-muted">
              Todas as 16 plataformas Olivelas estão integradas ao catálogo comercial com schemas
              PostgreSQL dedicados no Supabase e login único em <code>public.profiles</code>. Ao clicar em
              qualquer módulo, você abre sua interface interativa para demonstração imediata.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <strong>2. O que são os Módulos de Exemplo?</strong>
            <p className="text-xs text-muted">
              Os 10 módulos genéricos iniciais foram preservados em uma aba separada de{' '}
              <strong>Módulos de Exemplo (Fundação)</strong> para referência arquitetural de HBAC, contratos e
              auditoria.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <strong>3. O que é a Matriz Efetiva HBAC?</strong>
            <p className="text-xs text-muted">
              É o inspetor que calcula em tempo real todas as permissões de um usuário combinando seus
              papéis diretos, herança hierárquica e exceções individuais, exibindo a origem exata de cada
              permissão.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <strong>4. Os dados persistem no Supabase e no navegador?</strong>
            <p className="text-xs text-muted">
              Sim. Os 16 módulos comerciais sincronizam diretamente com seus schemas no PostgreSQL
              (Supabase) e também mantêm persistência local resiliente em IndexedDB/LocalStorage.
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
  const [planTab, setPlanTab] = useState<'commercial' | 'examples'>('commercial');

  const commercialModules = modules.filter((m) => !m.isExample);
  const exampleModules = modules.filter((m) => m.isExample);
  const activeModules = planTab === 'commercial' ? commercialModules : exampleModules;

  return (
    <div style={{ maxWidth: 1280, margin: '2rem auto', padding: '0 1.5rem' }} className="flex flex-col gap-5">
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-teal">Catálogo Comercial Unificado</span>
              <span className="badge badge-info">16 Schemas PostgreSQL no Supabase</span>
            </div>
            <h1 style={{ fontSize: '1.5rem' }}>
              Planos e Catálogo Comercial — Plataformas Olivelas All In
            </h1>
            <p className="text-sm text-muted mt-1">
              Todas as 16 plataformas Olivelas operam como módulos comerciais sob demanda. Clique em qualquer módulo para abrir a interface de demonstração no navegador.
            </p>
          </div>

          <div className="segmented-tabs">
            <button
              type="button"
              className={`segmented-tab ${planTab === 'commercial' ? 'active' : ''}`}
              onClick={() => setPlanTab('commercial')}
            >
              Módulos Comerciais Olivelas
              <span className="badge badge-teal">{commercialModules.length}</span>
            </button>
            <button
              type="button"
              className={`segmented-tab ${planTab === 'examples' ? 'active' : ''}`}
              onClick={() => setPlanTab('examples')}
            >
              Módulos de Exemplo (Base)
              <span className="badge badge-neutral">{exampleModules.length}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }} tabIndex={0} role="region" aria-label="Tabela de Módulos Comerciais">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Módulo Comercial</th>
                  <th>Categoria</th>
                  <th>Schema / Estrutura</th>
                  <th>Limites Operacionais</th>
                  <th className="num">Mensal (BRL)</th>
                  <th className="num">Anual (BRL)</th>
                  <th className="num">Demonstração</th>
                </tr>
              </thead>
              <tbody>
                {activeModules.map((m) => {
                  const demoUrl = !m.isExample
                    ? `/demo/${m.ecosystemSlug || m.code}`
                    : `/login`;
                  return (
                    <tr key={m.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Link
                            to={demoUrl}
                            style={{ fontWeight: 700, color: 'var(--text-primary)' }}
                          >
                            {m.name[session.language]}
                          </Link>
                          {m.isExample ? (
                            <span className="badge badge-warning">Exemplo</span>
                          ) : (
                            <span className="badge badge-teal">Oficial</span>
                          )}
                        </div>
                        <div className="text-xs text-muted mt-1">{m.description[session.language]}</div>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{m.category}</span>
                      </td>
                      <td>
                        {m.dbSchema ? (
                          <div className="flex flex-col gap-1">
                            <span className="badge badge-info font-mono">{m.dbSchema}</span>
                            {m.projectFolder && (
                              <span className="text-xs text-muted font-mono">/projetos/{m.projectFolder}</span>
                            )}
                          </div>
                        ) : (
                          <code className="text-xs">{m.code}</code>
                        )}
                      </td>
                      <td className="text-xs">{m.usageLimits}</td>
                      <td className="num font-semibold">
                        {formatCurrency(m.priceMonthly, m.currency, session.language)}
                      </td>
                      <td className="num font-semibold">
                        {formatCurrency(m.priceYearly, m.currency, session.language)}
                      </td>
                      <td className="num">
                        {!m.isExample ? (
                          <Link to={demoUrl} className="btn btn-primary btn-sm">
                            Abrir Interface <ArrowRight size={13} />
                          </Link>
                        ) : (
                          <Link to="/login" className="btn btn-secondary btn-sm">
                            Ver Exemplo
                          </Link>
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
