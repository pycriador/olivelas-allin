import { supabase } from "@/integrations/supabase/client";

export type MarketTemplate = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  cover_url: string | null;
  icon: string | null;
  planner_view: string;
  language: string;
  version: string;
  author_id: string | null;
  is_featured: boolean;
  is_system: boolean;
  downloads_count: number;
  favorites_count: number;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
  schema: unknown;
};

export type MarketTheme = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  cover_url: string | null;
  tokens: {
    mode?: "light" | "dark";
    colors?: Record<string, string>;
    typography?: Record<string, string>;
  };
  language: string;
  version: string;
  author_id: string | null;
  is_featured: boolean;
  is_system: boolean;
  downloads_count: number;
  favorites_count: number;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
};

export type SortKey =
  | "popular"
  | "recent"
  | "rating"
  | "downloads"
  | "az";

export type BrowseFilters = {
  q?: string;
  category?: string;
  language?: string;
  sort?: SortKey;
  onlyFavorites?: boolean;
  featured?: boolean;
};

const TEMPLATE_COLS =
  "id,title,description,category,tags,cover_url,icon,planner_view,language,version,author_id,is_featured,is_system,downloads_count,favorites_count,rating_avg,rating_count,created_at,updated_at,schema";

const THEME_COLS =
  "id,title,description,category,tags,cover_url,tokens,language,version,author_id,is_featured,is_system,downloads_count,favorites_count,rating_avg,rating_count,created_at,updated_at";

function applySort<T extends { created_at: string; rating_avg: number; downloads_count: number; favorites_count: number; title: string; is_featured: boolean }>(
  rows: T[],
  sort: SortKey,
): T[] {
  const arr = [...rows];
  switch (sort) {
    case "recent":
      arr.sort((a, b) => b.created_at.localeCompare(a.created_at));
      break;
    case "rating":
      arr.sort((a, b) => b.rating_avg - a.rating_avg || b.favorites_count - a.favorites_count);
      break;
    case "downloads":
      arr.sort((a, b) => b.downloads_count - a.downloads_count);
      break;
    case "az":
      arr.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "popular":
    default:
      arr.sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || b.favorites_count - a.favorites_count || b.downloads_count - a.downloads_count);
  }
  return arr;
}

export async function listTemplates(filters: BrowseFilters = {}): Promise<MarketTemplate[]> {
  let query = supabase.from("templates").select(TEMPLATE_COLS).limit(200);
  if (filters.category && filters.category !== "all") query = query.eq("category", filters.category);
  if (filters.language && filters.language !== "all") query = query.eq("language", filters.language);
  if (filters.featured) query = query.eq("is_featured", true);
  if (filters.q) query = query.ilike("title", `%${filters.q}%`);
  const { data, error } = await query;
  if (error) throw error;
  return applySort((data ?? []) as MarketTemplate[], filters.sort ?? "popular");
}

export async function listThemes(filters: BrowseFilters = {}): Promise<MarketTheme[]> {
  let query = supabase.from("themes").select(THEME_COLS).limit(200);
  if (filters.category && filters.category !== "all") query = query.eq("category", filters.category);
  if (filters.language && filters.language !== "all") query = query.eq("language", filters.language);
  if (filters.featured) query = query.eq("is_featured", true);
  if (filters.q) query = query.ilike("title", `%${filters.q}%`);
  const { data, error } = await query;
  if (error) throw error;
  return applySort((data ?? []) as MarketTheme[], filters.sort ?? "popular");
}

export async function getTemplate(id: string): Promise<MarketTemplate | null> {
  const { data, error } = await supabase.from("templates").select(TEMPLATE_COLS).eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as MarketTemplate) ?? null;
}

export async function getTheme(id: string): Promise<MarketTheme | null> {
  const { data, error } = await supabase.from("themes").select(THEME_COLS).eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as MarketTheme) ?? null;
}

export async function listMyTemplateFavoriteIds(): Promise<Set<string>> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return new Set();
  const { data } = await supabase.from("user_template_favorites").select("template_id").eq("user_id", u.user.id);
  return new Set((data ?? []).map((r) => r.template_id));
}

export async function listMyThemeFavoriteIds(): Promise<Set<string>> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return new Set();
  const { data } = await supabase.from("theme_favorites").select("theme_id").eq("user_id", u.user.id);
  return new Set((data ?? []).map((r) => r.theme_id));
}

export async function toggleTemplateFavorite(templateId: string, favorited: boolean) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Faça login para favoritar.");
  if (favorited) {
    await supabase.from("user_template_favorites").delete().eq("user_id", u.user.id).eq("template_id", templateId);
  } else {
    await supabase.from("user_template_favorites").insert({ user_id: u.user.id, template_id: templateId });
  }
}

export async function toggleThemeFavorite(themeId: string, favorited: boolean) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Faça login para favoritar.");
  if (favorited) {
    await supabase.from("theme_favorites").delete().eq("user_id", u.user.id).eq("theme_id", themeId);
  } else {
    await supabase.from("theme_favorites").insert({ user_id: u.user.id, theme_id: themeId });
  }
}

export type RatingRow = {
  id: string;
  rating: number;
  comment: string | null;
  user_id: string;
  created_at: string;
};

export async function listTemplateRatings(templateId: string): Promise<RatingRow[]> {
  const { data } = await supabase
    .from("template_ratings")
    .select("id,rating,comment,user_id,created_at")
    .eq("template_id", templateId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as RatingRow[];
}

export async function listThemeRatings(themeId: string): Promise<RatingRow[]> {
  const { data } = await supabase
    .from("theme_ratings")
    .select("id,rating,comment,user_id,created_at")
    .eq("theme_id", themeId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as RatingRow[];
}

export async function upsertTemplateRating(templateId: string, rating: number, comment?: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Faça login para avaliar.");
  await supabase
    .from("template_ratings")
    .upsert({ template_id: templateId, user_id: u.user.id, rating, comment: comment ?? null }, { onConflict: "template_id,user_id" });
}

export async function upsertThemeRating(themeId: string, rating: number, comment?: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Faça login para avaliar.");
  await supabase
    .from("theme_ratings")
    .upsert({ theme_id: themeId, user_id: u.user.id, rating, comment: comment ?? null }, { onConflict: "theme_id,user_id" });
}

export async function useTemplateAsForm(t: MarketTemplate): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Faça login para usar este template.");
  const { data, error } = await supabase
    .from("forms")
    .insert({
      owner_id: u.user.id,
      title: t.title,
      description: t.description,
      category: t.category,
      tags: t.tags,
      planner_view: t.planner_view,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      schema: (t.schema ?? { pages: [{ id: "p1", title: "Página 1", fields: [] }], logic: [], settings: { autosave: true } }) as any,
      base_template_id: t.id,
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Falha ao criar formulário");
  await supabase.from("template_downloads").insert({ template_id: t.id, user_id: u.user.id });
  return data.id as string;
}