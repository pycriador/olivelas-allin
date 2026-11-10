export interface UserSession {
  id: string;
  userId: string;
  deviceName: string | null;
  deviceType: 'desktop' | 'tablet' | 'mobile' | 'unknown' | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  isCurrent: boolean;
  lastActiveAt: string;
  createdAt: string;
}
