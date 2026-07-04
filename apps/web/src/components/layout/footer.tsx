'use client';

import React from 'react';
import { useLanguage } from '@/contexts/language-context';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-gray-100 bg-white dark:border-[#2a3a52] dark:bg-[#111827]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
          {t('footer.copyright')}
        </p>
      </div>
    </footer>
  );
}
