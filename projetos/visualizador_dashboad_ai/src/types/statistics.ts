import { AnalysisMode, QuestionMapping, QuestionType, SurveyQuestion } from './survey';

export interface CategoryFrequency {
  value: string; // normalizedValue for grouping
  label: string; // displayValue for presentation
  count: number;
  percentage: number; // Exact mathematically consistent float percentage
  formattedPercentage?: string;
  order?: number;
}

export interface InvalidResponseRecord {
  value: any;
  reason: string;
}

export interface StatisticsDiagnostics {
  warnings: string[];
  errors: string[];
  unmatchedValues: string[];
  invalidResponses: InvalidResponseRecord[];
  duplicatedCategoriesMerged: Array<{
    canonical: string;
    variants: string[];
    count: number;
  }>;
  normalizationApplied: boolean;
}

export interface QuantitativeStats {
  totalAnswers: number;
  validResponses: number;
  emptyResponses: number;
  invalidResponses: InvalidResponseRecord[];
  responseRate: number; // percentage of total survey respondents who answered (0 - 100)
  frequencies: CategoryFrequency[];
  mode?: string; // most frequent value
  totalOptionsSelected?: number; // for checkboxes
  isMultipleSelection?: boolean; // true for checkbox
  diagnostics?: StatisticsDiagnostics;
}

export interface ScaleDistributionItem {
  score: number;
  count: number;
  percentage: number;
  label?: string;
}

export interface ScaleStats {
  totalAnswers: number;
  validResponses: number;
  emptyResponses: number;
  invalidResponses: InvalidResponseRecord[];
  responseRate: number;
  average: number;
  median: number;
  min: number;
  max: number;
  distribution: ScaleDistributionItem[];
  diagnostics?: StatisticsDiagnostics;
}

export interface DateDistributionItem {
  date: string; // ISO date string YYYY-MM-DD
  label: string;
  count: number;
  percentage: number;
}

export interface DateStats {
  totalAnswers: number;
  validResponses: number;
  emptyResponses: number;
  invalidResponses: InvalidResponseRecord[];
  responseRate: number;
  minDate?: string;
  maxDate?: string;
  frequencies: DateDistributionItem[];
  diagnostics?: StatisticsDiagnostics;
}

export interface TimeDistributionItem {
  time: string; // HH:mm format
  label: string;
  count: number;
  percentage: number;
}

export interface TimeStats {
  totalAnswers: number;
  validResponses: number;
  emptyResponses: number;
  invalidResponses: InvalidResponseRecord[];
  responseRate: number;
  minTime?: string;
  maxTime?: string;
  frequencies: TimeDistributionItem[];
  diagnostics?: StatisticsDiagnostics;
}

export interface QualitativeStats {
  totalAnswers: number;
  validResponses: number;
  emptyResponses: number;
  invalidResponses: InvalidResponseRecord[];
  responseRate: number;
  sampleResponses: string[];
  averageWordCount: number;
  status: 'pending_ai' | 'ready';
  diagnostics?: StatisticsDiagnostics;
}

export type QuestionComputedStats =
  | { kind: 'categorical'; stats: QuantitativeStats }
  | { kind: 'scale'; stats: ScaleStats }
  | { kind: 'date'; stats: DateStats }
  | { kind: 'time'; stats: TimeStats }
  | { kind: 'qualitative'; stats: QualitativeStats }
  | { kind: 'empty'; stats: { totalAnswers: 0; responseRate: 0; validResponses: 0; emptyResponses: number } };

export interface QuestionStatistics {
  questionId: string;
  type: QuestionType;
  analysisMode: AnalysisMode;
  totalResponses: number; // total survey respondents
  validResponses: number;
  emptyResponses: number;
  invalidResponses: InvalidResponseRecord[];
  computedStats: QuestionComputedStats;
  diagnostics: StatisticsDiagnostics;
}

export interface ProcessedQuestionData {
  question: SurveyQuestion;
  mapping: QuestionMapping;
  stats: QuestionComputedStats;
  diagnostics?: StatisticsDiagnostics;
}

export interface SurveyStatistics {
  totalRespondents: number;
  totalQuestions: number;
  quantitativeQuestions: number;
  qualitativeQuestions: number;
  completionRate: number;
  validResponses: number;
  emptyResponses: number;
  invalidResponses: number;
  lastUpdated: string;
  decimalPlaces?: number;
}

export interface ProcessedSurveyOverview extends SurveyStatistics {}

export interface ProcessedSurveyData {
  surveyId: string;
  surveyName: string;
  overview: ProcessedSurveyOverview;
  questions: ProcessedQuestionData[];
  decimalPlaces?: number;
}

