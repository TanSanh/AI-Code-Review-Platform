'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { CodeEditor } from './code-editor';

interface CodeDiffProps {
  originalCode: string;
  fixedCode: string;
  language: string;
  onClose: () => void;
}

export function CodeDiff({ originalCode, fixedCode, language, onClose }: CodeDiffProps) {
  const { t } = useLanguage();

  return (
    <div className="mt-6 rounded-card border border-gray-200 dark:border-[#1e2d44] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#1a2332] border-b border-gray-200 dark:border-[#1e2d44]">
        <h3 className="text-body-heading font-semibold text-gray-900 dark:text-gray-100">
          {t('reviewDetail.fixedCode')}
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="grid lg:grid-cols-2 divide-x divide-gray-200 dark:divide-[#1e2d44]">
        <div>
          <div className="px-4 py-2 bg-gray-50 dark:bg-[#1a2332] border-b border-gray-200 dark:border-[#1e2d44]">
            <span className="text-micro text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('reviewDetail.originalCode')}
            </span>
          </div>
          <CodeEditor
            code={originalCode}
            language={language}
            readOnly={true}
            height="300px"
          />
        </div>
        <div>
          <div className="px-4 py-2 bg-gray-50 dark:bg-[#1a2332] border-b border-gray-200 dark:border-[#1e2d44]">
            <span className="text-micro text-green-600 dark:text-green-400 uppercase tracking-wider">
              {t('reviewDetail.improvedCode')}
            </span>
          </div>
          <CodeEditor
            code={fixedCode}
            language={language}
            readOnly={true}
            height="300px"
          />
        </div>
      </div>
    </div>
  );
}
