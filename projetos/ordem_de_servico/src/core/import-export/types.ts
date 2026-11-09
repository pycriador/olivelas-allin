export type ExportFormat = "csv" | "xlsx" | "pdf" | "json";
export type ImportFormat = "csv" | "xlsx" | "json";

export interface ExportConfig {
  module: string;
  format: ExportFormat;
  fields: string[];
  filters?: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  includeHeaders: boolean;
}

export interface ImportConfig {
  module: string;
  format: ImportFormat;
  mapping: Record<string, string>;
  skipDuplicates: boolean;
  updateExisting: boolean;
}

export interface ImportResult {
  totalRows: number;
  imported: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}
