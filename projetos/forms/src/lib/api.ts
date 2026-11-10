// ========================================================
// Olivelas IAM Forms - Frontend API Client
// ========================================================

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const userJson = localStorage.getItem('olivelas_current_user');
  if (userJson) {
    try {
      const u = JSON.parse(userJson);
      if (u.email) headers['x-user-email'] = u.email;
      if (u.id) headers['x-user-id'] = u.id;
    } catch (_) {}
  }
  return headers;
}

export const api = {
  // Auth
  login: async (email: string, password?: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao autenticar.');
    }
    return res.json();
  },

  getCurrentUser: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Não autenticado');
    return res.json();
  },

  // Users CRUD
  getUsers: async () => {
    const res = await fetch(`${API_BASE}/users`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao carregar usuários');
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },
  getUserById: async (id: string) => {
    const res = await fetch(`${API_BASE}/users/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Usuário não encontrado');
    return res.json();
  },
  createUser: async (data: any) => {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao criar usuário');
    }
    return res.json();
  },
  updateUser: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao atualizar usuário');
    }
    return res.json();
  },
  deleteUser: async (id: string) => {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao excluir usuário');
    }
    return res.json();
  },

  // Groups CRUD
  getGroups: async () => {
    const res = await fetch(`${API_BASE}/groups`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao carregar grupos');
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },
  getGroupById: async (id: string) => {
    const res = await fetch(`${API_BASE}/groups/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Grupo não encontrado');
    return res.json();
  },
  createGroup: async (data: any) => {
    const res = await fetch(`${API_BASE}/groups`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao criar grupo');
    }
    return res.json();
  },
  updateGroup: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/groups/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao atualizar grupo');
    }
    return res.json();
  },
  deleteGroup: async (id: string) => {
    const res = await fetch(`${API_BASE}/groups/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao excluir grupo');
    }
    return res.json();
  },

  // Forms CRUD
  getForms: async () => {
    const res = await fetch(`${API_BASE}/forms`, { headers: getHeaders() });
    return res.json();
  },
  getFormById: async (id: string) => {
    const res = await fetch(`${API_BASE}/forms/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Formulário não encontrado');
    return res.json();
  },
  getPublicForm: async (shareCode: string) => {
    const res = await fetch(`${API_BASE}/forms/public/${shareCode}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Formulário indisponível');
    }
    return res.json();
  },
  createForm: async (data: any) => {
    const res = await fetch(`${API_BASE}/forms`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao criar formulário');
    }
    return res.json();
  },
  updateForm: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/forms/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao atualizar formulário');
    }
    return res.json();
  },
  deleteForm: async (id: string) => {
    const res = await fetch(`${API_BASE}/forms/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao excluir formulário');
    }
    return res.json();
  },
  duplicateForm: async (id: string) => {
    const res = await fetch(`${API_BASE}/forms/${id}/duplicate`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json();
  },

  // Form Fields CRUD
  addField: async (formId: string, data: any) => {
    const res = await fetch(`${API_BASE}/forms/${formId}/fields`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  updateField: async (formId: string, fieldId: string, data: any) => {
    const res = await fetch(`${API_BASE}/forms/${formId}/fields/${fieldId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteField: async (formId: string, fieldId: string) => {
    const res = await fetch(`${API_BASE}/forms/${formId}/fields/${fieldId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },
  reorderFields: async (formId: string, orderedIds: string[]) => {
    const res = await fetch(`${API_BASE}/forms/${formId}/fields/reorder`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ orderedIds }),
    });
    return res.json();
  },

  // Collaborators
  addCollaborator: async (formId: string, email: string, role: 'editor' | 'viewer') => {
    const res = await fetch(`${API_BASE}/forms/${formId}/collaborators`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao convidar colaborador');
    }
    return res.json();
  },
  removeCollaborator: async (formId: string, collabId: string) => {
    const res = await fetch(`${API_BASE}/forms/${formId}/collaborators/${collabId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  // Responses
  submitResponse: async (formId: string, data: { respondent_email?: string; answers: Record<string, any> }) => {
    const res = await fetch(`${API_BASE}/forms/${formId}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao enviar resposta');
    }
    return res.json();
  },
  getResponses: async (formId: string) => {
    const res = await fetch(`${API_BASE}/forms/${formId}/responses`, { headers: getHeaders() });
    return res.json();
  },
  deleteResponse: async (formId: string, responseId: string) => {
    const res = await fetch(`${API_BASE}/forms/${formId}/responses/${responseId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  // Dashboards CRUD
  getDashboards: async () => {
    const res = await fetch(`${API_BASE}/dashboards`, { headers: getHeaders() });
    return res.json();
  },
  getDashboardById: async (id: string) => {
    const res = await fetch(`${API_BASE}/dashboards/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Dashboard não encontrado');
    return res.json();
  },
  getPublicDashboard: async (shareCode: string) => {
    const res = await fetch(`${API_BASE}/dashboards/public/${shareCode}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Dashboard indisponível');
    }
    return res.json();
  },
  createDashboard: async (data: any) => {
    const res = await fetch(`${API_BASE}/dashboards`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao criar dashboard');
    }
    return res.json();
  },
  updateDashboard: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/dashboards/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteDashboard: async (id: string) => {
    const res = await fetch(`${API_BASE}/dashboards/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },
  addWidget: async (dashboardId: string, data: any) => {
    const res = await fetch(`${API_BASE}/dashboards/${dashboardId}/widgets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  updateWidget: async (dashboardId: string, widgetId: string, data: any) => {
    const res = await fetch(`${API_BASE}/dashboards/${dashboardId}/widgets/${widgetId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteWidget: async (dashboardId: string, widgetId: string) => {
    const res = await fetch(`${API_BASE}/dashboards/${dashboardId}/widgets/${widgetId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },
  syncDashboardSheet: async (dashboardId: string, spreadsheetId?: string, sheetTitle?: string) => {
    const res = await fetch(`${API_BASE}/dashboards/${dashboardId}/sync-sheet`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ spreadsheetId, sheetTitle }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao sincronizar com Google Sheets');
    }
    return res.json();
  },
  syncPublicDashboard: async (shareCode: string) => {
    const res = await fetch(`${API_BASE}/dashboards/public/${shareCode}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao sincronizar com Google Sheets');
    }
    return res.json();
  },
  syncFormSheet: async (formId: string, spreadsheetId?: string, sheetTitle?: string) => {
    const res = await fetch(`${API_BASE}/forms/${formId}/sync-sheet`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ spreadsheetId, sheetTitle }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao sincronizar com Google Sheets');
    }
    return res.json();
  },

  // API Tokens
  getTokens: async () => {
    const res = await fetch(`${API_BASE}/tokens`, { headers: getHeaders() });
    return res.json();
  },
  createToken: async (data: any) => {
    const res = await fetch(`${API_BASE}/tokens`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao gerar token');
    }
    return res.json();
  },
  updateToken: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/tokens/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao atualizar token');
    }
    return res.json();
  },
  deleteToken: async (id: string) => {
    const res = await fetch(`${API_BASE}/tokens/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  // Google Integration
  getGoogleStatus: async (groupId?: string) => {
    const url = groupId ? `${API_BASE}/google/status?groupId=${encodeURIComponent(groupId)}` : `${API_BASE}/google/status`;
    const res = await fetch(url, { headers: getHeaders() });
    return res.json();
  },
  getGoogleGroupsStatus: async () => {
    const res = await fetch(`${API_BASE}/google/groups`, { headers: getHeaders() });
    return res.json();
  },
  getGroupGoogleStatus: async (groupId: string) => {
    const res = await fetch(`${API_BASE}/google/groups/${groupId}`, { headers: getHeaders() });
    return res.json();
  },
  saveGroupGoogleServiceAccount: async (groupId: string, serviceAccountJson: any) => {
    const res = await fetch(`${API_BASE}/google/groups/${groupId}/service-account`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ serviceAccountJson }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao validar e salvar conta de serviço Google do grupo');
    }
    return res.json();
  },
  testGroupGoogleConnection: async (groupId: string) => {
    const res = await fetch(`${API_BASE}/google/groups/${groupId}/test-connection`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json();
  },
  disconnectGroupGoogle: async (groupId: string) => {
    const res = await fetch(`${API_BASE}/google/groups/${groupId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },
  getGoogleAuthUrl: async (clientId?: string, clientSecret?: string, redirectUri?: string, groupId?: string) => {
    const params = new URLSearchParams();
    if (clientId) params.set('clientId', clientId);
    if (clientSecret) params.set('clientSecret', clientSecret);
    if (redirectUri) params.set('redirectUri', redirectUri);
    if (groupId) params.set('groupId', groupId);
    const res = await fetch(`${API_BASE}/google/auth-url?${params.toString()}`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao gerar URL do Google OAuth');
    }
    return res.json();
  },
  exchangeGoogleCode: async (code: string, redirectUri?: string, groupId?: string) => {
    const res = await fetch(`${API_BASE}/google/exchange-code`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ code, redirectUri, groupId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Código de autorização inválido ou expirado');
    }
    return res.json();
  },
  saveGoogleServiceAccount: async (serviceAccountJson: any, groupId?: string) => {
    const url = groupId
      ? `${API_BASE}/google/groups/${encodeURIComponent(groupId)}/service-account`
      : `${API_BASE}/google/service-account`;
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ serviceAccountJson }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao validar e salvar conta de serviço Google');
    }
    return res.json();
  },
  testGoogleConnection: async () => {
    const res = await fetch(`${API_BASE}/google/test-connection`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json();
  },
  createGoogleSheet: async (title: string) => {
    const res = await fetch(`${API_BASE}/google/create-sheet`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao criar planilha no Google Drive');
    }
    return res.json();
  },
  connectGoogle: async (data: any) => {
    const res = await fetch(`${API_BASE}/google/connect`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  syncGoogleSheets: async (formId: string, spreadsheetId?: string) => {
    const res = await fetch(`${API_BASE}/google/sync-sheets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ formId, spreadsheetId }),
    });
    return res.json();
  },
  importGoogleForm: async (formUrlOrId: string) => {
    const res = await fetch(`${API_BASE}/google/import-form`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ formUrlOrId }),
    });
    return res.json();
  },

  // Audit Logs
  getAuditLogs: async (action?: string) => {
    const url = action ? `${API_BASE}/audit-logs?action=${encodeURIComponent(action)}` : `${API_BASE}/audit-logs`;
    const res = await fetch(url, { headers: getHeaders() });
    return res.json();
  },
};
