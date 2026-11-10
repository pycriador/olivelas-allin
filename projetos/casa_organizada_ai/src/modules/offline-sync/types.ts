export type SyncAction = 'create' | 'update' | 'delete';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'conflict' | 'error';

export interface SyncQueueItem {
  id: string;
  userId: string;
  entityType: string;
  entityId: string | null;
  action: SyncAction;
  payload: Record<string, unknown>;
  status: SyncStatus;
  conflictData: Record<string, unknown> | null;
  syncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
