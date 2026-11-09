import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { safeILike, sanitizeSearchInput } from "@/lib/security/sanitize";

export type CollectionRow = Database["public"]["Tables"]["collections"]["Row"];
export type CollectionInsert = Database["public"]["Tables"]["collections"]["Insert"];
export type CollectionUpdate = Database["public"]["Tables"]["collections"]["Update"];

export interface ListParams {
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: keyof CollectionRow;
  direction?: "asc" | "desc";
}

export const collectionsRepo = {
  async listAdmin(params: ListParams = {}) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let q = supabase
      .from("collections")
      .select("*", { count: "exact" })
      .order((params.sort as string) ?? "display_order", {
        ascending: (params.direction ?? "asc") === "asc",
      })
      .range(from, to);
    if (params.search) {
      const pattern = safeILike(sanitizeSearchInput(params.search) ?? "");
      q = q.ilike("name", pattern);
    }
    const { data, error, count } = await q;
    if (error) throw error;
    return { rows: data ?? [], total: count ?? 0 };
  },

  async listPublic() {
    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .eq("status", "active")
      .order("display_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async getBySlug(slug: string) {
    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(input: CollectionInsert) {
    const { data, error } = await supabase.from("collections").insert(input).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, input: CollectionUpdate) {
    const { data, error } = await supabase
      .from("collections")
      .update(input)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id: string) {
    const { error } = await supabase.from("collections").delete().eq("id", id);
    if (error) throw error;
  },

  async count() {
    const { count, error } = await supabase
      .from("collections")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    return count ?? 0;
  },

  async recent(limit = 5) {
    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },
};
