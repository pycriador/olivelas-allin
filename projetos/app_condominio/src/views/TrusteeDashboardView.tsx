import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  AlertTriangle,
  CalendarCheck2,
  Users2,
  DollarSign,
  PlusCircle,
  FileText,
  Bell,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  Building,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const TrusteeDashboardView: React.FC = () => {
  const {
    activeCondominium,
    currentUser,
    setCurrentView,
    reservations,
    approveReservation,
    occurrences,
    assemblies,
    announcements,
    addAnnouncement,
    showToast,
  } = useApp();

  const [isNewNoticeModalOpen, setIsNewNoticeModalOpen] = useState(false);
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeCategory, setNewNoticeCategory] = useState<'general' | 'maintenance' | 'security' | 'event' | 'rules'>('maintenance');
  const [newNoticeContent, setNewNoticeContent] = useState('');

  const pendingReservations = reservations.filter((r) => r.status === 'confirmed').slice(0, 3);
  const openOccurrences = occurrences.filter((o) => o.status === 'open' || o.status === 'in_review');
  const nextAssembly = assemblies.find((a) => a.status === 'scheduled') || assemblies[0];

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) return;

    addAnnouncement({
      condominiumId: activeCondominium.id,
      title: newNoticeTitle,
      category: newNoticeCategory,
      categoryLabel: newNoticeCategory === 'important' ? 'Importante' : 'Manutenção',
      content: newNoticeContent,
      authorName: currentUser.name,
      authorRole: 'Síndico Geral',
      isPinned: false,
    });

    setNewNoticeTitle('');
    setNewNoticeContent('');
    setIsNewNoticeModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Painel de Governança do Síndico
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-300">{activeCondominium.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Gestão & Indicadores Operacionais
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Acompanhe o fluxo financeiro, reservas de áreas comuns, manutenções preventivas e assembleias em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            className="bg-amber-600 hover:bg-amber-500 text-white"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => setIsNewNoticeModalOpen(true)}
          >
            Publicar Comunicado
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-200 hover:bg-slate-800"
            onClick={() => setCurrentView('assemblies')}
          >
            Pauta da Assembleia
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Inadimplência */}
        <Card className="border-emerald-200 dark:border-emerald-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Inadimplência</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            3,8%
          </p>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            -1.2% em relação ao mês anterior
          </span>
        </Card>

        {/* KPI 2: Fundo de Reserva */}
        <Card className="border-blue-200 dark:border-blue-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Fundo de Reserva</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            R$ 142.500
          </p>
          <span className="text-[11px] text-slate-500">
            Rentabilidade CDI: +0.88% a.m.
          </span>
        </Card>

        {/* KPI 3: Reservas do Mês */}
        <Card className="border-indigo-200 dark:border-indigo-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Reservas no Mês</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            18 eventos
          </p>
          <span className="text-[11px] text-indigo-600 font-semibold">
            Salão de festas 92% ocupado aos fins de semana
          </span>
        </Card>

        {/* KPI 4: Ocorrências Abertas */}
        <Card className="border-rose-200 dark:border-rose-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Ocorrências Abertas</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {openOccurrences.length} pendentes
          </p>
          <span className="text-[11px] text-rose-500">
            1 vazamento reportado hoje
          </span>
        </Card>
      </div>

      {/* Main Operational Modules */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Open Occurrences & Feedback Queue */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Ocorrências com Prioridade de Atendimento
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView('occurrences')}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Ver Todas
            </Button>
          </div>

          <div className="space-y-3">
            {openOccurrences.slice(0, 3).map((occ) => (
              <div
                key={occ.id}
                onClick={() => setCurrentView('occurrences')}
                className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {occ.title}
                  </span>
                  <Badge variant={occ.status === 'open' ? 'danger' : 'warning'} size="sm">
                    {occ.status === 'open' ? 'Aberta' : 'Em Análise'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{occ.userName} ({occ.userUnit})</span>
                  <span>{occ.location}</span>
                </div>
                {occ.photos && occ.photos.length > 0 && (
                  <span className="inline-flex items-center text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                    📷 {occ.photos.length} fotos anexadas pelo morador
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming General Assembly (AGE) Card */}
        <Card className="border-purple-200 dark:border-purple-900/60 bg-gradient-to-br from-white to-purple-50/20 dark:from-slate-900 dark:to-purple-950/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                  <Users2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Próxima Assembleia Convocada
                  </h3>
                  <p className="text-xs text-slate-500">Deliberação Virtual e Híbrida</p>
                </div>
              </div>
              <Badge variant="purple" dot>15/09/2026</Badge>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {nextAssembly.title}
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {nextAssembly.agendaPoints.slice(0, 2).map((pt, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0 mt-1.5" />
                    <span className="line-clamp-1">{pt}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Quórum Confirmado:</span>
                  <span className="font-bold text-purple-600">{nextAssembly.currentQuorumPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${nextAssembly.currentQuorumPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="primary"
              size="sm"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => setCurrentView('assemblies')}
            >
              Gerenciar Cédulas de Voto
            </Button>
          </div>
        </Card>
      </div>

      {/* Create Announcement Modal */}
      <Modal
        isOpen={isNewNoticeModalOpen}
        onClose={() => setIsNewNoticeModalOpen(false)}
        title="Publicar Comunicado Oficial aos Moradores"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Título do Comunicado
            </label>
            <input
              type="text"
              value={newNoticeTitle}
              onChange={(e) => setNewNoticeTitle(e.target.value)}
              placeholder="Ex: Manutenção preventiva dos elevadores do Bloco A"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Categoria
              </label>
              <select
                value={newNoticeCategory}
                onChange={(e) => setNewNoticeCategory(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="maintenance">Manutenção</option>
                <option value="general">Geral</option>
                <option value="security">Segurança</option>
                <option value="event">Evento / Social</option>
                <option value="rules">Regimento Interno</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Destinatários
              </label>
              <input
                type="text"
                disabled
                value="Todos os Condôminos (Blocos A e B)"
                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-500 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Mensagem Completa
            </label>
            <textarea
              rows={5}
              value={newNoticeContent}
              onChange={(e) => setNewNoticeContent(e.target.value)}
              placeholder="Descreva as instruções, horários de interdição ou detalhes do aviso para a comunidade..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewNoticeModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={<Bell className="w-4 h-4" />}
            >
              Enviar Notificação
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
