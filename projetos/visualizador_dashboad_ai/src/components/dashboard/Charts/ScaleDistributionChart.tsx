import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ScaleStats } from '../../../types/statistics';
import { formatNumber, formatPercentage } from '../../../utils/numberFormatting';
import { useTheme } from '../../../hooks/useTheme';

interface ScaleDistributionChartProps {
  stats: ScaleStats;
  minLabel?: string;
  maxLabel?: string;
  isDark?: boolean;
  decimalPlaces?: number;
  height?: number;
}

export function ScaleDistributionChart({
  stats,
  minLabel,
  maxLabel,
  isDark: propIsDark,
  decimalPlaces = 2,
  height = 240,
}: ScaleDistributionChartProps) {
  const { currentTheme, isDark: contextIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;

  const data = stats.distribution.map((item) => ({
    score: `Nota ${item.score}`,
    scoreNum: item.score,
    count: item.count,
    percentage: item.percentage,
    formattedPercentage: formatPercentage(item.percentage, decimalPlaces),
  }));

  const primaryColor = currentTheme.previewColors?.primary || (isDark ? '#818cf8' : '#4f46e5');
  const gridColor = currentTheme.variables?.['--theme-border'] || (isDark ? '#334155' : '#e2e8f0');
  const textColor = currentTheme.variables?.['--theme-text-muted'] || (isDark ? '#94a3b8' : '#64748b');

  const positivePercent = stats.distribution
    .filter((d) => d.score >= 4)
    .reduce((acc, curr) => acc + curr.percentage, 0);

  return (
    <div className="w-full">
      {/* Metric summary banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-3 rounded-xl bg-theme-subtle border border-theme">
        <div>
          <span className="text-[11px] text-theme-muted block font-medium">Média Geral</span>
          <span className="text-xl font-bold tracking-tight text-theme-primary">
            {formatNumber(stats.average, decimalPlaces)}{' '}
            <span className="text-xs text-theme-muted font-normal">/ {stats.max || 5}</span>
          </span>
        </div>
        <div>
          <span className="text-[11px] text-theme-muted block font-medium">Mediana</span>
          <span className="text-xl font-bold tracking-tight text-theme-main">
            {formatNumber(stats.median, 0)}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-theme-muted block font-medium">Satisfação (4 e 5)</span>
          <span className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatPercentage(positivePercent, decimalPlaces)}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-theme-muted block font-medium">Respostas Válidas</span>
          <span className="text-xl font-bold tracking-tight text-theme-main font-mono">
            {stats.validResponses}
          </span>
        </div>
      </div>

      {/* Bar Distribution */}
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} opacity={0.6} />
            <XAxis
              dataKey="score"
              stroke={textColor}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={textColor}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-theme bg-theme-surface p-3 shadow-md text-xs text-theme-main">
                      <p className="font-bold text-theme-main mb-1">
                        {p.score}
                      </p>
                      <div className="flex items-center justify-between gap-4 text-theme-muted">
                        <span>Respondentes:</span>
                        <span className="font-bold text-theme-primary">
                          {p.count} ({p.formattedPercentage})
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {data.map((entry) => {
                let fill = primaryColor;
                if (entry.scoreNum <= 2) fill = '#f43f5e';
                else if (entry.scoreNum === 3) fill = '#f59e0b';
                else fill = primaryColor;
                return <Cell key={`cell-${entry.score}`} fill={fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Min / Max Anchors */}
      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-xs text-theme-muted mt-1 px-2">
          <span>1: {minLabel || 'Péssimo / Discordo'}</span>
          <span>{stats.max || 5}: {maxLabel || 'Excelente / Concordo totalmente'}</span>
        </div>
      )}
    </div>
  );
}
