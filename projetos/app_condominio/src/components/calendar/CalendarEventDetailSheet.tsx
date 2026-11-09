import React from 'react';
import { Clock, MapPin, User, Calendar as CalendarIcon, Tag, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { CalendarEvent } from './types';
import { BottomSheet } from '../ui/BottomSheet';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface CalendarEventDetailSheetProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onCancelEvent?: (eventId: string) => void;
  canCancel?: boolean;
}

export const CalendarEventDetailSheet: React.FC<CalendarEventDetailSheetProps> = ({
  event,
  isOpen,
  onClose,
  onCancelEvent,
  canCancel = false,
}) => {
  if (!event) return null;

  const content = (
    <div className="space-y-4">
      {/* Category & Status */}
      <div className="flex items-center justify-between gap-2">
        <Badge variant="primary" size="md">
          {event.categoryLabel}
        </Badge>
        <Badge
          variant={
            event.status === 'confirmed'
              ? 'success'
              : event.status === 'pending'
              ? 'warning'
              : 'secondary'
          }
          size="sm"
          dot
        >
          {event.status === 'confirmed'
            ? 'Confirmada'
            : event.status === 'pending'
            ? 'Pendente'
            : event.status}
        </Badge>
      </div>

      {/* Title */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{event.title}</h3>
        {event.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{event.description}</p>
        )}
      </div>

      {/* Details Grid */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-2.5 text-xs">
        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2 text-slate-500">
            <CalendarIcon className="w-4 h-4" />
            <span>Data</span>
          </div>
          <span className="font-semibold">{event.date}</span>
        </div>

        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2 text-slate-500">
            <Clock className="w-4 h-4" />
            <span>Horário</span>
          </div>
          <span className="font-semibold">
            {event.startTime} às {event.endTime}
          </span>
        </div>

        {event.location && (
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2 text-slate-500">
              <MapPin className="w-4 h-4" />
              <span>Local</span>
            </div>
            <span className="font-semibold">{event.location}</span>
          </div>
        )}

        {event.userName && (
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2 text-slate-500">
              <User className="w-4 h-4" />
              <span>Responsável</span>
            </div>
            <span className="font-semibold">
              {event.userName} {event.userUnit ? `(Apt ${event.userUnit})` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-2 flex items-center justify-end gap-2.5">
        <Button variant="secondary" size="md" onClick={onClose}>
          Fechar
        </Button>
        {canCancel && onCancelEvent && (
          <Button
            variant="destructive"
            size="md"
            leftIcon={<Trash2 className="w-4 h-4" />}
            onClick={() => {
              onCancelEvent(event.id);
              onClose();
            }}
          >
            Cancelar Reserva
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Bottom Sheet (sm & down) */}
      <div className="block sm:hidden">
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Detalhes do Evento">
          {content}
        </BottomSheet>
      </div>

      {/* Desktop Modal (sm & up) */}
      <div className="hidden sm:block">
        <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Evento" maxWidth="md">
          {content}
        </Modal>
      </div>
    </>
  );
};
