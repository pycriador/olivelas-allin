import { ProcessedQuestionData } from '../types/statistics';

export interface DashboardSection {
  id: string;
  title: string;
  description: string;
  iconName: 'overview' | 'profile' | 'ai' | 'productivity' | 'benefits' | 'difficulties' | 'automation' | 'qualitative' | 'general';
  questions: ProcessedQuestionData[];
}

export type SectionKey =
  | 'profile'
  | 'ai_usage'
  | 'productivity'
  | 'benefits'
  | 'difficulties'
  | 'automation'
  | 'qualitative'
  | 'general';

/**
 * Classifies a question into a thematic section dynamically using keywords and question characteristics.
 * Does not depend on exact string matches, but on semantic keyword heuristics in Portuguese and English.
 */
export function classifyQuestion(item: ProcessedQuestionData): SectionKey {
  const { question, mapping } = item;

  // 1. Qualitative mode or paragraph type always belongs to qualitative section
  if (mapping.analysisMode === 'qualitative' || question.type === 'paragraph') {
    return 'qualitative';
  }

  const textToAnalyze = `${question.title} ${question.description || ''} ${(question.options || []).map((o) => o.label).join(' ')}`.toLowerCase();

  // 2. Perfil dos respondentes (Demographics, Role, Team, Experience)
  const profileKeywords = [
    'cargo',
    'área',
    'area',
    'setor',
    'departamento',
    'time',
    'equipe',
    'papel',
    'função',
    'funcao',
    'senioridade',
    'experiência',
    'experiencia',
    'tempo de empresa',
    'tempo de experiência',
    'faixa etária',
    'idade',
    'gênero',
    'genero',
    'formação',
    'localização',
    'unidade',
    'filial',
    'role',
    'department',
    'seniority',
    'experience',
    'demographic',
  ];
  if (profileKeywords.some((kw) => textToAnalyze.includes(kw))) {
    return 'profile';
  }

  // 3. Uso de Inteligência Artificial (Tools, Frequency, Familiarity)
  const aiKeywords = [
    'ferramenta',
    'inteligência artificial',
    'inteligencia artificial',
    'ia generativa',
    'chatgpt',
    'gpt',
    'gemini',
    'copilot',
    'claude',
    'llm',
    'frequência de uso',
    'frequencia de uso',
    'adota',
    'adotou',
    'utiliza ia',
    'usa ia',
    'familiaridade',
    'conhecimento sobre ia',
    'ai tools',
    'frequency of use',
  ];
  if (aiKeywords.some((kw) => textToAnalyze.includes(kw))) {
    return 'ai_usage';
  }

  // 4. Produtividade (Scale, Ratings, Time Saved)
  const productivityKeywords = [
    'produtividade',
    'produtivo',
    'tempo economizado',
    'economia de tempo',
    'agilidade',
    'velocidade',
    'escala de produtividade',
    'impacto no tempo',
    'horas economizadas',
    'eficiência',
    'eficiencia',
    'productivity',
    'efficiency',
    'time saved',
  ];
  if (
    productivityKeywords.some((kw) => textToAnalyze.includes(kw)) ||
    (question.type === 'linear_scale' && textToAnalyze.includes('impacto'))
  ) {
    return 'productivity';
  }

  // 5. Benefícios e impactos
  const benefitsKeywords = [
    'benefício',
    'beneficio',
    'impacto positivo',
    'vantagem',
    'ganho',
    'melhoria',
    'qualidade',
    'assertividade',
    'precisão do trabalho',
    'resultado positivo',
    'beneficial',
    'benefit',
    'advantage',
    'positive impact',
  ];
  if (benefitsKeywords.some((kw) => textToAnalyze.includes(kw))) {
    return 'benefits';
  }

  // 6. Dificuldades, Barreiras e Riscos
  const difficultyKeywords = [
    'dificuldade',
    'desafio',
    'barreira',
    'risco',
    'preocupação',
    'preocupacao',
    'limitação',
    'limitacao',
    'alucinação',
    'alucinacao',
    'falta de precisão',
    'segurança',
    'seguranca',
    'privacidade',
    'medo',
    'bloqueio',
    'gargalo',
    'challenge',
    'barrier',
    'difficulty',
    'risk',
    'limitation',
  ];
  if (difficultyKeywords.some((kw) => textToAnalyze.includes(kw))) {
    return 'difficulties';
  }

  // 7. Automação
  const automationKeywords = [
    'automação',
    'automacao',
    'automatizar',
    'automatizado',
    'tarefa repetitiva',
    'rotina',
    'processo automatizável',
    'integração',
    'workflow',
    'pipeline',
    'automate',
    'automation',
    'repetitive tasks',
  ];
  if (automationKeywords.some((kw) => textToAnalyze.includes(kw))) {
    return 'automation';
  }

  // 8. Default fallback for general questions
  return 'general';
}

/**
 * Builds dynamic dashboard sections with assigned questions.
 * Preserves the exact 8-stage thematic structure requested in the spec.
 */
export function buildDynamicDashboardSections(
  questions: ProcessedQuestionData[]
): DashboardSection[] {
  const sectionDefinitions: Record<
    SectionKey,
    { title: string; description: string; iconName: DashboardSection['iconName'] }
  > = {
    profile: {
      title: 'Perfil dos Respondentes',
      description: 'Distribuição demográfica, áreas de atuação e características do grupo',
      iconName: 'profile',
    },
    ai_usage: {
      title: 'Uso de Inteligência Artificial',
      description: 'Adoção de ferramentas, frequência e níveis de familiaridade com IA',
      iconName: 'ai',
    },
    productivity: {
      title: 'Produtividade & Desempenho',
      description: 'Avaliação de ganho de eficiência, tempo economizado e métricas em escala',
      iconName: 'productivity',
    },
    benefits: {
      title: 'Benefícios & Impactos',
      description: 'Principais vantagens percebidas e ganhos de qualidade nas rotinas de trabalho',
      iconName: 'benefits',
    },
    difficulties: {
      title: 'Dificuldades & Barreiras',
      description: 'Desafios técnicos, preocupações com precisão, segurança e limitações relatadas',
      iconName: 'difficulties',
    },
    automation: {
      title: 'Oportunidades de Automação',
      description: 'Processos com potencial de automação e tarefas repetitivas identificadas',
      iconName: 'automation',
    },
    qualitative: {
      title: 'Análise Qualitativa & Respostas Abertas',
      description: 'Síntese semântica por IA, temas recorrentes e citações representativas',
      iconName: 'qualitative',
    },
    general: {
      title: 'Outras Perguntas & Métricas',
      description: 'Perguntas e indicadores complementares da pesquisa',
      iconName: 'general',
    },
  };

  const buckets: Record<SectionKey, ProcessedQuestionData[]> = {
    profile: [],
    ai_usage: [],
    productivity: [],
    benefits: [],
    difficulties: [],
    automation: [],
    qualitative: [],
    general: [],
  };

  questions.forEach((q) => {
    const key = classifyQuestion(q);
    buckets[key].push(q);
  });

  // Ordered list of sections to present (only non-empty ones)
  const orderedKeys: SectionKey[] = [
    'profile',
    'ai_usage',
    'productivity',
    'benefits',
    'difficulties',
    'automation',
    'qualitative',
    'general',
  ];

  const result: DashboardSection[] = [];

  orderedKeys.forEach((key) => {
    if (buckets[key].length > 0) {
      result.push({
        id: `section-${key}`,
        title: sectionDefinitions[key].title,
        description: sectionDefinitions[key].description,
        iconName: sectionDefinitions[key].iconName,
        questions: buckets[key],
      });
    }
  });

  return result;
}
