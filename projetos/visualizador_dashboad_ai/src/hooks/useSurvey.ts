import { useMemo, useState } from 'react';
import { SurveyStatisticsEngine } from '../services/data/statistics';
import { ProcessedSurveyData } from '../types/statistics';
import { QuestionMapping, Survey } from '../types/survey';

export function useSurvey() {
  // Start with empty/blank survey workspace by default
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'mapping' | 'source' | 'responses' | 'settings'>('dashboard');

  // Process data strictly through the service layer
  const processedData: ProcessedSurveyData | null = useMemo(() => {
    if (!survey) return null;
    return SurveyStatisticsEngine.processSurvey(survey);
  }, [survey]);

  // Update a question mapping
  const updateQuestionMapping = (questionId: string, updates: Partial<QuestionMapping>) => {
    if (!survey) return;
    setSurvey((prev) => {
      if (!prev) return null;
      const currentMapping = prev.mappings[questionId] || SurveyStatisticsEngine.generateDefaultMapping(
        prev.questions.find((q) => q.id === questionId)!
      );
      return {
        ...prev,
        mappings: {
          ...prev.mappings,
          [questionId]: {
            ...currentMapping,
            ...updates,
            source: 'user', // Marked as edited by user
          },
        },
      };
    });
  };

  const setDecimalPlaces = (decimals: number) => {
    const validDecimals = Math.max(0, Math.min(2, decimals));
    setSurvey((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        decimalPlaces: validDecimals,
      };
    });
  };

  const loadSurvey = (newSurvey: Survey | null) => {
    setSurvey(newSurvey);
    setSelectedQuestionId(null);
    if (newSurvey) {
      setActiveTab('dashboard');
    }
  };

  const refreshSurvey = () => {
    if (!survey) return;
    setSurvey((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        analyzedAt: new Date().toISOString(),
      };
    });
  };

  const clearSurvey = () => {
    setSurvey(null);
    setSelectedQuestionId(null);
  };

  return {
    survey,
    processedData,
    activeTab,
    setActiveTab,
    isSourceModalOpen,
    setIsSourceModalOpen,
    selectedQuestionId,
    setSelectedQuestionId,
    updateQuestionMapping,
    setDecimalPlaces,
    loadSurvey,
    refreshSurvey,
    clearSurvey,
  };
}
