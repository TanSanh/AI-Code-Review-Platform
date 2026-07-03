'use client';

import React, { useRef, useCallback } from 'react';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OtpInput({ length = 6, value, onChange, disabled }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = useCallback(
    (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;

      // Only allow digits
      if (!/^\d*$/.test(val)) return;

      // Take last character if pasting multiple
      const digit = val.slice(-1);
      const newValue = value.split('');
      newValue[index] = digit;
      const joined = newValue.join('');

      onChange(joined);

      // Auto-focus next input
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [value, length, onChange],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        const newValue = value.split('');
        if (newValue[index]) {
          // Clear current
          newValue[index] = '';
          onChange(newValue.join(''));
        } else if (index > 0) {
          // Move back and clear
          newValue[index - 1] = '';
          onChange(newValue.join(''));
          inputRefs.current[index - 1]?.focus();
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowRight' && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [value, length, onChange],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
      if (pasted) {
        onChange(pasted.padEnd(length, ''));
        const focusIndex = Math.min(pasted.length, length - 1);
        inputRefs.current[focusIndex]?.focus();
      }
    },
    [length, onChange],
  );

  return (
    <div className="flex gap-2.5 justify-center">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          disabled={disabled}
          className="h-12 w-11 rounded-lg border border-gray-200 bg-white text-center text-lg font-bold text-gray-900 transition-all duration-200
            focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:outline-none
            dark:border-[#33355a] dark:bg-[#1e2038] dark:text-gray-100 dark:focus:border-gray-100 dark:focus:ring-gray-100/10
            disabled:opacity-50"
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}
