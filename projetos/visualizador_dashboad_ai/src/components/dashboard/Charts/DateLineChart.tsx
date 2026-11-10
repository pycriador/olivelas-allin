import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { QuantitativeStats } from '../../../types/statistics';
import { formatPercentage } from '../../../utils/numberFormatting';
import { useTheme } from '../../../hooks/useTheme';

interface DateLineChartProps {
  stats: QuantitativeStats;
  isDark?: boolean;
  decimalPlaces?: number;
  height?: number;
}

export function DateLineChart({
  stats,
  isDark: propIsDark,
  decimalPlaces = 2,
  height = 280,
}: DateLineChartProps) {
  const { currentTheme, isDark: contextIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;

  const data = stats.frequencies.map((item) => ({
    date: item.label,
    count: item.count,
    percentage: item.percentage,
    formattedPercentage: formatPercentage(item.percentage, decimalPlaces),
  }));

  const primaryColor = currentTheme.previewColors?.primary || (isDark ? '#818cf8' : '#4f46e5');
  const gridColor = currentTheme.variables?.['--theme-border'] || (isDark ? '#334155' : '#e2e8f0');
  const textColor = currentTheme.variables?.['--theme-text-muted'] || (isDark ? '#94a3b8' : '#64748b');

  return (
    <div className="w-full">
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 20, left: -20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} opacity={0.6} />
            <XAxis
              dataKey="date"
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
                        {p.date}
                      </p>
                      <div className="flex items-center justify-between gap-4 text-theme-muted">
                        <span>Respostas neste dia:</span>
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
            <Line
              type="monotone"
              dataKey="count"
              stroke={primaryColor}
              strokeWidth={3}
              dot={{ r: 4, fill: primaryColor, strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 6, fill: primaryColor }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
