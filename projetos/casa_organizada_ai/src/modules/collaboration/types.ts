export type EntityType = 'form' | 'template' | 'comment' | 'automation';

export interface CollaborationSession {
  id: string;
  entityType: EntityType;
  entityId: string;
  userId: string;
  status: 'active' | 'idle' | 'away' | 'disconnected';
  cursorPos: Record<string, number> | null;
  lastSeenAt: string;
  createdAt: string;
}

export interface Collaborator {
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  avatarType: string;
  status: string;
  lastSeenAt: string;
}

export interface TimelineEvent {
  id: string;
  entityType: string;
  entityId: string;
  userId: string | null;
  action: string;
  description: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}
