import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff, ShieldAlert } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  type?: 'page' | 'inline' | 'network' | 'component';
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  type = 'component',
  title = 'Ocorreu um erro ao carregar os dados',
  message = 'Não foi possível completar a solicitação. Por favor, tente novamente.',
  onRetry,
  className = '',
}) => {
  if (type === 'inline') {
    return (
      <div
        className={`flex items-center justify-between gap-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="truncate">{message}</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="font-bold underline hover:opacity-80 shrink-0"
          >
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  const IconComponent = type === 'network' ? WifiOff : AlertTriangle;

  return (
    <div
      className={`p-8 sm:p-12 bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/60 rounded-3xl text-center flex flex-col items-center justify-center max-w-md mx-auto shadow-xs ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
        <IconComponent className="w-7 h-7" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm">
        {message}
      </p>

      {onRetry && (
        <div className="mt-6">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={onRetry}
          >
            Tentar Novamente
          </Button>
        </div>
      )}
    </div>
  );
};
