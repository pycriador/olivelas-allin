import {
  CompanyModuleSubscription,
  EffectivePermissionCell,
  LanguageCode,
  PermissionAction,
  PermissionGrant,
  PermissionResource,
  PermissionScope,
  RoleEntity,
  UserEntity,
} from '../types/domain';

export const ALL_RESOURCES: PermissionResource[] = [
  'dashboard',
  'companies',
  'users',
  'roles',
  'modules',
  'contracts',
  'finance',
  'payment_methods',
  'api_hub',
  'tickets',
  'audit',
  'reports',
  'inventory',
  'crm',
  'orders',
];

export const ALL_ACTIONS: PermissionAction[] = [
  'view',
  'create',
  'edit',
  'archive',
  'export',
  'approve',
  'administer',
];

export const RESOURCE_LABELS: Record<PermissionResource, Record<LanguageCode, string>> = {
  dashboard: { 'pt-BR': 'Painel Executivo', en: 'Executive Dashboard', es: 'Panel Ejecutivo' },
  companies: { 'pt-BR': 'Empresas & Unidades', en: 'Companies & Units', es: 'Empresas y Unidades' },
  users: { 'pt-BR': 'Usuários & Identidades', en: 'Users & Identities', es: 'Usuarios e Identidades' },
  roles: { 'pt-BR': 'Papéis & Matriz HBAC', en: 'Roles & HBAC Matrix', es: 'Roles y Matriz HBAC' },
  modules: { 'pt-BR': 'Catálogo de Módulos', en: 'Module Catalog', es: 'Catálogo de Módulos' },
  contracts: { 'pt-BR': 'Contratos & Assinaturas', en: 'Contracts & Signatures', es: 'Contratos y Firmas' },
  finance: { 'pt-BR': 'Financeiro & Cobranças', en: 'Finance & Billing', es: 'Finanzas y Cobros' },
  payment_methods: { 'pt-BR': 'Meios de Pagamento', en: 'Payment Methods', es: 'Medios de Pago' },
  api_hub: { 'pt-BR': 'API Hub & Tokens', en: 'API Hub & Tokens', es: 'API Hub y Tokens' },
  tickets: { 'pt-BR': 'Tickets & Suporte', en: 'Tickets & Support', es: 'Tickets y Soporte' },
  audit: { 'pt-BR': 'Trilha de Auditoria', en: 'Audit Trail', es: 'Pista de Auditoría' },
  reports: { 'pt-BR': 'Relatórios & Analytics', en: 'Reports & Analytics', es: 'Informes y Analítica' },
  inventory: { 'pt-BR': 'Operação de Estoque', en: 'Inventory Operations', es: 'Operación de Inventario' },
  crm: { 'pt-BR': 'Operação de CRM', en: 'CRM Operations', es: 'Operación de CRM' },
  orders: { 'pt-BR': 'Operação de Vendas', en: 'Sales Operations', es: 'Operación de Ventas' },
};

export const ACTION_LABELS: Record<PermissionAction, Record<LanguageCode, string>> = {
  view: { 'pt-BR': 'Visualizar', en: 'View', es: 'Ver' },
  create: { 'pt-BR': 'Criar', en: 'Create', es: 'Crear' },
  edit: { 'pt-BR': 'Editar', en: 'Edit', es: 'Editar' },
  archive: { 'pt-BR': 'Arquivar', en: 'Archive', es: 'Archivar' },
  export: { 'pt-BR': 'Exportar', en: 'Export', es: 'Exportar' },
  approve: { 'pt-BR': 'Aprovar', en: 'Approve', es: 'Aprobar' },
  administer: { 'pt-BR': 'Administrar', en: 'Administer', es: 'Administrar' },
};

/**
 * Resolves the role chain for a user, including roles directly assigned
 * and ancestor/descendant awareness for HBAC origin inspection.
 */
export function getUserActiveRoles(user: UserEntity, allRoles: RoleEntity[]): RoleEntity[] {
  return allRoles.filter(
    (role) =>
      user.roleIds.includes(role.id) &&
      role.status === 'active' &&
      !role.archiveMetadata.isArchived,
  );
}

export function isSuperAdmin(user: UserEntity | null, allRoles: RoleEntity[]): boolean {
  if (!user) return false;
  const activeRoles = getUserActiveRoles(user, allRoles);
  return activeRoles.some((r) => r.code === 'super_admin' || r.hierarchyLevel === 1);
}

export function isGlobalStaff(user: UserEntity | null, allRoles: RoleEntity[]): boolean {
  if (!user) return false;
  const activeRoles = getUserActiveRoles(user, allRoles);
  return activeRoles.some((r) => r.scope === 'global');
}

export function getBestHierarchyLevel(user: UserEntity, allRoles: RoleEntity[]): number {
  const activeRoles = getUserActiveRoles(user, allRoles);
  if (activeRoles.length === 0) return 999;
  return Math.min(...activeRoles.map((r) => r.hierarchyLevel));
}

/**
 * Computes whether a user can access a specific company workspace.
 * Super Admin can access any company when in explicit support impersonation or global oversight.
 * Other users can only access companies explicitly associated in `user.companyIds`.
 */
export function canAccessCompany(
  user: UserEntity | null,
  companyId: string,
  allRoles: RoleEntity[],
  impersonatedCompanyId?: string | null,
): boolean {
  if (!user || user.status !== 'active' || user.archiveMetadata.isArchived) return false;
  if (isSuperAdmin(user, allRoles)) {
    return true;
  }
  if (impersonatedCompanyId && impersonatedCompanyId === companyId && isGlobalStaff(user, allRoles)) {
    return true;
  }
  return user.companyIds.includes(companyId);
}

/**
 * Evaluates a single permission cell (resource + action) for a user in a target scope/company,
 * returning full traceability of the permission origin.
 */
export function evaluateEffectivePermission(
  user: UserEntity | null,
  allRoles: RoleEntity[],
  resource: PermissionResource,
  action: PermissionAction,
  targetCompanyId?: string,
  language: LanguageCode = 'pt-BR',
): EffectivePermissionCell {
  if (!user || user.status !== 'active' || user.archiveMetadata.isArchived) {
    return {
      resource,
      action,
      allowed: false,
      scope: 'resource',
      originType: 'none',
      originLabel: language === 'en' ? 'Inactive or unauthenticated user' : language === 'es' ? 'Usuario inactivo' : 'Usuário inativo ou não autenticado',
    };
  }

  // 1. Check explicit individual DENY override first (highest precedence for revocation)
  const individualDeny = (user.individualPermissions || []).find(
    (ovr) =>
      ovr.effect === 'deny' &&
      ovr.resource === resource &&
      ovr.action === action &&
      (!ovr.companyId || !targetCompanyId || ovr.companyId === targetCompanyId),
  );
  if (individualDeny) {
    return {
      resource,
      action,
      allowed: false,
      scope: individualDeny.scope,
      originType: 'individual_deny',
      originLabel: `Revogação individual (${individualDeny.reason})`,
    };
  }

  // 2. Check explicit individual ALLOW override
  const individualAllow = (user.individualPermissions || []).find(
    (ovr) =>
      ovr.effect === 'allow' &&
      ovr.resource === resource &&
      ovr.action === action &&
      (!ovr.companyId || !targetCompanyId || ovr.companyId === targetCompanyId),
  );
  if (individualAllow) {
    return {
      resource,
      action,
      allowed: true,
      scope: individualAllow.scope,
      originType: 'individual_allow',
      originLabel: `Exceção individual por ${individualAllow.grantedByUserName}: "${individualAllow.reason}"`,
    };
  }

  // 3. Check direct active roles
  const userRoles = getUserActiveRoles(user, allRoles);
  for (const role of userRoles) {
    // Check if role belongs to another company
    if (role.companyId && targetCompanyId && role.companyId !== targetCompanyId) {
      continue;
    }

    const directGrant = role.permissions.find(
      (p) => p.resource === resource && (p.action === action || p.action === 'administer'),
    );
    if (directGrant) {
      // If role has company scope and a targetCompanyId is checked, verify user belongs to that company (unless Super Admin)
      if (
        directGrant.scope === 'company' &&
        targetCompanyId &&
        !isSuperAdmin(user, allRoles) &&
        !user.companyIds.includes(targetCompanyId)
      ) {
        continue;
      }

      return {
        resource,
        action,
        allowed: true,
        scope: directGrant.scope,
        originType: 'role_direct',
        originLabel: `${role.name[language]} (${directGrant.action === 'administer' && action !== 'administer' ? 'via Administrar' : 'Direto'})`,
      };
    }
  }

  // 4. Check inherited permissions from child roles in hierarchy if role explicitly inherits or has subordinate baseline
  for (const role of userRoles) {
    // Find child roles whose parentRoleId is this role (in HBAC, higher authority roles inherit operational capabilities of subordinate roles in same scope)
    const subordinateRoles = allRoles.filter(
      (candidate) =>
        candidate.parentRoleId === role.id &&
        candidate.status === 'active' &&
        !candidate.archiveMetadata.isArchived &&
        (!candidate.companyId || !targetCompanyId || candidate.companyId === targetCompanyId),
    );
    for (const subRole of subordinateRoles) {
      const inheritedGrant = subRole.permissions.find(
        (p) => p.resource === resource && p.action === action,
      );
      if (inheritedGrant) {
        if (
          inheritedGrant.scope === 'company' &&
          targetCompanyId &&
          !isSuperAdmin(user, allRoles) &&
          !user.companyIds.includes(targetCompanyId)
        ) {
          continue;
        }
        return {
          resource,
          action,
          allowed: true,
          scope: inheritedGrant.scope,
          originType: 'role_inherited',
          originLabel: `Herdado via hierarquia de ${subRole.name[language]} -> ${role.name[language]}`,
        };
      }
    }
  }

  return {
    resource,
    action,
    allowed: false,
    scope: 'resource',
    originType: 'none',
    originLabel: language === 'en' ? 'Not granted' : language === 'es' ? 'No concedido' : 'Não concedido',
  };
}

/**
 * Generates the complete Effective Permission Matrix for a user across all resources and actions.
 */
export function buildEffectivePermissionMatrix(
  user: UserEntity | null,
  allRoles: RoleEntity[],
  targetCompanyId?: string,
  language: LanguageCode = 'pt-BR',
): EffectivePermissionCell[] {
  const cells: EffectivePermissionCell[] = [];
  for (const resource of ALL_RESOURCES) {
    for (const action of ALL_ACTIONS) {
      cells.push(
        evaluateEffectivePermission(user, allRoles, resource, action, targetCompanyId, language),
      );
    }
  }
  return cells;
}

/**
 * Prevents privilege escalation: checks if `actor` is allowed to grant a specific
 * permission or role to another user or role.
 */
export function validateNoPrivilegeEscalation(params: {
  actor: UserEntity;
  allRoles: RoleEntity[];
  targetScope: PermissionScope;
  targetCompanyId?: string;
  requestedGrants?: PermissionGrant[];
  requestedRoleIds?: string[];
  language?: LanguageCode;
}): { valid: boolean; reason?: string } {
  const { actor, allRoles, targetScope, targetCompanyId, requestedGrants, requestedRoleIds, language = 'pt-BR' } = params;

  if (isSuperAdmin(actor, allRoles)) {
    return { valid: true };
  }

  const actorBestLevel = getBestHierarchyLevel(actor, allRoles);

  // Non-global actor cannot grant global scope
  if (targetScope === 'global' && !isGlobalStaff(actor, allRoles)) {
    return {
      valid: false,
      reason: 'Bloqueio HBAC: Usuários de escopo empresarial não podem conceder permissões de escopo Global.',
    };
  }

  // Actor cannot grant permissions for a company they don't belong to
  if (targetCompanyId && !actor.companyIds.includes(targetCompanyId)) {
    return {
      valid: false,
      reason: 'Bloqueio HBAC: Não é permitido delegar permissões para fora do escopo das próprias empresas associadas.',
    };
  }

  // Actor cannot assign a role with higher authority (lower hierarchyLevel number) than their own
  if (requestedRoleIds && requestedRoleIds.length > 0) {
    for (const roleId of requestedRoleIds) {
      const role = allRoles.find((r) => r.id === roleId);
      if (!role) continue;
      if (role.hierarchyLevel < actorBestLevel) {
        return {
          valid: false,
          reason: `Bloqueio de Elevação de Privilégio: Você (nível ${actorBestLevel}) não pode atribuir o papel "${role.name[language]}" (nível ${role.hierarchyLevel}).`,
        };
      }
      if (role.scope === 'global' && !isGlobalStaff(actor, allRoles)) {
        return {
          valid: false,
          reason: `Bloqueio de Escopo HBAC: Você não pode atribuir o papel global "${role.name[language]}".`,
        };
      }
    }
  }

  // Actor cannot grant a resource+action they do not hold themselves
  if (requestedGrants && requestedGrants.length > 0) {
    for (const grant of requestedGrants) {
      const check = evaluateEffectivePermission(
        actor,
        allRoles,
        grant.resource,
        grant.action,
        targetCompanyId,
        language,
      );
      if (!check.allowed) {
        return {
          valid: false,
          reason: `Bloqueio de Elevação de Privilégio: Você não possui a permissão "${RESOURCE_LABELS[grant.resource][language]} -> ${ACTION_LABELS[grant.action][language]}" para delegá-la a terceiros.`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Checks whether a company has an active subscription to a specific module code.
 */
export function isModuleActiveForCompany(
  companyId: string,
  moduleCode: string,
  subscriptions: CompanyModuleSubscription[],
): boolean {
  if (moduleCode === 'allin_core') return true;
  return subscriptions.some(
    (sub) =>
      sub.companyId === companyId &&
      sub.moduleCode === moduleCode &&
      sub.status === 'active',
  );
}
