import React from 'react';
import {
  LayoutDashboard,
  SlidersHorizontal,
  FolderDown,
  TableProperties,
  Settings,
  PlusCircle,
  FileSpreadsheet,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { DataSource, Survey, AnalysisDisplaySettings } from '../../types/survey';
import { SidebarProjectSelector } from './SidebarProjectSelector';

interface SidebarProps {
  activeTab: 'dashboard' | 'mapping' | 'source' | 'responses' | 'settings';
  onSelectTab: (tab: 'dashboard' | 'mapping' | 'source' | 'responses' | 'settings') => void;
  onNewAnalysis: () => void;
  dataSource?: DataSource;
  questionCount?: number;
  respondentCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  currentSurvey?: Survey | null;
  displaySettings?: AnalysisDisplaySettings;
  onSelectProject?: (survey: Survey, settings?: AnalysisDisplaySettings) => void;
  onNewBlankProject?: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  onNewAnalysis,
  dataSource,
  questionCount = 0,
  respondentCount = 0,
  isCollapsed = false,
  onToggleCollapse,
  currentSurvey = null,
  displaySettings,
  onSelectProject,
  onNewBlankProject,
}: SidebarProps) {
  const navItems: {
    id: 'dashboard' | 'mapping' | 'source' | 'responses' | 'settings';
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'mapping',
      label: 'Mapeamento',
      icon: <SlidersHorizontal className="w-4 h-4" />,
      badge: questionCount > 0 ? `${questionCount}` : undefined,
    },
    {
      id: 'source',
      label: 'Fonte de dados',
      icon: <FolderDown className="w-4 h-4" />,
    },
    {
      id: 'responses',
      label: 'Respostas Brutas',
      icon: <TableProperties className="w-4 h-4" />,
      badge: respondentCount > 0 ? `${respondentCount}` : undefined,
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <aside
      className={`shrink-0 border-r border-theme bg-theme-surface/85 flex flex-col justify-between min-h-[calc(100vh-3.5rem)] transition-all duration-200 ease-in-out text-theme-main ${
        isCollapsed ? 'w-16 p-2.5 items-center' : 'w-64 p-4'
      }`}
    >
      <div className="space-y-4 w-full">
        {/* Collapse toggle header */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-1'}`}>
          {!isCollapsed && (
            <span className="text-[10px] font-semibold text-theme-muted uppercase tracking-widest block">
              Navegação
            </span>
          )}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral (apenas ícones)'}
              aria-label={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
              className="p-1.5 rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-theme-primary" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Dashboard / Project Selector (Moved from top bar) */}
        {onSelectProject && onNewBlankProject && (
          <div className="w-full">
            <SidebarProjectSelector
              currentSurvey={currentSurvey}
              displaySettings={displaySettings}
              onSelectProject={onSelectProject}
              onNewBlankProject={onNewBlankProject}
              isCollapsed={isCollapsed}
            />
          </div>
        )}

        {/* New Analysis Action Button */}
        <div>
          {isCollapsed ? (
            <button
              onClick={onNewAnalysis}
              title="Nova análise / Importar dados"
              className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl bg-theme-primary text-white hover:bg-theme-primary-hover shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onNewAnalysis}
              className="w-full flex items-center justify-center gap-2 h-9 px-3 rounded-lg bg-theme-primary text-white hover:bg-theme-primary-hover text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nova Análise / Importar</span>
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="space-y-1 w-full">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={isCollapsed ? `${item.label} ${item.badge ? `(${item.badge})` : ''}` : undefined}
                className={`w-full flex items-center rounded-xl text-xs font-medium transition-all cursor-pointer relative group ${
                  isCollapsed
                    ? 'justify-center p-2.5 h-10'
                    : 'justify-between px-3 py-2'
                } ${
                  isActive
                    ? 'bg-theme-primary-light text-theme-primary-text font-bold border border-theme shadow-2xs'
                    : 'text-theme-muted hover:text-theme-main hover:bg-theme-subtle'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                  <span className={isActive ? 'text-theme-primary' : 'text-theme-muted'}>
                    {item.icon}
                  </span>
                  {!isCollapsed && <span>{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-theme-primary text-white'
                        : 'bg-theme-subtle text-theme-main'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {isCollapsed && item.badge && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-theme-primary" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom active survey source pill */}
      <div className={`pt-3 border-t border-theme space-y-2.5 w-full ${isCollapsed ? 'items-center text-center' : ''}`}>
        {dataSource && (
          isCollapsed ? (
            <div
              className="w-10 h-10 mx-auto rounded-xl bg-theme-subtle border border-theme flex items-center justify-center text-theme-primary cursor-pointer"
              title={`${dataSource.name} (${respondentCount} respostas)`}
            >
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-theme-subtle border border-theme text-xs">
              <div className="flex items-center gap-2 text-theme-muted text-[11px] mb-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-theme-primary shrink-0" />
                <span className="font-semibold truncate text-theme-main">{dataSource.name}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-theme-muted mt-1">
                <span className="uppercase tracking-wider">{dataSource.type}</span>
                <span className="font-medium text-theme-main">{respondentCount} respostas</span>
              </div>
            </div>
          )
        )}

        {isCollapsed ? (
          <div className="flex justify-center py-1" title="Sistema Online v1.0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
          </div>
        ) : (
          <div className="flex items-center justify-between px-1 text-[11px] text-theme-muted">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] uppercase tracking-wider font-semibold text-theme-main">Sistema Online</span>
            </div>
            <span className="text-[10px] text-theme-muted font-mono">v1.0</span>
          </div>
        )}
      </div>
    </aside>
  );
}
