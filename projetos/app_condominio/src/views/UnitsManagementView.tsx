import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building,
  Users,
  Search,
  PlusCircle,
  Mail,
  Phone,
  Shield,
  KeyRound,
  CheckCircle2,
  Filter,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { InfoHelpButton } from '../components/ui/InfoHelpButton';

export const UnitsManagementView: React.FC = () => {
  const { activeCondominium, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [filterBlock, setFilterBlock] = useState('all');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteUnit, setInviteUnit] = useState('102');

  const mockUnits = [
    { id: 'u-1', unit: '101', block: 'Bloco A', resident: 'Willian Silva', email: 'willian.silva@exemplo.com', status: 'active', role: 'Morador & Síndico', fraction: '0.0104' },
    { id: 'u-2', unit: '102', block: 'Bloco A', resident: 'Mariana Costa', email: 'mariana.costa@exemplo.com', status: 'active', role: 'Morador', fraction: '0.0104' },
    { id: 'u-3', unit: '103', block: 'Bloco A', resident: 'Roberto Almeida', email: 'roberto.a@exemplo.com', status: 'pending', role: 'Proprietário', fraction: '0.0104' },
    { id: 'u-4', unit: '201', block: 'Bloco A', resident: 'Juliana Paes', email: 'juliana.p@exemplo.com', status: 'active', role: 'Inquilino', fraction: '0.0104' },
    { id: 'u-5', unit: '202', block: 'Bloco A', resident: 'Lucas Ferreira', email: 'lucas.f@exemplo.com', status: 'active', role: 'Morador', fraction: '0.0104' },
    { id: 'u-6', unit: '101', block: 'Bloco B', resident: 'Fernanda Lima', email: 'fernanda.l@exemplo.com', status: 'active', role: 'Morador', fraction: '0.0104' },
  ];

  const filtered = mockUnits.filter((u) => {
    const matchesSearch =
      u.unit.includes(search) ||
      u.resident.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());

    const matchesBlock =
      filterBlock === 'all' ||
      (filterBlock === 'Bloco A' && u.block === 'Bloco A') ||
      (filterBlock === 'Bloco B' && u.block === 'Bloco B') ||
      (filterBlock === 'active' && u.status === 'active') ||
      (filterBlock === 'pending' && u.status === 'pending');

    return matchesSearch && matchesBlock;
  });

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('success', 'Convite Enviado', `E-mail de acesso enviado para ${inviteEmail} (Unidade ${inviteUnit}).`);
    setInviteEmail('');
    setIsInviteModalOpen(false);
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
          <span className="text-xs text-slate-500">Cadastro de Unidades</span>
        </div>
        <div className="flex items-center gap-2.5 mt-0.5">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Gestão de Unidades & Moradores
          </h1>
          <InfoHelpButton
            title="Gestão de Unidades & Moradores"
            description="Cadastre proprietários e inquilinos, configure frações ideais de cálculo condominial e gerencie permissões de acesso e convites."
            tips={[
              'Frações ideais determinam o peso do voto em assembleias e rateios orçamentários.',
              'Dispare convites individuais por e-mail para acesso instantâneo ao portal.',
            ]}
          />
        </div>
      </div>

      {/* Prominent Full-Width Top Action Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-blue-600 via-indigo-700 to-slate-800 text-white rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0 backdrop-blur-xs">
            <Building className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
              Gerencie moradores, inquilinos e frações ideais
            </h3>
            <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
              Envie convites de acesso com liberação de permissões no portal do morador.
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="md"
          className="bg-white text-blue-700 hover:bg-blue-50 border-0 font-bold shadow-sm whitespace-nowrap shrink-0 self-stretch sm:self-auto justify-center"
          leftIcon={<PlusCircle className="w-4 h-4 text-blue-700" />}
          rightIcon={<ArrowRight className="w-4 h-4 text-blue-700 hidden sm:inline" />}
          onClick={() => setIsInviteModalOpen(true)}
        >
          Convidar Novo Morador
        </Button>
      </div>

      {/* Search & Filter Dropdown Side by Side */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por unidade, nome do morador ou e-mail..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
          />
        </div>

        <div className="relative min-w-[200px] sm:w-56 shrink-0">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={filterBlock}
            onChange={(e) => setFilterBlock(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer appearance-none shadow-2xs"
          >
            <option value="all">Todas as Unidades ({mockUnits.length})</option>
            <option value="Bloco A">Bloco A ({mockUnits.filter((u) => u.block === 'Bloco A').length})</option>
            <option value="Bloco B">Bloco B ({mockUnits.filter((u) => u.block === 'Bloco B').length})</option>
            <option value="active">Acesso Ativo ({mockUnits.filter((u) => u.status === 'active').length})</option>
            <option value="pending">Convite Pendente ({mockUnits.filter((u) => u.status === 'pending').length})</option>
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <Card padding="none" className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-700 dark:text-slate-300">
              <th className="p-4">Unidade / Bloco</th>
              <th className="p-4">Morador Responsável</th>
              <th className="p-4">Perfil</th>
              <th className="p-4">Fração Ideal</th>
              <th className="p-4">Status de Acesso</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td className="p-4 font-bold text-slate-900 dark:text-white">
                  Apt {item.unit} ({item.block})
                </td>
                <td className="p-4">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{item.resident}</p>
                  <p className="text-[11px] text-slate-400">{item.email}</p>
                </td>
                <td className="p-4">
                  <Badge variant="neutral" size="sm">{item.role}</Badge>
                </td>
                <td className="p-4 font-mono text-slate-500">{item.fraction}</td>
                <td className="p-4">
                  <Badge variant={item.status === 'active' ? 'success' : 'warning'} size="sm" dot>
                    {item.status === 'active' ? 'Ativo no App' : 'Convite Pendente'}
                  </Badge>
                </td>
                <td className="p-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => showToast('info', 'Reenviado', `Link de acesso reenviado para ${item.email}.`)}
                  >
                    Reenviar Acesso
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Convidar Morador para o Condomínio"
        maxWidth="md"
      >
        <form onSubmit={handleSendInvite} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Unidade Destino
            </label>
            <input
              type="text"
              value={inviteUnit}
              onChange={(e) => setInviteUnit(e.target.value)}
              placeholder="Ex: 102 - Bloco A"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              E-mail do Morador
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="morador@exemplo.com"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsInviteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={<Mail className="w-4 h-4" />}
            >
              Enviar Convite com Link Mágico
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
