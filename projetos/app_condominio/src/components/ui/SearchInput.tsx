import React, { forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input, InputProps } from './Input';

export interface SearchInputProps extends Omit<InputProps, 'type' | 'leftIcon'> {
  onClear?: () => void;
  shortcutBadge?: string; // e.g. "⌘K"
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onClear, shortcutBadge, rightIcon, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="search"
        leftIcon={<Search className="w-4 h-4" />}
        value={value}
        rightIcon={
          value && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="pointer-events-auto p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
              aria-label="Limpar pesquisa"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : shortcutBadge ? (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pointer-events-none">
              {shortcutBadge}
            </kbd>
          ) : (
            rightIcon
          )
        }
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';
