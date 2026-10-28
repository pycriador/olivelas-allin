import { Locale } from '../types/domain';

export type TranslationDictionary = Record<string, string>;

export const translations: Record<Locale, TranslationDictionary> = {
  'pt-BR': {
    // Brand & Meta
    'app.name': 'Olivelas Allin',
    'app.tagline': 'Governança SaaS Multiempresa e Contratação Modular Sob Demanda',
    'app.mockBadge': 'AMBIENTE MOCK DEMONSTRATIVO — DADOS LOCAIS (INDEXEDDB)',
    'app.simulatedNotice': 'Operação simulada localmente no navegador. Nenhuma chamada externa de pagamento, assinatura jurídica ou autenticação real foi executada.',

    // Navigation & Areas
    'nav.public.home': 'Início',
    'nav.public.plans': 'Planos e Módulos',
    'nav.public.terms': 'Termos de Uso',
    'nav.public.privacy': 'Privacidade',
    'nav.public.login': 'Acessar Plataforma',
    'nav.public.recover': 'Recuperar Acesso',

    'nav.global.title': 'Console Global da Plataforma',
    'nav.global.dashboard': 'Visão Geral Global',
    'nav.global.companies': 'Empresas (Tenants)',
    'nav.global.users': 'Usuários Globais',
    'nav.global.roles': 'Papéis e HBAC',
    'nav.global.modules': 'Catálogo de Módulos',
    'nav.global.contracts': 'Contratos e Assinaturas',
    'nav.global.finance': 'Central Financeira',
    'nav.global.apiHub': 'API Hub & Tokens',
    'nav.global.tickets': 'Suporte e Tickets',
    'nav.global.audit': 'Auditoria Global',
    'nav.global.reports': 'Relatórios Globais',

    'nav.company.title': 'Ambiente da Empresa',
    'nav.company.dashboard': 'Painel da Empresa',
    'nav.company.users': 'Usuários e Equipe',
    'nav.company.roles': 'Permissões e HBAC',
    'nav.company.modules': 'Módulos Contratados',
    'nav.company.contracts': 'Contratos e Aditivos',
    'nav.company.finance': 'Financeiro da Empresa',
    'nav.company.tickets': 'Meus Tickets de Suporte',
    'nav.company.audit': 'Auditoria da Empresa',
    'nav.company.reports': 'Relatórios da Empresa',
    'nav.company.workspace': 'Operação dos Módulos',

    // Common Actions
    'action.create': 'Novo Registro',
    'action.save': 'Salvar Alterações',
    'action.cancel': 'Cancelar',
    'action.edit': 'Editar',
    'action.view': 'Detalhes',
    'action.archive': 'Arquivar',
    'action.restore': 'Restaurar',
    'action.exportCsv': 'Exportar CSV',
    'action.filter': 'Filtrar',
    'action.clearFilters': 'Limpar Filtros',
    'action.search': 'Buscar por nome, código, e-mail ou documento...',
    'action.back': 'Voltar',
    'action.confirm': 'Confirmar',
    'action.close': 'Fechar',
    'action.resetSeed': 'Restaurar Dados de Demonstração',
    'action.switchCompany': 'Trocar Empresa',
    'action.enterSupportContext': 'Acessar Contexto de Suporte (Auditado)',
    'action.exitSupportContext': 'Encerrar Sessão de Suporte',
    'action.logout': 'Encerrar Sessão',
    'action.discardChanges': 'Descartar Alterações',

    // Table & Pagination
    'table.showing': 'Exibindo',
    'table.of': 'de',
    'table.records': 'registros',
    'table.page': 'Página',
    'table.perPage': 'por página',
    'table.emptyTitle': 'Nenhum registro encontrado para os filtros aplicados',
    'table.emptyDesc': 'Ajuste os parâmetros de busca na URL ou limpe os filtros para visualizar todos os registros do escopo.',
    'table.includeArchived': 'Incluir arquivados',
    'table.actions': 'Ações',
    'table.status': 'Estado',
    'table.createdAt': 'Criado em',
    'table.updatedAt': 'Atualizado em',

    // Statuses
    'status.active': 'Ativo',
    'status.inactive': 'Inativo',
    'status.pending': 'Pendente',
    'status.suspended': 'Suspenso',
    'status.archived': 'Arquivado',
    'status.draft': 'Rascunho',
    'status.deprecated': 'Descontinuado',
    'status.awaiting_approval': 'Aguardando Aprovação',
    'status.awaiting_signature': 'Aguardando Assinatura',
    'status.signed': 'Assinado (Simulado)',
    'status.ended': 'Encerrado',
    'status.cancelled': 'Cancelado',
    'status.processing': 'Processando',
    'status.paid': 'Pago',
    'status.overdue': 'Vencido',
    'status.failed': 'Falhou',
    'status.refunded': 'Reembolsado',
    'status.open': 'Aberto',
    'status.in_progress': 'Em Atendimento',
    'status.awaiting_customer': 'Aguardando Cliente',
    'status.resolved': 'Resolvido',
    'status.closed': 'Encerrado',
    'status.revoked': 'Revogado',
    'status.expired': 'Expirado',

    // Priorities
    'priority.low': 'Baixa',
    'priority.medium': 'Média',
    'priority.high': 'Alta',
    'priority.urgent': 'Urgente',

    // Roles
    'role.super_admin': 'Super Admin',
    'role.admin': 'Admin',
    'role.financeiro': 'Financeiro',
    'role.cliente': 'Cliente (Admin da Empresa)',
    'role.gerente': 'Gerente',
    'role.funcionario': 'Funcionário',

    // Permissions
    'perm.view': 'Visualizar',
    'perm.create': 'Criar',
    'perm.edit': 'Editar',
    'perm.archive': 'Arquivar',
    'perm.export': 'Exportar',
    'perm.approve': 'Aprovar',
    'perm.administer': 'Administrar',

    // Theme & Locale
    'theme.system': 'Sistema',
    'theme.light': 'Claro',
    'theme.dark': 'Escuro',
    'locale.pt-BR': 'Português (BR)',
    'locale.en': 'English',
    'locale.es': 'Español',

    // Validation & Feedback
    'validation.required': 'Este campo é obrigatório.',
    'validation.email': 'Informe um endereço de e-mail válido.',
    'validation.unsavedWarning': 'Existem alterações não salvas neste formulário.',
    'feedback.savedSuccess': 'Registro salvo com sucesso e registrado na auditoria local.',
    'feedback.archivedSuccess': 'Registro arquivado com preservação integral de histórico.',
    'feedback.restoredSuccess': 'Registro restaurado com sucesso.',
    'feedback.seedRestored': 'Banco de dados local IndexedDB restaurado para os dados iniciais de demonstração.',
    'feedback.accessDenied': 'Acesso negado pela política HBAC ou pelo isolamento de escopo multiempresa.',
  },
  en: {
    'app.name': 'Olivelas Allin',
    'app.tagline': 'Multi-Tenant SaaS Governance & On-Demand Modular Contracting',
    'app.mockBadge': 'DEMONSTRATION MOCK ENVIRONMENT — LOCAL DATA (INDEXEDDB)',
    'app.simulatedNotice': 'Simulated locally in the browser. No external payment, legal signature, or real authentication call was executed.',

    'nav.public.home': 'Home',
    'nav.public.plans': 'Plans & Modules',
    'nav.public.terms': 'Terms of Use',
    'nav.public.privacy': 'Privacy Policy',
    'nav.public.login': 'Sign In to Platform',
    'nav.public.recover': 'Recover Access',

    'nav.global.title': 'Platform Global Console',
    'nav.global.dashboard': 'Global Overview',
    'nav.global.companies': 'Companies (Tenants)',
    'nav.global.users': 'Global Users',
    'nav.global.roles': 'Roles & HBAC',
    'nav.global.modules': 'Module Catalog',
    'nav.global.contracts': 'Contracts & Subscriptions',
    'nav.global.finance': 'Financial Hub',
    'nav.global.apiHub': 'API Hub & Tokens',
    'nav.global.tickets': 'Support & Tickets',
    'nav.global.audit': 'Global Audit Log',
    'nav.global.reports': 'Global Reports',

    'nav.company.title': 'Company Workspace',
    'nav.company.dashboard': 'Company Dashboard',
    'nav.company.users': 'Users & Team',
    'nav.company.roles': 'Permissions & HBAC',
    'nav.company.modules': 'Contracted Modules',
    'nav.company.contracts': 'Contracts & Addenda',
    'nav.company.finance': 'Company Finance',
    'nav.company.tickets': 'Support Tickets',
    'nav.company.audit': 'Company Audit Log',
    'nav.company.reports': 'Company Reports',
    'nav.company.workspace': 'Module Operations',

    'action.create': 'New Record',
    'action.save': 'Save Changes',
    'action.cancel': 'Cancel',
    'action.edit': 'Edit',
    'action.view': 'Details',
    'action.archive': 'Archive',
    'action.restore': 'Restore',
    'action.exportCsv': 'Export CSV',
    'action.filter': 'Filter',
    'action.clearFilters': 'Clear Filters',
    'action.search': 'Search by name, code, email or tax ID...',
    'action.back': 'Back',
    'action.confirm': 'Confirm',
    'action.close': 'Close',
    'action.resetSeed': 'Restore Demo Data',
    'action.switchCompany': 'Switch Company',
    'action.enterSupportContext': 'Enter Support Context (Audited)',
    'action.exitSupportContext': 'Exit Support Session',
    'action.logout': 'Sign Out',
    'action.discardChanges': 'Discard Changes',

    'table.showing': 'Showing',
    'table.of': 'of',
    'table.records': 'records',
    'table.page': 'Page',
    'table.perPage': 'per page',
    'table.emptyTitle': 'No records match the active filters',
    'table.emptyDesc': 'Adjust your URL search parameters or clear filters to inspect all records within your scope.',
    'table.includeArchived': 'Include archived',
    'table.actions': 'Actions',
    'table.status': 'Status',
    'table.createdAt': 'Created at',
    'table.updatedAt': 'Updated at',

    'status.active': 'Active',
    'status.inactive': 'Inactive',
    'status.pending': 'Pending',
    'status.suspended': 'Suspended',
    'status.archived': 'Archived',
    'status.draft': 'Draft',
    'status.deprecated': 'Deprecated',
    'status.awaiting_approval': 'Awaiting Approval',
    'status.awaiting_signature': 'Awaiting Signature',
    'status.signed': 'Signed (Simulated)',
    'status.ended': 'Ended',
    'status.cancelled': 'Cancelled',
    'status.processing': 'Processing',
    'status.paid': 'Paid',
    'status.overdue': 'Overdue',
    'status.failed': 'Failed',
    'status.refunded': 'Refunded',
    'status.open': 'Open',
    'status.in_progress': 'In Progress',
    'status.awaiting_customer': 'Awaiting Customer',
    'status.resolved': 'Resolved',
    'status.closed': 'Closed',
    'status.revoked': 'Revoked',
    'status.expired': 'Expired',

    'priority.low': 'Low',
    'priority.medium': 'Medium',
    'priority.high': 'High',
    'priority.urgent': 'Urgent',

    'role.super_admin': 'Super Admin',
    'role.admin': 'Admin',
    'role.financeiro': 'Finance Officer',
    'role.cliente': 'Customer (Company Admin)',
    'role.gerente': 'Manager',
    'role.funcionario': 'Employee',

    'perm.view': 'View',
    'perm.create': 'Create',
    'perm.edit': 'Edit',
    'perm.archive': 'Archive',
    'perm.export': 'Export',
    'perm.approve': 'Approve',
    'perm.administer': 'Administer',

    'theme.system': 'System',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'locale.pt-BR': 'Português (BR)',
    'locale.en': 'English',
    'locale.es': 'Español',

    'validation.required': 'This field is required.',
    'validation.email': 'Please enter a valid email address.',
    'validation.unsavedWarning': 'You have unsaved changes in this form.',
    'feedback.savedSuccess': 'Record saved and recorded in the local audit trail.',
    'feedback.archivedSuccess': 'Record archived with full history preservation.',
    'feedback.restoredSuccess': 'Record restored successfully.',
    'feedback.seedRestored': 'Local IndexedDB database restored to initial demo seed.',
    'feedback.accessDenied': 'Access denied by HBAC policy or multi-company scope isolation.',
  },
  es: {
    'app.name': 'Olivelas Allin',
    'app.tagline': 'Gobernanza SaaS Multiempresa y Contratación Modular Bajo Demanda',
    'app.mockBadge': 'ENTORNO MOCK DEMOSTRATIVO — DATOS LOCALES (INDEXEDDB)',
    'app.simulatedNotice': 'Operación simulada localmente en el navegador. No se ejecutó ningún pago externo, firma legal ni autenticación real.',

    'nav.public.home': 'Inicio',
    'nav.public.plans': 'Planes y Módulos',
    'nav.public.terms': 'Términos de Uso',
    'nav.public.privacy': 'Privacidad',
    'nav.public.login': 'Acceder a la Plataforma',
    'nav.public.recover': 'Recuperar Acceso',

    'nav.global.title': 'Consola Global de la Plataforma',
    'nav.global.dashboard': 'Resumen Global',
    'nav.global.companies': 'Empresas (Tenants)',
    'nav.global.users': 'Usuarios Globales',
    'nav.global.roles': 'Roles y HBAC',
    'nav.global.modules': 'Catálogo de Módulos',
    'nav.global.contracts': 'Contratos y Suscripciones',
    'nav.global.finance': 'Central Financiera',
    'nav.global.apiHub': 'API Hub y Tokens',
    'nav.global.tickets': 'Soporte y Tickets',
    'nav.global.audit': 'Auditoría Global',
    'nav.global.reports': 'Informes Globales',

    'nav.company.title': 'Entorno de la Empresa',
    'nav.company.dashboard': 'Panel de la Empresa',
    'nav.company.users': 'Usuarios y Equipo',
    'nav.company.roles': 'Permisos y HBAC',
    'nav.company.modules': 'Módulos Contratados',
    'nav.company.contracts': 'Contratos y Adendas',
    'nav.company.finance': 'Finanzas de la Empresa',
    'nav.company.tickets': 'Tickets de Soporte',
    'nav.company.audit': 'Auditoría de la Empresa',
    'nav.company.reports': 'Informes de la Empresa',
    'nav.company.workspace': 'Operación de Módulos',

    'action.create': 'Nuevo Registro',
    'action.save': 'Guardar Cambios',
    'action.cancel': 'Cancelar',
    'action.edit': 'Editar',
    'action.view': 'Detalles',
    'action.archive': 'Archivar',
    'action.restore': 'Restaurar',
    'action.exportCsv': 'Exportar CSV',
    'action.filter': 'Filtrar',
    'action.clearFilters': 'Limpiar Filtros',
    'action.search': 'Buscar por nombre, código, correo o documento...',
    'action.back': 'Volver',
    'action.confirm': 'Confirmar',
    'action.close': 'Cerrar',
    'action.resetSeed': 'Restaurar Datos de Demostración',
    'action.switchCompany': 'Cambiar Empresa',
    'action.enterSupportContext': 'Acceder en Modo Soporte (Auditado)',
    'action.exitSupportContext': 'Finalizar Sesión de Soporte',
    'action.logout': 'Cerrar Sesión',
    'action.discardChanges': 'Descartar Cambios',

    'table.showing': 'Mostrando',
    'table.of': 'de',
    'table.records': 'registros',
    'table.page': 'Página',
    'table.perPage': 'por página',
    'table.emptyTitle': 'No se encontraron registros para los filtros aplicados',
    'table.emptyDesc': 'Ajuste los parámetros de búsqueda en la URL o limpie los filtros para ver todos los registros del alcance.',
    'table.includeArchived': 'Incluir archivados',
    'table.actions': 'Acciones',
    'table.status': 'Estado',
    'table.createdAt': 'Creado el',
    'table.updatedAt': 'Actualizado el',

    'status.active': 'Activo',
    'status.inactive': 'Inactivo',
    'status.pending': 'Pendiente',
    'status.suspended': 'Suspendido',
    'status.archived': 'Archivado',
    'status.draft': 'Borrador',
    'status.deprecated': 'Descontinuado',
    'status.awaiting_approval': 'Esperando Aprobación',
    'status.awaiting_signature': 'Esperando Firma',
    'status.signed': 'Firmado (Simulado)',
    'status.ended': 'Finalizado',
    'status.cancelled': 'Cancelado',
    'status.processing': 'Procesando',
    'status.paid': 'Pagado',
    'status.overdue': 'Vencido',
    'status.failed': 'Fallido',
    'status.refunded': 'Reembolsado',
    'status.open': 'Abierto',
    'status.in_progress': 'En Atención',
    'status.awaiting_customer': 'Esperando al Cliente',
    'status.resolved': 'Resuelto',
    'status.closed': 'Cerrado',
    'status.revoked': 'Revocado',
    'status.expired': 'Expirado',

    'priority.low': 'Baja',
    'priority.medium': 'Media',
    'priority.high': 'Alta',
    'priority.urgent': 'Urgente',

    'role.super_admin': 'Super Admin',
    'role.admin': 'Admin',
    'role.financeiro': 'Financiero',
    'role.cliente': 'Cliente (Admin de Empresa)',
    'role.gerente': 'Gerente',
    'role.funcionario': 'Empleado',

    'perm.view': 'Ver',
    'perm.create': 'Crear',
    'perm.edit': 'Editar',
    'perm.archive': 'Archivar',
    'perm.export': 'Exportar',
    'perm.approve': 'Aprobar',
    'perm.administer': 'Administrar',

    'theme.system': 'Sistema',
    'theme.light': 'Claro',
    'theme.dark': 'Oscuro',
    'locale.pt-BR': 'Português (BR)',
    'locale.en': 'English',
    'locale.es': 'Español',

    'validation.required': 'Este campo es obligatorio.',
    'validation.email': 'Ingrese una dirección de correo válida.',
    'validation.unsavedWarning': 'Hay cambios sin guardar en este formulario.',
    'feedback.savedSuccess': 'Registro guardado con éxito y registrado en la auditoría local.',
    'feedback.archivedSuccess': 'Registro archivado con preservación total del historial.',
    'feedback.restoredSuccess': 'Registro restaurado con éxito.',
    'feedback.seedRestored': 'Base de datos local IndexedDB restaurada a los datos iniciales de demostración.',
    'feedback.accessDenied': 'Acceso denegado por la política HBAC o por el aislamiento multiempresa.',
  },
};

export function translate(locale: Locale, key: string, fallback?: string): string {
  return translations[locale]?.[key] ?? translations['pt-BR'][key] ?? fallback ?? key;
}

export function formatCurrency(
  amount: number,
  currency: 'BRL' | 'USD' | 'EUR' = 'BRL',
  locale: Locale = 'pt-BR'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatNumber(value: number, locale: Locale = 'pt-BR'): string {
  try {
    return new Intl.NumberFormat(locale).format(value);
  } catch {
    return String(value);
  }
}

export function formatDate(isoDate?: string, locale: Locale = 'pt-BR'): string {
  if (!isoDate) return '—';
  try {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return isoDate;
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return isoDate;
  }
}

export function formatDateTime(isoDate?: string, locale: Locale = 'pt-BR'): string {
  if (!isoDate) return '—';
  try {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return isoDate;
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoDate;
  }
}

export function localizeRecordText(
  record: Record<Locale, string> | string | undefined,
  locale: Locale
): string {
  if (!record) return '';
  if (typeof record === 'string') return record;
  return record[locale] || record['pt-BR'] || Object.values(record)[0] || '';
}
