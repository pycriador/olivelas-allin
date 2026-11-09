export type DeviceType = 'desktop' | 'mobile' | 'tablet';
export type SessionStatus = 'active' | 'revoked' | 'expired';

export interface PlatformSession {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_avatar?: string | null;
  platform_role?: string | null;
  ip_address: string;
  user_agent: string;
  browser: string;
  os: string;
  device_type: DeviceType;
  status: SessionStatus;
  is_current: boolean;
  created_at: string;
  last_activity_at: string;
  expires_at: string;
}

export interface SessionStats {
  activeSessionsCount: number;
  uniqueUsersOnlineCount: number;
  loginsTodayCount: number;
  failedLoginsTodayCount: number;
}
