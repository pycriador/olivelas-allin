import { useState, useCallback, useEffect, useRef } from 'react';
import { Survey } from '../types/survey';
import { ProcessedSurveyData } from '../types/statistics';
import { QuestionAnalysisState, QualitativeAnalysis } from '../types/ai';
import { GeminiClientService } from '../services/ai/gemini';

const STORAGE_CACHE_PREFIX = 'ai_survey_qualitative_cache_';

export function useQualitativeAnalysis(
  survey: Survey | null,
  processedData: ProcessedSurveyData | null
) {
  const [analysisMap, setAnalysisMap] = useState<Record<string, QuestionAnalysisState>>(() => {
    if (typeof window !== 'undefined' && survey?.id) {
      try {
        const cached = localStorage.getItem(STORAGE_CACHE_PREFIX + survey.id);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (e) {
        console.warn('Could not load cached qualitative analysis:', e);
      }
    }
    return {};
  });

  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const prevSurveyIdRef = useRef<string | null>(survey?.id || null);
  const hasAutoAnalyzedRef = useRef<string | null>(null);

  // Load cache when survey changes
  useEffect(() => {
    if (survey?.id && survey.id !== prevSurveyIdRef.current) {
      prevSurveyIdRef.current = survey.id;
      hasAutoAnalyzedRef.current = null;
      let loadedCache: Record<string, QuestionAnalysisState> = {};
      try {
        const cached = localStorage.getItem(STORAGE_CACHE_PREFIX + survey.id);
        if (cached) {
          loadedCache = JSON.parse(cached);
        }
      } catch (e) {
        console.warn('Could not read cached analysis:', e);
      }
      setAnalysisMap(loadedCache);
    }
  }, [survey?.id]);

  // Persist analysisMap to localStorage whenever it changes with completed items
  useEffect(() => {
    if (survey?.id && Object.keys(analysisMap).length > 0) {
      try {
        localStorage.setItem(
          STORAGE_CACHE_PREFIX + survey.id,
          JSON.stringify(analysisMap)
        );
      } catch (e) {
        console.warn('Could not save qualitative analysis to localStorage:', e);
      }
    }
  }, [analysisMap, survey?.id]);

  /**
   * Analyze a single qualitative question
   */
  const analyzeQuestion = useCallback(
    async (questionId: string, bypassCache = false): Promise<QualitativeAnalysis | null> => {
      if (!survey || !processedData) return null;

      const questionData = processedData.questions.find((q) => q.question.id === questionId);
      if (!questionData) return null;

      const { question } = questionData;

      // Extract textual answers
      const responses: string[] = survey.responses
        .map((r) => r.answers[questionId])
        .filter((val) => val !== undefined && val !== null && val !== '')
        .map((val) => (typeof val === 'string' ? val.trim() : String(val).trim()))
        .filter((val) => val.length > 0);

      if (responses.length === 0) {
        const emptyResult: QualitativeAnalysis = {
          questionId,
          summary: 'Nenhuma resposta em texto registrada para esta pergunta.',
          themes: [],
          insights: [],
          opportunities: [],
          concerns: [],
          representativeResponses: [],
        };
        setAnalysisMap((prev) => ({
          ...prev,
          [questionId]: {
            questionId,
            status: 'completed',
            data: emptyResult,
            lastAnalyzedAt: new Date().toISOString(),
          },
        }));
        return emptyResult;
      }

      // Set analyzing state
      setAnalysisMap((prev) => ({
        ...prev,
        [questionId]: {
          questionId,
          status: 'analyzing',
          data: prev[questionId]?.data, // retain previous data if re-analyzing
          error: undefined,
        },
      }));

      try {
        const result = await GeminiClientService.analyzeQualitativeQuestion(
          {
            questionId,
            questionTitle: question.title,
            questionDescription: question.description,
            surveyTitle: survey.name,
            surveyDescription: survey.description,
            responses,
            totalRespondents: survey.responses.length,
          },
          bypassCache
        );

        setAnalysisMap((prev) => {
          const updated = {
            ...prev,
            [questionId]: {
              questionId,
              status: 'completed' as const,
              data: result,
              lastAnalyzedAt: new Date().toISOString(),
            },
          };
          if (survey.id) {
            try {
              localStorage.setItem(STORAGE_CACHE_PREFIX + survey.id, JSON.stringify(updated));
            } catch {}
          }
          return updated;
        });

        return result;
      } catch (err: any) {
        console.error(`[Qualitative Analysis Error for ${questionId}]`, err);
        setAnalysisMap((prev) => ({
          ...prev,
          [questionId]: {
            questionId,
            status: 'error',
            error: err.message || 'Falha ao analisar respostas com IA.',
          },
        }));
        return null;
      }
    },
    [survey, processedData]
  );

  /**
   * Analyze all qualitative questions in the survey
   */
  const analyzeAllQualitative = useCallback(
    async (bypassCache = false) => {
      if (!survey || !processedData) return;

      const qualitativeQuestions = processedData.questions.filter(
        (q) => q.mapping.analysisMode === 'qualitative' || q.question.type === 'paragraph'
      );

      if (qualitativeQuestions.length === 0) return;

      setIsAnalyzingAll(true);

      try {
        await Promise.all(
          qualitativeQuestions.map((q) => analyzeQuestion(q.question.id, bypassCache))
        );
      } finally {
        setIsAnalyzingAll(false);
      }
    },
    [survey, processedData, analyzeQuestion]
  );

  // Auto-run AI qualitative analyses on initial load if not already completed
  useEffect(() => {
    if (!survey || !processedData) return;

    const qualitativeQuestions = processedData.questions.filter(
      (q) => q.mapping.analysisMode === 'qualitative' || q.question.type === 'paragraph'
    );

    if (qualitativeQuestions.length === 0) return;

    const surveyKey = `${survey.id}_${qualitativeQuestions.length}`;
    if (hasAutoAnalyzedRef.current === surveyKey) return;

    const unanalyzed = qualitativeQuestions.filter(
      (q) => analysisMap[q.question.id]?.status !== 'completed'
    );

    if (unanalyzed.length > 0) {
      hasAutoAnalyzedRef.current = surveyKey;
      analyzeAllQualitative(false).catch((err) => {
        console.warn('Auto AI analysis error:', err);
      });
    } else {
      hasAutoAnalyzedRef.current = surveyKey;
    }
  }, [survey, processedData, analysisMap, analyzeAllQualitative]);

  return {
    analysisMap,
    isAnalyzingAll,
    analyzeQuestion,
    analyzeAllQualitative,
  };
}
