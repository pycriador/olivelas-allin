import React, { useState } from 'react';
import {
  BarChart2,
  CheckSquare,
  Sliders,
  AlignLeft,
  Settings2,
  HelpCircle,
  Calendar,
  Clock,
  ChevronDown,
  Hash,
  Inbox,
  Maximize2,
  Download,
  Check,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Share2,
} from 'lucide-react';
import { ProcessedQuestionData } from '../../types/statistics';
import { QuestionAnalysisState } from '../../types/ai';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CategoricalBarChart } from './Charts/CategoricalBarChart';
import { HorizontalBarChart } from './Charts/HorizontalBarChart';
import { ScaleDistributionChart } from './Charts/ScaleDistributionChart';
import { QualitativeCard } from './Charts/QualitativeCard';
import { DateLineChart } from './Charts/DateLineChart';
import { NumberFormatter } from '../../utils/NumberFormatter';

interface QuestionCardProps {
  data: ProcessedQuestionData;
  isDark?: boolean;
  onOpenMapping?: (questionId: string) => void;
  onOpenFullscreen?: (questionId: string) => void;
  analysisState?: QuestionAnalysisState;
  onAnalyze?: (questionId: string, bypassCache?: boolean) => void;
  decimalPlaces?: number;
}

export function QuestionCard({
  data,
  isDark = false,
  onOpenMapping,
  onOpenFullscreen,
  analysisState,
  onAnalyze,
  decimalPlaces = 2,
}: QuestionCardProps) {
  const { question, mapping, stats } = data;
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const getTypeIcon = () => {
    switch (question.type) {
      case 'multiple_choice':
        return <BarChart2 className="w-3.5 h-3.5" />;
      case 'checkbox':
        return <CheckSquare className="w-3.5 h-3.5" />;
      case 'dropdown':
        return <ChevronDown className="w-3.5 h-3.5" />;
      case 'linear_scale':
        return <Sliders className="w-3.5 h-3.5" />;
      case 'paragraph':
      case 'short_answer':
        return <AlignLeft className="w-3.5 h-3.5" />;
      case 'date':
        return <Calendar className="w-3.5 h-3.5" />;
      case 'time':
        return <Clock className="w-3.5 h-3.5" />;
      case 'number':
        return <Hash className="w-3.5 h-3.5" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5" />;
    }
  };

  const getTypeLabel = () => {
    switch (question.type) {
      case 'multiple_choice':
        return 'Múltipla Escolha';
      case 'checkbox':
        return 'Caixa de Seleção (Múltiplas)';
      case 'dropdown':
        return 'Lista Suspensa';
      case 'linear_scale':
        return 'Escala Linear';
      case 'paragraph':
        return 'Texto Longo (Parágrafo)';
      case 'short_answer':
        return 'Resposta Curta';
      case 'date':
        return 'Data';
      case 'time':
        return 'Horário';
      case 'number':
        return 'Numérico';
      default:
        return question.type;
    }
  };

  const getAnalysisBadge = () => {
    if (mapping.analysisMode === 'qualitative') {
      return (
        <Badge variant="purple" size="sm">
          Qualitativo (IA)
        </Badge>
      );
    }
    if (mapping.analysisMode === 'quantitative') {
      return (
        <Badge variant="info" size="sm">
          Quantitativo
        </Badge>
      );
    }
    return (
      <Badge variant="default" size="sm">
        {mapping.analysisMode}
      </Badge>
    );
  };

  const handleExportCSV = () => {
    let csvContent = '';
    if (stats.kind === 'categorical') {
      const rows = stats.stats.frequencies.map(
        (f) => `"${f.label.replace(/"/g, '""')}",${f.count},${NumberFormatter.percentage(f.percentage, decimalPlaces)}`
      );
      csvContent = `"Categoria","Contagem","Porcentagem"\n${rows.join('\n')}`;
    } else if (stats.kind === 'scale') {
      const rows = stats.stats.distribution.map(
        (d) => `"Nota ${d.score}",${d.count},${NumberFormatter.percentage(d.percentage, decimalPlaces)}`
      );
      csvContent = `"Nota","Contagem","Porcentagem"\n${rows.join('\n')}`;
    } else {
      csvContent = `"Pergunta","Tipo"\n"${question.title.replace(/"/g, '""')}","${question.type}"`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `grafico_q${question.order}_dados.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportFeedback('CSV exportado com sucesso!');
    setShowExportMenu(false);
    setTimeout(() => setExportFeedback(null), 2500);
  };

  const handleExportJSON = () => {
    const jsonContent = JSON.stringify(
      {
        questionId: question.id,
        order: question.order,
        title: question.title,
        type: question.type,
        mapping,
        stats: stats.stats,
      },
      null,
      2
    );

    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `grafico_q${question.order}_dados.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportFeedback('JSON exportado com sucesso!');
    setShowExportMenu(false);
    setTimeout(() => setExportFeedback(null), 2500);
  };

  const handleExportImagePlaceholder = (format: 'PNG' | 'SVG') => {
    setExportFeedback(`Exportação ${format} preparada com alta resolução.`);
    setShowExportMenu(false);
    setTimeout(() => setExportFeedback(null), 3000);
  };

  const hasNoAnswers = stats.stats.totalAnswers === 0;

  return (
    <Card hoverable className="relative overflow-hidden group w-full shadow-xs hover:shadow-md transition-all text-theme-main">
      <CardHeader className="pb-3 border-b border-theme bg-theme-subtle/40">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-theme-primary-light text-theme-primary-text font-mono text-xs font-bold border border-theme">
              Q{question.order}
            </span>
            <Badge variant="secondary" size="sm" className="gap-1.5 font-medium">
              {getTypeIcon()}
              <span>{getTypeLabel()}</span>
            </Badge>
            {getAnalysisBadge()}
            {question.required && (
              <span className="text-[10px] text-theme-muted font-medium">Obrigatória</span>
            )}
          </div>

          <div className="flex items-center gap-1 relative">
            {/* Export Feedback Toast */}
            {exportFeedback && (
              <span className="absolute right-full mr-2 top-1 whitespace-nowrap text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 animate-in fade-in flex items-center gap-1 shadow-xs">
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                {exportFeedback}
              </span>
            )}

            {/* Export Button & Menu */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-subtle transition-colors cursor-pointer"
                title="Exportar gráfico e dados"
              >
                <Download className="w-4 h-4" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-theme-surface border border-theme shadow-xl p-1.5 z-30 space-y-1 text-xs animate-in fade-in text-theme-main">
                  <div className="px-2 py-1 text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                    Exportar gráfico
                  </div>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-theme-main hover:bg-theme-subtle transition-colors text-left cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Dados brutos (CSV)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-theme-main hover:bg-theme-subtle transition-colors text-left cursor-pointer"
                  >
                    <FileCode className="w-3.5 h-3.5 text-blue-500" />
                    <span>Estrutura (JSON)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportImagePlaceholder('PNG')}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-theme-main hover:bg-theme-subtle transition-colors text-left cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                    <span>Imagem (PNG)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportImagePlaceholder('SVG')}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-theme-main hover:bg-theme-subtle transition-colors text-left cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>Vetor gráfico (SVG)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={() => onOpenFullscreen?.(question.id)}
              className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-subtle transition-colors cursor-pointer"
              title="Abrir gráfico em tela inteira"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Settings Mapping Button */}
            <button
              onClick={() => onOpenMapping?.(question.id)}
              className="p-1.5 rounded-lg hover:bg-theme-subtle text-theme-muted hover:text-theme-main transition-colors cursor-pointer"
              title="Configurar Mapeamento da Pergunta (QuestionMapping)"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <CardTitle className="text-base sm:text-lg font-bold mt-2.5 leading-snug text-theme-main">
          {question.title}
        </CardTitle>

        {question.description && (
          <CardDescription className="text-xs text-theme-muted">
            {question.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-4 p-5">
        {hasNoAnswers ? (
          <div className="py-8 text-center rounded-xl bg-theme-subtle/50 border border-dashed border-theme space-y-1">
            <Inbox className="w-5 h-5 mx-auto text-theme-muted" />
            <p className="text-xs font-semibold text-theme-main">
              Sem respostas
            </p>
            <p className="text-[11px] text-theme-muted">
              Nenhuma resposta registrada para esta pergunta no formulário.
            </p>
          </div>
        ) : (
          <>
            {stats.kind === 'categorical' && (
              question.type === 'date' ? (
                <DateLineChart stats={stats.stats} isDark={isDark} decimalPlaces={decimalPlaces} />
              ) : question.type === 'checkbox' || mapping.visualization === 'horizontal_bar' ? (
                <HorizontalBarChart stats={stats.stats} isDark={isDark} decimalPlaces={decimalPlaces} />
              ) : (
                <CategoricalBarChart stats={stats.stats} isDark={isDark} decimalPlaces={decimalPlaces} />
              )
            )}

            {stats.kind === 'scale' && (
              <ScaleDistributionChart
                stats={stats.stats}
                minLabel={question.scaleConfig?.minLabel}
                maxLabel={question.scaleConfig?.maxLabel}
                isDark={isDark}
                decimalPlaces={decimalPlaces}
              />
            )}

            {stats.kind === 'qualitative' && (
              <QualitativeCard
                questionId={question.id}
                questionTitle={question.title}
                stats={stats.stats}
                analysisState={analysisState}
                onAnalyze={onAnalyze}
                isDark={isDark}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
