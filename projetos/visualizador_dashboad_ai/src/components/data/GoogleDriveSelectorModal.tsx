import React, { useState, useEffect, useTransition, useMemo } from 'react';
import {
  X,
  Search,
  FileSpreadsheet,
  FileText,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Layers,
  ChevronRight,
  Database,
  ArrowLeft,
  Calendar,
  HardDrive,
  KeyRound,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { GoogleApiService } from '../../services/google/api';
import { SpreadsheetTransformerService } from '../../services/data/spreadsheetTransformer';
import { DataProfiler, DataProfilerResult } from '../../services/data/dataProfiler';
import type {
  GoogleAuthStatus,
  GoogleDriveFileItem,
  SpreadsheetMetadata,
  SpreadsheetData,
  SheetMetadata,
} from '../../types/spreadsheet';
import type { Survey } from '../../types/survey';

interface GoogleDriveSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSurveyLoaded: (survey: Survey) => void;
  onSpreadsheetReady?: (survey: Survey, profilerResult: DataProfilerResult) => void;
  onOpenSettings?: () => void;
}

export function GoogleDriveSelectorModal({
  isOpen,
  onClose,
  onSurveyLoaded,
  onSpreadsheetReady,
  onOpenSettings,
}: GoogleDriveSelectorModalProps) {
  // State
  const [authStatus, setAuthStatus] = useState<GoogleAuthStatus | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [files, setFiles] = useState<GoogleDriveFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Tab Selection state for multi-sheet workbooks
  const [selectedFileForTabs, setSelectedFileForTabs] = useState<GoogleDriveFileItem | null>(null);
  const [sheetMetadata, setSheetMetadata] = useState<SpreadsheetMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [selectedTabName, setSelectedTabName] = useState<string>('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Initial load
  useEffect(() => {
    if (isOpen) {
      checkAuthAndLoadFiles();
    } else {
      // Reset state on close
      setSelectedFileForTabs(null);
      setSheetMetadata(null);
      setErrorMessage(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Reload files when debounced search changes if authenticated
  useEffect(() => {
    if (isOpen && authStatus?.configured) {
      loadFiles(debouncedSearch);
    }
  }, [debouncedSearch]);

  const checkAuthAndLoadFiles = async () => {
    setIsCheckingAuth(true);
    setErrorMessage(null);
    try {
      const status = await GoogleApiService.checkStatus();
      setAuthStatus(status);
      if (status.configured) {
        await loadFiles(debouncedSearch);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao conectar ao serviço Google.');
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const loadFiles = async (search?: string) => {
    setIsLoadingFiles(true);
    setErrorMessage(null);
    try {
      const driveFiles = await GoogleApiService.listFiles(search);
      setFiles(driveFiles);
    } catch (err: any) {
      setErrorMessage(err.message || 'Não foi possível acessar o Google Drive.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSelectFile = async (file: GoogleDriveFileItem) => {
    setErrorMessage(null);
    // If it's a native Google Sheet or XLSX, check if it has multiple tabs first
    if (
      file.mimeType === 'application/vnd.google-apps.spreadsheet' ||
      file.mimeType.includes('spreadsheetml') ||
      file.mimeType.includes('excel')
    ) {
      setIsLoadingMetadata(true);
      try {
        const metadata = await GoogleApiService.getSpreadsheetMetadata(file.id);
        if (metadata.sheets && metadata.sheets.length > 1) {
          // Has multiple tabs: show tab selection step
          setSelectedFileForTabs(file);
          setSheetMetadata(metadata);
          setSelectedTabName(metadata.sheets[0].name);
          setIsLoadingMetadata(false);
          return;
        }
      } catch (err: any) {
        console.warn('Could not load multi-tab metadata, falling back to direct load:', err);
      } finally {
        setIsLoadingMetadata(false);
      }
    }

    // Direct load for single sheet or CSV
    await processAndLoadSheet(file.id, undefined);
  };

  const processAndLoadSheet = async (fileId: string, sheetName?: string) => {
    setIsProcessing(true);
    setProcessingStatus('Lendo linhas e colunas da planilha...');
    setErrorMessage(null);

    try {
      const spreadsheetData: SpreadsheetData = await GoogleApiService.getSpreadsheetData(
        fileId,
        sheetName
      );

      setProcessingStatus('Estruturando perguntas e analisando tipos via Data Profiler...');
      const profilerResult = DataProfiler.profileDataset(
        spreadsheetData.columns,
        spreadsheetData.rows
      );
      const survey: Survey = SpreadsheetTransformerService.transformToSurvey(spreadsheetData);

      // Trigger review workflow if available, otherwise direct load
      if (onSpreadsheetReady) {
        onSpreadsheetReady(survey, profilerResult);
      } else {
        onSurveyLoaded(survey);
      }
      onClose();
    } catch (err: any) {
      console.error('Error importing spreadsheet:', err);
      setErrorMessage(err.message || 'Erro ao processar dados da planilha.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Helper for human-readable relative time
  const formatModifiedTime = (dateStr?: string) => {
    if (!dateStr) return 'Recente';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 0) return 'Atualizado hoje';
      if (diffDays === 1) return 'Atualizado ontem';
      if (diffDays < 7) return `Atualizado há ${diffDays} dias`;
      return `Atualizado em ${date.toLocaleDateString('pt-BR')}`;
    } catch {
      return 'Recente';
    }
  };

  // Helper for formatting file size
  const formatFileSize = (bytes?: number | string) => {
    if (!bytes || bytes === '0') return null;
    const num = Number(bytes);
    if (isNaN(num)) return null;
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Helper for file type info
  const getFileTypeInfo = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.spreadsheet') {
      return {
        label: 'Google Sheets',
        badgeVariant: 'success' as const,
        icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      };
    }
    if (mimeType.includes('csv') || mimeType.includes('comma-separated')) {
      return {
        label: 'CSV',
        badgeVariant: 'secondary' as const,
        icon: <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
      };
    }
    return {
      label: 'XLSX',
      badgeVariant: 'info' as const,
      icon: <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Google Drive & Planilhas
                </h2>
                {authStatus?.configured && (
                  <Badge variant="success" size="sm" className="gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Conectado
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecione um arquivo Google Sheets, XLSX ou CSV para ingestão e análise estruturada.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Multi-Tab Selector Step */}
        {selectedFileForTabs && sheetMetadata ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <button
              onClick={() => {
                setSelectedFileForTabs(null);
                setSheetMetadata(null);
              }}
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar para lista de arquivos
            </button>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Arquivo Selecionado
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {selectedFileForTabs.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Esta planilha contém {sheetMetadata.sheets.length} abas. Selecione a aba principal de respostas:
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Selecione a aba que contém as respostas
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sheetMetadata.sheets.map((sheet) => {
                  const isSelected = selectedTabName === sheet.name;
                  return (
                    <button
                      key={sheet.id || sheet.name}
                      type="button"
                      onClick={() => setSelectedTabName(sheet.name)}
                      className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-500'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-500" />
                          {sheet.name}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                      </div>
                      {sheet.rowCount !== undefined && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          ~{sheet.rowCount} linhas {sheet.columnCount ? `• ${sheet.columnCount} colunas` : ''}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedFileForTabs(null);
                  setSheetMetadata(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!selectedTabName || isProcessing}
                onClick={() => processAndLoadSheet(selectedFileForTabs.id, selectedTabName)}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <span>Importar Aba Selecionada</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* File List Main Step */
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Search and Action Bar */}
            {authStatus?.configured && (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    placeholder="Pesquisar arquivo no Google Drive..."
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadFiles(debouncedSearch)}
                  disabled={isLoadingFiles}
                  className="h-9 px-3 gap-1.5 text-xs text-slate-600 dark:text-slate-300"
                  title="Atualizar lista de arquivos"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Recarregar</span>
                </Button>
              </div>
            )}

            {/* STATE 1: Checking Auth */}
            {isCheckingAuth && (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-7 h-7 animate-spin mx-auto text-indigo-600 dark:text-indigo-400" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Verificando credenciais do Google Workspace...
                </p>
              </div>
            )}

            {/* STATE 2: Not Configured */}
            {!isCheckingAuth && authStatus && !authStatus.configured && (
              <div className="p-6 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                      Google Drive não configurado
                    </h3>
                    <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed">
                      Para conectar planilhas reais do Google Drive, configure a Service Account no servidor através das variáveis de ambiente.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/40 space-y-2 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider block">
                    Variáveis de ambiente requeridas:
                  </span>
                  <div className="space-y-1">
                    <div>• <code>GOOGLE_CLIENT_EMAIL</code> = seu-service-account@projeto.iam.gserviceaccount.com</div>
                    <div>• <code>GOOGLE_PRIVATE_KEY</code> = "-----BEGIN PRIVATE KEY-----\n..."</div>
                    <div>• <code>GOOGLE_PROJECT_ID</code> = seu-project-id</div>
                    <div className="text-slate-400 pt-1">ou <code>GOOGLE_SERVICE_ACCOUNT_JSON</code></div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <span className="text-slate-500 text-[11px]">
                    Lembre-se de compartilhar as planilhas do Drive com o email da Service Account.
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={checkAuthAndLoadFiles}
                      className="text-xs h-8"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" /> Verificar novamente
                    </Button>
                    {onOpenSettings && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          onClose();
                          onOpenSettings();
                        }}
                        className="text-xs h-8 gap-1.5 bg-indigo-600 hover:bg-indigo-700 font-bold"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Configurar Chave Google</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STATE 3: Error */}
            {!isCheckingAuth && errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Não foi possível acessar o Google Drive</span>
                </div>
                <p className="text-[11px] leading-relaxed text-rose-600 dark:text-rose-400">
                  {errorMessage}
                </p>
                <div className="pt-2 flex items-center justify-end">
                  <Button variant="outline" size="sm" onClick={() => loadFiles(debouncedSearch)}>
                    Tentar novamente
                  </Button>
                </div>
              </div>
            )}

            {/* STATE 4: Loading Files */}
            {!isCheckingAuth && authStatus?.configured && isLoadingFiles && (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-7 h-7 animate-spin mx-auto text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Carregando arquivos do Google Drive...
                </p>
              </div>
            )}

            {/* STATE 5: Empty Files */}
            {!isCheckingAuth &&
              authStatus?.configured &&
              !isLoadingFiles &&
              !errorMessage &&
              files.length === 0 && (
                <div className="py-12 text-center space-y-3 px-4">
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 w-12 h-12 mx-auto flex items-center justify-center text-slate-400">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Nenhum arquivo compatível encontrado
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                      {searchTerm
                        ? `Nenhum arquivo corresponde ao termo "${searchTerm}".`
                        : 'Certifique-se de compartilhar planilhas Google Sheets, XLSX ou CSV com o e-mail da sua Service Account.'}
                    </p>
                  </div>
                  {authStatus.clientEmail && (
                    <div className="inline-block p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                      Email: <strong>{authStatus.clientEmail}</strong>
                    </div>
                  )}
                </div>
              )}

            {/* STATE 6: Success File List */}
            {!isCheckingAuth &&
              authStatus?.configured &&
              !isLoadingFiles &&
              files.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                    <span>Arquivos Disponíveis ({files.length})</span>
                    <span>Formatos: Sheets, XLSX, CSV</span>
                  </div>

                  <div className="space-y-2">
                    {files.map((file) => {
                      const typeInfo = getFileTypeInfo(file.mimeType);
                      const sizeStr = formatFileSize(file.size);
                      const timeStr = formatModifiedTime(file.modifiedTime);

                      return (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/70 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all group"
                        >
                          <div className="flex items-start gap-3 min-w-0 pr-3">
                            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                              {typeInfo.icon}
                            </div>
                            <div className="min-w-0">
                              <h4
                                className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate"
                                title={file.name}
                              >
                                {file.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                                <Badge variant={typeInfo.badgeVariant} size="sm">
                                  {typeInfo.label}
                                </Badge>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  {timeStr}
                                </span>
                                {sizeStr && (
                                  <>
                                    <span>•</span>
                                    <span>{sizeStr}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Abrir no Google Drive em nova aba"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            <Button
                              variant="primary"
                              size="sm"
                              disabled={isProcessing || isLoadingMetadata}
                              onClick={() => handleSelectFile(file)}
                              className="text-xs h-8 px-3 gap-1 font-semibold"
                            >
                              <span>Selecionar</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-indigo-950 dark:text-indigo-200 block">
                    Carregando dados da pesquisa...
                  </span>
                  <span className="text-indigo-700 dark:text-indigo-300">
                    {processingStatus || 'Processando colunas e linhas...'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            <span>Google Drive API v3 & Sheets API v4</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
