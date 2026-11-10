import { z } from 'zod';

export const QualitativeThemeSchema = z.object({
  name: z.string().min(1, 'Nome do tema é obrigatório'),
  description: z.string().default(''),
  count: z.number().nonnegative().default(0),
  percentage: z.number().min(0).max(100).default(0),
});

export const QualitativeInsightSchema = z.object({
  title: z.string().min(1, 'Título do insight é obrigatório'),
  description: z.string().default(''),
  evidence: z.string().optional().default(''),
});

export const RepresentativeResponseSchema = z.object({
  text: z.string().min(1, 'Texto da resposta é obrigatório'),
  reason: z.string().default(''),
});

export const QualitativeAnalysisSchema = z.object({
  questionId: z.string().min(1),
  summary: z.string().min(1, 'Resumo é obrigatório'),
  themes: z.array(QualitativeThemeSchema).default([]),
  insights: z.array(QualitativeInsightSchema).default([]),
  opportunities: z.array(z.string()).default([]),
  concerns: z.array(z.string()).default([]),
  representativeResponses: z.array(RepresentativeResponseSchema).default([]),
  engine: z.string().optional(),
});

export const OverallAnalysisSchema = z.object({
  surveyId: z.string().optional(),
  executiveSummary: z.string().min(1, 'Resumo executivo é obrigatório'),
  keyFindings: z.array(z.string()).default([]),
  mainOpportunities: z.array(z.string()).default([]),
  mainRisks: z.array(z.string()).default([]),
  automationOpportunities: z.array(z.string()).default([]),
  futureImpact: z.array(z.string()).default([]),
  generatedAt: z.string().optional(),
  engine: z.string().optional(),
});

export type QualitativeAnalysisType = z.infer<typeof QualitativeAnalysisSchema>;
export type OverallAnalysisType = z.infer<typeof OverallAnalysisSchema>;
