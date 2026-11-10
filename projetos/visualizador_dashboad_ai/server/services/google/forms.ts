import { google } from 'googleapis';
import type {
  DataSource,
  QuestionMapping,
  QuestionOption,
  QuestionType,
  Survey,
  SurveyQuestion,
  SurveyResponse,
} from '../../../src/types/survey';

/**
 * Extracts the Google Forms Form ID from various URL formats or raw string IDs
 */
export function extractFormId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Pattern 1: https://docs.google.com/forms/d/{formId}/...
  const dMatch = trimmed.match(/\/forms\/d\/([a-zA-Z0-9_-]{15,})/i);
  if (dMatch && dMatch[1]) {
    return dMatch[1];
  }

  // Pattern 2: https://docs.google.com/forms/d/e/{formId}/...
  const eMatch = trimmed.match(/\/forms\/d\/e\/([a-zA-Z0-9_-]{15,})/i);
  if (eMatch && eMatch[1]) {
    return eMatch[1];
  }

  // Pattern 3: https://docs.google.com/forms/u/0/d/{formId}/...
  const uMatch = trimmed.match(/\/forms\/u\/\d+\/d\/([a-zA-Z0-9_-]{15,})/i);
  if (uMatch && uMatch[1]) {
    return uMatch[1];
  }

  // Pattern 4: Raw form ID string (alphanumeric, underscores, hyphens, 15+ characters, no slashes)
  if (/^[a-zA-Z0-9_-]{15,}$/.test(trimmed) && !trimmed.includes('/')) {
    return trimmed;
  }

  return null;
}

/**
 * Maps Google Forms Item types to application QuestionType
 */
function mapFormItemToQuestionType(questionData: any): {
  type: QuestionType;
  options?: QuestionOption[];
  scaleConfig?: SurveyQuestion['scaleConfig'];
} {
  // Case 1: Choice Question (Multiple choice, Checkbox, Dropdown)
  if (questionData.choiceQuestion) {
    const choice = questionData.choiceQuestion;
    const choiceType = choice.type; // 'RADIO', 'CHECKBOX', 'DROP_DOWN'

    // Preserve exact options and original order
    const options: QuestionOption[] = (choice.options || []).map(
      (opt: any, idx: number) => {
        const val = opt.value || `Opção ${idx + 1}`;
        return {
          value: val,
          label: val,
          order: idx + 1,
        };
      }
    );

    if (choiceType === 'CHECKBOX') {
      return { type: 'checkbox', options };
    }
    if (choiceType === 'DROP_DOWN') {
      return { type: 'dropdown', options };
    }
    return { type: 'multiple_choice', options };
  }

  // Case 2: Scale Question (Linear Scale)
  if (questionData.scaleQuestion) {
    const scale = questionData.scaleQuestion;
    const min = typeof scale.low === 'number' ? scale.low : 1;
    const max = typeof scale.high === 'number' ? scale.high : 5;
    return {
      type: 'linear_scale',
      scaleConfig: {
        min,
        max,
        step: 1,
        minLabel: scale.lowLabel || undefined,
        maxLabel: scale.highLabel || undefined,
      },
    };
  }

  // Case 3: Text Question (Short Answer or Paragraph)
  if (questionData.textQuestion) {
    const isParagraph = Boolean(questionData.textQuestion.paragraph);
    return {
      type: isParagraph ? 'paragraph' : 'short_answer',
    };
  }

  // Case 4: Date Question
  if (questionData.dateQuestion) {
    return { type: 'date' };
  }

  // Case 5: Time Question
  if (questionData.timeQuestion) {
    return { type: 'time' };
  }

  // Fallback
  return { type: 'short_answer' };
}

/**
 * Generates default QuestionMapping based on Google Forms metadata rules
 */
export function generateFormQuestionMapping(question: SurveyQuestion): QuestionMapping {
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
      return {
        questionId: question.id,
        questionType: question.type,
        analysisMode: 'quantitative',
        visualization: 'distribution',
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
    case 'date':
    case 'time':
      return {
        questionId: question.id,
        questionType: question.type,
        analysisMode: 'quantitative',
        visualization: 'bar',
        confidence: 1.0,
        source: 'metadata',
      };
    default:
      return {
        questionId: question.id,
        questionType: 'unknown',
        analysisMode: 'mixed',
        visualization: 'auto',
        confidence: 0.8,
        source: 'metadata',
      };
  }
}

/**
 * Fetches form metadata and responses using the Google Forms API v1
 * and transforms them into a normalized Survey domain model.
 */
export async function getGoogleFormData(
  authClient: any,
  formId: string
): Promise<Survey> {
  const formsApi = google.forms({ version: 'v1', auth: authClient });

  // 1. Fetch Form Structure & Metadata
  let formMeta: any;
  try {
    const metaResponse = await formsApi.forms.get({ formId });
    formMeta = metaResponse.data;
  } catch (err: any) {
    const msg = err.message || '';
    if (msg.includes('404') || msg.includes('not found')) {
      throw new Error(
        `Formulário "${formId}" não encontrado. Verifique se o ID ou URL está correto.`
      );
    }
    if (msg.includes('403') || msg.includes('permission') || msg.includes('Forbidden')) {
      throw new Error(
        `Permissão insuficiente para acessar o formulário "${formId}". Compartilhe o formulário com o e-mail da Service Account com permissão de leitura.`
      );
    }
    throw new Error(`Erro na API Google Forms: ${msg}`);
  }

  // 2. Fetch Form Responses
  let rawResponses: any[] = [];
  try {
    const responsesResponse = await formsApi.forms.responses.list({ formId });
    rawResponses = responsesResponse.data.responses || [];
  } catch (err: any) {
    console.warn(`[Google Forms] Note: Could not fetch responses for ${formId}:`, err.message);
    // If responses list fails due to permissions or no responses yet, fallback to empty list
    rawResponses = [];
  }

  // 3. Extract and order Survey Questions
  const questions: SurveyQuestion[] = [];
  const mappings: Record<string, QuestionMapping> = {};

  const items = formMeta.items || [];
  let questionOrder = 1;

  for (const item of items) {
    // Standard Question Item
    if (item.questionItem && item.questionItem.question) {
      const q = item.questionItem.question;
      const questionId = q.questionId || item.itemId || `q_${questionOrder}`;
      const title = item.title || `Pergunta ${questionOrder}`;
      const description = item.description || undefined;
      const required = Boolean(q.required);

      const typeInfo = mapFormItemToQuestionType(q);

      const surveyQuestion: SurveyQuestion = {
        id: questionId,
        title,
        description,
        type: typeInfo.type,
        required,
        order: questionOrder,
        options: typeInfo.options,
        scaleConfig: typeInfo.scaleConfig,
      };

      questions.push(surveyQuestion);
      mappings[questionId] = generateFormQuestionMapping(surveyQuestion);
      questionOrder++;
    }

    // Question Group Item (e.g. Grid / Matrix)
    if (item.questionGroupItem && Array.isArray(item.questionGroupItem.questions)) {
      for (const subQ of item.questionGroupItem.questions) {
        const questionId = subQ.questionId || `q_${questionOrder}`;
        const subTitle = subQ.rowQuestion?.title
          ? `${item.title || 'Grupo'} - ${subQ.rowQuestion.title}`
          : item.title || `Pergunta ${questionOrder}`;

        const required = Boolean(subQ.required);
        const typeInfo = mapFormItemToQuestionType(subQ);

        const surveyQuestion: SurveyQuestion = {
          id: questionId,
          title: subTitle,
          description: item.description || undefined,
          type: typeInfo.type,
          required,
          order: questionOrder,
          options: typeInfo.options,
          scaleConfig: typeInfo.scaleConfig,
        };

        questions.push(surveyQuestion);
        mappings[questionId] = generateFormQuestionMapping(surveyQuestion);
        questionOrder++;
      }
    }
  }

  // 4. Map Responses by Question ID (Not position or text)
  const responses: SurveyResponse[] = rawResponses.map((r, rIdx) => {
    const respId = r.responseId || `resp_${rIdx + 1}`;
    const submittedAt = r.lastSubmittedTime || r.createTime || undefined;
    const respondentId = r.respondentEmail || respId;

    const answers: Record<string, any> = {};

    questions.forEach((q) => {
      const questionAnswerObj = r.answers?.[q.id];
      const textAnswersList = questionAnswerObj?.textAnswers?.answers;

      if (!textAnswersList || textAnswersList.length === 0) {
        answers[q.id] = q.type === 'checkbox' ? [] : null;
        return;
      }

      if (q.type === 'checkbox') {
        // Multi-select answers: array of selected option strings
        const selectedList = textAnswersList
          .map((a: any) => a.value)
          .filter((v: any) => v !== undefined && v !== null && String(v).trim() !== '');
        answers[q.id] = selectedList;
      } else if (q.type === 'linear_scale') {
        const firstVal = textAnswersList[0]?.value;
        const num = Number(firstVal);
        answers[q.id] = !isNaN(num) && firstVal !== undefined && firstVal !== null ? num : null;
      } else {
        // Single choice, short text, paragraph, date, time
        const firstVal = textAnswersList[0]?.value;
        answers[q.id] = firstVal !== undefined && firstVal !== null ? firstVal : null;
      }
    });

    return {
      id: respId,
      submittedAt,
      respondentId,
      answers,
    };
  });

  // 5. Build DataSource descriptor
  const formTitle = formMeta.info?.title || formMeta.info?.documentTitle || 'Formulário Google';
  const formDescription = formMeta.info?.description || undefined;

  const dataSource: DataSource = {
    type: 'google_forms',
    id: formId,
    name: formTitle,
    url: `https://docs.google.com/forms/d/${formId}/edit`,
    mimeType: 'application/vnd.google-apps.form',
    rowCount: responses.length,
    lastModified: new Date().toISOString(),
  };

  return {
    id: `survey_forms_${formId}_${Date.now()}`,
    name: formTitle,
    description: formDescription || `Pesquisa originada do Google Forms com ${questions.length} perguntas e ${responses.length} respostas coletadas.`,
    source: dataSource,
    createdAt: new Date().toISOString(),
    analyzedAt: new Date().toISOString(),
    questions,
    mappings,
    responses,
  };
}
