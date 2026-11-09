import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  Check,
  Calendar,
  AlertCircle,
  FileText,
  CreditCard,
  X,
  ChevronRight,
} from 'lucide-react';
import { Badge } from './Badge';

interface NotificationItem {
  id: string;
  category: 'reservas' | 'comunicados' | 'solicitacoes' | 'sistema';
  title: string;
  message: string;
  timeAgo: string;
  read: boolean;
  viewTarget?: string;
}

export const NotificationCenter: React.FC = () => {
  const { setCurrentView, announcements } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('todas');
  const panelRef = useRef<HTMLDivElement>(null);

  // Mock Notification data aligned with system events
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      category: 'reservas',
      title: 'Reserva Confirmada',
      message: 'Sua reserva da Churrasqueira 01 para 28/08 foi aprovada com sucesso.',
      timeAgo: 'Há 10 min',
      read: false,
      viewTarget: 'calendar',
    },
    {
      id: 'notif-2',
      category: 'comunicados',
      title: 'Manutenção Preventiva de Bombas',
      message: 'Interrupção temporária de água no Bloco B nesta quinta-feira das 09h às 12h.',
      timeAgo: 'Há 1 hora',
      read: false,
      viewTarget: 'announcements',
    },
    {
      id: 'notif-3',
      category: 'solicitacoes',
      title: 'Chamado #2026-44 Atualizado',
      message: 'A administração respondeu à sua solicitação de autorização de mudança.',
      timeAgo: 'Há 3 horas',
      read: true,
      viewTarget: 'requests',
    },
    {
      id: 'notif-4',
      category: 'sistema',
      title: 'Novo Boleto Disponível',
      message: 'A taxa condominial de Setembro/2026 já está disponível para pagamento via PIX.',
      timeAgo: 'Ontem',
      read: true,
      viewTarget: 'bills',
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const filtered =
    activeCategory === 'todas'
      ? notifications
      : notifications.filter((n) => n.category === activeCategory);

  const getCategoryIcon = (cat: NotificationItem['category']) => {
    switch (cat) {
      case 'reservas':
        return <Calendar className="w-4 h-4 text-emerald-500" />;
      case 'comunicados':
        return <Bell className="w-4 h-4 text-rose-500" />;
      case 'solicitacoes':
        return <AlertCircle className="w-4 h-4 text-cyan-500" />;
      case 'sistema':
        return <CreditCard className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        aria-label="Abrir Notificações"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-3 top-16 sm:inset-x-auto sm:top-auto sm:absolute sm:right-0 sm:mt-2 z-50 max-w-sm sm:w-96 mx-auto sm:mx-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notificações</h3>
              {unreadCount > 0 && (
                <Badge variant="primary" size="sm">
                  {unreadCount} novas
                </Badge>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
              >
                Marcar lidas
              </button>
            )}
          </div>

          {/* Categories Tab Bar */}
          <div className="flex items-center gap-1 p-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 overflow-x-auto text-[11px]">
            {[
              { id: 'todas', label: 'Todas' },
              { id: 'reservas', label: 'Reservas' },
              { id: 'comunicados', label: 'Avisos' },
              { id: 'solicitacoes', label: 'Chamados' },
              { id: 'sistema', label: 'Sistema' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === tab.id
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Nenhuma notificação nesta categoria.
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    markAsRead(item.id);
                    if (item.viewTarget) {
                      setCurrentView(item.viewTarget as any);
                      setIsOpen(false);
                    }
                  }}
                  className={`flex items-start gap-3 p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer ${
                    !item.read ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs truncate ${
                          !item.read
                            ? 'font-bold text-slate-900 dark:text-white'
                            : 'font-medium text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">{item.timeAgo}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {item.message}
                    </p>
                  </div>
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
