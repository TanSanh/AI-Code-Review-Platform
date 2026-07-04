'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useLanguage();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative w-full max-w-sm rounded-card border border-parchment bg-white shadow-xl dark:border-[#33355a] dark:bg-[#242640]">
        <div className="p-6 text-center">
          <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
            danger
              ? 'bg-red-100 dark:bg-red-500/15'
              : 'bg-amethyst/10 dark:bg-[#4b5563]/15'
          }`}>
            <AlertTriangle className={`h-6 w-6 ${
              danger
                ? 'text-red-500 dark:text-red-400'
                : 'text-amethyst dark:text-[#9ca3af]'
            }`} />
          </div>

          <h3 className="mb-2 text-heading-card font-semibold text-charcoal dark:text-gray-100">
            {title}
          </h3>
          <p className="text-sm text-charcoal/60 dark:text-gray-400">
            {message}
          </p>
        </div>

        <div className="flex items-center gap-3 border-t border-parchment px-6 py-4 dark:border-[#33355a]">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="flex-1 text-charcoal/60 dark:text-gray-400"
          >
            {cancelLabel || t('community.cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            className={`flex-1 text-white ${
              danger
                ? 'bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600'
                : 'bg-amethyst hover:bg-amethyst/90 dark:bg-[#4b5563] dark:hover:bg-[#4b5563]/90'
            }`}
          >
            {confirmLabel || t('community.deleteConfirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}
