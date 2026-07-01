'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <FileQuestion className="mb-6 h-16 w-16 text-mysteria/40" />
      <h1 className="text-display-section mb-2 text-charcoal">404</h1>
      <p className="text-body mb-8 max-w-md text-charcoal/60">
        {t('notFound.message')}
      </p>
      <Link href="/">
        <Button variant="cream">{t('notFound.backHome')}</Button>
      </Link>
    </div>
  );
}
