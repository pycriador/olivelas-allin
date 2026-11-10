import React, { useState, useEffect } from 'react';
import {
  X,
  Minimize2,
  BarChart2,
  AlignLeft,
  PieChart as PieIcon,
  Table as TableIcon,
  Copy,
  Check,
  Calendar,
  Clock,
  Sliders,
  CheckSquare,
  Sparkles,
  HelpCircle,
  Hash,
  Share2,
} from 'lucide-react';
import { ProcessedQuestionData } from '../../types/statistics';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { CategoricalBarChart } from './Charts/CategoricalBarChart';
import { HorizontalBarChart } from './Charts/HorizontalBarChart';
import { ScaleDistributionChart } from './Charts/ScaleDistributionChart';
import { DateLineChart } from './Charts/DateLineChart';
import { QualitativeCard } from './Charts/QualitativeCard';
import { formatNumber, formatPercentage } from '../../utils/numberFormatting';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ChartFullscreenModalProps {
  data: ProcessedQuestionData | null;
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  decimalPlaces?: number;
  onDecimalPlacesChange?: (decimals: number) => void;
}

const PIE_COLORS = [
  '#4f46e5',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#3b82f6',
  '#14b8a6',
  '#f97316',
  '#6366f1',
];

export function ChartFullscreenModal({
  data,
  isOpen,
  onClose,
  isDark = false,
  decimalPlaces: initialDecimals = 2,
  onDecimalPlacesChange,
}: ChartFullscreenModalProps) {
  const [activeViewType, setActiveViewType] = useState<'default' | 'bar' | 'horizontal_bar' | 'pie' | 'table'>('default');
  const [localDecimals, setLocalDecimals] = useState<number>(initialDecimals);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLocalDecimals(initialDecimals);
  }, [initialDecimals]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const { question, mapping, stats } = data;
  const currentDecimals = localDecimals;

  const handleDecimalsChange = (d: number) => {
    setLocalDecimals(d);
    onDecimalPlacesChange?.(d);
  };

  const handleCopyTable = () => {
    if (stats.kind === 'categorical') {
      const rows = stats.stats.frequencies.map(
        (f) => `${f.label}\t${f.count}\t${formatPercentage(f.percentage, currentDecimals)}`
      );
      const csv = `Categoria\tContagem\tPorcentagem\n${rows.join('\n')}`;
      navigator.clipboard.writeText(csv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (stats.kind === 'scale') {
      const rows = stats.stats.distribution.map(
        (d) => `Nota ${d.score}\t${d.count}\t${formatPercentage(d.percentage, currentDecimals)}`
      );
      const csv = `Nota\tContagem\tPorcentagem\n${rows.join('\n')}`;
      navigator.clipboard.writeText(csv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const pieData =
    stats.kind === 'categorical'
      ? stats.stats.frequencies.map((item) => ({
          name: item.label,
          value: item.count,
          percentage: item.percentage,
          formattedPercentage: formatPercentage(item.percentage, currentDecimals),
        }))
      : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-6xl max-h-[96vh] h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center justify-center px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold">
                Q{question.order}
              </span>
              <Badge variant="secondary" size="sm">
                {question.type}
              </Badge>
              {mapping.analysisMode === 'qualitative' ? (
                <Badge variant="purple" size="sm">
                  Qualitativo (IA)
                </Badge>
              ) : (
                <Badge variant="info" size="sm">
                  Quantitativo
                </Badge>
              )}
              {question.required && (
                <span className="text-[11px] text-slate-400 font-medium">Obrigatória</span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
              {question.title}
            </h2>
            {question.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {question.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar tela cheia (Esc)"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
          {/* Chart Type Selector */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
            <button
              onClick={() => setActiveViewType('default')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeViewType === 'default'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Gráfico Padrão
            </button>
            {stats.kind === 'categorical' && (
              <>
                <button
                  onClick={() => setActiveViewType('bar')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    activeViewType === 'bar'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Colunas</span>
                </button>
                <button
                  onClick={() => setActiveViewType('horizontal_bar')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    activeViewType === 'horizontal_bar'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                  <span>Barras</span>
                </button>
                <button
                  onClick={() => setActiveViewType('pie')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    activeViewType === 'pie'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <PieIcon className="w-3.5 h-3.5" />
                  <span>Pizza / Rosca</span>
                </button>
              </>
            )}
            <button
              onClick={() => setActiveViewType('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeViewType === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabela Detalhada</span>
            </button>
          </div>

          {/* Precision and Export Controls */}
          <div className="flex items-center gap-3">
            {/* Decimal Precision Buttons */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-medium text-slate-700 dark:text-slate-300">Casas decimais:</span>
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
                {[0, 1, 2].map((dec) => (
                  <button
                    key={dec}
                    onClick={() => handleDecimalsChange(dec)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                      currentDecimals === dec
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                    }`}
                  >
                    {dec}
                  </button>
                ))}
              </div>
            </div>

            {/* Copy Table Button */}
            {(stats.kind === 'categorical' || stats.kind === 'scale') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyTable}
                className="gap-1.5 text-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar Dados'}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Render based on view mode */}
          {activeViewType === 'table' ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                      <th className="p-3.5">#</th>
                      <th className="p-3.5">Opção / Resposta</th>
                      <th className="p-3.5 text-right">Contagem Absoluta</th>
                      <th className="p-3.5 text-right">Porcentagem</th>
                      <th className="p-3.5">Distribuição Visual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {stats.kind === 'categorical' &&
                      stats.stats.frequencies.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3.5 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-3.5 font-medium text-slate-900 dark:text-slate-100">{item.label}</td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{item.count}</td>
                          <td className="p-3.5 text-right font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                            {formatPercentage(item.percentage, currentDecimals)}
                          </td>
                          <td className="p-3.5 w-48">
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(3, item.percentage))}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    {stats.kind === 'scale' &&
                      stats.stats.distribution.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3.5 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-3.5 font-medium text-slate-900 dark:text-slate-100">Nota {item.score}</td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{item.count}</td>
                          <td className="p-3.5 text-right font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                            {formatPercentage(item.percentage, currentDecimals)}
                          </td>
                          <td className="p-3.5 w-48">
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(3, item.percentage))}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeViewType === 'pie' && stats.kind === 'categorical' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 h-[420px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={140}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const p = payload[0].payload;
                          return (
                            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-md dark:border-slate-800 dark:bg-slate-900 text-xs">
                              <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                                {p.name}
                              </p>
                              <div className="flex items-center justify-between gap-4 text-slate-600 dark:text-slate-400">
                                <span>Total:</span>
                                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                  {p.value} ({p.formattedPercentage})
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="lg:col-span-5 space-y-2 max-h-[400px] overflow-y-auto pr-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Legenda de Frequência
                </h4>
                {pieData.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono">
                      <span className="text-slate-600 dark:text-slate-400 font-bold">{item.value}</span>
                      <span className="text-slate-500 font-semibold text-[11px] w-14 text-right">
                        {item.formattedPercentage}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeViewType === 'bar' && stats.kind === 'categorical' ? (
            <CategoricalBarChart
              stats={stats.stats}
              isDark={isDark}
              decimalPlaces={currentDecimals}
              height={420}
            />
          ) : activeViewType === 'horizontal_bar' && stats.kind === 'categorical' ? (
            <HorizontalBarChart
              stats={stats.stats}
              isDark={isDark}
              decimalPlaces={currentDecimals}
              height={Math.max(380, stats.stats.frequencies.length * 48)}
            />
          ) : (
            <>
              {stats.kind === 'categorical' && (
                question.type === 'date' ? (
                  <DateLineChart stats={stats.stats} isDark={isDark} decimalPlaces={currentDecimals} height={400} />
                ) : question.type === 'checkbox' || mapping.visualization === 'horizontal_bar' ? (
                  <HorizontalBarChart
                    stats={stats.stats}
                    isDark={isDark}
                    decimalPlaces={currentDecimals}
                    height={Math.max(380, stats.stats.frequencies.length * 48)}
                  />
                ) : (
                  <CategoricalBarChart
                    stats={stats.stats}
                    isDark={isDark}
                    decimalPlaces={currentDecimals}
                    height={400}
                  />
                )
              )}

              {stats.kind === 'scale' && (
                <ScaleDistributionChart
                  stats={stats.stats}
                  minLabel={question.scaleConfig?.minLabel}
                  maxLabel={question.scaleConfig?.maxLabel}
                  isDark={isDark}
                  decimalPlaces={currentDecimals}
                  height={380}
                />
              )}

              {stats.kind === 'qualitative' && (
                <QualitativeCard
                  questionId={question.id}
                  questionTitle={question.title}
                  stats={stats.stats}
                  isDark={isDark}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>Legendas com precisão de {currentDecimals} {currentDecimals === 1 ? 'casa decimal' : 'casas decimais'} (máx 2)</span>
            <span>•</span>
            <span>Pressione <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">Esc</kbd> para fechar</span>
          </div>

          <Button variant="primary" size="sm" onClick={onClose}>
            Concluir Visualização
          </Button>
        </div>
      </div>
    </div>
  );
}
