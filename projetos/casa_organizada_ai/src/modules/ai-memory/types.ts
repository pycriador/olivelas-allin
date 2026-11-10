export type MemoryType = 'preference' | 'project' | 'planner' | 'category' | 'style' | 'fact' | 'routine' | 'note';

export interface MemoryEntry {
  id: string;
  userId: string;
  memoryType: MemoryType;
  key: string;
  value: Record<string, unknown>;
  confidence: number;
  source: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  preferredDays?: string[];
  preferredTimes?: string[];
  favoriteCategories?: string[];
  favoriteTemplates?: string[];
  favoriteThemes?: string[];
  organizationStyle?: 'checklist' | 'daily' | 'weekly' | 'monthly';
  communicationStyle?: 'formal' | 'casual' | 'detailed' | 'brief';
  timezone?: string;
  locale?: string;
}

// RAG types
export interface RagConnector {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sourceTable: string;
  sourceQuery: string;
  isActive: boolean;
  config: Record<string, unknown>;
}

export interface RagDocument {
  id: string;
  title: string;
  content: string;
  userId: string;
  source: string;
  sourceId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}
