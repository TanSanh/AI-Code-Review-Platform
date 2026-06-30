'use client';

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

interface SeverityData {
  severity: string;
  count: number;
}

interface IssuesBySeverityChartProps {
  data: SeverityData[];
}

const SEVERITY_COLORS: Record<string, string> = {
  ERROR: '#ef4444',
  WARNING: '#f59e0b',
  INFO: '#3b82f6',
  SUGGESTION: '#8b5cf6',
};

export function IssuesBySeverityChart({ data }: IssuesBySeverityChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-charcoal/40">
        No issues data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e9e5dd" />
        <XAxis
          dataKey="severity"
          tick={{ fontSize: 12, fill: '#292827' }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#292827' }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e9e5dd',
            borderRadius: '8px',
          }}
          formatter={(value) => [`${value} issues`, 'Count']}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={SEVERITY_COLORS[entry.severity] || '#6b7280'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
