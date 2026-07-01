'use client';

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
import { useTheme } from '@/contexts/theme-context';

interface TrendData {
  date: string;
  avgScore: number;
  reviewCount: number;
}

interface ScoreTrendChartProps {
  data: TrendData[];
}

export function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const textColor = isDark ? '#a1a1aa' : '#292827';
  const gridColor = isDark ? '#33355a' : '#e9e5dd';
  const tooltipBg = isDark ? '#242640' : '#fff';
  const tooltipBorder = isDark ? '#33355a' : '#e9e5dd';

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-charcoal/40 dark:text-gray-500">
        No trend data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: textColor }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 12, fill: textColor }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            color: isDark ? '#f4f4f5' : '#292827',
          }}
          formatter={(value) => [`${value}/100`, 'Score']}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Line
          type="monotone"
          dataKey="avgScore"
          stroke="#7c3aed"
          strokeWidth={2}
          dot={{ fill: '#7c3aed', strokeWidth: 2 }}
          activeDot={{ r: 6, fill: '#7c3aed' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
