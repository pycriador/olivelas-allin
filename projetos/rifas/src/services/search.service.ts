import { supabase } from "@/integrations/supabase/client";

export type SearchEntity = "user" | "file" | "campaign" | "payment";

export interface SearchResult {
  id: string;
  entity: SearchEntity;
  title: string;
  subtitle: string;
  href: string;
}

/**
 * Busca global. A arquitetura já contempla campanhas e pagamentos,
 * que serão ativados nas próximas sprints.
 */
export const searchService = {
  async search(term: string): Promise<SearchResult[]> {
    const query = term.trim();
    if (query.length < 2) return [];
    const like = `%${query}%`;

    const [users, files] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, name, email")
        .is("deleted_at", null)
        .or(`name.ilike.${like},email.ilike.${like}`)
        .limit(5),
      supabase
        .from("storage_files")
        .select("id, filename, folder")
        .ilike("filename", like)
        .limit(5),
    ]);

    const results: SearchResult[] = [];

    for (const user of users.data ?? []) {
      results.push({
        id: user.id,
        entity: "user",
        title: user.name || user.email,
        subtitle: user.email,
        href: "/admin/users",
      });
    }

    for (const file of files.data ?? []) {
      results.push({
        id: file.id,
        entity: "file",
        title: file.filename,
        subtitle: file.folder,
        href: "/arquivos",
      });
    }

    return results;
  },
};
