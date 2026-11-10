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
import { QuantitativeStats } from '../../../types/statistics';
import { formatPercentage } from '../../../utils/numberFormatting';
import { useTheme } from '../../../hooks/useTheme';

interface CategoricalBarChartProps {
  stats: QuantitativeStats;
  isDark?: boolean;
  decimalPlaces?: number;
  height?: number;
}

export function CategoricalBarChart({
  stats,
  isDark: propIsDark,
  decimalPlaces = 2,
  height = 280,
}: CategoricalBarChartProps) {
  const { currentTheme, isDark: contextIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;

  const data = stats.frequencies.map((item) => ({
    name: item.label,
    count: item.count,
    percentage: item.percentage,
    formattedPercentage: formatPercentage(item.percentage, decimalPlaces),
  }));

  const primaryColor = currentTheme.previewColors?.primary || (isDark ? '#818cf8' : '#4f46e5');
  const accentColor = currentTheme.previewColors?.accent || (isDark ? '#38bdf8' : '#6366f1');
  const gridColor = currentTheme.variables?.['--theme-border'] || (isDark ? '#334155' : '#e2e8f0');
  const textColor = currentTheme.variables?.['--theme-text-muted'] || (isDark ? '#94a3b8' : '#64748b');

  return (
    <div className="w-full">
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 28 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} opacity={0.6} />
            <XAxis
              dataKey="name"
              stroke={textColor}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={45}
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
                        {p.name}
                      </p>
                      <div className="flex items-center justify-between gap-4 text-theme-muted">
                        <span>Respostas:</span>
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
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? primaryColor : index % 2 === 1 ? accentColor : primaryColor}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Numerical Data Table / Legend */}
      <div className="mt-4 border-t border-theme pt-3">
        <div className="flex flex-wrap gap-2 text-xs">
          {data.map((item, idx) => (
            <div
              key={item.name}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-theme-subtle border border-theme"
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: idx === 0 ? primaryColor : idx % 2 === 1 ? accentColor : primaryColor }}
              />
              <span className="text-theme-muted truncate max-w-[140px]" title={item.name}>
                {item.name}:
              </span>
              <span className="font-bold text-theme-main">
                {item.count} <span className="text-[10px] text-theme-muted font-normal">({item.formattedPercentage})</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
