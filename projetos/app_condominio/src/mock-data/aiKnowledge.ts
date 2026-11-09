import { AiSearchResult } from '../types';

export const mockAiKnowledge: Record<string, AiSearchResult> = {
  mudanca: {
    query: 'Qual é o horário permitido para mudanças?',
    answer: 'Segundo o Regimento Interno, mudanças são permitidas exclusivamente de segunda a sexta-feira das 08:00 às 18:00, e aos sábados das 08:00 às 12:00. É expressamente proibida a realização de mudanças aos domingos e feriados.',
    sourceDocTitle: 'Regimento Interno Consolidado (Atualizado 2025)',
    pageNumber: 14,
    excerpt: 'Capítulo IV — Das Mudanças e Cargas: Art. 18. O transporte de mudanças, móveis e cargas pesadas deverá ser agendado com 48h de antecedência junto à administração e ocorrerá impreterivelmente nos dias úteis (08h às 18h) e sábados (08h às 12h)...',
    confidence: 0.98,
  },
  piscina: {
    query: 'Qual o horário de funcionamento da piscina?',
    answer: 'A piscina e o deck molhado funcionam de terça-feira a domingo, das 07:00 às 22:00. Às segundas-feiras a área permanece fechada para realização de manutenção preventiva e tratamento químico da água.',
    sourceDocTitle: 'Regulamento de Uso das Piscinas e Áreas Molhadas',
    pageNumber: 3,
    excerpt: 'Art. 4º — O parque aquático estará disponível aos moradores e convidados de terça a domingo, das 07h00 às 22h00. Toda segunda-feira o complexo permanece interditado para decantação e aspiração.',
    confidence: 0.96,
  },
  domingo: {
    query: 'Posso fazer mudança no domingo?',
    answer: 'Não. Conforme o Artigo 18 do Regimento Interno, mudanças aos domingos e feriados nacionais/municipais são terminantemente proibidas para garantir a tranquilidade e descanso dos moradores.',
    sourceDocTitle: 'Regimento Interno Consolidado (Atualizado 2025)',
    pageNumber: 15,
    excerpt: 'Parágrafo 2º — Fica expressamente vedada a realização de qualquer tipo de mudança ou içamento de móveis aos domingos e feriados, sob pena de multa de 1 cota condominial.',
    confidence: 0.99,
  },
  animais: {
    query: 'Qual é a regra para animais de estimação (pets)?',
    answer: 'Animais domésticos são bem-vindos no condomínio. Nas áreas sociais, elevadores e corredores, devem ser transportados com guia curta ou no colo. O único local onde é permitido soltar o pet para brincar sem guia é o Pet Place & Agility Park.',
    sourceDocTitle: 'Manual de Convivência e Regras para Animais de Estimação (Pets)',
    pageNumber: 4,
    excerpt: 'Art. 7º — O trânsito de cães e gatos pelas áreas comuns deverá ocorrer sempre com coleira e guia curta. É obrigatório o recolhimento imediato de quaisquer dejetos.',
    confidence: 0.95,
  },
  obra: {
    query: 'Quando foi aprovada a última grande obra?',
    answer: 'A última grande obra (Restauração e impermeabilização da fachada externa) foi aprovada por maioria qualificada na Assembleia Geral Extraordinária (AGE) realizada em 28 de novembro de 2025, com a Construtora Alfa Engenharia.',
    sourceDocTitle: 'Ata da Assembleia Geral Extraordinária (AGE) — Obra da Fachada',
    pageNumber: 2,
    excerpt: 'Item 2 da Pauta — Aberta a votação, aprovou-se por 48 votos favoráveis a contratação da proposta técnica da Construtora Alfa com previsão de início para janeiro de 2026.',
    confidence: 0.94,
  },
  salao: {
    query: 'Como funciona a reserva do salão de festas?',
    answer: 'A reserva do Salão de Festas Principal deve ser solicitada com no mínimo 48 horas de antecedência pelo aplicativo. A taxa de utilização é de R$ 250,00 + R$ 150,00 de taxa de limpeza. O horário permitido para eventos é das 10:00 às 23:00.',
    sourceDocTitle: 'Tabela de Tarifas de Áreas Comuns e Taxas de Limpeza 2026',
    pageNumber: 1,
    excerpt: 'Cláusula 3ª — O Salão Principal comporta até 80 convidados e conta com isolamento acústico até 22h. A vistoria é realizada no dia útil seguinte.',
    confidence: 0.97,
  },
};

export function searchAiKnowledge(query: string): AiSearchResult {
  const normalized = query.toLowerCase();
  if (normalized.includes('mudan') || normalized.includes('horario') || normalized.includes('horário')) {
    if (normalized.includes('domingo')) return mockAiKnowledge.domingo;
    if (normalized.includes('piscina')) return mockAiKnowledge.piscina;
    return mockAiKnowledge.mudanca;
  }
  if (normalized.includes('piscina') || normalized.includes('deck') || normalized.includes('nadar')) {
    return mockAiKnowledge.piscina;
  }
  if (normalized.includes('domingo') || normalized.includes('feriado')) {
    return mockAiKnowledge.domingo;
  }
  if (normalized.includes('animal') || normalized.includes('pet') || normalized.includes('cachorro') || normalized.includes('gato')) {
    return mockAiKnowledge.animais;
  }
  if (normalized.includes('obra') || normalized.includes('reforma') || normalized.includes('fachada') || normalized.includes('aprovada')) {
    return mockAiKnowledge.obra;
  }
  if (normalized.includes('salão') || normalized.includes('salao') || normalized.includes('festa') || normalized.includes('churrasqueira')) {
    return mockAiKnowledge.salao;
  }

  // Fallback realistic response
  return {
    query,
    answer: `De acordo com a Convenção e Regimento Interno do condomínio, os procedimentos sobre "${query}" devem seguir as diretrizes deliberadas na última Assembleia Geral. Para solicitações específicas, recomendamos abrir um chamado na aba de Solicitações ou consultar o síndico.`,
    sourceDocTitle: 'Regimento Interno Consolidado (Atualizado 2025)',
    pageNumber: 8,
    excerpt: 'Capítulo II — Dos Direitos e Deveres dos Condôminos: É dever zelar pela guarda e boa utilização das áreas comuns...',
    confidence: 0.89,
  };
}
