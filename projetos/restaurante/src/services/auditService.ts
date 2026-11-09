import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { AuditLog, AuditAction, AuditFilterParams } from '@/types/audit';
import type { PaginatedResponse } from '@/types/pagination';

const LOCAL_AUDIT_KEY = 'olivelas_audit_logs';

function getLocalAudit(): AuditLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_AUDIT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAudit(logs: AuditLog[]) {
  try {
    localStorage.setItem(LOCAL_AUDIT_KEY, JSON.stringify(logs.slice(0, 1000)));
  } catch {
    // ignore
  }
}

export const auditService = {
  /**
   * Log an event into the append-only audit trail
   */
  async logEvent(params: {
    action: AuditAction | string;
    entity_type: string;
    actor_user_id?: string | null;
    actor_platform_role?: string | null;
    restaurant_id?: string | null;
    entity_id?: string | null;
    session_id?: string | null;
    support_session_id?: string | null;
    ip_address?: string | null;
    user_agent?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const now = new Date().toISOString();
    const fallbackRestaurantId =
      params.restaurant_id ||
      (typeof localStorage !== 'undefined'
        ? localStorage.getItem('olivelas_active_restaurant_id')
        : null) ||
      null;

    const entry: AuditLog = {
      id: 'audit-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      restaurant_id: fallbackRestaurantId,
      actor_user_id: params.actor_user_id || null,
      actor_platform_role: params.actor_platform_role || null,
      action: params.action,
      entity_type: params.entity_type,
      entity_id: params.entity_id || null,
      session_id: params.session_id || null,
      support_session_id: params.support_session_id || null,
      ip_address: params.ip_address || (typeof window !== 'undefined' ? '127.0.0.1' : null),
      user_agent: params.user_agent || (typeof navigator !== 'undefined' ? navigator.userAgent : null),
      metadata: params.metadata || {},
      created_at: now,
    };

    if (!isSupabaseConfigured) {
      const all = getLocalAudit();
      saveLocalAudit([entry, ...all]);
      return;
    }

    try {
      const { error } = await supabase.from('audit_logs').insert({
        restaurant_id: entry.restaurant_id,
        actor_user_id: entry.actor_user_id,
        actor_platform_role: entry.actor_platform_role,
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        session_id: entry.session_id,
        support_session_id: entry.support_session_id,
        ip_address: entry.ip_address,
        user_agent: entry.user_agent,
        metadata: entry.metadata,
      });

      if (error) {
        console.warn('Audit log write error, saving locally:', error.message);
        const all = getLocalAudit();
        saveLocalAudit([entry, ...all]);
      }
    } catch (err) {
      console.warn('Audit insert exception:', err);
      const all = getLocalAudit();
      saveLocalAudit([entry, ...all]);
    }
  },

  /**
   * Fetch paginated and filtered audit logs
   */
  async getAuditLogs(params: AuditFilterParams): Promise<PaginatedResponse<AuditLog>> {
    const page = Math.max(1, params.page);
    const pageSize = Math.max(1, params.pageSize);

    if (!isSupabaseConfigured) {
      let filtered = getLocalAudit();

      if (params.action) {
        filtered = filtered.filter((l) => l.action.toLowerCase().includes(params.action!.toLowerCase()));
      }
      if (params.restaurantId) {
        filtered = filtered.filter((l) => l.restaurant_id === params.restaurantId);
      }
      if (params.actorId) {
        filtered = filtered.filter((l) => l.actor_user_id === params.actorId);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (l) =>
            l.action.toLowerCase().includes(q) ||
            l.entity_type.toLowerCase().includes(q) ||
            JSON.stringify(l.metadata).toLowerCase().includes(q)
        );
      }

      const total = filtered.length;
      const totalPages = Math.ceil(total / pageSize);
      const start = (page - 1) * pageSize;
      const data = filtered.slice(start, start + pageSize);

      return { data, total, page, pageSize, totalPages };
    }

    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' });

      if (params.action) {
        query = query.eq('action', params.action);
      }
      if (params.restaurantId) {
        query = query.eq('restaurant_id', params.restaurantId);
      }
      if (params.actorId) {
        query = query.eq('actor_user_id', params.actorId);
      }
      if (params.entityType) {
        query = query.eq('entity_type', params.entityType);
      }
      if (params.dateFrom) {
        query = query.gte('created_at', params.dateFrom);
      }
      if (params.dateTo) {
        query = query.lte('created_at', params.dateTo);
      }
      if (params.search) {
        query = query.or(`action.ilike.%${params.search}%,entity_type.ilike.%${params.search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        if (error.code === 'PGRST205') {
          // Table does not exist yet: return local fallback
          return this.getAuditLogs({ ...params, page, pageSize });
        }
        throw new Error(error.message);
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      // Hydrate profiles and restaurant names if possible
      const logs = (data || []) as AuditLog[];
      const userIds = Array.from(new Set(logs.map((l) => l.actor_user_id).filter(Boolean))) as string[];
      const restIds = Array.from(new Set(logs.map((l) => l.restaurant_id).filter(Boolean))) as string[];

      let profileMap = new Map<string, { full_name: string | null; email: string | null }>();
      let restMap = new Map<string, string>();

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        (profiles || []).forEach((p) => profileMap.set(p.id, p));
      }

      if (restIds.length > 0) {
        const { data: rests } = await supabase
          .from('restaurants')
          .select('id, name')
          .in('id', restIds);
        (rests || []).forEach((r) => restMap.set(r.id, r.name));
      }

      const hydrated = logs.map((l) => ({
        ...l,
        actor_name: l.actor_user_id ? profileMap.get(l.actor_user_id)?.full_name || null : null,
        actor_email: l.actor_user_id ? profileMap.get(l.actor_user_id)?.email || null : null,
        restaurant_name: l.restaurant_id ? restMap.get(l.restaurant_id) || null : null,
      }));

      return {
        data: hydrated,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (err: any) {
      console.warn('Error fetching audit logs from supabase, using local:', err.message);
      return {
        data: getLocalAudit().slice(0, pageSize),
        total: getLocalAudit().length,
        page,
        pageSize,
        totalPages: Math.ceil(getLocalAudit().length / pageSize),
      };
    }
  },
};
