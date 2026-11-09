export interface SavedView {
  id: string;
  name: string;
  module: string;
  filters: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  isDefault: boolean;
  createdAt: string;
  userId?: string;
}

export interface FavoriteRecord {
  id: string;
  entityType: string;
  entityId: string;
  entityName: string;
  module: string;
  createdAt: string;
  userId?: string;
}

export interface SearchFilter {
  field: string;
  operator: "equals" | "contains" | "startsWith" | "endsWith" | "gt" | "gte" | "lt" | "lte" | "between" | "in" | "notIn";
  value: unknown;
}

export interface SearchResult {
  entityType: string;
  entityId: string;
  entityName: string;
  module: string;
  description?: string;
  score: number;
}

export interface AdvancedSearch {
  query: string;
  filters: SearchFilter[];
  module?: string;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
