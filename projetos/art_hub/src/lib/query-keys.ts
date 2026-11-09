export const queryKeys = {
  dashboard: {
    collectionsCount: () => ["dashboard", "collections-count"] as const,
    artworksCount: () => ["dashboard", "artworks-count"] as const,
    storageUsage: () => ["dashboard", "storage-usage"] as const,
  },
  collections: {
    all: ["collections"] as const,
    list: (filters?: { search?: string; page?: number; sort?: string; direction?: "asc" | "desc" }) =>
      ["collections", "list", filters ?? {}] as const,
    publicList: () => ["collections", "public"] as const,
    detail: (id: string) => ["collections", "detail", id] as const,
    bySlug: (slug: string) => ["collections", "slug", slug] as const,
    counts: () => ["collections", "counts"] as const,
    recent: () => ["collections", "recent"] as const,
    count: (id: string) => ["collections", "count", id] as const,
  },
  artworks: {
    all: ["artworks"] as const,
    list: (filters?: {
      search?: string;
      page?: number;
      collectionId?: string | null;
      sort?: string;
      direction?: "asc" | "desc";
    }) => ["artworks", "list", filters ?? {}] as const,
    publicByCollection: (collectionId: string, search?: string) =>
      ["artworks", "public", collectionId, search ?? ""] as const,
    detail: (id: string) => ["artworks", "detail", id] as const,
    recent: () => ["artworks", "recent"] as const,
  },
  settings: {
    root: ["settings"] as const,
  },
  storage: {
    usage: ["storage", "usage"] as const,
  },
  auth: {
    session: ["auth", "session"] as const,
    role: (userId: string | undefined) => ["auth", "role", userId ?? "anon"] as const,
  },
  ai: {
    settings: ["ai", "settings"] as const,
    prompts: ["ai", "prompts"] as const,
    promptVersions: (promptId: string) => ["ai", "prompts", promptId, "versions"] as const,
    history: (filters?: { page?: number; status?: string | null; artworkId?: string | null }) =>
      ["ai", "history", filters ?? {}] as const,
    stats: ["ai", "stats"] as const,
    metadata: (artworkId: string) => ["ai", "metadata", artworkId] as const,
  },
};
