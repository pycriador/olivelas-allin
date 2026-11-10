import React, { useState, useMemo } from 'react';
import {
  Users,
  HelpCircle,
  BarChart2,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Layers,
  Activity,
  Briefcase,
  Zap,
  TrendingUp,
  AlertCircle,
  Cpu,
  Compass,
  Rows3,
} from 'lucide-react';
import { ProcessedSurveyData, ProcessedQuestionData } from '../../types/statistics';
import { QuestionAnalysisState } from '../../types/ai';
import { Badge } from '../ui/Badge';
import { QuestionCard } from './QuestionCard';
import { ChartFullscreenModal } from './ChartFullscreenModal';
import { ExecutiveInsights } from './ExecutiveInsights';
import { buildDynamicDashboardSections, DashboardSection } from '../../utils/sectionClassifier';

interface DashboardOverviewProps {
  processedData: ProcessedSurveyData;
  isDark?: boolean;
  onOpenMapping: (questionId: string) => void;
  analysisMap?: Record<string, QuestionAnalysisState>;
  onAnalyzeQuestion?: (questionId: string, bypassCache?: boolean) => void;
  onAnalyzeAllQualitative?: (bypassCache?: boolean) => void;
  isAnalyzingAll?: boolean;
  onRefreshData?: () => void;
  onDecimalPlacesChange?: (decimals: number) => void;
}

export function DashboardOverview({
  processedData,
  isDark = false,
  onOpenMapping,
  analysisMap,
  onAnalyzeQuestion,
  onAnalyzeAllQualitative,
  isAnalyzingAll = false,
  onRefreshData,
  onDecimalPlacesChange,
}: DashboardOverviewProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'quantitative' | 'qualitative' | 'scale'>('all');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [fullscreenQuestionId, setFullscreenQuestionId] = useState<string | null>(null);
  const [localDecimalPlaces, setLocalDecimalPlaces] = useState<number>(
    processedData.decimalPlaces ?? 2
  );

  const { overview, questions } = processedData;

  const handleDecimalChange = (decimals: number) => {
    const valid = Math.max(0, Math.min(2, decimals));
    setLocalDecimalPlaces(valid);
    onDecimalPlacesChange?.(valid);
  };

  const scaleCount = questions.filter((q) => q.question.type === 'linear_scale').length;

  const qualitativeQuestions = questions.filter(
    (q) => q.mapping.analysisMode === 'qualitative' || q.question.type === 'paragraph'
  );
  const completedQualitativeCount = qualitativeQuestions.filter(
    (q) => analysisMap?.[q.question.id]?.status === 'completed'
  ).length;

  // Build dynamic thematic sections
  const dynamicSections = useMemo(() => {
    return buildDynamicDashboardSections(questions);
  }, [questions]);

  // Section icon resolver
  const getSectionIcon = (iconName: DashboardSection['iconName']) => {
    switch (iconName) {
      case 'profile':
        return <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'ai':
        return <Cpu className="w-4 h-4 text-theme-primary" />;
      case 'productivity':
        return <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'benefits':
        return <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'difficulties':
        return <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'automation':
        return <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'qualitative':
        return <Sparkles className="w-4 h-4 text-theme-primary" />;
      default:
        return <Layers className="w-4 h-4 text-theme-muted" />;
    }
  };

  // Filter questions within a section based on filter mode
  const filterSectionQuestions = (sectionQuestions: ProcessedQuestionData[]) => {
    return sectionQuestions.filter((item) => {
      if (filterMode === 'quantitative') {
        return item.mapping.analysisMode === 'quantitative' && item.question.type !== 'linear_scale';
      }
      if (filterMode === 'qualitative') {
        return item.mapping.analysisMode === 'qualitative' || item.question.type === 'paragraph';
      }
      if (filterMode === 'scale') {
        return item.question.type === 'linear_scale';
      }
      return true;
    });
  };

  const scrollToSection = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    if (sectionId === 'all') return;
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-6 text-theme-main">
      {/* 1. Top High-Level Metrics Bento & Average Completion Rate */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Total Respondentes */}
        <div className="bg-theme-surface p-4 rounded-xl border border-theme shadow-xs text-theme-main">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">
              Respondentes
            </span>
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-theme-main">
              {overview.totalRespondents}
            </span>
            <Badge variant="success" size="sm" className="text-[10px]">
              {overview.totalRespondents > 0 ? 'Válidos' : '0'}
            </Badge>
          </div>
          <p className="text-[11px] text-theme-muted mt-1">Registros individuais</p>
        </div>

        {/* Total de Perguntas */}
        <div className="bg-theme-surface p-4 rounded-xl border border-theme shadow-xs text-theme-main">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">
              Total Perguntas
            </span>
            <div className="p-1.5 rounded-md bg-theme-subtle text-theme-main">
              <HelpCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-theme-main">
              {overview.totalQuestions}
            </span>
            <span className="text-[11px] text-theme-muted font-medium">
              {questions.length} campos
            </span>
          </div>
          <p className="text-[11px] text-theme-muted mt-1">Metadados normalizados</p>
        </div>

        {/* Perguntas Quantitativas */}
        <div className="bg-theme-surface p-4 rounded-xl border border-theme shadow-xs text-theme-main">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">
              Quantitativas
            </span>
            <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <BarChart2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-theme-main">
              {overview.quantitativeQuestions}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              Gráficos
            </span>
          </div>
          <p className="text-[11px] text-theme-muted mt-1">Estatísticas descritivas</p>
        </div>

        {/* Perguntas Qualitativas */}
        <div className="bg-theme-surface p-4 rounded-xl border border-theme shadow-xs border-l-4 border-l-theme-primary text-theme-main">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">
              Qualitativas
            </span>
            <div className="p-1.5 rounded-md bg-theme-primary-light text-theme-primary">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-theme-main">
              {overview.qualitativeQuestions}
            </span>
            {completedQualitativeCount > 0 ? (
              <Badge variant="purple" size="sm" className="text-[10px]">
                {completedQualitativeCount}/{qualitativeQuestions.length} com IA
              </Badge>
            ) : (
              <Badge variant="outline" size="sm" className="text-[10px]">
                Gemini
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-theme-muted mt-1">Síntese semântica</p>
        </div>

        {/* Taxa Média de Preenchimento */}
        <div className="col-span-2 md:col-span-1 bg-theme-surface p-4 rounded-xl border border-theme shadow-xs text-theme-main">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">
              Taxa Preenchimento
            </span>
            <div className="p-1.5 rounded-md bg-theme-primary-light text-theme-primary">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-theme-primary">
              {overview.completionRate.toFixed(localDecimalPlaces).replace('.', ',')}%
            </span>
            <span className="text-[11px] text-theme-muted font-medium">
              global
            </span>
          </div>
          <p className="text-[11px] text-theme-muted mt-1">Respostas válidas coletadas</p>
        </div>
      </div>

      {/* 2. Executive Consolidated Real Insights */}
      <ExecutiveInsights
        processedData={processedData}
        analysisMap={analysisMap}
        isDark={isDark}
      />

      {/* 3. Global Qualitative AI Batch Banner */}
      {qualitativeQuestions.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-theme bg-theme-surface shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-theme-primary text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-theme-main">
                  Camada Qualitativa com Inteligência Artificial
                </h4>
                <Badge variant="purple" size="sm">
                  {completedQualitativeCount} de {qualitativeQuestions.length} prontas
                </Badge>
              </div>
              <p className="text-[11px] text-theme-muted mt-0.5">
                Respostas abertas são interpretadas semanticamente pelo Gemini para gerar resumos executivos, temas recorrentes e oportunidades.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAnalyzeAllQualitative?.(completedQualitativeCount > 0)}
              disabled={isAnalyzingAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-theme-primary hover:bg-theme-primary-hover transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isAnalyzingAll ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Sintetizando todas as perguntas...
                </>
              ) : completedQualitativeCount === qualitativeQuestions.length && qualitativeQuestions.length > 0 ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reanalisar todas com IA
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Analisar todas as qualitativas ({qualitativeQuestions.length})
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 4. Section Jump Navigation Bar & Filter Controls */}
      <div className="sticky top-16 z-20 bg-theme-surface/95 backdrop-blur-md p-3 rounded-xl border border-theme shadow-xs space-y-3">
        {/* Thematic Section Quick Navigation Anchors */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Compass className="w-3 h-3 text-theme-primary" />
            Seções:
          </span>
          <button
            onClick={() => scrollToSection('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedSectionId === 'all'
                ? 'bg-theme-primary text-white font-semibold shadow-xs'
                : 'text-theme-muted hover:text-theme-main hover:bg-theme-subtle'
            }`}
          >
            Todas as Seções ({dynamicSections.length})
          </button>
          {dynamicSections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => scrollToSection(sec.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedSectionId === sec.id
                  ? 'bg-theme-primary-light text-theme-primary-text font-semibold border border-theme'
                  : 'text-theme-muted hover:text-theme-main hover:bg-theme-subtle'
              }`}
            >
              {getSectionIcon(sec.iconName)}
              <span>{sec.title}</span>
              <span className="text-[10px] opacity-70">({sec.questions.length})</span>
            </button>
          ))}
        </div>

        {/* Filter Type Mode Bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap border-t border-theme pt-2.5">
          <div className="flex items-center gap-1.5 bg-theme-subtle p-1 rounded-lg border border-theme">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-theme-surface text-theme-main shadow-xs font-semibold border border-theme'
                  : 'text-theme-muted hover:text-theme-main'
              }`}
            >
              Todas as Perguntas ({questions.length})
            </button>
            <button
              onClick={() => setFilterMode('quantitative')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                filterMode === 'quantitative'
                  ? 'bg-theme-surface text-theme-main shadow-xs font-semibold border border-theme'
                  : 'text-theme-muted hover:text-theme-main'
              }`}
            >
              Quantitativas ({overview.quantitativeQuestions})
            </button>
            <button
              onClick={() => setFilterMode('scale')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                filterMode === 'scale'
                  ? 'bg-theme-surface text-theme-main shadow-xs font-semibold border border-theme'
                  : 'text-theme-muted hover:text-theme-main'
              }`}
            >
              Escalas ({scaleCount})
            </button>
            <button
              onClick={() => setFilterMode('qualitative')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                filterMode === 'qualitative'
                  ? 'bg-theme-surface text-theme-primary shadow-xs font-semibold border border-theme'
                  : 'text-theme-muted hover:text-theme-main'
              }`}
            >
              Qualitativas ({overview.qualitativeQuestions})
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Decimal Precision Control */}
            <div className="flex items-center gap-1.5 text-xs text-theme-muted bg-theme-subtle px-2.5 py-1 rounded-lg border border-theme">
              <span className="font-semibold text-theme-main">Casas decimais:</span>
              <div className="inline-flex rounded-md bg-theme-surface border border-theme p-0.5">
                {[0, 1, 2].map((dec) => (
                  <button
                    key={dec}
                    onClick={() => handleDecimalChange(dec)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      localDecimalPlaces === dec
                        ? 'bg-theme-primary text-white shadow-xs'
                        : 'text-theme-muted hover:text-theme-main'
                    }`}
                    title={`Exibir números e porcentagens com ${dec} casas decimais (máx 2)`}
                  >
                    {dec}
                  </button>
                ))}
              </div>
            </div>

            {/* 1 Chart Per Row Indicator */}
            <div className="hidden sm:inline-flex items-center gap-1 text-[11px] text-theme-muted font-medium px-2 py-1 rounded-lg bg-theme-subtle border border-theme">
              <Rows3 className="w-3.5 h-3.5 text-theme-primary" />
              <span>1 gráfico por linha</span>
            </div>

            {onRefreshData && (
              <button
                onClick={onRefreshData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-theme-main bg-theme-subtle hover:opacity-90 border border-theme transition-colors cursor-pointer"
                title="Recalcular estatísticas e atualizar dados"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Atualizar dados</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Dynamic Thematic Sections Feed - Strictly 1 chart per line */}
      <div className="space-y-12">
        {dynamicSections
          .filter((sec) => selectedSectionId === 'all' || selectedSectionId === sec.id)
          .map((section, sIdx) => {
            const sectionFilteredQuestions = filterSectionQuestions(section.questions);

            if (sectionFilteredQuestions.length === 0) {
              return null;
            }

            return (
              <section
                key={section.id}
                id={section.id}
                className="space-y-4 scroll-mt-36"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between gap-3 border-b border-theme pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-theme-subtle border border-theme">
                      {getSectionIcon(section.iconName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">
                          Seção {sIdx + 1}
                        </span>
                        <h2 className="text-base font-bold text-theme-main">
                          {section.title}
                        </h2>
                      </div>
                      <p className="text-xs text-theme-muted">
                        {section.description}
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline" size="sm" className="font-semibold text-xs">
                    {sectionFilteredQuestions.length} {sectionFilteredQuestions.length === 1 ? 'pergunta' : 'perguntas'}
                  </Badge>
                </div>

                {/* Section Questions - Strictly 1 chart per line (Full width) */}
                <div className="flex flex-col gap-6 w-full">
                  {sectionFilteredQuestions.map((qData) => (
                    <div key={qData.question.id} className="w-full">
                      <QuestionCard
                        data={qData}
                        isDark={isDark}
                        onOpenMapping={onOpenMapping}
                        onOpenFullscreen={(qId) => setFullscreenQuestionId(qId)}
                        analysisState={analysisMap?.[qData.question.id]}
                        onAnalyze={onAnalyzeQuestion}
                        decimalPlaces={localDecimalPlaces}
                      />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
      </div>

      {/* Fullscreen Chart Modal */}
      {fullscreenQuestionId && (
        <ChartFullscreenModal
          data={questions.find((q) => q.question.id === fullscreenQuestionId) || null}
          isOpen={Boolean(fullscreenQuestionId)}
          onClose={() => setFullscreenQuestionId(null)}
          isDark={isDark}
          decimalPlaces={localDecimalPlaces}
          onDecimalPlacesChange={handleDecimalChange}
        />
      )}
    </div>
  );
}
