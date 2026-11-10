import React from 'react';
import { Bell, CheckCircle2, AlertCircle, X, Play } from 'lucide-react';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'file_detected' | 'sync_success' | 'sync_error' | 'info';
  folderId?: number;
}

interface NotificationToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  onSyncFolder?: (folderId: number) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  toasts,
  onDismiss,
  onSyncFolder,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isFileDetected = toast.type === 'file_detected';
        const isSuccess = toast.type === 'sync_success';
        const isError = toast.type === 'sync_error';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto p-3.5 rounded-xl bg-zinc-900/95 border border-zinc-800 shadow-xl flex items-start gap-3 transition-all duration-200 animate-slide-up"
          >
            <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0">
              {isFileDetected ? (
                <Bell className="w-3.5 h-3.5 text-amber-400" />
              ) : isSuccess ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : isError ? (
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Bell className="w-3.5 h-3.5 text-zinc-300" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h5 className="font-semibold text-xs text-zinc-100">{toast.title}</h5>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug break-words">
                {toast.message}
              </p>

              {isFileDetected && toast.folderId && onSyncFolder && (
                <button
                  onClick={() => {
                    onSyncFolder(toast.folderId!);
                    onDismiss(toast.id);
                  }}
                  className="mt-2 flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 hover:bg-white text-zinc-950 rounded-md text-[11px] font-medium transition shadow-xs"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Sincronizar Agora
                </button>
              )}
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 text-zinc-400 hover:text-zinc-200 rounded transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
