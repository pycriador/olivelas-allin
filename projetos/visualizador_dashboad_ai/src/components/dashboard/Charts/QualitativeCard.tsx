import React, { useState } from 'react';
import {
  Sparkles,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Quote,
  RefreshCw,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  TrendingUp,
  SlidersHorizontal,
} from 'lucide-react';
import { QualitativeStats } from '../../../types/statistics';
import { QualitativeAnalysis, QuestionAnalysisState } from '../../../types/ai';
import { Badge } from '../../ui/Badge';

interface QualitativeCardProps {
  questionId: string;
  questionTitle: string;
  stats: QualitativeStats;
  analysisState?: QuestionAnalysisState;
  onAnalyze?: (questionId: string, bypassCache?: boolean) => void;
  isDark?: boolean;
}

export function QualitativeCard({
  questionId,
  questionTitle,
  stats,
  analysisState,
  onAnalyze,
  isDark = false,
}: QualitativeCardProps) {
  const [isRawExpanded, setIsRawExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'synthesis' | 'themes' | 'insights' | 'quotes'>('synthesis');

  const status = analysisState?.status || 'idle';
  const analysis = analysisState?.data;
  const isAnalyzing = status === 'analyzing';
  const isCompleted = status === 'completed' && !!analysis;
  const isError = status === 'error';

  const visibleRawResponses = isRawExpanded
    ? stats.sampleResponses
    : stats.sampleResponses.slice(0, 3);

  return (
    <div className="w-full space-y-4">
      {/* Top Action & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Análise Qualitativa com IA
              </span>
              {isCompleted && (
                <Badge variant={analysis?.engine === 'nlp_offline' ? 'outline' : 'purple'} size="sm">
                  {analysis?.engine === 'nlp_offline'
                    ? 'Motor Semântico NLP'
                    : analysis?.engine
                    ? `Gemini (${analysis.engine.replace('gemini-', '')})`
                    : 'Gemini IA'}
                </Badge>
              )}
              {isAnalyzing && (
                <Badge variant="info" size="sm" className="animate-pulse">
                  Processando...
                </Badge>
              )}
              {isError && (
                <Badge variant="danger" size="sm">
                  Falha no processamento
                </Badge>
              )}
              {!isCompleted && !isAnalyzing && !isError && (
                <Badge variant="secondary" size="sm">
                  Aguardando execução
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {stats.totalAnswers} respostas textuais registradas ({stats.averageWordCount} palavras em média)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCompleted ? (
            <button
              onClick={() => onAnalyze?.(questionId, true)}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              Reanalisar com IA
            </button>
          ) : (
            <button
              onClick={() => onAnalyze?.(questionId, false)}
              disabled={isAnalyzing || stats.totalAnswers === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Analisando respostas...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Analisar com Gemini IA
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Loading State Animation */}
      {isAnalyzing && (
        <div className="p-6 rounded-xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 text-center space-y-3 animate-pulse">
          <div className="w-8 h-8 mx-auto rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center text-purple-700 dark:text-purple-300">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-purple-950 dark:text-purple-200">
              Sintetizando respostas qualitativas com Gemini...
            </h4>
            <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80 mt-1 max-w-md mx-auto">
              Agrupando semântica de {stats.totalAnswers} respostas, identificando temas de maior frequência, preocupações e oportunidades.
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h5 className="text-xs font-bold text-rose-900 dark:text-rose-200">
              Não foi possível concluir a análise qualitativa
            </h5>
            <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80 mt-0.5">
              {analysisState?.error || 'Verifique a configuração de GEMINI_API_KEY no servidor.'}
            </p>
            <button
              onClick={() => onAnalyze?.(questionId, true)}
              className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/50 hover:bg-rose-200 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Idle State Prompt to Analyze */}
      {!isCompleted && !isAnalyzing && !isError && (
        <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 text-center space-y-2">
          <Sparkles className="w-5 h-5 mx-auto text-purple-500 opacity-80" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Respostas prontas para análise semântica
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Clique no botão acima para sintetizar temas recorrentes, sentimento geral e oportunidades de melhoria a partir das falas dos participantes.
          </p>
        </div>
      )}

      {/* Completed State: Real Gemini Qualitative Synthesis */}
      {isCompleted && analysis && (
        <div className="space-y-4">
          {/* Executive Summary Callout */}
          <div className="p-4 rounded-xl border border-purple-200/80 dark:border-purple-900/60 bg-gradient-to-br from-purple-50/60 to-indigo-50/40 dark:from-purple-950/30 dark:to-indigo-950/20 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-purple-950 dark:text-purple-200">
                  Síntese Executiva das Respostas
                </span>
              </div>
              <span className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">
                {analysis.themes.length} temas identificados
              </span>
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
              {analysis.summary}
            </p>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('synthesis')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'synthesis'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Visão Integrada
            </button>
            <button
              onClick={() => setActiveTab('themes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'themes'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Temas Recorrentes ({analysis.themes.length})
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'insights'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Insights & Oportunidades
            </button>
            <button
              onClick={() => setActiveTab('quotes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'quotes'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Citações ({analysis.representativeResponses.length})
            </button>
          </div>

          {/* TAB 1: VISÃO INTEGRADA */}
          {activeTab === 'synthesis' && (
            <div className="space-y-4">
              {/* Top Themes Progress */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Temas Principais
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Distribuição semântica das respostas
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {analysis.themes.map((theme, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {theme.name}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                            {theme.count} {theme.count === 1 ? 'resposta' : 'respostas'}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 font-bold">
                            {theme.percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Bar indicator */}
                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-purple-600 dark:bg-purple-500 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(5, theme.percentage))}%` }}
                        />
                      </div>

                      {theme.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          {theme.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Opportunities & Concerns Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Opportunities */}
                {analysis.opportunities.length > 0 && (
                  <div className="p-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-bold">Oportunidades & Ganhos</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      {analysis.opportunities.map((opp, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-snug">{opp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Concerns */}
                {analysis.concerns.length > 0 && (
                  <div className="p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs font-bold">Dificuldades & Pontos de Atenção</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      {analysis.concerns.map((concern, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                          <span className="leading-snug">{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TEMAS DETALHADOS */}
          {activeTab === 'themes' && (
            <div className="space-y-3">
              {analysis.themes.map((theme, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-[11px] font-bold">
                        {idx + 1}
                      </span>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {theme.name}
                      </h5>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {theme.count} {theme.count === 1 ? 'menção' : 'menções'}
                      </span>
                      <Badge variant="purple" size="sm">
                        {theme.percentage}% das respostas
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7">
                    {theme.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: INSIGHTS & OPORTUNIDADES */}
          {activeTab === 'insights' && (
            <div className="space-y-3">
              {analysis.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-indigo-200/70 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                      <Lightbulb className="w-3.5 h-3.5" />
                    </div>
                    <h5 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                      {insight.title}
                    </h5>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {insight.description}
                  </p>
                  {insight.evidence && (
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 italic">
                      <Quote className="w-3 h-3 text-slate-400 shrink-0 mt-0.5 rotate-180" />
                      <span>"{insight.evidence}"</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: CITAÇÕES REPRESENTATIVAS */}
          {activeTab === 'quotes' && (
            <div className="space-y-2.5">
              {analysis.representativeResponses.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-start gap-2.5">
                    <Quote className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5 rotate-180" />
                    <p className="flex-1 text-xs italic font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                      "{item.text}"
                    </p>
                  </div>
                  {item.reason && (
                    <div className="flex items-center gap-1.5 pl-6 text-[11px] text-purple-700 dark:text-purple-300">
                      <span className="font-semibold">Contexto:</span>
                      <span>{item.reason}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Raw Collected Responses Drawer / Accordion */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Respostas Originais dos Participantes
            </span>
            <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
              {stats.sampleResponses.length}
            </span>
          </div>

          <button
            onClick={() => setIsRawExpanded(!isRawExpanded)}
            className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
          >
            {isRawExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                Recolher
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                Expandir ({stats.sampleResponses.length})
              </>
            )}
          </button>
        </div>

        {isRawExpanded && (
          <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
            {visibleRawResponses.map((text, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800/70 text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
              >
                <span className="text-[10px] font-mono text-slate-400 shrink-0 mt-0.5">
                  #{idx + 1}
                </span>
                <p className="flex-1">{text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
