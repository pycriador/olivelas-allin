import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sliders,
  Sparkles,
  BarChart2,
  PieChart,
  Table as TableIcon,
  Eye,
  Trash2,
  Plus,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Database,
  Filter,
  Check,
  AlignLeft,
  Activity,
  Rows3,
} from 'lucide-react';
import {
  AnalysisMode,
  QuestionMapping,
  QuestionOption,
  QuestionType,
  Survey,
  SurveyQuestion,
  VisualizationType,
} from '../../types/survey';
import { DataProfiler, DataProfilerResult, ColumnProfile } from '../../services/data/dataProfiler';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { normalizeCategory } from '../../utils/normalization';
import { formatPercentage, formatNumber } from '../../utils/numberFormatting';

interface SurveyMappingReviewModalProps {
  isOpen: boolean;
  survey: Survey | null;
  profilerResult?: DataProfilerResult | null;
  onClose: () => void;
  onConfirm: (reviewedSurvey: Survey) => void;
}

export function SurveyMappingReviewModal({
  isOpen,
  survey,
  profilerResult,
  onClose,
  onConfirm,
}: SurveyMappingReviewModalProps) {
  if (!isOpen || !survey) return null;

  // Local state for interactive editing of questions and mappings
  const [questions, setQuestions] = useState<SurveyQuestion[]>(survey.questions);
  const [mappings, setMappings] = useState<Record<string, QuestionMapping>>(survey.mappings);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(
    survey.questions[0]?.id || ''
  );
  const [newOptionInput, setNewOptionInput] = useState<string>('');
  const [decimalPlaces, setDecimalPlaces] = useState<number>(survey.decimalPlaces ?? 2);

  // Fallback to computing profiler if not directly passed
  const profilesMap = React.useMemo(() => {
    const map = new Map<string, ColumnProfile>();
    if (profilerResult?.columnProfiles) {
      profilerResult.columnProfiles.forEach((p, idx) => {
        const qId = questions[idx]?.id || `q_${idx + 1}`;
        map.set(qId, p);
      });
    }
    return map;
  }, [profilerResult, questions]);

  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId) || questions[0];
  const selectedMapping = selectedQuestion ? mappings[selectedQuestion.id] : null;
  const selectedProfile = selectedQuestion ? profilesMap.get(selectedQuestion.id) : null;

  // Question Types for dropdown
  const questionTypeOptions: { value: QuestionType; label: string }[] = [
    { value: 'multiple_choice', label: 'Múltipla Escolha' },
    { value: 'checkbox', label: 'Caixa de Seleção (Múltiplas)' },
    { value: 'linear_scale', label: 'Escala Linear' },
    { value: 'paragraph', label: 'Parágrafo (Texto Aberto)' },
    { value: 'short_answer', label: 'Resposta Curta' },
    { value: 'dropdown', label: 'Lista Suspensa' },
    { value: 'number', label: 'Numérico' },
    { value: 'date', label: 'Data' },
    { value: 'time', label: 'Horário' },
    { value: 'unknown', label: 'Desconhecido' },
  ];

  // Visualizations
  const visualizationOptions: { value: VisualizationType; label: string }[] = [
    { value: 'auto', label: 'Automático' },
    { value: 'bar', label: 'Barras Verticais (Bar Chart)' },
    { value: 'horizontal_bar', label: 'Barras Horizontais' },
    { value: 'distribution', label: 'Histograma / Distribuição' },
    { value: 'pie', label: 'Pizza (Pie Chart)' },
    { value: 'donut', label: 'Rosca (Donut)' },
    { value: 'table', label: 'Tabela' },
    { value: 'none', label: 'Sem Gráfico (Apenas Texto)' },
  ];

  // Handler for changing question type
  const handleTypeChange = (questionId: string, newType: QuestionType) => {
    const suggestedVis = DataProfiler.getSuggestedVisualization(newType);
    const suggestedMode: AnalysisMode =
      newType === 'paragraph' || newType === 'short_answer' ? 'qualitative' : 'quantitative';

    // Update question
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        return {
          ...q,
          type: newType,
        };
      })
    );

    // Update mapping
    setMappings((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        questionType: newType,
        visualization: suggestedVis,
        analysisMode: prev[questionId]?.analysisMode === 'ignore' ? 'ignore' : suggestedMode,
        source: 'user',
      },
    }));
  };

  // Handler for changing visualization
  const handleVisualizationChange = (questionId: string, newVis: VisualizationType) => {
    setMappings((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        visualization: newVis,
        source: 'user',
      },
    }));
  };

  // Handler for changing analysis mode
  const handleAnalysisModeChange = (questionId: string, newMode: AnalysisMode) => {
    setMappings((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        analysisMode: newMode,
        source: 'user',
      },
    }));
  };

  // Handler for toggle ignore
  const handleToggleIgnore = (questionId: string) => {
    const currentMode = mappings[questionId]?.analysisMode;
    const newMode: AnalysisMode = currentMode === 'ignore' ? 'quantitative' : 'ignore';
    handleAnalysisModeChange(questionId, newMode);
  };

  // Handler for removing an option from the selected question
  const handleRemoveOption = (optValue: string) => {
    if (!selectedQuestion) return;
    const updatedOptions = (selectedQuestion.options || []).filter(
      (opt) => opt.value !== optValue
    );

    setQuestions((prev) =>
      prev.map((q) => (q.id === selectedQuestion.id ? { ...q, options: updatedOptions } : q))
    );

    setMappings((prev) => ({
      ...prev,
      [selectedQuestion.id]: {
        ...prev[selectedQuestion.id],
        options: updatedOptions,
        source: 'user',
      },
    }));
  };

  // Handler for adding a new option
  const handleAddOption = () => {
    if (!selectedQuestion || !newOptionInput.trim()) return;
    const cleanLabel = newOptionInput.trim();
    const cleanValue = normalizeCategory(cleanLabel).normalizedValue;

    const currentOptions = selectedQuestion.options || [];
    if (currentOptions.some((o) => o.value === cleanValue)) {
      setNewOptionInput('');
      return;
    }

    const newOpt: QuestionOption = {
      value: cleanValue,
      label: cleanLabel,
      order: currentOptions.length + 1,
    };

    const updatedOptions = [...currentOptions, newOpt];

    setQuestions((prev) =>
      prev.map((q) => (q.id === selectedQuestion.id ? { ...q, options: updatedOptions } : q))
    );

    setMappings((prev) => ({
      ...prev,
      [selectedQuestion.id]: {
        ...prev[selectedQuestion.id],
        options: updatedOptions,
        source: 'user',
      },
    }));

    setNewOptionInput('');
  };

  // Confirm and return updated survey
  const handleConfirmAndApply = () => {
    const reviewedSurvey: Survey = {
      ...survey,
      decimalPlaces,
      questions,
      mappings,
      analyzedAt: new Date().toISOString(),
    };
    onConfirm(reviewedSurvey);
  };

  const totalQuestions = questions.length;
  const lowConfidenceCount = Object.values(mappings).filter((m) => m.confidence < 0.6).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-6xl max-h-[94vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Revise o mapeamento da pesquisa (Data Profiler)
              </h2>
              <Badge variant="outline" size="sm">
                {survey.source.type.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
              O profiler analisou a distribuição dos dados e sugeriu os tipos de pergunta, deduplicou categorias e selecionou a melhor visualização. Revise ou ajuste antes de gerar o dashboard estatístico.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Decimal Precision Control at Import */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Casas decimais:</span>
              <div className="inline-flex rounded-md bg-white dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-700">
                {[0, 1, 2].map((dec) => (
                  <button
                    key={dec}
                    type="button"
                    onClick={() => setDecimalPlaces(dec)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      decimalPlaces === dec
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                    }`}
                    title={`Exibir porcentagens e números com até ${dec} casas decimais`}
                  >
                    {dec}
                  </button>
                ))}
              </div>
            </div>

            {lowConfidenceCount > 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{lowConfidenceCount} requerem atenção</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>100% inferido com sucesso</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split Layout */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800 text-xs">
          {/* Left Column: Interactive Questions Table */}
          <div className="lg:col-span-6 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
              <span>Perguntas Identificadas ({totalQuestions})</span>
              <span className="text-[11px] text-slate-400">Clique na linha para inspecionar</span>
            </div>

            <div className="space-y-2">
              {questions.map((q, idx) => {
                const map = mappings[q.id];
                const prof = profilesMap.get(q.id);
                const isSelected = selectedQuestion?.id === q.id;
                const isIgnored = map?.analysisMode === 'ignore';
                const confLevel = prof ? prof.confidenceLevel : map?.confidence >= 0.85 ? 'high' : map?.confidence >= 0.6 ? 'medium' : 'low';

                return (
                  <div
                    key={q.id}
                    onClick={() => setSelectedQuestionId(q.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs'
                        : isIgnored
                        ? 'border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30 opacity-60'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] mt-0.5">
                          Q{idx + 1}
                        </span>
                        <div>
                          <h4
                            className={`font-semibold text-xs leading-snug ${
                              isIgnored
                                ? 'line-through text-slate-400'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {q.title}
                          </h4>
                          {prof?.reason && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                              {prof.reason}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Confidence Badge */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        {confLevel === 'high' ? (
                          <Badge variant="success" size="sm" className="gap-1">
                            <ShieldCheck className="w-3 h-3" /> {Math.round((map?.confidence || 0.9) * 100)}%
                          </Badge>
                        ) : confLevel === 'medium' ? (
                          <Badge variant="warning" size="sm" className="gap-1">
                            <ShieldAlert className="w-3 h-3" /> {Math.round((map?.confidence || 0.7) * 100)}%
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm" className="gap-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800">
                            <AlertTriangle className="w-3 h-3" /> Baixa ({Math.round((map?.confidence || 0.4) * 100)}%)
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Controls Row */}
                    <div
                      className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Type Select */}
                      <div>
                        <label className="text-[10px] text-slate-400 font-medium block mb-1">
                          Tipo de Pergunta
                        </label>
                        <select
                          value={q.type}
                          onChange={(e) => handleTypeChange(q.id, e.target.value as QuestionType)}
                          disabled={isIgnored}
                          className="w-full h-7 px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        >
                          {questionTypeOptions.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Visualização Select */}
                      <div>
                        <label className="text-[10px] text-slate-400 font-medium block mb-1">
                          Visualização
                        </label>
                        <select
                          value={map?.visualization || 'auto'}
                          onChange={(e) =>
                            handleVisualizationChange(q.id, e.target.value as VisualizationType)
                          }
                          disabled={isIgnored}
                          className="w-full h-7 px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        >
                          {visualizationOptions.map((v) => (
                            <option key={v.value} value={v.value}>
                              {v.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Analysis Mode & Ignore */}
                      <div>
                        <label className="text-[10px] text-slate-400 font-medium block mb-1">
                          Análise & Ação
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleIgnore(q.id)}
                            className={`flex-1 h-7 px-2 rounded-md border text-[10px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                              isIgnored
                                ? 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {isIgnored ? 'Ignorada (Ativar)' : 'Ignorar'}
                          </button>

                          {map?.analysisMode === 'qualitative' ? (
                            <Badge variant="purple" size="sm" className="h-7 px-2">
                              <Sparkles className="w-2.5 h-2.5 mr-1" /> IA
                            </Badge>
                          ) : (
                            <Badge variant="secondary" size="sm" className="h-7 px-2">
                              Stats
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Deep Profiler Inspector, Sample Data & Live Chart Preview */}
          <div className="lg:col-span-6 overflow-y-auto p-4 bg-slate-50/40 dark:bg-slate-900/40 space-y-4">
            {selectedQuestion && selectedMapping ? (
              <div className="space-y-4">
                {/* Header of Inspector with Quick Chart Type Switcher */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        {selectedQuestion.type === 'paragraph' ||
                        selectedQuestion.type === 'short_answer' ||
                        selectedMapping.analysisMode === 'qualitative'
                          ? 'Prévia Qualitativa (Texto Aberto & IA)'
                          : 'Prévia em Tempo Real & Formato Gráfico'}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 leading-snug">
                        {selectedQuestion.title}
                      </h3>
                    </div>
                    <Badge
                      variant={
                        selectedQuestion.type === 'paragraph' ||
                        selectedQuestion.type === 'short_answer' ||
                        selectedMapping.analysisMode === 'qualitative'
                          ? 'purple'
                          : 'secondary'
                      }
                      size="sm"
                    >
                      {selectedQuestion.type}
                    </Badge>
                  </div>

                  {/* Visual Chart Type Buttons (Only for non-qualitative) */}
                  {selectedQuestion.type !== 'paragraph' &&
                  selectedQuestion.type !== 'short_answer' &&
                  selectedMapping.analysisMode !== 'qualitative' && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Selecione o formato visual:
                        </label>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                          Atual: {selectedMapping.visualization}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                          { id: 'bar', label: 'Barras', icon: BarChart2 },
                          { id: 'horizontal_bar', label: 'Horizontais', icon: AlignLeft },
                          { id: 'pie', label: 'Pizza', icon: PieChart },
                          { id: 'donut', label: 'Rosca', icon: PieChart },
                          { id: 'distribution', label: 'Distribuição', icon: Activity },
                          { id: 'table', label: 'Tabela', icon: TableIcon },
                        ].map((item) => {
                          const Icon = item.icon;
                          const isCurrent =
                            selectedMapping.visualization === item.id ||
                            (selectedMapping.visualization === 'auto' &&
                              (selectedQuestion.type === 'linear_scale'
                                ? item.id === 'distribution'
                                : selectedQuestion.type === 'checkbox'
                                ? item.id === 'horizontal_bar'
                                : item.id === 'bar'));

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() =>
                                handleVisualizationChange(selectedQuestion.id, item.id as VisualizationType)
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                                isCurrent
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                              }`}
                            >
                              <Icon className="w-3 h-3" />
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Stats Grid */}
                {selectedProfile && (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
                      <span className="text-[10px] text-slate-400 block">Total Respostas</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {selectedProfile.totalAnswers}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
                      <span className="text-[10px] text-slate-400 block">Preenchimento</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {formatPercentage(selectedProfile.fillRate, decimalPlaces)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
                      <span className="text-[10px] text-slate-400 block">
                        {selectedQuestion.type === 'paragraph' ||
                        selectedQuestion.type === 'short_answer' ||
                        selectedMapping.analysisMode === 'qualitative'
                          ? 'Comprimento Médio'
                          : 'Valores Únicos'}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {selectedQuestion.type === 'paragraph' ||
                        selectedQuestion.type === 'short_answer' ||
                        selectedMapping.analysisMode === 'qualitative'
                          ? `${Math.round(selectedProfile.avgLength || 45)} carac.`
                          : selectedProfile.uniqueCount}
                      </span>
                    </div>
                  </div>
                )}

                {/* QUALITATIVE TEXT PREVIEW (Requirement 15: Mostrar apenas amostras de texto, não mostrar gráfico) */}
                {(selectedQuestion.type === 'paragraph' ||
                  selectedQuestion.type === 'short_answer' ||
                  selectedMapping.analysisMode === 'qualitative') && (
                  <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        Amostras de Respostas Qualitativas (Sem gráfico numérico)
                      </span>
                      <Badge variant="purple" size="sm">
                        Síntese Gemini
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Perguntas dissertativas são processadas semanticamente para identificar sentimentos, dores e termos mais citados.
                    </p>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {survey.responses
                        .map((r) => r.answers[selectedQuestion.id])
                        .filter((ans) => ans !== null && ans !== undefined && String(ans).trim().length > 0)
                        .slice(0, 5)
                        .map((val, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900/40 text-slate-800 dark:text-slate-200 text-xs italic leading-snug shadow-2xs flex items-start gap-2"
                          >
                            <span className="text-purple-400 font-bold not-italic text-[10px]">
                              "{idx + 1}"
                            </span>
                            <span className="truncate max-w-full">
                              "{String(val)}"
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* LIVE VISUAL PREVIEW OF CHOSEN VISUALIZATION TYPE (Only for Quantitative) */}
                {selectedQuestion.type !== 'paragraph' &&
                  selectedQuestion.type !== 'short_answer' &&
                  selectedMapping.analysisMode !== 'qualitative' &&
                  selectedProfile?.distribution &&
                  selectedProfile.distribution.length > 0 && (
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />
                        Prévia do Gráfico ({selectedMapping.visualization === 'auto' ? 'Automático' : selectedMapping.visualization})
                      </span>
                      <Badge variant="outline" size="sm" className="text-[10px]">
                        {decimalPlaces} decimais
                      </Badge>
                    </div>

                    {/* Rendering different chart styles */}
                    {selectedMapping.visualization === 'table' ? (
                      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                            <tr>
                              <th className="p-2">Categoria</th>
                              <th className="p-2 text-right">Contagem</th>
                              <th className="p-2 text-right">% Relativa</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {selectedProfile.distribution.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/40">
                                <td className="p-2 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                                  {item.displayLabel}
                                </td>
                                <td className="p-2 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                  {item.count}
                                </td>
                                <td className="p-2 text-right font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                                  {formatPercentage(item.percentage, decimalPlaces)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : selectedMapping.visualization === 'pie' || selectedMapping.visualization === 'donut' ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-1 h-4 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 p-0.5">
                          {selectedProfile.distribution.map((item, idx) => {
                            const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];
                            return (
                              <div
                                key={idx}
                                style={{
                                  width: `${Math.max(4, item.percentage)}%`,
                                  backgroundColor: colors[idx % colors.length],
                                }}
                                className="h-full rounded-xs transition-all"
                                title={`${item.displayLabel}: ${item.count} (${formatPercentage(item.percentage, decimalPlaces)})`}
                              />
                            );
                          })}
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                          {selectedProfile.distribution.map((item, idx) => {
                            const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];
                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-1.5 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-[11px]"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: colors[idx % colors.length] }}
                                  />
                                  <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                                    {item.displayLabel}
                                  </span>
                                </div>
                                <span className="font-mono font-bold text-slate-600 dark:text-slate-400 text-[10px] shrink-0 ml-1">
                                  {formatPercentage(item.percentage, decimalPlaces)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : selectedMapping.visualization === 'horizontal_bar' || selectedQuestion.type === 'checkbox' ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {selectedProfile.distribution.map((item, dIdx) => (
                          <div key={item.normalizedValue || dIdx} className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                                {item.displayLabel}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono font-bold text-slate-600 dark:text-slate-400">
                                  {item.count}
                                </span>
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 w-12 text-right">
                                  {formatPercentage(item.percentage, decimalPlaces)}
                                </span>
                              </div>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(3, item.percentage))}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Default vertical bars */
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        <div className="flex items-end gap-1.5 h-28 pt-4 pb-1 px-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-100 dark:border-slate-800">
                          {selectedProfile.distribution.slice(0, 10).map((item, dIdx) => {
                            const heightPct = Math.max(8, item.percentage);
                            return (
                              <div
                                key={dIdx}
                                className="flex-1 flex flex-col items-center h-full justify-end group relative"
                              >
                                <span className="text-[9px] font-mono text-slate-500 mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {item.count}
                                </span>
                                <div
                                  className="w-full bg-indigo-500 hover:bg-indigo-600 rounded-t transition-all"
                                  style={{ height: `${heightPct}%` }}
                                  title={`${item.displayLabel}: ${item.count} (${formatPercentage(item.percentage, decimalPlaces)})`}
                                />
                                <span className="text-[9px] text-slate-400 truncate w-full text-center mt-1">
                                  {item.displayLabel.slice(0, 4)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                          <span>
                            {selectedProfile.distribution.length} categorias identificadas
                          </span>
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            Formatado em até {decimalPlaces} casas decimais
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Canonical Options Management */}
                {(selectedQuestion.type === 'multiple_choice' ||
                  selectedQuestion.type === 'checkbox' ||
                  selectedQuestion.type === 'dropdown') && (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Opções Estruturadas ({selectedQuestion.options?.length || 0})
                      </span>
                      <span className="text-[10px] text-slate-400">Deduplicação ativa</span>
                    </div>

                    {/* Options list */}
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {selectedQuestion.options?.map((opt) => (
                        <div
                          key={opt.value}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-[11px]"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-mono text-[10px] text-slate-400">
                              #{opt.order}
                            </span>
                            <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                              {opt.label}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(opt.value)}
                            className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add new option */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        placeholder="Adicionar nova opção..."
                        value={newOptionInput}
                        onChange={(e) => setNewOptionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddOption();
                        }}
                        className="flex-1 h-7 px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleAddOption}
                        className="h-7 px-2 text-[11px]"
                      >
                        <Plus className="w-3 h-3 mr-0.5" /> Adicionar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Sample Raw Answers */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-indigo-500" />
                      Dados de Exemplo da Planilha ({Math.min(6, survey.responses.length)} amostras)
                    </span>
                    <span className="text-[10px] text-slate-400">Respostas brutas</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] max-h-28 overflow-y-auto">
                    {survey.responses.slice(0, 6).map((resp, rIdx) => {
                      const ans = resp.answers[selectedQuestion.id];
                      return (
                        <div
                          key={resp.id || rIdx}
                          className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono text-[10px] flex items-center gap-2 border border-slate-100 dark:border-slate-800"
                        >
                          <span className="text-slate-400 font-bold shrink-0">
                            #{rIdx + 1}:
                          </span>
                          <span className="truncate">
                            {ans === null || ans === undefined || ans === '' ? (
                              <span className="text-slate-400 italic">&lt;vazio&gt;</span>
                            ) : Array.isArray(ans) ? (
                              ans.join('; ')
                            ) : (
                              String(ans)
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400">
                <Sliders className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs">Selecione uma pergunta para inspecionar os detalhes.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{totalQuestions} perguntas configuradas</span>
            <span>•</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
              Pronto para gerar estatísticas
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmAndApply} className="gap-1.5">
              <Check className="w-3.5 h-3.5" /> Confirmar e Gerar Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
