import type { Restaurant } from './restaurant';

export type UserStatus = 'active' | 'suspended' | 'deactivated';
export type PlatformRoleId = 'global_admin' | 'platform_support';

export interface Profile {
  id: string;
  auth_user_id?: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface PlatformRole {
  id: PlatformRoleId;
  name: string;
  description: string;
  created_at: string;
}

export interface UserPlatformRole {
  id: string;
  user_id: string;
  role_id: PlatformRoleId;
  status: 'active' | 'suspended';
  created_at: string;
  updated_at: string;
  role?: PlatformRole;
}

export interface SupportSession {
  id: string;
  global_admin_id: string;
  restaurant_id: string;
  reason?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  status: 'active' | 'ended';
  started_at: string;
  ended_at?: string | null;
  metadata?: Record<string, unknown>;
  restaurant?: Restaurant;
  admin_profile?: Profile;
}

export interface PlatformUser extends Profile {
  platform_roles: PlatformRoleId[];
  memberships_count: number;
  restaurants?: Array<{
    id: string;
    name: string;
    role_id: string;
    status: string;
  }>;
}
