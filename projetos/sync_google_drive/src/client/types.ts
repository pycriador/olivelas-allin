export interface StorageQuota {
  limit?: string;
  usage?: string;
  usageInDrive?: string;
}

export interface AuthStatus {
  mode: 'oauth' | 'service_account';
  isConnected: boolean;
  email?: string;
  name?: string;
  apiDisabled?: boolean;
  errorMessage?: string;
  enableUrl?: string;
  storageQuota?: StorageQuota;
  hasClientId?: boolean;
  clientId?: string;
}

export interface SyncFolder {
  id: number;
  name: string;
  local_path: string;
  gdrive_folder_id: string;
  gdrive_folder_name?: string;
  sync_mode: 'upload' | 'mirror';
  schedule_enabled: boolean;
  schedule_interval: '15m' | '30m' | 'hourly' | '6h' | 'daily' | 'custom';
  schedule_cron?: string;
  file_extensions?: string;
  watch_enabled: boolean;
  watch_delay_seconds?: number;
  watch_auto_sync?: boolean;
  is_watching?: boolean;
  is_active: boolean;
  last_synced_at?: string;
  last_sync_status: 'idle' | 'syncing' | 'success' | 'error';
  last_sync_message?: string;
  created_at: string;
  synced_count?: number;
  failed_count?: number;
  total_bytes_synced?: number;
  is_syncing?: boolean;
}

export interface SyncSuggestion {
  folderId: number;
  folderName: string;
  files: string[];
  totalCount: number;
  watchDelaySeconds?: number;
  detectedAt: string;
  isTest?: boolean;
}

export interface SyncHistoryItem {
  id: number;
  folder_id: number;
  folder_name?: string;
  local_file_path: string;
  relative_path: string;
  file_name: string;
  file_size: number;
  file_hash?: string;
  gdrive_file_id?: string;
  status: 'synced' | 'failed' | 'in_progress' | 'skipped';
  error_message?: string;
  synced_at: string;
}

export interface NotificationItem {
  id: number;
  folder_id?: number;
  folder_name?: string;
  title: string;
  message: string;
  type: 'new_files' | 'sync_success' | 'sync_error' | 'info';
  is_read: boolean;
  created_at: string;
}

export interface SyncProgressPayload {
  folderId: number;
  current: number;
  total: number;
  percent: number;
  currentFile: string;
}
