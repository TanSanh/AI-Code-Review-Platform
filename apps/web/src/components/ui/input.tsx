import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-button border border-parchment bg-white px-3 py-2 text-sm text-charcoal ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-charcoal/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#33355a] dark:bg-[#1a1b2e] dark:text-gray-100 dark:ring-offset-[#1a1b2e] dark:placeholder:text-gray-500',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
