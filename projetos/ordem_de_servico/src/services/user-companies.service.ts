import { supabase } from "@/lib/supabase";

export interface UserCompany {
  id: string;
  name: string;
  logoUrl: string | null;
  role: "global_admin" | "admin" | "editor" | "viewer";
  isDefault: boolean;
}

export const userCompaniesService = {
  async listForCurrentUser(): Promise<UserCompany[]> {
    const { data, error } = await supabase
      .from("user_companies")
      .select("role, is_default, companies:company_id ( id, name, logo_url, active )")
      .order("is_default", { ascending: false });
    if (error) throw error;
    const rows = (data ?? []) as unknown as Array<{
      role: UserCompany["role"];
      is_default: boolean;
      companies: { id: string; name: string; logo_url: string | null; active: boolean } | null;
    }>;
    const mapped = rows
      .filter((r) => r.companies && r.companies.active)
      .map((r) => ({
        id: r.companies!.id,
        name: r.companies!.name,
        logoUrl: r.companies!.logo_url,
        role: r.role,
        isDefault: r.is_default,
      }));

    // Deduplicate companies by ID to ensure distinct keys and entries
    const seen = new Set<string>();
    const unique: UserCompany[] = [];
    for (const item of mapped) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        unique.push(item);
      }
    }
    return unique;
  },
};

const STORAGE_KEY = "sf.currentCompanyId";

export const companySelection = {
  get(): string | null {
    try {
      return typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    } catch {
      return null;
    }
  },
  set(id: string | null) {
    try {
      if (typeof window === "undefined") return;
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  },
};
