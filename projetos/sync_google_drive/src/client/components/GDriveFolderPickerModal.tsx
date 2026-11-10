import React, { useState, useEffect } from 'react';
import { Cloud, Folder, ArrowUp, Check, X, Loader2 } from 'lucide-react';
import { api } from '../lib/api.js';

interface GDriveFolderPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (folderId: string, folderName: string) => void;
}

export const GDriveFolderPickerModal: React.FC<GDriveFolderPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [currentId, setCurrentId] = useState('root');
  const [currentName, setCurrentName] = useState('Meu Drive');
  const [pathStack, setPathStack] = useState<Array<{ id: string; name: string }>>([
    { id: 'root', name: 'Meu Drive' },
  ]);
  const [folders, setFolders] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFolders = async (parentId: string, parentName: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.browseGDrive(parentId);
      setCurrentId(data.currentId);
      setCurrentName(data.currentName || parentName);
      setFolders(data.folders);
    } catch (err: any) {
      setError(err.message || 'Erro ao listar pastas do Google Drive. Verifique se está autenticado.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setPathStack([{ id: 'root', name: 'Meu Drive' }]);
      loadFolders('root', 'Meu Drive');
    }
  }, [isOpen]);

  const handleOpenFolder = (folder: { id: string; name: string }) => {
    setPathStack((prev) => [...prev, folder]);
    loadFolders(folder.id, folder.name);
  };

  const handleNavigateUp = () => {
    if (pathStack.length <= 1) return;
    const newStack = pathStack.slice(0, pathStack.length - 1);
    const target = newStack[newStack.length - 1];
    setPathStack(newStack);
    loadFolders(target.id, target.name);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-xl shadow-2xl border border-zinc-800 flex flex-col max-h-[85vh] overflow-hidden bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-700/60">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Explorar Google Drive</h3>
              <p className="text-xs text-zinc-400">Escolha a pasta de destino na sua conta do Google Drive</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Breadcrumb / Path */}
        <div className="px-6 py-3 bg-zinc-950/60 border-b border-zinc-800 flex items-center gap-2">
          <button
            disabled={pathStack.length <= 1 || loading}
            onClick={handleNavigateUp}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 border border-zinc-700/60 disabled:opacity-30 disabled:pointer-events-none transition"
            title="Voltar pasta acima"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <div className="flex-1 overflow-x-auto flex items-center gap-1.5 text-xs text-zinc-300">
            {pathStack.map((p, idx) => (
              <React.Fragment key={p.id + idx}>
                {idx > 0 && <span className="text-zinc-600">/</span>}
                <span className={idx === pathStack.length - 1 ? 'font-medium text-zinc-100' : 'text-zinc-400'}>
                  {p.name}
                </span>
              </React.Fragment>
            ))}
          </div>
          <span className="text-[11px] font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
            ID: {currentId}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg">
              <p className="font-semibold mb-1">Não foi possível carregar as pastas</p>
              <p className="text-xs opacity-90">{error}</p>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400 mb-2" />
              <p className="text-xs">Buscando pastas no Google Drive...</p>
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Folder className="w-10 h-10 text-zinc-700 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium text-zinc-400">Nenhuma subpasta encontrada aqui.</p>
              <p className="text-xs text-zinc-500 mt-1">Você pode selecionar a pasta atual "{currentName}".</p>
            </div>
          ) : (
            <div className="space-y-1">
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleOpenFolder(f)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-800/60 text-left transition group text-zinc-300 hover:text-zinc-100"
                >
                  <div className="flex items-center gap-3">
                    <Folder className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200" />
                    <span className="text-xs font-medium">{f.name}</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500 group-hover:text-zinc-400">
                    {f.id}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-950/80 border-t border-zinc-800">
          <div className="text-xs text-zinc-400">
            Pasta selecionada: <span className="text-zinc-100 font-medium">{currentName}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onSelect(currentId, currentName);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-950 shadow-sm transition"
            >
              <Check className="w-3.5 h-3.5" />
              Usar Esta Pasta ({currentName})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
