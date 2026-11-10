import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { RunHistoryItem } from '../types.js';
import { api } from '../lib/api.js';
import { formatDate, formatDuration, copyToClipboard } from '../lib/utils.js';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<RunHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const loadHistory = async (targetPage = 1) => {
    setLoading(true);
    try {
      const data = await api.getHistory(targetPage, 15);
      setItems(data.items || []);
      setPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages || 1);
    } catch {
      // ignora erro
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClear = async () => {
    await api.clearHistory();
    loadHistory(1);
  };

  const handleCopy = async (id: number, url: string) => {
    await copyToClipboard(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <History className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                Histórico de Execuções e URLs Geradas
              </h2>
              <p className="text-xs text-zinc-400">
                Registro de sessões locais e links públicos criados anteriormente
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-300 hover:text-red-300 text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar Histórico
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <span className="text-xs">Carregando histórico...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-sm">
              Nenhuma execução registrada no histórico ainda.
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((h) => (
                <div
                  key={h.id}
                  className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-zinc-100">{h.app_name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          h.status === 'running'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : h.status === 'failed'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {h.status === 'running'
                          ? 'Ativo'
                          : h.status === 'failed'
                          ? 'Erro'
                          : 'Finalizado'}
                      </span>
                      {h.tunnel_provider && h.tunnel_provider !== 'none' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {h.tunnel_provider}
                        </span>
                      )}
                    </div>

                    {h.public_url ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={h.public_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-mono text-emerald-400 hover:underline truncate"
                        >
                          {h.public_url}
                        </a>
                        <button
                          onClick={() => handleCopy(h.id, h.public_url)}
                          className="text-zinc-400 hover:text-zinc-200"
                          title="Copiar URL"
                        >
                          {copiedId === h.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={h.public_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-zinc-400 hover:text-zinc-200"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ) : (
                      <div className="text-xs font-mono text-zinc-400">{h.local_url}</div>
                    )}

                    {h.error_message && (
                      <p className="text-[11px] text-red-400">{h.error_message}</p>
                    )}
                  </div>

                  <div className="text-right text-[11px] text-zinc-400 shrink-0 space-y-0.5">
                    <div>Início: {formatDate(h.started_at)}</div>
                    {h.duration_seconds > 0 && (
                      <div className="text-zinc-500">
                        Duração: {formatDuration(h.duration_seconds)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span>
              Página {page} de {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => loadHistory(page - 1)}
                disabled={page <= 1}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => loadHistory(page + 1)}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
