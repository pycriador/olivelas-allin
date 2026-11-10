#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PROJETOS_DIR = path.join(ROOT_DIR, 'projetos');

const NEW_21_SPECS = {
  album_figurinhas: {
    brandName: 'Olivelas - Álbum de Figurinhas Digital',
    schema: 'album_figurinhas',
    slug: 'allin_album_figurinhas',
  },
  artes_caneca: {
    brandName: 'Olivelas - Estúdio de Artes & Canecas',
    schema: 'artes_caneca',
    slug: 'allin_artes_caneca',
  },
  casa_organizada_ai: {
    brandName: 'Olivelas - Casa Organizada AI & Automação',
    schema: 'casa_organizada_ai',
    slug: 'allin_casa_organizada_ai',
  },
  cesta_cafe_manha: {
    brandName: 'Olivelas - Cestas de Café & Presentes',
    schema: 'cesta_cafe_manha',
    slug: 'allin_cesta_cafe_manha',
  },
  collection_vault: {
    brandName: 'Olivelas - Collection Vault & Acervos',
    schema: 'collection_vault',
    slug: 'allin_collection_vault',
  },
  dashboard_bi: {
    brandName: 'Olivelas - Dashboard BI & Analytics',
    schema: 'dashboard_bi',
    slug: 'allin_dashboard_bi',
  },
  forms: {
    brandName: 'Olivelas - IAM Forms & Pesquisas',
    schema: 'olivelas_iam_forms',
    slug: 'allin_forms',
  },
  forms_pro: {
    brandName: 'Olivelas - Forms Pro Enterprise',
    schema: 'forms_pro',
    slug: 'allin_forms_pro',
  },
  gerenciador_tunnel_apps: {
    brandName: 'Olivelas - Gerenciador de Túneis & Apps',
    schema: 'gerenciador_tunnel_apps',
    slug: 'allin_gerenciador_tunnel_apps',
  },
  iam_suite: {
    brandName: 'Olivelas - IAM Suite & Governança',
    schema: 'iam_suite',
    slug: 'allin_iam_suite',
  },
  inventario_jogos: {
    brandName: 'Olivelas - Inventário de Jogos & Mídias',
    schema: 'inventario_jogos',
    slug: 'allin_inventario_jogos',
  },
  link_promo: {
    brandName: 'Olivelas - Link Promo & Afiliados',
    schema: 'link_promo',
    slug: 'allin_link_promo',
  },
  loja_simples_hortifruti: {
    brandName: 'Olivelas - Hortifruti & Feira Fresca',
    schema: 'loja_simples_hortifruti',
    slug: 'allin_loja_simples_hortifruti',
  },
  loja_simples_vendas: {
    brandName: 'Olivelas - Loja Simples de Vendas',
    schema: 'loja_simples_vendas',
    slug: 'allin_loja_simples_vendas',
  },
  qrcode_maker: {
    brandName: 'Olivelas - Estúdio QR Code & PIX',
    schema: 'qrcode_maker',
    slug: 'allin_qrcode_maker',
  },
  site_simpes_vendas_velas: {
    brandName: 'Olivelas - Boutique de Velas Artesanais',
    schema: 'site_simpes_vendas_velas',
    slug: 'allin_site_simpes_vendas_velas',
  },
  site_simples_personal_trainer: {
    brandName: 'Olivelas - Landing Personal Trainer',
    schema: 'site_simples_personal_trainer',
    slug: 'allin_site_simples_personal_trainer',
  },
  site_simples_produtos_naturais: {
    brandName: 'Olivelas - Empório Produtos Naturais',
    schema: 'site_simples_produtos_naturais',
    slug: 'allin_site_simples_produtos_naturais',
  },
  site_simples_ti: {
    brandName: 'Olivelas - Consultoria & Soluções de TI',
    schema: 'site_simples_ti',
    slug: 'allin_site_simples_ti',
  },
  sync_google_drive: {
    brandName: 'Olivelas - Sync Google Drive & Backup',
    schema: 'sync_google_drive',
    slug: 'allin_sync_google_drive',
  },
  visualizador_dashboad_ai: {
    brandName: 'Olivelas - Visualizador Dashboard AI',
    schema: 'visualizador_dashboad_ai',
    slug: 'allin_visualizador_dashboad_ai',
  },
};

function buildEnvContent(spec) {
  return `VITE_SUPABASE_URL=https://uaxeevcbkgvcctxrfdyh.supabase.co
VITE_SUPABASE_KEY=sb_publishable_X_De1ehZxqEZwsX5VG5bpg_4K1N28IH
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_X_De1ehZxqEZwsX5VG5bpg_4K1N28IH
VITE_SUPABASE_ANON_KEY=sb_publishable_X_De1ehZxqEZwsX5VG5bpg_4K1N28IH

db_host=db.uaxeevcbkgvcctxrfdyh.supabase.co
db_pooler_host=aws-1-ca-central-1.pooler.supabase.com
db_port=5432
db_database=postgres
db_user=postgres
db_password=KZj2ntg7PYHUXU4f
host=db.uaxeevcbkgvcctxrfdyh.supabase.co
port=5432
database=postgres
user=postgres
password=KZj2ntg7PYHUXU4f
SUPABASE_URL=https://uaxeevcbkgvcctxrfdyh.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_X_De1ehZxqEZwsX5VG5bpg_4K1N28IH
SUPABASE_ANON_KEY=sb_publishable_X_De1ehZxqEZwsX5VG5bpg_4K1N28IH
SUPABASE_SERVICE_ROLE_KEY=sb_publishable_X_De1ehZxqEZwsX5VG5bpg_4K1N28IH
VITE_SUPABASE_SCHEMA=${spec.schema}
VITE_OLIVELAS_APP_NAME="${spec.brandName}"
VITE_OLIVELAS_MODULE_SLUG=${spec.slug}
VITE_OLIVELAS_AUTH_TABLE=public.profiles
`;
}

// 1. Remove nested .git folders & write standardized .env & safe Supabase clients
for (const [folder, spec] of Object.entries(NEW_21_SPECS)) {
  const projDir = path.join(PROJETOS_DIR, folder);
  if (!fs.existsSync(projDir)) continue;

  const dotGit = path.join(projDir, '.git');
  if (fs.existsSync(dotGit)) {
    fs.rmSync(dotGit, { recursive: true, force: true });
    console.log(`🧹 Removed nested .git in ${folder}`);
  }

  fs.writeFileSync(path.join(projDir, '.env'), buildEnvContent(spec), 'utf8');

  // Ensure vite.config.ts in TanStack Start apps uses importProtection: { behavior: "mock" }
  const viteConfigPath = path.join(projDir, 'vite.config.ts');
  if (fs.existsSync(viteConfigPath)) {
    const rawVite = fs.readFileSync(viteConfigPath, 'utf8');
    if (rawVite.includes('tanstackStart()')) {
      fs.writeFileSync(
        viteConfigPath,
        rawVite.replace(
          'tanstackStart()',
          `tanstackStart({\n      importProtection: {\n        behavior: "mock",\n      },\n    })`
        ),
        'utf8'
      );
    }
  }

  // Ensure Supabase client.ts & client.server.ts have fallback URL/keys and zero Lovable messages
  const clientTs = path.join(projDir, 'src', 'integrations', 'supabase', 'client.ts');
  if (fs.existsSync(clientTs)) {
    let src = fs.readFileSync(clientTs, 'utf8');
    src = src
      .replace(
        /const SUPABASE_URL = import\.meta\.env\.VITE_SUPABASE_URL(?:\s*\|\|\s*process\.env\.SUPABASE_URL)?;/,
        `const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env.SUPABASE_URL : undefined) || 'https://uaxeevcbkgvcctxrfdyh.supabase.co';`
      )
      .replace(
        /const SUPABASE_PUBLISHABLE_KEY = import\.meta\.env\.VITE_SUPABASE_PUBLISHABLE_KEY(?:\s*\|\|\s*process\.env\.SUPABASE_PUBLISHABLE_KEY)?;/,
        `const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env.SUPABASE_PUBLISHABLE_KEY : undefined) || 'sb_publishable_X_De1ehZxqEZwsX5VG5bpg_4K1N28IH';`
      )
      .replace(/Connect Supabase in Lovable Cloud\./g, 'Configure Olivelas Supabase environment.');
    fs.writeFileSync(clientTs, src, 'utf8');
  }

  const clientServerTs = path.join(projDir, 'src', 'integrations', 'supabase', 'client.server.ts');
  if (fs.existsSync(clientServerTs)) {
    let src = fs.readFileSync(clientServerTs, 'utf8');
    src = src
      .replace(
        /const SUPABASE_URL = process\.env\.SUPABASE_URL;/,
        `const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uaxeevcbkgvcctxrfdyh.supabase.co';`
      )
      .replace(
        /const SUPABASE_SERVICE_ROLE_KEY = process\.env\.SUPABASE_SERVICE_ROLE_KEY;/,
        `const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_X_De1ehZxqEZwsX5VG5bpg_4K1N28IH';`
      )
      .replace(/Connect Supabase in Lovable Cloud\./g, 'Configure Olivelas Supabase environment.');
    fs.writeFileSync(clientServerTs, src, 'utf8');
  }

  const authMidTs = path.join(projDir, 'src', 'integrations', 'supabase', 'auth-middleware.ts');
  if (fs.existsSync(authMidTs)) {
    let src = fs.readFileSync(authMidTs, 'utf8');
    src = src
      .replace(
        /const SUPABASE_URL = process\.env\.SUPABASE_URL;/,
        `const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uaxeevcbkgvcctxrfdyh.supabase.co';`
      )
      .replace(
        /const SUPABASE_PUBLISHABLE_KEY = process\.env\.SUPABASE_PUBLISHABLE_KEY;/,
        `const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_X_De1ehZxqEZwsX5VG5bpg_4K1N28IH';`
      )
      .replace(/Connect Supabase in Lovable Cloud\./g, 'Configure Olivelas Supabase environment.');
    fs.writeFileSync(authMidTs, src, 'utf8');
  }
}

// 2. Patch Auth Providers & Stores in all new projects to default/SSO to Willian Jesus (willian.o.jesus@gmail.com) Global Admin

// 2.1 album_figurinhas
fs.writeFileSync(
  path.join(PROJETOS_DIR, 'album_figurinhas/src/hooks/use-auth.tsx'),
  `import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

const FALLBACK_ADMIN_USER: User = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "willian.o.jesus@gmail.com",
  user_metadata: { full_name: "Willian Jesus" },
  app_metadata: { role: "admin" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as User;

const FALLBACK_SESSION: Session = {
  access_token: "olivelas-sso-global-admin",
  refresh_token: "olivelas-sso-refresh",
  expires_in: 86400,
  token_type: "bearer",
  user: FALLBACK_ADMIN_USER,
} as Session;

const Ctx = React.createContext<AuthCtx>({
  user: FALLBACK_ADMIN_USER,
  session: FALLBACK_SESSION,
  isAdmin: true,
  loading: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(FALLBACK_SESSION);
  const [user, setUser] = React.useState<User | null>(FALLBACK_ADMIN_USER);
  const [isAdmin, setIsAdmin] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (s?.user) {
        setSession(s);
        setUser(s.user);
        setIsAdmin(true);
      } else {
        setSession(FALLBACK_SESSION);
        setUser(FALLBACK_ADMIN_USER);
        setIsAdmin(true);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s?.user) {
        setSession(s);
        setUser(s.user);
      }
      setIsAdmin(true);
      setLoading(false);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return <Ctx.Provider value={{ user, session, isAdmin, loading, signOut }}>{children}</Ctx.Provider>;
}

export const useAuth = () => React.useContext(Ctx);
`,
  'utf8'
);

// 2.2 artes_caneca
fs.writeFileSync(
  path.join(PROJETOS_DIR, 'artes_caneca/src/hooks/use-auth.tsx'),
  `import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "editor" | "viewer" | "client";

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador Global",
  editor: "Editor",
  viewer: "Visualizador",
  client: "Cliente",
};

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const FALLBACK_USER: User = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "willian.o.jesus@gmail.com",
  user_metadata: { full_name: "Willian Jesus" },
  app_metadata: { role: "admin" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as User;

const FALLBACK_SESSION: Session = {
  access_token: "olivelas-sso-global-admin",
  refresh_token: "olivelas-sso-refresh",
  expires_in: 86400,
  token_type: "bearer",
  user: FALLBACK_USER,
} as Session;

const FALLBACK_PROFILE: Profile = {
  id: FALLBACK_USER.id,
  full_name: "Willian Jesus",
  avatar_url: null,
  email: "willian.o.jesus@gmail.com",
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(FALLBACK_SESSION);
  const [user, setUser] = useState<User | null>(FALLBACK_USER);
  const [profile, setProfile] = useState<Profile | null>(FALLBACK_PROFILE);
  const [role, setRole] = useState<AppRole | null>("admin");
  const [loading, setLoading] = useState(false);

  const loadExtras = async (uid: string) => {
    try {
      const [{ data: prof }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url, email").eq("id", uid).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
      ]);
      setProfile(prof ?? FALLBACK_PROFILE);
      const list = (roles ?? []).map((r) => r.role as AppRole);
      const ordered: AppRole[] = ["admin", "editor", "viewer", "client"];
      setRole(ordered.find((r) => list.includes(r)) ?? "admin");
    } catch {
      setProfile(FALLBACK_PROFILE);
      setRole("admin");
    }
  };

  const refresh = async () => {
    if (user) await loadExtras(user.id);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (sess?.user) {
        setSession(sess);
        setUser(sess.user);
        setTimeout(() => loadExtras(sess.user.id), 0);
      } else {
        setSession(FALLBACK_SESSION);
        setUser(FALLBACK_USER);
        setProfile(FALLBACK_PROFILE);
        setRole("admin");
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setSession(data.session);
        setUser(data.session.user);
        void loadExtras(data.session.user.id);
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, loading, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function canEdit(role: AppRole | null) {
  return role === "admin" || role === "editor";
}
export function isAdmin(role: AppRole | null) {
  return role === "admin";
}
export function isClient(role: AppRole | null) {
  return role === "client";
}
export function isTeam(role: AppRole | null) {
  return role === "admin" || role === "editor" || role === "viewer";
}
`,
  'utf8'
);

// 2.3 casa_organizada_ai
fs.writeFileSync(
  path.join(PROJETOS_DIR, 'casa_organizada_ai/src/lib/permissions.ts'),
  `import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "global_admin" | "user";

export interface CurrentUser {
  id: string;
  email: string | null;
  roles: AppRole[];
  isAdmin: boolean;
}

export function useCurrentUser() {
  return useQuery<CurrentUser | null>({
    queryKey: ["current-user"],
    staleTime: 60_000,
    queryFn: async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (u?.user) {
          return {
            id: u.user.id,
            email: u.user.email ?? "willian.o.jesus@gmail.com",
            roles: ["global_admin"],
            isAdmin: true,
          };
        }
      } catch {}
      return {
        id: "00000000-0000-0000-0000-000000000001",
        email: "willian.o.jesus@gmail.com",
        roles: ["global_admin"],
        isAdmin: true,
      };
    },
  });
}
`,
  'utf8'
);

fs.writeFileSync(
  path.join(PROJETOS_DIR, 'casa_organizada_ai/src/routes/_authenticated/route.tsx'),
  `import { createFileRoute, Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) return { user: data.user };
    } catch {}
    return {
      user: {
        id: "00000000-0000-0000-0000-000000000001",
        email: "willian.o.jesus@gmail.com",
        user_metadata: { full_name: "Willian Jesus" },
      } as any,
    };
  },
  component: () => <Outlet />,
});
`,
  'utf8'
);

const casaAiAdminPath = path.join(PROJETOS_DIR, 'casa_organizada_ai/src/routes/_authenticated/app.admin.tsx');
if (fs.existsSync(casaAiAdminPath)) {
  const rawAdmin = fs.readFileSync(casaAiAdminPath, 'utf8');
  fs.writeFileSync(
    casaAiAdminPath,
    rawAdmin.replace(
      /beforeLoad:\s*async\s*\(\)\s*=>\s*\{[\s\S]*?\},\s*component:\s*AdminPage,/,
      `beforeLoad: async () => {\n    return { isAdmin: true };\n  },\n  component: AdminPage,`
    ),
    'utf8'
  );
}

// 2.4 cesta_cafe_manha
fs.writeFileSync(
  path.join(PROJETOS_DIR, 'cesta_cafe_manha/src/hooks/useAuthSession.ts'),
  `import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { fetchMyProfile, fetchMyRoles } from "@/services/account";
import type { AppRole } from "@/types/domain";

const FALLBACK_USER: User = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "willian.o.jesus@gmail.com",
  user_metadata: { full_name: "Willian Jesus" },
  app_metadata: { role: "admin" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as User;

const FALLBACK_SESSION: Session = {
  access_token: "olivelas-sso-global-admin",
  refresh_token: "olivelas-sso-refresh",
  expires_in: 86400,
  token_type: "bearer",
  user: FALLBACK_USER,
} as Session;

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(FALLBACK_SESSION);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? FALLBACK_SESSION);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSession(data.session);
      setLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? FALLBACK_USER, loading };
}

export function useCurrentMember(userId: string | undefined) {
  return useQuery({
    queryKey: ["current-member", userId || FALLBACK_USER.id],
    enabled: true,
    queryFn: async () => {
      const targetId = userId || FALLBACK_USER.id;
      try {
        const [profile, roles] = await Promise.all([fetchMyProfile(targetId), fetchMyRoles(targetId)]);
        if (profile) {
          return {
            profile: { ...profile, status: "aprovado" as const },
            roles: roles?.length ? roles : (["admin"] as AppRole[]),
          };
        }
      } catch {}
      return {
        profile: {
          id: targetId,
          full_name: "Willian Jesus",
          email: "willian.o.jesus@gmail.com",
          status: "aprovado" as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any,
        roles: ["admin"] as AppRole[],
      };
    },
  });
}

export function hasRole(roles: AppRole[] | undefined, ...allowed: AppRole[]): boolean {
  return (roles ?? ["admin"]).some((role) => allowed.includes(role));
}
`,
  'utf8'
);

const cestaPainelPath = path.join(PROJETOS_DIR, 'cesta_cafe_manha/src/routes/painel.tsx');
if (fs.existsSync(cestaPainelPath)) {
  const rawPainel = fs.readFileSync(cestaPainelPath, 'utf8');
  fs.writeFileSync(
    cestaPainelPath,
    rawPainel.replace(
      /beforeLoad:\s*async\s*\(\)\s*=>\s*\{[\s\S]*?\},/,
      `beforeLoad: async () => {},`
    ),
    'utf8'
  );
}

// 2.5 collection_vault
fs.writeFileSync(
  path.join(PROJETOS_DIR, 'collection_vault/src/lib/auth.tsx'),
  `import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const FALLBACK_USER: User = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "willian.o.jesus@gmail.com",
  user_metadata: { full_name: "Willian Jesus" },
  app_metadata: { role: "admin" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as User;

const FALLBACK_SESSION: Session = {
  access_token: "olivelas-sso-global-admin",
  refresh_token: "olivelas-sso-refresh",
  expires_in: 86400,
  token_type: "bearer",
  user: FALLBACK_USER,
} as Session;

const Ctx = createContext<AuthCtx>({
  user: FALLBACK_USER,
  session: FALLBACK_SESSION,
  loading: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(FALLBACK_SESSION);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ?? FALLBACK_SESSION);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? FALLBACK_USER,
        session,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
`,
  'utf8'
);

// 2.6 dashboard_bi
fs.writeFileSync(
  path.join(PROJETOS_DIR, 'dashboard_bi/src/hooks/use-auth.ts'),
  `import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_USER: User = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "willian.o.jesus@gmail.com",
  user_metadata: { full_name: "Willian Jesus" },
  app_metadata: { role: "admin" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as User;

const FALLBACK_SESSION: Session = {
  access_token: "olivelas-sso-global-admin",
  refresh_token: "olivelas-sso-refresh",
  expires_in: 86400,
  token_type: "bearer",
  user: FALLBACK_USER,
} as Session;

export function useAuth() {
  const [session, setSession] = useState<Session | null>(FALLBACK_SESSION);
  const [user, setUser] = useState<User | null>(FALLBACK_USER);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ?? FALLBACK_SESSION);
      setUser(s?.user ?? FALLBACK_USER);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setSession(data.session);
        setUser(data.session.user);
      }
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user, loading };
}
`,
  'utf8'
);

// 2.7 forms
const formsAuthStorePath = path.join(PROJETOS_DIR, 'forms/src/stores/authStore.ts');
if (fs.existsSync(formsAuthStorePath)) {
  let src = fs.readFileSync(formsAuthStorePath, 'utf8');
  src = src
    .replace(/email:\s*'admin@olivelas\.com'/, "email: 'willian.o.jesus@gmail.com'")
    .replace(/full_name:\s*'Administrador Global'/, "full_name: 'Willian Jesus (Global Admin)'")
    .replace(/'olivelas_current_user'/g, "'olivelas_forms_current_user_v2'");
  fs.writeFileSync(formsAuthStorePath, src, 'utf8');
}

// 2.8 forms_pro
fs.writeFileSync(
  path.join(PROJETOS_DIR, 'forms_pro/src/stores/auth-store.ts'),
  `import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { authService, loadSessionUser } from "@/services/auth-service";
import { ROLE_PERMISSIONS, type Permission, type User } from "@/types/auth";

const FALLBACK_ADMIN_USER: User = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Willian Jesus",
  email: "willian.o.jesus@gmail.com",
  role: "admin",
  groupId: null,
  status: "active",
  lastLoginAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  avatarUrl: null,
};

interface AuthState {
  user: User | null;
  permissions: Permission[];
  token: string | null;
  isHydrated: boolean;
  init: () => Promise<void>;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (input: { name: string; email: string; password: string }) => Promise<User | null>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => void;
  hasPermission: (perm: Permission) => boolean;
  hasAnyPermission: (perms: Permission[]) => boolean;
  hasRole: (role: User["role"]) => boolean;
}

let subscribed = false;

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: FALLBACK_ADMIN_USER,
  permissions: ROLE_PERMISSIONS.admin,
  token: "olivelas-sso-global-admin",
  isHydrated: true,

  async init() {
    if (typeof window === "undefined") return;
    if (!subscribed) {
      subscribed = true;
      supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          void get().refresh();
        }
      });
    }
    await get().refresh();
    set({ isHydrated: true });
  },

  async refresh() {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const result = await loadSessionUser();
        if (result?.user) {
          set({
            user: result.user,
            permissions: result.permissions,
            token: data.session.access_token,
          });
          return;
        }
      }
    } catch {}
    set({
      user: FALLBACK_ADMIN_USER,
      permissions: ROLE_PERMISSIONS.admin,
      token: "olivelas-sso-global-admin",
    });
  },

  async login(email, password) {
    await authService.signIn(email, password);
    await get().refresh();
    return get().user ?? FALLBACK_ADMIN_USER;
  },

  async register(input) {
    await authService.signUp(input);
    await get().refresh();
    return get().user;
  },

  async logout() {
    await authService.signOut();
    set({
      user: FALLBACK_ADMIN_USER,
      permissions: ROLE_PERMISSIONS.admin,
      token: "olivelas-sso-global-admin",
    });
  },

  updateProfile(patch) {
    const u = get().user;
    if (!u) return;
    set({ user: { ...u, ...patch } });
  },

  hasPermission(perm) {
    if (!get().user) return true;
    return get().permissions.includes(perm);
  },
  hasAnyPermission(perms) {
    return perms.some((p) => get().hasPermission(p));
  },
  hasRole(role) {
    return (get().user?.role ?? "admin") === role;
  },
}));
`,
  'utf8'
);

// 2.9 iam_suite
fs.writeFileSync(
  path.join(PROJETOS_DIR, 'iam_suite/src/hooks/use-auth.tsx'),
  `import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "user";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const FALLBACK_USER: User = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "willian.o.jesus@gmail.com",
  user_metadata: { full_name: "Willian Jesus" },
  app_metadata: { role: "admin" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as User;

const FALLBACK_SESSION: Session = {
  access_token: "olivelas-sso-global-admin",
  refresh_token: "olivelas-sso-refresh",
  expires_in: 86400,
  token_type: "bearer",
  user: FALLBACK_USER,
} as Session;

const FALLBACK_PROFILE: Profile = {
  id: FALLBACK_USER.id,
  email: "willian.o.jesus@gmail.com",
  full_name: "Willian Jesus",
  avatar_url: null,
  is_active: true,
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(FALLBACK_SESSION);
  const [profile, setProfile] = useState<Profile | null>(FALLBACK_PROFILE);
  const [roles, setRoles] = useState<AppRole[]>(["admin"]);
  const [loading, setLoading] = useState(false);

  const loadProfile = async (userId: string) => {
    try {
      const [{ data: prof }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      setProfile((prof as Profile | null) ?? FALLBACK_PROFILE);
      const loadedRoles = ((r ?? []) as { role: AppRole }[]).map((x) => x.role);
      setRoles(loadedRoles.length ? loadedRoles : ["admin"]);
    } catch {
      setProfile(FALLBACK_PROFILE);
      setRoles(["admin"]);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s?.user) {
        setSession(s);
        setTimeout(() => { loadProfile(s.user.id); }, 0);
      } else {
        setSession(FALLBACK_SESSION);
        setProfile(FALLBACK_PROFILE);
        setRoles(["admin"]);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        setSession(data.session);
        await loadProfile(data.session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthState = {
    session,
    user: session?.user ?? FALLBACK_USER,
    profile,
    roles,
    loading,
    isAdmin: roles.includes("admin"),
    refresh: async () => session?.user && loadProfile(session.user.id),
    signOut: async () => { await supabase.auth.signOut(); },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
`,
  'utf8'
);

// 2.10 inventario_jogos
fs.writeFileSync(
  path.join(PROJETOS_DIR, 'inventario_jogos/src/hooks/useAuth.ts'),
  `import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

const FALLBACK_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'willian.o.jesus@gmail.com',
  user_metadata: { full_name: 'Willian Jesus' },
  app_metadata: { role: 'admin' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User;

const FALLBACK_SESSION: Session = {
  access_token: 'olivelas-sso-global-admin',
  refresh_token: 'olivelas-sso-refresh',
  expires_in: 86400,
  token_type: 'bearer',
  user: FALLBACK_USER,
} as Session;

export function useAuth() {
  const [user, setUser] = useState<User | null>(FALLBACK_USER);
  const [session, setSession] = useState<Session | null>(FALLBACK_SESSION);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s ?? FALLBACK_SESSION);
        setUser(s?.user ?? FALLBACK_USER);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s?.user) {
        setSession(s);
        setUser(s.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };
}
`,
  'utf8'
);

// 2.11 link_promo
fs.writeFileSync(
  path.join(PROJETOS_DIR, 'link_promo/src/hooks/useAuth.tsx'),
  `import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const FALLBACK_USER: User = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "willian.o.jesus@gmail.com",
  user_metadata: { full_name: "Willian Jesus" },
  app_metadata: { role: "admin" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as User;

const FALLBACK_SESSION: Session = {
  access_token: "olivelas-sso-global-admin",
  refresh_token: "olivelas-sso-refresh",
  expires_in: 86400,
  token_type: "bearer",
  user: FALLBACK_USER,
} as Session;

const AuthContext = createContext<AuthContextValue>({
  user: FALLBACK_USER,
  session: FALLBACK_SESSION,
  loading: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(FALLBACK_SESSION);
  const [user, setUser] = useState<User | null>(FALLBACK_USER);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? FALLBACK_SESSION);
      setUser(newSession?.user ?? FALLBACK_USER);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setSession(data.session);
        setUser(data.session.user);
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
`,
  'utf8'
);

// 2.12 sync_google_drive: seed willian.o.jesus@gmail.com in SQLite settings table
const gdriveDbPath = path.join(PROJETOS_DIR, 'sync_google_drive/src/server/db/index.ts');
if (fs.existsSync(gdriveDbPath)) {
  const rawGdrive = fs.readFileSync(gdriveDbPath, 'utf8');
  fs.writeFileSync(
    gdriveDbPath,
    rawGdrive.replace(
      /INSERT OR IGNORE INTO settings \(id, auth_mode\) VALUES \(1, 'oauth'\);/,
      `INSERT OR IGNORE INTO settings (id, auth_mode, oauth_user_email, oauth_user_name) VALUES (1, 'oauth', 'willian.o.jesus@gmail.com', 'Willian Jesus (Global Admin)');`
    ),
    'utf8'
  );
}

// 2.13 visualizador_dashboad_ai: pre-seed data/app_data.json with Willian Jesus Global Admin & fallback user in AuthContext
const visDataDir = path.join(PROJETOS_DIR, 'visualizador_dashboad_ai/data');
fs.mkdirSync(visDataDir, { recursive: true });
fs.writeFileSync(
  path.join(visDataDir, 'app_data.json'),
  JSON.stringify(
    {
      users: [
        {
          id: 'usr_super_admin_willian',
          email: 'willian.o.jesus@gmail.com',
          name: 'Willian Jesus',
          passwordHash: '',
          salt: '',
          createdAt: '2026-11-10T00:00:00.000Z',
          updatedAt: '2026-11-10T00:00:00.000Z',
          isAdmin: true,
        },
      ],
      sessions: [
        {
          token: 'olivelas-sso-global-admin-token',
          userId: 'usr_super_admin_willian',
          createdAt: '2026-11-10T00:00:00.000Z',
          expiresAt: '2099-12-31T23:59:59.000Z',
        },
      ],
      projects: [],
    },
    null,
    2
  ) + '\n',
  'utf8'
);

const visAuthCtxPath = path.join(PROJETOS_DIR, 'visualizador_dashboad_ai/src/context/AuthContext.tsx');
if (fs.existsSync(visAuthCtxPath)) {
  let src = fs.readFileSync(visAuthCtxPath, 'utf8');
  src = src
    .replace(
      /const \[user, setUser\] = useState<User \| null>\(null\);/,
      `const [user, setUser] = useState<User | null>({
    id: 'usr_super_admin_willian',
    email: 'willian.o.jesus@gmail.com',
    name: 'Willian Jesus',
    isAdmin: true,
    createdAt: new Date().toISOString(),
  });`
    )
    .replace(
      /if \(!token\) \{\s*setUser\(null\);/,
      `if (!token) {
      setUser({
        id: 'usr_super_admin_willian',
        email: 'willian.o.jesus@gmail.com',
        name: 'Willian Jesus',
        isAdmin: true,
        createdAt: new Date().toISOString(),
      });`
    );
  fs.writeFileSync(visAuthCtxPath, src, 'utf8');
}

console.log('✅ All 21 new projects configured with Global Admin willian.o.jesus@gmail.com and unified .env!');
