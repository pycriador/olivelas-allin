import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Profile, PlatformUser, PlatformRoleId, SupportSession, UserStatus } from '@/types/iam';
import type { PaginatedResponse } from '@/types/pagination';
import { auditService } from './auditService';

const ACTIVE_SUPPORT_KEY = 'olivelas_active_support_session';

export const iamService = {
  /**
   * List platform users with pagination and filters
   */
  async getUsers(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    role?: string;
  }): Promise<PaginatedResponse<PlatformUser>> {
    const page = Math.max(1, params.page);
    const pageSize = Math.max(1, params.pageSize);

    if (!isSupabaseConfigured) {
      // Mock local users
      const mockUsers: PlatformUser[] = [
        {
          id: 'usr-admin-1',
          full_name: 'Willian Jesus',
          email: 'willian.o.jesus@gmail.com',
          phone: '(11) 98765-4321',
          avatar_url: null,
          status: 'active',
          platform_roles: ['global_admin'],
          memberships_count: 3,
          created_at: '2026-09-01T12:00:00Z',
          updated_at: '2026-09-30T12:00:00Z',
          restaurants: [{ id: 'rest-1', name: 'Olivelas Gastronomia', role_id: 'restaurant_admin', status: 'active' }],
        },
      ];

      return {
        data: mockUsers,
        total: mockUsers.length,
        page,
        pageSize,
        totalPages: 1,
      };
    }

    try {
      let query = supabase.from('profiles').select('*', { count: 'exact' });

      if (params.status && params.status !== 'all') {
        query = query.eq('status', params.status);
      }
      if (params.search) {
        query = query.or(`full_name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data: profiles, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw new Error(error.message);

      const userIds = (profiles || []).map((p) => p.id);

      // Fetch user_platform_roles
      let rolesMap = new Map<string, PlatformRoleId[]>();
      if (userIds.length > 0) {
        const { data: upr } = await supabase
          .from('user_platform_roles')
          .select('user_id, role_id')
          .in('user_id', userIds)
          .eq('status', 'active');

        (upr || []).forEach((row: any) => {
          const current = rolesMap.get(row.user_id) || [];
          rolesMap.set(row.user_id, [...current, row.role_id as PlatformRoleId]);
        });
      }

      // Fetch memberships count
      let memberCountMap = new Map<string, number>();
      if (userIds.length > 0) {
        const { data: members } = await supabase
          .from('restaurant_members')
          .select('user_id')
          .in('user_id', userIds)
          .neq('status', 'removed');

        (members || []).forEach((m: any) => {
          memberCountMap.set(m.user_id, (memberCountMap.get(m.user_id) || 0) + 1);
        });
      }

      const users: PlatformUser[] = (profiles || []).map((p: any) => {
        const pRoles = rolesMap.get(p.id) || [];
        // Automatic global admin for owner email if not yet in table
        if (p.email?.toLowerCase() === 'willian.o.jesus@gmail.com' && !pRoles.includes('global_admin')) {
          pRoles.push('global_admin');
        }

        return {
          id: p.id,
          auth_user_id: p.auth_user_id,
          full_name: p.full_name,
          email: p.email,
          phone: p.phone,
          avatar_url: p.avatar_url,
          status: p.status || 'active',
          created_at: p.created_at,
          updated_at: p.updated_at,
          platform_roles: pRoles,
          memberships_count: memberCountMap.get(p.id) || 0,
        };
      });

      // Filter by platform role if requested
      const filtered = params.role && params.role !== 'all'
        ? users.filter((u) => u.platform_roles.includes(params.role as PlatformRoleId))
        : users;

      return {
        data: filtered,
        total: count || filtered.length,
        page,
        pageSize,
        totalPages: Math.ceil((count || filtered.length) / pageSize),
      };
    } catch (err: any) {
      console.warn('Error fetching users:', err.message);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
  },

  /**
   * Get single user with restaurant affiliations
   */
  async getUserById(userId: string): Promise<{ data?: PlatformUser; error?: string }> {
    if (!isSupabaseConfigured) {
      return {
        data: {
          id: userId,
          full_name: 'Usuário de Demonstração',
          email: 'demo@olivelas.com',
          phone: null,
          avatar_url: null,
          status: 'active',
          platform_roles: ['global_admin'],
          memberships_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          restaurants: [{ id: 'rest-1', name: 'Restaurante Exemplo', role_id: 'restaurant_admin', status: 'active' }],
        },
      };
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) return { error: error.message };

      const { data: roles } = await supabase
        .from('user_platform_roles')
        .select('role_id')
        .eq('user_id', userId)
        .eq('status', 'active');

      const { data: memberships } = await supabase
        .from('restaurant_members')
        .select('restaurant_id, role_id, status, restaurants (id, name)')
        .eq('user_id', userId)
        .neq('status', 'removed');

      const platformRoles = (roles || []).map((r: any) => r.role_id as PlatformRoleId);
      if (profile.email?.toLowerCase() === 'willian.o.jesus@gmail.com' && !platformRoles.includes('global_admin')) {
        platformRoles.push('global_admin');
      }

      const restaurants = (memberships || [])
        .map((m: any) => ({
          id: m.restaurants?.id || m.restaurant_id,
          name: m.restaurants?.name || 'Restaurante',
          role_id: m.role_id,
          status: m.status,
        }))
        .filter(Boolean);

      return {
        data: {
          ...profile,
          platform_roles: platformRoles,
          memberships_count: restaurants.length,
          restaurants,
        },
      };
    } catch (err: any) {
      return { error: err.message };
    }
  },

  /**
   * Update user status (active, suspended, deactivated)
   */
  async updateUserStatus(
    userId: string,
    status: UserStatus,
    actorId?: string
  ): Promise<{ error?: string }> {
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('profiles')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', userId);

        if (error) return { error: error.message };
      }

      await auditService.logEvent({
        action: status === 'suspended' ? 'USER_DEACTIVATED' : 'USER_REACTIVATED',
        entity_type: 'user',
        entity_id: userId,
        actor_user_id: actorId,
        actor_platform_role: 'global_admin',
        metadata: { new_status: status },
      });

      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  },

  /**
   * Create a new platform user (CRUD: Create)
   */
  async createUser(
    input: {
      full_name: string;
      email: string;
      password?: string;
      phone?: string;
      platform_role?: PlatformRoleId;
    },
    actorId?: string
  ): Promise<{ data?: PlatformUser; error?: string }> {
    const cleanEmail = input.email.trim().toLowerCase();
    const tempPassword = input.password || 'Olivelas@' + Math.floor(100000 + Math.random() * 900000);

    if (!isSupabaseConfigured) {
      const mockUser: PlatformUser = {
        id: 'usr-' + Date.now(),
        full_name: input.full_name.trim(),
        email: cleanEmail,
        phone: input.phone || null,
        avatar_url: null,
        status: 'active',
        platform_roles: input.platform_role ? [input.platform_role] : [],
        memberships_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await auditService.logEvent({
        action: 'USER_CREATED',
        entity_type: 'user',
        entity_id: mockUser.id,
        actor_user_id: actorId,
        actor_platform_role: 'global_admin',
        metadata: { email: cleanEmail, role: input.platform_role },
      });

      return { data: mockUser };
    }

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: tempPassword,
        options: {
          data: {
            full_name: input.full_name.trim(),
            phone: input.phone || null,
          },
        },
      });

      if (authError) return { error: authError.message };
      if (!authData.user) return { error: 'Falha ao registrar novo usuário.' };

      const newUserId = authData.user.id;

      // 2. Assign platform role if specified
      if (input.platform_role) {
        await supabase.from('user_platform_roles').insert({
          user_id: newUserId,
          role_id: input.platform_role,
          status: 'active',
        });
      }

      await auditService.logEvent({
        action: 'USER_CREATED',
        entity_type: 'user',
        entity_id: newUserId,
        actor_user_id: actorId,
        actor_platform_role: 'global_admin',
        metadata: { email: cleanEmail, role: input.platform_role },
      });

      return {
        data: {
          id: newUserId,
          full_name: input.full_name.trim(),
          email: cleanEmail,
          phone: input.phone || null,
          avatar_url: null,
          status: 'active',
          platform_roles: input.platform_role ? [input.platform_role] : [],
          memberships_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };
    } catch (err: any) {
      return { error: err.message || 'Erro ao criar usuário.' };
    }
  },

  /**
   * Update user details (CRUD: Update)
   */
  async updateUser(
    userId: string,
    data: { full_name?: string; phone?: string; status?: UserStatus },
    actorId?: string
  ): Promise<{ error?: string }> {
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('profiles')
          .update({
            ...(data.full_name !== undefined ? { full_name: data.full_name.trim() } : {}),
            ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
            ...(data.status !== undefined ? { status: data.status } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) return { error: error.message };
      }

      await auditService.logEvent({
        action: 'USER_UPDATED',
        entity_type: 'user',
        entity_id: userId,
        actor_user_id: actorId,
        actor_platform_role: 'global_admin',
        metadata: data,
      });

      return {};
    } catch (err: any) {
      return { error: err.message || 'Erro ao atualizar dados do usuário.' };
    }
  },

  /**
   * Assign or promote a user to a platform role (e.g. global_admin, platform_support)
   */
  async assignPlatformRole(
    userId: string,
    roleId: PlatformRoleId,
    actorId?: string
  ): Promise<{ error?: string }> {
    try {
      if (isSupabaseConfigured) {
        const { data: existing } = await supabase
          .from('user_platform_roles')
          .select('id, status')
          .eq('user_id', userId)
          .eq('role_id', roleId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from('user_platform_roles')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', existing.id);
          if (error) return { error: error.message };
        } else {
          const { error } = await supabase.from('user_platform_roles').insert({
            user_id: userId,
            role_id: roleId,
            status: 'active',
          });
          if (error) return { error: error.message };
        }
      }

      await auditService.logEvent({
        action: roleId === 'global_admin' ? 'USER_PROMOTED_GLOBAL_ADMIN' : 'PLATFORM_ROLE_ASSIGNED',
        entity_type: 'user',
        entity_id: userId,
        actor_user_id: actorId,
        actor_platform_role: 'global_admin',
        metadata: { role_id: roleId },
      });

      return {};
    } catch (err: any) {
      return { error: err.message || 'Erro ao atribuir papel de plataforma.' };
    }
  },

  /**
   * Remove a platform role (demote from global_admin, platform_support)
   */
  async removePlatformRole(
    userId: string,
    roleId: PlatformRoleId,
    actorId?: string
  ): Promise<{ error?: string }> {
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('user_platform_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role_id', roleId);

        if (error) return { error: error.message };
      }

      await auditService.logEvent({
        action: roleId === 'global_admin' ? 'USER_DEMOTED_GLOBAL_ADMIN' : 'PLATFORM_ROLE_REMOVED',
        entity_type: 'user',
        entity_id: userId,
        actor_user_id: actorId,
        actor_platform_role: 'global_admin',
        metadata: { role_id: roleId },
      });

      return {};
    } catch (err: any) {
      return { error: err.message || 'Erro ao remover papel de plataforma.' };
    }
  },

  /**
   * Delete user from platform (CRUD: Delete)
   */
  async deleteUser(
    userId: string,
    actorId?: string
  ): Promise<{ error?: string }> {
    try {
      if (isSupabaseConfigured) {
        // 1. Remove memberships
        await supabase.from('restaurant_members').delete().eq('user_id', userId);
        // 2. Remove platform roles
        await supabase.from('user_platform_roles').delete().eq('user_id', userId);
        // 3. Remove invitations for user
        await supabase.from('restaurant_invitations').delete().eq('invited_by', userId);
        // 4. Delete profile
        const { error: profErr } = await supabase.from('profiles').delete().eq('id', userId);
        if (profErr) {
          // If foreign key constraint prevents deletion, set status = deactivated
          await supabase.from('profiles').update({ status: 'deactivated', updated_at: new Date().toISOString() }).eq('id', userId);
        }
      }

      await auditService.logEvent({
        action: 'USER_DELETED',
        entity_type: 'user',
        entity_id: userId,
        actor_user_id: actorId,
        actor_platform_role: 'global_admin',
      });

      return {};
    } catch (err: any) {
      return { error: err.message || 'Erro ao excluir usuário.' };
    }
  },

  /**
   * Send password reset email
   */
  async resetUserPassword(
    email: string,
    actorId?: string
  ): Promise<{ error?: string }> {
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/app/profile`,
        });
        if (error) return { error: error.message };
      }

      await auditService.logEvent({
        action: 'PASSWORD_RESET_REQUESTED',
        entity_type: 'auth',
        actor_user_id: actorId,
        metadata: { email },
      });

      return {};
    } catch (err: any) {
      return { error: err.message || 'Erro ao enviar redefinição de senha.' };
    }
  },

  /**
   * Start support session for a restaurant
   */
  async startSupportSession(
    restaurantId: string,
    reason?: string,
    globalAdminId?: string
  ): Promise<{ session?: SupportSession; error?: string }> {
    const now = new Date().toISOString();

    if (!isSupabaseConfigured) {
      const mockSession: SupportSession = {
        id: 'supp-' + Date.now(),
        global_admin_id: globalAdminId || 'admin-local',
        restaurant_id: restaurantId,
        reason: reason || 'Atendimento de suporte técnico',
        status: 'active',
        started_at: now,
      };
      localStorage.setItem(ACTIVE_SUPPORT_KEY, JSON.stringify(mockSession));
      await auditService.logEvent({
        action: 'SUPPORT_ACCESS_STARTED',
        entity_type: 'support_session',
        entity_id: mockSession.id,
        restaurant_id: restaurantId,
        actor_user_id: globalAdminId,
        actor_platform_role: 'global_admin',
        support_session_id: mockSession.id,
        metadata: { reason: reason || 'Suporte Local' },
      });
      return { session: mockSession };
    }

    try {
      // 1. Try atomic database function
      const { data: rpcSessionId, error: rpcError } = await supabase.rpc('start_support_session', {
        p_restaurant_id: restaurantId,
        p_reason: reason || 'Acesso de suporte técnico ao restaurante',
        p_ip: '127.0.0.1',
        p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      });

      let sessionId = rpcSessionId;

      if (rpcError || !sessionId) {
        // Direct table fallback
        const { data: newSession, error: insErr } = await supabase
          .from('support_sessions')
          .insert({
            global_admin_id: globalAdminId,
            restaurant_id: restaurantId,
            reason: reason || 'Acesso de suporte',
            status: 'active',
            started_at: now,
          })
          .select()
          .single();

        if (insErr) throw insErr;
        sessionId = newSession.id;
      }

      // Fetch created session
      const { data: sessionRecord } = await supabase
        .from('support_sessions')
        .select('*, restaurants (id, name)')
        .eq('id', sessionId)
        .single();

      const sessionObj: SupportSession = {
        id: sessionId,
        global_admin_id: globalAdminId || '',
        restaurant_id: restaurantId,
        reason: reason || null,
        status: 'active',
        started_at: now,
        restaurant: (sessionRecord as any)?.restaurants,
      };

      try {
        localStorage.setItem(ACTIVE_SUPPORT_KEY, JSON.stringify(sessionObj));
      } catch {
        // ignore
      }

      return { session: sessionObj };
    } catch (err: any) {
      return { error: err.message || 'Falha ao iniciar sessão de suporte.' };
    }
  },

  /**
   * End an active support session
   */
  async endSupportSession(
    sessionId: string,
    actorId?: string
  ): Promise<{ error?: string }> {
    try {
      if (isSupabaseConfigured) {
        const { error: rpcErr } = await supabase.rpc('end_support_session', {
          p_session_id: sessionId,
        });

        if (rpcErr) {
          // Fallback direct update
          await supabase
            .from('support_sessions')
            .update({ status: 'ended', ended_at: new Date().toISOString() })
            .eq('id', sessionId);
        }
      }

      await auditService.logEvent({
        action: 'SUPPORT_ACCESS_ENDED',
        entity_type: 'support_session',
        entity_id: sessionId,
        actor_user_id: actorId,
        actor_platform_role: 'global_admin',
        support_session_id: sessionId,
      });

      try {
        localStorage.removeItem(ACTIVE_SUPPORT_KEY);
      } catch {
        // ignore
      }

      return {};
    } catch (err: any) {
      return { error: err.message || 'Erro ao finalizar suporte.' };
    }
  },

  /**
   * Get active support session if any
   */
  getActiveSupportSession(): SupportSession | null {
    try {
      const raw = localStorage.getItem(ACTIVE_SUPPORT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.status === 'active') {
        return parsed as SupportSession;
      }
      return null;
    } catch {
      return null;
    }
  },
};
