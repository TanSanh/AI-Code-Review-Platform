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

interface LanguageData {
  language: string;
  count: number;
}

interface LanguageDistributionChartProps {
  data: LanguageData[];
}

const COLORS = [
  '#7c3aed', // amethyst
  '#1b1938', // mysteria
  '#cbb7fb', // lavender
  '#292827', // charcoal
  '#e9e5dd', // cream
  '#f5f3ff', // light purple
  '#6b7280', // gray
  '#10b981', // green
];

export function LanguageDistributionChart({ data }: LanguageDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-charcoal/40">
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
          fill="#8884d8"
          dataKey="count"
          nameKey="language"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e9e5dd',
            borderRadius: '8px',
          }}
          formatter={(value, name) => [`${value} reviews`, name]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
