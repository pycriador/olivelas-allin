export type KnowledgeContentType =
  | "procedure" | "manual" | "diagram" | "firmware" | "driver"
  | "tutorial" | "solution" | "defect" | "error_code" | "faq"
  | "bulletin" | "alert" | "tool" | "technical_note" | "internal_doc"
  | "manufacturer_doc";

export type KnowledgeStatus = "draft" | "review" | "approved" | "published" | "obsolete" | "archived";

export type KnowledgeDifficulty = "beginner" | "intermediate" | "advanced" | "expert";

export interface KnowledgeAttachment {
  id: string;
  name: string;
  type: "pdf" | "image" | "video" | "audio" | "document" | "firmware" | "driver" | "archive";
  fileUrl?: string;
  size?: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface KnowledgeVersion {
  id: string;
  version: number;
  title: string;
  content: string;
  summary: string;
  author: string;
  authorId?: string;
  reviewer?: string;
  reviewerId?: string;
  reason: string;
  status: KnowledgeStatus;
  attachments: KnowledgeAttachment[];
  createdAt: string;
}

export interface KnowledgeRelationship {
  id: string;
  articleId: string;
  targetType: "equipment_type" | "brand" | "model" | "part" | "defect" | "service_order" | "diagnostic" | "warranty" | "return" | "category" | "manufacturer" | "article";
  targetId: string;
  targetName: string;
  createdAt: string;
}

export interface KnowledgeComment {
  id: string;
  author: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface KnowledgeAnalyticsData {
  id: string;
  articleId: string;
  views: number;
  uniqueViews: number;
  downloads: number;
  ratings: number[];
  avgRating: number;
  timesUsed: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeArticle {
  id: string;
  companyId?: string;
  type: KnowledgeContentType;
  title: string;
  summary: string;
  content: string;
  categoryId: string;
  categoryName: string;
  subcategory?: string;
  manufacturer?: string;
  brand?: string;
  model?: string;
  equipmentTypeId?: string;
  equipmentTypeName?: string;
  language: string;
  version: number;
  author: string;
  authorId?: string;
  reviewer?: string;
  reviewerId?: string;
  status: KnowledgeStatus;
  difficulty: KnowledgeDifficulty;
  keywords: string[];
  tags: string[];
  attachments: KnowledgeAttachment[];
  versions: KnowledgeVersion[];
  relationships: KnowledgeRelationship[];
  comments: KnowledgeComment[];
  analytics: KnowledgeAnalyticsData;
  estimatedTime?: number;
  tools?: string[];
  parts?: string[];
  prerequisites?: string[];
  checklist?: string[];
  steps?: string[];
  images?: string[];
  videos?: string[];
  aiGenerated: boolean;
  aiSummary?: string;
  aiKeywords?: string[];
  pinned: boolean;
  favorites: number;
  views: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface KnowledgeCategory {
  id: string;
  companyId?: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  parentId?: string;
  parentName?: string;
  order: number;
  active: boolean;
  articleCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeCollection {
  id: string;
  companyId?: string;
  name: string;
  description: string;
  articleIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeSearchResult {
  article: KnowledgeArticle;
  score: number;
  highlights: string[];
  matchedKeywords: string[];
}

export interface KnowledgeDashboardStats {
  totalArticles: number;
  byType: Record<KnowledgeContentType, number>;
  byStatus: Record<string, number>;
  totalCategories: number;
  totalBrands: number;
  totalModels: number;
  aiGenerated: number;
  pendingReview: number;
  archived: number;
  mostViewed: KnowledgeArticle[];
  mostUsed: KnowledgeArticle[];
}
