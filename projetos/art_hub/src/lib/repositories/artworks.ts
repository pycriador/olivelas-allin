import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { safeILike, sanitizeSearchInput } from "@/lib/security/sanitize";

export type ArtworkRow = Database["public"]["Tables"]["artworks"]["Row"];
export type ArtworkInsert = Database["public"]["Tables"]["artworks"]["Insert"];
export type ArtworkUpdate = Database["public"]["Tables"]["artworks"]["Update"];

export interface ArtworkListParams {
  search?: string;
  page?: number;
  pageSize?: number;
  collectionId?: string | null;
  sort?: keyof ArtworkRow;
  direction?: "asc" | "desc";
}

export type ArtworkWithCollection = ArtworkRow & {
  collection: { id: string; name: string; slug: string } | null;
};

export const artworksRepo = {
  async listAdmin(params: ArtworkListParams = {}) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = supabase
      .from("artworks")
      .select("*, collection:collections(id, name, slug), ai_metadata:artwork_ai_metadata(*)", { count: "exact" })
      .order((params.sort as string) ?? "created_at", {
        ascending: (params.direction ?? "desc") === "asc",
      })
      .range(from, to);
    const searchTerm = sanitizeSearchInput(params.search);
    if (searchTerm) {
      const pattern = safeILike(searchTerm);
      q = q.or(
        `title.ilike.${pattern},code.ilike.${pattern},` +
        `ai_metadata.short_summary.ilike.${pattern},` +
        `ai_metadata.keywords.cs.{${searchTerm}},` +
        `ai_metadata.tags.cs.{${searchTerm}},` +
        `ai_metadata.theme.ilike.${pattern},` +
        `ai_metadata.occasion.ilike.${pattern},` +
        `ai_metadata.style.ilike.${pattern},` +
        `ai_metadata.emotion.ilike.${pattern},` +
        `ai_metadata.suggested_category.ilike.${pattern},` +
        `ai_metadata.suggested_collection.ilike.${pattern}`,
      );
    }
    const { data, error, count } = await q;
    if (error) throw error;
    return { rows: (data ?? []) as unknown as ArtworkWithCollection[], total: count ?? 0 };
  },

  async listByCollection(collectionId: string, search?: string) {
    let q = supabase
      .from("artworks")
      .select("*, ai_metadata:artwork_ai_metadata(*)")
      .eq("collection_id", collectionId)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    const searchTerm = sanitizeSearchInput(search);
    if (searchTerm) {
      const pattern = safeILike(searchTerm);
      q = q.or(
        `title.ilike.${pattern},code.ilike.${pattern},` +
        `ai_metadata.short_summary.ilike.${pattern},` +
        `ai_metadata.keywords.cs.{${searchTerm}},` +
        `ai_metadata.tags.cs.{${searchTerm}},` +
        `ai_metadata.theme.ilike.${pattern},` +
        `ai_metadata.occasion.ilike.${pattern},` +
        `ai_metadata.style.ilike.${pattern},` +
        `ai_metadata.emotion.ilike.${pattern},` +
        `ai_metadata.suggested_category.ilike.${pattern},` +
        `ai_metadata.suggested_collection.ilike.${pattern}`,
      );
    }
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("artworks")
      .select("*, collection:collections(id, name, slug)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as unknown as ArtworkWithCollection | null;
  },

  async create(input: ArtworkInsert) {
    const { data, error } = await supabase.from("artworks").insert(input).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, input: ArtworkUpdate) {
    const { data, error } = await supabase
      .from("artworks")
      .update(input)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id: string) {
    const { error } = await supabase.from("artworks").delete().eq("id", id);
    if (error) throw error;
  },

  async count() {
    const { count, error } = await supabase
      .from("artworks")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    return count ?? 0;
  },

  async countByCollection(collectionId: string) {
    const { count, error } = await supabase
      .from("artworks")
      .select("id", { count: "exact", head: true })
      .eq("collection_id", collectionId)
      .eq("status", "active");
    if (error) throw error;
    return count ?? 0;
  },

  async recent(limit = 5) {
    const { data, error } = await supabase
      .from("artworks")
      .select("*, collection:collections(id, name, slug)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as unknown as ArtworkWithCollection[];
  },
};
