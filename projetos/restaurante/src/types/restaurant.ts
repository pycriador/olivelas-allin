export type RestaurantStatus = 'active' | 'inactive' | 'suspended';
export type MemberStatus = 'active' | 'invited' | 'suspended' | 'removed';

export type RoleId =
  | 'restaurant_admin'
  | 'manager'
  | 'waiter'
  | 'kitchen'
  | 'cashier';

export interface Restaurant {
  id: string;
  name: string;
  legal_name?: string | null;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  logo_url?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country: string;
  timezone: string;
  currency: string;
  status: RestaurantStatus;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface Role {
  id: RoleId;
  name: string;
  description: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface MemberProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone?: string | null;
}

export interface RestaurantMember {
  id: string;
  restaurant_id: string;
  user_id: string;
  role_id: RoleId;
  status: MemberStatus;
  joined_at: string;
  created_at: string;
  updated_at: string;
  profile?: MemberProfile | null;
  role?: Role | null;
}

export interface RestaurantInvitation {
  id: string;
  restaurant_id: string;
  email: string;
  role_id: RoleId;
  token: string;
  expires_at: string;
  invited_by?: string | null;
  accepted_at?: string | null;
  created_at: string;
  restaurant?: {
    id: string;
    name: string;
    logo_url?: string | null;
    city?: string | null;
    state?: string | null;
  } | null;
}

export interface AuditLog {
  id: string;
  restaurant_id: string;
  actor_user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}
