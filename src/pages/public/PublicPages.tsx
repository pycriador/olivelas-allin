import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Bot,
  BrainCircuit,
  Building2,
  CheckCircle2,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Layers,
  Lock,
  Mail,
  Package,
  Play,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Terminal,
  UserCheck,
  UserPlus,
  Webhook,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../i18n/translations';
import { getUserActiveRoles } from '../../services/hbacService';
import { StatusBadge } from '../../components/shared/SharedComponents';
import { recordAuditEvent } from '../../repositories/repositories';
import {
  changeUserPasswordInSupabase,
  checkFirstLoginStatusInSupabase,
  validatePasswordStrength,
} from '../../services/supabaseAuthService';
import { supabaseUrl } from '../../lib/supabase/client';

export const LandingPage: React.FC = () => {
  const { modules, session } = useApp();
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

  const architecturalPillars = [
    {
      icon: KeyRound,
      badge: 'SSO & Bcrypt no Supabase',
      title: 'Base Única de Usuários & Senhas (public.profiles)',
      desc: 'Autenticação real unificada no PostgreSQL (Supabase) com criptografia bcrypt (pgcrypto), proteção contra força bruta, bloqueio automático e sessão compartilhada entre todos os 16 módulos.',
    },
    {
      icon: ShieldCheck,
      badge: '48+ Permissões HBAC',
      title: 'Motor de Permissões Granulares HBAC',
      desc: 'Controle hierárquico e baseado em atributos em todas as telas e botões: Super Admin, Admin Global, Financeiro, Suporte, Administrador da Empresa, Gerente e Operador com trava anti-escalada.',
    },
    {
      icon: BrainCircuit,
      badge: 'RAG + Copiloto IA',
      title: 'RAG Completo & Copiloto IA em Todos os Módulos',
      desc: 'Base de conhecimento indexada no Supabase (public.allin_rag_documents) combinada aos registros reais de cada schema PostgreSQL para respostas fundamentadas, auditoria e simulação What-If.',
    },
    {
      icon: Webhook,
      badge: 'PostgREST + cURL',
      title: 'API Studio REST & Tokens HBAC por Módulo',
      desc: 'Todos os 16 módulos expõem API REST real via Supabase PostgREST (Accept-Profile / Content-Profile), runner HTTP ao vivo, gerador cURL e chaves de API com escopos granulares.',
    },
    {
      icon: Building2,
      badge: 'Multi-Tenant Real',
      title: 'Administração por Empresa (Matriz → Filiais)',
      desc: 'Gestão completa de empresas clientes, unidades filiais, contratos digitais, faturamento recorrente, quadro societário e delegação segura de usuários por tenant.',
    },
    {
      icon: Database,
      badge: 'PostgreSQL 17',
      title: 'CRUD Completo Multi-Tabela nos 16 Schemas',
      desc: 'Crie, consulte, edite, exporte (CSV/JSON) e arquive registros diretamente nas tabelas reais dos 16 schemas PostgreSQL, respeitando rigorosamente o perfil HBAC do usuário logado.',
    },
  ];

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '2.25rem 1.5rem' }} className="flex flex-col gap-6">
      {/* Hero Section Real Production */}
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
              <Sparkles size={12} /> Plataforma SaaS Multi-Empresa em Produção
            </span>
            <span className="badge badge-teal">
              <Database size={12} /> 16 Schemas PostgreSQL + RAG + API no Supabase
            </span>
          </div>
          <h1 style={{ fontSize: '2.35rem', lineHeight: 1.15, fontWeight: 800 }}>
            Olivelas All In: 16 Plataformas Comerciais, Login Único, HBAC Granular, RAG e API Real
          </h1>
          <p className="text-muted" style={{ fontSize: '0.98rem', maxWidth: '64ch', lineHeight: 1.6 }}>
            Construída sobre a arquitetura de referência do <strong>Olivelas - Gestão de Estoque & PDV</strong>,
            conectada 100% em tempo real ao <strong>Supabase PostgreSQL</strong>. Uma única base de usuários e
            senhas (<code>public.profiles</code>), permissões granulares HBAC, Copiloto IA com RAG completo,
            API REST em todos os módulos e CRUD completo conforme o perfil do usuário.
          </p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <Link to="/login" className="btn btn-primary btn-lg">
              <KeyRound size={16} />
              Entrar com Login Supabase
            </Link>
            <Link to="/cadastro" className="btn btn-secondary btn-lg">
              <UserPlus size={16} />
              Criar Conta & Empresa
            </Link>
            <Link to="/demo/allin_gestao_estoque" className="btn btn-secondary btn-lg">
              <Play size={16} />
              Explorar os 16 Módulos Ao Vivo
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
            <strong className="text-sm">Infraestrutura Supabase PostgreSQL Ativa</strong>
            <span className="badge badge-success">100% Online • Zero Mock</span>
          </div>
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
            <div className="kpi-card" style={{ padding: '0.95rem' }}>
              <div className="kpi-label">Módulos Comerciais</div>
              <div className="kpi-value">{commercialModules.length}</div>
              <div className="kpi-meta">Plataformas Olivelas com CRUD + RAG + API</div>
            </div>
            <div className="kpi-card" style={{ padding: '0.95rem' }}>
              <div className="kpi-label">Login & Senha Única</div>
              <div className="kpi-value">Bcrypt</div>
              <div className="kpi-meta">Tabela única public.profiles no Supabase</div>
            </div>
            <div className="kpi-card" style={{ padding: '0.95rem' }}>
              <div className="kpi-label">Governança HBAC</div>
              <div className="kpi-value">6 Níveis</div>
              <div className="kpi-meta">+48 permissões granulares por perfil</div>
            </div>
            <div className="kpi-card" style={{ padding: '0.95rem' }}>
              <div className="kpi-label">RAG & API Studio</div>
              <div className="kpi-value">16/16</div>
              <div className="kpi-meta">Todos os módulos com API REST e RAG IA</div>
            </div>
          </div>
          <div className="text-xs text-muted flex items-center justify-between pt-1">
            <span>Instância PostgreSQL:</span>
            <code className="text-xs">{supabaseUrl}</code>
          </div>
        </div>
      </section>

      {/* 6 Pilares Arquiteturais (Padrão Gestao Estoque) */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {architecturalPillars.map((pillar) => {
          const IconComp = pillar.icon;
          return (
            <div key={pillar.title} className="card p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="stat-icon-box" style={{ width: 40, height: 40 }}>
                  <IconComp size={19} />
                </div>
                <span className="badge badge-teal">{pillar.badge}</span>
              </div>
              <h3 className="text-base font-bold">{pillar.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{pillar.desc}</p>
            </div>
          );
        })}
      </section>

      {/* Catálogo Oficial de Módulos Comerciais Olivelas + Estrutura de Exemplos */}
      <section className="card">
        <div className="card-header">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-teal">Catálogo Oficial Olivelas</span>
              <span className="badge badge-info">CRUD + RAG + API + HBAC em Todos os Módulos</span>
            </div>
            <h2 style={{ fontSize: '1.35rem' }}>
              Módulos Comerciais Olivelas ({commercialModules.length} Plataformas) & Estrutura de Exemplos ({exampleModules.length})
            </h2>
            <p className="text-sm text-muted">
              Clique em qualquer módulo comercial para abrir sua interface completa com operação interativa, CRUD multi-tabela no Supabase, RAG Copiloto IA e API REST.
            </p>
          </div>

          <div className="segmented-tabs">
            <button
              type="button"
              className={`segmented-tab ${catalogTab === 'commercial' ? 'active' : ''}`}
              onClick={() => setCatalogTab('commercial')}
            >
              <Package size={15} />
              Módulos Comerciais Olivelas
              <span className="badge badge-teal">{commercialModules.length}</span>
            </button>
            <button
              type="button"
              className={`segmented-tab ${catalogTab === 'examples' ? 'active' : ''}`}
              onClick={() => setCatalogTab('examples')}
            >
              <Layers size={15} />
              Módulos de Exemplo
              <span className="badge badge-neutral">{exampleModules.length}</span>
            </button>
          </div>
        </div>

        <div className="card-body">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.15rem',
            }}
          >
            {displayedModules.map((mod) => {
              const demoUrl = !mod.isExample
                ? `/demo/${mod.ecosystemSlug || mod.code}`
                : `/login`;
              return (
                <div
                  key={mod.id}
                  onClick={() => navigate(demoUrl)}
                  className="card card-interactive p-5 flex flex-col justify-between gap-4"
                >
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2">
                      {mod.isExample ? (
                        <span className="badge badge-warning">Módulo de Exemplo</span>
                      ) : (
                        <span className="badge badge-teal">Módulo Comercial Oficial</span>
                      )}
                      {mod.dbSchema ? (
                        <span className="badge badge-info font-mono">schema: {mod.dbSchema}</span>
                      ) : (
                        <span className="text-xs text-muted font-mono">{mod.code}</span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                      {mod.name[session.language]}
                    </h3>
                    <p className="text-xs text-muted" style={{ lineHeight: 1.55 }}>
                      {mod.description[session.language]}
                    </p>

                    {!mod.isExample && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        <span className="badge badge-success text-[10px]">CRUD Real</span>
                        <span className="badge badge-info text-[10px]">RAG IA</span>
                        <span className="badge badge-teal text-[10px]">API REST</span>
                        <span className="badge badge-neutral text-[10px]">HBAC</span>
                      </div>
                    )}
                  </div>

                  <div
                    className="flex items-center justify-between pt-3"
                    style={{ borderTop: '1px solid var(--border-subtle)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div>
                      <div className="text-xs text-muted">Investimento Mensal</div>
                      <div className="font-bold text-base">
                        {formatCurrency(mod.priceMonthly, mod.currency, session.language)}
                        <span className="text-xs text-muted font-normal">/mês</span>
                      </div>
                    </div>

                    {!mod.isExample ? (
                      <Link to={demoUrl} className="btn btn-primary btn-sm">
                        <span>Abrir Módulo</span>
                        <ExternalLink size={13} />
                      </Link>
                    ) : (
                      <Link to="/login" className="btn btn-secondary btn-sm">
                        <span>Ver Exemplo</span>
                        <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Pricing & Module Bundle Configurator */}
      <section className="card">
        <div className="card-header">
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>
              Configurador Comercial de Módulos Olivelas All In
            </h2>
            <p className="text-sm text-muted">
              Selecione as plataformas comerciais Olivelas que sua empresa deseja contratar sob demanda.
            </p>
          </div>
          <div className="segmented-tabs">
            <button
              type="button"
              className={`segmented-tab ${billingCycle === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('monthly')}
            >
              Ciclo Mensal
            </button>
            <button
              type="button"
              className={`segmented-tab ${billingCycle === 'yearly' ? 'active' : ''}`}
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <div style={{ gridColumn: 'span 2' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                {commercialModules.map((mod) => {
                  const checked = selectedSimModules.includes(mod.id);
                  const price = billingCycle === 'monthly' ? mod.priceMonthly : mod.priceYearly;
                  return (
                    <label
                      key={mod.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.65rem',
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: checked
                          ? '1.5px solid var(--accent-primary)'
                          : '1px solid var(--border-subtle)',
                        backgroundColor: checked ? 'var(--accent-primary-soft)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSimModule(mod.id)}
                        style={{ marginTop: 3 }}
                      />
                      <div className="flex flex-col gap-1" style={{ flex: 1 }}>
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-sm">{mod.name[session.language]}</span>
                        </div>
                        <span className="text-xs text-muted">
                          {formatCurrency(price, mod.currency, session.language)} /{' '}
                          {billingCycle === 'monthly' ? 'mês' : 'ano'}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div>
                <div className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase' }}>
                  Resumo da Proposta Comercial
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, marginTop: '0.35rem' }} className="tabular">
                  {formatCurrency(simulatedTotal, 'BRL', session.language)}
                </div>
                <div className="text-xs text-muted">
                  por {billingCycle === 'monthly' ? 'mês' : 'ano'} • {selectedSimModules.length} plataformas selecionadas
                </div>
                <hr className="divider" />
                <ul className="text-xs text-secondary flex flex-col gap-2" style={{ paddingLeft: '1rem' }}>
                  <li>Acesso imediato aos schemas dedicados no PostgreSQL</li>
                  <li>Login unificado (SSO) em <code>public.profiles</code></li>
                  <li>Copiloto IA com RAG + API Studio REST inclusos</li>
                  <li>Permissões granulares HBAC e auditoria completa</li>
                </ul>
              </div>
              <div className="flex flex-col gap-2">
                <Link to="/cadastro" className="btn btn-primary w-full" style={{ justifyContent: 'center' }}>
                  Criar Empresa & Ativar Pacote
                  <ArrowRight size={15} />
                </Link>
                <Link to="/login" className="btn btn-secondary w-full" style={{ justifyContent: 'center' }}>
                  Já possuo conta — Fazer Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export const LoginPage: React.FC = () => {
  const {
    users,
    roles,
    companies,
    loginWithCredentials,
    registerAccount,
    session,
    notify,
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const isRegisterRoute = location.pathname === '/cadastro';

  const [authMode, setAuthMode] = useState<'login' | 'register'>(
    isRegisterRoute ? 'register' : 'login',
  );

  // Estado do Login Real no Supabase
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [needsFirstLoginPassword, setNeedsFirstLoginPassword] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes('@')) {
      setNeedsFirstLoginPassword(false);
      return;
    }
    void checkFirstLoginStatusInSupabase(trimmed).then((res) => {
      if (!cancelled) {
        setNeedsFirstLoginPassword(Boolean(res.needs_password_setup));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [email]);

  // Estado do Cadastro Real no Supabase
  const [regFullName, setRegFullName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regTradeName, setRegTradeName] = useState<string>('');
  const [regLegalName, setRegLegalName] = useState<string>('');
  const [regCnpj, setRegCnpj] = useState<string>('');

  const handleRealLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);
    try {
      const res = await loginWithCredentials(email, password);
      if (!res.ok) {
        setAuthError(res.message || 'Falha na autenticação com o Supabase.');
        return;
      }
      setNeedsFirstLoginPassword(false);
      notify({
        type: 'success',
        title: res.firstLoginConfigured
          ? 'Senha de Global Admin Configurada no Supabase!'
          : 'Autenticação Supabase Confirmada',
        description:
          res.message ||
          `Sessão iniciada com sucesso para ${email} (public.profiles + auth.users).`,
      });
      navigate(res.redirectPath || '/app/global');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRealRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);
    try {
      const res = await registerAccount({
        fullName: regFullName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        companyTradeName: regTradeName,
        companyLegalName: regLegalName || `${regTradeName} Ltda.`,
        cnpj: regCnpj || '39.812.400/0001-55',
      });
      if (!res.ok) {
        setAuthError(res.message || 'Não foi possível criar a conta no Supabase.');
        return;
      }
      notify({
        type: 'success',
        title: 'Conta e Empresa Criadas no Supabase!',
        description: `Bem-vindo(a), ${regFullName}! Sua empresa ${regTradeName} já está ativa.`,
      });
      navigate(res.redirectPath || '/app/global');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pwStrength = validatePasswordStrength(authMode === 'login' ? password : regPassword);

  return (
    <div style={{ maxWidth: 1180, margin: '2rem auto', padding: '0 1.5rem' }}>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="flex items-center gap-2">
              <KeyRound size={18} style={{ color: 'var(--accent-primary)' }} />
              <h1 style={{ fontSize: '1.3rem' }}>
                Autenticação Unificada Supabase & Controle de Acesso HBAC
              </h1>
            </div>
            <p className="text-xs text-muted mt-1">
              Login real conectado à tabela única <code>public.profiles</code> no PostgreSQL (Supabase) com
              verificação de senha criptografada (bcrypt), proteção contra força bruta e sessão SSO compartilhada entre os 16 módulos.
            </p>
          </div>

          <div className="segmented-tabs">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setAuthError(null);
              }}
              className={`segmented-tab ${authMode === 'login' ? 'active' : ''}`}
            >
              <Lock size={14} /> Entrar com E-mail e Senha
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setAuthError(null);
              }}
              className={`segmented-tab ${authMode === 'register' ? 'active' : ''}`}
            >
              <UserPlus size={14} /> Criar Nova Conta & Empresa
            </button>
          </div>
        </div>

        <div className="card-body">
          {authMode === 'login' ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '1.75rem',
              }}
            >
              {/* Coluna 1: Formulário de Login Real com E-mail e Senha */}
              <form onSubmit={handleRealLoginSubmit} className="flex flex-col gap-4">
                <div className="form-section" style={{ marginBottom: 0 }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="form-section-title">1. Credenciais Corporativas (Supabase Auth)</div>
                    <span className="badge badge-success">Bcrypt Ativo</span>
                  </div>
                  <div className="form-section-desc">
                    Autentique-se com seu e-mail e senha cadastrados em <code>public.profiles</code>.
                  </div>

                  {authError && (
                    <div
                      className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs flex items-center gap-2 mb-3"
                      style={{ color: 'var(--status-danger)' }}
                    >
                      <AlertCircle size={16} />
                      <span>{authError}</span>
                    </div>
                  )}

                  <div className="field mb-3">
                    <label htmlFor="login-email-input">E-mail Corporativo</label>
                    <div className="relative">
                      <input
                        id="login-email-input"
                        type="email"
                        required
                        className="input w-full"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu.email@olivelas.com.br"
                      />
                    </div>
                  </div>

                  {needsFirstLoginPassword && (
                    <div
                      className="p-3 rounded-xl border border-teal-500/40 bg-teal-500/10 text-xs flex items-start gap-2 mb-3"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      <KeyRound size={16} className="shrink-0 mt-0.5" />
                      <div>
                        <strong>Primeiro Acesso Detectado no Supabase Real:</strong> digite abaixo a senha que deseja definir para{' '}
                        <code>{email}</code> (mínimo 6 caracteres). Ao entrar, ela será criptografada com{' '}
                        <code>bcrypt</code> e salva em <code>public.profiles</code> e <code>auth.users</code>.
                      </div>
                    </div>
                  )}

                  <div className="field mb-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="login-password-input">
                        {needsFirstLoginPassword
                          ? 'Definir Senha de Global Admin (Primeiro Login)'
                          : 'Senha de Acesso'}
                      </label>
                      <Link to="/recuperar-senha" className="text-xs font-semibold">
                        Alterar / Redefinir Senha no Supabase
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="login-password-input"
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="input w-full"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={
                          needsFirstLoginPassword
                            ? 'Digite sua nova senha (mín. 6 caracteres)...'
                            : '••••••••••••'
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="btn btn-secondary btn-sm"
                        title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <span className="hint mt-1">
                      {needsFirstLoginPassword
                        ? 'Sua senha será configurada no primeiro login e refletirá imediatamente no Supabase real.'
                        : 'Autenticação validada diretamente contra o hash bcrypt salvo no Supabase.'}
                    </span>
                  </div>

                  <div
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1 mb-4"
                    style={{ backgroundColor: 'var(--bg-subtle)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-teal-600" /> Segurança de Autenticação Ativa
                      </span>
                      <span className="badge badge-teal">PostgreSQL RPC</span>
                    </div>
                    <p className="text-muted">
                      Verificação via hash <code>crypt(password, gen_salt('bf'))</code> no Supabase, bloqueio automático após 5 tentativas inválidas e gravação em <code>public.allin_audit_events</code>.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary w-full py-3"
                    style={{ justifyContent: 'center' }}
                  >
                    <UserCheck size={16} />
                    {isSubmitting
                      ? 'Autenticando no Supabase...'
                      : needsFirstLoginPassword
                        ? 'Configurar Senha no Supabase & Entrar como Global Admin'
                        : 'Entrar na Plataforma Olivelas All In'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Formulário de Cadastro Real de Conta & Empresa no Supabase */
            <form onSubmit={handleRealRegisterSubmit} className="max-w-2xl mx-auto space-y-4">
              <div className="form-section" style={{ marginBottom: 0 }}>
                <div className="form-section-title">Criar Nova Conta & Empresa no Supabase</div>
                <div className="form-section-desc">
                  Os dados serão gravados em tempo real em <code>public.allin_companies</code> e{' '}
                  <code>public.profiles</code> com senha criptografada em bcrypt.
                </div>

                {authError && (
                  <div
                    className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs flex items-center gap-2 mb-3"
                    style={{ color: 'var(--status-danger)' }}
                  >
                    <AlertCircle size={16} />
                    <span>{authError}</span>
                  </div>
                )}

                <div className="form-grid">
                  <div className="field">
                    <label>Nome Completo do Administrador</label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="Ex.: Willian Oliveira"
                    />
                  </div>
                  <div className="field">
                    <label>E-mail Corporativo (Login Único)</label>
                    <input
                      type="email"
                      required
                      className="input"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="willian@suaempresa.com.br"
                    />
                  </div>
                  <div className="field">
                    <label>Senha de Acesso (Mín. 6 caracteres)</label>
                    <input
                      type="password"
                      required
                      className="input"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Crie uma senha segura"
                    />
                    <span className="hint">{pwStrength.message}</span>
                  </div>
                  <div className="field">
                    <label>Telefone / WhatsApp</label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+55 11 99999-0000"
                    />
                  </div>
                  <div className="field">
                    <label>Nome Fantasia da Empresa</label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={regTradeName}
                      onChange={(e) => setRegTradeName(e.target.value)}
                      placeholder="Ex.: Olivelas Empório & Saúde"
                    />
                  </div>
                  <div className="field">
                    <label>CNPJ da Empresa</label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={regCnpj}
                      onChange={(e) => setRegCnpj(e.target.value)}
                      placeholder="12.345.678/0001-90"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-5">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="btn btn-secondary"
                  >
                    Já tenho conta
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                    <UserPlus size={16} />
                    {isSubmitting ? 'Registrando no Supabase...' : 'Criar Conta & Empresa no Supabase'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export const RecoverPasswordPage: React.FC = () => {
  const { getActor, notify } = useApp();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email.trim()) return;
    if (newPassword !== confirmPassword) {
      setErrorMsg('A confirmação de senha não confere.');
      return;
    }

    setSaving(true);
    try {
      const res = await changeUserPasswordInSupabase(email.trim(), newPassword);
      if (!res.ok) {
        setErrorMsg(res.message);
        return;
      }

      await recordAuditEvent({
        actor: getActor(),
        module: 'auth',
        action: 'update',
        entityType: 'PasswordResetSupabase',
        entityId: email.trim(),
        summary: `Senha redefinida com criptografia bcrypt em public.profiles para ${email.trim()}.`,
      });
      setSubmitted(true);
      notify({
        type: 'success',
        title: 'Senha Atualizada no Supabase!',
        description: res.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 580, margin: '3rem auto', padding: '0 1.5rem' }}>
      <div className="card">
        <div className="card-header">
          <h1 style={{ fontSize: '1.15rem' }}>Redefinição Real de Senha — Supabase (public.profiles)</h1>
          <span className="badge badge-teal">Criptografia Bcrypt</span>
        </div>
        <div className="card-body">
          {submitted ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2" style={{ color: 'var(--status-success)' }}>
                <CheckCircle2 size={18} />
                <strong>Senha Atualizada com Sucesso no Supabase!</strong>
              </div>
              <p className="text-sm text-muted">
                O novo hash bcrypt foi gravado na tabela única <code>public.profiles</code> para a conta{' '}
                <code>{email}</code>. Você já pode autenticar-se com a nova senha.
              </p>
              <Link to="/login" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                Ir para Tela de Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <p className="text-sm text-muted">
                Atualize a senha da sua conta corporativa diretamente no banco de dados unificado{' '}
                <code>public.profiles</code> do Supabase.
              </p>

              {errorMsg && (
                <div
                  className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs"
                  style={{ color: 'var(--status-danger)' }}
                >
                  {errorMsg}
                </div>
              )}

              <div className="field">
                <label htmlFor="recover-email">E-mail Corporativo</label>
                <input
                  id="recover-email"
                  type="email"
                  required
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@olivelasallin.com.br"
                />
              </div>

              <div className="field">
                <label htmlFor="recover-new-pw">Nova Senha (Mínimo 6 caracteres)</label>
                <input
                  id="recover-new-pw"
                  type="password"
                  required
                  className="input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nova senha segura"
                />
              </div>

              <div className="field">
                <label htmlFor="recover-confirm-pw">Confirmar Nova Senha</label>
                <input
                  id="recover-confirm-pw"
                  type="password"
                  required
                  className="input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                />
              </div>

              <div className="flex items-center justify-between mt-2">
                <Link to="/login" className="btn btn-secondary">
                  Cancelar
                </Link>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Gravando no Supabase...' : 'Atualizar Senha no Supabase'}
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
              Todas as 16 plataformas Olivelas operam com banco de dados real no Supabase, RAG completo, API REST e HBAC granular. Clique em qualquer módulo para abrir sua interface no navegador.
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
                  <th className="num">Acesso Ao Vivo</th>
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
        <h1 style={{ fontSize: '1.25rem' }}>Termos de Uso — Plataforma Olivelas All In Enterprise</h1>
        <span className="badge badge-info">Governança & SLA</span>
      </div>
      <div className="card-body flex flex-col gap-3 text-sm">
        <p>
          <strong>1. Objeto da Plataforma:</strong> O Olivelas All In é uma plataforma SaaS multiempresa
          modular conectada ao Supabase PostgreSQL que unifica 16 plataformas verticais com login único
          (<code>public.profiles</code>), controle de acesso granular HBAC, RAG e API REST.
        </p>
        <p>
          <strong>2. Isolamento Multi-Schema e Segurança:</strong> Cada módulo comercial opera sobre seu
          próprio schema PostgreSQL dedicado no Supabase com autenticação compartilhada e trilha de
          auditoria imutável em <code>public.allin_audit_events</code>.
        </p>
        <p>
          <strong>3. Política de Preservação de Auditoria:</strong> Para conformidade regulatória e fiscal,
          registros empresariais suportam arquivamento lógico auditado com histórico completo de alterações.
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
          Política de Privacidade, Segurança e Isolamento Multiempresa (LGPD)
        </h1>
        <span className="badge badge-teal">Segurança & LGPD</span>
      </div>
      <div className="card-body flex flex-col gap-3 text-sm">
        <p>
          <strong>1. Isolamento Lógico por Tenant:</strong> Todos os registros operacionais possuem
          vínculo estrito com o identificador da empresa (<code>company_id</code>). A camada de rotas e o
          motor HBAC impedem acesso cruzado não autorizado entre empresas.
        </p>
        <p>
          <strong>2. Criptografia de Senhas e Mascaramento de Segredos:</strong> Todas as senhas são
          armazenadas exclusivamente como hashes bcrypt (<code>pgcrypto</code>) em <code>public.profiles</code>,
          e tokens de API/chaves de pagamento são mascarados na interface.
        </p>
        <p>
          <strong>3. Acesso de Suporte Auditado:</strong> Quando o Super Admin ingressa no contexto
          administrativo de uma empresa para suporte, a sessão mantém a identidade original do operador
          e grava evento explícito na trilha de auditoria do Supabase.
        </p>
      </div>
    </div>
  </div>
);
