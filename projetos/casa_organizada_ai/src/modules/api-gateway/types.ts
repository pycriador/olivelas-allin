export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export const API_SCOPES = [
  { value: 'forms:read', label: 'Ler formulários' },
  { value: 'forms:write', label: 'Criar/editar formulários' },
  { value: 'templates:read', label: 'Ler templates' },
  { value: 'comments:read', label: 'Ler comentários' },
  { value: 'comments:write', label: 'Criar comentários' },
  { value: 'profile:read', label: 'Ler perfil' },
  { value: 'profile:write', label: 'Atualizar perfil' },
  { value: 'automations:read', label: 'Ler automações' },
  { value: 'automations:write', label: 'Gerenciar automações' },
  { value: 'admin:all', label: 'Admin (todas as operações)' },
] as const;
