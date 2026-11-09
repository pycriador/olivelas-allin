import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  Plus,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { InfoHelpButton } from '../components/ui/InfoHelpButton';

export const CalendarView: React.FC = () => {
  const {
    reservations,
    assemblies,
    announcements,
    activeCondominium,
    currentUser,
    setCurrentView,
  } = useApp();

  // Current month & year state (0-indexed month: 0=Jan, 7=Aug, 8=Sep)
  const [currentMonth, setCurrentMonth] = useState(7); // August 2026
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDateEvents, setSelectedDateEvents] = useState<{
    dateStr: string;
    dayNum: number;
    events: any[];
  } | null>(null);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Dynamic real calendar mathematics for the chosen month and year
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  const startDayOfWeek = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  }, [currentYear, currentMonth]);

  const prevMonthDays = useMemo(() => {
    return new Date(currentYear, currentMonth, 0).getDate();
  }, [currentYear, currentMonth]);

  // Total cells needed for full grid (35 or 42 to keep rectangular calendar)
  const totalGridCells = useMemo(() => {
    return startDayOfWeek + daysInMonth <= 35 ? 35 : 42;
  }, [startDayOfWeek, daysInMonth]);

  const nextMonthDaysCount = useMemo(() => {
    return totalGridCells - (startDayOfWeek + daysInMonth);
  }, [totalGridCells, startDayOfWeek, daysInMonth]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentMonth(7); // August (matching mock app timeframe)
    setCurrentYear(2026);
  };

  // Target date prefix for matching events (e.g., '2026-08')
  const targetPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  // Helper to compute predictable regular maintenance for any month
  const getDayOfMonthForNthWeekday = (year: number, month: number, nth: number, targetWeekday: number) => {
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      if (date.getDay() === targetWeekday) {
        count++;
        if (count === nth) return d;
      }
    }
    return Math.min(10 * nth, daysInMonth);
  };

  // Compile all unified events for the active condominium and current month
  const allEvents = useMemo(() => {
    // 1. Real reservations for this month
    const matchingReservations = reservations
      .filter((r) => r.condominiumId === activeCondominium.id && r.status !== 'cancelled' && r.date.startsWith(targetPrefix))
      .map((r) => {
        const day = parseInt(r.date.split('-')[2], 10);
        return {
          id: r.id,
          date: r.date,
          day,
          title: `${r.resourceName} (${r.userUnit})`,
          type: 'reservation' as const,
          time: `${r.startTime} - ${r.endTime}`,
          location: r.resourceName,
          user: r.userName,
          badgeVariant: 'primary' as const,
        };
      });

    // 2. Real assemblies for this month
    const matchingAssemblies = assemblies
      .filter((a) => a.condominiumId === activeCondominium.id && a.date.startsWith(targetPrefix))
      .map((a) => {
        const day = parseInt(a.date.split('-')[2], 10);
        return {
          id: a.id,
          date: a.date,
          day,
          title: a.title,
          type: 'assembly' as const,
          time: a.time,
          location: 'Assembleia Híbrida (App + Salão)',
          badgeVariant: 'purple' as const,
        };
      });

    // 3. Regular scheduled maintenance for this month
    const maintDay1 = getDayOfMonthForNthWeekday(currentYear, currentMonth, 1, 2); // 1st Tuesday: Elevadores
    const maintDay2 = getDayOfMonthForNthWeekday(currentYear, currentMonth, 2, 4); // 2nd Thursday: Geradores & Bombas
    const maintDay3 = getDayOfMonthForNthWeekday(currentYear, currentMonth, 3, 3); // 3rd Wednesday: Piscinas & Caixas d'Água

    const dynamicMaintenances = [
      {
        id: `maint-${currentYear}-${currentMonth}-1`,
        date: `${targetPrefix}-${String(maintDay1).padStart(2, '0')}`,
        day: maintDay1,
        title: 'Manutenção Preventiva de Elevadores',
        type: 'maintenance' as const,
        time: '09:00 - 12:00',
        location: 'Torre Central e Bloco A',
        badgeVariant: 'warning' as const,
      },
      {
        id: `maint-${currentYear}-${currentMonth}-2`,
        date: `${targetPrefix}-${String(maintDay2).padStart(2, '0')}`,
        day: maintDay2,
        title: 'Inspeção de Geradores e Bombas',
        type: 'maintenance' as const,
        time: '14:00 - 16:30',
        location: 'Subsolo e Barrilete Técnico',
        badgeVariant: 'warning' as const,
      },
      {
        id: `maint-${currentYear}-${currentMonth}-3`,
        date: `${targetPrefix}-${String(maintDay3).padStart(2, '0')}`,
        day: maintDay3,
        title: 'Higienização de Piscinas & Filtros',
        type: 'maintenance' as const,
        time: '08:00 - 11:30',
        location: 'Área Aquática',
        badgeVariant: 'warning' as const,
      },
    ];

    return [...matchingReservations, ...matchingAssemblies, ...dynamicMaintenances];
  }, [reservations, assemblies, activeCondominium.id, targetPrefix, currentYear, currentMonth, daysInMonth]);

  // Counts for dropdown labels
  const reservationCount = useMemo(() => allEvents.filter((e) => e.type === 'reservation').length, [allEvents]);
  const maintenanceCount = useMemo(() => allEvents.filter((e) => e.type === 'maintenance').length, [allEvents]);
  const assemblyCount = useMemo(() => allEvents.filter((e) => e.type === 'assembly').length, [allEvents]);

  // Filtered by selected category
  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'all') return allEvents;
    return allEvents.filter((ev) => ev.type === selectedCategory);
  }, [allEvents, selectedCategory]);

  const getEventsForDay = (day: number) => {
    return filteredEvents.filter((e) => e.day === day);
  };

  const handleDayClick = (day: number) => {
    const evs = getEventsForDay(day);
    const dateFormatted = `${String(day).padStart(2, '0')}/${String(currentMonth + 1).padStart(2, '0')}/${currentYear}`;
    setSelectedDateEvents({ dateStr: dateFormatted, dayNum: day, events: evs });
  };

  // Check if cell is "today"
  const isTodayCell = (dayNum: number) => {
    return dayNum === 28 && currentMonth === 7 && currentYear === 2026;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header with Title & Help */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {activeCondominium.name}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-500">Agenda Integrada</span>
        </div>
        <div className="flex items-center gap-2.5 mt-0.5">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Calendário de Eventos & Ocupação
          </h1>
          <InfoHelpButton
            title="Calendário Unificado do Condomínio"
            description="Visão integrada de ocupação das áreas comuns, manutenções preventivas, visitas técnicas e datas das assembleias com cálculo dinâmico de calendário."
            tips={[
              'Clique em qualquer dia do mês para expandir os detalhes de horários e eventos agendados.',
              'Use o menu suspenso de filtros para isolar manutenções, assembleias ou reservas de lazer.',
            ]}
          />
        </div>
      </div>

      {/* Prominent Full-Width Top Action Banner for Making Reservations */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0 backdrop-blur-xs">
            <CalendarIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
              Planejando um evento ou reunião de condomínio?
            </h3>
            <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
              Consulte a disponibilidade de salões, churrasqueiras e quadras para reservar online.
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="md"
          className="bg-white text-blue-700 hover:bg-blue-50 border-0 font-bold shadow-sm whitespace-nowrap shrink-0 self-stretch sm:self-auto justify-center"
          leftIcon={<Plus className="w-4 h-4 text-blue-700" />}
          rightIcon={<ArrowRight className="w-4 h-4 text-blue-700 hidden sm:inline" />}
          onClick={() => setCurrentView('reservations')}
        >
          Fazer Nova Reserva
        </Button>
      </div>

      {/* Month Navigation & Category Dropdown Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Month & Year Navigation */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            <button
              onClick={handlePrevMonth}
              title="Mês anterior"
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleGoToday}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              Hoje
            </button>
            <button
              onClick={handleNextMonth}
              title="Próximo mês"
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              className="px-3 py-1.5 text-base sm:text-lg font-extrabold text-slate-900 dark:text-white bg-transparent border-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {monthNames.map((name, idx) => (
                <option key={name} value={idx} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                  {name}
                </option>
              ))}
            </select>

            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              className="px-2 py-1.5 text-base sm:text-lg font-extrabold text-slate-900 dark:text-white bg-transparent border-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                <option key={yr} value={yr} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Categories Dropdown Menu */}
        <div className="relative flex items-center min-w-[240px] sm:w-64">
          <Filter className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer appearance-none shadow-2xs"
          >
            <option value="all">Todas as Categorias ({allEvents.length})</option>
            <option value="reservation">Reservas de Lazer ({reservationCount})</option>
            <option value="maintenance">Manutenções Prediais ({maintenanceCount})</option>
            <option value="assembly">Assembleias Oficiais ({assemblyCount})</option>
          </select>
          <ChevronDown className="absolute right-3 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Main Dynamic Calendar Grid */}
      <Card padding="none" className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-center py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
          {daysOfWeek.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800 bg-slate-100 dark:bg-slate-800/40">
          {/* Previous month filler days */}
          {Array.from({ length: startDayOfWeek }).map((_, i) => {
            const prevDayNum = prevMonthDays - startDayOfWeek + i + 1;
            return (
              <div
                key={`prev-${i}`}
                onClick={handlePrevMonth}
                title="Ir para o mês anterior"
                className="min-h-[85px] sm:min-h-[110px] bg-slate-50/60 dark:bg-slate-900/40 p-2 opacity-40 hover:opacity-75 transition-opacity cursor-pointer flex flex-col justify-start"
              >
                <span className="text-xs font-medium text-slate-400">{prevDayNum}</span>
              </div>
            );
          })}

          {/* Actual days in selected month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayEvents = getEventsForDay(dayNum);
            const isToday = isTodayCell(dayNum);

            return (
              <div
                key={`day-${currentYear}-${currentMonth}-${dayNum}`}
                onClick={() => handleDayClick(dayNum)}
                className={`min-h-[85px] sm:min-h-[110px] p-2 bg-white dark:bg-slate-900 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors cursor-pointer flex flex-col justify-between group ${
                  isToday ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/10' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-110 ${
                      isToday
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 group-hover:text-blue-600'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {dayEvents.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline">
                      {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'}
                    </span>
                  )}
                </div>

                {/* Event Tags inside the calendar cell */}
                <div className="space-y-1 mt-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded truncate border ${
                        ev.type === 'reservation'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          : ev.type === 'assembly'
                          ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-[10px] text-slate-400 font-bold block pl-1">
                      +{dayEvents.length - 2} mais
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Next month trailing filler days */}
          {Array.from({ length: nextMonthDaysCount }).map((_, i) => {
            const nextDayNum = i + 1;
            return (
              <div
                key={`next-${i}`}
                onClick={handleNextMonth}
                title="Ir para o próximo mês"
                className="min-h-[85px] sm:min-h-[110px] bg-slate-50/60 dark:bg-slate-900/40 p-2 opacity-40 hover:opacity-75 transition-opacity cursor-pointer flex flex-col justify-start"
              >
                <span className="text-xs font-medium text-slate-400">{nextDayNum}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Day Events Details Modal */}
      {selectedDateEvents && (
        <Modal
          isOpen={!!selectedDateEvents}
          onClose={() => setSelectedDateEvents(null)}
          title={`Agenda do Dia — ${selectedDateEvents.dateStr}`}
          maxWidth="md"
        >
          <div className="space-y-3">
            {selectedDateEvents.events.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Nenhum evento agendado para esta data.
                </p>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Os espaços do condomínio estão livres para reserva neste dia.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedDateEvents(null);
                    setCurrentView('reservations');
                  }}
                >
                  Reservar este Dia
                </Button>
              </div>
            ) : (
              selectedDateEvents.events.map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={ev.badgeVariant} size="sm">
                      {ev.type === 'reservation'
                        ? 'Reserva de Lazer'
                        : ev.type === 'assembly'
                        ? 'Assembleia Oficial'
                        : 'Manutenção Predial'}
                    </Badge>
                    <span className="text-xs font-mono text-slate-500">{ev.time}</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {ev.title}
                  </h4>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{ev.location}</span>
                  </div>

                  {ev.user && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Users className="w-3.5 h-3.5 shrink-0" />
                      <span>Responsável: {ev.user}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

