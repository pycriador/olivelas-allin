import React from 'react';
import {
  TrendingUp,
  Lightbulb,
  BarChart2,
} from 'lucide-react';
import { ProcessedSurveyData } from '../../types/statistics';
import { QuestionAnalysisState } from '../../types/ai';
import { Badge } from '../ui/Badge';

interface ExecutiveInsightsProps {
  processedData: ProcessedSurveyData;
  analysisMap?: Record<string, QuestionAnalysisState>;
  isDark?: boolean;
}

export function ExecutiveInsights({
  processedData,
  analysisMap,
}: ExecutiveInsightsProps) {
  const { questions } = processedData;

  // 1. Gather quantitative verified insights
  const quantitativeInsights: { title: string; text: string; icon: React.ReactNode; tag: string }[] = [];

  // Look for scale questions (e.g., productivity)
  const scaleQuestions = questions.filter((q) => q.stats.kind === 'scale');
  scaleQuestions.forEach((sq) => {
    if (sq.stats.kind === 'scale' && sq.stats.stats.totalAnswers > 0) {
      const stats = sq.stats.stats;
      const positivePercent = stats.distribution
        .filter((d) => d.score >= 4)
        .reduce((acc, curr) => acc + curr.percentage, 0);

      quantitativeInsights.push({
        title: sq.question.title,
        text: `Média consolidada de ${stats.average} (mediana ${stats.median}), com ${positivePercent}% de avaliações positivas (notas 4 e 5).`,
        icon: <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
        tag: 'Escala & Desempenho',
      });
    }
  });

  // Look for categorical mode / top selections
  const categoricalQuestions = questions.filter((q) => q.stats.kind === 'categorical');
  categoricalQuestions.forEach((cq) => {
    if (cq.stats.kind === 'categorical' && cq.stats.stats.frequencies.length > 0) {
      const topFreq = cq.stats.stats.frequencies[0];
      if (topFreq && topFreq.count > 0 && topFreq.percentage >= 30) {
        quantitativeInsights.push({
          title: cq.question.title,
          text: `Opção predominante: "${topFreq.label}" selecionada por ${topFreq.percentage}% dos respondentes válidos (${topFreq.count} respostas).`,
          icon: <BarChart2 className="w-4 h-4 text-theme-primary" />,
          tag: cq.question.type === 'checkbox' ? 'Multi-seleção' : 'Distribuição',
        });
      }
    }
  });

  // 2. Gather qualitative Gemini insights
  const qualitativeInsights: { title: string; text: string; tag: string; type: 'opportunity' | 'concern' | 'theme' }[] = [];

  Object.entries(analysisMap || {}).forEach(([qId, analysisState]) => {
    if (analysisState.status === 'completed' && analysisState.data) {
      const q = questions.find((item) => item.question.id === qId);
      const qTitle = q ? q.question.title : 'Pergunta Qualitativa';
      const data = analysisState.data;

      // Add high-impact opportunities
      if (data.opportunities && data.opportunities.length > 0) {
        qualitativeInsights.push({
          title: qTitle,
          text: data.opportunities[0],
          tag: 'Oportunidade IA',
          type: 'opportunity',
        });
      }

      // Add high-impact concerns
      if (data.concerns && data.concerns.length > 0) {
        qualitativeInsights.push({
          title: qTitle,
          text: data.concerns[0],
          tag: 'Ponto de Atenção',
          type: 'concern',
        });
      }

      // Add main recurring theme
      if (data.themes && data.themes.length > 0) {
        qualitativeInsights.push({
          title: qTitle,
          text: `Tema central: "${data.themes[0].name}" (${data.themes[0].percentage}% das menções) — ${data.themes[0].description}`,
          tag: 'Tema Recorrente',
          type: 'theme',
        });
      }
    }
  });

  // Combine top insights (up to 4 clean, high-value bullet items)
  const allInsights = [
    ...quantitativeInsights.slice(0, 2),
    ...qualitativeInsights.slice(0, 2),
  ];

  if (allInsights.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-theme bg-theme-surface p-5 shadow-xs text-theme-main">
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-theme">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-theme-primary-light text-theme-primary border border-theme">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-theme-main">
              Principais Insights Consolidados
            </h3>
            <p className="text-[11px] text-theme-muted">
              Síntese baseada exclusivamente em dados reais da pesquisa
            </p>
          </div>
        </div>

        <Badge variant="secondary" size="sm">
          {allInsights.length} achados destacados
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {allInsights.map((insight, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl border border-theme bg-theme-subtle/50 flex flex-col justify-between space-y-2 text-theme-main"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-semibold text-theme-main line-clamp-1">
                {insight.title}
              </span>
              <Badge variant="outline" size="sm" className="shrink-0 text-[10px]">
                {insight.tag}
              </Badge>
            </div>
            <p className="text-xs text-theme-muted leading-relaxed font-normal">
              {insight.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
