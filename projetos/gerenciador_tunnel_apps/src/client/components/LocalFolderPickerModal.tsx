import React, { useState, useEffect } from 'react';
import {
  X,
  Folder,
  ArrowUp,
  Check,
  Loader2,
  HardDrive,
  Search,
  AlertCircle,
  Bookmark,
} from 'lucide-react';
import { api } from '../lib/api.js';

interface LocalFolderPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  initialPath?: string;
}

export const LocalFolderPickerModal: React.FC<LocalFolderPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  initialPath = '',
}) => {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [items, setItems] = useState<Array<{ name: string; path: string; isDirectory: boolean }>>([]);
  const [shortcuts, setShortcuts] = useState<Array<{ name: string; path: string }>>([]);
  const [drives, setDrives] = useState<Array<{ name: string; path: string; isDirectory: boolean }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadDirectory(initialPath || '');
    }
  }, [isOpen, initialPath]);

  const loadDirectory = async (targetPath: string) => {
    setLoading(true);
    setError(null);
    setSearchFilter('');
    try {
      const data = await api.browseLocal(targetPath);
      setCurrentPath(data.currentPath);
      setParentPath(data.parentPath);
      setItems(data.items || []);
      if (data.shortcuts) setShortcuts(data.shortcuts);
      if (data.drives) setDrives(data.drives);
    } catch (err: any) {
      setError(err.message || 'Erro ao acessar pasta.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[82vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Folder className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Selecionar Pasta do Projeto</h3>
              <p className="text-[11px] text-zinc-400">
                Escolha o diretório onde sua aplicação local será executada
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de Atalhos Rápidos */}
        {(shortcuts.length > 0 || drives.length > 0) && (
          <div className="px-5 py-2.5 bg-zinc-950/60 border-b border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto">
            <Bookmark className="w-3.5 h-3.5 text-zinc-500 shrink-0 mr-1" />
            {drives.map((d) => (
              <button
                key={d.path}
                onClick={() => loadDirectory(d.path)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-800/70 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/50 shrink-0 transition-colors"
              >
                <HardDrive className="w-3 h-3 text-indigo-400" />
                {d.name}
              </button>
            ))}
            {shortcuts.map((s) => (
              <button
                key={s.path}
                onClick={() => loadDirectory(s.path)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium shrink-0 transition-colors border ${
                  currentPath === s.path
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30'
                    : 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 border-zinc-700/40'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

        {/* Caminho Atual + Busca */}
        <div className="p-4 border-b border-zinc-800 space-y-2.5 bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => parentPath && loadDirectory(parentPath)}
              disabled={!parentPath || loading}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-40 transition-colors shrink-0"
              title="Subir um nível"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={currentPath}
              onChange={(e) => setCurrentPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') loadDirectory(currentPath);
              }}
              placeholder="Digite o caminho completo e pressione Enter..."
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => loadDirectory(currentPath)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
            >
              Ir
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filtrar subpastas..."
              className="w-full bg-zinc-950/70 border border-zinc-800/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/60"
            />
          </div>
        </div>

        {/* Lista de Pastas */}
        <div className="flex-1 overflow-y-auto p-3 min-h-[260px] max-h-[360px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-zinc-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <span className="text-xs">Carregando diretórios...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2.5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-xs">
              <Folder className="w-8 h-8 mb-2 opacity-30" />
              <span>Nenhuma subpasta encontrada neste diretório.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {filteredItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => loadDirectory(item.path)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-zinc-800/80 border border-transparent hover:border-zinc-700/60 transition-all group"
                >
                  <Folder className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="text-xs text-zinc-200 truncate font-medium">{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-zinc-800 bg-zinc-900/90 flex items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-400 truncate font-mono flex-1">
            Selecionado: <span className="text-zinc-200">{currentPath || 'Nenhum'}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (currentPath) {
                  onSelect(currentPath);
                  onClose();
                }
              }}
              disabled={!currentPath}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors shadow-lg shadow-indigo-600/20"
            >
              <Check className="w-3.5 h-3.5" />
              Selecionar Esta Pasta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
