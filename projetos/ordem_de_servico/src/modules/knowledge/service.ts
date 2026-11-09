import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type {
  KnowledgeArticle, KnowledgeCategory, KnowledgeCollection, KnowledgeSearchResult,
  KnowledgeDashboardStats, KnowledgeVersion, KnowledgeRelationship, KnowledgeComment,
  KnowledgeAttachment, KnowledgeContentType, KnowledgeStatus, KnowledgeDifficulty,
} from "./types";

const ART_COL = "knowledge_articles";
const CAT_COL = "knowledge_categories";
const COL_COL = "knowledge_collections";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function now(): string {
  return new Date().toISOString();
}

function createAnalytics(): KnowledgeArticle["analytics"] {
  return {
    id: uid(), articleId: "", views: 0, uniqueViews: 0, downloads: 0,
    ratings: [], avgRating: 0, timesUsed: 0, createdAt: now(), updatedAt: now(),
  };
}

export const knowledgeService = {
  /* ───── Articles ───── */

  async list(type?: KnowledgeContentType): Promise<KnowledgeArticle[]> {
    const all = await getStorage().findAll<KnowledgeArticle>(ART_COL);
    return type ? all.filter((a) => a.type === type) : all;
  },

  async get(id: string): Promise<KnowledgeArticle | null> {
    return getStorage().find<KnowledgeArticle>(ART_COL, id);
  },

  async create(
    data: Omit<KnowledgeArticle, "id" | "version" | "versions" | "analytics" | "views" | "favorites" | "pinned" | "createdAt" | "updatedAt">,
    userName?: string,
  ): Promise<KnowledgeArticle> {
    const article: KnowledgeArticle = {
      ...data as any,
      id: uid(),
      version: 1,
      versions: [],
      analytics: createAnalytics(),
      views: 0,
      favorites: 0,
      pinned: false,
      comments: data.comments ?? [],
      relationships: data.relationships ?? [],
      tags: data.tags ?? [],
      keywords: data.keywords ?? [],
      attachments: data.attachments ?? [],
      aiGenerated: data.aiGenerated ?? false,
      createdAt: now(),
      updatedAt: now(),
      createdBy: userName,
      updatedBy: userName,
    };
    article.analytics.articleId = article.id;
    const firstVersion: KnowledgeVersion = {
      id: uid(), version: 1, title: article.title, content: article.content,
      summary: article.summary, author: article.author, authorId: article.authorId,
      status: article.status, attachments: article.attachments,
      reason: "Versão inicial", createdAt: now(),
    };
    article.versions.push(firstVersion);
    await getStorage().create<KnowledgeArticle>(ART_COL, article);
    await this.incrementCategoryCount(article.categoryId, 1);
    eventBus.publish(EVENT_NAMES.KNOWLEDGE_CREATED, "entity", "knowledge", {
      id: article.id, title: article.title, type: article.type,
    }).catch(() => {});
    return article;
  },

  async update(id: string, patch: Partial<KnowledgeArticle>, reason?: string, userName?: string): Promise<KnowledgeArticle> {
    const existing = await this.get(id);
    if (!existing) throw new Error("Article not found");
    const oldCategoryId = existing.categoryId;
    const updated = await getStorage().update<KnowledgeArticle>(ART_COL, id, {
      ...patch, updatedAt: now(), updatedBy: userName,
    });
    if (patch.title || patch.content || patch.summary) {
      const newVersion: KnowledgeVersion = {
        id: uid(), version: existing.version + 1,
        title: patch.title ?? existing.title,
        content: patch.content ?? existing.content,
        summary: patch.summary ?? existing.summary,
        author: userName ?? existing.author,
        authorId: existing.authorId,
        status: patch.status ?? existing.status,
        attachments: patch.attachments ?? existing.attachments,
        reason: reason ?? "Atualização",
        createdAt: now(),
      };
      updated.versions = [...existing.versions, newVersion];
      updated.version = existing.version + 1;
      await getStorage().update<KnowledgeArticle>(ART_COL, id, {
        versions: updated.versions, version: updated.version,
      });
    }
    if (patch.categoryId && patch.categoryId !== oldCategoryId) {
      await this.incrementCategoryCount(oldCategoryId, -1);
      await this.incrementCategoryCount(patch.categoryId, 1);
    }
    eventBus.publish(EVENT_NAMES.KNOWLEDGE_UPDATED, "entity", "knowledge", {
      id, title: patch.title, type: patch.type,
    }).catch(() => {});
    return updated;
  },

  async remove(id: string): Promise<void> {
    const existing = await this.get(id);
    if (existing) {
      await this.incrementCategoryCount(existing.categoryId, -1);
    }
    await getStorage().delete(ART_COL, id);
    eventBus.publish(EVENT_NAMES.KNOWLEDGE_ARCHIVED, "entity", "knowledge", { id }).catch(() => {});
  },

  async publish(id: string, userName?: string): Promise<KnowledgeArticle> {
    return this.update(id, { status: "published" }, "Publicação", userName);
  },

  async archive(id: string, userName?: string): Promise<KnowledgeArticle> {
    return this.update(id, { status: "archived" }, "Arquivamento", userName);
  },

  async submitForReview(id: string, userName?: string): Promise<KnowledgeArticle> {
    return this.update(id, { status: "review" as KnowledgeStatus }, "Submetido para revisão", userName);
  },

  async approve(id: string, reviewer?: string): Promise<KnowledgeArticle> {
    return this.update(id, { status: "approved" as KnowledgeStatus, reviewer }, "Aprovado", reviewer);
  },

  /* ───── Categories ───── */

  async listCategories(): Promise<KnowledgeCategory[]> {
    const all = await getStorage().findAll<KnowledgeCategory>(CAT_COL);
    return all.sort((a, b) => a.order - b.order);
  },

  async getCategory(id: string): Promise<KnowledgeCategory | null> {
    return getStorage().find<KnowledgeCategory>(CAT_COL, id);
  },

  async createCategory(data: Omit<KnowledgeCategory, "id" | "articleCount" | "createdAt" | "updatedAt">): Promise<KnowledgeCategory> {
    const category: KnowledgeCategory = {
      ...data, id: uid(), articleCount: 0,
      createdAt: now(), updatedAt: now(),
    };
    return getStorage().create<KnowledgeCategory>(CAT_COL, category);
  },

  async updateCategory(id: string, patch: Partial<KnowledgeCategory>): Promise<KnowledgeCategory> {
    return getStorage().update<KnowledgeCategory>(CAT_COL, id, { ...patch, updatedAt: now() });
  },

  async removeCategory(id: string): Promise<void> {
    await getStorage().delete(CAT_COL, id);
  },

  async incrementCategoryCount(categoryId: string, delta: number): Promise<void> {
    const cat = await this.getCategory(categoryId);
    if (cat) {
      await this.updateCategory(categoryId, { articleCount: Math.max(0, (cat.articleCount ?? 0) + delta) });
    }
  },

  /* ───── Collections ───── */

  async listCollections(): Promise<KnowledgeCollection[]> {
    return getStorage().findAll<KnowledgeCollection>(COL_COL);
  },

  async createCollection(data: Omit<KnowledgeCollection, "id" | "createdAt" | "updatedAt">): Promise<KnowledgeCollection> {
    const col: KnowledgeCollection = {
      ...data, id: uid(), createdAt: now(), updatedAt: now(),
    };
    return getStorage().create<KnowledgeCollection>(COL_COL, col);
  },

  async updateCollection(id: string, patch: Partial<KnowledgeCollection>): Promise<KnowledgeCollection> {
    return getStorage().update<KnowledgeCollection>(COL_COL, id, { ...patch, updatedAt: now() });
  },

  async removeCollection(id: string): Promise<void> {
    return getStorage().delete(COL_COL, id);
  },

  /* ───── Comments ───── */

  async addComment(articleId: string, data: Omit<KnowledgeComment, "id" | "createdAt">): Promise<KnowledgeArticle> {
    const article = await this.get(articleId);
    if (!article) throw new Error("Article not found");
    const comment: KnowledgeComment = { ...data, id: uid(), createdAt: now() };
    article.comments = [...(article.comments ?? []), comment];
    return getStorage().update<KnowledgeArticle>(ART_COL, articleId, {
      comments: article.comments, updatedAt: now(),
    });
  },

  /* ───── Relationships ───── */

  async addRelationship(articleId: string, rel: Omit<KnowledgeRelationship, "id" | "articleId" | "createdAt">): Promise<KnowledgeArticle> {
    const article = await this.get(articleId);
    if (!article) throw new Error("Article not found");
    const relationship: KnowledgeRelationship = { ...rel, id: uid(), articleId, createdAt: now() };
    article.relationships = [...(article.relationships ?? []), relationship];
    const updated = await getStorage().update<KnowledgeArticle>(ART_COL, articleId, {
      relationships: article.relationships, updatedAt: now(),
    });
    eventBus.publish(EVENT_NAMES.KNOWLEDGE_LINKED, "entity", "knowledge", {
      id: articleId, targetType: rel.targetType, targetId: rel.targetId,
    }).catch(() => {});
    return updated;
  },

  async removeRelationship(articleId: string, relId: string): Promise<KnowledgeArticle> {
    const article = await this.get(articleId);
    if (!article) throw new Error("Article not found");
    article.relationships = (article.relationships ?? []).filter((r) => r.id !== relId);
    return getStorage().update<KnowledgeArticle>(ART_COL, articleId, {
      relationships: article.relationships, updatedAt: now(),
    });
  },

  /* ───── Search ───── */

  async search(query: string, filters?: {
    type?: KnowledgeContentType; categoryId?: string; brand?: string; model?: string;
    status?: KnowledgeStatus; difficulty?: KnowledgeDifficulty;
  }): Promise<KnowledgeSearchResult[]> {
    const all = await this.list();
    const q = query.toLowerCase().trim();
    let results: KnowledgeSearchResult[] = [];

    for (const article of all) {
      if (filters?.type && article.type !== filters.type) continue;
      if (filters?.categoryId && article.categoryId !== filters.categoryId) continue;
      if (filters?.brand && article.brand !== filters.brand) continue;
      if (filters?.model && article.model !== filters.model) continue;
      if (filters?.status && article.status !== filters.status) continue;
      if (filters?.difficulty && article.difficulty !== filters.difficulty) continue;

      if (!q) {
        results.push({ article, score: 1, highlights: [], matchedKeywords: [] });
        continue;
      }

      let score = 0;
      const highlights: string[] = [];
      const matchedKeywords: string[] = [];

      const fields = [
        { key: "title", val: article.title, weight: 10 },
        { key: "summary", val: article.summary, weight: 5 },
        { key: "content", val: article.content, weight: 3 },
        { key: "keywords", val: article.keywords.join(" "), weight: 8 },
        { key: "tags", val: article.tags.join(" "), weight: 6 },
        { key: "brand", val: article.brand ?? "", weight: 7 },
        { key: "model", val: article.model ?? "", weight: 7 },
        { key: "categoryName", val: article.categoryName, weight: 4 },
      ];

      for (const field of fields) {
        if (field.val.toLowerCase().includes(q)) {
          score += field.weight;
          highlights.push(field.key);
        }
      }

      for (const kw of article.keywords) {
        if (q.includes(kw.toLowerCase()) || kw.toLowerCase().includes(q)) {
          matchedKeywords.push(kw);
          score += 5;
        }
      }

      if (q.includes(article.brand?.toLowerCase() ?? "")) score += 3;
      if (q.includes(article.model?.toLowerCase() ?? "")) score += 3;

      if (score > 0) {
        results.push({ article, score, highlights, matchedKeywords });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  },

  /* ───── Dashboard Stats ───── */

  async getDashboardStats(): Promise<KnowledgeDashboardStats> {
    const all = await this.list();
    const byType = {} as Record<KnowledgeContentType, number>;
    const byStatus: Record<string, number> = {};
    const types: KnowledgeContentType[] = [
      "procedure", "manual", "diagram", "firmware", "driver", "tutorial",
      "solution", "defect", "error_code", "faq", "bulletin", "alert",
      "tool", "technical_note", "internal_doc", "manufacturer_doc",
    ];
    for (const t of types) byType[t] = 0;
    for (const a of all) {
      byType[a.type] = (byType[a.type] ?? 0) + 1;
      byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
    }
    const sorted = [...all].sort((a, b) => (b.analytics?.views ?? 0) - (a.analytics?.views ?? 0));
    return {
      totalArticles: all.length,
      byType,
      byStatus,
      totalCategories: (await this.listCategories()).length,
      totalBrands: new Set(all.filter((a) => a.brand).map((a) => a.brand)).size,
      totalModels: new Set(all.filter((a) => a.model).map((a) => a.model)).size,
      aiGenerated: all.filter((a) => a.aiGenerated).length,
      pendingReview: all.filter((a) => a.status === "review" || a.status === "draft").length,
      archived: all.filter((a) => a.status === "archived").length,
      mostViewed: sorted.slice(0, 10),
      mostUsed: [...all].sort((a, b) => (b.analytics?.timesUsed ?? 0) - (a.analytics?.timesUsed ?? 0)).slice(0, 10),
    };
  },

  /* ───── Analytics ───── */

  async recordView(articleId: string): Promise<void> {
    const article = await this.get(articleId);
    if (!article) return;
    const analytics = article.analytics ?? createAnalytics();
    analytics.views = (analytics.views ?? 0) + 1;
    analytics.updatedAt = now();
    await getStorage().update<KnowledgeArticle>(ART_COL, articleId, { analytics });
  },

  async recordUse(articleId: string): Promise<void> {
    const article = await this.get(articleId);
    if (!article) return;
    const analytics = article.analytics ?? createAnalytics();
    analytics.timesUsed = (analytics.timesUsed ?? 0) + 1;
    analytics.lastUsedAt = now();
    analytics.updatedAt = now();
    await getStorage().update<KnowledgeArticle>(ART_COL, articleId, { analytics });
  },

  async rate(articleId: string, rating: number): Promise<void> {
    const article = await this.get(articleId);
    if (!article) return;
    const analytics = article.analytics ?? createAnalytics();
    analytics.ratings = [...(analytics.ratings ?? []), Math.max(1, Math.min(5, rating))];
    analytics.avgRating = analytics.ratings.reduce((s, r) => s + r, 0) / analytics.ratings.length;
    analytics.updatedAt = now();
    await getStorage().update<KnowledgeArticle>(ART_COL, articleId, { analytics });
  },

  /* ───── AI Integration ───── */

  async generateSummary(content: string): Promise<string> {
    const lines = content.split("\n").filter(Boolean);
    const summary = lines.slice(0, Math.min(3, lines.length)).join(" ").substring(0, 300);
    return summary || "Resumo gerado automaticamente.";
  },

  async extractKeywords(content: string): Promise<string[]> {
    const words = content.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    const freq: Record<string, number> = {};
    const stopWords = ["para", "como", "com", "uma", "que", "dos", "das", "aqui", "este", "esta", "isso", "aquele", "entre", "sobre", "após", "antes", "durante", "mediante", "sem", "sob", "conforme"];
    for (const w of words) {
      if (!stopWords.includes(w)) freq[w] = (freq[w] ?? 0) + 1;
    }
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w]) => w);
  },

  /* ───── Relationships by Entity ───── */

  async findByEntity(targetType: string, targetId: string): Promise<KnowledgeArticle[]> {
    const all = await this.list();
    return all.filter((a) =>
      (a.relationships ?? []).some((r) => r.targetType === targetType && r.targetId === targetId),
    );
  },

  async findRelatedBySO(soId: string, brand?: string, model?: string, defect?: string): Promise<KnowledgeSearchResult[]> {
    let results: KnowledgeSearchResult[] = [];
    const all = await this.list();
    const published = all.filter((a) => a.status === "published");

    for (const article of published) {
      let score = 0;
      const highlights: string[] = [];
      if (brand && article.brand?.toLowerCase() === brand.toLowerCase()) { score += 15; highlights.push("Marca correspondente"); }
      if (model && article.model?.toLowerCase() === model.toLowerCase()) { score += 20; highlights.push("Modelo correspondente"); }
      if (defect) {
        const d = defect.toLowerCase();
        if (article.title.toLowerCase().includes(d)) score += 10;
        if (article.summary.toLowerCase().includes(d)) score += 5;
        if (article.content.toLowerCase().includes(d)) score += 3;
        if (article.keywords.some((k) => k.toLowerCase().includes(d))) score += 8;
        if (article.tags.some((t) => t.toLowerCase().includes(d))) score += 6;
        if (score > 0) highlights.push("Defeito relacionado");
      }
      if (score > 0) {
        results.push({ article, score, highlights, matchedKeywords: [] });
      }
    }
    return results.sort((a, b) => b.score - a.score).slice(0, 20);
  },

  /* ───── Import ───── */

  async importArticle(data: {
    title: string; content: string; type: KnowledgeContentType; categoryId: string; categoryName: string;
    author: string; summary?: string; brand?: string; model?: string; keywords?: string[];
  }, userName?: string): Promise<KnowledgeArticle> {
    const article = await this.create({
      type: data.type, title: data.title, summary: data.summary ?? "",
      content: data.content, categoryId: data.categoryId, categoryName: data.categoryName,
      language: "pt-BR", author: data.author, authorId: userName,
      status: "draft" as KnowledgeStatus, difficulty: "intermediate" as KnowledgeDifficulty,
      keywords: data.keywords ?? [], tags: [], attachments: [],
      relationships: [], comments: [],
      manufacturer: data.brand, brand: data.brand, model: data.model,
      equipmentTypeId: undefined, equipmentTypeName: undefined,
      subcategory: undefined, aiGenerated: false, reviewer: undefined, reviewerId: undefined,
      tools: [], parts: [], prerequisites: [], checklist: [], steps: [], images: [], videos: [],
      aiSummary: undefined, aiKeywords: undefined, estimatedTime: undefined,
    }, userName);
    eventBus.publish(EVENT_NAMES.KNOWLEDGE_IMPORTED, "entity", "knowledge", {
      id: article.id, title: article.title, type: data.type,
    }).catch(() => {});
    return article;
  },
};
