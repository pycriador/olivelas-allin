import { QualitativeAnalysis, OverallAnalysis } from '../../types/ai';

export interface QualitativeRequestPayload {
  questionId: string;
  questionTitle: string;
  questionDescription?: string;
  surveyTitle?: string;
  surveyDescription?: string;
  responses: string[];
  totalRespondents: number;
}

export interface OverallRequestPayload {
  surveyTitle: string;
  surveyDescription?: string;
  questionsSummary: Array<{
    title: string;
    type: string;
    mode: string;
    summaryOrDistribution: string;
  }>;
}

/**
 * Deterministic fingerprint for caching qualitative queries
 */
function createAnalysisCacheKey(payload: QualitativeRequestPayload): string {
  const promptVersion = 'v1_gemini37';
  const responsesSample = payload.responses.join('||');
  // Simple fast string hash
  let hash = 0;
  for (let i = 0; i < responsesSample.length; i++) {
    const char = responsesSample.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `ai_qualitative_${payload.questionId}_${payload.responses.length}_${hash}_${promptVersion}`;
}

export class GeminiClientService {
  // In-memory cache to prevent unnecessary repeat calls
  private static cache: Map<string, QualitativeAnalysis> = new Map();

  /**
   * Request qualitative analysis for open-ended text answers from the server endpoint
   */
  public static async analyzeQualitativeQuestion(
    payload: QualitativeRequestPayload,
    bypassCache = false
  ): Promise<QualitativeAnalysis> {
    const cacheKey = createAnalysisCacheKey(payload);

    if (!bypassCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const response = await fetch('/api/ai/qualitative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: payload.questionId,
          questionTitle: payload.questionTitle,
          questionDescription: payload.questionDescription,
          surveyTitle: payload.surveyTitle,
          surveyDescription: payload.surveyDescription,
          responses: payload.responses,
          totalRespondents: payload.totalRespondents,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Falha ao processar análise qualitativa.');
      }

      const result: QualitativeAnalysis = data.data;
      this.cache.set(cacheKey, result);
      return result;
    } catch (err: any) {
      console.error('[GeminiClientService Error]', err.message);
      throw err;
    }
  }

  /**
   * Request overall executive survey synthesis (Prepared for Requirement 17)
   */
  public static async analyzeOverallSurvey(
    payload: OverallRequestPayload
  ): Promise<OverallAnalysis> {
    try {
      const response = await fetch('/api/ai/overall', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Falha ao gerar síntese executiva geral.');
      }

      return data.data;
    } catch (err: any) {
      console.error('[GeminiClientService Overall Error]', err.message);
      throw err;
    }
  }

  /**
   * Clears the in-memory analysis cache (e.g., when dataset or mappings change)
   */
  public static clearCache(): void {
    this.cache.clear();
  }
}
