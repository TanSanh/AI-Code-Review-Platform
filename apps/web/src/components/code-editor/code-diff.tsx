'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, Copy, Check, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNum: number;
}

function computeDiff(original: string, fixed: string): DiffLine[] {
  const oldLines = original.split('\n');
  const newLines = fixed.split('\n');
  const lcs = buildLCS(oldLines, newLines);
  const result: DiffLine[] = [];
  let oldIdx = 0, newIdx = 0, lcsIdx = 0, lineNum = 1;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (lcsIdx < lcs.length) {
      while (oldIdx < oldLines.length && oldLines[oldIdx] !== lcs[lcsIdx]) {
        result.push({ type: 'removed', content: oldLines[oldIdx], lineNum: 0 });
        oldIdx++;
      }
      while (newIdx < newLines.length && newLines[newIdx] !== lcs[lcsIdx]) {
        result.push({ type: 'added', content: newLines[newIdx], lineNum });
        newIdx++;
        lineNum++;
      }
      if (lcsIdx < lcs.length) {
        result.push({ type: 'unchanged', content: lcs[lcsIdx], lineNum });
        oldIdx++;
        newIdx++;
        lcsIdx++;
        lineNum++;
      }
    } else {
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
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  const lcs: string[] = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) { lcs.unshift(a[i - 1]); i--; j--; }
    else if (dp[i - 1][j] > dp[i][j - 1]) i--;
    else j--;
  }
  return lcs;
}

function DiffLines({ lines }: { lines: DiffLine[] }) {
  return (
    <div className="bg-white dark:bg-[#0f1520] font-mono text-[13px] leading-relaxed">
      {lines.map((line, idx) => (
        <div
          key={idx}
          className={`flex items-stretch border-b border-gray-100 dark:border-[#1e2d44]/30 ${
            line.type === 'added'
              ? 'bg-green-50 dark:bg-green-500/10'
              : line.type === 'removed'
              ? 'bg-red-50 dark:bg-red-500/10'
              : ''
          }`}
        >
          {/* +/- indicator */}
          <div className={`w-6 shrink-0 flex items-center justify-center text-xs select-none font-bold ${
            line.type === 'added'
              ? 'text-green-500 dark:text-green-400'
              : line.type === 'removed'
              ? 'text-red-400 dark:text-red-400'
              : 'text-transparent'
          }`}>
            {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
          </div>
          {/* Line number */}
          <div className="w-12 shrink-0 px-2 py-0.5 text-right text-xs text-gray-400 dark:text-gray-600 select-none border-r border-gray-100 dark:border-[#1e2d44]/30">
            {line.lineNum || ''}
          </div>
          {/* Code content */}
          <div className="flex-1 min-w-0 px-3 py-0.5 overflow-hidden">
            <span className={
              line.type === 'added'
                ? 'text-green-700 dark:text-green-300'
                : line.type === 'removed'
                ? 'text-red-600 dark:text-red-300'
                : 'text-gray-700 dark:text-gray-300'
            }>
              {line.content}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

interface CodeDiffProps {
  originalCode: string;
  fixedCode: string;
  language: string;
  onClose: () => void;
  onAccept?: () => void;
  onReReview?: () => void;
}

export function CodeDiff({ originalCode, fixedCode, language, onClose, onAccept, onReReview }: CodeDiffProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const diff = useMemo(() => computeDiff(originalCode, fixedCode), [originalCode, fixedCode]);
  const addedCount = diff.filter((l) => l.type === 'added').length;
  const removedCount = diff.filter((l) => l.type === 'removed').length;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    if (fullscreen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [fullscreen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fixedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = fixedCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const header = (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#1a2332] border-b border-gray-200 dark:border-[#1e2d44] shrink-0">
      <div className="flex items-center gap-3">
        <h3 className="text-body-heading font-semibold text-gray-900 dark:text-gray-100">
          {t('reviewDetail.fixedCode')}
        </h3>
        <div className="flex items-center gap-2 text-micro">
          <span className="text-green-600 dark:text-green-400 font-semibold">+{addedCount}</span>
          <span className="text-red-500 dark:text-red-400 font-semibold">-{removedCount}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {onAccept && (
          <button
            onClick={onAccept}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 transition-colors"
          >
            <Check className="h-4 w-4" />
            <span>{t('reviewDetail.acceptChange')}</span>
          </button>
        )}
        {onReReview && (
          <button
            onClick={onReReview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-[#1e2d44] transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>{t('reviewDetail.reReview')}</span>
          </button>
        )}
        <button
          onClick={() => setFullscreen(!fullscreen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-[#1e2d44] transition-colors"
        >
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          <span>{fullscreen ? t('reviewDetail.collapse') : t('reviewDetail.expand')}</span>
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-[#1e2d44] transition-colors"
        >
          {copied ? (
            <><Check className="h-4 w-4 text-green-500" /><span className="text-green-500">{t('reviewDetail.copied')}</span></>
          ) : (
            <><Copy className="h-4 w-4" /><span>{t('reviewDetail.copyCode')}</span></>
          )}
        </button>
        <button
          onClick={fullscreen ? () => setFullscreen(false) : onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-[#0b1120]">
        {header}
        <div className="flex-1 overflow-auto">
          <DiffLines lines={diff} />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-card border border-gray-200 dark:border-[#1e2d44] overflow-hidden">
      {header}
      <div className="max-h-[500px] overflow-auto">
        <DiffLines lines={diff} />
      </div>
    </div>
  );
}
