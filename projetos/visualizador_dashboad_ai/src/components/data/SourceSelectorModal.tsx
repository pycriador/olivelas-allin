import React, { useRef, useState } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  Upload,
  Globe,
  Database,
  ArrowRight,
  Sparkles,
  Lock,
  HardDrive,
  Loader2,
  AlertCircle,
  FileUp,
} from 'lucide-react';
import { DataSourceType, Survey } from '../../types/survey';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { FileParserService, ParseResult } from '../../services/data/fileParser';
import { DataProfilerResult } from '../../services/data/dataProfiler';

interface SourceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGoogleDrive: () => void;
  onOpenGoogleForms: () => void;
  onParsedSurveyReady: (result: ParseResult) => void;
  onRestoreBackup?: (backupData: any) => void;
}

export function SourceSelectorModal({
  isOpen,
  onClose,
  onOpenGoogleDrive,
  onOpenGoogleForms,
  onParsedSurveyReady,
  onRestoreBackup,
}: SourceSelectorModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonBackupInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const result = await FileParserService.parseFile(file);
      onClose();
      onParsedSurveyReady(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar arquivo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJsonBackupUpload = async (file: File) => {
    if (!onRestoreBackup) return;
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      onClose();
      onRestoreBackup(backupData);
    } catch (err: any) {
      setErrorMessage(err.message || 'Arquivo de backup inválido.');
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setErrorMessage(null);
    setIsLoading(true);
    try {
      const result = await FileParserService.parseUrl(urlInput.trim());
      onClose();
      onParsedSurveyReady(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao carregar dados da URL.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Conectar Fonte de Dados
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecione a origem da pesquisa para iniciar o mapeamento e análise.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          {/* Drag & Drop File Upload Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`p-4 rounded-xl border-2 border-dashed transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                : 'border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/30'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 py-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Perfilando dados e inferindo tipos com Data Profiler...</span>
              </div>
            ) : (
              <>
                <div className="p-2.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Enviar arquivo local (XLSX, XLS, CSV)
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Arraste e solte aqui ou clique para selecionar do computador
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Option: Google Forms */}
          <div
            onClick={() => {
              onClose();
              onOpenGoogleForms();
            }}
            className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 hover:bg-purple-50/20 dark:hover:bg-purple-950/20 transition-all cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Google Forms API
                  </h4>
                  <Badge variant="purple" size="sm">
                    Metadados Nativos
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Conecte formulários nativos do Google para extrair estrutura de perguntas e respostas com 100% de precisão.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="text-xs shrink-0 ml-2">
              Conectar
            </Button>
          </div>

          {/* Option: Google Drive / Sheets */}
          <div
            onClick={() => {
              onClose();
              onOpenGoogleDrive();
            }}
            className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Google Drive (Sheets, XLSX, CSV)
                  </h4>
                  <Badge variant="success" size="sm">
                    Data Profiler
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Explore e analise planilhas diretamente da nuvem com perfilamento heurístico automático.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="text-xs shrink-0 ml-2">
              Conectar
            </Button>
          </div>

          {/* Option: URL / Webhook */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Link Público / Webhook REST
                    </h4>
                    <Badge variant="warning" size="sm">
                      URL
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Importe dados de pesquisas via link direto CSV, XLSX ou endpoint JSON REST.
                  </p>
                </div>
              </div>
              {!isUrlMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUrlMode(true)}
                  className="text-xs shrink-0 ml-2"
                >
                  Abrir URL
                </Button>
              )}
            </div>

            {isUrlMode && (
              <form onSubmit={handleUrlSubmit} className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <input
                  type="url"
                  placeholder="https://exemplo.com/dados-pesquisa.csv"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  required
                  className="flex-1 h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isLoading}
                  className="h-8 text-xs"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Carregar'}
                </Button>
              </form>
            )}
          </div>

          {/* Option: Restore Backup JSON */}
          <div
            onClick={() => jsonBackupInputRef.current?.click()}
            className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-all cursor-pointer"
          >
            <input
              type="file"
              ref={jsonBackupInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleJsonBackupUpload(e.target.files[0]);
                }
              }}
              accept=".json"
              className="hidden"
            />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Restaurar Backup (Arquivo JSON)
                  </h4>
                  <Badge variant="secondary" size="sm">
                    JSON Seguro
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Carregue um arquivo de backup exportado anteriormente para reconstruir seu dashboard com todas as respostas.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="text-xs shrink-0 ml-2">
              Importar
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
          <span>Pipeline: Arquivo/URL → Parser → Data Profiler → Revisão → Estatísticas</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
