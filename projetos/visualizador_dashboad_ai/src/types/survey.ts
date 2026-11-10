/**
 * Core domain types for AI Survey Analyzer
 * Prepared for multi-source ingestion (Forms, Sheets, XLSX, CSV, URL, mock)
 */

export type QuestionType =
  | 'multiple_choice'
  | 'checkbox'
  | 'linear_scale'
  | 'short_answer'
  | 'paragraph'
  | 'dropdown'
  | 'date'
  | 'time'
  | 'number'
  | 'unknown';

export type DataSourceType =
  | 'google_forms'
  | 'google_sheets'
  | 'xlsx'
  | 'csv'
  | 'url'
  | 'mock';

export type AnalysisMode =
  | 'quantitative'
  | 'qualitative'
  | 'mixed'
  | 'ignore';

export type VisualizationType =
  | 'auto'
  | 'bar'
  | 'horizontal_bar'
  | 'pie'
  | 'donut'
  | 'distribution'
  | 'table'
  | 'line'
  | 'radar'
  | 'none';

export type LegendDisplayFormat = 'count' | 'percentage' | 'both';
export type DecimalSeparator = ',' | '.';
export type AnalysisLocale = 'pt-BR' | 'en-US';

export interface AnalysisDisplaySettings {
  decimalPlaces: number; // 0, 1, 2, 3, 4 (default 2)
  legendFormat: LegendDisplayFormat; // 'count' | 'percentage' | 'both'
  decimalSeparator: DecimalSeparator; // ',' or '.'
  locale: AnalysisLocale; // 'pt-BR' or 'en-US'
  defaultVisualization: VisualizationType;
  showLegend: boolean;
  showValues: boolean;
  showPercentage: boolean;
  showGrid: boolean;
  showAnimation: boolean;
}

export type MappingSource =
  | 'metadata'
  | 'inferred'
  | 'user';

export interface QuestionOption {
  value: string;
  label: string;
  order: number;
}

export interface LinearScaleConfig {
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
  step?: number;
}

export interface SurveyQuestion {
  id: string;
  title: string;
  description?: string;
  type: QuestionType;
  required: boolean;
  options?: QuestionOption[];
  scaleConfig?: LinearScaleConfig;
  order: number;
}

export interface QuestionAnswerValue {
  /** Strongly-typed raw value (string for single choice/text, string[] for checkbox, number for scale, etc.) */
  raw: string | string[] | number | boolean | null;
  /** Normalized representation for categorical aggregation */
  normalized?: string | string[];
}

export interface QuestionAnswer {
  questionId: string;
  value: string | string[] | number | boolean | null;
}

export interface SurveyResponse {
  id: string;
  submittedAt?: string;
  respondentId?: string;
  answers: Record<string, QuestionAnswer['value']>;
}

export interface DataSource {
  type: DataSourceType;
  id: string;
  name: string;
  url?: string;
  mimeType?: string;
  lastModified?: string;
  rowCount?: number;
}

export interface QuestionMapping {
  questionId: string;
  questionType: QuestionType;
  analysisMode: AnalysisMode;
  visualization: VisualizationType;
  options?: QuestionOption[];
  confidence: number; // 0.0 to 1.0
  source: MappingSource;
  notes?: string;
  decimalPlaces?: number; // 0, 1, or 2 decimal places (max 2)
}

export interface Survey {
  id: string;
  name: string;
  title?: string;
  description?: string;
  source: DataSource;
  createdAt: string;
  analyzedAt?: string;
  questions: SurveyQuestion[];
  mappings: Record<string, QuestionMapping>;
  responses: SurveyResponse[];
  decimalPlaces?: number; // Configurable decimal places (0-4)
  displaySettings?: AnalysisDisplaySettings;
}
