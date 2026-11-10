import {
  CategoryFrequency,
  DateDistributionItem,
  DateStats,
  InvalidResponseRecord,
  ProcessedQuestionData,
  ProcessedSurveyData,
  ProcessedSurveyOverview,
  QualitativeStats,
  QuantitativeStats,
  QuestionComputedStats,
  QuestionStatistics,
  ScaleDistributionItem,
  ScaleStats,
  StatisticsDiagnostics,
  TimeDistributionItem,
  TimeStats,
} from '../../types/statistics';
import {
  QuestionMapping,
  Survey,
  SurveyQuestion,
  SurveyResponse,
} from '../../types/survey';
import {
  isEmptyValue,
  matchOptionLabel,
  normalizeCategory,
  parseDateValue,
  parseNumericValue,
  parseTimeValue,
  splitCheckboxAnswer,
} from '../../utils/normalization';

/**
 * Pure, Deterministic Statistics Engine.
 * Single source of truth for all quantitative calculations.
 *
 * Rules:
 * 1. Raw Response -> normalizeValue() -> QuestionMapping -> Statistics Engine -> StatisticsResult.
 * 2. Never calculate stats directly on raw unnormalized values.
 * 3. Never round during internal calculations (round only on presentation).
 * 4. Zero reliance on AI/Gemini for quantitative metrics.
 */
export class SurveyStatisticsEngine {
  /**
   * Process a complete survey into calculated metrics and chart-ready aggregates
   */
  public static processSurvey(survey: Survey, overrideDecimalPlaces?: number): ProcessedSurveyData {
    const totalRespondents = survey.responses.length;
    const questionsProcessed: ProcessedQuestionData[] = [];
    const decimalPlaces = Math.max(0, Math.min(2, overrideDecimalPlaces ?? survey.decimalPlaces ?? 2));

    let quantitativeCount = 0;
    let qualitativeCount = 0;
    let totalValidResponses = 0;
    let totalEmptyResponses = 0;
    let totalInvalidResponses = 0;
    let totalSlots = totalRespondents * survey.questions.length;

    for (const question of survey.questions) {
      const mapping =
        survey.mappings[question.id] ||
        this.generateDefaultMapping(question);

      const qStats = this.computeQuestionStatistics(
        question,
        mapping,
        survey.responses
      );

      if (mapping.analysisMode === 'qualitative') {
        qualitativeCount++;
      } else if (mapping.analysisMode === 'quantitative') {
        quantitativeCount++;
      }

      totalValidResponses += qStats.validResponses;
      totalEmptyResponses += qStats.emptyResponses;
      totalInvalidResponses += qStats.invalidResponses.length;

      questionsProcessed.push({
        question,
        mapping,
        stats: qStats.computedStats,
        diagnostics: qStats.diagnostics,
      });
    }

    const completionRate =
      totalSlots > 0 ? (totalValidResponses / totalSlots) * 100 : 0;

    const overview: ProcessedSurveyOverview = {
      totalRespondents,
      totalQuestions: survey.questions.length,
      quantitativeQuestions: quantitativeCount,
      qualitativeQuestions: qualitativeCount,
      completionRate: Number(completionRate.toFixed(decimalPlaces)),
      validResponses: totalValidResponses,
      emptyResponses: totalEmptyResponses,
      invalidResponses: totalInvalidResponses,
      lastUpdated: survey.analyzedAt || survey.createdAt,
      decimalPlaces,
    };

    return {
      surveyId: survey.id,
      surveyName: survey.name,
      overview,
      questions: questionsProcessed,
      decimalPlaces,
    };
  }

  /**
   * Computes complete, audited question statistics with diagnostics
   */
  public static computeQuestionStatistics(
    question: SurveyQuestion,
    mapping: QuestionMapping,
    responses: SurveyResponse[]
  ): QuestionStatistics {
    const totalResponses = responses.length;

    if (totalResponses === 0) {
      const emptyDiagnostics: StatisticsDiagnostics = {
        warnings: ['Survey contains 0 respondent records.'],
        errors: [],
        unmatchedValues: [],
        invalidResponses: [],
        duplicatedCategoriesMerged: [],
        normalizationApplied: false,
      };

      return {
        questionId: question.id,
        type: question.type,
        analysisMode: mapping.analysisMode,
        totalResponses: 0,
        validResponses: 0,
        emptyResponses: 0,
        invalidResponses: [],
        computedStats: {
          kind: 'empty',
          stats: { totalAnswers: 0, responseRate: 0, validResponses: 0, emptyResponses: 0 },
        },
        diagnostics: emptyDiagnostics,
      };
    }

    // Qualitative questions (Paragraph / Free Text / Qualitative analysisMode)
    if (
      mapping.analysisMode === 'qualitative' ||
      question.type === 'paragraph'
    ) {
      return this.computeQualitativeStats(question, mapping, responses);
    }

    // Linear scale questions
    if (
      question.type === 'linear_scale' ||
      (mapping.visualization === 'distribution' && question.type === 'number')
    ) {
      return this.computeScaleStats(question, mapping, responses);
    }

    // Number questions
    if (question.type === 'number') {
      return this.computeScaleStats(question, mapping, responses);
    }

    // Date questions
    if (question.type === 'date') {
      return this.computeDateStats(question, mapping, responses);
    }

    // Time questions
    if (question.type === 'time') {
      return this.computeTimeStats(question, mapping, responses);
    }

    // Checkbox questions (multi-select)
    if (question.type === 'checkbox') {
      return this.computeCheckboxStats(question, mapping, responses);
    }

    // Default: Categorical (multiple_choice, dropdown, etc.)
    return this.computeMultipleChoiceStats(question, mapping, responses);
  }

  /**
   * Backwards-compatible adapter for computeQuestionStats
   */
  public static computeQuestionStats(
    question: SurveyQuestion,
    mapping: QuestionMapping,
    responses: SurveyResponse[]
  ): QuestionComputedStats {
    return this.computeQuestionStatistics(question, mapping, responses).computedStats;
  }

  /**
   * 1. Multiple Choice / Dropdown Categorical Statistics
   * Formula: percentage = (categoryCount / validResponses) * 100
   */
  private static computeMultipleChoiceStats(
    question: SurveyQuestion,
    mapping: QuestionMapping,
    responses: SurveyResponse[]
  ): QuestionStatistics {
    const totalResponses = responses.length;
    let emptyResponses = 0;
    const invalidResponses: InvalidResponseRecord[] = [];
    const unmatchedValues: string[] = [];
    const mergedCategoriesMap = new Map<string, Set<string>>();

    interface CatAccumulator {
      label: string;
      normalizedKey: string;
      count: number;
      order?: number;
      rawVariants: Set<string>;
    }

    const categoryMap = new Map<string, CatAccumulator>();

    // 1. Initialize predefined options if present to ensure 0-count options and order are preserved
    const effectiveOptions =
      mapping.options && mapping.options.length > 0
        ? mapping.options
        : question.options;

    if (effectiveOptions && effectiveOptions.length > 0) {
      effectiveOptions.forEach((opt, idx) => {
        const norm = normalizeCategory(opt.label || opt.value);
        categoryMap.set(norm.normalizedValue, {
          label: opt.label,
          normalizedKey: norm.normalizedValue,
          count: 0,
          order: opt.order ?? idx,
          rawVariants: new Set([opt.label]),
        });
      });
    }

    let validResponses = 0;

    // 2. Process each response
    for (const resp of responses) {
      const raw = resp.answers[question.id];

      if (isEmptyValue(raw)) {
        emptyResponses++;
        continue;
      }

      const match = matchOptionLabel(String(raw), effectiveOptions);
      const norm = normalizeCategory(match.label);

      if (!match.matchedOption && effectiveOptions && effectiveOptions.length > 0) {
        unmatchedValues.push(String(raw));
      }

      const key = match.normalizedKey || norm.normalizedValue;
      const existing = categoryMap.get(key) || categoryMap.get(norm.normalizedValue);
      if (existing) {
        existing.count++;
        existing.rawVariants.add(String(raw));
      } else {
        categoryMap.set(key, {
          label: match.label,
          normalizedKey: key,
          count: 1,
          order: 9999,
          rawVariants: new Set([String(raw)]),
        });
      }

      validResponses++;
    }

    // 3. Consistency checks & diagnostics
    const warnings: string[] = [];
    const errors: string[] = [];

    if (validResponses + emptyResponses + invalidResponses.length !== totalResponses) {
      warnings.push(
        `Sum mismatch: valid (${validResponses}) + empty (${emptyResponses}) + invalid (${invalidResponses.length}) != total (${totalResponses})`
      );
    }

    // Build merged categories record for diagnostics
    const duplicatedCategoriesMerged: Array<{
      canonical: string;
      variants: string[];
      count: number;
    }> = [];

    categoryMap.forEach((cat) => {
      if (cat.rawVariants.size > 1) {
        duplicatedCategoriesMerged.push({
          canonical: cat.label,
          variants: Array.from(cat.rawVariants),
          count: cat.count,
        });
      }
    });

    // 4. Calculate exact unrounded float percentages
    const frequencies: CategoryFrequency[] = Array.from(categoryMap.values()).map(
      (cat) => {
        const percentage =
          validResponses > 0 ? (cat.count / validResponses) * 100 : 0;
        return {
          value: cat.normalizedKey,
          label: cat.label,
          count: cat.count,
          percentage,
          formattedPercentage: `${percentage.toFixed(1).replace('.', ',')}%`,
          order: cat.order,
        };
      }
    );

    // 5. Order: respect defined option order, otherwise sort by count descending
    if (question.options && question.options.length > 0) {
      frequencies.sort((a, b) => {
        const orderA = a.order ?? 9999;
        const orderB = b.order ?? 9999;
        if (orderA !== orderB) return orderA - orderB;
        return b.count - a.count;
      });
    } else {
      frequencies.sort((a, b) => b.count - a.count);
    }

    // 6. Check sum of category counts <= validResponses
    const totalCatCount = frequencies.reduce((acc, curr) => acc + curr.count, 0);
    if (totalCatCount > validResponses) {
      errors.push(`Multiple choice category sum (${totalCatCount}) exceeds valid responses (${validResponses})`);
    }

    // Mode
    const sortedByCount = [...frequencies].sort((a, b) => b.count - a.count);
    const mode =
      sortedByCount.length > 0 && sortedByCount[0].count > 0
        ? sortedByCount[0].label
        : undefined;

    const responseRate =
      totalResponses > 0 ? (validResponses / totalResponses) * 100 : 0;

    const diagnostics: StatisticsDiagnostics = {
      warnings,
      errors,
      unmatchedValues: Array.from(new Set(unmatchedValues)),
      invalidResponses,
      duplicatedCategoriesMerged,
      normalizationApplied: true,
    };

    const stats: QuantitativeStats = {
      totalAnswers: validResponses,
      validResponses,
      emptyResponses,
      invalidResponses,
      responseRate,
      frequencies,
      mode,
      isMultipleSelection: false,
      diagnostics,
    };

    return {
      questionId: question.id,
      type: question.type,
      analysisMode: mapping.analysisMode,
      totalResponses,
      validResponses,
      emptyResponses,
      invalidResponses,
      computedStats: { kind: 'categorical', stats },
      diagnostics,
    };
  }

  /**
   * 2. Checkbox Multi-Selection Statistics
   * Formula: count = distinct respondents who selected the option
   *          percentage = (count / validRespondents) * 100
   * NOTE: Does NOT use total options selected as denominator!
   */
  private static computeCheckboxStats(
    question: SurveyQuestion,
    mapping: QuestionMapping,
    responses: SurveyResponse[]
  ): QuestionStatistics {
    const totalResponses = responses.length;
    let emptyResponses = 0;
    const invalidResponses: InvalidResponseRecord[] = [];
    const unmatchedValues: string[] = [];

    interface CatAccumulator {
      label: string;
      normalizedKey: string;
      count: number;
      order?: number;
      rawVariants: Set<string>;
    }

    const categoryMap = new Map<string, CatAccumulator>();

    // Initialize predefined options
    const effectiveOptions =
      mapping.options && mapping.options.length > 0
        ? mapping.options
        : question.options;

    if (effectiveOptions && effectiveOptions.length > 0) {
      effectiveOptions.forEach((opt, idx) => {
        const norm = normalizeCategory(opt.label || opt.value);
        categoryMap.set(norm.normalizedValue, {
          label: opt.label,
          normalizedKey: norm.normalizedValue,
          count: 0,
          order: opt.order ?? idx,
          rawVariants: new Set([opt.label]),
        });
      });
    }

    let validResponses = 0;
    let totalOptionsSelected = 0;

    for (const resp of responses) {
      const raw = resp.answers[question.id];

      if (isEmptyValue(raw)) {
        emptyResponses++;
        continue;
      }

      // Split into distinct selections for this single respondent
      const selectedParts = splitCheckboxAnswer(raw as string | string[]);

      if (selectedParts.length === 0) {
        emptyResponses++;
        continue;
      }

      validResponses++;

      for (const item of selectedParts) {
        totalOptionsSelected++;
        const match = matchOptionLabel(item, effectiveOptions);
        const norm = normalizeCategory(match.label);

        if (!match.matchedOption && effectiveOptions && effectiveOptions.length > 0) {
          unmatchedValues.push(item);
        }

        const key = match.normalizedKey || norm.normalizedValue;
        const existing = categoryMap.get(key) || categoryMap.get(norm.normalizedValue);
        if (existing) {
          existing.count++;
          existing.rawVariants.add(item);
        } else {
          categoryMap.set(key, {
            label: match.label,
            normalizedKey: key,
            count: 1,
            order: 9999,
            rawVariants: new Set([item]),
          });
        }
      }
    }

    const warnings: string[] = [];
    const errors: string[] = [];

    const duplicatedCategoriesMerged: Array<{
      canonical: string;
      variants: string[];
      count: number;
    }> = [];

    categoryMap.forEach((cat) => {
      if (cat.rawVariants.size > 1) {
        duplicatedCategoriesMerged.push({
          canonical: cat.label,
          variants: Array.from(cat.rawVariants),
          count: cat.count,
        });
      }
    });

    // Exact percentage calculation based on validResponses (respondents)
    const frequencies: CategoryFrequency[] = Array.from(categoryMap.values()).map(
      (cat) => {
        const percentage =
          validResponses > 0 ? (cat.count / validResponses) * 100 : 0;
        return {
          value: cat.normalizedKey,
          label: cat.label,
          count: cat.count,
          percentage,
          formattedPercentage: `${percentage.toFixed(1).replace('.', ',')}%`,
          order: cat.order,
        };
      }
    );

    // Order: respect defined options order, then count descending
    if (question.options && question.options.length > 0) {
      frequencies.sort((a, b) => {
        const orderA = a.order ?? 9999;
        const orderB = b.order ?? 9999;
        if (orderA !== orderB) return orderA - orderB;
        return b.count - a.count;
      });
    } else {
      frequencies.sort((a, b) => b.count - a.count);
    }

    const sortedByCount = [...frequencies].sort((a, b) => b.count - a.count);
    const mode =
      sortedByCount.length > 0 && sortedByCount[0].count > 0
        ? sortedByCount[0].label
        : undefined;

    const responseRate =
      totalResponses > 0 ? (validResponses / totalResponses) * 100 : 0;

    const diagnostics: StatisticsDiagnostics = {
      warnings,
      errors,
      unmatchedValues: Array.from(new Set(unmatchedValues)),
      invalidResponses,
      duplicatedCategoriesMerged,
      normalizationApplied: true,
    };

    const stats: QuantitativeStats = {
      totalAnswers: validResponses,
      validResponses,
      emptyResponses,
      invalidResponses,
      responseRate,
      frequencies,
      mode,
      totalOptionsSelected,
      isMultipleSelection: true,
      diagnostics,
    };

    return {
      questionId: question.id,
      type: question.type,
      analysisMode: mapping.analysisMode,
      totalResponses,
      validResponses,
      emptyResponses,
      invalidResponses,
      computedStats: { kind: 'categorical', stats },
      diagnostics,
    };
  }

  /**
   * 3. Linear Scale & Numerical Rating Statistics
   * Calculates: validResponses, emptyResponses, invalidResponses, min, max, average, median, distribution
   */
  private static computeScaleStats(
    question: SurveyQuestion,
    mapping: QuestionMapping,
    responses: SurveyResponse[]
  ): QuestionStatistics {
    const totalResponses = responses.length;
    let emptyResponses = 0;
    const invalidResponses: InvalidResponseRecord[] = [];
    const numericValues: number[] = [];

    for (const resp of responses) {
      const raw = resp.answers[question.id];

      if (isEmptyValue(raw)) {
        emptyResponses++;
        continue;
      }

      const parsed = parseNumericValue(raw);
      if (parsed.valid === true) {
        numericValues.push(parsed.value);
      } else {
        invalidResponses.push({
          value: raw,
          reason: parsed.reason,
        });
      }
    }

    const validResponses = numericValues.length;
    const warnings: string[] = [];
    const errors: string[] = [];

    if (validResponses + emptyResponses + invalidResponses.length !== totalResponses) {
      warnings.push(
        `Sum mismatch: valid (${validResponses}) + empty (${emptyResponses}) + invalid (${invalidResponses.length}) != total (${totalResponses})`
      );
    }

    if (validResponses === 0) {
      const emptyDiagnostics: StatisticsDiagnostics = {
        warnings,
        errors,
        unmatchedValues: [],
        invalidResponses,
        duplicatedCategoriesMerged: [],
        normalizationApplied: true,
      };

      const scaleStats: ScaleStats = {
        totalAnswers: 0,
        validResponses: 0,
        emptyResponses,
        invalidResponses,
        responseRate: 0,
        average: 0,
        median: 0,
        min: 0,
        max: 0,
        distribution: [],
        diagnostics: emptyDiagnostics,
      };

      return {
        questionId: question.id,
        type: question.type,
        analysisMode: mapping.analysisMode,
        totalResponses,
        validResponses: 0,
        emptyResponses,
        invalidResponses,
        computedStats: { kind: 'scale', stats: scaleStats },
        diagnostics: emptyDiagnostics,
      };
    }

    numericValues.sort((a, b) => a - b);

    const sum = numericValues.reduce((acc, curr) => acc + curr, 0);
    const average = sum / validResponses; // Exact float
    const min = numericValues[0];
    const max = numericValues[validResponses - 1];

    const mid = Math.floor(validResponses / 2);
    const median =
      validResponses % 2 !== 0
        ? numericValues[mid]
        : (numericValues[mid - 1] + numericValues[mid]) / 2;

    if (min > average || average > max) {
      errors.push(`Scale math violation: min (${min}) <= average (${average}) <= max (${max})`);
    }

    // Scale distribution steps
    const startScore = question.scaleConfig?.min ?? Math.min(1, Math.floor(min));
    const endScore = question.scaleConfig?.max ?? Math.max(5, Math.ceil(max));

    const countMap = new Map<number, number>();
    for (let i = startScore; i <= endScore; i++) {
      countMap.set(i, 0);
    }

    for (const val of numericValues) {
      const current = countMap.get(val) || 0;
      countMap.set(val, current + 1);
    }

    const distribution: ScaleDistributionItem[] = Array.from(countMap.entries()).map(
      ([score, count]) => {
        let label = `${score}`;
        if (score === startScore && question.scaleConfig?.minLabel) {
          label = `${score} (${question.scaleConfig.minLabel})`;
        } else if (score === endScore && question.scaleConfig?.maxLabel) {
          label = `${score} (${question.scaleConfig.maxLabel})`;
        }

        const percentage = validResponses > 0 ? (count / validResponses) * 100 : 0;

        return {
          score,
          label,
          count,
          percentage,
        };
      }
    );

    const responseRate =
      totalResponses > 0 ? (validResponses / totalResponses) * 100 : 0;

    const diagnostics: StatisticsDiagnostics = {
      warnings,
      errors,
      unmatchedValues: [],
      invalidResponses,
      duplicatedCategoriesMerged: [],
      normalizationApplied: true,
    };

    const stats: ScaleStats = {
      totalAnswers: validResponses,
      validResponses,
      emptyResponses,
      invalidResponses,
      responseRate,
      average,
      median,
      min,
      max,
      distribution,
      diagnostics,
    };

    return {
      questionId: question.id,
      type: question.type,
      analysisMode: mapping.analysisMode,
      totalResponses,
      validResponses,
      emptyResponses,
      invalidResponses,
      computedStats: { kind: 'scale', stats },
      diagnostics,
    };
  }

  /**
   * 4. Date Distribution Statistics
   */
  private static computeDateStats(
    question: SurveyQuestion,
    mapping: QuestionMapping,
    responses: SurveyResponse[]
  ): QuestionStatistics {
    const totalResponses = responses.length;
    let emptyResponses = 0;
    const invalidResponses: InvalidResponseRecord[] = [];
    const dateMap = new Map<string, { count: number; label: string }>();

    for (const resp of responses) {
      const raw = resp.answers[question.id];

      if (isEmptyValue(raw)) {
        emptyResponses++;
        continue;
      }

      const parsed = parseDateValue(raw);
      if (parsed.valid === true) {
        const existing = dateMap.get(parsed.isoDate);
        if (existing) {
          existing.count++;
        } else {
          dateMap.set(parsed.isoDate, {
            count: 1,
            label: parsed.label,
          });
        }
      } else {
        invalidResponses.push({
          value: raw,
          reason: parsed.reason,
        });
      }
    }

    const validResponses = Array.from(dateMap.values()).reduce(
      (acc, curr) => acc + curr.count,
      0
    );

    const sortedDates = Array.from(dateMap.keys()).sort();
    const minDate = sortedDates[0];
    const maxDate = sortedDates[sortedDates.length - 1];

    const frequencies: DateDistributionItem[] = sortedDates.map((isoDate) => {
      const item = dateMap.get(isoDate)!;
      const percentage =
        validResponses > 0 ? (item.count / validResponses) * 100 : 0;
      return {
        date: isoDate,
        label: item.label,
        count: item.count,
        percentage,
      };
    });

    const responseRate =
      totalResponses > 0 ? (validResponses / totalResponses) * 100 : 0;

    const diagnostics: StatisticsDiagnostics = {
      warnings: [],
      errors: [],
      unmatchedValues: [],
      invalidResponses,
      duplicatedCategoriesMerged: [],
      normalizationApplied: true,
    };

    const stats: DateStats = {
      totalAnswers: validResponses,
      validResponses,
      emptyResponses,
      invalidResponses,
      responseRate,
      minDate,
      maxDate,
      frequencies,
      diagnostics,
    };

    return {
      questionId: question.id,
      type: question.type,
      analysisMode: mapping.analysisMode,
      totalResponses,
      validResponses,
      emptyResponses,
      invalidResponses,
      computedStats: { kind: 'date', stats },
      diagnostics,
    };
  }

  /**
   * 5. Time Distribution Statistics
   */
  private static computeTimeStats(
    question: SurveyQuestion,
    mapping: QuestionMapping,
    responses: SurveyResponse[]
  ): QuestionStatistics {
    const totalResponses = responses.length;
    let emptyResponses = 0;
    const invalidResponses: InvalidResponseRecord[] = [];
    const timeMap = new Map<string, { count: number; label: string }>();

    for (const resp of responses) {
      const raw = resp.answers[question.id];

      if (isEmptyValue(raw)) {
        emptyResponses++;
        continue;
      }

      const parsed = parseTimeValue(raw);
      if (parsed.valid === true) {
        const existing = timeMap.get(parsed.time);
        if (existing) {
          existing.count++;
        } else {
          timeMap.set(parsed.time, {
            count: 1,
            label: parsed.label,
          });
        }
      } else {
        invalidResponses.push({
          value: raw,
          reason: parsed.reason,
        });
      }
    }

    const validResponses = Array.from(timeMap.values()).reduce(
      (acc, curr) => acc + curr.count,
      0
    );

    const sortedTimes = Array.from(timeMap.keys()).sort();
    const minTime = sortedTimes[0];
    const maxTime = sortedTimes[sortedTimes.length - 1];

    const frequencies: TimeDistributionItem[] = sortedTimes.map((time) => {
      const item = timeMap.get(time)!;
      const percentage =
        validResponses > 0 ? (item.count / validResponses) * 100 : 0;
      return {
        time,
        label: item.label,
        count: item.count,
        percentage,
      };
    });

    const responseRate =
      totalResponses > 0 ? (validResponses / totalResponses) * 100 : 0;

    const diagnostics: StatisticsDiagnostics = {
      warnings: [],
      errors: [],
      unmatchedValues: [],
      invalidResponses,
      duplicatedCategoriesMerged: [],
      normalizationApplied: true,
    };

    const stats: TimeStats = {
      totalAnswers: validResponses,
      validResponses,
      emptyResponses,
      invalidResponses,
      responseRate,
      minTime,
      maxTime,
      frequencies,
      diagnostics,
    };

    return {
      questionId: question.id,
      type: question.type,
      analysisMode: mapping.analysisMode,
      totalResponses,
      validResponses,
      emptyResponses,
      invalidResponses,
      computedStats: { kind: 'time', stats },
      diagnostics,
    };
  }

  /**
   * 6. Qualitative / Free Text Statistics (Zero AI Calculation - Pure deterministic count)
   */
  private static computeQualitativeStats(
    question: SurveyQuestion,
    mapping: QuestionMapping,
    responses: SurveyResponse[]
  ): QuestionStatistics {
    const totalResponses = responses.length;
    let emptyResponses = 0;
    const textResponses: string[] = [];

    for (const resp of responses) {
      const raw = resp.answers[question.id];
      if (isEmptyValue(raw)) {
        emptyResponses++;
        continue;
      }

      const str = typeof raw === 'string' ? raw.trim() : String(raw).trim();
      if (str.length > 0) {
        textResponses.push(str);
      } else {
        emptyResponses++;
      }
    }

    const validResponses = textResponses.length;
    const totalWords = textResponses.reduce((acc, text) => {
      return acc + text.split(/\s+/).filter(Boolean).length;
    }, 0);

    const averageWordCount =
      validResponses > 0 ? totalWords / validResponses : 0;

    const responseRate =
      totalResponses > 0 ? (validResponses / totalResponses) * 100 : 0;

    const diagnostics: StatisticsDiagnostics = {
      warnings: [],
      errors: [],
      unmatchedValues: [],
      invalidResponses: [],
      duplicatedCategoriesMerged: [],
      normalizationApplied: true,
    };

    const stats: QualitativeStats = {
      totalAnswers: validResponses,
      validResponses,
      emptyResponses,
      invalidResponses: [],
      responseRate,
      sampleResponses: textResponses,
      averageWordCount,
      status: 'pending_ai',
      diagnostics,
    };

    return {
      questionId: question.id,
      type: question.type,
      analysisMode: 'qualitative',
      totalResponses,
      validResponses,
      emptyResponses,
      invalidResponses: [],
      computedStats: { kind: 'qualitative', stats },
      diagnostics,
    };
  }

  /**
   * Default question mapping generator based on question type metadata
   */
  public static generateDefaultMapping(
    question: SurveyQuestion
  ): QuestionMapping {
    switch (question.type) {
      case 'multiple_choice':
      case 'dropdown':
        return {
          questionId: question.id,
          questionType: question.type,
          analysisMode: 'quantitative',
          visualization: 'bar',
          confidence: 1.0,
          source: 'metadata',
          options: question.options,
        };
      case 'checkbox':
        return {
          questionId: question.id,
          questionType: question.type,
          analysisMode: 'quantitative',
          visualization: 'horizontal_bar',
          confidence: 1.0,
          source: 'metadata',
          options: question.options,
        };
      case 'linear_scale':
      case 'number':
        return {
          questionId: question.id,
          questionType: question.type,
          analysisMode: 'quantitative',
          visualization: 'distribution',
          confidence: 1.0,
          source: 'metadata',
        };
      case 'date':
        return {
          questionId: question.id,
          questionType: question.type,
          analysisMode: 'quantitative',
          visualization: 'bar',
          confidence: 1.0,
          source: 'metadata',
        };
      case 'time':
        return {
          questionId: question.id,
          questionType: question.type,
          analysisMode: 'quantitative',
          visualization: 'bar',
          confidence: 1.0,
          source: 'metadata',
        };
      case 'paragraph':
      case 'short_answer':
        return {
          questionId: question.id,
          questionType: question.type,
          analysisMode: 'qualitative',
          visualization: 'none',
          confidence: 1.0,
          source: 'metadata',
        };
      default:
        return {
          questionId: question.id,
          questionType: 'unknown',
          analysisMode: 'mixed',
          visualization: 'auto',
          confidence: 0.5,
          source: 'inferred',
        };
    }
  }
}
