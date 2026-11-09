import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users2,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  Vote,
  Download,
  Building,
  ChevronRight,
  Search,
  Inbox,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { InfoHelpButton } from '../components/ui/InfoHelpButton';
import { useUrlPagination } from '../hooks/useUrlPagination';
import { Assembly, AssemblyVotingItem } from '../types';

export const AssembliesView: React.FC = () => {
  const {
    assemblies,
    voteOnAssembly,
    activeCondominium,
    currentUser,
    activeMembership,
    activeRole,
    showToast,
  } = useApp();

  const [selectedAssembly, setSelectedAssembly] = useState<Assembly | null>(null);
  const [selectedVotingItem, setSelectedVotingItem] = useState<AssemblyVotingItem | null>(null);
  const [userSelection, setUserSelection] = useState<'yes' | 'no' | 'abstain' | null>(null);

  const condoAssemblies = assemblies.filter((a) => a.condominiumId === activeCondominium.id);

  // URL-synchronized search, filter, and pagination
  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedItems: paginatedAssemblies,
    searchQuery: search,
    activeFilter: filterStatus,
    setPage,
    setSearch,
    setFilter: setFilterStatus,
    setItemsPerPage,
  } = useUrlPagination<Assembly>({
    items: condoAssemblies,
    filterFn: (a, searchQuery, status) => {
      const matchesFilter =
        status === 'all' ||
        (status === 'scheduled' && a.status === 'scheduled') ||
        (status === 'concluded' && a.status === 'concluded') ||
        (status === 'ordinary' && a.type === 'ordinary') ||
        (status === 'extraordinary' && a.type === 'extraordinary');

      const matchesSearch =
        !searchQuery ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.agendaPoints.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
        a.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.votingItems.some((v) =>
          v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.description.toLowerCase().includes(searchQuery.toLowerCase())
        );

      return matchesFilter && matchesSearch;
    },
    defaultItemsPerPage: 4,
    pageParamKey: 'page',
    searchParamKey: 'q',
    filterParamKey: 'status',
    defaultFilter: 'all',
  });

  const handleVoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssembly || !selectedVotingItem || !userSelection) return;

    voteOnAssembly(selectedAssembly.id, selectedVotingItem.id, userSelection);

    // Update local modal state
    const updatedVotingItems = selectedAssembly.votingItems.map((item) => {
      if (item.id === selectedVotingItem.id) {
        return {
          ...item,
          [userSelection === 'yes' ? 'votesYes' : userSelection === 'no' ? 'votesNo' : 'votesAbstain']:
            item[userSelection === 'yes' ? 'votesYes' : userSelection === 'no' ? 'votesNo' : 'votesAbstain'] + 1,
          userVote: userSelection,
        };
      }
      return item;
    });

    setSelectedAssembly({
      ...selectedAssembly,
      votingItems: updatedVotingItems,
    });

    setSelectedVotingItem(null);
    setUserSelection(null);
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
          <span className="text-xs text-slate-500">Governança Condominial</span>
        </div>
        <div className="flex items-center gap-2.5 mt-0.5">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Assembleias & Votação Virtual
          </h1>
          <InfoHelpButton
            title="Assembleias & Votação Virtual"
            description="Participe das deliberações oficiais, vote nas pautas e consulte o edital de convocação com validade jurídica."
            tips={[
              'Seu voto é registrado individualmente com chave criptográfica vinculada à fração ideal de sua unidade.',
              'Você pode baixar o edital de convocação em PDF para conferir a pauta detalhada e as regras da assembleia.',
              'Acompanhe o quórum de participação em tempo real.',
            ]}
          />
        </div>
      </div>

      {/* Prominent Full-Width Top Governance Info Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-800 text-white rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0 backdrop-blur-xs">
            <Vote className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
              Governança Digital & Votação Segura
            </h3>
            <p className="text-xs sm:text-sm text-purple-100 mt-0.5">
              Participe das deliberações com validade jurídica, consulte editais em PDF e exerça seu voto por unidade.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold bg-white/10 px-3.5 py-2 rounded-xl border border-white/15 shrink-0 self-start sm:self-auto">
          <Building className="w-4 h-4 text-purple-200" />
          <span>Fração Ideal Ativa</span>
        </div>
      </div>

      {/* Search & Filter Dropdown Side by Side */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar assembleias, pautas ou palavras-chave..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
          />
        </div>

        <div className="relative min-w-[220px] sm:w-64 shrink-0">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer appearance-none shadow-2xs"
          >
            <option value="all">Todas as Assembleias ({condoAssemblies.length})</option>
            <option value="scheduled">Convocação Ativa ({condoAssemblies.filter((a) => a.status === 'scheduled').length})</option>
            <option value="concluded">Encerradas ({condoAssemblies.filter((a) => a.status === 'concluded').length})</option>
            <option value="ordinary">Ordinárias (AGO) ({condoAssemblies.filter((a) => a.type === 'ordinary').length})</option>
            <option value="extraordinary">Extraordinárias (AGE) ({condoAssemblies.filter((a) => a.type === 'extraordinary').length})</option>
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Assemblies List */}
      {paginatedAssemblies.length > 0 ? (
        <div className="space-y-4">
          {paginatedAssemblies.map((asm) => (
            <Card
              key={asm.id}
              className="border-purple-200 dark:border-purple-900/60 bg-gradient-to-r from-white to-purple-50/20 dark:from-slate-900 dark:to-purple-950/10"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={asm.status === 'scheduled' ? 'warning' : 'neutral'} dot>
                      {asm.status === 'scheduled' ? 'Convocação Ativa' : 'Encerrada'}
                    </Badge>
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                      {asm.type === 'ordinary' ? 'Assembleia Geral Ordinária (AGO)' : 'Assembleia Extraordinária (AGE)'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {asm.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(asm.date).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {asm.time}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{asm.location}</span>
                  </div>

                  {/* Quorum indicator */}
                  <div className="max-w-md pt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Quórum de Participação Registrado:</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {asm.currentQuorumPercent}% das frações ideais
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full transition-all duration-500"
                        style={{ width: `${asm.currentQuorumPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
                  <Button
                    variant="primary"
                    size="md"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    leftIcon={<Vote className="w-4 h-4" />}
                    onClick={() => setSelectedAssembly(asm)}
                  >
                    Abrir Cédula de Votação
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="w-4 h-4" />}
                    onClick={() =>
                      showToast('success', 'Download Iniciado', 'Edital_Convocacao_AGO_2026.pdf baixado.')
                    }
                  >
                    Edital em PDF
                  </Button>
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
            pageSizeOptions={[4, 8, 12]}
          />
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Nenhuma assembleia encontrada
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não foram encontradas assembleias correspondentes aos critérios de busca ou filtros selecionados.
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

      {/* Assembly Details & Interactive Voting Modal */}
      {selectedAssembly && (
        <Modal
          isOpen={!!selectedAssembly}
          onClose={() => setSelectedAssembly(null)}
          title="Cédula de Deliberação Eletrônica"
          size="lg"
        >
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Badge variant="purple" size="sm">Votação Oficial</Badge>
                <span className="text-xs text-slate-500">Unidade: {activeMembership?.unitNumber || '101'}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {selectedAssembly.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Seu voto é registrado individualmente com chave criptográfica vinculada à fração ideal de sua unidade.
              </p>
            </div>

            {/* Voting Items */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Pautas em Votação
              </h4>

              {selectedAssembly.votingItems.map((item) => {
                const totalVotes = item.votesYes + item.votesNo + item.votesAbstain;
                const yesPct = totalVotes > 0 ? Math.round((item.votesYes / totalVotes) * 100) : 0;
                const noPct = totalVotes > 0 ? Math.round((item.votesNo / totalVotes) * 100) : 0;
                const absPct = totalVotes > 0 ? Math.round((item.votesAbstain / totalVotes) * 100) : 0;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h5>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          {item.description}
                        </p>
                      </div>

                      {item.userVote ? (
                        <Badge variant="success" size="sm">
                          Voto Registrado: {item.userVote.toUpperCase()}
                        </Badge>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSelectedVotingItem(item)}
                        >
                          Votar
                        </Button>
                      )}
                    </div>

                    {/* Live Results Bar */}
                    <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span className="text-emerald-600 font-semibold">A Favor: {item.votesYes} ({yesPct}%)</span>
                        <span className="text-rose-600 font-semibold">Contra: {item.votesNo} ({noPct}%)</span>
                        <span className="text-slate-400">Abstenção: {item.votesAbstain} ({absPct}%)</span>
                      </div>

                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                        <div style={{ width: `${yesPct}%` }} className="bg-emerald-500 h-full" />
                        <div style={{ width: `${noPct}%` }} className="bg-rose-500 h-full" />
                        <div style={{ width: `${absPct}%` }} className="bg-slate-400 h-full" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}

      {/* Cast Vote Choice Modal */}
      {selectedVotingItem && (
        <Modal
          isOpen={!!selectedVotingItem}
          onClose={() => setSelectedVotingItem(null)}
          title="Confirmar Registro de Voto"
          size="md"
        >
          <form onSubmit={handleVoteSubmit} className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Você está votando como titular da <span className="font-bold">Unidade {activeMembership?.unitNumber || '101'}</span> na pauta:
            </p>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 p-3 rounded-xl">
              {selectedVotingItem.title}
            </h4>

            <div className="space-y-2 pt-2">
              <label
                onClick={() => setUserSelection('yes')}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                  userSelection === 'yes'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="text-xs font-bold">Sim / A Favor da Aprovação</span>
                <input type="radio" name="vote" checked={userSelection === 'yes'} onChange={() => {}} />
              </label>

              <label
                onClick={() => setUserSelection('no')}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                  userSelection === 'no'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="text-xs font-bold">Não / Contra a Aprovação</span>
                <input type="radio" name="vote" checked={userSelection === 'no'} onChange={() => {}} />
              </label>

              <label
                onClick={() => setUserSelection('abstain')}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                  userSelection === 'abstain'
                    ? 'border-slate-500 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white ring-2 ring-slate-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="text-xs font-bold">Abstenção</span>
                <input type="radio" name="vote" checked={userSelection === 'abstain'} onChange={() => {}} />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedVotingItem(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!userSelection}
              >
                Confirmar Voto
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
