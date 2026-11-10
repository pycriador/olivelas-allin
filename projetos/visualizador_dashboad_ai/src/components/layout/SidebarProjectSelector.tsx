import React, { useState, useRef, useEffect } from 'react';
import {
  FolderKanban,
  ChevronDown,
  Plus,
  Download,
  Upload,
  Trash2,
  FileSpreadsheet,
  Save,
  Check,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthService } from '../../services/auth/authService';
import type { Survey, AnalysisDisplaySettings } from '../../types/survey';

interface SidebarProjectSelectorProps {
  currentSurvey: Survey | null;
  displaySettings?: AnalysisDisplaySettings;
  onSelectProject: (survey: Survey, settings?: AnalysisDisplaySettings) => void;
  onNewBlankProject: () => void;
  isCollapsed?: boolean;
}

export function SidebarProjectSelector({
  currentSurvey,
  displaySettings,
  onSelectProject,
  onNewBlankProject,
  isCollapsed = false,
}: SidebarProjectSelectorProps) {
  const {
    isAuthenticated,
    projects,
    activeProjectId,
    saveCurrentProject,
    loadProject,
    deleteProject,
    exportProjectBackup,
    importProjectBackup,
    openAuthModal,
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const currentTitle = activeProject
    ? activeProject.name
    : currentSurvey?.name || currentSurvey?.title || 'Dashboard Padrão';

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentSurvey) return;
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    try {
      await saveCurrentProject(
        currentSurvey,
        displaySettings,
        currentSurvey.name || currentSurvey.title || 'Novo Dashboard'
      );
      setSaveMessage('Salvo!');
      setTimeout(() => setSaveMessage(null), 2500);
    } catch (err: any) {
      console.error('Error saving project:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelect = async (projectId: string) => {
    setIsOpen(false);
    try {
      const data = await loadProject(projectId);
      if (data) {
        onSelectProject(data.survey, data.displaySettings);
      }
    } catch (err: any) {
      console.error('Error loading project:', err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (confirm('Deseja realmente remover este dashboard salvo?')) {
      await deleteProject(projectId);
    }
  };

  const handleExportBackup = async () => {
    if (!currentSurvey) return;
    setIsExporting(true);
    try {
      if (activeProjectId) {
        await exportProjectBackup(activeProjectId);
      } else {
        const backup = {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          appName: 'AI Survey Analyzer',
          projectId: 'local_export',
          projectName: currentSurvey.name || currentSurvey.title || 'Pesquisa',
          projectDescription: currentSurvey.description,
          survey: currentSurvey,
          displaySettings,
        };
        AuthService.triggerDownloadBackup(backup);
      }
    } catch (err: any) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      if (isAuthenticated) {
        const imported = await importProjectBackup(backupData);
        if (imported?.survey) {
          onSelectProject(imported.survey, imported.displaySettings);
        }
      } else {
        if (backupData?.survey) {
          onSelectProject(backupData.survey, backupData.displaySettings);
        }
      }
    } catch (err: any) {
      alert('Arquivo de backup inválido: ' + (err.message || 'Formato JSON incorreto.'));
    } finally {
      setIsImporting(false);
      setIsOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFile}
        accept=".json"
        className="hidden"
      />

      {isCollapsed ? (
        /* Collapsed Icon Trigger */
        <button
          onClick={() => setIsOpen(!isOpen)}
          title={`Dashboards: ${currentTitle}`}
          className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl border border-theme bg-theme-subtle text-theme-main hover:text-theme-primary hover:border-theme-primary/40 transition-colors cursor-pointer relative"
        >
          <FolderKanban className="w-4 h-4 text-theme-primary" />
          {projects.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-theme-primary" />
          )}
        </button>
      ) : (
        /* Expanded Dashboard Box */
        <div className="rounded-xl border border-theme bg-theme-subtle/70 p-2 text-theme-main">
          <div className="flex items-center justify-between gap-1 mb-1 px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted">
              Dashboard Ativo
            </span>
            {currentSurvey && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1 text-[10px] font-semibold text-theme-primary hover:underline cursor-pointer disabled:opacity-50"
                title="Salvar alterações no projeto"
              >
                {isSaving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : saveMessage ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-500 font-bold">{saveMessage}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-2.5 h-2.5" />
                    <span>Salvar</span>
                  </>
                )}
              </button>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-theme-surface border border-theme hover:border-theme-primary/50 text-xs font-semibold text-theme-main transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FolderKanban className="w-3.5 h-3.5 text-theme-primary shrink-0" />
              <span className="truncate">{currentTitle}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-theme-muted shrink-0" />
          </button>
        </div>
      )}

      {/* Floating Menu for Projects / Dashboards */}
      {isOpen && (
        <div
          className={`absolute z-50 w-72 rounded-2xl border border-theme bg-theme-surface shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-150 text-theme-main ${
            isCollapsed
              ? 'left-full top-0 ml-3'
              : 'left-0 top-full mt-2'
          }`}
        >
          {/* Header */}
          <div className="px-2.5 py-2 border-b border-theme flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-theme-primary" />
              <span className="text-[11px] font-bold text-theme-muted uppercase tracking-wider">
                Meus Dashboards ({projects.length})
              </span>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                onNewBlankProject();
              }}
              className="text-xs font-bold text-theme-primary hover:underline flex items-center gap-1 cursor-pointer"
              title="Criar novo espaço em branco"
            >
              <Plus className="w-3.5 h-3.5" /> Novo
            </button>
          </div>

          {/* Project List */}
          <div className="max-h-56 overflow-y-auto py-1 space-y-0.5">
            {projects.length === 0 ? (
              <div className="px-3 py-5 text-center text-xs text-theme-muted space-y-1">
                <FolderOpen className="w-5 h-5 mx-auto text-theme-muted/60" />
                <p>Nenhum dashboard salvo na nuvem ainda.</p>
                {currentSurvey && (
                  <p className="text-[10px] text-theme-primary">
                    Clique em &quot;Salvar&quot; para guardar esta análise.
                  </p>
                )}
              </div>
            ) : (
              projects.map((proj) => {
                const isSelected = proj.id === activeProjectId;
                return (
                  <div
                    key={proj.id}
                    onClick={() => handleSelect(proj.id)}
                    className={`px-2.5 py-2 rounded-xl flex items-center justify-between hover:bg-theme-subtle cursor-pointer group transition-colors ${
                      isSelected
                        ? 'bg-theme-primary-light text-theme-primary-text font-bold border border-theme'
                        : 'text-theme-main'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-theme-primary shrink-0" />
                        <span className="text-xs truncate block font-medium">
                          {proj.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-theme-muted mt-0.5">
                        {proj.questionCount} perguntas • {proj.responseCount} respostas
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-theme-primary" />
                      )}
                      <button
                        onClick={(e) => handleDelete(e, proj.id)}
                        className="p-1 rounded-md text-theme-muted hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Excluir dashboard"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Backup / Export / Import actions */}
          <div className="pt-2 border-t border-theme px-1 space-y-1">
            <button
              onClick={handleExportBackup}
              disabled={!currentSurvey || isExporting}
              className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold text-theme-main hover:bg-theme-subtle flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-theme-muted" />
              <span>Exportar Backup (JSON)</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold text-theme-main hover:bg-theme-subtle flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-theme-muted" />
              <span>Restaurar Backup (JSON)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
