'use client';

import React, { useEffect, useRef } from 'react';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

export function DropdownMenu({ trigger, children, align = 'right' }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <div
          className={`absolute z-50 mt-1 min-w-[140px] overflow-hidden rounded-lg border border-parchment bg-white shadow-lg dark:border-[#1e2d44] dark:bg-[#243044] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div onClick={() => setOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'danger';
  icon?: React.ReactNode;
}

export function DropdownMenuItem({ children, onClick, variant = 'default', icon }: DropdownMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
        variant === 'danger'
          ? 'text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'
          : 'text-charcoal hover:bg-cream dark:text-gray-200 dark:hover:bg-[#1e2d44]'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
