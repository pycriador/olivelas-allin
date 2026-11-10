import React, { useState } from 'react';
import {
  Palette,
  Sun,
  Moon,
  Check,
  X,
  Sparkles,
  Info,
} from 'lucide-react';
import { ThemeDefinition } from '../../types/theme';
import { useTheme } from '../../hooks/useTheme';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeSelectorModal({ isOpen, onClose }: ThemeSelectorModalProps) {
  const { currentTheme, themeId, setTheme, lightThemes, darkThemes, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'light' | 'dark'>(isDark ? 'dark' : 'light');

  if (!isOpen) return null;

  const currentList = activeTab === 'light' ? lightThemes : darkThemes;

  const handleSelectTheme = (theme: ThemeDefinition) => {
    setTheme(theme.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-theme-surface shadow-2xl border border-theme overflow-hidden text-theme-main"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-theme flex items-center justify-between bg-theme-subtle/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-theme-primary-light text-theme-primary flex items-center justify-center shadow-xs">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-theme-main">
                Seletor de Temas & Identidade Visual
              </h2>
              <p className="text-xs text-theme-muted">
                Escolha entre 20 temas refinados com paletas dinâmicas e contrastes balanceados.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-6 pt-4 pb-2 flex items-center justify-between border-b border-theme bg-theme-surface">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-theme-subtle border border-theme">
            <button
              onClick={() => setActiveTab('light')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'light'
                  ? 'bg-theme-surface text-theme-main shadow-xs border border-theme'
                  : 'text-theme-muted hover:text-theme-main'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Temas Claros ({lightThemes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('dark')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'dark'
                  ? 'bg-theme-surface text-theme-main shadow-xs border border-theme'
                  : 'text-theme-muted hover:text-theme-main'
              }`}
            >
              <Moon className="w-4 h-4 text-theme-primary" />
              <span>Temas Escuros ({darkThemes.length})</span>
            </button>
          </div>

          <div className="text-xs text-theme-muted hidden sm:flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-theme-primary" />
            <span>Tema atual: <strong className="text-theme-main">{currentTheme.name}</strong></span>
          </div>
        </div>

        {/* Themes Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentList.map((item) => {
            const isSelected = themeId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => handleSelectTheme(item)}
                className={`relative p-4 rounded-xl border text-left transition-all cursor-pointer group flex flex-col justify-between ${
                  isSelected
                    ? 'border-theme bg-theme-primary-light ring-2 ring-theme-primary'
                    : 'border-theme bg-theme-subtle/30 hover:border-theme hover:bg-theme-subtle/60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-theme-main">
                          {item.name}
                        </h3>
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-theme-subtle text-theme-muted border border-theme">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-theme-muted mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-theme-primary text-white'
                          : 'border border-theme text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>
                </div>

                {/* Color Swatches Preview Bar */}
                <div className="mt-4 pt-3 border-t border-theme flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-theme-muted font-medium">Paleta:</span>
                    <div className="flex items-center -space-x-1">
                      <div
                        className="w-5 h-5 rounded-full border border-black/10 dark:border-white/10 shadow-2xs"
                        style={{ backgroundColor: item.previewColors.bg }}
                        title="Canvas"
                      />
                      <div
                        className="w-5 h-5 rounded-full border border-black/10 dark:border-white/10 shadow-2xs"
                        style={{ backgroundColor: item.previewColors.surface }}
                        title="Superfície"
                      />
                      <div
                        className="w-5 h-5 rounded-full border border-black/10 dark:border-white/10 shadow-2xs"
                        style={{ backgroundColor: item.previewColors.primary }}
                        title="Cor Primária"
                      />
                      <div
                        className="w-5 h-5 rounded-full border border-black/10 dark:border-white/10 shadow-2xs"
                        style={{ backgroundColor: item.previewColors.accent }}
                        title="Acento"
                      />
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-colors ${
                      isSelected
                        ? 'text-theme-primary font-bold'
                        : 'text-theme-muted group-hover:text-theme-main'
                    }`}
                  >
                    {isSelected ? 'Ativo' : 'Aplicar'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-theme bg-theme-subtle/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-theme-muted">
            <Info className="w-4 h-4 text-theme-primary" />
            <span>As preferências de tema são aplicadas instantaneamente e salvas no navegador.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-theme-primary text-white text-xs font-semibold hover:bg-theme-primary-hover transition-colors cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
