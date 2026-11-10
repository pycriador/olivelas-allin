import React from 'react';
import {
  Sliders,
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileCode,
  Edit2,
  Table as TableIcon,
} from 'lucide-react';
import { ProcessedSurveyData } from '../../types/statistics';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface QuestionMappingViewerProps {
  processedData: ProcessedSurveyData;
  onEditMapping: (questionId: string) => void;
}

export function QuestionMappingViewer({
  processedData,
  onEditMapping,
}: QuestionMappingViewerProps) {
  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Matriz de Mapeamento (QuestionMapping)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              O modelo <code>QuestionMapping</code> desacopla a ingestão bruta do processamento estatístico. Ele identifica o tipo estrutural de cada pergunta, direciona o modo de análise (quantitativo via agregação ou qualitativo via IA) e define a visualização ótima.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{processedData.questions.length} perguntas mapeadas</span>
            </div>
          </div>
        </div>

        {/* Architecture Pipeline Preview */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
              1. Metadados Nativos (Forms)
            </span>
            <p className="text-[11px] text-slate-500 leading-snug">
              Google Forms fornece types explícitos e lista de opções predefinidas com 100% de confiança.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
              2. Inferência Heurística (XLSX/CSV)
            </span>
            <p className="text-[11px] text-slate-500 leading-snug">
              O profiler analisa distribuição de valores, cardinalidade e comprimentos para inferir os tipos.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
              3. Ajuste do Usuário (User Override)
            </span>
            <p className="text-[11px] text-slate-500 leading-snug">
              O usuário pode redefinir o tipo de visualização ou modo de análise a qualquer momento.
            </p>
          </div>
        </div>
      </div>

      {/* Mapping Table */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold w-12 text-center">#</th>
                <th className="py-3 px-4 font-semibold">Pergunta & Enunciado</th>
                <th className="py-3 px-4 font-semibold">QuestionType</th>
                <th className="py-3 px-4 font-semibold">analysisMode</th>
                <th className="py-3 px-4 font-semibold">visualization</th>
                <th className="py-3 px-4 font-semibold">Origem & Confiança</th>
                <th className="py-3 px-4 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {processedData.questions.map(({ question, mapping }, idx) => (
                <tr key={question.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-center font-mono font-semibold text-slate-400">
                    Q{question.order}
                  </td>
                  <td className="py-3 px-4 max-w-sm">
                    <p className="font-medium text-slate-900 dark:text-slate-100 leading-snug">
                      {question.title}
                    </p>
                    {question.options && (
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {question.options.length} opções pré-definidas com ordem preservada
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="secondary" size="sm">
                      {question.type}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    {mapping.analysisMode === 'qualitative' ? (
                      <Badge variant="purple" size="sm" className="gap-1">
                        <Sparkles className="w-3 h-3" /> qualitative
                      </Badge>
                    ) : (
                      <Badge variant="info" size="sm">
                        {mapping.analysisMode}
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    {mapping.visualization}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" size="sm">
                        {mapping.source}
                      </Badge>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {Math.round(mapping.confidence * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditMapping(question.id)}
                      className="text-xs h-7 px-2"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
