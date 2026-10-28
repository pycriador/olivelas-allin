import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Boxes,
  Building2,
  Check,
  CreditCard,
  DatabaseBackup,
  FileSignature,
  Globe,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Moon,
  Package,
  Palette,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  Sun,
  Terminal,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LanguageCode, PermissionResource, ThemeMode } from '../../types/domain';
import { getUserActiveRoles } from '../../services/hbacService';
import { DARK_THEMES, findThemePreset, LIGHT_THEMES, ThemePreset } from '../../styles/themes';
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
  const [galleryOpen, setGalleryOpen] = useState(false);

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

  const renderThemeCard = (preset: ThemePreset) => {
    const isSelected = normalizedSelectValue === preset.id;
    return (
      <button
        key={preset.id}
        type="button"
        onClick={() => setTheme(preset.id)}
        className={`theme-swatch-card ${isSelected ? 'active' : ''}`}
        aria-pressed={isSelected}
      >
        <div className="theme-swatch-preview">
          <span
            className="theme-swatch-chip"
            style={{ backgroundColor: preset.tokens.bgSidebar }}
            title="Sidebar"
          />
          <span
            className="theme-swatch-chip"
            style={{ backgroundColor: preset.tokens.bgCanvas }}
            title="Canvas"
          />
          <span
            className="theme-swatch-chip"
            style={{ backgroundColor: preset.tokens.bgSurface }}
            title="Surface"
          />
          <span
            className="theme-swatch-chip"
            style={{ backgroundColor: preset.tokens.accentPrimary }}
            title="Accent Primary"
          />
          <span
            className="theme-swatch-chip"
            style={{ backgroundColor: preset.tokens.accentText }}
            title="Accent Focus"
          />
        </div>
        <div className="flex items-center justify-between gap-2 w-full">
          <strong className="text-xs">{preset.name[session.language]}</strong>
          {isSelected && <Check size={13} />}
        </div>
        <span className="text-xs text-muted" style={{ textAlign: 'left' }}>
          {preset.description[session.language]}
        </span>
      </button>
    );
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1">
        <Globe size={14} className="text-muted" />
        <select
          className="select"
          style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
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
          style={{ width: 'auto', maxWidth: '185px', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
          value={normalizedSelectValue}
          onChange={(e) => setTheme(e.target.value as ThemeMode)}
          aria-label="Selecionar tema visual (15 claros e 15 escuros)"
        >
          <option value="system">{t('common.theme.system')} (Auto)</option>
          <optgroup label="15 Temas Claros (Light)">
            {LIGHT_THEMES.map((preset) => (
              <option key={preset.id} value={preset.id}>
                ☀️ {preset.name[session.language]}
              </option>
            ))}
          </optgroup>
          <optgroup label="15 Temas Escuros (Dark)">
            {DARK_THEMES.map((preset) => (
              <option key={preset.id} value={preset.id}>
                🌙 {preset.name[session.language]}
              </option>
            ))}
          </optgroup>
        </select>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setGalleryOpen(true)}
          title="Abrir Galeria Visual de 30 Temas (15 Claros + 15 Escuros)"
          aria-label="Galeria de 30 temas"
        >
          <Palette size={13} />
          <span className="hide-on-xs">30 Temas</span>
        </button>
      </div>

      <ModalDialog
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        title="Seletor Visual de Temas — 15 Temas Claros & 15 Temas Escuros"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setTheme('system')}
            >
              Usar Tema do Sistema
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setGalleryOpen(false)}
            >
              Concluir
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <strong className="text-sm flex items-center gap-1">
                <Sun size={15} /> 15 Temas Claros Corporativos
              </strong>
              <span className="badge badge-info">15 Light Presets</span>
            </div>
            <div className="theme-gallery-grid">{LIGHT_THEMES.map(renderThemeCard)}</div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <strong className="text-sm flex items-center gap-1">
                <Moon size={15} /> 15 Temas Escuros Corporativos
              </strong>
              <span className="badge badge-teal">15 Dark Presets</span>
            </div>
            <div className="theme-gallery-grid">{DARK_THEMES.map(renderThemeCard)}</div>
          </div>
        </div>
      </ModalDialog>
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
        <span>
          <strong>OLIVELAS ALLIN — FUNDAÇÃO MOCK V1</strong> • Persistência local IndexedDB ativa •
          Governança multiempresa HBAC e trilha de auditoria reais no navegador
        </span>
        <span className="badge badge-info">{t('common.simulatedBadge')}</span>
      </div>
      <header className="app-topbar">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold"
            style={{ color: 'var(--text-primary)', fontSize: '1rem', textDecoration: 'none' }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              OA
            </span>
            <span>Olivelas Allin</span>
          </Link>
          <nav aria-label="Navegação Pública" className="flex items-center gap-3 text-sm">
            <Link to="/">{t('public.nav.home')}</Link>
            <Link to="/planos">{t('public.nav.plans')}</Link>
            <Link to="/termos">{t('public.nav.terms')}</Link>
            <Link to="/privacidade">{t('public.nav.privacy')}</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <TopPreferencesControls />
          {currentUser ? (
            <Link to={defaultConsolePath} className="btn btn-primary btn-sm">
              Ir para Console ({currentUser.name.split(' ')[0]})
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
          padding: '2rem 1.5rem',
          marginTop: '3rem',
        }}
      >
        <div
          style={{ maxWidth: 1280, margin: '0 auto' }}
          className="flex items-center justify-between gap-4 flex-wrap"
        >
          <div className="flex flex-col gap-1">
            <strong>Olivelas Allin — Plataforma SaaS Modular Multiempresa</strong>
            <span className="text-xs text-muted">
              Arquitetura multiempresa isolada • Controle de acesso hierárquico HBAC • Sem exclusão física de registros
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Link to="/planos">{t('public.nav.plans')}</Link>
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
          reason="Selecione um perfil de demonstração na tela de autenticação para acessar o console administrativo."
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
    { to: '/app/global', label: t('nav.dashboard'), icon: <LayoutDashboard size={16} />, resource: 'dashboard', end: true },
    { to: '/app/global/empresas', label: t('nav.companies'), icon: <Building2 size={16} />, resource: 'companies' },
    { to: '/app/global/usuarios', label: t('nav.users'), icon: <Users size={16} />, resource: 'users' },
    { to: '/app/global/papeis', label: t('nav.roles'), icon: <ShieldCheck size={16} />, resource: 'roles' },
    { to: '/app/global/modulos', label: t('nav.modules'), icon: <Package size={16} />, resource: 'modules' },
    { to: '/app/global/contratos', label: t('nav.contracts'), icon: <FileSignature size={16} />, resource: 'contracts' },
    { to: '/app/global/financeiro', label: t('nav.finance'), icon: <CreditCard size={16} />, resource: 'finance' },
    { to: '/app/global/meios-pagamento', label: t('nav.paymentMethods'), icon: <KeyRound size={16} />, resource: 'payment_methods' },
    { to: '/app/global/api-hub/servicos', label: t('nav.apiHub'), icon: <Terminal size={16} />, resource: 'api_hub' },
    { to: '/app/global/tickets', label: t('nav.tickets'), icon: <LifeBuoy size={16} />, resource: 'tickets' },
    { to: '/app/global/auditoria', label: t('nav.audit'), icon: <ScrollText size={16} />, resource: 'audit' },
    { to: '/app/global/relatorios', label: t('nav.reports'), icon: <BarChart3 size={16} />, resource: 'reports' },
  ];

  const cid = empresaId || session.activeCompanyId || 'emp-olivelas-matriz';
  const companyNavItems: SidebarNavItem[] = [
    { to: `/app/empresa/${cid}`, label: t('nav.dashboard'), icon: <LayoutDashboard size={16} />, resource: 'dashboard', requiredModuleCode: 'allin_core', end: true },
    { to: `/app/empresa/${cid}/usuarios`, label: t('nav.users'), icon: <Users size={16} />, resource: 'users', requiredModuleCode: 'allin_core' },
    { to: `/app/empresa/${cid}/papeis`, label: t('nav.roles'), icon: <ShieldCheck size={16} />, resource: 'roles', requiredModuleCode: 'allin_equipe' },
    { to: `/app/empresa/${cid}/modulos`, label: t('nav.modules'), icon: <Package size={16} />, resource: 'modules', requiredModuleCode: 'allin_core' },
    { to: `/app/empresa/${cid}/contratos`, label: t('nav.contracts'), icon: <FileSignature size={16} />, resource: 'contracts', requiredModuleCode: 'allin_contratos' },
    { to: `/app/empresa/${cid}/financeiro`, label: t('nav.finance'), icon: <CreditCard size={16} />, resource: 'finance', requiredModuleCode: 'allin_financeiro' },
    { to: `/app/empresa/${cid}/operacao/estoque`, label: t('nav.inventory'), icon: <Boxes size={16} />, resource: 'inventory', requiredModuleCode: 'allin_estoque' },
    { to: `/app/empresa/${cid}/operacao/vendas`, label: t('nav.orders'), icon: <ShoppingCart size={16} />, resource: 'orders', requiredModuleCode: 'allin_vendas' },
    { to: `/app/empresa/${cid}/operacao/crm`, label: t('nav.crm'), icon: <Activity size={16} />, resource: 'crm', requiredModuleCode: 'allin_crm' },
    { to: `/app/empresa/${cid}/tickets`, label: t('nav.tickets'), icon: <LifeBuoy size={16} />, resource: 'tickets', requiredModuleCode: 'allin_suporte' },
    { to: `/app/empresa/${cid}/auditoria`, label: t('nav.audit'), icon: <ScrollText size={16} />, resource: 'audit', requiredModuleCode: 'allin_core' },
    { to: `/app/empresa/${cid}/relatorios`, label: t('nav.reports'), icon: <BarChart3 size={16} />, resource: 'reports', requiredModuleCode: 'allin_analytics' },
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
        <div
          style={{
            padding: '1rem 1.15rem',
            borderBottom: '1px solid var(--bg-sidebar-hover)',
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
              gap: '0.6rem',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 4,
                backgroundColor: 'var(--bg-sidebar-active)',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.78rem',
              }}
            >
              OA
            </span>
            <span>Olivelas Allin</span>
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

        {/* Scope Switcher Pill in Sidebar */}
        <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--bg-sidebar-hover)' }}>
          <div className="text-xs" style={{ color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600 }}>
            ESCOPO OPERACIONAL ATIVO
          </div>
          <div className="flex flex-col gap-2">
            {isCurrentGlobalStaff && (
              <Link
                to="/app/global"
                onClick={() => setSidebarOpen(false)}
                className="btn btn-sm"
                style={{
                  justifyContent: 'flex-start',
                  backgroundColor: mode === 'global' ? 'var(--bg-sidebar-active)' : 'var(--bg-sidebar-hover)',
                  color: '#ffffff',
                }}
              >
                <Globe size={14} />
                {t('scope.global')}
              </Link>
            )}

            {accessibleCompanies.length > 0 && (
              <div className="flex flex-col gap-1">
                <label htmlFor="sidebar-tenant-select" className="text-xs" style={{ color: '#94a3b8' }}>
                  {t('scope.company')}:
                </label>
                <select
                  id="sidebar-tenant-select"
                  className="select"
                  style={{
                    backgroundColor: 'var(--bg-sidebar-hover)',
                    color: '#f8fafc',
                    borderColor: mode === 'company' ? 'var(--bg-sidebar-active)' : 'var(--bg-sidebar-hover)',
                    fontSize: '0.78rem',
                  }}
                  value={mode === 'company' ? cid : accessibleCompanies[0]?.id}
                  onChange={(e) => {
                    setSidebarOpen(false);
                    handleCompanySelect(e.target.value);
                  }}
                >
                  {accessibleCompanies.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.tradeName} ({comp.operationalStatus})
                    </option>
                  ))}
                </select>
                {mode === 'global' && accessibleCompanies[0] && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{
                      backgroundColor: 'var(--bg-sidebar-hover)',
                      color: '#cbd5e1',
                      justifyContent: 'flex-start',
                      marginTop: '0.2rem',
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

        {/* Navigation Links */}
        <nav
          aria-label="Módulos e Recursos Autorizados"
          style={{ padding: '0.75rem 0.65rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}
        >
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '4px',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#ffffff' : '#cbd5e1',
                backgroundColor: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
                textDecoration: 'none',
              })}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Active User Footer */}
        <div
          style={{
            padding: '0.85rem 1rem',
            borderTop: '1px solid #1e293b',
            backgroundColor: '#090d16',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col" style={{ minWidth: 0 }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#f8fafc' }}>
                {currentUser.name}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                {userActiveRoles.map((r) => r.name[session.language]).join(', ')}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ color: '#cbd5e1' }}
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              title={t('scope.logout')}
            >
              <LogOut size={15} />
            </button>
          </div>
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

        {/* Top Operational Bar */}
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
              {mode === 'company' && currentCompany && (
                <span className="text-xs text-muted mono">ID: {currentCompany.id}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Mock Profile Switcher */}
            <div className="flex items-center gap-1">
              <span className="badge badge-warning" title="Recurso exclusivo do Mock V1">
                Troca Rápida Mock:
              </span>
              <select
                className="select"
                style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
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
        title="Restaurar Dados Iniciais de Demonstração (Seed V1)"
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
          Esta operação irá redefinir todas as tabelas locais do <strong>IndexedDB</strong> (empresas,
          usuários, papéis HBAC, módulos, contratos, cobranças, API Hub e chamados) de volta ao estado
          original da especificação V1, registrando um evento de auditoria de restauração.
        </p>
      </ModalDialog>

      <ToastContainer />
    </div>
  );
};
