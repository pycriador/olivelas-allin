import {
  QuestionMapping,
  QuestionType,
  SurveyQuestion,
} from '../../types/survey';
import { DataProfiler } from './dataProfiler';
import { SurveyStatisticsEngine } from './statistics';

export { DataProfiler } from './dataProfiler';
export type { ColumnProfile, DataProfilerResult, ConfidenceLevel } from './dataProfiler';

/**
 * Backward compatibility wrapper for SurveyProfilerService
 */
export class SurveyProfilerService {
  public static profileSurveyMappings(
    questions: SurveyQuestion[]
  ): Record<string, QuestionMapping> {
    const mappings: Record<string, QuestionMapping> = {};
    for (const q of questions) {
      mappings[q.id] = SurveyStatisticsEngine.generateDefaultMapping(q);
    }
    return mappings;
  }

  public static inferQuestionTypeFromValues(
    values: (string | number | boolean | null)[]
  ): { type: QuestionType; confidence: number } {
    const profile = DataProfiler.profileColumn('sample', 0, values, values.length);
    return {
      type: profile.apparentType,
      confidence: profile.confidence,
    };
  }
}
