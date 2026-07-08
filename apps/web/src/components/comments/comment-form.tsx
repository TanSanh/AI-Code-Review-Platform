'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { Send, Loader2 } from 'lucide-react';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CommentForm({
  onSubmit,
  onTypingStart,
  onTypingStop,
  placeholder,
  disabled = false,
}: CommentFormProps) {
  const { t } = useLanguage();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const resolvedPlaceholder = placeholder || t('comments.writeComment');
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    try {
      await onSubmit(content.trim());
      setContent('');
      onTypingStop?.();
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Handle typing indicator
    if (onTypingStart && onTypingStop) {
      onTypingStart();

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        onTypingStop();
      }, 2000);
    }
  };

  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={resolvedPlaceholder}
        disabled={disabled || loading}
        rows={3}
        className="w-full p-3 text-body bg-white border border-gray-200 rounded-card resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent disabled:opacity-50 dark:bg-[#0f1520] dark:border-[#1e2d44] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:ring-gray-400"
      />
      <div className="flex items-center justify-between">
        <span className="text-caption text-gray-400 dark:text-gray-500">
          {t('comments.sendHint')}
        </span>
        <Button
          type="submit"
          variant="cream"
          disabled={!content.trim() || loading || disabled}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              {t('comments.send')}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
