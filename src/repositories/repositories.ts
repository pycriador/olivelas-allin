import {
  ApiCollectionEntity,
  ApiEnvironmentEntity,
  ApiExecutionHistoryEntity,
  ApiServiceEntity,
  ApiTokenEntity,
  AuditEventEntity,
  BaseBusinessEntity,
  CatalogModuleEntity,
  ChargeEntity,
  CompanyEntity,
  CompanyModuleSubscription,
  ContractEntity,
  InstallmentEntity,
  ListQueryParams,
  OperationalItemEntity,
  PaginatedResult,
  PaymentMethodConfigEntity,
  PaymentRecordEntity,
  RoleEntity,
  TicketEntity,
  UserEntity,
} from '../types/domain';
import {
  ensureSeeded,
  getAllFromStore,
  getByIdFromStore,
  putInStore,
  resetToInitialSeed,
  StoreName,
} from '../storage/indexedDb';

export interface MutationActor {
  userId: string;
  userName: string;
  userRole: string;
  companyId?: string;
  companyName?: string;
}

export function generateId(prefix: string): string {
  const rand = Math.random().toString(36).substring(2, 8);
  const ts = Date.now().toString(36).slice(-4);
  return `${prefix}-${ts}${rand}`;
}

export async function recordAuditEvent(params: {
  actor: MutationActor;
  module: string;
  action: AuditEventEntity['action'];
  entityType: string;
  entityId: string;
  summary: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  origin?: AuditEventEntity['origin'];
}): Promise<AuditEventEntity> {
  const event: AuditEventEntity = {
    id: generateId('aud'),
    timestamp: new Date().toISOString(),
    actorUserId: params.actor.userId,
    actorName: params.actor.userName,
    actorRole: params.actor.userRole,
    companyId: params.actor.companyId,
    companyName: params.actor.companyName,
    module: params.module,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    summary: params.summary,
    previousValue: params.previousValue,
    newValue: params.newValue,
    origin: params.origin ?? 'web_ui',
    correlationId: generateId('corr'),
  };
  await putInStore('audit_events', event);
  return event;
}

export function queryAndPaginate<T>(
  items: T[],
  query: ListQueryParams,
  predicate?: (item: T) => boolean,
  searchExtractor?: (item: T) => string,
): PaginatedResult<T> {
  let filtered = [...items];

  if (predicate) {
    filtered = filtered.filter(predicate);
  }

  // Handle archive filtering if item has archiveMetadata
  filtered = filtered.filter((item) => {
    const maybeBusiness = item as unknown as Partial<BaseBusinessEntity>;
    if (!maybeBusiness.archiveMetadata) return true;
    if (query.includeArchived === 'only') {
      return maybeBusiness.archiveMetadata.isArchived === true;
    }
    if (query.includeArchived === 'true') {
      return true;
    }
    return !maybeBusiness.archiveMetadata.isArchived;
  });

  if (query.search && query.search.trim().length > 0) {
    const q = query.search.trim().toLowerCase();
    filtered = filtered.filter((item) => {
      const text = searchExtractor ? searchExtractor(item) : JSON.stringify(item);
      return text.toLowerCase().includes(q);
    });
  }

  if (query.sort) {
    const sortField = query.sort;
    const order = query.order === 'asc' ? 1 : -1;
    filtered.sort((a, b) => {
      const valA = (a as Record<string, unknown>)[sortField];
      const valB = (b as Record<string, unknown>)[sortField];
      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * order;
      }
      return String(valA).localeCompare(String(valB)) * order;
    });
  }

  const pageSize = Math.max(1, Number(query.pageSize) || 10);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, Number(query.page) || 1), totalPages);
  const start = (page - 1) * pageSize;
  const paginatedItems = filtered.slice(start, start + pageSize);

  return {
    items: paginatedItems,
    total,
    page,
    pageSize,
    totalPages,
  };
}

class BaseRepository<T extends BaseBusinessEntity> {
  constructor(
    protected readonly storeName: StoreName,
    protected readonly entityType: string,
    protected readonly moduleKey: string,
  ) {}

  async listAll(): Promise<T[]> {
    await ensureSeeded();
    return getAllFromStore<T>(this.storeName);
  }

  async getById(id: string): Promise<T | undefined> {
    await ensureSeeded();
    return getByIdFromStore<T>(this.storeName, id);
  }

  async create(item: T, actor: MutationActor, summary: string): Promise<T> {
    await ensureSeeded();
    const now = new Date().toISOString();
    const record: T = {
      ...item,
      createdAt: item.createdAt || now,
      updatedAt: now,
      archiveMetadata: item.archiveMetadata || { isArchived: false },
      changeHistory: [
        ...(item.changeHistory || []),
        {
          id: generateId('chglog'),
          timestamp: now,
          actorUserId: actor.userId,
          actorName: actor.userName,
          action: 'create',
          summary,
        },
      ],
    };
    await putInStore(this.storeName, record);
    await recordAuditEvent({
      actor,
      module: this.moduleKey,
      action: 'create',
      entityType: this.entityType,
      entityId: record.id,
      summary,
      newValue: record as unknown as Record<string, unknown>,
    });
    return record;
  }

  async update(
    id: string,
    updater: (current: T) => T,
    actor: MutationActor,
    summary: string,
    auditAction: AuditEventEntity['action'] = 'update',
  ): Promise<T> {
    await ensureSeeded();
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`${this.entityType} not found: ${id}`);
    }
    const previousSnapshot = structuredClone(existing) as unknown as Record<string, unknown>;
    const updatedRaw = updater(structuredClone(existing));
    const now = new Date().toISOString();
    const updated: T = {
      ...updatedRaw,
      id: existing.id,
      updatedAt: now,
      changeHistory: [
        ...(updatedRaw.changeHistory || []),
        {
          id: generateId('chglog'),
          timestamp: now,
          actorUserId: actor.userId,
          actorName: actor.userName,
          action: auditAction === 'archive' || auditAction === 'restore' ? auditAction : 'update',
          summary,
        },
      ],
    };
    await putInStore(this.storeName, updated);
    await recordAuditEvent({
      actor,
      module: this.moduleKey,
      action: auditAction,
      entityType: this.entityType,
      entityId: id,
      summary,
      previousValue: previousSnapshot,
      newValue: updated as unknown as Record<string, unknown>,
    });
    return updated;
  }

  async archive(id: string, reason: string, actor: MutationActor): Promise<T> {
    const now = new Date().toISOString();
    return this.update(
      id,
      (curr) => {
        const next = {
          ...curr,
          archiveMetadata: {
            isArchived: true,
            archivedAt: now,
            archivedByUserId: actor.userId,
            archivedByUserName: actor.userName,
            archiveReason: reason,
          },
        };
        if ('status' in next && typeof (next as Record<string, unknown>).status === 'string') {
          (next as Record<string, unknown>).status = 'archived';
        }
        if ('operationalStatus' in next) {
          (next as Record<string, unknown>).operationalStatus = 'archived';
        }
        if ('commercialStatus' in next) {
          (next as Record<string, unknown>).commercialStatus = 'archived';
        }
        return next;
      },
      actor,
      `Registro arquivado (${this.entityType} ${id}). Motivo: ${reason}`,
      'archive',
    );
  }

  async restore(id: string, actor: MutationActor): Promise<T> {
    return this.update(
      id,
      (curr) => {
        const next = {
          ...curr,
          archiveMetadata: {
            isArchived: false,
          },
        };
        if ('status' in next && (next as Record<string, unknown>).status === 'archived') {
          (next as Record<string, unknown>).status = 'active';
        }
        if ('operationalStatus' in next && (next as Record<string, unknown>).operationalStatus === 'archived') {
          (next as Record<string, unknown>).operationalStatus = 'active';
        }
        if ('commercialStatus' in next && (next as Record<string, unknown>).commercialStatus === 'archived') {
          (next as Record<string, unknown>).commercialStatus = 'active';
        }
        return next;
      },
      actor,
      `Registro restaurado do arquivo (${this.entityType} ${id}).`,
      'restore',
    );
  }
}

export const repositories = {
  roles: new BaseRepository<RoleEntity>('roles', 'RoleEntity', 'roles'),
  companies: new BaseRepository<CompanyEntity>('companies', 'CompanyEntity', 'companies'),
  users: new BaseRepository<UserEntity>('users', 'UserEntity', 'users'),
  modules: new BaseRepository<CatalogModuleEntity>('modules', 'CatalogModuleEntity', 'modules'),
  contracts: new BaseRepository<ContractEntity>('contracts', 'ContractEntity', 'contracts'),
  charges: new BaseRepository<ChargeEntity>('charges', 'ChargeEntity', 'finance'),
  payments: new BaseRepository<PaymentRecordEntity>('payments', 'PaymentRecordEntity', 'finance'),
  paymentMethods: new BaseRepository<PaymentMethodConfigEntity>(
    'payment_methods',
    'PaymentMethodConfigEntity',
    'payment_methods',
  ),
  apiCollections: new BaseRepository<ApiCollectionEntity>('api_collections', 'ApiCollectionEntity', 'api_hub'),
  apiEnvironments: new BaseRepository<ApiEnvironmentEntity>('api_environments', 'ApiEnvironmentEntity', 'api_hub'),
  apiServices: new BaseRepository<ApiServiceEntity>('api_services', 'ApiServiceEntity', 'api_hub'),
  apiTokens: new BaseRepository<ApiTokenEntity>('api_tokens', 'ApiTokenEntity', 'api_hub'),
  tickets: new BaseRepository<TicketEntity>('tickets', 'TicketEntity', 'tickets'),
  operationalItems: new BaseRepository<OperationalItemEntity>(
    'operational_items',
    'OperationalItemEntity',
    'inventory',
  ),

  companyModules: {
    async listAll(): Promise<CompanyModuleSubscription[]> {
      await ensureSeeded();
      return getAllFromStore<CompanyModuleSubscription>('company_modules');
    },
    async listByCompany(companyId: string): Promise<CompanyModuleSubscription[]> {
      const all = await this.listAll();
      return all.filter((sub) => sub.companyId === companyId);
    },
    async upsert(sub: CompanyModuleSubscription, actor: MutationActor, summary: string): Promise<CompanyModuleSubscription> {
      await ensureSeeded();
      await putInStore('company_modules', sub);
      await recordAuditEvent({
        actor,
        module: 'modules',
        action: 'update',
        entityType: 'CompanyModuleSubscription',
        entityId: sub.id,
        summary,
        newValue: sub as unknown as Record<string, unknown>,
      });
      return sub;
    },
  },

  installments: {
    async listAll(): Promise<InstallmentEntity[]> {
      await ensureSeeded();
      return getAllFromStore<InstallmentEntity>('installments');
    },
    async upsert(inst: InstallmentEntity): Promise<InstallmentEntity> {
      await ensureSeeded();
      return putInStore('installments', inst);
    },
  },

  apiHistory: {
    async listAll(): Promise<ApiExecutionHistoryEntity[]> {
      await ensureSeeded();
      const items = await getAllFromStore<ApiExecutionHistoryEntity>('api_history');
      return items.sort((a, b) => b.executedAt.localeCompare(a.executedAt));
    },
    async create(entry: ApiExecutionHistoryEntity, actor: MutationActor): Promise<ApiExecutionHistoryEntity> {
      await ensureSeeded();
      await putInStore('api_history', entry);
      await recordAuditEvent({
        actor,
        module: 'api_hub',
        action: 'execute_api',
        entityType: 'ApiExecutionHistoryEntity',
        entityId: entry.id,
        summary: `Execução simulada HTTP ${entry.method} ${entry.serviceName} -> Status ${entry.responseStatus} (${entry.responseLatencyMs}ms)`,
        newValue: {
          serviceId: entry.serviceId,
          environmentName: entry.environmentName,
          status: entry.responseStatus,
          resolvedUrl: entry.resolvedUrl,
        },
        origin: 'api_simulator',
      });
      return entry;
    },
  },

  audit: {
    async listAll(): Promise<AuditEventEntity[]> {
      await ensureSeeded();
      const items = await getAllFromStore<AuditEventEntity>('audit_events');
      return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    },
    async getById(id: string): Promise<AuditEventEntity | undefined> {
      await ensureSeeded();
      return getByIdFromStore<AuditEventEntity>('audit_events', id);
    },
  },

  system: {
    async resetDemoData(actor: MutationActor): Promise<void> {
      await resetToInitialSeed();
      await recordAuditEvent({
        actor,
        module: 'system',
        action: 'reset_demo_data',
        entityType: 'DatabaseSeed',
        entityId: 'seed_status',
        summary: 'Dados locais de demonstração restaurados para o estado inicial da fundação V1.',
        origin: 'system_seed',
      });
    },
  },
};
