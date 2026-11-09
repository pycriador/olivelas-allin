// Authentication through Lovable Cloud (Google OAuth only). No local credentials.
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { userRepo } from "@/repositories/iam";
import { metaRepo } from "@/repositories";
import { auditService, setAuditActor } from "./audit.service";
import { AuditEvent, DEFAULT_SETTINGS, type AppSettings, type User } from "@/types/iam";

const SETTINGS_KEY = "settings:app";

export interface Session {
  userId: string;
  name: string;
  email: string;
  startedAt: number;
  expiresAt: number;
  token: string;
}

let cachedSession: Session | null = null;

export function setCachedSession(s: Session | null) {
  cachedSession = s;
  setAuditActor(s ? { id: s.userId, name: s.name } : null);
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const row = await metaRepo.get(SETTINGS_KEY);
    if (!row) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(row.value) as Partial<AppSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const next = { ...(await getSettings()), ...patch };
  await metaRepo.set(SETTINGS_KEY, JSON.stringify(next));
  await auditService.log({ event: AuditEvent.Update, entity: "settings" });
  return next;
}

/** Reads the live Supabase session and mirrors it into the app session shape. */
export async function loadSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  const s = data.session;
  if (!s) {
    setCachedSession(null);
    return null;
  }
  const meta = (s.user.user_metadata ?? {}) as { full_name?: string; name?: string; avatar_url?: string };
  const session: Session = {
    userId: s.user.id,
    name: meta.full_name ?? meta.name ?? s.user.email ?? "User",
    email: s.user.email ?? "",
    startedAt: Date.now(),
    expiresAt: (s.expires_at ?? Math.floor(Date.now() / 1000) + 3600) * 1000,
    token: s.access_token,
  };
  setCachedSession(session);
  return session;
}

/** Creates (or refreshes) the profile row for the signed-in user. */
export async function registerOrBootstrap(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  const u = data.user;
  if (!u) return null;
  const meta = (u.user_metadata ?? {}) as { full_name?: string; name?: string; avatar_url?: string };
  const { data: profile, error } = await supabase.rpc("register_or_bootstrap", {
    _name: meta.full_name ?? meta.name ?? u.email ?? "",
    _email: u.email ?? "",
    _avatar: meta.avatar_url ?? null,
  } as never);
  if (error) throw new Error(error.message);
  const row = (Array.isArray(profile) ? profile[0] : profile) as Record<string, unknown> | null;
  if (!row) return null;
  return userRepo.byId(String(row["id"])) as Promise<User | undefined> as Promise<User>;
}

export const authService = {
  getSettings,
  saveSettings,
  loadSession,
  registerOrBootstrap,

  async signInWithGoogle(): Promise<void> {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) throw new Error(result.error.message ?? "Google sign-in failed");
  },

  async logout(): Promise<void> {
    const s = cachedSession;
    if (s) {
      try {
        await auditService.log({ event: AuditEvent.Logout, entity: "session", entityId: s.userId });
      } catch {
        /* logging must never block sign-out */
      }
    }
    await supabase.auth.signOut();
    setCachedSession(null);
  },

  current: (): Session | null => cachedSession,

  async currentUser(): Promise<User | undefined> {
    if (!cachedSession) return undefined;
    const user = await userRepo.byId(cachedSession.userId);
    if (user) setAuditActor({ id: user.id, name: user.name });
    return user;
  },

  async touch(): Promise<Session | null> {
    return loadSession();
  },
};
