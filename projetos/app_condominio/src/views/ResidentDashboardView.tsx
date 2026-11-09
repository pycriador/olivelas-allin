import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Receipt,
  CalendarCheck2,
  Bell,
  LifeBuoy,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Building,
  ChevronRight,
  Clock,
  QrCode,
  Calendar,
  FileText,
  Send,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const ResidentDashboardView: React.FC = () => {
  const {
    activeCondominium,
    activeMembership,
    currentUser,
    setCurrentView,
    bills,
    payBill,
    reservations,
    announcements,
    requests,
    occurrences,
    setIsAiSearchOpen,
    showToast,
  } = useApp();

  const [copiedBarcode, setCopiedBarcode] = useState(false);
  const [selectedBillForPix, setSelectedBillForPix] = useState<any | null>(null);
  const [aiQuestion, setAiQuestion] = useState('');

  // Find relevant items for Willian / current unit
  const openBill = bills.find((b) => b.userId === currentUser.id && b.status === 'open') || bills[0];
  const activeReservation = reservations.find((r) => r.userId === currentUser.id && r.status === 'confirmed') || reservations[0];
  const activeRequests = requests.filter((r) => r.userId === currentUser.id && r.status !== 'resolved');

  const handleCopyBarcode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedBarcode(true);
    showToast('info', 'Código Copiado', 'Linha digitável copiada para a área de transferência.');
    setTimeout(() => setCopiedBarcode(false), 3000);
  };

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) {
      setIsAiSearchOpen(true);
      return;
    }
    setIsAiSearchOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header Profile Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Bom dia, {currentUser.name.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Confira o que está acontecendo no {activeCondominium.name} hoje.
          </p>
        </div>
        {activeMembership?.unitNumber && (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm self-start sm:self-auto">
            <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>
              Unidade {activeMembership.unitNumber} {activeMembership.block ? `(${activeMembership.block})` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Main Grid Layout (High Density 12 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols on large screens) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 3 Metrics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Metric 1: Finanças */}
            <div
              onClick={() => setCurrentView('bills')}
              className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                  Finanças
                </span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                R$ {openBill ? openBill.amount.toFixed(2).replace('.', ',') : '0,00'}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                <span>{openBill ? '1 boleto em aberto' : 'Tudo quitado'}</span>
              </div>
            </div>

            {/* Metric 2: Reservas */}
            <div
              onClick={() => setCurrentView('reservations')}
              className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                  Reservas
                </span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <CalendarCheck2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white truncate">
                {activeReservation ? activeReservation.resourceName : 'Nenhuma'}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1 truncate">
                {activeReservation ? `${activeReservation.date} • ${activeReservation.startTime}` : 'Espaços livres hoje'}
              </div>
            </div>

            {/* Metric 3: Solicitações */}
            <div
              onClick={() => setCurrentView('requests')}
              className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                  Solicitações
                </span>
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
                  <LifeBuoy className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {activeRequests.length > 0 ? `0${activeRequests.length} Ativa${activeRequests.length > 1 ? 's' : ''}` : '00 Ativas'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                {activeRequests.length > 0 ? 'Em análise pela portaria' : 'Nenhum chamado aberto'}
              </div>
            </div>
          </div>

          {/* Próximos Eventos */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm sm:text-base">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                Próximos Eventos
              </h2>
              <button
                onClick={() => setCurrentView('calendar')}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
              >
                Ver calendário completo
              </button>
            </div>

            <div className="space-y-3">
              {/* Event 1 */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400">SET</span>
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-200 leading-none">12</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Assembleia Geral Ordinária
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      Salão de Festas Principal • 19:30
                    </p>
                  </div>
                </div>
                <Badge variant="primary" size="sm" className="hidden sm:inline-flex">
                  Obrigatório
                </Badge>
              </div>

              {/* Event 2 */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400">SET</span>
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-200 leading-none">15</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Manutenção Preventiva dos Elevadores
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      Torre A e B • 08:00 às 12:00
                    </p>
                  </div>
                </div>
                <Badge variant="warning" size="sm" className="hidden sm:inline-flex">
                  Aviso
                </Badge>
              </div>

              {/* Event 3 */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400">SET</span>
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-200 leading-none">20</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Feira Gastronômica dos Moradores
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      Praça Central • 18:00
                    </p>
                  </div>
                </div>
                <Badge variant="success" size="sm" className="hidden sm:inline-flex">
                  Lazer
                </Badge>
              </div>
            </div>
          </div>

          {/* Assistente Inteligente IA Card */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 text-white relative overflow-hidden shadow-sm">
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2 text-blue-400 font-medium text-xs">
                <Sparkles className="w-4 h-4" />
                <span>Assistente Inteligente</span>
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight">Dúvidas sobre o condomínio?</h3>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">
                  Pergunte qualquer coisa sobre o regimento interno, horários de mudança ou barulho.
                </p>
              </div>
              <form onSubmit={handleAiSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="Ex: Qual o horário permitido para mudanças nos sábados?"
                  className="bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm rounded-lg px-4 py-2.5 flex-1 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span>Perguntar</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols on large screens) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Ações Rápidas Grid 2x2 */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-4 text-sm sm:text-base">
              Ações Rápidas
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {/* Action 1 */}
              <button
                onClick={() => setCurrentView('reservations')}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all text-center group cursor-pointer"
              >
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <CalendarCheck2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nova Reserva
                </span>
              </button>

              {/* Action 2 */}
              <button
                onClick={() => setCurrentView('occurrences')}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-amber-200 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all text-center group cursor-pointer"
              >
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ocorrência
                </span>
              </button>

              {/* Action 3 */}
              <button
                onClick={() => setCurrentView('bills')}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-200 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all text-center group cursor-pointer"
              >
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Receipt className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Boletos & PIX
                </span>
              </button>

              {/* Action 4 */}
              <button
                onClick={() => setCurrentView('documents')}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-purple-200 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-all text-center group cursor-pointer"
              >
                <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Documentos
                </span>
              </button>
            </div>
          </div>

          {/* Últimos Comunicados */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-4 text-sm sm:text-base">
              Últimos Comunicados
            </h2>
            <div className="space-y-4">
              {announcements.slice(0, 3).map((notice, idx) => (
                <div
                  key={notice.id}
                  onClick={() => setCurrentView('announcements')}
                  className={`border-l-4 ${
                    idx === 0 ? 'border-blue-600' : idx === 1 ? 'border-amber-500' : 'border-slate-300 dark:border-slate-700'
                  } pl-3 py-1 cursor-pointer hover:opacity-80 transition-opacity`}
                >
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                    {notice.categoryLabel || notice.category}
                  </span>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 mt-0.5">
                    {notice.title}
                  </h4>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5">
                    {notice.publishedAt} • {notice.authorName}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setCurrentView('announcements')}
              className="w-full mt-4 py-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
            >
              Ler todos os avisos
            </button>
          </div>
        </div>
      </div>

      {/* PIX Payment Modal Simulation */}
      {selectedBillForPix && (
        <Modal
          isOpen={!!selectedBillForPix}
          onClose={() => setSelectedBillForPix(null)}
          title="Pagamento Instantâneo via PIX"
          maxWidth="md"
        >
          <div className="text-center space-y-4">
            <div className="w-48 h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl mx-auto flex items-center justify-center p-4 border border-slate-200 dark:border-slate-700">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126580014br.gov.bcb.pix0136a196ed7b-53fa-4ed9-8296-fb21e87a9d695204000053039865406842.355802BR5925SOLAR%20PARK%20CONDOMINIO6009RIO%20DE%20JANEIRO62070503***6304E8A2"
                alt="QR Code PIX"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>

            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                R$ {selectedBillForPix.amount.toFixed(2).replace('.', ',')}
              </p>
              <p className="text-xs text-slate-500">Favorecido: Condomínio Solar Park (CNPJ 12.345.678/0001-90)</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Chave Copia e Cola PIX
              </span>
              <p className="font-mono text-xs text-slate-700 dark:text-slate-300 break-all select-all">
                {selectedBillForPix.pixKey}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(selectedBillForPix.pixKey);
                  showToast('success', 'PIX Copiado', 'Chave PIX copiada para a área de transferência.');
                }}
                leftIcon={<Copy className="w-4 h-4" />}
              >
                Copiar Chave
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => {
                  payBill(selectedBillForPix.id);
                  setSelectedBillForPix(null);
                }}
              >
                Simular Pagamento
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
