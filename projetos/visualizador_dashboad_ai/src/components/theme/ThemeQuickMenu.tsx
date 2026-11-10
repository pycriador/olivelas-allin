import React, { useState, useRef, useEffect } from 'react';
import { Palette, Sun, Moon, Check, ChevronDown, Sparkles } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface ThemeQuickMenuProps {
  onOpenFullModal: () => void;
}

export function ThemeQuickMenu({ onOpenFullModal }: ThemeQuickMenuProps) {
  const { currentTheme, themeId, setTheme, lightThemes, darkThemes, isDark, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 items-center gap-1.5 px-2.5 rounded-lg border border-theme text-theme-main hover:bg-theme-subtle transition-colors text-xs font-medium cursor-pointer"
        title="Alternar tema ou paleta de cores"
      >
        <Palette className="w-3.5 h-3.5 text-theme-primary" />
        <span className="hidden sm:inline font-semibold">{currentTheme.name}</span>
        <ChevronDown className={`w-3 h-3 text-theme-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-theme-surface shadow-xl border border-theme py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-theme-main">
          <div className="px-3 py-2 border-b border-theme flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-theme-muted flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-theme-primary" />
              Temas ({isDark ? 'Escuro' : 'Claro'})
            </span>
            <button
              onClick={() => {
                toggleTheme();
              }}
              className="text-[11px] font-semibold text-theme-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              {isDark ? <Sun className="w-3 h-3 text-amber-500" /> : <Moon className="w-3 h-3 text-theme-primary" />}
              <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>
          </div>

          {/* Quick list of themes for current mode */}
          <div className="max-h-60 overflow-y-auto py-1">
            <div className="px-3 py-1 text-[10px] font-semibold text-theme-muted uppercase tracking-widest">
              {isDark ? 'Temas Escuros (10 disponíveis)' : 'Temas Claros (10 disponíveis)'}
            </div>
            {(isDark ? darkThemes : lightThemes).map((t) => {
              const isSelected = t.id === themeId;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-theme-primary-light text-theme-primary-text font-bold'
                      : 'text-theme-main hover:bg-theme-subtle'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/10 shrink-0"
                      style={{ backgroundColor: t.previewColors.primary }}
                    />
                    <span className="truncate">{t.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-theme-primary" />}
                </button>
              );
            })}
          </div>

          <div className="pt-2 mt-1 border-t border-theme px-2">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenFullModal();
              }}
              className="w-full py-1.5 px-2 rounded-lg bg-theme-primary-light hover:opacity-90 text-theme-primary-text text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Explorar todos os 20 temas</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
