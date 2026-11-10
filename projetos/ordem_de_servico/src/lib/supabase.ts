import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL) as string | undefined;
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY) as string | undefined;

export const isSupabaseConfigured = (): boolean => Boolean(url && anonKey);

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }

    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function normalizeUrl(u: string): string {
  return u.startsWith("http://") || u.startsWith("https://") ? u : `https://${u}`;
}

/**
 * Storage adapter that gracefully handles QuotaExceededError
 * by clearing old sb-* keys and retrying.
 */
const safeStorage: Storage = {
  get length() {
    try { return localStorage.length; } catch { return 0; }
  },
  clear() {
    try { localStorage.clear(); } catch { /* ignore */ }
  },
  key(index: number) {
    try { return localStorage.key(index); } catch { return null; }
  },
  getItem(key: string) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem(key: string, value: string) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        localStorage.setItem(key, value);
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "QuotaExceededError") {
          // Clear all sb-* keys and retry once
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k?.startsWith("sb-")) {
              localStorage.removeItem(k);
            }
          }
          continue;
        }
        throw err;
      }
    }
    // Session stays in memory only — acceptable fallback
  },
  removeItem(key: string) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  },
};

let client: SupabaseClient<any, any, any> | null = null;

/**
 * Singleton Supabase client. Reads exclusively from
 * VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
 */
export const supabase: SupabaseClient<any, any, any> = new Proxy({} as SupabaseClient<any, any, any>, {
  get(_target, prop) {
    if (!client) {
      if (!url || !anonKey) {
        throw new Error(
          "Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY."
        );
      }
      client = createClient(normalizeUrl(url), anonKey, {
        db: {
          schema: 'serviceforge',
        },
        global: {
          fetch: createSupabaseFetch(anonKey),
        },
        auth: {
          storage: safeStorage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      });
    }
    // @ts-expect-error dynamic passthrough
    return client[prop];
  },
});

export function getSupabase(): SupabaseClient<any, any, any> {
  // Kept for backward compat with older async callers.
  return supabase;
}
