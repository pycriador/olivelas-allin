import React from 'react';
import { X, Check, Sliders, ShieldCheck, Database, Layers } from 'lucide-react';
import {
  AnalysisMode,
  MappingSource,
  QuestionMapping,
  QuestionType,
  SurveyQuestion,
  VisualizationType,
} from '../../types/survey';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface QuestionMappingDrawerProps {
  question: SurveyQuestion | null;
  mapping: QuestionMapping | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (questionId: string, updates: Partial<QuestionMapping>) => void;
}

export function QuestionMappingDrawer({
  question,
  mapping,
  isOpen,
  onClose,
  onSave,
}: QuestionMappingDrawerProps) {
  if (!isOpen || !question || !mapping) return null;

  const [analysisMode, setAnalysisMode] = React.useState<AnalysisMode>(mapping.analysisMode);
  const [visualization, setVisualization] = React.useState<VisualizationType>(mapping.visualization);
  const [questionType, setQuestionType] = React.useState<QuestionType>(mapping.questionType);

  const handleSave = () => {
    onSave(question.id, {
      analysisMode,
      visualization,
      questionType,
      source: 'user',
    });
    onClose();
  };

  const questionTypes: { value: QuestionType; label: string }[] = [
    { value: 'multiple_choice', label: 'multiple_choice (Múltipla Escolha)' },
    { value: 'checkbox', label: 'checkbox (Caixa de Seleção)' },
    { value: 'linear_scale', label: 'linear_scale (Escala Linear)' },
    { value: 'paragraph', label: 'paragraph (Texto Livre / Parágrafo)' },
    { value: 'short_answer', label: 'short_answer (Resposta Curta)' },
    { value: 'dropdown', label: 'dropdown (Menu Suspenso)' },
    { value: 'number', label: 'number (Numérico)' },
    { value: 'date', label: 'date (Data)' },
    { value: 'time', label: 'time (Hora)' },
    { value: 'unknown', label: 'unknown (Desconhecido / Requer Mapeamento)' },
  ];

  const analysisModes: { value: AnalysisMode; label: string; desc: string }[] = [
    {
      value: 'quantitative',
      label: 'Quantitativo',
      desc: 'Agrupamento estatístico, frequências, percentuais e gráficos estruturados',
    },
    {
      value: 'qualitative',
      label: 'Qualitativo (Gemini AI)',
      desc: 'Síntese semântica de texto aberto, sentimentos e clusterização',
    },
    {
      value: 'mixed',
      label: 'Misto',
      desc: 'Combina métricas numéricas com análise semântica de complementos',
    },
    {
      value: 'ignore',
      label: 'Ignorar',
      desc: 'Desconsiderar esta pergunta dos relatórios e dashboards',
    },
  ];

  const visualizations: { value: VisualizationType; label: string }[] = [
    { value: 'auto', label: 'Automático (Recomendado)' },
    { value: 'bar', label: 'Bar Chart (Colunas Verticais)' },
    { value: 'horizontal_bar', label: 'Horizontal Bar Chart (Barras Horizontais)' },
    { value: 'distribution', label: 'Distribution Chart (Escala / Histograma)' },
    { value: 'pie', label: 'Pie Chart (Pizza)' },
    { value: 'donut', label: 'Donut Chart (Rosca)' },
    { value: 'table', label: 'Table (Tabela Simples)' },
    { value: 'none', label: 'Nenhum Gráfico (Apenas Texto/IA)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Modelo de Mapeamento (QuestionMapping)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pergunta #{question.order} • ID: <code className="font-mono text-indigo-600 dark:text-indigo-400">{question.id}</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Question context */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Enunciado Original
            </span>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {question.title}
            </p>
            {question.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {question.description}
              </p>
            )}
            <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3 text-slate-400" /> Origem: <strong>{mapping.source}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> Confiança: <strong>{Math.round(mapping.confidence * 100)}%</strong>
              </span>
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            {/* Question Type */}
            <div>
              <label className="block font-semibold text-slate-900 dark:text-slate-200 mb-1.5">
                Tipo da Pergunta (QuestionType)
              </label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              >
                {questionTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Analysis Mode */}
            <div>
              <label className="block font-semibold text-slate-900 dark:text-slate-200 mb-1.5">
                Modo de Análise (analysisMode)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {analysisModes.map((mode) => {
                  const isSelected = analysisMode === mode.value;
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setAnalysisMode(mode.value)}
                      className={`flex flex-col text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="font-semibold text-xs flex items-center justify-between">
                        {mode.label}
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {mode.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visualization */}
            <div>
              <label className="block font-semibold text-slate-900 dark:text-slate-200 mb-1.5">
                Tipo de Visualização (visualization)
              </label>
              <select
                value={visualization}
                onChange={(e) => setVisualization(e.target.value as VisualizationType)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              >
                {visualizations.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Preserved Options Inspection */}
            {question.options && question.options.length > 0 && (
              <div>
                <label className="block font-semibold text-slate-900 dark:text-slate-200 mb-1.5 flex items-center justify-between">
                  <span>Opções Estruturadas Preservadas ({question.options.length})</span>
                  <span className="text-[11px] text-slate-400 font-normal">Ordem original preservada</span>
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  {question.options.map((opt) => (
                    <div
                      key={opt.value}
                      className="flex items-center justify-between text-xs px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400">#{opt.order}</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{opt.label}</span>
                      </div>
                      <code className="text-[10px] text-slate-400 font-mono">{opt.value}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Salvar Mapeamento
          </Button>
        </div>
      </div>
    </div>
  );
}
