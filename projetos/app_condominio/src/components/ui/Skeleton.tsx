import React from 'react';
import { Loader2 } from 'lucide-react';

export interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = 'h-4 w-full',
  rounded = 'lg',
}) => {
  const roundedStyles = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  };

  return (
    <div
      className={`bg-slate-200/80 dark:bg-slate-800 animate-pulse ${roundedStyles[rounded]} ${className}`}
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => {
  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-full animate-pulse" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="h-9 bg-slate-50 dark:bg-slate-800/40 rounded-lg flex-1 animate-pulse"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-3 animate-pulse"
        >
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
};

export const PageLoadingState: React.FC<{ message?: string }> = ({
  message = 'Carregando dados...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[300px] gap-3">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
};
