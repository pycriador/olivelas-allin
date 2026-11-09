import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CalendarCheck2,
  Users,
  Clock,
  DollarSign,
  Info,
  Calendar as CalendarIcon,
  Sparkles,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Search,
  Filter,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { InfoHelpButton } from '../components/ui/InfoHelpButton';
import { Resource } from '../types';

export const ReservationsView: React.FC = () => {
  const {
    resources,
    reservations,
    addReservation,
    cancelReservation,
    activeCondominium,
    currentUser,
    activeMembership,
    setCurrentView,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'catalog' | 'my_bookings'>('catalog');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [search, setSearch] = useState('');

  // Booking form states
  const [bookingDate, setBookingDate] = useState('2026-09-18');
  const [bookingStartTime, setBookingStartTime] = useState('18:00');
  const [bookingEndTime, setBookingEndTime] = useState('23:00');
  const [guestCount, setGuestCount] = useState<number>(20);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const condoResources = resources.filter((r) => r.condominiumId === activeCondominium.id);
  const myReservations = reservations.filter(
    (res) => res.condominiumId === activeCondominium.id && (res.userId === currentUser.id || res.userUnit === activeMembership?.unitNumber)
  );

  const filteredResources = condoResources.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMyReservations = myReservations.filter((res) =>
    res.resourceName.toLowerCase().includes(search.toLowerCase()) ||
    res.date.includes(search)
  );

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource || !agreedTerms) return;

    const totalCalculated = selectedResource.fee + (selectedResource.cleaningFee || 0);

    addReservation({
      condominiumId: activeCondominium.id,
      resourceId: selectedResource.id,
      resourceName: selectedResource.name,
      userId: currentUser.id,
      userName: currentUser.name,
      userUnit: activeMembership?.unitNumber ? `Apt ${activeMembership.unitNumber}` : 'Apt 101',
      date: bookingDate,
      startTime: bookingStartTime,
      endTime: bookingEndTime,
      status: selectedResource.requiresApproval ? 'pending_approval' : 'confirmed',
      guestCount,
      fee: totalCalculated,
    });

    setSelectedResource(null);
    setAgreedTerms(false);
    setActiveTab('my_bookings');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {activeCondominium.name}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-500">Áreas Comuns & Lazer</span>
        </div>
        <div className="flex items-center gap-2.5 mt-0.5">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Reservas de Espaços
          </h1>
          <InfoHelpButton
            title="Regras e Reservas de Espaços Comuns"
            description="Agende salão de festas, churrasqueiras, espaço gourmet e quadras esportivas com regras de antecedência e taxas de limpeza integradas."
            tips={[
              'Verifique os horários permitidos e limites de ruído conforme o regimento interno.',
              'Cancelamentos com antecedência mínima de 48h possuem estorno automático da taxa.',
            ]}
          />
        </div>
      </div>

      {/* Prominent Full-Width Action Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0 backdrop-blur-xs">
            <CalendarCheck2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
              Planejando uma comemoração ou evento?
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
              Consulte a disponibilidade no calendário completo ou escolha um dos espaços abaixo.
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="md"
          className="bg-white text-emerald-800 hover:bg-emerald-50 border-0 font-bold shadow-sm whitespace-nowrap shrink-0 self-stretch sm:self-auto justify-center"
          leftIcon={<CalendarIcon className="w-4 h-4 text-emerald-700" />}
          rightIcon={<ArrowRight className="w-4 h-4 text-emerald-700 hidden sm:inline" />}
          onClick={() => setCurrentView('calendar')}
        >
          Ver Calendário Completo
        </Button>
      </div>

      {/* Search & Category Dropdown Filter Side by Side */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === 'catalog' ? "Buscar por nome do espaço ou descrição..." : "Buscar reserva por espaço ou data..."}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          />
        </div>

        <div className="relative min-w-[220px] sm:w-64 shrink-0">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as 'catalog' | 'my_bookings')}
            className="w-full pl-9 pr-9 py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer appearance-none shadow-2xs"
          >
            <option value="catalog">Catálogo de Espaços ({condoResources.length})</option>
            <option value="my_bookings">Minhas Reservas ({myReservations.length})</option>
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Catalog View */}
      {activeTab === 'catalog' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((res) => (
            <Card key={res.id} padding="none" className="overflow-hidden flex flex-col justify-between hover:shadow-md">
              <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <img
                  src={res.imageUrl}
                  alt={res.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 flex gap-1.5">
                  <Badge variant="neutral" size="sm" className="bg-white/90 backdrop-blur-xs text-slate-900 font-bold">
                    <Users className="w-3 h-3 mr-1" />
                    Até {res.capacity} pessoas
                  </Badge>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {res.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {res.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Horário:</span>
                      <span className="font-semibold">{res.operatingHours.start} às {res.operatingHours.end}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Taxa de Uso:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {res.fee > 0 ? `R$ ${res.fee.toFixed(2).replace('.', ',')}` : 'Gratuito'}
                      </span>
                    </div>
                    {res.cleaningFee && res.cleaningFee > 0 ? (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Taxa de Limpeza:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          + R$ {res.cleaningFee.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => setSelectedResource(res)}
                >
                  Solicitar Reserva
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* My Bookings Tab */
        <div className="space-y-4">
          {filteredMyReservations.length === 0 ? (
            <Card className="text-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                <CalendarCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {search ? 'Nenhuma reserva encontrada para esta busca' : 'Você não possui reservas no momento'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                {search ? 'Tente buscar com outros termos ou limpe o filtro.' : 'Explore as áreas de lazer e faça seu primeiro agendamento.'}
              </p>
              <Button variant="primary" size="sm" onClick={() => { setSearch(''); setActiveTab('catalog'); }}>
                Ver Catálogo de Espaços
              </Button>
            </Card>
          ) : (
            filteredMyReservations.map((res) => (
              <Card key={res.id} className="border-blue-200 dark:border-blue-900/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={res.status === 'confirmed' ? 'success' : res.status === 'cancelled' ? 'danger' : 'warning'} dot>
                        {res.status === 'confirmed' ? 'Confirmada' : res.status === 'cancelled' ? 'Cancelada' : 'Aguardando Aprovação'}
                      </Badge>
                      <span className="text-xs font-semibold text-slate-500">
                        {res.userUnit}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {res.resourceName}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        📅 {new Date(res.date).toLocaleDateString('pt-BR')}
                      </span>
                      <span>•</span>
                      <span>⏰ {res.startTime} às {res.endTime}</span>
                      <span>•</span>
                      <span>👥 {res.guestCount} convidados</span>
                      <span>•</span>
                      <span>💰 R$ {res.fee.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>

                  {res.status !== 'cancelled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-rose-600 hover:text-rose-700 hover:border-rose-300 self-start sm:self-auto"
                      onClick={() => cancelReservation(res.id)}
                    >
                      Cancelar Reserva
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Booking Form Modal */}
      {selectedResource && (
        <Modal
          isOpen={!!selectedResource}
          onClose={() => setSelectedResource(null)}
          title={`Reservar ${selectedResource.name}`}
          maxWidth="lg"
        >
          <form onSubmit={handleBookSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Data do Evento
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  min="2026-08-28"
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Número de Convidados (Máx: {selectedResource.capacity})
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedResource.capacity}
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Horário Início
                </label>
                <input
                  type="time"
                  value={bookingStartTime}
                  onChange={(e) => setBookingStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Horário Término
                </label>
                <input
                  type="time"
                  value={bookingEndTime}
                  onChange={(e) => setBookingEndTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Fee summary breakdown */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Taxa de Utilização:</span>
                <span>R$ {selectedResource.fee.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxa de Limpeza Pós-Evento:</span>
                <span>R$ {selectedResource.cleaningFee.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>Total a ser cobrado no próximo boleto:</span>
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  R$ {(selectedResource.fee + selectedResource.cleaningFee).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                required
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>
                Declaro que li e concordo com o Regulamento de Uso do {selectedResource.name}, comprometendo-me a respeitar a Lei do Silêncio a partir das 22h e a integridade do mobiliário.
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedResource(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!agreedTerms}
              >
                Confirmar Reserva
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
