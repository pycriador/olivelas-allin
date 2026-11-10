import React, { useState, useEffect } from 'react';
import { History, CheckCircle2, AlertCircle, Clock, Trash2, X, RefreshCw } from 'lucide-react';
import { SyncHistoryItem, SyncFolder } from '../types.js';
import { api } from '../lib/api.js';
import { formatBytes, formatDate } from '../lib/utils.js';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: SyncFolder[];
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  folders,
}) => {
  const [items, setItems] = useState<SyncHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const loadHistory = async (p = 1) => {
    setLoading(true);
    try {
      const data = await api.getHistory(p, 25, selectedFolderId, selectedStatus || undefined);
      setItems(data.items);
      setPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.total);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory(1);
    }
  }, [isOpen, selectedFolderId, selectedStatus]);

  const handleClearHistory = async () => {
    if (!window.confirm('Tem certeza de que deseja limpar o histórico de sincronização?')) return;
    try {
      await api.clearHistory(selectedFolderId);
      loadHistory(1);
    } catch (err) {
      alert('Erro ao limpar histórico.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl rounded-xl shadow-2xl border border-zinc-800 overflow-hidden bg-zinc-900 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-700/60">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Histórico de Arquivos Sincronizados</h3>
              <p className="text-xs text-zinc-400">Total de {totalItems} registro(s) no histórico</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filtros */}
        <div className="px-6 py-3 bg-zinc-950/60 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <select
              value={selectedFolderId || ''}
              onChange={(e) => setSelectedFolderId(e.target.value ? Number(e.target.value) : undefined)}
              className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
            >
              <option value="">Todas as Pastas</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
            >
              <option value="">Todos os Status</option>
              <option value="synced">Sincronizados (Sucesso)</option>
              <option value="failed">Com Falha</option>
              <option value="skipped">Já Atualizados</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadHistory(page)}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition border border-zinc-700/60"
              title="Atualizar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-lg text-xs font-medium transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar Histórico
            </button>
          </div>
        </div>

        {/* Tabela */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <Clock className="w-10 h-10 text-zinc-700 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium text-zinc-400">Nenhum registro de sincronização encontrado.</p>
              <p className="text-xs text-zinc-500 mt-1">Execute um sync manual ou agendado para registrar arquivos.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-medium text-[11px]">
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">Arquivo</th>
                    <th className="pb-3 px-3">Pasta Local</th>
                    <th className="pb-3 px-3">Tamanho</th>
                    <th className="pb-3 px-3">Data / Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-800/30 transition">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {item.status === 'synced' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[11px] font-medium border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Enviado
                          </span>
                        ) : item.status === 'failed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[11px] font-medium border border-rose-500/20" title={item.error_message || ''}>
                            <AlertCircle className="w-3 h-3" /> Falhou
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[11px] font-medium border border-zinc-700/50">
                            Ignorado
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 max-w-[220px]">
                        <p className="font-medium text-zinc-200 truncate">{item.file_name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono truncate">{item.relative_path}</p>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-300 font-normal">
                        {item.folder_name || 'Desconhecida'}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400 font-mono">
                        {formatBytes(item.file_size)}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap font-mono text-[11px]">
                        {formatDate(item.synced_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer / Paginação */}
        {totalPages > 1 && (
          <div className="px-6 py-3 bg-zinc-950/80 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span>Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => loadHistory(page - 1)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 disabled:opacity-30 disabled:pointer-events-none transition"
              >
                Anterior
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => loadHistory(page + 1)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 disabled:opacity-30 disabled:pointer-events-none transition"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
