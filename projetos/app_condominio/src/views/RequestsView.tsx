import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LifeBuoy,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Filter,
  MessageSquare,
  ArrowRight,
  Send,
  User,
  ShieldCheck,
  Search,
  Inbox,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { InfoHelpButton } from '../components/ui/InfoHelpButton';
import { useUrlPagination } from '../hooks/useUrlPagination';
import { ServiceRequest } from '../types';

export const RequestsView: React.FC = () => {
  const {
    requests,
    addRequest,
    updateRequestStatus,
    activeCondominium,
    currentUser,
    activeMembership,
    activeRole,
    showToast,
  } = useApp();

  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ServiceRequest['category']>('maintenance');
  const [priority, setPriority] = useState<ServiceRequest['priority']>('medium');
  const [description, setDescription] = useState('');

  const isTrusteeOrAdmin = activeRole === 'trustee' || activeRole === 'admin' || activeRole === 'global_admin';

  // Base requests according to role
  const condoRequests = requests.filter((r) => r.condominiumId === activeCondominium.id);
  const userFilteredRequests = isTrusteeOrAdmin
    ? condoRequests
    : condoRequests.filter((r) => r.userId === currentUser.id);

  // URL-synchronized search, filter, and pagination
  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedItems: paginatedRequests,
    searchQuery: search,
    activeFilter: filterStatus,
    setPage,
    setSearch,
    setFilter: setFilterStatus,
    setItemsPerPage,
  } = useUrlPagination<ServiceRequest>({
    items: userFilteredRequests,
    filterFn: (r, searchQuery, status) => {
      const matchesStatus = status === 'all' || r.status === status;
      const matchesSearch =
        !searchQuery ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(r.ticketNumber).includes(searchQuery) ||
        r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.userUnit.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    },
    defaultItemsPerPage: 6,
    pageParamKey: 'page',
    searchParamKey: 'q',
    filterParamKey: 'status',
    defaultFilter: 'all',
  });

  const getStatusBadge = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'open':
        return <Badge variant="neutral" size="sm" dot>Aberto</Badge>;
      case 'in_review':
        return <Badge variant="warning" size="sm" dot>Em Análise</Badge>;
      case 'in_progress':
        return <Badge variant="primary" size="sm" dot>Em Andamento</Badge>;
      case 'resolved':
        return <Badge variant="success" size="sm" dot>Resolvido</Badge>;
      case 'cancelled':
        return <Badge variant="danger" size="sm" dot>Cancelado</Badge>;
    }
  };

  const getPriorityBadge = (p: ServiceRequest['priority']) => {
    switch (p) {
      case 'high':
        return <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded">Alta</span>;
      case 'medium':
        return <span className="text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Média</span>;
      case 'low':
        return <span className="text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Baixa</span>;
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    addRequest({
      condominiumId: activeCondominium.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userUnit: activeMembership?.unitNumber ? `Apt ${activeMembership.unitNumber}` : 'Apt 101',
      category,
      priority,
      title,
      description,
      status: 'open',
    });

    setTitle('');
    setDescription('');
    setIsNewModalOpen(false);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !replyMessage.trim()) return;

    updateRequestStatus(selectedRequest.id, selectedRequest.status, replyMessage);

    // Update local modal state
    const updated = {
      ...selectedRequest,
      timeline: [
        ...selectedRequest.timeline,
        {
          id: `tl-${Date.now()}`,
          author: currentUser.name,
          role: isTrusteeOrAdmin ? 'Síndico / Gestão' : 'Morador',
          message: replyMessage,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    setSelectedRequest(updated);
    setReplyMessage('');
    showToast('success', 'Mensagem Enviada', 'Atualização registrada na timeline do chamado.');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header with Info Help Button (?) */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {activeCondominium.name}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-500">Atendimento & Chamados</span>
        </div>
        <div className="flex items-center gap-2.5 mt-0.5">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Chamados & Solicitações
          </h1>
          <InfoHelpButton
            title="Central de Chamados e Solicitações"
            description="Canal direto para registrar pedidos de autorização, segunda via de documentos, liberação de tags de acesso, reparos e dúvidas administrativas."
            tips={[
              'Cada chamado possui um número de protocolo exclusivo e linha do tempo de respostas.',
              'Você será notificado sempre que o síndico ou a administração responder ao seu chamado.',
              'Utilize o campo de busca para pesquisar chamados por protocolo (#REQ-xxxx) ou palavras-chave.',
            ]}
          />
        </div>
      </div>

      {/* Prominent Full-Width Top Action Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0 backdrop-blur-xs">
            <LifeBuoy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
              Precisa de suporte ou atendimento da administração?
            </h3>
            <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
              Abra um chamado oficial para reparos, dúvidas, autorizações, tags de acesso ou 2ª via.
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="md"
          className="bg-white text-blue-700 hover:bg-blue-50 border-0 font-bold shadow-sm whitespace-nowrap shrink-0 self-stretch sm:self-auto justify-center"
          leftIcon={<PlusCircle className="w-4 h-4 text-blue-700" />}
          rightIcon={<ArrowRight className="w-4 h-4 text-blue-700 hidden sm:inline" />}
          onClick={() => setIsNewModalOpen(true)}
        >
          Abrir Novo Chamado
        </Button>
      </div>

      {/* Search & Dropdown Filter Side by Side */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar chamado por assunto, protocolo (#REQ...), solicitante ou unidade..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
          />
        </div>

        <div className="relative min-w-[200px] sm:w-56 shrink-0">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer appearance-none shadow-2xs"
          >
            <option value="all">Todos os Chamados ({userFilteredRequests.length})</option>
            <option value="open">Abertos ({userFilteredRequests.filter((r) => r.status === 'open').length})</option>
            <option value="in_progress">Em Andamento ({userFilteredRequests.filter((r) => r.status === 'in_progress' || r.status === 'in_review').length})</option>
            <option value="resolved">Resolvidos ({userFilteredRequests.filter((r) => r.status === 'resolved').length})</option>
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Requests List */}
      {paginatedRequests.length > 0 ? (
        <div className="space-y-3">
          {paginatedRequests.map((req) => (
            <Card
              key={req.id}
              hoverable
              onClick={() => setSelectedRequest(req)}
              className="cursor-pointer"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      #{req.ticketNumber}
                    </span>
                    {getStatusBadge(req.status)}
                    {getPriorityBadge(req.priority)}
                    <span className="text-xs text-slate-500 font-medium">
                      {req.userUnit} • {req.userName}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {req.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {req.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="text-right text-xs text-slate-400">
                    <p>{new Date(req.createdAt).toLocaleDateString('pt-BR')}</p>
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                      {req.timeline.length} interações
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </Card>
          ))}

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setPage}
            onItemsPerPageChange={setItemsPerPage}
            pageSizeOptions={[6, 12, 18]}
          />
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Nenhum chamado encontrado
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não existem chamados cadastrados correspondentes aos filtros selecionados.
          </p>
          {(search || filterStatus !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setFilterStatus('all');
              }}
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      )}

      {/* Ticket Details & Interactive Timeline Modal */}
      {selectedRequest && (
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title={`Chamado #${selectedRequest.ticketNumber}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Header info */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedRequest.title}
                </h3>
                {getStatusBadge(selectedRequest.status)}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {selectedRequest.description}
              </p>
              <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-400 border-t border-slate-200 dark:border-slate-700">
                <span>Solicitante: {selectedRequest.userName} ({selectedRequest.userUnit})</span>
                <span>•</span>
                <span>Prioridade: {selectedRequest.priority.toUpperCase()}</span>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                Linha do Tempo de Atendimento
              </h4>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {selectedRequest.timeline.map((step) => (
                  <div key={step.id} className="relative">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </div>
                    <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {step.author} ({step.role})
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(step.timestamp).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(step.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {step.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Message form */}
            <form onSubmit={handleSendReply} className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <input
                type="text"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Escreva uma resposta ou atualização..."
                className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button type="submit" variant="primary" size="sm" leftIcon={<Send className="w-3.5 h-3.5" />}>
                Enviar
              </Button>
            </form>
          </div>
        </Modal>
      )}

      {/* New Request Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Abrir Novo Chamado de Atendimento"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assunto / Título da Solicitação *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Emissão de nova tag de garagem para veículo"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoria *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="maintenance">Manutenção Predial</option>
                <option value="financial">Financeiro / Boletos</option>
                <option value="tag_access">Tags & Portaria</option>
                <option value="document_copy">2ª Via de Documento</option>
                <option value="authorization">Autorização de Acesso</option>
                <option value="other">Outros Assuntos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Prioridade *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descrição Detalhada *
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explique o que você precisa ou a situação detalhada..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsNewModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Protocolar Chamado
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

