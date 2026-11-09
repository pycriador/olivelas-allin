import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  AlertTriangle,
  PlusCircle,
  Camera,
  Shield,
  EyeOff,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  Image as ImageIcon,
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
import { Occurrence } from '../types';

export const OccurrencesView: React.FC = () => {
  const {
    occurrences,
    addOccurrence,
    updateOccurrenceStatus,
    activeCondominium,
    currentUser,
    activeMembership,
    activeRole,
    showToast,
  } = useApp();

  const [selectedOccurrence, setSelectedOccurrence] = useState<Occurrence | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [resolutionText, setResolutionText] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Occurrence['category']>('noise');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isConfidential, setIsConfidential] = useState(false);
  const [selectedMockPhoto, setSelectedMockPhoto] = useState(false);

  const isTrusteeOrAdmin = activeRole === 'trustee' || activeRole === 'admin' || activeRole === 'global_admin';

  const condoOccurrences = occurrences.filter((o) => o.condominiumId === activeCondominium.id);

  // URL-synchronized search, filter, and pagination
  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedItems: paginatedOccurrences,
    searchQuery: search,
    activeFilter: selectedCategory,
    setPage,
    setSearch,
    setFilter: setSelectedCategory,
    setItemsPerPage,
  } = useUrlPagination<Occurrence>({
    items: condoOccurrences,
    filterFn: (o, searchQuery, category) => {
      const matchesCategory = category === 'all' || o.category === category;
      const matchesSearch =
        !searchQuery ||
        o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.userUnit.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    },
    defaultItemsPerPage: 5,
    pageParamKey: 'page',
    searchParamKey: 'q',
    filterParamKey: 'categoria',
    defaultFilter: 'all',
  });

  const getStatusBadge = (status: Occurrence['status']) => {
    switch (status) {
      case 'open':
        return <Badge variant="danger" size="sm" dot>Aberta</Badge>;
      case 'in_review':
        return <Badge variant="warning" size="sm" dot>Em Averiguação</Badge>;
      case 'in_progress':
        return <Badge variant="primary" size="sm" dot>Em Tratamento</Badge>;
      case 'resolved':
        return <Badge variant="success" size="sm" dot>Solucionada</Badge>;
      case 'archived':
        return <Badge variant="neutral" size="sm">Arquivada</Badge>;
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    addOccurrence({
      condominiumId: activeCondominium.id,
      userId: currentUser.id,
      userName: isConfidential ? 'Morador Sob Sigilo' : currentUser.name,
      userUnit: isConfidential ? 'Sigiloso' : (activeMembership?.unitNumber ? `Apt ${activeMembership.unitNumber}` : 'Apt 101'),
      title,
      category,
      description,
      location: location || 'Área Comum',
      status: 'open',
      photos: selectedMockPhoto
        ? ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80']
        : [],
    });

    setTitle('');
    setLocation('');
    setDescription('');
    setIsConfidential(false);
    setSelectedMockPhoto(false);
    setIsNewModalOpen(false);
  };

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOccurrence || !resolutionText.trim()) return;

    updateOccurrenceStatus(selectedOccurrence.id, 'resolved', resolutionText);
    setSelectedOccurrence(null);
    setResolutionText('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header with Info Help Button (?) */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {activeCondominium.name}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-500">Livro de Ocorrências Digital</span>
        </div>
        <div className="flex items-center gap-2.5 mt-0.5">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Registro de Ocorrências
          </h1>
          <InfoHelpButton
            title="Livro de Ocorrências Digital"
            description="Registre ocorrências com validade jurídica perante a administração e corpo diretivo do condomínio, como infrações às normas do regimento, perturbação de sossego, vazamentos ou avarias em áreas comuns."
            tips={[
              'Você pode ativar a opção de sigilo para que apenas o Síndico e a Administradora saibam a autoria do relato.',
              'Anexe fotos ou comprovantes para subsidiar vistorias e eventuais notificações.',
              'Acompanhe o parecer formal do síndico diretamente na página do registro.',
            ]}
          />
        </div>
      </div>

      {/* Prominent Full-Width Top Action Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-rose-600 via-rose-700 to-red-700 text-white rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0 backdrop-blur-xs">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
              Deseja registrar um relato no Livro de Ocorrências?
            </h3>
            <p className="text-xs sm:text-sm text-rose-100 mt-0.5">
              Registre perturbação de sossego, vazamentos, avarias ou infrações com fotos e opção de sigilo.
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="md"
          className="bg-white text-rose-700 hover:bg-rose-50 border-0 font-bold shadow-sm whitespace-nowrap shrink-0 self-stretch sm:self-auto justify-center"
          leftIcon={<PlusCircle className="w-4 h-4 text-rose-700" />}
          rightIcon={<ArrowRight className="w-4 h-4 text-rose-700 hidden sm:inline" />}
          onClick={() => setIsNewModalOpen(true)}
        >
          Registrar Nova Ocorrência
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
            placeholder="Pesquisar por título, local, descrição ou unidade..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs"
          />
        </div>

        <div className="relative min-w-[220px] sm:w-64 shrink-0">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer appearance-none shadow-2xs"
          >
            <option value="all">Todas as Ocorrências ({condoOccurrences.length})</option>
            <option value="noise">Perturbação do Silêncio ({condoOccurrences.filter((o) => o.category === 'noise').length})</option>
            <option value="leak">Vazamento / Infiltração ({condoOccurrences.filter((o) => o.category === 'leak').length})</option>
            <option value="lighting">Iluminação ({condoOccurrences.filter((o) => o.category === 'lighting').length})</option>
            <option value="cleanliness">Limpeza & Conservação ({condoOccurrences.filter((o) => o.category === 'cleanliness').length})</option>
            <option value="security">Segurança ({condoOccurrences.filter((o) => o.category === 'security').length})</option>
            <option value="pet">Pets & Animais ({condoOccurrences.filter((o) => o.category === 'pet').length})</option>
            <option value="other">Outros Fatos ({condoOccurrences.filter((o) => o.category === 'other').length})</option>
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Occurrences List */}
      {paginatedOccurrences.length > 0 ? (
        <div className="space-y-4">
          {paginatedOccurrences.map((occ) => (
            <Card
              key={occ.id}
              hoverable
              onClick={() => setSelectedOccurrence(occ)}
              className="cursor-pointer"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(occ.status)}
                    <span className="text-xs text-slate-500 font-medium">
                      {occ.userName} ({occ.userUnit})
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-xs text-slate-500">Local: {occ.location}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {occ.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                    {occ.description}
                  </p>

                  {occ.photos && occ.photos.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                        <Camera className="w-3.5 h-3.5" />
                        {occ.photos.length} foto(s) anexada(s)
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-right text-xs text-slate-400 shrink-0 self-end sm:self-start">
                  <p>{new Date(occ.createdAt).toLocaleDateString('pt-BR')}</p>
                  <span className="text-blue-600 dark:text-blue-400 font-bold block mt-1">
                    Ver Detalhes →
                  </span>
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
            pageSizeOptions={[5, 10, 15]}
          />
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Nenhuma ocorrência encontrada
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não foram encontradas ocorrências com os critérios de busca e filtro atuais.
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

      {/* Details & Resolution Modal */}
      {selectedOccurrence && (
        <Modal
          isOpen={!!selectedOccurrence}
          onClose={() => setSelectedOccurrence(null)}
          title="Detalhes da Ocorrência"
          size="lg"
        >
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedOccurrence.title}
                </h3>
                {getStatusBadge(selectedOccurrence.status)}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {selectedOccurrence.description}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                <span>Local: {selectedOccurrence.location}</span>
                <span>{selectedOccurrence.userName} ({selectedOccurrence.userUnit})</span>
              </div>
            </div>

            {/* Photos */}
            {selectedOccurrence.photos && selectedOccurrence.photos.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Registro Fotográfico Anexo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedOccurrence.photos.map((photo, i) => (
                    <img
                      key={i}
                      src={photo}
                      alt="Ocorrência"
                      className="w-full h-40 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                      referrerPolicy="no-referrer"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Resolution Form if Trustee / Admin */}
            {isTrusteeOrAdmin && selectedOccurrence.status !== 'resolved' && (
              <form onSubmit={handleResolve} className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Parecer do Síndico / Resolução da Ocorrência
                </label>
                <textarea
                  rows={3}
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Descreva a advertência aplicada, contato com o morador ou ação corretiva realizada..."
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Concluir & Notificar Envolvidos
                </Button>
              </form>
            )}
          </div>
        </Modal>
      )}

      {/* New Occurrence Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Registrar Ocorrência no Livro Digital"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Título da Ocorrência *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Barulho excessivo após as 22h no Bloco A"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Ocorrência *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="noise">Perturbação do Silêncio</option>
                <option value="leak">Vazamento / Infiltração</option>
                <option value="lighting">Iluminação Queimada</option>
                <option value="cleanliness">Limpeza / Conservação</option>
                <option value="security">Segurança & Portaria</option>
                <option value="pet">Animais / Pets</option>
                <option value="other">Outros Fatos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Local do Fato *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Garagem G1 / Apto 402"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Relato dos Fatos *
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o ocorrido com clareza..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Attach photo mockup */}
          <div
            onClick={() => setSelectedMockPhoto(!selectedMockPhoto)}
            className={`p-3.5 rounded-xl border-2 border-dashed transition-colors flex items-center justify-between cursor-pointer ${
              selectedMockPhoto
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {selectedMockPhoto ? 'Foto anexada com sucesso (foto_evidencia.jpg)' : 'Anexar Foto de Evidência'}
                </p>
                <p className="text-[11px] text-slate-500">Clique para alternar anexo</p>
              </div>
            </div>
            {selectedMockPhoto && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
          </div>

          {/* Confidentiality Toggle */}
          <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-purple-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-purple-900 dark:text-purple-200">
                  Manter meu nome sob sigilo
                </p>
                <p className="text-[11px] text-purple-700 dark:text-purple-300">
                  Visível apenas para o Síndico e Administradora. Vizinhos não verão sua unidade.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isConfidential}
              onChange={(e) => setIsConfidential(e.target.checked)}
              className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500"
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
              className="bg-rose-600 hover:bg-rose-700 text-white"
              leftIcon={<AlertTriangle className="w-4 h-4" />}
            >
              Protocolar Ocorrência
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

