// Etapa 20 — Realtime foundation. Subscribes to Postgres changes and invalidates
// TanStack Query caches so any future collaborative editing works without refactors.
import { supabase } from "@/integrations/supabase/client";
import type { QueryClient } from "@tanstack/react-query";

const TABLES: Array<{ table: string; keys: string[][] }> = [
  { table: "projects", keys: [["projects"]] },
  { table: "nodes", keys: [["nodes"]] },
  { table: "memberships", keys: [["iam", "memberships"]] },
  { table: "profiles", keys: [["iam", "users"], ["currentUser"]] },
  { table: "workspaces", keys: [["workspaces"]] },
];

export function subscribeRealtime(qc: QueryClient): () => void {
  const channel = supabase.channel("specforge-changes");

  for (const { table, keys } of TABLES) {
    channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
      for (const queryKey of keys) qc.invalidateQueries({ queryKey });
    });
  }

  void channel.subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
