import {
  AnalysisMode,
  LinearScaleConfig,
  QuestionMapping,
  QuestionOption,
  QuestionType,
  VisualizationType,
} from '../../types/survey';
import { normalizeCategory } from '../../utils/normalization';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ValueDistributionItem {
  rawSample: string;
  normalizedValue: string;
  displayLabel: string;
  count: number;
  percentage: number;
}

export interface PossibleScaleDetection {
  min: number;
  max: number;
  step: number;
  isInteger: boolean;
  minLabel?: string;
  maxLabel?: string;
}

export interface ColumnProfile {
  name: string;
  columnIndex: number;
  totalRows: number;
  totalAnswers: number;
  emptyAnswers: number;
  fillRate: number; // 0 to 100
  uniqueValues: string[];
  uniqueCount: number;
  apparentType: QuestionType;
  confidence: number; // 0.0 to 1.0
  confidenceLevel: ConfidenceLevel;
  reason: string;
  avgLength: number;
  maxLength: number;
  hasDelimiters: boolean;
  detectedDelimiter?: string;
  distribution: ValueDistributionItem[];
  suggestedOptions?: string[];
  possibleScale?: PossibleScaleDetection;
  suggestedAnalysisMode: AnalysisMode;
  suggestedVisualization: VisualizationType;
}

export interface DataProfilerResult {
  columnProfiles: ColumnProfile[];
  suggestedMappings: Record<string, QuestionMapping>;
  overallConfidence: number;
  overallConfidenceLevel: ConfidenceLevel;
  totalQuestions: number;
  flaggedLowConfidenceCount: number;
}

export class DataProfiler {
  /**
   * Profiles a full tabular dataset (headers + rows)
   */
  public static profileDataset(
    columns: string[],
    rows: Record<string, any>[]
  ): DataProfilerResult {
    const totalRows = rows.length;
    const columnProfiles: ColumnProfile[] = [];
    const suggestedMappings: Record<string, QuestionMapping> = {};

    let totalConfidence = 0;
    let flaggedLowConfidenceCount = 0;

    columns.forEach((colName, colIdx) => {
      const qId = `q_${colIdx + 1}`;
      const rawValues = rows.map((r) => r[colName]);

      const profile = this.profileColumn(colName, colIdx, rawValues, totalRows);
      columnProfiles.push(profile);

      // Build structured QuestionOption list if options were suggested
      const options: QuestionOption[] | undefined = profile.suggestedOptions
        ? profile.suggestedOptions.map((optLabel, oIdx) => ({
            value: normalizeCategory(optLabel).normalizedValue,
            label: optLabel,
            order: oIdx + 1,
          }))
        : undefined;

      suggestedMappings[qId] = {
        questionId: qId,
        questionType: profile.apparentType,
        analysisMode: profile.suggestedAnalysisMode,
        visualization: profile.suggestedVisualization,
        options,
        confidence: profile.confidence,
        source: 'inferred',
        notes: profile.reason,
      };

      totalConfidence += profile.confidence;
      if (profile.confidenceLevel === 'low') {
        flaggedLowConfidenceCount++;
      }
    });

    const overallConfidence =
      columns.length > 0 ? Number((totalConfidence / columns.length).toFixed(2)) : 1;

    return {
      columnProfiles,
      suggestedMappings,
      overallConfidence,
      overallConfidenceLevel: this.getConfidenceLevel(overallConfidence),
      totalQuestions: columns.length,
      flaggedLowConfidenceCount,
    };
  }

  /**
   * Profiles an individual column based on its values
   */
  public static profileColumn(
    columnName: string,
    columnIndex: number,
    rawValues: any[],
    totalRows: number
  ): ColumnProfile {
    // 1. Basic counts & non-empty values
    const nonNullValues = rawValues.filter(
      (v) => v !== null && v !== undefined && String(v).trim() !== ''
    );
    const totalAnswers = nonNullValues.length;
    const emptyAnswers = totalRows - totalAnswers;
    const fillRate = totalRows > 0 ? Math.round((totalAnswers / totalRows) * 100) : 0;

    // Default if column is completely empty
    if (totalAnswers === 0) {
      return {
        name: columnName,
        columnIndex,
        totalRows,
        totalAnswers: 0,
        emptyAnswers: totalRows,
        fillRate: 0,
        uniqueValues: [],
        uniqueCount: 0,
        apparentType: 'unknown',
        confidence: 0.2,
        confidenceLevel: 'low',
        reason: 'Coluna sem respostas registradas (100% vazia).',
        avgLength: 0,
        maxLength: 0,
        hasDelimiters: false,
        distribution: [],
        suggestedAnalysisMode: 'ignore',
        suggestedVisualization: 'none',
      };
    }

    // 2. Compute string lengths
    const stringRepresentations = nonNullValues.map((v) => String(v).trim());
    const totalChars = stringRepresentations.reduce((acc, str) => acc + str.length, 0);
    const avgLength = Math.round(totalChars / totalAnswers);
    const maxLength = Math.max(...stringRepresentations.map((s) => s.length));

    // 3. Detect Delimiters (for checkbox lists)
    const delimiterDetection = this.detectDelimiters(stringRepresentations);

    // 4. Value distribution & deduplicated canonical categories
    const { distribution, canonicalOptions, uniqueCount } =
      this.computeDistributionAndCategories(stringRepresentations, delimiterDetection.delimiter);

    // 5. Detect Date / Time
    const dateDetection = this.detectDateTime(stringRepresentations);
    if (dateDetection.isDate) {
      return {
        name: columnName,
        columnIndex,
        totalRows,
        totalAnswers,
        emptyAnswers,
        fillRate,
        uniqueValues: canonicalOptions,
        uniqueCount,
        apparentType: 'date',
        confidence: dateDetection.confidence,
        confidenceLevel: this.getConfidenceLevel(dateDetection.confidence),
        reason: 'Padrão consistente de datas (DD/MM/AAAA ou ISO).',
        avgLength,
        maxLength,
        hasDelimiters: false,
        distribution,
        suggestedAnalysisMode: 'quantitative',
        suggestedVisualization: 'bar',
      };
    }

    if (dateDetection.isTime) {
      return {
        name: columnName,
        columnIndex,
        totalRows,
        totalAnswers,
        emptyAnswers,
        fillRate,
        uniqueValues: canonicalOptions,
        uniqueCount,
        apparentType: 'time',
        confidence: dateDetection.confidence,
        confidenceLevel: this.getConfidenceLevel(dateDetection.confidence),
        reason: 'Padrão consistente de horário (HH:MM).',
        avgLength,
        maxLength,
        hasDelimiters: false,
        distribution,
        suggestedAnalysisMode: 'quantitative',
        suggestedVisualization: 'table',
      };
    }

    // 6. Detect Numeric & Linear Scale
    const numericDetection = this.detectNumericAndScale(nonNullValues);
    if (numericDetection.isAllNumeric) {
      if (numericDetection.possibleScale) {
        const conf = numericDetection.confidence;
        return {
          name: columnName,
          columnIndex,
          totalRows,
          totalAnswers,
          emptyAnswers,
          fillRate,
          uniqueValues: canonicalOptions,
          uniqueCount,
          apparentType: 'linear_scale',
          confidence: conf,
          confidenceLevel: this.getConfidenceLevel(conf),
          reason: `Valores numéricos inteiros concentrados no intervalo ${numericDetection.possibleScale.min} a ${numericDetection.possibleScale.max}.`,
          avgLength,
          maxLength,
          hasDelimiters: false,
          distribution,
          possibleScale: numericDetection.possibleScale,
          suggestedAnalysisMode: 'quantitative',
          suggestedVisualization: 'distribution',
        };
      } else {
        const conf = numericDetection.confidence;
        return {
          name: columnName,
          columnIndex,
          totalRows,
          totalAnswers,
          emptyAnswers,
          fillRate,
          uniqueValues: canonicalOptions,
          uniqueCount,
          apparentType: 'number',
          confidence: conf,
          confidenceLevel: this.getConfidenceLevel(conf),
          reason: 'Valores numéricos quantitativos contínuos ou contagens.',
          avgLength,
          maxLength,
          hasDelimiters: false,
          distribution,
          suggestedAnalysisMode: 'quantitative',
          suggestedVisualization: 'distribution',
        };
      }
    }

    // 7. Detect Checkbox (Multi-select)
    if (delimiterDetection.isCheckbox && delimiterDetection.delimiter) {
      const conf = delimiterDetection.confidence;
      return {
        name: columnName,
        columnIndex,
        totalRows,
        totalAnswers,
        emptyAnswers,
        fillRate,
        uniqueValues: canonicalOptions,
        uniqueCount: canonicalOptions.length,
        apparentType: 'checkbox',
        confidence: conf,
        confidenceLevel: this.getConfidenceLevel(conf),
        reason: `Múltiplas opções detectadas por célula separadas por "${delimiterDetection.delimiter}".`,
        avgLength,
        maxLength,
        hasDelimiters: true,
        detectedDelimiter: delimiterDetection.delimiter,
        distribution,
        suggestedOptions: canonicalOptions,
        suggestedAnalysisMode: 'quantitative',
        suggestedVisualization: 'horizontal_bar',
      };
    }

    // 8. Detect Multiple Choice vs Open Text (Paragraph / Short Answer)
    const uniquenessRatio = uniqueCount / totalAnswers;

    // Multiple Choice heuristic:
    // - Limited unique categories (e.g. <= 15 unique, or <= 35% uniqueness ratio when totalAnswers >= 6)
    // - Values are relatively short (< 60 chars avg)
    // - Significant repetition
    const isFewCategories = uniqueCount <= 12 || (uniqueCount <= 20 && uniquenessRatio < 0.4);
    const isShortText = avgLength < 55 && maxLength < 100;

    if (isFewCategories && isShortText && (totalAnswers === 1 || uniquenessRatio < 0.85)) {
      const confidence = Number(
        Math.min(
          0.96,
          Math.max(0.75, 1 - uniquenessRatio * 0.4 + (uniqueCount <= 6 ? 0.1 : 0))
        ).toFixed(2)
      );

      return {
        name: columnName,
        columnIndex,
        totalRows,
        totalAnswers,
        emptyAnswers,
        fillRate,
        uniqueValues: canonicalOptions,
        uniqueCount,
        apparentType: 'multiple_choice',
        confidence,
        confidenceLevel: this.getConfidenceLevel(confidence),
        reason: `Poucos valores únicos (${uniqueCount}) e distribuição categórica consistente.`,
        avgLength,
        maxLength,
        hasDelimiters: false,
        distribution,
        suggestedOptions: canonicalOptions,
        suggestedAnalysisMode: 'quantitative',
        suggestedVisualization: 'bar',
      };
    }

    // 9. Free text: Paragraph vs Short Answer
    // High diversity of text
    if (avgLength >= 50 || maxLength >= 110) {
      const confidence = avgLength > 70 ? 0.94 : 0.82;
      return {
        name: columnName,
        columnIndex,
        totalRows,
        totalAnswers,
        emptyAnswers,
        fillRate,
        uniqueValues: stringRepresentations.slice(0, 10),
        uniqueCount,
        apparentType: 'paragraph',
        confidence,
        confidenceLevel: this.getConfidenceLevel(confidence),
        reason: `Respostas abertas longas (média de ${avgLength} caracteres) com alta diversidade textual.`,
        avgLength,
        maxLength,
        hasDelimiters: false,
        distribution: [],
        suggestedAnalysisMode: 'qualitative',
        suggestedVisualization: 'none',
      };
    }

    // Short answer
    const isDiverseShort = uniquenessRatio > 0.7 && totalAnswers > 3;
    const confidence = isDiverseShort ? 0.85 : 0.65;
    return {
      name: columnName,
      columnIndex,
      totalRows,
      totalAnswers,
      emptyAnswers,
      fillRate,
      uniqueValues: stringRepresentations.slice(0, 10),
      uniqueCount,
      apparentType: 'short_answer',
      confidence,
      confidenceLevel: this.getConfidenceLevel(confidence),
      reason: `Respostas curtas de texto livre com alta variabilidade (${uniqueCount} valores distintos).`,
      avgLength,
      maxLength,
      hasDelimiters: false,
      distribution: isDiverseShort ? [] : distribution,
      suggestedOptions: isDiverseShort ? undefined : canonicalOptions,
      suggestedAnalysisMode: isDiverseShort ? 'qualitative' : 'quantitative',
      suggestedVisualization: isDiverseShort ? 'none' : 'bar',
    };
  }

  /**
   * Detects multi-value delimiters in cells (;, |, ,)
   */
  private static detectDelimiters(samples: string[]): {
    isCheckbox: boolean;
    delimiter?: string;
    confidence: number;
  } {
    let semicolonCount = 0;
    let pipeCount = 0;
    let commaCandidateCount = 0;

    for (const str of samples) {
      if (str.includes(';')) semicolonCount++;
      if (str.includes('|')) pipeCount++;
      if (str.includes(',')) {
        // Only consider comma if fragments are short (< 35 chars) and look like list items
        const parts = str.split(',').map((p) => p.trim());
        if (parts.length > 1 && parts.every((p) => p.length > 0 && p.length < 35)) {
          commaCandidateCount++;
        }
      }
    }

    const total = samples.length;

    // Semicolon is strongest indicator for forms and surveys
    if (semicolonCount > 0) {
      const ratio = semicolonCount / total;
      return {
        isCheckbox: true,
        delimiter: ';',
        confidence: ratio > 0.3 ? 0.95 : 0.85,
      };
    }

    // Pipe separator (|)
    if (pipeCount > 0) {
      const ratio = pipeCount / total;
      return {
        isCheckbox: true,
        delimiter: '|',
        confidence: ratio > 0.3 ? 0.94 : 0.82,
      };
    }

    // Comma separator (only if high proportion of cells contain short list tokens)
    if (commaCandidateCount >= 2 && commaCandidateCount / total >= 0.25) {
      return {
        isCheckbox: true,
        delimiter: ',',
        confidence: 0.78,
      };
    }

    return {
      isCheckbox: false,
      confidence: 0,
    };
  }

  /**
   * Normalizes categories and builds distribution with sum aggregation
   */
  private static computeDistributionAndCategories(
    samples: string[],
    delimiter?: string
  ): {
    distribution: ValueDistributionItem[];
    canonicalOptions: string[];
    uniqueCount: number;
  } {
    // Map of normalized key -> { displayLabel, count, rawSamples }
    const groupMap = new Map<
      string,
      { displayLabel: string; count: number; rawSample: string }
    >();

    let totalTokens = 0;

    for (const raw of samples) {
      const tokens = delimiter
        ? raw.split(delimiter).map((t) => t.trim()).filter(Boolean)
        : [raw.trim()];

      for (const token of tokens) {
        if (!token) continue;
        totalTokens++;

        const norm = normalizeCategory(token).normalizedValue;
        const existing = groupMap.get(norm);

        if (existing) {
          existing.count += 1;
        } else {
          // Preserve the first clean, readable casing found for display
          groupMap.set(norm, {
            displayLabel: token.trim().replace(/\s+/g, ' '),
            count: 1,
            rawSample: token,
          });
        }
      }
    }

    const distribution: ValueDistributionItem[] = Array.from(groupMap.entries()).map(
      ([normKey, data]) => ({
        normalizedValue: normKey,
        displayLabel: data.displayLabel,
        rawSample: data.rawSample,
        count: data.count,
        percentage: totalTokens > 0 ? Math.round((data.count / totalTokens) * 100) : 0,
      })
    );

    // Sort by count descending
    distribution.sort((a, b) => b.count - a.count);

    const canonicalOptions = distribution.map((d) => d.displayLabel);
    const uniqueCount = distribution.length;

    return {
      distribution,
      canonicalOptions,
      uniqueCount,
    };
  }

  /**
   * Detects Date and Time patterns
   */
  private static detectDateTime(samples: string[]): {
    isDate: boolean;
    isTime: boolean;
    confidence: number;
  } {
    if (samples.length === 0) return { isDate: false, isTime: false, confidence: 0 };

    const datePatterns = [
      /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/, // DD/MM/YYYY or MM/DD/YYYY
      /^\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}$/, // YYYY-MM-DD
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, // ISO
    ];

    const timePattern = /^\d{1,2}:\d{2}(:\d{2})?(\s*(AM|PM|am|pm))?$/;

    let dateMatches = 0;
    let timeMatches = 0;

    for (const str of samples) {
      if (datePatterns.some((p) => p.test(str))) {
        dateMatches++;
      } else if (timePattern.test(str)) {
        timeMatches++;
      }
    }

    const total = samples.length;
    if (dateMatches / total >= 0.8) {
      return { isDate: true, isTime: false, confidence: 0.94 };
    }

    if (timeMatches / total >= 0.8) {
      return { isDate: false, isTime: true, confidence: 0.92 };
    }

    return { isDate: false, isTime: false, confidence: 0 };
  }

  /**
   * Detects whether values are purely numeric and if they represent a Linear Scale (e.g. 1-5, 1-10)
   */
  private static detectNumericAndScale(values: any[]): {
    isAllNumeric: boolean;
    possibleScale?: PossibleScaleDetection;
    confidence: number;
  } {
    const numbers: number[] = [];

    for (const val of values) {
      if (typeof val === 'number' && !isNaN(val)) {
        numbers.push(val);
      } else if (typeof val === 'string') {
        const cleaned = val.trim().replace(',', '.');
        const parsed = Number(cleaned);
        if (cleaned !== '' && !isNaN(parsed)) {
          numbers.push(parsed);
        } else {
          return { isAllNumeric: false, confidence: 0 };
        }
      } else {
        return { isAllNumeric: false, confidence: 0 };
      }
    }

    if (numbers.length === 0) return { isAllNumeric: false, confidence: 0 };

    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    const isAllInts = numbers.every((n) => Number.isInteger(n));
    const uniqueInts = new Set(numbers).size;

    // Linear scale heuristic:
    // - All integers
    // - Bounded interval: e.g. min >= 0 or 1, and max <= 10
    // - Range span (max - min) <= 10
    // - Unique integer count between 2 and 11
    const isScaleCandidate =
      isAllInts &&
      min >= 0 &&
      max <= 10 &&
      max - min >= 1 &&
      max - min <= 10 &&
      uniqueInts <= 11;

    if (isScaleCandidate) {
      const minLabel = min === 1 || min === 0 ? 'Mínimo' : String(min);
      const maxLabel = max === 5 || max === 10 || max === 7 ? 'Máximo' : String(max);

      return {
        isAllNumeric: true,
        possibleScale: {
          min,
          max,
          step: 1,
          isInteger: true,
          minLabel,
          maxLabel,
        },
        confidence: 0.92,
      };
    }

    // General continuous number
    return {
      isAllNumeric: true,
      confidence: 0.88,
    };
  }

  /**
   * Helper to categorize confidence into levels
   */
  public static getConfidenceLevel(confidence: number): ConfidenceLevel {
    if (confidence >= 0.85) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  }

  /**
   * Translates confidence level to human readable Portuguese label
   */
  public static getConfidenceLabel(level: ConfidenceLevel): string {
    switch (level) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      case 'low':
        return 'Baixa (Revisar)';
    }
  }

  /**
   * Translates QuestionType to human readable Portuguese label
   */
  public static getQuestionTypeLabel(type: QuestionType): string {
    switch (type) {
      case 'multiple_choice':
        return 'Múltipla Escolha';
      case 'checkbox':
        return 'Caixa de Seleção (Múltiplas)';
      case 'linear_scale':
        return 'Escala Linear';
      case 'paragraph':
        return 'Parágrafo (Texto Livre)';
      case 'short_answer':
        return 'Resposta Curta';
      case 'dropdown':
        return 'Lista Suspensa';
      case 'number':
        return 'Numérico';
      case 'date':
        return 'Data';
      case 'time':
        return 'Horário';
      default:
        return 'Desconhecido';
    }
  }

  /**
   * Suggests visualization according to requirement rules
   */
  public static getSuggestedVisualization(type: QuestionType): VisualizationType {
    switch (type) {
      case 'multiple_choice':
        return 'bar';
      case 'checkbox':
        return 'horizontal_bar';
      case 'linear_scale':
      case 'number':
        return 'distribution';
      case 'date':
        return 'bar';
      case 'time':
        return 'table';
      case 'short_answer':
      case 'paragraph':
      case 'unknown':
      default:
        return 'none';
    }
  }
}
