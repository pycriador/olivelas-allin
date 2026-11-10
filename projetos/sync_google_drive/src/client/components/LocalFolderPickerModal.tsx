import React, { useState, useEffect } from 'react';
import { Folder, HardDrive, ArrowUp, Check, X, Loader2, Star } from 'lucide-react';
import { api } from '../lib/api.js';

interface LocalFolderPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedPath: string) => void;
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
  const [drives, setDrives] = useState<Array<{ name: string; path: string }>>([]);
  const [shortcuts, setShortcuts] = useState<Array<{ name: string; path: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDirectory = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.browseLocal(path);
      setCurrentPath(data.currentPath);
      setParentPath(data.parentPath);
      setItems(data.items);
      if (data.drives) setDrives(data.drives);
      if (data.shortcuts) setShortcuts(data.shortcuts);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar diretório.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDirectory(initialPath || '');
    }
  }, [isOpen, initialPath]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-xl shadow-2xl border border-zinc-800 flex flex-col max-h-[85vh] overflow-hidden bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-700/60">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Explorar Pastas Locais</h3>
              <p className="text-xs text-zinc-400">Navegue e selecione o diretório para sincronizar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Path & Navigation */}
        <div className="px-6 py-3 bg-zinc-950/60 border-b border-zinc-800 flex items-center gap-2">
          <button
            disabled={!parentPath || loading}
            onClick={() => parentPath && loadDirectory(parentPath)}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 border border-zinc-700/60 disabled:opacity-30 disabled:pointer-events-none transition"
            title="Pasta anterior"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <div className="flex-1 overflow-x-auto text-xs font-mono text-zinc-300 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 whitespace-nowrap">
            {currentPath || 'Selecione uma unidade ou atalho abaixo'}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Atalhos Rápidos */}
          {!currentPath && (
            <div className="space-y-4">
              {shortcuts.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    Atalhos Rápidos
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {shortcuts.map((sc) => (
                      <button
                        key={sc.path}
                        onClick={() => loadDirectory(sc.path)}
                        className="flex items-center gap-3 p-3 rounded-lg bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800 text-left transition group"
                      >
                        <Folder className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                        <div>
                          <p className="text-xs font-medium text-zinc-200">{sc.name}</p>
                          <p className="text-[11px] text-zinc-500 font-mono truncate max-w-[200px]">{sc.path}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Unidades de Disco */}
              {drives.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
                    Unidades de Disco
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {drives.map((drive) => (
                      <button
                        key={drive.path}
                        onClick={() => loadDirectory(drive.path)}
                        className="flex items-center gap-3 p-3 rounded-lg bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800 text-left transition group"
                      >
                        <HardDrive className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                        <div>
                          <p className="text-xs font-medium text-zinc-200">Disco {drive.name}</p>
                          <p className="text-[11px] text-zinc-500 font-mono">{drive.path}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lista de Pastas */}
          {currentPath && (
            <div className="space-y-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-400 mb-2" />
                  <p className="text-xs">Carregando pastas...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 text-xs">
                  Nenhuma subpasta encontrada neste diretório.
                </div>
              ) : (
                items.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => loadDirectory(item.path)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/60 text-left transition group text-zinc-300 hover:text-zinc-100"
                  >
                    <Folder className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200" />
                    <span className="text-xs font-medium truncate flex-1">{item.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-950/80 border-t border-zinc-800">
          <button
            onClick={() => loadDirectory('')}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition"
          >
            Voltar para Unidades & Atalhos
          </button>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
            >
              Cancelar
            </button>
            <button
              disabled={!currentPath}
              onClick={() => {
                if (currentPath) {
                  onSelect(currentPath);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-950 shadow-sm disabled:opacity-40 disabled:pointer-events-none transition"
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
