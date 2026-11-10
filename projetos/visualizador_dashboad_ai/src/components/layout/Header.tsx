import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { DataSource } from '../../types/survey';
import { UserMenu } from '../auth/UserMenu';
import { ThemeQuickMenu } from '../theme/ThemeQuickMenu';

interface HeaderProps {
  appName?: string;
  dataSource?: DataSource;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenThemeModal: () => void;
  onOpenSettings: () => void;
}

export function Header({
  appName = 'Olivelas - Visualizador Dashboard AI',
  dataSource,
  isDark,
  onToggleTheme,
  onOpenThemeModal,
  onOpenSettings,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-theme bg-theme-surface/95 px-4 md:px-6 backdrop-blur-md transition-colors text-theme-main">
      {/* Left Brand Identity */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme-primary text-white font-bold text-xs shadow-xs shrink-0">
          <span className="w-2 h-2 bg-white rounded-xs" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold tracking-tight text-theme-main truncate">
            {appName}
          </h1>
        </div>
      </div>

      {/* Right actions: Theme controls and user profile */}
      <div className="flex items-center gap-2 md:gap-2.5 shrink-0">
        {/* Theme Selector Popover & Modal Trigger */}
        <ThemeQuickMenu onOpenFullModal={onOpenThemeModal} />

        {/* Quick Light/Dark Toggle */}
        <button
          onClick={onToggleTheme}
          aria-label="Alternar modo claro / escuro"
          title="Alternar entre modo claro e escuro"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-theme text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-theme-primary" />
          )}
        </button>

        <div className="h-4 w-px bg-theme-border mx-0.5" />

        {/* User Account & Login */}
        <UserMenu onOpenSettings={onOpenSettings} />
      </div>
    </header>
  );
}
