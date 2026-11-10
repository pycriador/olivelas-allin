import React, { useState } from 'react';
import { Database, Filter, Search, Check, FileSpreadsheet } from 'lucide-react';
import { Survey } from '../../types/survey';
import { normalizeCategory } from '../../utils/normalization';
import { Badge } from '../ui/Badge';

interface RawDataPreviewProps {
  survey: Survey;
}

export function RawDataPreview({ survey }: RawDataPreviewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuestionFilter, setSelectedQuestionFilter] = useState<string>('all');
  const [showNormalizationInspector, setShowNormalizationInspector] = useState(false);

  // Normalization comparison demo for requirement 10
  const sampleNormalizationInputs = [
    'Financeiro',
    ' Financeiro',
    'Financeiro ',
    'financeiro',
    'FINANCEIRO',
    'Tecnologia',
    ' tecnologia ',
  ];

  const filteredResponses = survey.responses.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return Object.values(r.answers).some((val) => {
      if (Array.isArray(val)) {
        return val.some((v) => String(v).toLowerCase().includes(term));
      }
      return String(val).toLowerCase().includes(term);
    });
  });

  return (
    <div className="space-y-6">
      {/* Normalization Engine Inspector Banner (Requirement 10) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <Database className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Motor de Normalização de Categorias (<code>normalizeCategory()</code>)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Agrupa variações tipográficas, espaços adicionais e inconsistências de caixa alta/baixa sem nunca perder os dados originais brutos.
            </p>
          </div>

          <button
            onClick={() => setShowNormalizationInspector(!showNormalizationInspector)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            {showNormalizationInspector ? 'Ocultar teste do normalizador' : 'Testar normalização ao vivo'}
          </button>
        </div>

        {showNormalizationInspector && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Demonstração de Agrupamento Canônico:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {sampleNormalizationInputs.map((sample, idx) => {
                const res = normalizeCategory(sample);
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                  >
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>originalValue:</span>
                      <code className="bg-slate-200/60 dark:bg-slate-700/50 px-1 rounded">"{res.originalValue}"</code>
                    </div>
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center justify-between">
                      <span>normalizedValue:</span>
                      <code>"{res.normalizedValue}"</code>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Search & Filter Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar nas respostas dos participantes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{filteredResponses.length} de {survey.responses.length} respostas</span>
        </div>
      </div>

      {/* Responses Table */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold w-16 border-r border-slate-200/50 dark:border-slate-800">ID</th>
                <th className="py-2.5 px-3 font-semibold w-24 border-r border-slate-200/50 dark:border-slate-800">Data</th>
                {survey.questions.map((q) => (
                  <th
                    key={q.id}
                    className="py-2.5 px-3 font-semibold min-w-[220px] max-w-[280px] border-r border-slate-200/50 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-slate-700 dark:text-slate-300">
                        Q{q.order}
                      </span>
                      <span className="truncate" title={q.title}>{q.title}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredResponses.map((response, rIdx) => (
                <tr key={response.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 border-r border-slate-200/50 dark:border-slate-800">
                    #{rIdx + 1}
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-400 border-r border-slate-200/50 dark:border-slate-800 whitespace-nowrap">
                    {response.submittedAt ? new Date(response.submittedAt).toLocaleDateString('pt-BR') : 'N/A'}
                  </td>
                  {survey.questions.map((q) => {
                    const rawVal = response.answers[q.id];
                    let display = '—';

                    if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
                      if (Array.isArray(rawVal)) {
                        display = rawVal.join(', ');
                      } else {
                        display = String(rawVal);
                      }
                    }

                    return (
                      <td
                        key={q.id}
                        className="py-2.5 px-3 border-r border-slate-200/50 dark:border-slate-800 leading-relaxed text-xs"
                      >
                        <span className="line-clamp-2" title={display}>
                          {display}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
