export type ExecutionMode = 'app_and_tunnel' | 'tunnel_only' | 'app_only';
export type TunnelProvider = 'none' | 'cloudflared' | 'ngrok' | 'localtunnel' | 'custom';

export interface ProviderBinInfo {
  installed: boolean;
  version: string;
  path: string;
}

export interface ProvidersStatus {
  lanIp: string;
  hostname: string;
  platform: string;
  defaultProvider: TunnelProvider;
  hasNgrokToken: boolean;
  ngrokDomain: string;
  hasCloudflaredToken: boolean;
  cloudflaredProtocol: 'auto' | 'http2' | 'quic';
  providers: {
    cloudflared: ProviderBinInfo;
    ngrok: ProviderBinInfo;
    npx: ProviderBinInfo;
    ssh: ProviderBinInfo;
  };
}

export interface DetectedUrlItem {
  url: string;
  label: string;
  category: 'local' | 'lan' | 'public';
  port?: number;
  source: 'app' | 'tunnel';
  detectedAt: string;
}

export interface AppTunnelItem {
  id: number;
  name: string;
  description: string;
  execution_mode: ExecutionMode;
  local_path: string;
  start_command: string;
  local_host: string;
  local_port: number;
  local_protocol: 'http' | 'https';
  env_vars: string;
  tunnel_provider: TunnelProvider;
  tunnel_auth_mode: 'quick' | 'token';
  has_custom_token?: boolean;
  tunnel_custom_domain: string;
  tunnel_custom_command: string;
  auto_restart: boolean;
  auto_start: boolean;
  is_active: boolean;
  last_public_url: string;
  last_started_at?: string;
  last_stopped_at?: string;
  last_status: 'stopped' | 'starting' | 'running' | 'error';
  last_error_message?: string;
  total_runs: number;
  created_at: string;

  // Estado enriquecido em tempo real
  is_running: boolean;
  app_status: 'stopped' | 'starting' | 'running' | 'error';
  tunnel_status: 'stopped' | 'starting' | 'online' | 'error';
  active_tunnel_provider: TunnelProvider;
  public_url: string | null;
  detected_urls?: DetectedUrlItem[];
  local_url: string;
  lan_url: string;
  effective_port: number;
  app_pid: number | null;
  tunnel_pid: number | null;
  started_at?: string;
  last_log_line?: string;
}

export interface LogEntry {
  id: string;
  appId: number;
  source: 'app' | 'tunnel' | 'system';
  stream: 'stdout' | 'stderr';
  line: string;
  timestamp: string;
}

export interface RunHistoryItem {
  id: number;
  app_id: number;
  app_name: string;
  execution_mode: ExecutionMode;
  tunnel_provider: string;
  local_url: string;
  public_url: string;
  status: 'running' | 'completed' | 'stopped' | 'failed';
  error_message?: string;
  started_at: string;
  ended_at?: string;
  duration_seconds: number;
}

export interface NotificationItem {
  id: number;
  app_id?: number;
  app_name?: string;
  title: string;
  message: string;
  type: 'tunnel_online' | 'app_started' | 'app_error' | 'app_stopped' | 'info';
  public_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface ActivePortItem {
  port: number;
  address: string;
  processName: string;
  pid?: number;
  registeredAppId: number | null;
  registeredAppName: string | null;
}

export interface ProjectInspection {
  projectName: string;
  detectedPort: number;
  suggestions: Array<{
    label: string;
    command: string;
    suggestedPort?: number;
  }>;
}
