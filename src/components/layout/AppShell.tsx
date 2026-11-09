import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Boxes,
  Building2,
  CreditCard,
  Database,
  DatabaseBackup,
  ExternalLink,
  FileSignature,
  FolderTree,
  Globe,
  KeyRound,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Moon,
  Package,
  ScrollText,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Sun,
  Terminal,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LanguageCode, PermissionResource, ThemeMode } from '../../types/domain';
import { getUserActiveRoles } from '../../services/hbacService';
import { DARK_THEMES, findThemePreset, LIGHT_THEMES } from '../../styles/themes';
import { AccessDeniedView, ModalDialog } from '../shared/SharedComponents';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();
  if (toasts.length === 0) return null;
  return (
    <div className="toast-tray" role="status" aria-live="polite">
      {toasts.map((tst) => (
        <div key={tst.id} className={`toast-item toast-${tst.type}`}>
          <div className="flex flex-col gap-1">
            <strong className="text-sm">{tst.title}</strong>
            {tst.description && <span className="text-xs text-muted">{tst.description}</span>}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => dismissToast(tst.id)}
            aria-label="Fechar notificação"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export const TopPreferencesControls: React.FC = () => {
  const { session, setLanguage, setTheme, t } = useApp();

  const activePreset = findThemePreset(session.theme);
  const isDarkActive =
    session.theme === 'dark' ||
    session.theme.startsWith('dark-') ||
    activePreset?.category === 'dark';

  const normalizedSelectValue =
    session.theme === 'light'
      ? LIGHT_THEMES[0].id
      : session.theme === 'dark'
        ? DARK_THEMES[0].id
        : session.theme;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1">
        <Globe size={14} className="text-muted" />
        <select
          className="select"
          style={{ width: 'auto', padding: '0.32rem 0.65rem', fontSize: '0.75rem', borderRadius: '0.65rem' }}
          value={session.language}
          onChange={(e) => setLanguage(e.target.value as LanguageCode)}
          aria-label="Selecionar idioma"
        >
          <option value="pt-BR">PT-BR</option>
          <option value="en">EN</option>
          <option value="es">ES</option>
        </select>
      </div>

      <div className="flex items-center gap-1">
        {isDarkActive ? (
          <Moon size={14} className="text-muted" />
        ) : (
          <Sun size={14} className="text-muted" />
        )}
        <select
          className="select"
          style={{ width: 'auto', maxWidth: '185px', padding: '0.32rem 0.65rem', fontSize: '0.75rem', borderRadius: '0.65rem' }}
          value={normalizedSelectValue}
          onChange={(e) => setTheme(e.target.value as ThemeMode)}
          aria-label="Selecionar tema visual"
        >
          <option value="system">{t('common.theme.system')} (Auto)</option>
          <optgroup label="Temas Claros (Light)">
            {LIGHT_THEMES.map((preset) => (
              <option key={preset.id} value={preset.id}>
                ☀️ {preset.name[session.language]}
              </option>
            ))}
          </optgroup>
          <optgroup label="Temas Escuros (Dark)">
            {DARK_THEMES.map((preset) => (
              <option key={preset.id} value={preset.id}>
                🌙 {preset.name[session.language]}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
    </div>
  );
};

export const PublicLayout: React.FC = () => {
  const { currentUser, isCurrentGlobalStaff, session, t } = useApp();
  const defaultConsolePath = isCurrentGlobalStaff
    ? '/app/global'
    : `/app/empresa/${session.activeCompanyId || 'emp-olivelas-matriz'}`;

  return (
    <div className="app-main">
      <div className="simulated-ribbon">
        <span className="flex items-center gap-2 flex-wrap">
          <Database size={13} style={{ color: 'var(--accent-primary)' }} />
          <span>
            <strong>OLIVELAS ALL IN — ECOSSISTEMA MULTI-SCHEMA SUPABASE</strong> • 16 Módulos Comerciais Oficiais • Login Único em <code>public.profiles</code> • Governança HBAC
          </span>
        </span>
        <span className="badge badge-success">PostgreSQL 17 + IndexedDB</span>
      </div>
      <header className="app-topbar">
        <div className="flex items-center gap-6 flex-wrap">
          <Link
            to="/"
            className="flex items-center gap-2.5"
            style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, #1d4ed8 100%)',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1rem',
                boxShadow: 'var(--shadow-primary)',
              }}
            >
              O
            </span>
            <div className="flex flex-col">
              <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                Olivelas All In
              </span>
              <span className="mono" style={{ fontSize: '0.64rem', color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
                GESTÃO & 16 PLATAFORMAS
              </span>
            </div>
          </Link>
          <nav aria-label="Navegação Pública" className="flex items-center gap-4 text-sm font-medium">
            <Link to="/" style={{ color: 'var(--text-secondary)' }}>{t('public.nav.home')}</Link>
            <Link to="/planos" style={{ color: 'var(--text-secondary)' }}>{t('public.nav.plans')}</Link>
            <Link
              to="/demo/allin_gestao_estoque"
              className="flex items-center gap-1 font-semibold"
              style={{ color: 'var(--accent-primary)' }}
            >
              <Sparkles size={14} />
              Demonstração dos 16 Módulos
            </Link>
            <Link to="/termos" style={{ color: 'var(--text-secondary)' }}>{t('public.nav.terms')}</Link>
            <Link to="/privacidade" style={{ color: 'var(--text-secondary)' }}>{t('public.nav.privacy')}</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <TopPreferencesControls />
          {currentUser ? (
            <Link to={defaultConsolePath} className="btn btn-primary btn-sm">
              <LayoutDashboard size={14} />
              Acessar Painel ({currentUser.name.split(' ')[0]})
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              {t('public.nav.login')}
            </Link>
          )}
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          padding: '2.5rem 1.5rem',
          marginTop: '3rem',
        }}
      >
        <div
          style={{ maxWidth: 1360, margin: '0 auto' }}
          className="flex items-center justify-between gap-4 flex-wrap"
        >
          <div className="flex items-center gap-3">
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: '0.6rem',
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, #1d4ed8 100%)',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.85rem',
              }}
            >
              O
            </span>
            <div className="flex flex-col gap-0.5">
              <strong className="text-sm">Olivelas All In — Plataforma SaaS Modular Multiempresa</strong>
              <span className="text-xs text-muted">
                16 Plataformas Comerciais Olivelas • Schemas PostgreSQL dedicados no Supabase • Design referência Gestão de Estoque
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link to="/planos">{t('public.nav.plans')}</Link>
            <Link to="/demo/allin_gestao_estoque">Demo Interativa</Link>
            <Link to="/termos">{t('public.nav.terms')}</Link>
            <Link to="/privacidade">{t('public.nav.privacy')}</Link>
            <Link to="/login">{t('public.nav.login')}</Link>
          </div>
        </div>
      </footer>
      <ToastContainer />
    </div>
  );
};

interface SidebarNavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  resource: PermissionResource;
  requiredModuleCode?: string;
  end?: boolean;
  group: 'top' | 'commercial' | 'operations' | 'governance';
  badgeText?: string;
}

export const WorkspaceLayout: React.FC<{ mode: 'global' | 'company' }> = ({ mode }) => {
  const {
    currentUser,
    roles,
    companies,
    users,
    session,
    hasPermission,
    canAccessTenant,
    isModuleSubscribed,
    isCurrentGlobalStaff,
    loginAsUser,
    logout,
    switchCompanyContext,
    stopSupportImpersonation,
    resetDemoDatabase,
    t,
  } = useApp();
  const { empresaId } = useParams<{ empresaId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  if (!currentUser) {
    return (
      <div className="app-main">
        <AccessDeniedView
          title="Sessão Não Autenticada"
          reason="Autentique-se com seu e-mail e senha corporativos no Supabase para acessar o console administrativo."
          backTo="/login"
        />
      </div>
    );
  }

  // Validate Global Scope Access
  if (mode === 'global' && !isCurrentGlobalStaff) {
    const fallbackCompanyId = currentUser.companyIds[0] || 'emp-olivelas-matriz';
    return (
      <div className="app-main">
        <AccessDeniedView
          title="Escopo Global Restrito"
          reason={`O perfil atual (${currentUser.name}) possui escopo estritamente empresarial e não está autorizado a operar no Console Global da plataforma.`}
          requiredPermission="scope:global"
          backTo={`/app/empresa/${fallbackCompanyId}`}
        />
      </div>
    );
  }

  // Validate Company Scope & Tenant Isolation
  const currentCompany = mode === 'company' ? companies.find((c) => c.id === empresaId) : null;
  if (mode === 'company') {
    if (!empresaId || !currentCompany) {
      return (
        <div className="app-main">
          <AccessDeniedView
            title="Empresa Não Encontrada"
            reason={`O identificador de empresa "${empresaId}" não existe ou não está disponível neste ambiente.`}
            backTo={isCurrentGlobalStaff ? '/app/global/empresas' : '/login'}
          />
        </div>
      );
    }

    if (!canAccessTenant(empresaId)) {
      const allowedFirst = currentUser.companyIds[0];
      return (
        <div className="app-main">
          <AccessDeniedView
            title="Isolamento Multiempresa (Tenant Isolation Guard)"
            reason={`Acesso negado à empresa "${currentCompany.tradeName}" (${empresaId}). Uma empresa não pode visualizar ou alterar dados de outra por meio de manipulação manual de IDs na URL.`}
            requiredPermission={`tenant:${empresaId} (Empresas autorizadas ao usuário: ${currentUser.companyIds.join(', ') || 'nenhuma'})`}
            backTo={allowedFirst ? `/app/empresa/${allowedFirst}` : '/login'}
          />
        </div>
      );
    }
  }

  const globalNavItems: SidebarNavItem[] = [
    { to: '/app/global', label: t('nav.dashboard'), icon: <LayoutDashboard size={15} />, resource: 'dashboard', end: true, group: 'top' },
    { to: '/app/global/ecossistema', label: '16 Plataformas Olivelas', icon: <Sparkles size={15} />, resource: 'modules', group: 'top', badgeText: '16 Apps' },
    { to: '/app/global/modulos', label: t('nav.modules'), icon: <Package size={15} />, resource: 'modules', group: 'commercial', badgeText: 'Comercial' },
    { to: '/app/global/empresas', label: t('nav.companies'), icon: <Building2 size={15} />, resource: 'companies', group: 'commercial' },
    { to: '/app/global/contratos', label: t('nav.contracts'), icon: <FileSignature size={15} />, resource: 'contracts', group: 'commercial' },
    { to: '/app/global/financeiro', label: t('nav.finance'), icon: <CreditCard size={15} />, resource: 'finance', group: 'commercial' },
    { to: '/app/global/meios-pagamento', label: t('nav.paymentMethods'), icon: <KeyRound size={15} />, resource: 'payment_methods', group: 'commercial' },
    { to: '/app/global/usuarios', label: t('nav.users'), icon: <Users size={15} />, resource: 'users', group: 'governance' },
    { to: '/app/global/papeis', label: t('nav.roles'), icon: <ShieldCheck size={15} />, resource: 'roles', group: 'governance' },
    { to: '/app/global/api-hub/servicos', label: t('nav.apiHub'), icon: <Terminal size={15} />, resource: 'api_hub', group: 'governance' },
    { to: '/app/global/tickets', label: t('nav.tickets'), icon: <LifeBuoy size={15} />, resource: 'tickets', group: 'governance' },
    { to: '/app/global/auditoria', label: t('nav.audit'), icon: <ScrollText size={15} />, resource: 'audit', group: 'governance' },
    { to: '/app/global/relatorios', label: t('nav.reports'), icon: <BarChart3 size={15} />, resource: 'reports', group: 'governance' },
  ];

  const cid = empresaId || session.activeCompanyId || 'emp-olivelas-matriz';
  const companyNavItems: SidebarNavItem[] = [
    { to: `/app/empresa/${cid}`, label: t('nav.dashboard'), icon: <LayoutDashboard size={15} />, resource: 'dashboard', end: true, group: 'top' },
    { to: `/app/empresa/${cid}/ecossistema`, label: '16 Plataformas Olivelas', icon: <Sparkles size={15} />, resource: 'modules', group: 'top', badgeText: '16 Apps' },
    { to: `/app/empresa/${cid}/modulos`, label: t('nav.modules'), icon: <Package size={15} />, resource: 'modules', group: 'commercial', badgeText: 'Loja' },
    { to: `/app/empresa/${cid}/contratos`, label: t('nav.contracts'), icon: <FileSignature size={15} />, resource: 'contracts', requiredModuleCode: 'allin_contratos', group: 'commercial' },
    { to: `/app/empresa/${cid}/financeiro`, label: t('nav.finance'), icon: <CreditCard size={15} />, resource: 'finance', requiredModuleCode: 'allin_financeiro', group: 'commercial' },
    { to: `/app/empresa/${cid}/operacao/estoque`, label: t('nav.inventory'), icon: <Boxes size={15} />, resource: 'inventory', requiredModuleCode: 'allin_estoque', group: 'operations' },
    { to: `/app/empresa/${cid}/operacao/vendas`, label: t('nav.orders'), icon: <ShoppingCart size={15} />, resource: 'orders', requiredModuleCode: 'allin_vendas', group: 'operations' },
    { to: `/app/empresa/${cid}/operacao/crm`, label: t('nav.crm'), icon: <Activity size={15} />, resource: 'crm', requiredModuleCode: 'allin_crm', group: 'operations' },
    { to: `/app/empresa/${cid}/usuarios`, label: t('nav.users'), icon: <Users size={15} />, resource: 'users', group: 'governance' },
    { to: `/app/empresa/${cid}/papeis`, label: t('nav.roles'), icon: <ShieldCheck size={15} />, resource: 'roles', requiredModuleCode: 'allin_equipe', group: 'governance' },
    { to: `/app/empresa/${cid}/tickets`, label: t('nav.tickets'), icon: <LifeBuoy size={15} />, resource: 'tickets', requiredModuleCode: 'allin_suporte', group: 'governance' },
    { to: `/app/empresa/${cid}/auditoria`, label: t('nav.audit'), icon: <ScrollText size={15} />, resource: 'audit', group: 'governance' },
    { to: `/app/empresa/${cid}/relatorios`, label: t('nav.reports'), icon: <BarChart3 size={15} />, resource: 'reports', requiredModuleCode: 'allin_analytics', group: 'governance' },
  ];

  const visibleNavItems = (mode === 'global' ? globalNavItems : companyNavItems).filter((item) => {
    const allowedByHbac = hasPermission(item.resource, 'view', mode === 'company' ? cid : undefined);
    if (!allowedByHbac) return false;
    if (mode === 'company' && item.requiredModuleCode) {
      return isModuleSubscribed(cid, item.requiredModuleCode);
    }
    return true;
  });

  const userActiveRoles = getUserActiveRoles(currentUser, roles);
  const accessibleCompanies = isCurrentGlobalStaff
    ? companies
    : companies.filter((c) => currentUser.companyIds.includes(c.id));

  const handleQuickProfileChange = async (newUserId: string) => {
    const target = users.find((u) => u.id === newUserId);
    if (!target) return;
    await loginAsUser(target.id);
    const targetIsGlobal = getUserActiveRoles(target, roles).some((r) => r.scope === 'global');
    if (targetIsGlobal) {
      navigate('/app/global');
    } else {
      navigate(`/app/empresa/${target.companyIds[0] || 'emp-olivelas-matriz'}`);
    }
  };

  const handleCompanySelect = async (newCompanyId: string) => {
    await switchCompanyContext(newCompanyId);
    navigate(`/app/empresa/${newCompanyId}`);
  };

  const renderNavLink = (item: SidebarNavItem) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      onClick={() => setSidebarOpen(false)}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.65rem',
        padding: '0.52rem 0.78rem',
        borderRadius: '0.75rem',
        fontSize: '0.79rem',
        fontWeight: isActive ? 600 : 500,
        color: isActive ? '#ffffff' : '#cbd5e1',
        background: isActive
          ? 'linear-gradient(135deg, var(--bg-sidebar-active) 0%, #1d4ed8 100%)'
          : 'transparent',
        boxShadow: isActive ? '0 4px 12px -2px rgba(37, 99, 235, 0.35)' : 'none',
        textDecoration: 'none',
        transition: 'all 0.16s ease',
      })}
    >
      <span className="flex items-center gap-2.5 truncate">
        {item.icon}
        <span className="truncate">{item.label}</span>
      </span>
      {item.badgeText && (
        <span
          style={{
            fontSize: '0.64rem',
            fontWeight: 700,
            padding: '0.1rem 0.42rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255,255,255,0.16)',
            color: '#fff',
          }}
        >
          {item.badgeText}
        </span>
      )}
    </NavLink>
  );

  const topItems = visibleNavItems.filter((i) => i.group === 'top');
  const commercialItems = visibleNavItems.filter((i) => i.group === 'commercial');
  const operationItems = visibleNavItems.filter((i) => i.group === 'operations');
  const governanceItems = visibleNavItems.filter((i) => i.group === 'governance');

  const ecosystemBaseRoute =
    mode === 'global' ? '/app/global/ecossistema' : `/app/empresa/${cid}/ecossistema`;

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside className={`app-sidebar ${sidebarOpen ? 'is-open' : ''}`} aria-label="Menu Lateral">
        {/* Brand Header (Padrão Olivelas Gestão de Estoque) */}
        <div
          style={{
            padding: '1rem 1.1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              color: '#ffffff',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, var(--bg-sidebar-active) 0%, #1d4ed8 100%)',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.95rem',
                boxShadow: '0 4px 14px -2px rgba(37, 99, 235, 0.45)',
              }}
            >
              O
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '-0.015em', color: '#f8fafc' }}>
                Olivelas All In
              </div>
              <span
                className="mono"
                style={{ fontSize: '0.62rem', color: '#94a3b8', display: 'block', letterSpacing: '0.05em' }}
              >
                ECOSSISTEMA & GESTÃO
              </span>
            </div>
          </Link>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ color: '#94a3b8', display: sidebarOpen ? 'inline-flex' : 'none' }}
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu lateral"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tenant / Scope Selector Card (Estilo AppLayout do gestao_estoque) */}
        <div style={{ padding: '0.85rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div
            style={{
              padding: '0.7rem',
              borderRadius: '0.85rem',
              backgroundColor: 'rgba(30, 41, 59, 0.55)',
              border: '1px solid rgba(148, 163, 184, 0.16)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.55rem',
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                style={{
                  padding: '0.42rem',
                  borderRadius: '0.6rem',
                  backgroundColor: mode === 'global' ? 'rgba(59, 130, 246, 0.18)' : 'rgba(20, 184, 166, 0.18)',
                  color: mode === 'global' ? '#60a5fa' : '#2dd4bf',
                  display: 'inline-flex',
                  flexShrink: 0,
                }}
              >
                {mode === 'global' ? <Globe size={16} /> : <Building2 size={16} />}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  className="truncate"
                  style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}
                  title={mode === 'global' ? t('scope.global') : currentCompany?.tradeName}
                >
                  {mode === 'global' ? t('scope.global') : currentCompany?.tradeName}
                </div>
                <div className="flex items-center gap-1 flex-wrap mt-0.5">
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 600,
                      padding: '0.08rem 0.42rem',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(59, 130, 246, 0.16)',
                      color: '#93c5fd',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                    }}
                  >
                    {mode === 'global' ? 'Governança Global' : 'Matriz / Tenant'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 600,
                      padding: '0.08rem 0.42rem',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(148, 163, 184, 0.14)',
                      color: '#cbd5e1',
                    }}
                  >
                    {userActiveRoles[0]?.name[session.language] || 'Membro'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              {isCurrentGlobalStaff && (
                <Link
                  to="/app/global"
                  onClick={() => setSidebarOpen(false)}
                  className="btn btn-sm"
                  style={{
                    justifyContent: 'flex-start',
                    borderRadius: '0.6rem',
                    backgroundColor: mode === 'global' ? 'var(--bg-sidebar-active)' : 'rgba(15, 23, 42, 0.6)',
                    color: '#ffffff',
                    fontSize: '0.73rem',
                    padding: '0.35rem 0.65rem',
                  }}
                >
                  <Globe size={13} />
                  {t('scope.global')}
                </Link>
              )}

              {accessibleCompanies.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="sidebar-tenant-select" style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>
                    Alternar Unidade / Empresa:
                  </label>
                  <select
                    id="sidebar-tenant-select"
                    className="select"
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.75)',
                      color: '#f8fafc',
                      borderColor: mode === 'company' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(148, 163, 184, 0.25)',
                      fontSize: '0.74rem',
                      padding: '0.35rem 0.55rem',
                      borderRadius: '0.6rem',
                    }}
                    value={mode === 'company' ? cid : accessibleCompanies[0]?.id}
                    onChange={(e) => {
                      setSidebarOpen(false);
                      handleCompanySelect(e.target.value);
                    }}
                  >
                    {accessibleCompanies.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        [Matriz] {comp.tradeName}
                      </option>
                    ))}
                  </select>
                  {mode === 'global' && accessibleCompanies[0] && (
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{
                        backgroundColor: 'rgba(30, 41, 59, 0.8)',
                        color: '#e2e8f0',
                        justifyContent: 'flex-start',
                        borderRadius: '0.6rem',
                        fontSize: '0.72rem',
                        padding: '0.32rem 0.65rem',
                      }}
                      onClick={() => {
                        setSidebarOpen(false);
                        handleCompanySelect(session.activeCompanyId || accessibleCompanies[0].id);
                      }}
                    >
                      <Building2 size={13} />
                      Abrir Ambiente da Empresa
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Links Grouped Like gestao_estoque */}
        <nav
          aria-label="Módulos e Recursos Autorizados"
          style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto' }}
        >
          {/* Top Primary Items */}
          <div className="flex flex-col gap-1">
            {topItems.map(renderNavLink)}
          </div>

          {/* Quick Demo Shortcuts for Flagship Olivelas Commercial Modules */}
          <div>
            <div
              className="flex items-center gap-2 px-2 mb-1"
              style={{ fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}
            >
              <Layers size={12} />
              <span>Acesso Rápido — Plataformas</span>
            </div>
            <div
              style={{
                marginLeft: '0.45rem',
                paddingLeft: '0.55rem',
                borderLeft: '1px solid rgba(148, 163, 184, 0.16)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
              }}
            >
              {[
                { slug: 'allin_gestao_estoque', label: 'Gestão de Estoque & PDV' },
                { slug: 'allin_personal_trainer', label: 'Personal Trainer' },
                { slug: 'allin_agendamento_simples', label: 'Consultório & Odonto' },
                { slug: 'allin_restaurante', label: 'Restaurantes & KDS' },
                { slug: 'allin_delivery', label: 'Central de Delivery' },
              ].map((quick) => {
                const target = `${ecosystemBaseRoute}/${quick.slug}`;
                const active = location.pathname === target;
                return (
                  <Link
                    key={quick.slug}
                    to={target}
                    onClick={() => setSidebarOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.38rem 0.65rem',
                      borderRadius: '0.6rem',
                      fontSize: '0.75rem',
                      fontWeight: active ? 600 : 500,
                      color: active ? '#ffffff' : '#94a3b8',
                      backgroundColor: active ? 'var(--bg-sidebar-active)' : 'transparent',
                      textDecoration: 'none',
                    }}
                  >
                    <span className="truncate">{quick.label}</span>
                    <ExternalLink size={11} style={{ opacity: 0.7, flexShrink: 0 }} />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Commercial & Modules Group */}
          {commercialItems.length > 0 && (
            <div>
              <div
                className="flex items-center gap-2 px-2 mb-1"
                style={{ fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}
              >
                <FolderTree size={12} />
                <span>Comercial & Licenciamento</span>
              </div>
              <div
                style={{
                  marginLeft: '0.45rem',
                  paddingLeft: '0.55rem',
                  borderLeft: '1px solid rgba(148, 163, 184, 0.16)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                }}
              >
                {commercialItems.map(renderNavLink)}
              </div>
            </div>
          )}

          {/* Operations Group */}
          {operationItems.length > 0 && (
            <div>
              <div
                className="flex items-center gap-2 px-2 mb-1"
                style={{ fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}
              >
                <TrendingUp size={12} />
                <span>Operação (Exemplos Base)</span>
              </div>
              <div
                style={{
                  marginLeft: '0.45rem',
                  paddingLeft: '0.55rem',
                  borderLeft: '1px solid rgba(148, 163, 184, 0.16)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                }}
              >
                {operationItems.map(renderNavLink)}
              </div>
            </div>
          )}

          {/* Governance & Audit Group */}
          {governanceItems.length > 0 && (
            <div>
              <div
                className="flex items-center gap-2 px-2 mb-1"
                style={{ fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}
              >
                <Shield size={12} />
                <span>Governança, HBAC & Auditoria</span>
              </div>
              <div
                style={{
                  marginLeft: '0.45rem',
                  paddingLeft: '0.55rem',
                  borderLeft: '1px solid rgba(148, 163, 184, 0.16)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                }}
              >
                {governanceItems.map(renderNavLink)}
              </div>
            </div>
          )}
        </nav>

        {/* Active User Footer (Estilo gestao_estoque) */}
        <div
          style={{
            padding: '0.85rem 1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(6, 9, 17, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.65rem',
          }}
        >
          <div className="flex items-center gap-2.5" style={{ minWidth: 0 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '9999px',
                backgroundColor: 'rgba(59, 130, 246, 0.22)',
                color: '#60a5fa',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.75rem',
                flexShrink: 0,
                border: '1px solid rgba(59, 130, 246, 0.35)',
              }}
            >
              {currentUser.name
                .split(' ')
                .slice(0, 2)
                .map((n) => n[0])
                .join('')}
            </div>
            <div className="flex flex-col truncate" style={{ minWidth: 0 }}>
              <span className="truncate" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f8fafc' }}>
                {currentUser.name}
              </span>
              <span className="truncate" style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                {currentUser.email}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ color: '#cbd5e1', padding: '0.4rem' }}
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            title={t('scope.logout')}
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      <div className="app-main">
        {/* Support Impersonation Audit Ribbon */}
        {session.impersonation?.isActive && (
          <div className="impersonation-ribbon" role="region" aria-label="Modo de Suporte Auditado">
            <div className="flex items-center gap-2 flex-wrap">
              <UserCheck size={16} />
              <span>
                <strong>{t('scope.impersonating')}:</strong> Operando no ambiente de{' '}
                <u>{session.impersonation.targetCompanyName}</u> mantendo identidade auditada de{' '}
                <strong>{currentUser.name}</strong> (Motivo: {session.impersonation.reason})
              </span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={async () => {
                await stopSupportImpersonation();
                navigate('/app/global/empresas');
              }}
            >
              {t('scope.exitImpersonation')}
            </button>
          </div>
        )}

        {/* Top Operational Bar (Glassmorphic like gestao_estoque Header) */}
        <header className="app-topbar">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Abrir navegação"
            >
              <Menu size={15} />
            </button>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`badge ${mode === 'global' ? 'badge-info' : 'badge-teal'}`}>
                {mode === 'global' ? t('scope.global') : `${t('scope.company')}: ${currentCompany?.tradeName}`}
              </span>
              <span className="badge badge-success">
                <Sparkles size={11} /> 16 Módulos Olivelas Ativos
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Profile Switcher */}
            <div className="flex items-center gap-1.5">
              <span className="badge badge-info" title="Alternar perfil HBAC instantaneamente">
                Perfil:
              </span>
              <select
                className="select"
                style={{ width: 'auto', padding: '0.3rem 0.65rem', fontSize: '0.75rem', borderRadius: '0.65rem' }}
                value={currentUser.id}
                onChange={(e) => handleQuickProfileChange(e.target.value)}
                aria-label="Trocar usuário de demonstração"
              >
                {users.map((u) => {
                  const uRoles = getUserActiveRoles(u, roles);
                  return (
                    <option key={u.id} value={u.id}>
                      {u.name} — {uRoles[0]?.name[session.language] || 'Sem papel'}
                    </option>
                  );
                })}
              </select>
            </div>

            <TopPreferencesControls />

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setConfirmResetOpen(true)}
              title={t('scope.restoreDemo')}
            >
              <DatabaseBackup size={14} />
              <span className="text-xs">{t('scope.restoreDemo')}</span>
            </button>
          </div>
        </header>

        <main className="app-content" key={location.pathname}>
          <Outlet />
        </main>
      </div>

      <ModalDialog
        open={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        title="Restaurar Dados Iniciais de Demonstração (16 Módulos Comerciais Olivelas)"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setConfirmResetOpen(false)}>
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={async () => {
                await resetDemoDatabase();
                setConfirmResetOpen(false);
              }}
            >
              <DatabaseBackup size={15} />
              Confirmar Restauração Completa
            </button>
          </>
        }
      >
        <p className="text-sm">
          Esta operação irá restaurar a base operacional dos <strong>16 Módulos Comerciais Olivelas</strong> e
          dos <strong>10 Módulos de Exemplo</strong> sincronizados com o <strong>Supabase PostgreSQL</strong>,
          registrando um evento oficial na trilha de auditoria.
        </p>
      </ModalDialog>

      <ToastContainer />
    </div>
  );
};
