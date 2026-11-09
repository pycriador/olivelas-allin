import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  MapPin,
  Plus,
  ArrowLeft,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Layers,
  UtensilsCrossed,
  Sparkles,
} from 'lucide-react';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { operationsService } from '@/services/operationsService';
import { RestaurantArea } from '@/types/operations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ResponsiveTable } from '@/components/common/ResponsiveTable';
import { Modal } from '@/components/ui/modal';

const COLOR_OPTIONS: { id: string; label: string; bg: string; text: string; dot: string; border: string }[] = [
  { id: 'emerald', label: 'Verde Esmeralda', bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', border: 'border-emerald-500/30' },
  { id: 'blue', label: 'Azul Real', bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500', border: 'border-blue-500/30' },
  { id: 'amber', label: 'Âmbar / Dourado', bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', border: 'border-amber-500/30' },
  { id: 'purple', label: 'Roxo / Púrpura', bg: 'bg-purple-500/10', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500', border: 'border-purple-500/30' },
  { id: 'rose', label: 'Rosa / Carmim', bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500', border: 'border-rose-500/30' },
  { id: 'cyan', label: 'Ciano / Turquesa', bg: 'bg-cyan-500/10', text: 'text-cyan-700 dark:text-cyan-300', dot: 'bg-cyan-500', border: 'border-cyan-500/30' },
  { id: 'slate', label: 'Cinza / Neutro', bg: 'bg-slate-500/10', text: 'text-slate-700 dark:text-slate-300', dot: 'bg-slate-500', border: 'border-slate-500/30' },
];

export function TableAreasPage() {
  const navigate = useNavigate();
  const { currentRestaurant } = useRestaurant();
  const [refreshKey, setRefreshKey] = useState(0);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<RestaurantArea | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('emerald');
  const [sortOrder, setSortOrder] = useState('1');
  const [isActive, setIsActive] = useState(true);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<RestaurantArea | null>(null);

  // Fetch Areas and Tables
  const areas = useMemo(() => {
    if (!currentRestaurant) return [];
    return operationsService.getAreas(currentRestaurant.id);
  }, [currentRestaurant, refreshKey]);

  const tables = useMemo(() => {
    if (!currentRestaurant) return [];
    return operationsService.getTables(currentRestaurant.id);
  }, [currentRestaurant, refreshKey]);

  // Table counts per area
  const tableCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tables.forEach((t) => {
      counts[t.area] = (counts[t.area] || 0) + 1;
    });
    return counts;
  }, [tables]);

  // Filtered areas
  const filteredAreas = useMemo(() => {
    return areas
      .filter((a) => {
        const matchesSearch =
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.code.toLowerCase().includes(search.toLowerCase()) ||
          (a.description && a.description.toLowerCase().includes(search.toLowerCase()));

        const matchesStatus =
          statusFilter === 'all'
            ? true
            : statusFilter === 'active'
            ? a.is_active
            : !a.is_active;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [areas, search, statusFilter]);

  const handleOpenCreateModal = () => {
    setEditingArea(null);
    setName('');
    setCode('');
    setDescription('');
    setColor('emerald');
    setSortOrder(String(areas.length + 1));
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (area: RestaurantArea) => {
    setEditingArea(area);
    setName(area.name);
    setCode(area.code);
    setDescription(area.description || '');
    setColor(area.color || 'emerald');
    setSortOrder(String(area.sort_order));
    setIsActive(area.is_active);
    setIsModalOpen(true);
  };

  const handleSaveArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant) return;

    if (!name.trim()) {
      toast.error('Informe o nome do setor');
      return;
    }

    const generatedCode = code.trim()
      ? code.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')
      : name
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_');

    try {
      if (editingArea) {
        operationsService.updateArea(currentRestaurant.id, editingArea.id, {
          name: name.trim(),
          code: generatedCode,
          description: description.trim() || undefined,
          color,
          sort_order: parseInt(sortOrder, 10) || 1,
          is_active: isActive,
        });
        toast.success(`Setor "${name}" atualizado com sucesso!`);
      } else {
        operationsService.createArea(currentRestaurant.id, {
          name: name.trim(),
          code: generatedCode,
          description: description.trim() || undefined,
          color,
          sort_order: parseInt(sortOrder, 10) || areas.length + 1,
          is_active: isActive,
        });
        toast.success(`Setor "${name}" cadastrado com sucesso!`);
      }

      setIsModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar setor.');
    }
  };

  const handleToggleStatus = (area: RestaurantArea) => {
    if (!currentRestaurant) return;
    operationsService.toggleAreaStatus(currentRestaurant.id, area.id);
    toast.success(`Setor ${area.is_active ? 'desativado' : 'ativado'} com sucesso!`);
    setRefreshKey((k) => k + 1);
  };

  const handleConfirmDelete = () => {
    if (!currentRestaurant || !deleteTarget) return;

    const res = operationsService.deleteArea(currentRestaurant.id, deleteTarget.id);
    if (!res.success) {
      toast.error(res.message || 'Não foi possível excluir o setor.');
      setDeleteTarget(null);
      return;
    }

    toast.success(`Setor "${deleteTarget.name}" excluído com sucesso!`);
    setDeleteTarget(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/tables')}
            className="h-8 w-8 p-0 shrink-0"
            title="Voltar para Mesas"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Setores e Áreas do Restaurante
              </h1>
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                {areas.length} cadastrados
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Personalize os ambientes físicos do seu restaurante (salão, deck, varanda, bar, etc.) para organizar a alocação de mesas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 sm:h-8 text-xs gap-1.5"
          >
            <Link to="/app/tables">
              <UtensilsCrossed className="h-3.5 w-3.5 text-muted-foreground" />
              Ver Mapa de Mesas
            </Link>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreateModal}
            className="h-9 sm:h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Novo Setor
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Total de Ambientes
              </p>
              <p className="text-xl font-bold text-foreground">{areas.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Setores Ativos
              </p>
              <p className="text-xl font-bold text-foreground">
                {areas.filter((a) => a.is_active).length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Mesas Distribuídas
              </p>
              <p className="text-xl font-bold text-foreground">{tables.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar setor por nome, código ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-9 px-3 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Somente Ativos</option>
            <option value="inactive">Somente Inativos</option>
          </select>
        </div>
      </div>

      {/* Sectors Table wrapped in ResponsiveTable */}
      {filteredAreas.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-xl bg-card/30 space-y-3">
          <MapPin className="h-10 w-10 text-muted-foreground/60 mx-auto" />
          <h3 className="text-sm font-semibold text-foreground">Nenhum setor encontrado</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {search || statusFilter !== 'all'
              ? 'Nenhum resultado corresponde aos filtros aplicados.'
              : 'Cadastre o primeiro setor ou ambiente físico para organizar as mesas do seu restaurante.'}
          </p>
          <Button size="sm" onClick={handleOpenCreateModal} className="text-xs gap-1.5 mt-2">
            <Plus className="h-3.5 w-3.5" />
            Cadastrar Setor
          </Button>
        </div>
      ) : (
        <ResponsiveTable>
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold">
              <tr>
                <th className="px-4 py-3 w-16 text-center">Ordem</th>
                <th className="px-4 py-3">Setor / Ambiente</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Identificação Visual</th>
                <th className="px-4 py-3 text-center">Mesas Alocadas</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredAreas.map((area) => {
                const count = tableCounts[area.code] || tableCounts[area.id] || 0;
                const colorConfig = COLOR_OPTIONS.find((c) => c.id === area.color) || COLOR_OPTIONS[0];

                return (
                  <tr key={area.id} className="hover:bg-muted/20 transition-colors">
                    {/* Sort Order */}
                    <td className="px-4 py-3 text-center font-mono text-muted-foreground">
                      {area.sort_order}
                    </td>

                    {/* Name & Description */}
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-semibold text-foreground flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${colorConfig.dot}`} />
                          {area.name}
                        </span>
                        {area.description ? (
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                            {area.description}
                          </p>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/60 italic">Sem descrição</span>
                        )}
                      </div>
                    </td>

                    {/* Code */}
                    <td className="px-4 py-3">
                      <code className="text-[11px] bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground">
                        {area.code}
                      </code>
                    </td>

                    {/* Visual Color Pill */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${colorConfig.dot}`} />
                        {colorConfig.label}
                      </span>
                    </td>

                    {/* Table count */}
                    <td className="px-4 py-3 text-center">
                      <Link
                        to={`/app/tables?area=${area.code}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary transition-colors font-medium text-[11px]"
                        title="Ver mesas deste setor"
                      >
                        <UtensilsCrossed className="h-3 w-3" />
                        <span>{count} {count === 1 ? 'mesa' : 'mesas'}</span>
                      </Link>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(area)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                          area.is_active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {area.is_active ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> Ativo
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" /> Inativo
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions Menu */}
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                            Ações ▾
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 text-xs">
                          <DropdownMenuItem onClick={() => handleOpenEditModal(area)}>
                            <Edit2 className="h-3.5 w-3.5 mr-2 text-primary" />
                            Editar Setor
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => navigate(`/app/tables?area=${area.code}`)}>
                            <UtensilsCrossed className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            Ver Mesas ({count})
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handleToggleStatus(area)}>
                            {area.is_active ? (
                              <>
                                <XCircle className="h-3.5 w-3.5 mr-2 text-amber-500" />
                                Desativar Setor
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                                Ativar Setor
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(area)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Excluir Setor
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ResponsiveTable>
      )}

      {/* Modal Criar / Editar Setor */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingArea ? 'Editar Setor do Restaurante' : 'Novo Setor / Ambiente'}
        asDrawerOnMobile={true}
      >
        <form onSubmit={handleSaveArea} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="areaName" className="text-xs">
              Nome do Setor / Ambiente *
            </Label>
            <Input
              id="areaName"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!editingArea && !code) {
                  setCode(
                    e.target.value
                      .toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/[^a-z0-9]/g, '_')
                      .replace(/_+/g, '_')
                  );
                }
              }}
              placeholder="Ex: Rooftop, Terraço com Vista, Espaço Kids, Salão Superior"
              required
              className="h-9 sm:h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="areaCode" className="text-xs">
                Código Identificador *
              </Label>
              <Input
                id="areaCode"
                value={code}
                onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '_'))}
                placeholder="Ex: rooftop, deck_externo"
                required
                className="h-9 sm:h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="areaOrder" className="text-xs">
                Ordem de Exibição
              </Label>
              <Input
                id="areaOrder"
                type="number"
                min="1"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="h-9 sm:h-8 text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="areaDescription" className="text-xs">
              Descrição / Localização (Opcional)
            </Label>
            <Input
              id="areaDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Mesas ao ar livre no 2º andar com vista para o mar"
              className="h-9 sm:h-8 text-xs"
            />
          </div>

          {/* Color Tag Selection */}
          <div className="space-y-2">
            <Label className="text-xs">Etiqueta e Destaque Visual</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COLOR_OPTIONS.map((c) => {
                const isSelected = color === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs text-left transition-all ${
                      isSelected
                        ? `${c.border} ${c.bg} ring-2 ring-primary ring-offset-1`
                        : 'border-border/60 hover:bg-muted/40'
                    }`}
                  >
                    <span className={`h-3 w-3 rounded-full shrink-0 ${c.dot}`} />
                    <span className="truncate font-medium">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <input
              type="checkbox"
              id="areaIsActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            <Label htmlFor="areaIsActive" className="text-xs cursor-pointer">
              Setor ativo para alocação de mesas
            </Label>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="w-full sm:w-auto h-11 sm:h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="w-full sm:w-auto h-11 sm:h-8 text-xs">
              {editingArea ? 'Salvar Alterações' : 'Cadastrar Setor'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirm Delete */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Excluir Setor"
        asDrawerOnMobile={true}
      >
        <div className="space-y-4">
          <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <Trash2 className="h-5 w-5" />
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Deseja realmente excluir o setor{' '}
              <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>?
            </p>
            {deleteTarget && (tableCounts[deleteTarget.code] || tableCounts[deleteTarget.id] || 0) > 0 ? (
              <p className="text-xs text-amber-500 font-medium mt-2 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                Atenção: Existem {tableCounts[deleteTarget.code] || tableCounts[deleteTarget.id]} mesa(s) vinculadas a este setor. A exclusão será bloqueada enquanto houver mesas associadas.
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground/70 mt-1">
                Esta ação removerá o ambiente da lista de setores disponíveis.
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              className="w-full sm:w-auto h-11 sm:h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              className="w-full sm:w-auto h-11 sm:h-8 text-xs"
            >
              Confirmar Exclusão
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
