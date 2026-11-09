import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  Restaurant,
  RestaurantMember,
  RestaurantInvitation,
  RoleId,
  MemberStatus,
  AuditLog,
} from '@/types/restaurant';

export interface CreateRestaurantInput {
  name: string;
  legal_name?: string;
  document?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  timezone?: string;
  currency?: string;
}

const LOCAL_STORAGE_RESTAURANTS_KEY = 'olivelas_mock_restaurants';
const LOCAL_STORAGE_MEMBERS_KEY = 'olivelas_mock_members';
const LOCAL_STORAGE_INVITATIONS_KEY = 'olivelas_mock_invitations';
const LOCAL_STORAGE_AUDIT_KEY = 'olivelas_mock_audit_logs';

function getLocalInvitations(): RestaurantInvitation[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_INVITATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalInvitations(list: RestaurantInvitation[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_INVITATIONS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

const DEFAULT_RESTAURANTS: Restaurant[] = [
  {
    id: 'rest-1',
    name: 'Olivelas Gastronomia & Vinhos',
    legal_name: 'Olivelas Restaurante & Bar Ltda',
    document: '12.345.678/0001-90',
    email: 'contato@olivelas.com.br',
    phone: '(11) 98765-4321',
    address: 'Av. Paulista, 1500 - Jardins',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01310-100',
    country: 'BR',
    timezone: 'America/Sao_Paulo',
    currency: 'BRL',
    status: 'active',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rest-2',
    name: 'Olivelas Trattoria Jardins',
    legal_name: 'Olivelas Filial 02 Ltda',
    document: '12.345.678/0002-71',
    email: 'jardins@olivelas.com.br',
    phone: '(11) 98765-4322',
    address: 'Rua Oscar Freire, 820',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01426-001',
    country: 'BR',
    timezone: 'America/Sao_Paulo',
    currency: 'BRL',
    status: 'active',
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_MEMBERS: RestaurantMember[] = [
  {
    id: 'mem-admin-1',
    restaurant_id: 'rest-1',
    user_id: 'usr-admin-1',
    role_id: 'restaurant_admin',
    status: 'active',
    joined_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    updated_at: new Date().toISOString(),
    profile: {
      id: 'usr-admin-1',
      full_name: 'Carlos Mendes',
      email: 'carlos.admin@olivelas.com.br',
      avatar_url: null,
      phone: '(11) 99111-2233',
    },
    role: {
      id: 'restaurant_admin',
      name: 'Administrador',
      description: 'Controle total do restaurante e da equipe.',
    },
  },
  {
    id: 'mem-manager-1',
    restaurant_id: 'rest-1',
    user_id: 'usr-manager-1',
    role_id: 'manager',
    status: 'active',
    joined_at: new Date(Date.now() - 86400000 * 18).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 18).toISOString(),
    updated_at: new Date().toISOString(),
    profile: {
      id: 'usr-manager-1',
      full_name: 'Fernanda Lima',
      email: 'fernanda.gerente@olivelas.com.br',
      avatar_url: null,
      phone: '(11) 99222-3344',
    },
    role: {
      id: 'manager',
      name: 'Gerente',
      description: 'Gerenciamento operacional e produtos.',
    },
  },
  {
    id: 'mem-waiter-1',
    restaurant_id: 'rest-1',
    user_id: 'usr-waiter-1',
    role_id: 'waiter',
    status: 'active',
    joined_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date().toISOString(),
    profile: {
      id: 'usr-waiter-1',
      full_name: 'Roberto Alves',
      email: 'roberto.garcom@olivelas.com.br',
      avatar_url: null,
      phone: '(11) 99333-4455',
    },
    role: {
      id: 'waiter',
      name: 'Garçom',
      description: 'Operação de mesas e pedidos no salão.',
    },
  },
  {
    id: 'mem-kitchen-1',
    restaurant_id: 'rest-1',
    user_id: 'usr-kitchen-1',
    role_id: 'kitchen',
    status: 'active',
    joined_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    updated_at: new Date().toISOString(),
    profile: {
      id: 'usr-kitchen-1',
      full_name: 'Chef Marcelo Oliveira',
      email: 'marcelo.cozinha@olivelas.com.br',
      avatar_url: null,
      phone: '(11) 99444-5566',
    },
    role: {
      id: 'kitchen',
      name: 'Cozinha',
      description: 'Operação e visualização dos pedidos na cozinha.',
    },
  },
  {
    id: 'mem-cashier-1',
    restaurant_id: 'rest-1',
    user_id: 'usr-cashier-1',
    role_id: 'cashier',
    status: 'active',
    joined_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date().toISOString(),
    profile: {
      id: 'usr-cashier-1',
      full_name: 'Aline Santos',
      email: 'aline.caixa@olivelas.com.br',
      avatar_url: null,
      phone: '(11) 99555-6677',
    },
    role: {
      id: 'cashier',
      name: 'Caixa',
      description: 'Operação de caixa e fechamento de contas.',
    },
  },
  {
    id: 'mem-willian-1',
    restaurant_id: 'rest-1',
    user_id: 'usr-willian',
    role_id: 'restaurant_admin',
    status: 'active',
    joined_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
    profile: {
      id: 'usr-willian',
      full_name: 'Willian Jesus',
      email: 'willian.o.jesus@gmail.com',
      avatar_url: null,
      phone: '(11) 99999-9999',
    },
    role: {
      id: 'restaurant_admin',
      name: 'Administrador',
      description: 'Controle total do restaurante e da equipe.',
    },
  },
];

function getLocalRestaurants(): Restaurant[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_RESTAURANTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (!list || list.length === 0) {
      saveLocalRestaurants(DEFAULT_RESTAURANTS);
      return DEFAULT_RESTAURANTS;
    }
    return list;
  } catch {
    return DEFAULT_RESTAURANTS;
  }
}

function saveLocalRestaurants(list: Restaurant[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_RESTAURANTS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function getLocalMembers(): RestaurantMember[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MEMBERS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (!list || list.length === 0) {
      saveLocalMembers(DEFAULT_MEMBERS);
      return DEFAULT_MEMBERS;
    }
    return list;
  } catch {
    return DEFAULT_MEMBERS;
  }
}

function saveLocalMembers(list: RestaurantMember[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function getLocalAuditLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_AUDIT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAuditLog(log: AuditLog) {
  try {
    const current = getLocalAuditLogs();
    localStorage.setItem(
      LOCAL_STORAGE_AUDIT_KEY,
      JSON.stringify([log, ...current].slice(0, 100))
    );
  } catch {
    // ignore
  }
}

export const restaurantService = {
  /**
   * Fetch all active restaurants for the authenticated user
   */
  async getUserRestaurants(
    userId: string,
    isGlobalAdmin = false
  ): Promise<{ data: Restaurant[]; error?: string }> {
    if (!isSupabaseConfigured) {
      const all = getLocalRestaurants();
      if (isGlobalAdmin) {
        return { data: all };
      }
      const members = getLocalMembers().filter(
        (m) => m.user_id === userId && m.status === 'active'
      );
      const restaurantIds = new Set(members.map((m) => m.restaurant_id));
      const userRestaurants = all.filter((r) => restaurantIds.has(r.id));
      return { data: userRestaurants };
    }

    // Global Admin: load all restaurants on the platform
    if (isGlobalAdmin) {
      try {
        const { data: allRestaurants, error: allErr } = await supabase
          .from('restaurants')
          .select('*')
          .order('name');

        if (allErr || !allRestaurants || allRestaurants.length === 0) {
          return { data: getLocalRestaurants() };
        }

        return { data: allRestaurants as Restaurant[] };
      } catch (err: any) {
        return { data: getLocalRestaurants() };
      }
    }

    try {
      // 1. Query user memberships
      const { data: memberRows, error: memberError } = await supabase
        .from('restaurant_members')
        .select('restaurant_id, status')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (memberError || !memberRows || memberRows.length === 0) {
        const all = getLocalRestaurants();
        const members = getLocalMembers().filter(
          (m) => (m.user_id === userId || m.profile?.id === userId) && m.status === 'active'
        );
        const restaurantIds = new Set(members.map((m) => m.restaurant_id));
        const matched = all.filter((r) => restaurantIds.has(r.id));
        return { data: matched.length > 0 ? matched : all };
      }

      // 2. Query matching active restaurants
      const restIds = memberRows.map((row) => row.restaurant_id).filter(Boolean);
      const { data: restaurants, error: restError } = await supabase
        .from('restaurants')
        .select('*')
        .in('id', restIds)
        .eq('status', 'active');

      if (restError || !restaurants || restaurants.length === 0) {
        return { data: getLocalRestaurants() };
      }

      return { data: restaurants as Restaurant[] };
    } catch (err: any) {
      return { data: getLocalRestaurants() };
    }
  },

  /**
   * Create a new restaurant and associate caller as restaurant_admin
   */
  async createRestaurant(
    userId: string,
    input: CreateRestaurantInput
  ): Promise<{ data?: Restaurant; error?: string }> {
    if (!isSupabaseConfigured) {
      const id = 'rest-' + Date.now();
      const now = new Date().toISOString();
      const newRestaurant: Restaurant = {
        id,
        name: input.name.trim(),
        legal_name: input.legal_name || null,
        document: input.document || null,
        email: input.email || null,
        phone: input.phone || null,
        whatsapp: input.whatsapp || null,
        logo_url: null,
        address: input.address || null,
        city: input.city || null,
        state: input.state || null,
        zip_code: input.zip_code || null,
        country: input.country || 'BR',
        timezone: input.timezone || 'America/Sao_Paulo',
        currency: input.currency || 'BRL',
        status: 'active',
        created_at: now,
        updated_at: now,
        created_by: userId,
      };

      const member: RestaurantMember = {
        id: 'member-' + Date.now(),
        restaurant_id: id,
        user_id: userId,
        role_id: 'restaurant_admin',
        status: 'active',
        joined_at: now,
        created_at: now,
        updated_at: now,
        role: {
          id: 'restaurant_admin',
          name: 'Administrador',
          description: 'Controle total do restaurante e da equipe.',
        },
      };

      const audit: AuditLog = {
        id: 'audit-' + Date.now(),
        restaurant_id: id,
        actor_user_id: userId,
        action: 'RESTAURANT_CREATED',
        entity_type: 'restaurant',
        entity_id: id,
        metadata: { name: newRestaurant.name },
        created_at: now,
      };

      const currentRestaurants = getLocalRestaurants();
      saveLocalRestaurants([...currentRestaurants, newRestaurant]);

      const currentMembers = getLocalMembers();
      saveLocalMembers([...currentMembers, member]);

      saveLocalAuditLog(audit);

      return { data: newRestaurant };
    }

    try {
      // 1. Try atomic database function if available
      const { data: rpcRestaurantId, error: rpcError } = await supabase.rpc(
        'create_restaurant_with_admin',
        {
          p_name: input.name.trim(),
          p_legal_name: input.legal_name || null,
          p_document: input.document || null,
          p_email: input.email || null,
          p_phone: input.phone || null,
          p_whatsapp: input.whatsapp || null,
          p_address: input.address || null,
          p_city: input.city || null,
          p_state: input.state || null,
          p_zip_code: input.zip_code || null,
          p_country: input.country || 'BR',
          p_timezone: input.timezone || 'America/Sao_Paulo',
          p_currency: input.currency || 'BRL',
        }
      );

      if (!rpcError && rpcRestaurantId) {
        const { data: createdRestaurant } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', rpcRestaurantId)
          .single();
        return { data: createdRestaurant as Restaurant };
      }

      // 2. Direct insert fallback if rpc is not yet compiled
      const now = new Date().toISOString();
      const { data: restData, error: restError } = await supabase
        .from('restaurants')
        .insert({
          name: input.name.trim(),
          legal_name: input.legal_name || null,
          document: input.document || null,
          email: input.email || null,
          phone: input.phone || null,
          whatsapp: input.whatsapp || null,
          address: input.address || null,
          city: input.city || null,
          state: input.state || null,
          zip_code: input.zip_code || null,
          country: input.country || 'BR',
          timezone: input.timezone || 'America/Sao_Paulo',
          currency: input.currency || 'BRL',
          status: 'active',
          created_by: userId,
        })
        .select()
        .single();

      if (restError) {
        if (restError.code === 'PGRST205') {
          // Table not yet created in Supabase: fallback to mock store
          return this.createRestaurant(userId, input);
        }
        return { error: restError.message };
      }

      // Add membership
      await supabase.from('restaurant_members').insert({
        restaurant_id: restData.id,
        user_id: userId,
        role_id: 'restaurant_admin',
        status: 'active',
        joined_at: now,
      });

      // Audit log
      await supabase.from('audit_logs').insert({
        restaurant_id: restData.id,
        actor_user_id: userId,
        action: 'RESTAURANT_CREATED',
        entity_type: 'restaurant',
        entity_id: restData.id,
        metadata: { name: restData.name },
      });

      return { data: restData as Restaurant };
    } catch (err: any) {
      return { error: err.message || 'Erro ao criar restaurante.' };
    }
  },

  /**
   * Update restaurant details
   */
  async updateRestaurant(
    restaurantId: string,
    data: Partial<Restaurant>,
    userId?: string
  ): Promise<{ data?: Restaurant; error?: string }> {
    if (!isSupabaseConfigured) {
      const all = getLocalRestaurants();
      const idx = all.findIndex((r) => r.id === restaurantId);
      if (idx === -1) return { error: 'Restaurante não encontrado.' };
      const updated = {
        ...all[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      all[idx] = updated;
      saveLocalRestaurants(all);

      if (userId) {
        saveLocalAuditLog({
          id: 'audit-' + Date.now(),
          restaurant_id: restaurantId,
          actor_user_id: userId,
          action: 'RESTAURANT_UPDATED',
          entity_type: 'restaurant',
          entity_id: restaurantId,
          metadata: data as Record<string, unknown>,
          created_at: new Date().toISOString(),
        });
      }

      return { data: updated };
    }

    try {
      const { data: updated, error } = await supabase
        .from('restaurants')
        .update(data)
        .eq('id', restaurantId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST205') {
          return this.updateRestaurant(restaurantId, data, userId);
        }
        return { error: error.message };
      }

      if (userId) {
        await supabase.from('audit_logs').insert({
          restaurant_id: restaurantId,
          actor_user_id: userId,
          action: 'RESTAURANT_UPDATED',
          entity_type: 'restaurant',
          entity_id: restaurantId,
          metadata: data as Record<string, unknown>,
        });
      }

      return { data: updated as Restaurant };
    } catch (err: any) {
      return { error: err.message || 'Erro ao atualizar dados do restaurante.' };
    }
  },

  /**
   * Fetch members of a restaurant
   */
  async getRestaurantMembers(
    restaurantId: string
  ): Promise<{ data: RestaurantMember[]; error?: string }> {
    if (!isSupabaseConfigured) {
      const members = getLocalMembers().filter(
        (m) => m.restaurant_id === restaurantId && m.status !== 'removed'
      );
      return { data: members };
    }

    try {
      // 1. Fetch member records
      const { data: memberRows, error: membersError } = await supabase
        .from('restaurant_members')
        .select('id, restaurant_id, user_id, role_id, status, joined_at, created_at, updated_at')
        .eq('restaurant_id', restaurantId)
        .neq('status', 'removed');

      if (membersError || !memberRows || memberRows.length === 0) {
        const members = getLocalMembers().filter(
          (m) => m.restaurant_id === restaurantId && m.status !== 'removed'
        );
        return { data: members };
      }

      // 2. Fetch profiles for member user IDs
      const userIds = Array.from(new Set(memberRows.map((m: any) => m.user_id).filter(Boolean)));
      const profilesMap = new Map<string, any>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url, phone')
          .in('id', userIds);

        if (profiles) {
          profiles.forEach((p: any) => profilesMap.set(p.id, p));
        }
      }

      // 3. Fetch roles metadata
      const roleIds = Array.from(new Set(memberRows.map((m: any) => m.role_id).filter(Boolean)));
      const rolesMap = new Map<string, any>();
      if (roleIds.length > 0) {
        const { data: roles } = await supabase
          .from('roles')
          .select('id, name, description')
          .in('id', roleIds);

        if (roles) {
          roles.forEach((r: any) => rolesMap.set(r.id, r));
        }
      }

      // 4. Combine into complete RestaurantMember objects
      const formatted: RestaurantMember[] = memberRows.map((row: any) => ({
        id: row.id,
        restaurant_id: row.restaurant_id,
        user_id: row.user_id,
        role_id: row.role_id,
        status: row.status,
        joined_at: row.joined_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        profile: profilesMap.get(row.user_id) || {
          id: row.user_id,
          full_name: 'Usuário',
          email: '',
          avatar_url: null,
          phone: null,
        },
        role: rolesMap.get(row.role_id) || {
          id: row.role_id,
          name: row.role_id,
          description: '',
        },
      }));

      return { data: formatted };
    } catch (err: any) {
      const members = getLocalMembers().filter(
        (m) => m.restaurant_id === restaurantId && m.status !== 'removed'
      );
      return { data: members };
    }
  },

  /**
   * Add a member or send invitation
   */
  async addMember(
    restaurantId: string,
    email: string,
    name: string,
    roleId: RoleId,
    actorUserId?: string
  ): Promise<{ data?: RestaurantMember; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    if (!isSupabaseConfigured) {
      const existing = getLocalMembers().find(
        (m) =>
          m.restaurant_id === restaurantId &&
          m.profile?.email?.toLowerCase() === cleanEmail &&
          m.status !== 'removed'
      );
      if (existing) {
        return { error: 'Este e-mail já pertence à equipe deste restaurante.' };
      }

      const now = new Date().toISOString();
      const roleDescriptions: Record<RoleId, string> = {
        restaurant_admin: 'Controle total do restaurante e da equipe.',
        manager: 'Gerenciamento operacional e produtos.',
        waiter: 'Operação de mesas e pedidos no salão.',
        kitchen: 'Operação e visualização dos pedidos na cozinha.',
        cashier: 'Operação de caixa e fechamento de contas.',
      };
      const roleNames: Record<RoleId, string> = {
        restaurant_admin: 'Administrador',
        manager: 'Gerente',
        waiter: 'Garçom',
        kitchen: 'Cozinha',
        cashier: 'Caixa',
      };

      const newMember: RestaurantMember = {
        id: 'member-' + Date.now(),
        restaurant_id: restaurantId,
        user_id: 'user-' + Date.now(),
        role_id: roleId,
        status: 'active',
        joined_at: now,
        created_at: now,
        updated_at: now,
        profile: {
          id: 'user-' + Date.now(),
          full_name: name.trim(),
          email: cleanEmail,
          avatar_url: null,
          phone: null,
        },
        role: {
          id: roleId,
          name: roleNames[roleId],
          description: roleDescriptions[roleId],
        },
      };

      const current = getLocalMembers();
      saveLocalMembers([...current, newMember]);

      if (actorUserId) {
        saveLocalAuditLog({
          id: 'audit-' + Date.now(),
          restaurant_id: restaurantId,
          actor_user_id: actorUserId,
          action: 'MEMBER_ADDED',
          entity_type: 'member',
          entity_id: newMember.id,
          metadata: { email: cleanEmail, role_id: roleId },
          created_at: now,
        });
      }

      return { data: newMember };
    }

    try {
      // Find user by email in profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (profile) {
        // User exists: check membership
        const { data: existingMember } = await supabase
          .from('restaurant_members')
          .select('id, status')
          .eq('restaurant_id', restaurantId)
          .eq('user_id', profile.id)
          .maybeSingle();

        if (existingMember && existingMember.status === 'active') {
          return { error: 'Este usuário já faz parte da equipe.' };
        }

        if (existingMember) {
          // Re-activate member
          const { data: reactivated, error } = await supabase
            .from('restaurant_members')
            .update({ role_id: roleId, status: 'active', updated_at: new Date().toISOString() })
            .eq('id', existingMember.id)
            .select()
            .single();

          if (error) return { error: error.message };
          return { data: reactivated as RestaurantMember };
        }

        // Insert new member
        const { data: newMember, error: insertError } = await supabase
          .from('restaurant_members')
          .insert({
            restaurant_id: restaurantId,
            user_id: profile.id,
            role_id: roleId,
            status: 'active',
          })
          .select()
          .single();

        if (insertError) return { error: insertError.message };

        if (actorUserId) {
          await supabase.from('audit_logs').insert({
            restaurant_id: restaurantId,
            actor_user_id: actorUserId,
            action: 'MEMBER_ADDED',
            entity_type: 'member',
            entity_id: newMember.id,
            metadata: { email: cleanEmail, role_id: roleId },
          });
        }

        return { data: newMember as RestaurantMember };
      }

      // User does not exist yet: create invitation token
      const token = crypto.randomUUID ? crypto.randomUUID() : 'inv-' + Math.random().toString(36).slice(2);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { error: invError } = await supabase.from('restaurant_invitations').insert({
        restaurant_id: restaurantId,
        email: cleanEmail,
        role_id: roleId,
        token,
        expires_at: expiresAt,
        invited_by: actorUserId,
      });

      if (invError) {
        if (invError.code === 'PGRST205') {
          return this.addMember(restaurantId, email, name, roleId, actorUserId);
        }
        return { error: invError.message };
      }

      return {
        data: {
          id: 'inv-' + Date.now(),
          restaurant_id: restaurantId,
          user_id: 'pending',
          role_id: roleId,
          status: 'invited',
          joined_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          profile: {
            id: 'pending',
            full_name: name,
            email: cleanEmail,
            avatar_url: null,
          },
        },
      };
    } catch (err: any) {
      return { error: err.message || 'Erro ao adicionar membro à equipe.' };
    }
  },

  /**
   * Send an invitation to an email address
   */
  async inviteMember(
    restaurantId: string,
    email: string,
    roleId: RoleId,
    actorUserId?: string
  ): Promise<{ data?: RestaurantInvitation; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    if (!isSupabaseConfigured) {
      const existingMember = getLocalMembers().find(
        (m) =>
          m.restaurant_id === restaurantId &&
          m.profile?.email?.toLowerCase() === cleanEmail &&
          m.status === 'active'
      );
      if (existingMember) {
        return { error: 'Este usuário já faz parte da equipe deste restaurante.' };
      }

      const invites = getLocalInvitations();
      const existingInvite = invites.find(
        (inv) =>
          inv.restaurant_id === restaurantId &&
          inv.email.toLowerCase() === cleanEmail &&
          !inv.accepted_at
      );
      if (existingInvite) {
        return { error: 'Já existe um convite pendente para este e-mail neste restaurante.' };
      }

      const newInvite: RestaurantInvitation = {
        id: 'inv-' + Date.now(),
        restaurant_id: restaurantId,
        email: cleanEmail,
        role_id: roleId,
        token: 'tok-' + Date.now(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        invited_by: actorUserId,
        created_at: new Date().toISOString(),
      };

      saveLocalInvitations([...invites, newInvite]);

      if (actorUserId) {
        saveLocalAuditLog({
          id: 'audit-' + Date.now(),
          restaurant_id: restaurantId,
          actor_user_id: actorUserId,
          action: 'INVITATION_SENT',
          entity_type: 'invitation',
          entity_id: newInvite.id,
          metadata: { email: cleanEmail, role_id: roleId },
          created_at: new Date().toISOString(),
        });
      }

      return { data: newInvite };
    }

    try {
      // 1. Check if already an active member
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingProfile) {
        const { data: member } = await supabase
          .from('restaurant_members')
          .select('id, status')
          .eq('restaurant_id', restaurantId)
          .eq('user_id', existingProfile.id)
          .maybeSingle();

        if (member && member.status === 'active') {
          return { error: 'Este usuário já faz parte da equipe deste restaurante.' };
        }
      }

      // 2. Check if already has pending invite
      const { data: pendingInvite } = await supabase
        .from('restaurant_invitations')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('email', cleanEmail)
        .is('accepted_at', null)
        .maybeSingle();

      if (pendingInvite) {
        return { error: 'Já existe um convite pendente para este e-mail neste restaurante.' };
      }

      const token = crypto.randomUUID ? crypto.randomUUID() : 'inv-' + Math.random().toString(36).slice(2);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: created, error } = await supabase
        .from('restaurant_invitations')
        .insert({
          restaurant_id: restaurantId,
          email: cleanEmail,
          role_id: roleId,
          token,
          expires_at: expiresAt,
          invited_by: actorUserId,
        })
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      if (actorUserId) {
        await supabase.from('audit_logs').insert({
          restaurant_id: restaurantId,
          actor_user_id: actorUserId,
          action: 'INVITATION_SENT',
          entity_type: 'invitation',
          entity_id: created.id,
          metadata: { email: cleanEmail, role_id: roleId },
        });
      }

      return { data: created as RestaurantInvitation };
    } catch (err: any) {
      return { error: err.message || 'Erro ao enviar convite.' };
    }
  },

  /**
   * Fetch pending invitations for a specific user email
   */
  async getUserInvitations(
    email: string
  ): Promise<{ data: RestaurantInvitation[]; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    if (!isSupabaseConfigured) {
      const all = getLocalInvitations();
      const restaurants = getLocalRestaurants();
      const now = new Date();
      const pending = all
        .filter(
          (inv) =>
            inv.email.toLowerCase() === cleanEmail &&
            !inv.accepted_at &&
            new Date(inv.expires_at) > now
        )
        .map((inv) => {
          const rest = restaurants.find((r) => r.id === inv.restaurant_id);
          return {
            ...inv,
            restaurant: rest
              ? {
                  id: rest.id,
                  name: rest.name,
                  logo_url: rest.logo_url,
                  city: rest.city,
                  state: rest.state,
                }
              : null,
          };
        });

      return { data: pending };
    }

    try {
      const { data, error } = await supabase
        .from('restaurant_invitations')
        .select(`
          id,
          restaurant_id,
          email,
          role_id,
          token,
          expires_at,
          invited_by,
          accepted_at,
          created_at,
          restaurants (
            id,
            name,
            logo_url,
            city,
            state
          )
        `)
        .eq('email', cleanEmail)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST205') {
          return { data: [] };
        }
        return { data: [], error: error.message };
      }

      const formatted: RestaurantInvitation[] = (data || []).map((row: any) => ({
        id: row.id,
        restaurant_id: row.restaurant_id,
        email: row.email,
        role_id: row.role_id,
        token: row.token,
        expires_at: row.expires_at,
        invited_by: row.invited_by,
        accepted_at: row.accepted_at,
        created_at: row.created_at,
        restaurant: row.restaurants || null,
      }));

      return { data: formatted };
    } catch (err: any) {
      return { data: [], error: err.message || 'Erro ao carregar convites.' };
    }
  },

  /**
   * Fetch pending invitations sent by a restaurant
   */
  async getRestaurantInvitations(
    restaurantId: string
  ): Promise<{ data: RestaurantInvitation[]; error?: string }> {
    if (!isSupabaseConfigured) {
      const all = getLocalInvitations();
      const pending = all.filter((inv) => inv.restaurant_id === restaurantId && !inv.accepted_at);
      return { data: pending };
    }

    try {
      const { data, error } = await supabase
        .from('restaurant_invitations')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .is('accepted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST205') {
          return { data: [] };
        }
        return { data: [], error: error.message };
      }

      return { data: (data || []) as RestaurantInvitation[] };
    } catch (err: any) {
      return { data: [], error: err.message || 'Erro ao buscar convites pendentes.' };
    }
  },

  /**
   * Accept an invitation and join the restaurant
   */
  async acceptInvitation(
    invitationId: string,
    userId: string
  ): Promise<{ success: boolean; restaurantId?: string; error?: string }> {
    if (!isSupabaseConfigured) {
      const invites = getLocalInvitations();
      const inv = invites.find((i) => i.id === invitationId);
      if (!inv) return { success: false, error: 'Convite não encontrado.' };

      inv.accepted_at = new Date().toISOString();
      saveLocalInvitations(invites);

      const members = getLocalMembers();
      const newMember: RestaurantMember = {
        id: 'member-' + Date.now(),
        restaurant_id: inv.restaurant_id,
        user_id: userId,
        role_id: inv.role_id,
        status: 'active',
        joined_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profile: {
          id: userId,
          full_name: 'Usuário',
          email: inv.email,
          avatar_url: null,
        },
      };
      saveLocalMembers([...members, newMember]);

      return { success: true, restaurantId: inv.restaurant_id };
    }

    try {
      // 1. Fetch invitation
      const { data: inv, error: fetchErr } = await supabase
        .from('restaurant_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (fetchErr || !inv) {
        return { success: false, error: fetchErr?.message || 'Convite não encontrado.' };
      }

      if (inv.accepted_at) {
        return { success: false, error: 'Este convite já foi aceito anteriormente.' };
      }

      // 2. Check if member record already exists
      const { data: existingMember } = await supabase
        .from('restaurant_members')
        .select('id')
        .eq('restaurant_id', inv.restaurant_id)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingMember) {
        const { error: updErr } = await supabase
          .from('restaurant_members')
          .update({
            role_id: inv.role_id,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingMember.id);

        if (updErr) return { success: false, error: updErr.message };
      } else {
        const { error: insErr } = await supabase.from('restaurant_members').insert({
          restaurant_id: inv.restaurant_id,
          user_id: userId,
          role_id: inv.role_id,
          status: 'active',
        });

        if (insErr) return { success: false, error: insErr.message };
      }

      // 3. Mark invitation as accepted
      await supabase
        .from('restaurant_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitationId);

      // 4. Audit
      await supabase.from('audit_logs').insert({
        restaurant_id: inv.restaurant_id,
        actor_user_id: userId,
        action: 'INVITATION_ACCEPTED',
        entity_type: 'invitation',
        entity_id: invitationId,
        metadata: { role_id: inv.role_id },
      });

      return { success: true, restaurantId: inv.restaurant_id };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao aceitar convite.' };
    }
  },

  /**
   * Decline an invitation
   */
  async declineInvitation(invitationId: string): Promise<{ error?: string }> {
    if (!isSupabaseConfigured) {
      const invites = getLocalInvitations().filter((i) => i.id !== invitationId);
      saveLocalInvitations(invites);
      return {};
    }

    try {
      const { error } = await supabase
        .from('restaurant_invitations')
        .update({ accepted_at: '1970-01-01T00:00:00Z' })
        .eq('id', invitationId);

      if (error) {
        const { error: delErr } = await supabase
          .from('restaurant_invitations')
          .delete()
          .eq('id', invitationId);
        if (delErr) return { error: delErr.message };
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Erro ao recusar convite.' };
    }
  },

  /**
   * Revoke/cancel a pending invitation (by restaurant admin or global admin)
   */
  async cancelInvitation(
    invitationId: string,
    restaurantId: string,
    actorUserId?: string
  ): Promise<{ error?: string }> {
    if (!isSupabaseConfigured) {
      const invites = getLocalInvitations().filter((i) => i.id !== invitationId);
      saveLocalInvitations(invites);
      return {};
    }

    try {
      const { error } = await supabase
        .from('restaurant_invitations')
        .delete()
        .eq('id', invitationId)
        .eq('restaurant_id', restaurantId);

      if (error) return { error: error.message };

      if (actorUserId) {
        await supabase.from('audit_logs').insert({
          restaurant_id: restaurantId,
          actor_user_id: actorUserId,
          action: 'INVITATION_CANCELLED',
          entity_type: 'invitation',
          entity_id: invitationId,
        });
      }

      return {};
    } catch (err: any) {
      return { error: err.message || 'Erro ao cancelar convite.' };
    }
  },

  /**
   * Update member role
   */
  async updateMemberRole(
    memberId: string,
    newRoleId: RoleId,
    restaurantId: string,
    actorUserId?: string
  ): Promise<{ error?: string }> {
    if (!isSupabaseConfigured) {
      const members = getLocalMembers();
      const idx = members.findIndex((m) => m.id === memberId);
      if (idx === -1) return { error: 'Membro não encontrado.' };

      // Protection: cannot change last active admin
      if (members[idx].role_id === 'restaurant_admin' && newRoleId !== 'restaurant_admin') {
        const adminCount = members.filter(
          (m) =>
            m.restaurant_id === restaurantId &&
            m.role_id === 'restaurant_admin' &&
            m.status === 'active' &&
            m.id !== memberId
        ).length;
        if (adminCount === 0) {
          return { error: 'Não é permitido alterar o papel do último administrador ativo.' };
        }
      }

      members[idx].role_id = newRoleId;
      members[idx].updated_at = new Date().toISOString();
      saveLocalMembers(members);

      if (actorUserId) {
        saveLocalAuditLog({
          id: 'audit-' + Date.now(),
          restaurant_id: restaurantId,
          actor_user_id: actorUserId,
          action: 'MEMBER_ROLE_CHANGED',
          entity_type: 'member',
          entity_id: memberId,
          metadata: { new_role: newRoleId },
          created_at: new Date().toISOString(),
        });
      }

      return {};
    }

    try {
      const { error } = await supabase
        .from('restaurant_members')
        .update({ role_id: newRoleId, updated_at: new Date().toISOString() })
        .eq('id', memberId)
        .eq('restaurant_id', restaurantId);

      if (error) {
        if (error.code === 'PGRST205') {
          return this.updateMemberRole(memberId, newRoleId, restaurantId, actorUserId);
        }
        return { error: error.message };
      }

      if (actorUserId) {
        await supabase.from('audit_logs').insert({
          restaurant_id: restaurantId,
          actor_user_id: actorUserId,
          action: 'MEMBER_ROLE_CHANGED',
          entity_type: 'member',
          entity_id: memberId,
          metadata: { new_role: newRoleId },
        });
      }

      return {};
    } catch (err: any) {
      return { error: err.message || 'Erro ao alterar o papel do usuário.' };
    }
  },

  /**
   * Suspend or toggle member status
   */
  async updateMemberStatus(
    memberId: string,
    newStatus: MemberStatus,
    restaurantId: string,
    actorUserId?: string
  ): Promise<{ error?: string }> {
    if (!isSupabaseConfigured) {
      const members = getLocalMembers();
      const idx = members.findIndex((m) => m.id === memberId);
      if (idx === -1) return { error: 'Membro não encontrado.' };

      // Protection: cannot suspend last active admin
      if (members[idx].role_id === 'restaurant_admin' && newStatus !== 'active') {
        const adminCount = members.filter(
          (m) =>
            m.restaurant_id === restaurantId &&
            m.role_id === 'restaurant_admin' &&
            m.status === 'active' &&
            m.id !== memberId
        ).length;
        if (adminCount === 0) {
          return { error: 'Não é permitido suspender ou desativar o último administrador ativo.' };
        }
      }

      members[idx].status = newStatus;
      members[idx].updated_at = new Date().toISOString();
      saveLocalMembers(members);

      if (actorUserId) {
        saveLocalAuditLog({
          id: 'audit-' + Date.now(),
          restaurant_id: restaurantId,
          actor_user_id: actorUserId,
          action: newStatus === 'suspended' ? 'MEMBER_SUSPENDED' : 'MEMBER_UPDATED',
          entity_type: 'member',
          entity_id: memberId,
          metadata: { status: newStatus },
          created_at: new Date().toISOString(),
        });
      }

      return {};
    }

    try {
      const { error } = await supabase
        .from('restaurant_members')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', memberId)
        .eq('restaurant_id', restaurantId);

      if (error) {
        if (error.code === 'PGRST205') {
          return this.updateMemberStatus(memberId, newStatus, restaurantId, actorUserId);
        }
        return { error: error.message };
      }

      if (actorUserId) {
        await supabase.from('audit_logs').insert({
          restaurant_id: restaurantId,
          actor_user_id: actorUserId,
          action: newStatus === 'suspended' ? 'MEMBER_SUSPENDED' : 'MEMBER_UPDATED',
          entity_type: 'member',
          entity_id: memberId,
          metadata: { status: newStatus },
        });
      }

      return {};
    } catch (err: any) {
      return { error: err.message || 'Erro ao alterar status do membro.' };
    }
  },

  /**
   * Remove member (soft delete via status = 'removed')
   */
  async removeMember(
    memberId: string,
    restaurantId: string,
    actorUserId?: string
  ): Promise<{ error?: string }> {
    return this.updateMemberStatus(memberId, 'removed', restaurantId, actorUserId);
  },

  /**
   * Upload restaurant logo to Supabase Storage
   */
  async uploadRestaurantLogo(
    restaurantId: string,
    file: File
  ): Promise<{ url?: string; error?: string }> {
    // Validate file type
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validMimeTypes.includes(file.type)) {
      return { error: 'Formato inválido. Envie um arquivo PNG, JPG, WebP ou SVG.' };
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return { error: 'O tamanho da logo não pode ultrapassar 2MB.' };
    }

    if (!isSupabaseConfigured) {
      // Create local object URL for preview
      const localUrl = URL.createObjectURL(file);
      await this.updateRestaurant(restaurantId, { logo_url: localUrl });
      return { url: localUrl };
    }

    try {
      const ext = file.name.split('.').pop() || 'png';
      const filePath = `restaurants/${restaurantId}/logo/logo-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('restaurants')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.warn('Storage upload error:', uploadError.message);
        // If storage bucket is not configured, fallback to base64 preview
        const reader = new FileReader();
        return new Promise((resolve) => {
          reader.onload = async () => {
            const dataUrl = reader.result as string;
            await this.updateRestaurant(restaurantId, { logo_url: dataUrl });
            resolve({ url: dataUrl });
          };
          reader.readAsDataURL(file);
        });
      }

      const { data: publicUrlData } = supabase.storage
        .from('restaurants')
        .getPublicUrl(filePath);

      const logoUrl = publicUrlData.publicUrl;
      await this.updateRestaurant(restaurantId, { logo_url: logoUrl });

      return { url: logoUrl };
    } catch (err: any) {
      return { error: err.message || 'Falha ao enviar a imagem.' };
    }
  },

  /**
   * Fetch audit logs for current restaurant
   */
  async getAuditLogs(restaurantId: string): Promise<AuditLog[]> {
    if (!isSupabaseConfigured) {
      return getLocalAuditLogs().filter((l) => l.restaurant_id === restaurantId);
    }

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        return getLocalAuditLogs().filter((l) => l.restaurant_id === restaurantId);
      }

      return data as AuditLog[];
    } catch {
      return [];
    }
  },
};
