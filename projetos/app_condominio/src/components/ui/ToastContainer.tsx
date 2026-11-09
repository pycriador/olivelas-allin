import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 z-[9999] flex flex-col gap-2 max-w-[calc(100vw-24px)] sm:max-w-sm w-full mx-auto sm:mx-0 pointer-events-none"
    >
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
          info: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />,
        };

        const borders = {
          success: 'border-emerald-200 dark:border-emerald-800/80',
          error: 'border-rose-200 dark:border-rose-800/80',
          warning: 'border-amber-200 dark:border-amber-800/80',
          info: 'border-blue-200 dark:border-blue-800/80',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 bg-white dark:bg-slate-900 border rounded-2xl shadow-xl animate-in slide-in-from-right-4 fade-in duration-200 ${borders[toast.type]}`}
          >
            {icons[toast.type]}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                {toast.title}
              </h4>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
