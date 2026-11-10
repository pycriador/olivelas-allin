/**
 * AI Qualitative and Synthesis Types
 * Strictly decouples AI interpretations from deterministic stats.
 */

export interface QualitativeTheme {
  name: string;
  description: string;
  count: number;
  percentage: number;
}

export interface QualitativeInsight {
  title: string;
  description: string;
  evidence?: string;
}

export interface RepresentativeResponse {
  text: string;
  reason: string;
}

export interface QualitativeAnalysis {
  questionId: string;
  summary: string;
  themes: QualitativeTheme[];
  insights: QualitativeInsight[];
  opportunities: string[];
  concerns: string[];
  representativeResponses: RepresentativeResponse[];
  engine?: string;
}

export interface OverallAnalysis {
  surveyId?: string;
  executiveSummary: string;
  keyFindings: string[];
  mainOpportunities: string[];
  mainRisks: string[];
  automationOpportunities: string[];
  futureImpact: string[];
  generatedAt?: string;
  engine?: string;
}

export type AnalysisStatus = 'idle' | 'analyzing' | 'completed' | 'error';

export interface QuestionAnalysisState {
  questionId: string;
  status: AnalysisStatus;
  data?: QualitativeAnalysis;
  error?: string;
  lastAnalyzedAt?: string;
}
