import { UserRole, PermissionKey, Membership } from '../types';

/**
 * Default permission matrix mapped per standard system role
 */
export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  resident: [
    'view_bills',
    'pay_bills',
    'view_documents',
    'view_announcements',
    'book_resources',
    'view_requests',
    'create_requests',
    'view_occurrences',
    'create_occurrences',
    'participate_assemblies',
    'vote_assemblies',
  ],
  trustee: [
    'view_bills',
    'pay_bills',
    'view_financials',
    'manage_financials',
    'view_documents',
    'upload_documents',
    'manage_documents',
    'view_announcements',
    'create_announcements',
    'publish_announcements',
    'book_resources',
    'approve_reservations',
    'manage_resources',
    'view_requests',
    'create_requests',
    'manage_requests',
    'view_occurrences',
    'create_occurrences',
    'manage_occurrences',
    'participate_assemblies',
    'vote_assemblies',
    'create_assemblies',
    'manage_units',
    'manage_users',
    'manage_condo_settings',
  ],
  admin: [
    'view_bills',
    'pay_bills',
    'view_financials',
    'manage_financials',
    'view_documents',
    'upload_documents',
    'manage_documents',
    'view_announcements',
    'create_announcements',
    'publish_announcements',
    'book_resources',
    'approve_reservations',
    'manage_resources',
    'view_requests',
    'create_requests',
    'manage_requests',
    'view_occurrences',
    'create_occurrences',
    'manage_occurrences',
    'participate_assemblies',
    'vote_assemblies',
    'create_assemblies',
    'manage_units',
    'manage_users',
    'manage_condo_settings',
  ],
  global_admin: [
    'view_bills',
    'pay_bills',
    'view_financials',
    'manage_financials',
    'view_documents',
    'upload_documents',
    'manage_documents',
    'view_announcements',
    'create_announcements',
    'publish_announcements',
    'book_resources',
    'approve_reservations',
    'manage_resources',
    'view_requests',
    'create_requests',
    'manage_requests',
    'view_occurrences',
    'create_occurrences',
    'manage_occurrences',
    'participate_assemblies',
    'vote_assemblies',
    'create_assemblies',
    'manage_units',
    'manage_users',
    'manage_condo_settings',
    'manage_global_modules',
    'manage_tenants',
  ],
  concierge: [
    'view_announcements',
    'view_requests',
    'manage_requests',
    'view_occurrences',
    'create_occurrences',
    'manage_occurrences',
    'view_documents',
    'book_resources',
  ],
  fiscal_board: [
    'view_bills',
    'view_financials',
    'view_documents',
    'view_announcements',
    'participate_assemblies',
    'vote_assemblies',
    'view_occurrences',
  ],
};

/**
 * Check if the given role or membership grants a specific permission.
 */
export function can(
  permission: PermissionKey,
  role?: UserRole,
  membership?: Membership | null
): boolean {
  if (!role && !membership) return false;

  // Global Admin always has full access
  if (role === 'global_admin' || membership?.role === 'global_admin') {
    return true;
  }

  // Explicit membership custom permissions override
  if (membership?.permissions && membership.permissions.includes(permission)) {
    return true;
  }

  // Fallback to standard role defaults
  const activeRole = membership?.role || role;
  if (activeRole && ROLE_DEFAULT_PERMISSIONS[activeRole]) {
    return ROLE_DEFAULT_PERMISSIONS[activeRole].includes(permission);
  }

  return false;
}

/**
 * Convenience labels and groupings for UI display
 */
export const PERMISSION_GROUPS: {
  category: string;
  permissions: { key: PermissionKey; label: string; description: string }[];
}[] = [
  {
    category: 'Financeiro',
    permissions: [
      { key: 'view_bills', label: 'Visualizar Boletos', description: 'Permite consultar boletos da própria unidade' },
      { key: 'pay_bills', label: 'Pagar Boletos & PIX', description: 'Permite efetuar pagamento e obter código PIX' },
      { key: 'view_financials', label: 'Prestação de Contas', description: 'Consultar balancetes e receitas do condomínio' },
      { key: 'manage_financials', label: 'Gerir Financeiro', description: 'Conciliar extratos e taxas condominiais' },
    ],
  },
  {
    category: 'Reservas & Áreas Comuns',
    permissions: [
      { key: 'book_resources', label: 'Fazer Reservas', description: 'Agendar salões de festas, churrasqueiras e quadras' },
      { key: 'approve_reservations', label: 'Aprovar Reservas', description: 'Aceitar ou rejeitar pedidos de agendamento' },
      { key: 'manage_resources', label: 'Configurar Recursos', description: 'Editar taxas, horários e termos de uso' },
    ],
  },
  {
    category: 'Comunicação & Documentos',
    permissions: [
      { key: 'view_documents', label: 'Ver Documentos', description: 'Consultar atas, convenção e regimento interno' },
      { key: 'upload_documents', label: 'Enviar Arquivos', description: 'Fazer upload de novos documentos e balancetes' },
      { key: 'manage_documents', label: 'Gerir Repositório', description: 'Excluir, renomear e organizar pastas na nuvem' },
      { key: 'view_announcements', label: 'Ver Mural de Avisos', description: 'Ler comunicados oficiais da administração' },
      { key: 'create_announcements', label: 'Criar Comunicados', description: 'Redigir e enviar avisos com confirmação' },
    ],
  },
  {
    category: 'Atendimento & Convivência',
    permissions: [
      { key: 'create_requests', label: 'Abrir Chamados', description: 'Solicitar 2ª via, tags e agendar mudanças' },
      { key: 'manage_requests', label: 'Atender Chamados', description: 'Responder e finalizar solicitações de moradores' },
      { key: 'create_occurrences', label: 'Registrar Ocorrência', description: 'Reportar barulho, vazamentos e avarias' },
      { key: 'manage_occurrences', label: 'Gerir Ocorrências', description: 'Emitir pareceres e aplicar advertências' },
    ],
  },
  {
    category: 'Governança & Assembleias',
    permissions: [
      { key: 'participate_assemblies', label: 'Assistir Assembleias', description: 'Acessar a sala e pautas das assembleias' },
      { key: 'vote_assemblies', label: 'Votar em Pautas', description: 'Exercer direito de voto como proprietário' },
      { key: 'create_assemblies', label: 'Convocar Assembleia', description: 'Criar editais, itens de pauta e enquetes' },
    ],
  },
  {
    category: 'Administração & Sistema',
    permissions: [
      { key: 'manage_units', label: 'Gestão de Unidades', description: 'Cadastrar apartamentos, blocos e vagas' },
      { key: 'manage_users', label: 'Gestão de Usuários', description: 'Vincular moradores, inquilinos e síndicos' },
      { key: 'manage_condo_settings', label: 'Parâmetros do Condomínio', description: 'Alterar regras gerais e módulos' },
      { key: 'manage_global_modules', label: 'Admin SaaS Global', description: 'Habilitar módulos e planos em toda a plataforma' },
      { key: 'manage_tenants', label: 'Multi-Tenancy', description: 'Criar novos condomínios e gerenciar assinaturas' },
    ],
  },
];
