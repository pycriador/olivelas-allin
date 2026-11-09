import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  Sliders,
  Clock,
  DollarSign,
  Users,
  CheckCircle2,
  Edit2,
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

export const ResourcesConfigView: React.FC = () => {
  const { resources, activeCondominium, showToast } = useApp();
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const condoResources = resources.filter((r) => r.condominiumId === activeCondominium.id);

  const filteredResources = condoResources.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());

    const matchesType =
      filterType === 'all' ||
      (filterType === 'paid' && r.fee > 0) ||
      (filterType === 'free' && r.fee === 0) ||
      (filterType === 'cleaning' && !!r.cleaningFee && r.cleaningFee > 0);

    return matchesSearch && matchesType;
  });

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('success', 'Regras Salvas', `Configurações de "${editingResource?.name}" atualizadas.`);
    setEditingResource(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {activeCondominium.name}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-500">Parâmetros de Lazer</span>
        </div>
        <div className="flex items-center gap-2.5 mt-0.5">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Configuração de Espaços & Regras de Reserva
          </h1>
          <InfoHelpButton
            title="Configuração de Espaços Comuns"
            description="Defina valores, horários e condições de uso para as áreas comuns do condomínio."
            tips={[
              'Taxas de locação e limpeza são computadas automaticamente no momento da reserva.',
              'Alterações de regras se aplicam apenas aos novos agendamentos.',
            ]}
          />
        </div>
      </div>

      {/* Prominent Full-Width Top Action Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-teal-600 via-emerald-700 to-slate-800 text-white rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0 backdrop-blur-xs">
            <Sliders className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
              Parâmetros Operacionais de Espaços
            </h3>
            <p className="text-xs sm:text-sm text-teal-100 mt-0.5">
              Defina taxas de locação, taxa de limpeza, capacidade máxima e horários de funcionamento.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold bg-white/10 px-3.5 py-2 rounded-xl border border-white/15 shrink-0 self-start sm:self-auto">
          <Settings className="w-4 h-4 text-teal-200" />
          <span>{condoResources.length} Espaços Ativos</span>
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
            placeholder="Buscar por nome do espaço ou detalhes..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
          />
        </div>

        <div className="relative min-w-[200px] sm:w-60 shrink-0">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer appearance-none shadow-2xs"
          >
            <option value="all">Todos os Espaços ({condoResources.length})</option>
            <option value="paid">Com Taxa de Uso ({condoResources.filter((r) => r.fee > 0).length})</option>
            <option value="free">Gratuitos ({condoResources.filter((r) => r.fee === 0).length})</option>
            <option value="cleaning">Com Taxa de Limpeza ({condoResources.filter((r) => !!r.cleaningFee && r.cleaningFee > 0).length})</option>
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="space-y-4">
        {filteredResources.map((res) => (
          <Card key={res.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={res.imageUrl}
                alt={res.name}
                className="w-16 h-16 rounded-xl object-cover"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{res.name}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                  <span>Capacidade: {res.capacity} pessoas</span>
                  <span>•</span>
                  <span>Horário: {res.operatingHours.start} às {res.operatingHours.end}</span>
                  <span>•</span>
                  <span>Taxa: R$ {res.fee.toFixed(2).replace('.', ',')}</span>
                  {res.cleaningFee && (
                    <>
                      <span>•</span>
                      <span>Limpeza: R$ {res.cleaningFee.toFixed(2).replace('.', ',')}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              onClick={() => setEditingResource(res)}
            >
              Editar Regras
            </Button>
          </Card>
        ))}
      </div>

      {/* Edit Resource Modal */}
      {editingResource && (
        <Modal
          isOpen={!!editingResource}
          onClose={() => setEditingResource(null)}
          title={`Editar Parâmetros: ${editingResource.name}`}
          maxWidth="lg"
        >
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Taxa de Locação (R$)
                </label>
                <input
                  type="number"
                  defaultValue={editingResource.fee}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Taxa de Limpeza Obrigatória (R$)
                </label>
                <input
                  type="number"
                  defaultValue={editingResource.cleaningFee || 0}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Capacidade Máxima (Pessoas)
                </label>
                <input
                  type="number"
                  defaultValue={editingResource.capacity}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Antecedência Máxima (Dias)
                </label>
                <input
                  type="number"
                  defaultValue={editingResource.maxAdvanceDays}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingResource(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Salvar Parâmetros
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
