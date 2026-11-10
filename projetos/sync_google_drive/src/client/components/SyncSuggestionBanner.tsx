import React from 'react';
import { Bell, Play, X, Clock } from 'lucide-react';
import { SyncSuggestion } from '../types.js';

interface SyncSuggestionBannerProps {
  suggestions: SyncSuggestion[];
  onSyncFolder: (folderId: number) => void;
  onDismiss: (folderId: number) => void;
}

export const SyncSuggestionBanner: React.FC<SyncSuggestionBannerProps> = ({
  suggestions,
  onSyncFolder,
  onDismiss,
}) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3 mb-6 animate-fade-in">
      {suggestions.map((sug) => (
        <div
          key={sug.folderId}
          className="rounded-xl bg-zinc-900 border border-zinc-800 border-l-4 border-l-amber-500 p-4 shadow-sm transition-all"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Ícone e Texto Informativo */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 sm:mt-0">
                <Bell className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                    {sug.isTest ? 'Teste de Monitoramento' : 'Novos Arquivos'}
                  </span>

                  {sug.watchDelaySeconds && (
                    <span className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      Aguardou {sug.watchDelaySeconds}s
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-semibold text-zinc-100 truncate">
                  {sug.totalCount} novo(s) arquivo(s) detectados em{' '}
                  <span className="text-white font-bold">"{sug.folderName}"</span>
                </h4>

                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Alterações identificadas no disco local. Deseja iniciar o envio para o Google Drive?
                </p>

                {/* Lista prévia de arquivos detectados */}
                {sug.files && sug.files.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap text-[11px] text-zinc-400">
                    <span className="text-zinc-400 text-[10px]">Arquivos:</span>
                    {sug.files.slice(0, 4).map((file, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 font-mono text-[10px] text-zinc-300 max-w-[180px] truncate"
                        title={file}
                      >
                        {file}
                      </span>
                    ))}
                    {sug.totalCount > 4 && (
                      <span className="text-[10px] text-zinc-400 font-medium">
                        +{sug.totalCount - 4} outro(s)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Ações: Executar Agora ou Dispensar */}
            <div className="flex items-center gap-2 self-stretch sm:self-center justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
              <button
                onClick={() => onDismiss(sug.folderId)}
                className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition"
              >
                Dispensar
              </button>

              <button
                onClick={() => {
                  onSyncFolder(sug.folderId);
                  onDismiss(sug.folderId);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg text-xs font-medium shadow-xs transition active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Sincronizar Agora</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
