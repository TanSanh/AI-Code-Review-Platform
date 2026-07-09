'use client';

import React, { useState, useMemo } from 'react';
import { X, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNum: number;
}

function computeDiff(original: string, fixed: string): DiffLine[] {
  const oldLines = original.split('\n');
  const newLines = fixed.split('\n');

  // Simple LCS-based diff
  const lcs = buildLCS(oldLines, newLines);
  const result: DiffLine[] = [];
  let oldIdx = 0;
  let newIdx = 0;
  let lcsIdx = 0;
  let lineNum = 1;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (lcsIdx < lcs.length) {
      // Output removed lines (in old but not in LCS)
      while (oldIdx < oldLines.length && oldLines[oldIdx] !== lcs[lcsIdx]) {
        result.push({ type: 'removed', content: oldLines[oldIdx], lineNum: 0 });
        oldIdx++;
      }
      // Output added lines (in new but not in LCS)
      while (newIdx < newLines.length && newLines[newIdx] !== lcs[lcsIdx]) {
        result.push({ type: 'added', content: newLines[newIdx], lineNum });
        newIdx++;
        lineNum++;
      }
      // Output unchanged line
      if (lcsIdx < lcs.length) {
        result.push({ type: 'unchanged', content: lcs[lcsIdx], lineNum });
        oldIdx++;
        newIdx++;
        lcsIdx++;
        lineNum++;
      }
    } else {
      // Remaining lines
      while (oldIdx < oldLines.length) {
        result.push({ type: 'removed', content: oldLines[oldIdx], lineNum: 0 });
        oldIdx++;
      }
      while (newIdx < newLines.length) {
        result.push({ type: 'added', content: newLines[newIdx], lineNum });
        newIdx++;
        lineNum++;
      }
    }
  }

  return result;
}

function buildLCS(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack
  const lcs: string[] = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}

const COLLAPSE_THRESHOLD = 30;

interface CodeDiffProps {
  originalCode: string;
  fixedCode: string;
  language: string;
  onClose: () => void;
}

export function CodeDiff({ originalCode, fixedCode, language, onClose }: CodeDiffProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const diff = useMemo(() => computeDiff(originalCode, fixedCode), [originalCode, fixedCode]);
  const addedCount = diff.filter((l) => l.type === 'added').length;
  const removedCount = diff.filter((l) => l.type === 'removed').length;
  const shouldCollapse = diff.length > COLLAPSE_THRESHOLD;
  const visibleLines = expanded || !shouldCollapse ? diff : diff.slice(0, COLLAPSE_THRESHOLD);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fixedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = fixedCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mt-6 rounded-card border border-gray-200 dark:border-[#1e2d44] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#1a2332] border-b border-gray-200 dark:border-[#1e2d44]">
        <div className="flex items-center gap-3">
          <h3 className="text-body-heading font-semibold text-gray-900 dark:text-gray-100">
            {t('reviewDetail.fixedCode')}
          </h3>
          <div className="flex items-center gap-2 text-micro">
            {addedCount > 0 && (
              <span className="text-green-600 dark:text-green-400">+{addedCount}</span>
            )}
            {removedCount > 0 && (
              <span className="text-red-500 dark:text-red-400">-{removedCount}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-[#1e2d44] transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-green-500">{t('reviewDetail.copied')}</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>{t('reviewDetail.copyCode')}</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Diff Content */}
      <div className="bg-white dark:bg-[#0f1520] font-mono text-sm">
        {visibleLines.map((line, idx) => (
          <div
            key={idx}
            className={`flex border-b border-gray-100 dark:border-[#1e2d44]/50 ${
              line.type === 'added'
                ? 'bg-green-50 dark:bg-green-500/10'
                : line.type === 'removed'
                ? 'bg-red-50 dark:bg-red-500/10'
                : ''
            }`}
          >
            {/* Line indicator */}
            <div className={`w-8 shrink-0 flex items-center justify-center text-xs select-none ${
              line.type === 'added'
                ? 'text-green-500 dark:text-green-400'
                : line.type === 'removed'
                ? 'text-red-400 dark:text-red-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}>
              {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
            </div>
            {/* Line number */}
            <div className="w-12 shrink-0 px-2 py-1 text-right text-xs text-gray-400 dark:text-gray-600 select-none border-r border-gray-100 dark:border-[#1e2d44]/50">
              {line.lineNum || ''}
            </div>
            {/* Code content */}
            <pre className="flex-1 px-3 py-1 overflow-x-auto whitespace-pre">
              <code className={
                line.type === 'added'
                  ? 'text-green-700 dark:text-green-300'
                  : line.type === 'removed'
                  ? 'text-red-600 dark:text-red-300'
                  : 'text-gray-700 dark:text-gray-300'
              }>
                {line.content || ' '}
              </code>
            </pre>
          </div>
        ))}
      </div>

      {/* Expand/Collapse */}
      {shouldCollapse && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 dark:bg-[#1a2332] border-t border-gray-200 dark:border-[#1e2d44] text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              {t('reviewDetail.collapse')}
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              {t('reviewDetail.expand')} ({diff.length - COLLAPSE_THRESHOLD} {t('reviewDetail.moreLines')})
            </>
          )}
        </button>
      )}
    </div>
  );
}
