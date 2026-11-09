// Repository Pattern: only these files talk to the cloud database.
import { cloudTable, fromRow, CloudError } from "@/lib/sb";
import { supabase } from "@/integrations/supabase/client";
import type {
  Workspace,
  Project,
  Roadmap,
  Sprint,
  Delivery,
  Specification,
  DocumentEntity,
  Template,
  Tag,
  ActivityEntry,
  Snippet,
} from "@/types/domain";

export const workspaceRepo = cloudTable<Workspace>("workspaces");
export const projectRepo = cloudTable<Project>("projects");
export const roadmapRepo = cloudTable<Roadmap>("roadmaps");
export const sprintRepo = cloudTable<Sprint>("sprints");
export const deliveryRepo = cloudTable<Delivery>("deliveries");
export const documentRepo = cloudTable<DocumentEntity>("documents");
export const templateRepo = cloudTable<Template>("templates");
export const tagRepo = cloudTable<Tag>("tags");
export const snippetRepo = cloudTable<Snippet>("snippets");

const activities = cloudTable<ActivityEntry>("activities");
export const activityRepo = {
  ...activities,
  recent: (limit = 20) => activities.query((q) => q.order("at", { ascending: false }).limit(limit)),
};

const specs = cloudTable<Specification>("specifications");
export const specificationRepo = {
  ...specs,
  active: () => specs.query((q) => q.eq("deleted", false)),
  trashed: () => specs.query((q) => q.eq("deleted", true)),
  favorites: () => specs.query((q) => q.eq("deleted", false).eq("favorite", true)),
  recent: (limit = 8) =>
    specs.query((q) => q.eq("deleted", false).order("updated_at", { ascending: false }).limit(limit)),
};

/** Key/value application settings (server-side, not LocalStorage). */
export const metaRepo = {
  async get(key: string): Promise<{ key: string; value: string } | undefined> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (supabase as any).from("app_settings").select("*").eq("key", key).maybeSingle();
    if (res.error) throw new CloudError(res.error.message, res.error.code);
    return fromRow<{ key: string; value: string }>(res.data);
  },
  async set(key: string, value: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (supabase as any).from("app_settings").upsert({ key, value }).select("key");
    if (res.error) throw new CloudError(res.error.message, res.error.code);
  },
};
