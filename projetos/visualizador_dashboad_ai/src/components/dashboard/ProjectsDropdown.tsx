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
  Cloud,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthService } from '../../services/auth/authService';
import type { Survey, AnalysisDisplaySettings } from '../../types/survey';
import { Button } from '../ui/Button';

interface ProjectsDropdownProps {
  currentSurvey: Survey | null;
  displaySettings?: AnalysisDisplaySettings;
  onSelectProject: (survey: Survey, settings?: AnalysisDisplaySettings) => void;
  onNewBlankProject: () => void;
}

export function ProjectsDropdown({
  currentSurvey,
  displaySettings,
  onSelectProject,
  onNewBlankProject,
}: ProjectsDropdownProps) {
  const {
    user,
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

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const currentTitle = activeProject
    ? activeProject.name
    : currentSurvey?.name || currentSurvey?.title || 'Workspace de Pesquisa';

  const handleSave = async () => {
    if (!currentSurvey) return;
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    try {
      await saveCurrentProject(currentSurvey, displaySettings, currentSurvey.name || currentSurvey.title);
      setSaveMessage('Dashboard salvo!');
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
    if (confirm('Deseja realmente remover este projeto do seu workspace?')) {
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
        // Direct client-side JSON export of current survey
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
        // Direct local restore if not logged in
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
    <div className="relative" ref={dropdownRef}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFile}
        accept=".json"
        className="hidden"
      />

      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer max-w-[200px] sm:max-w-[260px] truncate"
          title={currentTitle}
        >
          <FolderKanban className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="truncate">{currentTitle}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>

        {currentSurvey && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-7 px-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 gap-1"
            title="Salvar alterações do dashboard na nuvem"
          >
            {isSaving ? (
              <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
            ) : saveMessage ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 hidden sm:inline">Salvo</span>
              </>
            ) : (
              <>
                <Save className="w-3 h-3 text-slate-400" />
                <span className="hidden sm:inline">Salvar</span>
              </>
            )}
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Seus Dashboards ({projects.length})
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                onNewBlankProject();
              }}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Novo Espaço
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {projects.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-slate-400">
                <FolderOpen className="w-6 h-6 mx-auto mb-1 text-slate-300 dark:text-slate-600" />
                <span>Nenhum dashboard salvo na conta ainda.</span>
              </div>
            ) : (
              projects.map((proj) => {
                const isSelected = proj.id === activeProjectId;
                return (
                  <div
                    key={proj.id}
                    onClick={() => handleSelect(proj.id)}
                    className={`px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer group transition-colors ${
                      isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate block">
                          {proj.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {proj.questionCount} perguntas • {proj.responseCount} respostas
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDelete(e, proj.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        title="Excluir projeto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 px-3 space-y-1">
            <button
              onClick={handleExportBackup}
              disabled={!currentSurvey || isExporting}
              className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exportar Backup (JSON Seguro)</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Restaurar Backup de Arquivo (JSON)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
