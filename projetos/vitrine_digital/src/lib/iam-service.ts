import { supabase } from "@/integrations/supabase/client";
import type { IamGroup, IamUser, IamApiToken, ArtSubmission, IamRole, SubmissionStatus } from "./iam-types";
import { GLOBAL_ADMIN_EMAIL } from "./auth-context";

const STORAGE_KEYS = {
  GROUPS: "wai_iam_groups_v1",
  USERS: "wai_iam_users_v1",
  TOKENS: "wai_iam_tokens_v1",
  SUBMISSIONS: "wai_iam_submissions_v1",
};

// Flags de disponibilidade de tabelas no Supabase
const tableDisabled: Record<string, boolean> = {};

function markTableDisabled(table: string) {
  tableDisabled[table] = true;
}

function isTableAvailable(table: string): boolean {
  return !tableDisabled[table];
}

// Initial default fallback data
const DEFAULT_GROUPS: IamGroup[] = [
  {
    id: "grp-monumento-001",
    name: "Monumento",
    slug: "monumento",
    description: "Grupo Monumento com chave dedicada e cota de R$ 200,00",
    gemini_api_key: "",
    quota_brl: 200.0,
    used_brl: 0.0,
    max_requests_per_day: 500,
    created_at: new Date().toISOString(),
  },
  {
    id: "grp-geral-002",
    name: "Geral & Varejo",
    slug: "geral-varejo",
    description: "Grupo geral para lojistas e ofertas variadas",
    gemini_api_key: "",
    quota_brl: 100.0,
    used_brl: 0.0,
    max_requests_per_day: 200,
    created_at: new Date().toISOString(),
  },
];

const DEFAULT_USERS: IamUser[] = [
  {
    id: "usr-admin-001",
    email: GLOBAL_ADMIN_EMAIL,
    full_name: "Administrador Global",
    role: "global_admin",
    group_ids: ["grp-monumento-001", "grp-geral-002"],
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("Falha ao salvar no localStorage:", err);
  }
}

export async function sha256Hex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ----------------------------------------------------
// 1. GROUPS CRUD & QUOTA
// ----------------------------------------------------
export async function listGroups(): Promise<IamGroup[]> {
  if (isTableAvailable("iam_groups")) {
    try {
      const { data, error } = await supabase
        .from("iam_groups")
        .select("*")
        .order("name", { ascending: true });

      if (!error && data && data.length > 0) {
        setLocal(STORAGE_KEYS.GROUPS, data);
        return data as unknown as IamGroup[];
      }
      if (error) {
        markTableDisabled("iam_groups");
      }
    } catch {
      markTableDisabled("iam_groups");
    }
  }

  const cached = getLocal<IamGroup[]>(STORAGE_KEYS.GROUPS, DEFAULT_GROUPS);
  if (!cached || cached.length === 0) {
    setLocal(STORAGE_KEYS.GROUPS, DEFAULT_GROUPS);
    return DEFAULT_GROUPS;
  }
  return cached;
}

export async function createGroup(groupData: Omit<IamGroup, "id" | "created_at" | "used_brl">): Promise<IamGroup> {
  const newGroup: IamGroup = {
    id: crypto.randomUUID(),
    name: groupData.name.trim(),
    slug: (groupData.slug || groupData.name.toLowerCase().replace(/\s+/g, "-")).trim(),
    description: groupData.description?.trim(),
    gemini_api_key: groupData.gemini_api_key?.trim() || "",
    gemini_model: groupData.gemini_model?.trim() || "gemini-2.5-flash",
    quota_brl: Number(groupData.quota_brl) || 200.0,
    used_brl: 0.0,
    max_requests_per_day: Number(groupData.max_requests_per_day) || 500,
    created_at: new Date().toISOString(),
  };

  if (isTableAvailable("iam_groups")) {
    try {
      const { data, error } = await supabase
        .from("iam_groups")
        .insert(newGroup)
        .select()
        .single();

      if (!error && data) {
        const current = await listGroups();
        setLocal(STORAGE_KEYS.GROUPS, [data, ...current.filter((g) => g.id !== data.id)]);
        return data as unknown as IamGroup;
      }
    } catch {
      markTableDisabled("iam_groups");
    }
  }

  const current = getLocal<IamGroup[]>(STORAGE_KEYS.GROUPS, DEFAULT_GROUPS);
  const updated = [newGroup, ...current];
  setLocal(STORAGE_KEYS.GROUPS, updated);
  return newGroup;
}

export async function updateGroup(id: string, updates: Partial<IamGroup>): Promise<IamGroup> {
  if (isTableAvailable("iam_groups")) {
    try {
      const { data, error } = await supabase
        .from("iam_groups")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (!error && data) {
        const current = await listGroups();
        const updatedList = current.map((g) => (g.id === id ? { ...g, ...data } : g));
        setLocal(STORAGE_KEYS.GROUPS, updatedList);
        return data as unknown as IamGroup;
      }
    } catch {
      markTableDisabled("iam_groups");
    }
  }

  const current = getLocal<IamGroup[]>(STORAGE_KEYS.GROUPS, DEFAULT_GROUPS);
  let updatedGroup: IamGroup | null = null;
  const updatedList = current.map((g) => {
    if (g.id === id) {
      updatedGroup = { ...g, ...updates, updated_at: new Date().toISOString() };
      return updatedGroup;
    }
    return g;
  });
  setLocal(STORAGE_KEYS.GROUPS, updatedList);
  return updatedGroup ?? { ...DEFAULT_GROUPS[0], ...updates, id };
}

export async function deleteGroup(id: string): Promise<void> {
  if (isTableAvailable("iam_groups")) {
    try {
      await supabase.from("iam_groups").delete().eq("id", id);
    } catch {
      markTableDisabled("iam_groups");
    }
  }
  const current = getLocal<IamGroup[]>(STORAGE_KEYS.GROUPS, DEFAULT_GROUPS);
  setLocal(
    STORAGE_KEYS.GROUPS,
    current.filter((g) => g.id !== id)
  );
}

export async function deductGroupQuota(groupId: string, amountBrl: number = 0.05): Promise<IamGroup | null> {
  const groups = await listGroups();
  const target = groups.find((g) => g.id === groupId);
  if (!target) return null;

  const newUsed = Math.min(target.quota_brl, Number((target.used_brl + amountBrl).toFixed(2)));
  return await updateGroup(groupId, { used_brl: newUsed });
}

// ----------------------------------------------------
// 2. USERS CRUD & HBAC
// ----------------------------------------------------
export async function listUsers(): Promise<IamUser[]> {
  if (isTableAvailable("iam_users")) {
    try {
      const { data, error } = await supabase
        .from("iam_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const validUsers = (data as unknown as IamUser[]).filter((u) => u && typeof u.email === "string");
        const hasAdmin = validUsers.some(
          (u) => u.email && u.email.toLowerCase() === GLOBAL_ADMIN_EMAIL.toLowerCase()
        );
        const fullList = hasAdmin ? validUsers : [...DEFAULT_USERS, ...validUsers];
        setLocal(STORAGE_KEYS.USERS, fullList);
        return fullList;
      }
      if (error) {
        markTableDisabled("iam_users");
      }
    } catch {
      markTableDisabled("iam_users");
    }
  }

  const cached = getLocal<IamUser[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
  if (!cached || cached.length === 0) {
    setLocal(STORAGE_KEYS.USERS, DEFAULT_USERS);
    return DEFAULT_USERS;
  }
  return cached.filter((u) => u && typeof u.email === "string");
}

export async function getUserProfile(email: string | undefined | null, fullName?: string): Promise<IamUser> {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail) {
    return DEFAULT_USERS[0];
  }
  const isAdmin = cleanEmail === GLOBAL_ADMIN_EMAIL.toLowerCase();

  const users = await listUsers();
  const existing = users.find((u) => u && u.email && u.email.toLowerCase() === cleanEmail);

  if (existing) {
    if (isAdmin && existing.role !== "global_admin") {
      return await updateUser(existing.id, { role: "global_admin" });
    }
    return existing;
  }

  const newUser: IamUser = {
    id: crypto.randomUUID(),
    email: cleanEmail,
    full_name: fullName?.trim() || (isAdmin ? "Administrador Global" : "Consumidor"),
    role: isAdmin ? "global_admin" : "consumer",
    group_ids: isAdmin ? ["grp-monumento-001", "grp-geral-002"] : [],
    is_active: true,
    created_at: new Date().toISOString(),
  };

  if (isTableAvailable("iam_users")) {
    try {
      const { data, error } = await supabase
        .from("iam_users")
        .insert(newUser)
        .select()
        .single();

      if (!error && data) {
        setLocal(STORAGE_KEYS.USERS, [data, ...users]);
        return data as unknown as IamUser;
      }
    } catch {
      markTableDisabled("iam_users");
    }
  }

  setLocal(STORAGE_KEYS.USERS, [newUser, ...users]);
  return newUser;
}

export async function createUser(userData: Omit<IamUser, "id" | "created_at">): Promise<IamUser> {
  const cleanEmail = userData.email.trim().toLowerCase();
  const isAdmin = cleanEmail === GLOBAL_ADMIN_EMAIL.toLowerCase();

  const newUser: IamUser = {
    id: crypto.randomUUID(),
    email: cleanEmail,
    full_name: userData.full_name?.trim(),
    role: isAdmin ? "global_admin" : userData.role || "consumer",
    group_ids: userData.group_ids || [],
    is_active: userData.is_active ?? true,
    custom_quota_brl: userData.custom_quota_brl,
    created_at: new Date().toISOString(),
  };

  if (isTableAvailable("iam_users")) {
    try {
      const { data, error } = await supabase
        .from("iam_users")
        .insert(newUser)
        .select()
        .single();

      if (!error && data) {
        const current = await listUsers();
        setLocal(STORAGE_KEYS.USERS, [data, ...current.filter((u) => u.id !== data.id)]);
        return data as unknown as IamUser;
      }
    } catch {
      markTableDisabled("iam_users");
    }
  }

  const current = getLocal<IamUser[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
  const updated = [newUser, ...current.filter((u) => u && u.email && u.email.toLowerCase() !== cleanEmail)];
  setLocal(STORAGE_KEYS.USERS, updated);
  return newUser;
}

export async function updateUser(id: string, updates: Partial<IamUser>): Promise<IamUser> {
  if (isTableAvailable("iam_users")) {
    try {
      const { data, error } = await supabase
        .from("iam_users")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (!error && data) {
        const current = await listUsers();
        const updatedList = current.map((u) => (u.id === id ? { ...u, ...data } : u));
        setLocal(STORAGE_KEYS.USERS, updatedList);
        return data as unknown as IamUser;
      }
    } catch {
      markTableDisabled("iam_users");
    }
  }

  const current = getLocal<IamUser[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
  let updatedUser: IamUser | null = null;
  const updatedList = current.map((u) => {
    if (u.id === id) {
      updatedUser = { ...u, ...updates, updated_at: new Date().toISOString() };
      return updatedUser;
    }
    return u;
  });
  setLocal(STORAGE_KEYS.USERS, updatedList);
  return updatedUser ?? { ...DEFAULT_USERS[0], ...updates, id };
}

export async function deleteUser(id: string): Promise<void> {
  if (isTableAvailable("iam_users")) {
    try {
      await supabase.from("iam_users").delete().eq("id", id);
    } catch {
      markTableDisabled("iam_users");
    }
  }
  const current = getLocal<IamUser[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
  setLocal(
    STORAGE_KEYS.USERS,
    current.filter((u) => u.id !== id)
  );
}

// ----------------------------------------------------
// 3. API TOKENS CRUD
// ----------------------------------------------------
export async function listTokens(): Promise<IamApiToken[]> {
  if (isTableAvailable("iam_api_tokens")) {
    try {
      const { data, error } = await supabase
        .from("iam_api_tokens")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setLocal(STORAGE_KEYS.TOKENS, data);
        return data as unknown as IamApiToken[];
      }
      if (error) {
        markTableDisabled("iam_api_tokens");
      }
    } catch {
      markTableDisabled("iam_api_tokens");
    }
  }
  return getLocal<IamApiToken[]>(STORAGE_KEYS.TOKENS, []);
}

export async function createApiToken(params: {
  name: string;
  assignedRole: IamRole;
  userId?: string;
  groupId?: string;
  quotaBrl?: number;
  expiresInDays?: number;
}): Promise<IamApiToken> {
  const rawSecret = Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const tokenPrefix = `wai_${params.assignedRole.slice(0, 3)}_${rawSecret.slice(0, 6)}`;
  const fullRawToken = `${tokenPrefix}_${rawSecret}`;

  const expiresAt = params.expiresInDays
    ? new Date(Date.now() + params.expiresInDays * 86400000).toISOString()
    : null;

  const tokenHash = await sha256Hex(fullRawToken);

  const newToken: IamApiToken = {
    id: crypto.randomUUID(),
    name: params.name.trim(),
    token_prefix: tokenPrefix,
    token_hash: tokenHash,
    raw_token: fullRawToken,
    user_id: params.userId || undefined,
    group_id: params.groupId || undefined,
    assigned_role: params.assignedRole,
    quota_brl: Number(params.quotaBrl) || 50.0,
    used_brl: 0.0,
    is_active: true,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
  };

  if (isTableAvailable("iam_api_tokens")) {
    try {
      const { data, error } = await supabase
        .from("iam_api_tokens")
        .insert({
          id: newToken.id,
          name: newToken.name,
          token_prefix: newToken.token_prefix,
          token_hash: newToken.token_hash ?? "",
          user_id: newToken.user_id,
          group_id: newToken.group_id,
          assigned_role: newToken.assigned_role,
          quota_brl: newToken.quota_brl,
          used_brl: newToken.used_brl,
          is_active: newToken.is_active,
          expires_at: newToken.expires_at,
        })
        .select()
        .single();

      if (!error && data) {
        const current = await listTokens();
        const withRaw = { ...data, raw_token: fullRawToken };
        setLocal(STORAGE_KEYS.TOKENS, [withRaw, ...current]);
        return withRaw as unknown as IamApiToken;
      }
    } catch {
      markTableDisabled("iam_api_tokens");
    }
  }

  const current = getLocal<IamApiToken[]>(STORAGE_KEYS.TOKENS, []);
  setLocal(STORAGE_KEYS.TOKENS, [newToken, ...current]);
  return newToken;
}

export async function updateApiToken(id: string, updates: Partial<IamApiToken>): Promise<IamApiToken> {
  const { raw_token: _rawToken, ...rest } = updates;
  if (isTableAvailable("iam_api_tokens")) {
    try {
      const { data, error } = await supabase
        .from("iam_api_tokens")
        .update(rest)
        .eq("id", id)
        .select()
        .single();

      if (!error && data) {
        const current = await listTokens();
        const updatedList = current.map((t) => (t.id === id ? { ...t, ...data } : t));
        setLocal(STORAGE_KEYS.TOKENS, updatedList);
        return data as unknown as IamApiToken;
      }
    } catch {
      markTableDisabled("iam_api_tokens");
    }
  }

  const current = getLocal<IamApiToken[]>(STORAGE_KEYS.TOKENS, []);
  let updatedToken: IamApiToken | null = null;
  const updatedList = current.map((t) => {
    if (t.id === id) {
      updatedToken = { ...t, ...updates };
      return updatedToken;
    }
    return t;
  });
  setLocal(STORAGE_KEYS.TOKENS, updatedList);
  return updatedToken ?? ({ id, ...updates } as unknown as IamApiToken);
}

export async function deleteApiToken(id: string): Promise<void> {
  if (isTableAvailable("iam_api_tokens")) {
    try {
      await supabase.from("iam_api_tokens").delete().eq("id", id);
    } catch {
      markTableDisabled("iam_api_tokens");
    }
  }
  const current = getLocal<IamApiToken[]>(STORAGE_KEYS.TOKENS, []);
  setLocal(
    STORAGE_KEYS.TOKENS,
    current.filter((t) => t.id !== id)
  );
}

// ----------------------------------------------------
// 4. ART SUBMISSIONS WORKFLOW (Consumer -> Analyst/Admin)
// ----------------------------------------------------
export async function listSubmissions(status?: SubmissionStatus): Promise<ArtSubmission[]> {
  if (isTableAvailable("art_submissions")) {
    try {
      let query = supabase.from("art_submissions").select("*").order("created_at", { ascending: false });
      if (status) {
        query = query.eq("status", status);
      }
      const { data, error } = await query;
      if (!error && data) {
        setLocal(STORAGE_KEYS.SUBMISSIONS, data);
        return data as unknown as ArtSubmission[];
      }
      if (error) {
        markTableDisabled("art_submissions");
      }
    } catch {
      markTableDisabled("art_submissions");
    }
  }

  const cached = getLocal<ArtSubmission[]>(STORAGE_KEYS.SUBMISSIONS, []);
  if (status) {
    return cached.filter((s) => s.status === status);
  }
  return cached;
}

export async function submitArt(submission: {
  userId: string;
  userEmail: string;
  userName?: string;
  imagePath: string;
  imageUrl: string;
  notes?: string;
  senderPhone?: string;
  senderName?: string;
  targetGroupId?: string;
}): Promise<ArtSubmission> {
  const item: ArtSubmission = {
    id: crypto.randomUUID(),
    submitted_by_user_id: submission.userId,
    submitted_by_email: submission.userEmail,
    submitted_by_name: submission.userName,
    image_path: submission.imagePath,
    image_url: submission.imageUrl,
    notes: submission.notes,
    sender_phone: submission.senderPhone,
    sender_name: submission.senderName,
    target_group_id: submission.targetGroupId,
    status: "pending",
    created_at: new Date().toISOString(),
  };

  if (isTableAvailable("art_submissions")) {
    try {
      const { data, error } = await supabase
        .from("art_submissions")
        .insert(item)
        .select()
        .single();

      if (!error && data) {
        const current = await listSubmissions();
        setLocal(STORAGE_KEYS.SUBMISSIONS, [data, ...current]);
        return data as unknown as ArtSubmission;
      }
    } catch {
      markTableDisabled("art_submissions");
    }
  }

  const current = getLocal<ArtSubmission[]>(STORAGE_KEYS.SUBMISSIONS, []);
  setLocal(STORAGE_KEYS.SUBMISSIONS, [item, ...current]);
  return item;
}

export async function updateSubmissionStatus(
  id: string,
  params: {
    status: SubmissionStatus;
    reviewerUserId?: string;
    reviewerEmail?: string;
    rejectionReason?: string;
    processedAnalysisId?: string;
  }
): Promise<ArtSubmission> {
  const updates: Partial<ArtSubmission> = {
    status: params.status,
    approved_by_user_id: params.reviewerUserId,
    approved_by_email: params.reviewerEmail,
    rejection_reason: params.rejectionReason,
    processed_analysis_id: params.processedAnalysisId,
    updated_at: new Date().toISOString(),
  };

  if (isTableAvailable("art_submissions")) {
    try {
      const { data, error } = await supabase
        .from("art_submissions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (!error && data) {
        const current = await listSubmissions();
        const updatedList = current.map((s) => (s.id === id ? { ...s, ...data } : s));
        setLocal(STORAGE_KEYS.SUBMISSIONS, updatedList);
        return data as unknown as ArtSubmission;
      }
    } catch {
      markTableDisabled("art_submissions");
    }
  }

  const current = getLocal<ArtSubmission[]>(STORAGE_KEYS.SUBMISSIONS, []);
  let updatedSub: ArtSubmission | null = null;
  const updatedList = current.map((s) => {
    if (s.id === id) {
      updatedSub = { ...s, ...updates };
      return updatedSub;
    }
    return s;
  });
  setLocal(STORAGE_KEYS.SUBMISSIONS, updatedList);
  return updatedSub ?? ({ id, ...updates } as unknown as ArtSubmission);
}
