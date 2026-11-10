export type PromptCategory = 'system' | 'personal' | 'template' | 'action' | 'insight' | 'general';

export type AiPrompt = {
  id: string;
  name: string;
  slug: string;
  content: string;
  category: PromptCategory;
  language: string;
  version: number;
  isActive: boolean;
  isSystem: boolean;
  authorId: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type PromptVersion = {
  version: number;
  content: string;
  createdAt: string;
};

export type PromptTemplate = {
  id: string;
  name: string;
  category: PromptCategory;
  content: string;
  variables: string[];
};
