'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { useTheme } from '@/contexts/theme-context';

interface LanguageData {
  language: string;
  count: number;
}

interface LanguageDistributionChartProps {
  data: LanguageData[];
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export function LanguageDistributionChart({ data }: LanguageDistributionChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const textColor = isDark ? '#a1a1aa' : '#292827';
  const tooltipBg = isDark ? '#1a2332' : '#fff';
  const tooltipBorder = isDark ? '#1e2d44' : '#e9e5dd';

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-charcoal/40 dark:text-gray-500">
        No language data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#6b7280"
          dataKey="count"
          nameKey="language"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            borderRadius: '8px',
            color: isDark ? '#f4f4f5' : '#292827',
          }}
          formatter={(value, name) => [`${value} reviews`, name]}
        />
        <Legend wrapperStyle={{ color: textColor }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
