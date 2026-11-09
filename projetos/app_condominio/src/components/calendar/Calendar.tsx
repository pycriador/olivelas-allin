import React, { useState } from 'react';
import { CalendarEvent, CalendarViewMode, CalendarEventCategory } from './types';
import { CalendarToolbar } from './CalendarToolbar';
import { CalendarDatePicker } from './CalendarDatePicker';
import { CalendarMonthView } from './CalendarMonthView';
import { CalendarWeekView } from './CalendarWeekView';
import { CalendarDayView } from './CalendarDayView';
import { CalendarAgendaView } from './CalendarAgendaView';
import { CalendarFilters } from './CalendarFilters';
import { CalendarEventDetailSheet } from './CalendarEventDetailSheet';

export interface CalendarProps {
  events: CalendarEvent[];
  onNewReservation?: () => void;
  onCancelEvent?: (eventId: string) => void;
  initialDate?: string; // YYYY-MM-DD
  className?: string;
}

export const Calendar: React.FC<CalendarProps> = ({
  events,
  onNewReservation,
  onCancelEvent,
  initialDate = '2026-08-28',
  className = '',
}) => {
  const [currentDate, setCurrentDate] = useState<string>(initialDate);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [selectedCategories, setSelectedCategories] = useState<CalendarEventCategory[]>([]);
  const [isFilterMobileOpen, setIsFilterMobileOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const dateObj = new Date(currentDate + 'T00:00:00');
  const currentYear = dateObj.getFullYear();
  const currentMonth = dateObj.getMonth();

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  // Filtering
  const filteredEvents = events.filter((e) => {
    if (selectedCategories.length === 0) return true;
    return selectedCategories.includes(e.category);
  });

  // Navigation handlers
  const handlePrev = () => {
    const nextDate = new Date(currentDate + 'T00:00:00');
    if (viewMode === 'month') {
      nextDate.setMonth(nextDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      nextDate.setDate(nextDate.getDate() - 7);
    } else {
      nextDate.setDate(nextDate.getDate() - 1);
    }
    setCurrentDate(nextDate.toISOString().split('T')[0]);
  };

  const handleNext = () => {
    const nextDate = new Date(currentDate + 'T00:00:00');
    if (viewMode === 'month') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    setCurrentDate(nextDate.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setCurrentDate('2026-08-28');
  };

  const toggleCategory = (cat: CalendarEventCategory) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  // Mobile horizontal days generator
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const mobileDays = Array.from({ length: daysInCurrentMonth }).map((_, idx) => {
    const d = new Date(currentYear, currentMonth, idx + 1);
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
      idx + 1
    ).padStart(2, '0')}`;
    const hasEvents = filteredEvents.some((e) => e.date === dateStr);
    return {
      dateStr,
      dayNumber: idx + 1,
      dayName: daysOfWeek[d.getDay()],
      isToday: dateStr === '2026-08-28',
      hasEvents,
    };
  });

  const currentDateLabel = `${monthNames[currentMonth]} ${currentYear}`;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Calendar Toolbar */}
      <CalendarToolbar
        currentDateLabel={currentDateLabel}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onNewReservation={onNewReservation}
        filterCount={selectedCategories.length}
        onToggleFilter={() => setIsFilterMobileOpen(true)}
      />

      {/* Category Filter Pills */}
      <CalendarFilters
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategory}
        onClearAll={() => setSelectedCategories([])}
        isOpenMobile={isFilterMobileOpen}
        onCloseMobile={() => setIsFilterMobileOpen(false)}
      />

      {/* Mobile Horizontal Quick-Date Picker Strip (visible on mobile when in Day or Month view) */}
      <div className="block sm:hidden">
        <CalendarDatePicker
          selectedDate={currentDate}
          onSelectDate={(date) => {
            setCurrentDate(date);
            setViewMode('day');
          }}
          days={mobileDays}
        />
      </div>

      {/* Render Active View */}
      {viewMode === 'month' && (
        <CalendarMonthView
          year={currentYear}
          month={currentMonth}
          events={filteredEvents}
          onEventClick={(ev) => setSelectedEvent(ev)}
          onDayClick={(dateStr) => {
            setCurrentDate(dateStr);
            setViewMode('day');
          }}
        />
      )}

      {viewMode === 'week' && (
        <CalendarWeekView
          startDateStr={currentDate}
          events={filteredEvents}
          onEventClick={(ev) => setSelectedEvent(ev)}
        />
      )}

      {viewMode === 'day' && (
        <CalendarDayView
          dateStr={currentDate}
          events={filteredEvents}
          onEventClick={(ev) => setSelectedEvent(ev)}
        />
      )}

      {viewMode === 'agenda' && (
        <CalendarAgendaView
          events={filteredEvents}
          onEventClick={(ev) => setSelectedEvent(ev)}
        />
      )}

      {/* Event Details Sheet / Modal */}
      <CalendarEventDetailSheet
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onCancelEvent={onCancelEvent}
        canCancel={!!selectedEvent?.isMyEvent}
      />
    </div>
  );
};
