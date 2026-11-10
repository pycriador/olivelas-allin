import React, { useState, useEffect } from 'react';
import {
  X,
  Folder,
  Cloud,
  Clock,
  Bell,
  Filter,
  Search,
  Loader2,
  FolderPlus,
} from 'lucide-react';
import { SyncFolder } from '../types.js';
import { api } from '../lib/api.js';
import { LocalFolderPickerModal } from './LocalFolderPickerModal.js';
import { GDriveFolderPickerModal } from './GDriveFolderPickerModal.js';

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialFolder?: SyncFolder | null;
}

export const NewFolderModal: React.FC<NewFolderModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialFolder,
}) => {
  const [name, setName] = useState('');
  const [localPath, setLocalPath] = useState('');
  const [gdriveFolderId, setGdriveFolderId] = useState('');
  const [gdriveFolderName, setGdriveFolderName] = useState('');
  const [syncMode, setSyncMode] = useState<'upload' | 'mirror'>('upload');
  
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleInterval, setScheduleInterval] = useState<'15m' | '30m' | 'hourly' | '6h' | 'daily' | 'custom'>('hourly');
  const [scheduleCron, setScheduleCron] = useState('');
  const [watchEnabled, setWatchEnabled] = useState(true);
  const [watchDelaySeconds, setWatchDelaySeconds] = useState(10);
  const [watchAutoSync, setWatchAutoSync] = useState(false);
  const [fileExtensions, setFileExtensions] = useState('');

  // Modais de exploração
  const [showLocalPicker, setShowLocalPicker] = useState(false);
  const [showDrivePicker, setShowDrivePicker] = useState(false);

  const [saving, setSaving] = useState(false);
  const [testingDrive, setTestingDrive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialFolder) {
      setName(initialFolder.name);
      setLocalPath(initialFolder.local_path);
      setGdriveFolderId(initialFolder.gdrive_folder_id);
      setGdriveFolderName(initialFolder.gdrive_folder_name || '');
      setSyncMode(initialFolder.sync_mode);
      setScheduleEnabled(initialFolder.schedule_enabled);
      setScheduleInterval(initialFolder.schedule_interval);
      setScheduleCron(initialFolder.schedule_cron || '');
      setWatchEnabled(initialFolder.watch_enabled);
      setWatchDelaySeconds(initialFolder.watch_delay_seconds || 10);
      setWatchAutoSync(Boolean(initialFolder.watch_auto_sync));
      setFileExtensions(initialFolder.file_extensions || '');
    } else {
      setName('');
      setLocalPath('');
      setGdriveFolderId('');
      setGdriveFolderName('');
      setSyncMode('upload');
      setScheduleEnabled(false);
      setScheduleInterval('hourly');
      setScheduleCron('');
      setWatchEnabled(true);
      setWatchDelaySeconds(10);
      setWatchAutoSync(false);
      setFileExtensions('');
    }
    setError(null);
  }, [initialFolder, isOpen]);

  if (!isOpen) return null;

  const handleTestDriveFolder = async () => {
    if (!gdriveFolderId.trim()) return;
    setTestingDrive(true);
    setError(null);
    try {
      if (gdriveFolderId.trim() === 'root') {
        setGdriveFolderName('Meu Drive (Raiz)');
        return;
      }
      const data = await api.browseGDrive(gdriveFolderId.trim());
      setGdriveFolderName(data.currentName);
    } catch (err: any) {
      setError(`Pasta do Drive não encontrada: ${err.message}`);
    } finally {
      setTestingDrive(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !localPath.trim() || !gdriveFolderId.trim()) {
      setError('Por favor preencha o Nome, Caminho Local e ID do Google Drive.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: Partial<SyncFolder> = {
        name: name.trim(),
        local_path: localPath.trim(),
        gdrive_folder_id: gdriveFolderId.trim(),
        gdrive_folder_name: gdriveFolderName.trim() || undefined,
        schedule_enabled: scheduleEnabled,
        schedule_interval: scheduleInterval,
        schedule_cron: scheduleInterval === 'custom' ? scheduleCron.trim() : undefined,
        watch_enabled: watchEnabled,
        watch_delay_seconds: Number(watchDelaySeconds) || 10,
        watch_auto_sync: watchAutoSync,
        file_extensions: fileExtensions.trim(),
      };

      if (initialFolder) {
        await api.updateFolder(initialFolder.id, payload);
      } else {
        await api.createFolder(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar pasta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-lg rounded-xl shadow-2xl border border-zinc-800 bg-zinc-900 overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-200">
                <FolderPlus className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  {initialFolder ? 'Editar Mapeamento de Pasta' : 'Novo Mapeamento de Pasta'}
                </h3>
                <p className="text-[11px] text-zinc-400">Configure o par de sincronização local e nuvem</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-200 rounded-md transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
            {error && (
              <div className="p-2.5 bg-red-950/40 border border-red-800/60 text-red-300 text-xs rounded-lg">
                {error}
              </div>
            )}

            {/* Nome da Regra */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Nome de Identificação *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Fotos de divulgação, Documentos, Backup"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
              />
            </div>

            {/* Caminho Local */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Diretório Local no Computador *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={localPath}
                  onChange={(e) => setLocalPath(e.target.value)}
                  placeholder="Ex: C:\Fotos"
                  className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono transition"
                />
                <button
                  type="button"
                  onClick={() => setShowLocalPicker(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700/80 transition"
                >
                  <Folder className="w-3.5 h-3.5" />
                  Explorar
                </button>
              </div>
            </div>

            {/* ID da Pasta no Google Drive */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Pasta de Destino no Google Drive *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={gdriveFolderId}
                  onChange={(e) => {
                    setGdriveFolderId(e.target.value);
                    setGdriveFolderName('');
                  }}
                  placeholder="ID da pasta ou 'root'"
                  className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono transition"
                />
                <button
                  type="button"
                  onClick={() => setShowDrivePicker(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700/80 transition"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  Explorar Drive
                </button>
                <button
                  type="button"
                  disabled={!gdriveFolderId.trim() || testingDrive}
                  onClick={handleTestDriveFolder}
                  className="p-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-lg border border-zinc-700/80 disabled:opacity-40 transition"
                  title="Identificar nome da pasta"
                >
                  {testingDrive ? <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-300" /> : <Search className="w-3.5 h-3.5" />}
                </button>
              </div>
              {gdriveFolderName && (
                <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                  ✓ Pasta identificada: <strong className="text-zinc-200 font-semibold">{gdriveFolderName}</strong>
                </p>
              )}
            </div>

            {/* Filtros de Extensão */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                <Filter className="w-3 h-3 text-zinc-400" />
                Filtro de Extensões (Opcional)
              </label>
              <input
                type="text"
                value={fileExtensions}
                onChange={(e) => setFileExtensions(e.target.value)}
                placeholder="Ex: .jpg, .png, .mp4 (deixe vazio para todos)"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono transition"
              />
            </div>

            {/* Agendamento & Notificações */}
            <div className="p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800 space-y-3.5">
              {/* Notificação de Novos Arquivos */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-zinc-800 text-zinc-300">
                      <Bell className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-200">Monitorar novos arquivos</p>
                      <p className="text-[11px] text-zinc-400">Detecta arquivos adicionados no diretório local</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={watchEnabled}
                    onChange={(e) => setWatchEnabled(e.target.checked)}
                    className="w-4 h-4 rounded accent-zinc-200 cursor-pointer"
                  />
                </div>

                {/* Opções de Tempo de Monitoramento e Ação */}
                {watchEnabled && (
                  <div className="mt-3 pl-8 space-y-2.5 pt-2.5 border-t border-zinc-800/80 animate-fade-in">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-300 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        Tempo de espera / estabilização para novos arquivos
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={watchDelaySeconds}
                          onChange={(e) => setWatchDelaySeconds(Number(e.target.value))}
                          className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-700/80 rounded-md text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                        >
                          <option value={5}>5 segundos (Rápido)</option>
                          <option value={10}>10 segundos (Padrão)</option>
                          <option value={30}>30 segundos</option>
                          <option value={60}>1 minuto</option>
                          <option value={120}>2 minutos</option>
                          <option value={300}>5 minutos</option>
                        </select>

                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-700/80 text-[11px] text-zinc-400">
                          <span>Aguardar</span>
                          <input
                            type="number"
                            min={2}
                            max={3600}
                            value={watchDelaySeconds}
                            onChange={(e) => setWatchDelaySeconds(Math.max(2, Number(e.target.value) || 2))}
                            className="w-12 px-1 py-0.5 bg-zinc-950 border border-zinc-800 rounded text-center text-xs text-zinc-100 font-mono"
                          />
                          <span>segundos</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                        Ação ao detectar novos arquivos:
                      </label>
                      <div className="space-y-1">
                        <label className="flex items-center gap-2 p-1.5 rounded-md bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 cursor-pointer text-[11px] text-zinc-300">
                          <input
                            type="radio"
                            name="watchBehavior"
                            checked={!watchAutoSync}
                            onChange={() => setWatchAutoSync(false)}
                            className="accent-zinc-100"
                          />
                          <span>Sugerir execução na tela (Aviso com botão "Sincronizar Agora")</span>
                        </label>

                        <label className="flex items-center gap-2 p-1.5 rounded-md bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 cursor-pointer text-[11px] text-zinc-300">
                          <input
                            type="radio"
                            name="watchBehavior"
                            checked={watchAutoSync}
                            onChange={() => setWatchAutoSync(true)}
                            className="accent-zinc-100"
                          />
                          <span>Sincronizar automaticamente após o tempo</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sincronização Agendada */}
              <div className="pt-2.5 border-t border-zinc-800/80">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-zinc-800 text-zinc-300">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-200">Sincronização Agendada</p>
                      <p className="text-[11px] text-zinc-400">Rotina periódica em segundo plano</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={scheduleEnabled}
                    onChange={(e) => setScheduleEnabled(e.target.checked)}
                    className="w-4 h-4 rounded accent-zinc-200 cursor-pointer"
                  />
                </div>

                {scheduleEnabled && (
                  <div className="grid grid-cols-2 gap-2 pl-8 pt-1 animate-fade-in">
                    <div>
                      <label className="block text-[10px] font-medium text-zinc-400 mb-1">
                        Intervalo
                      </label>
                      <select
                        value={scheduleInterval}
                        onChange={(e) => setScheduleInterval(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700/80 rounded-md text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                      >
                        <option value="15m">A cada 15 minutos</option>
                        <option value="30m">A cada 30 minutos</option>
                        <option value="hourly">A cada 1 hora</option>
                        <option value="6h">A cada 6 horas</option>
                        <option value="daily">Diário (às 02:00)</option>
                        <option value="custom">Cron customizado</option>
                      </select>
                    </div>

                    {scheduleInterval === 'custom' && (
                      <div>
                        <label className="block text-[10px] font-medium text-zinc-400 mb-1">
                          Cron (Ex: */10 * * * *)
                        </label>
                        <input
                          type="text"
                          value={scheduleCron}
                          onChange={(e) => setScheduleCron(e.target.value)}
                          placeholder="*/10 * * * *"
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700/80 rounded-md text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-500"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 shadow-xs disabled:opacity-50 transition active:scale-95"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Mapeamento'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Sub-modais */}
      <LocalFolderPickerModal
        isOpen={showLocalPicker}
        onClose={() => setShowLocalPicker(false)}
        initialPath={localPath}
        onSelect={(path) => {
          setLocalPath(path);
          if (!name) {
            const parts = path.split(/[/\\]/);
            const folderBase = parts[parts.length - 1] || parts[parts.length - 2];
            if (folderBase) setName(folderBase);
          }
        }}
      />

      <GDriveFolderPickerModal
        isOpen={showDrivePicker}
        onClose={() => setShowDrivePicker(false)}
        onSelect={(id, folderName) => {
          setGdriveFolderId(id);
          setGdriveFolderName(folderName);
        }}
      />
    </>
  );
};
