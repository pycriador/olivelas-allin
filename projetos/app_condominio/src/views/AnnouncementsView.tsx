import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  Pin,
  CheckCircle2,
  Eye,
  PlusCircle,
  ShieldAlert,
  Wrench,
  PartyPopper,
  FileText,
  Search,
  Inbox,
  Filter,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { InfoHelpButton } from '../components/ui/InfoHelpButton';
import { useUrlPagination } from '../hooks/useUrlPagination';
import { Announcement } from '../types';

export const AnnouncementsView: React.FC = () => {
  const {
    announcements,
    addAnnouncement,
    markAnnouncementAsRead,
    activeCondominium,
    activeRole,
    currentUser,
    showToast,
  } = useApp();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Announcement['category']>('maintenance');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const isTrusteeOrAdmin = activeRole === 'trustee' || activeRole === 'admin' || activeRole === 'global_admin';

  const condoAnnouncements = announcements.filter((a) => a.condominiumId === activeCondominium.id);

  // URL-synchronized search, filter, and pagination
  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedItems: paginatedAnnouncements,
    searchQuery: search,
    activeFilter: selectedCategory,
    setPage,
    setSearch,
    setFilter: setSelectedCategory,
    setItemsPerPage,
  } = useUrlPagination<Announcement>({
    items: condoAnnouncements,
    filterFn: (a, searchQuery, category) => {
      const matchesCategory = category === 'all' || a.category === category;
      const matchesSearch =
        !searchQuery ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.authorName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    },
    defaultItemsPerPage: 5,
    pageParamKey: 'page',
    searchParamKey: 'q',
    filterParamKey: 'categoria',
    defaultFilter: 'all',
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'maintenance':
        return <Wrench className="w-4 h-4 text-blue-500" />;
      case 'security':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'event':
        return <PartyPopper className="w-4 h-4 text-purple-500" />;
      case 'rules':
        return <FileText className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const getCategoryBadgeVariant = (cat: string): any => {
    switch (cat) {
      case 'maintenance':
        return 'primary';
      case 'security':
        return 'danger';
      case 'event':
        return 'purple';
      case 'rules':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    addAnnouncement({
      condominiumId: activeCondominium.id,
      title,
      category,
      categoryLabel: category === 'important' ? 'Importante' : category === 'maintenance' ? 'Manutenção' : 'Geral',
      content,
      authorName: currentUser.name,
      authorRole: activeRole === 'trustee' ? 'Síndico Geral' : 'Administração',
      isPinned,
    });

    setTitle('');
    setContent('');
    setIsPinned(false);
    setIsNewModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header with Title & Info Help Button (?) */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {activeCondominium.name}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-500">Mural Oficial</span>
        </div>
        <div className="flex items-center gap-2.5 mt-0.5">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Comunicados & Mural de Avisos
          </h1>
          <InfoHelpButton
            title="Mural de Comunicados Oficiais"
            description="Acompanhe comunicados, avisos de manutenções programadas, alertas de segurança, eventos sociais e regras de convivência emitidos pela administração e síndico."
            tips={[
              'Avisos com etiqueta "Fixado" contêm informações permanentes ou de alta prioridade.',
              'Clique em "Confirmar Leitura" para registrar seu ciente perante a administração.',
              'Filtre por categoria para encontrar manutenções ou comunicados de segurança rapidamente.',
            ]}
          />
        </div>
      </div>

      {/* Prominent Full-Width Top Action Banner (if Trustee/Admin) */}
      {isTrusteeOrAdmin && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white rounded-2xl shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0 backdrop-blur-xs">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                Publicação de Comunicados Oficiais
              </h3>
              <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
                Envie avisos de manutenções, convocações e alertas com notificação e leitura aos moradores.
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
            Publicar Novo Comunicado
          </Button>
        </div>
      )}

      {/* Search & Category Dropdown Filter Side by Side */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar comunicados por título, autor ou palavra-chave..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
          />
        </div>

        <div className="relative min-w-[220px] sm:w-64 shrink-0">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer appearance-none shadow-2xs"
          >
            <option value="all">Todos os Avisos ({condoAnnouncements.length})</option>
            <option value="important">Importantes ({condoAnnouncements.filter((a) => a.category === 'important').length})</option>
            <option value="maintenance">Manutenções ({condoAnnouncements.filter((a) => a.category === 'maintenance').length})</option>
            <option value="convocation">Convocações ({condoAnnouncements.filter((a) => a.category === 'convocation').length})</option>
            <option value="social">Social & Convivência ({condoAnnouncements.filter((a) => a.category === 'social').length})</option>
            <option value="security">Segurança ({condoAnnouncements.filter((a) => a.category === 'security').length})</option>
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Announcements List */}
      {paginatedAnnouncements.length > 0 ? (
        <div className="space-y-4">
          {paginatedAnnouncements.map((ann) => {
            const isRead = ann.readByUserIds.includes(currentUser.id);

            return (
              <Card
                key={ann.id}
                className={`transition-all ${
                  ann.isPinned
                    ? 'border-blue-300 dark:border-blue-800 bg-gradient-to-r from-white to-blue-50/20 dark:from-slate-900 dark:to-blue-950/10'
                    : ''
                } ${!isRead ? 'ring-1 ring-blue-500/30' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                      {getCategoryIcon(ann.category)}
                    </div>

                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {ann.isPinned && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100/70 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                            <Pin className="w-3 h-3" />
                            Fixado
                          </span>
                        )}
                        <Badge variant={getCategoryBadgeVariant(ann.category)} size="sm">
                          {ann.category.toUpperCase()}
                        </Badge>
                        {!isRead && (
                          <Badge variant="purple" size="sm" dot>
                            Não lido
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {ann.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                        {ann.content}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-3 text-xs text-slate-400">
                        <span>Por: {ann.authorName}</span>
                        <span>•</span>
                        <span>
                          {new Date(ann.publishedAt).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(ann.publishedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Eye className="w-3.5 h-3.5" />
                          {ann.readByUserIds.length} leituras confirmadas
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isRead && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 self-start sm:self-auto"
                      leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      onClick={() => {
                        markAnnouncementAsRead(ann.id);
                        showToast('info', 'Leitura Confirmada', 'Aviso marcado como lido.');
                      }}
                    >
                      Confirmar Leitura
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setPage}
            onItemsPerPageChange={setItemsPerPage}
            pageSizeOptions={[5, 10, 15]}
          />
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Nenhum comunicado encontrado
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não foram encontrados comunicados correspondentes aos filtros atuais.
          </p>
          {(search || selectedCategory !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
              }}
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      )}

      {/* New Announcement Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Publicar Novo Comunicado no Mural"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Título do Comunicado *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Manutenção na rede de fibra óptica do Bloco B"
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
                <option value="maintenance">Manutenção</option>
                <option value="security">Segurança</option>
                <option value="event">Evento</option>
                <option value="rules">Regimento</option>
                <option value="general">Geral</option>
              </select>
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Fixar no topo do mural</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Conteúdo do Comunicado *
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descreva o comunicado com todos os detalhes..."
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
              leftIcon={<Bell className="w-4 h-4" />}
            >
              Publicar no Mural
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

