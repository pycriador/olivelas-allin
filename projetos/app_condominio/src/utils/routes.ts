import { AppView } from '../context/AppContext';

export interface RouteConfig {
  view: AppView;
  path: string;
  aliases: string[];
  title: string;
  section: string;
}

export const APP_ROUTES: RouteConfig[] = [
  {
    view: 'landing',
    path: '/landing',
    aliases: ['/', '/home', '/inicio-site'],
    title: 'Página Inicial',
    section: 'Geral',
  },
  {
    view: 'login',
    path: '/login',
    aliases: ['/entrar', '/acesso', '/auth'],
    title: 'Acesso à Plataforma',
    section: 'Autenticação',
  },
  {
    view: 'condo_select',
    path: '/condo-select',
    aliases: ['/selecionar-condominio', '/meus-condominios', '/trocar-condominio', '/tenants'],
    title: 'Seleção de Condomínio',
    section: 'Multi-Tenant',
  },
  {
    view: 'dashboard',
    path: '/dashboard',
    aliases: ['/app', '/inicio', '/morador'],
    title: 'Visão Geral do Morador',
    section: 'Principal',
  },
  {
    view: 'trustee_dashboard',
    path: '/trustee-dashboard',
    aliases: ['/painel-sindico', '/sindico', '/governanca-predial'],
    title: 'Painel do Síndico',
    section: 'Administrativo',
  },
  {
    view: 'admin_dashboard',
    path: '/admin-dashboard',
    aliases: ['/painel-administradora', '/administracao', '/financeiro-global'],
    title: 'Gestão Multi-Condomínio',
    section: 'Administrativo',
  },
  {
    view: 'bills',
    path: '/bills',
    aliases: ['/boletos', '/taxas', '/pagamentos', '/segunda-via', '/financeiro'],
    title: 'Boletos & Taxas Condominiais',
    section: 'Financeiro',
  },
  {
    view: 'documents',
    path: '/documents',
    aliases: ['/documentos', '/atas', '/convencao', '/regimento', '/drive', '/arquivos'],
    title: 'Documentos do Condomínio',
    section: 'Arquivo Digital',
  },
  {
    view: 'announcements',
    path: '/announcements',
    aliases: ['/comunicados', '/mural', '/avisos', '/noticias'],
    title: 'Mural de Comunicados',
    section: 'Comunicação',
  },
  {
    view: 'reservations',
    path: '/reservations',
    aliases: ['/reservas', '/espacos', '/lazer', '/salao-de-festas', '/churrasqueira'],
    title: 'Reservas de Áreas Comuns',
    section: 'Lazer & Espaços',
  },
  {
    view: 'calendar',
    path: '/calendar',
    aliases: ['/agenda', '/calendario', '/eventos'],
    title: 'Calendário Integrado',
    section: 'Eventos',
  },
  {
    view: 'requests',
    path: '/requests',
    aliases: ['/solicitacoes', '/chamados', '/atendimento', '/suporte', '/ordens-servico'],
    title: 'Solicitações & Chamados',
    section: 'Atendimento',
  },
  {
    view: 'occurrences',
    path: '/occurrences',
    aliases: ['/ocorrencias', '/livro-ocorrencias', '/reclamacoes', '/barulho', '/convivencia'],
    title: 'Livro de Ocorrências',
    section: 'Segurança & Convivência',
  },
  {
    view: 'assemblies',
    path: '/assemblies',
    aliases: ['/assembleias', '/votacao', '/pautas', '/deliberacoes', '/eleicao'],
    title: 'Assembleias Virtuais & Votação',
    section: 'Governança',
  },
  {
    view: 'global_admin',
    path: '/global-admin',
    aliases: ['/superadmin', '/tenants-gestao', '/feature-flags'],
    title: 'Painel Global SuperAdmin',
    section: 'SaaS Enterprise',
  },
  {
    view: 'permissions_matrix',
    path: '/permissions-matrix',
    aliases: ['/permissoes', '/rbac', '/matriz-permissoes'],
    title: 'Matriz RBAC de Permissões',
    section: 'Segurança',
  },
  {
    view: 'units_management',
    path: '/units-management',
    aliases: ['/unidades', '/moradores', '/apartamentos', '/cadastros'],
    title: 'Unidades & Moradores',
    section: 'Cadastros',
  },
  {
    view: 'resources_config',
    path: '/resources-config',
    aliases: ['/regras-espacos', '/config-espacos', '/taxas-lazer'],
    title: 'Configuração de Áreas & Lazer',
    section: 'Parâmetros',
  },
  {
    view: 'condo_settings',
    path: '/condo-settings',
    aliases: ['/configuracoes', '/ajustes-condominio', '/parametros'],
    title: 'Configurações do Condomínio',
    section: 'Parâmetros',
  },
  {
    view: 'modules_management',
    path: '/modules-management',
    aliases: ['/modulos', '/gestao-modulos', '/flags'],
    title: 'Feature Flags & Módulos',
    section: 'SaaS Enterprise',
  },
  {
    view: 'design_system',
    path: '/design-system',
    aliases: ['/ui', '/componentes', '/tokens', '/showcase'],
    title: 'Design System & Tokens',
    section: 'Fundação',
  },
];

/**
 * Match current URL pathname against route definitions
 */
export function getViewFromPath(pathname: string): AppView {
  const cleanPath = pathname.toLowerCase().replace(/\/+$/, '') || '/';

  // Exact match on canonical path or aliases
  for (const route of APP_ROUTES) {
    if (route.path.toLowerCase() === cleanPath || route.aliases.includes(cleanPath)) {
      return route.view;
    }
  }

  // Prefix match (for sub-paths like /documents/123)
  for (const route of APP_ROUTES) {
    if (route.path !== '/' && cleanPath.startsWith(route.path.toLowerCase())) {
      return route.view;
    }
    for (const alias of route.aliases) {
      if (alias !== '/' && cleanPath.startsWith(alias)) {
        return route.view;
      }
    }
  }

  // Default fallback for root
  if (cleanPath === '/') {
    return 'landing';
  }

  return 'dashboard';
}

/**
 * Get canonical URL pathname for a view
 */
export function getPathFromView(view: AppView): string {
  const found = APP_ROUTES.find((r) => r.view === view);
  return found ? found.path : '/dashboard';
}

/**
 * Get metadata and title info for a view
 */
export function getRouteConfig(view: AppView): RouteConfig {
  const found = APP_ROUTES.find((r) => r.view === view);
  return (
    found || {
      view,
      path: `/${view.replace(/_/g, '-')}`,
      aliases: [],
      title: 'Condomínio',
      section: 'Principal',
    }
  );
}
