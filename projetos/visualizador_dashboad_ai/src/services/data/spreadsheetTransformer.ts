import type { SpreadsheetData } from '../../types/spreadsheet';
import type {
  DataSource,
  DataSourceType,
  QuestionMapping,
  QuestionOption,
  Survey,
  SurveyQuestion,
  SurveyResponse,
} from '../../types/survey';
import { DataProfiler } from './dataProfiler';
import { normalizeCategory } from '../../utils/normalization';

/**
 * Transforms raw SpreadsheetData (from Google Sheets, XLSX, CSV, or URL)
 * into a fully structured domain Survey object with questions, responses, and mappings.
 * Utilizes the DataProfiler for evidence-based heuristic type inference.
 */
export class SpreadsheetTransformerService {
  public static transformToSurvey(data: SpreadsheetData): Survey {
    const { source, sheet, columns, rows, rowCount } = data;

    // 1. Identify special metadata columns (e.g. Timestamp, Respondent ID)
    let timestampCol: string | null = null;
    let respondentIdCol: string | null = null;

    const questionColumns: string[] = [];

    for (const col of columns) {
      const lower = col.toLowerCase().trim();
      if (
        !timestampCol &&
        (lower.includes('carimbo') ||
          lower.includes('timestamp') ||
          lower.includes('data/hora') ||
          lower === 'data' ||
          lower === 'submitted_at' ||
          lower === 'data e hora')
      ) {
        timestampCol = col;
      } else if (
        !respondentIdCol &&
        (lower === 'id' ||
          lower === 'user_id' ||
          lower === 'respondent_id' ||
          lower === 'participante' ||
          lower === 'e-mail' ||
          lower === 'email')
      ) {
        respondentIdCol = col;
      } else {
        questionColumns.push(col);
      }
    }

    // If all columns were flagged, fallback to including all columns
    const activeColumns = questionColumns.length > 0 ? questionColumns : columns;

    // 2. Build Survey Questions and Mappings via DataProfiler
    const questions: SurveyQuestion[] = [];
    const mappings: Record<string, QuestionMapping> = {};
    const columnProfiles = activeColumns.map((colName, idx) => {
      const rawValues = rows.map((r) => r[colName]);
      return DataProfiler.profileColumn(colName, idx, rawValues, rows.length);
    });

    activeColumns.forEach((colName, colIdx) => {
      const qId = `q_${colIdx + 1}`;
      const profile = columnProfiles[colIdx];

      let options: QuestionOption[] | undefined = undefined;
      let scaleConfig: SurveyQuestion['scaleConfig'] = undefined;

      if (profile.suggestedOptions && profile.suggestedOptions.length > 0) {
        options = profile.suggestedOptions.map((optLabel, oIdx) => ({
          value: normalizeCategory(optLabel).normalizedValue,
          label: optLabel,
          order: oIdx + 1,
        }));
      }

      if (profile.possibleScale) {
        scaleConfig = {
          min: profile.possibleScale.min,
          max: profile.possibleScale.max,
          step: profile.possibleScale.step,
          minLabel: profile.possibleScale.minLabel,
          maxLabel: profile.possibleScale.maxLabel,
        };
      }

      const question: SurveyQuestion = {
        id: qId,
        title: colName,
        type: profile.apparentType,
        required: false,
        order: colIdx + 1,
        options,
        scaleConfig,
      };

      questions.push(question);

      mappings[qId] = {
        questionId: qId,
        questionType: profile.apparentType,
        analysisMode: profile.suggestedAnalysisMode,
        visualization: profile.suggestedVisualization,
        options,
        confidence: profile.confidence,
        source: 'inferred',
        notes: profile.reason,
      };
    });

    // 3. Transform Rows into Survey Responses with normalized answers
    const responses: SurveyResponse[] = rows.map((row, rIdx) => {
      const respId = respondentIdCol && row[respondentIdCol]
        ? String(row[respondentIdCol])
        : `resp_${rIdx + 1}`;

      const submittedAt = timestampCol && row[timestampCol]
        ? String(row[timestampCol])
        : undefined;

      const answers: Record<string, any> = {};
      activeColumns.forEach((colName, colIdx) => {
        const qId = `q_${colIdx + 1}`;
        const rawVal = row[colName];
        const profile = columnProfiles[colIdx];

        if (rawVal === null || rawVal === undefined || String(rawVal).trim() === '') {
          answers[qId] = null;
          return;
        }

        if (profile.apparentType === 'checkbox') {
          const delim = profile.detectedDelimiter || ';';
          if (typeof rawVal === 'string') {
            answers[qId] = rawVal
              .split(delim)
              .map((s) => s.trim())
              .filter(Boolean);
          } else if (Array.isArray(rawVal)) {
            answers[qId] = rawVal;
          } else {
            answers[qId] = [String(rawVal).trim()];
          }
        } else if (
          profile.apparentType === 'linear_scale' ||
          profile.apparentType === 'number'
        ) {
          const num = typeof rawVal === 'number' ? rawVal : Number(String(rawVal).replace(',', '.'));
          answers[qId] = !isNaN(num) ? num : rawVal;
        } else {
          answers[qId] = rawVal;
        }
      });

      return {
        id: respId,
        submittedAt,
        answers,
      };
    });

    // 4. Build DataSource metadata
    const dataSource: DataSource = {
      type: (source.type as DataSourceType) || 'google_sheets',
      id: source.id,
      name: `${source.name}${sheet.name ? ` (${sheet.name})` : ''}`,
      url: source.webViewLink,
      mimeType: source.mimeType,
      rowCount: rowCount,
      lastModified: new Date().toISOString(),
    };

    return {
      id: `survey_${source.id}_${Date.now()}`,
      name: source.name,
      description: `Pesquisa importada de ${source.name} [Aba: ${sheet.name}] com ${rowCount} respostas e ${questions.length} colunas perfiladas.`,
      source: dataSource,
      createdAt: new Date().toISOString(),
      analyzedAt: new Date().toISOString(),
      questions,
      mappings,
      responses,
    };
  }
}
