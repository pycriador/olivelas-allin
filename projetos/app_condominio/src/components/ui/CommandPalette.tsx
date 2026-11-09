import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Calendar,
  FileText,
  Bell,
  Wrench,
  AlertTriangle,
  Users,
  CreditCard,
  Building2,
  Moon,
  Sun,
  Palette,
  ArrowRight,
  Plus,
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navegação' | 'Ações Rápidas' | 'Documentos & Recursos' | 'Sistema';
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    isDarkMode,
    toggleDarkMode,
    setIsContextSwitcherOpen,
    resources,
    announcements,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const commandItems: CommandItem[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Ir para Painel Principal (Dashboard)',
      category: 'Navegação',
      icon: <Building2 className="w-4 h-4 text-blue-500" />,
      action: () => {
        setCurrentView('dashboard');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-calendar',
      title: 'Abrir Agenda & Calendário de Reservas',
      category: 'Navegação',
      icon: <Calendar className="w-4 h-4 text-emerald-500" />,
      action: () => {
        setCurrentView('calendar');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-bills',
      title: 'Consultar Boletos & Cobranças Condominiais',
      category: 'Navegação',
      icon: <CreditCard className="w-4 h-4 text-amber-500" />,
      action: () => {
        setCurrentView('bills');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-docs',
      title: 'Acessar Biblioteca de Documentos & Atas',
      category: 'Navegação',
      icon: <FileText className="w-4 h-4 text-indigo-500" />,
      action: () => {
        setCurrentView('documents');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-announcements',
      title: 'Ver Mural de Comunicados Oficiais',
      category: 'Navegação',
      icon: <Bell className="w-4 h-4 text-rose-500" />,
      action: () => {
        setCurrentView('announcements');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-requests',
      title: 'Abrir Central de Solicitações & Chamados',
      category: 'Navegação',
      icon: <Wrench className="w-4 h-4 text-cyan-500" />,
      action: () => {
        setCurrentView('requests');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-occurrences',
      title: 'Registrar / Consultar Livro de Ocorrências',
      category: 'Navegação',
      icon: <AlertTriangle className="w-4 h-4 text-orange-500" />,
      action: () => {
        setCurrentView('occurrences');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-assemblies',
      title: 'Acessar Assembleias Virtuais & Votações',
      category: 'Navegação',
      icon: <Users className="w-4 h-4 text-purple-500" />,
      action: () => {
        setCurrentView('assemblies');
        setIsOpen(false);
      },
    },

    // Quick Actions
    {
      id: 'action-new-reservation',
      title: 'Nova Reserva de Espaço Comum',
      category: 'Ações Rápidas',
      icon: <Plus className="w-4 h-4 text-blue-600" />,
      action: () => {
        setCurrentView('reservations');
        setIsOpen(false);
      },
    },
    {
      id: 'action-new-request',
      title: 'Nova Solicitação para a Administração',
      category: 'Ações Rápidas',
      icon: <Plus className="w-4 h-4 text-cyan-600" />,
      action: () => {
        setCurrentView('requests');
        setIsOpen(false);
      },
    },
    {
      id: 'action-switch-condo',
      title: 'Alternar Condomínio ou Unidade Ativa',
      category: 'Ações Rápidas',
      icon: <Building2 className="w-4 h-4 text-slate-600" />,
      action: () => {
        setIsContextSwitcherOpen(true);
        setIsOpen(false);
      },
    },

    // System & Design System
    {
      id: 'sys-design-system',
      title: 'Visualizar Design System & Catálogo de Componentes',
      category: 'Sistema',
      icon: <Palette className="w-4 h-4 text-pink-500" />,
      action: () => {
        setCurrentView('permissions_matrix'); // Or design system view
        setIsOpen(false);
      },
    },
    {
      id: 'sys-toggle-theme',
      title: isDarkMode ? 'Alternar para Tema Claro (Light Mode)' : 'Alternar para Tema Escuro (Dark Mode)',
      category: 'Sistema',
      icon: isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />,
      action: () => {
        toggleDarkMode();
        setIsOpen(false);
      },
    },
  ];

  const filteredItems = commandItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const categories = Array.from(new Set(filteredItems.map((i) => i.category)));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col animate-in zoom-in-95 duration-150">
        {/* Search Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="O que você está procurando? (ex: reservas, boletos, atas)..."
            className="w-full text-sm bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Nenhum comando ou item encontrado para &quot;{query}&quot;
            </div>
          ) : (
            categories.map((cat) => (
              <div key={cat} className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                  {cat}
                </p>
                {filteredItems
                  .filter((i) => i.category === cat)
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left hover:bg-blue-50/70 dark:hover:bg-blue-950/40 text-slate-800 dark:text-slate-200 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60 transition-colors">
                          {item.icon}
                        </div>
                        <span className="text-xs sm:text-sm font-medium truncate">
                          {item.title}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Condominium Platform Experience</span>
          <div className="flex items-center gap-2">
            <span>Navegar</span>
            <kbd className="px-1 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">
              ↑
            </kbd>
            <kbd className="px-1 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">
              ↓
            </kbd>
            <span>Executar</span>
            <kbd className="px-1 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">
              ↵
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
};
