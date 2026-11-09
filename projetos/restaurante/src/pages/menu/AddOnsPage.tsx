import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Layers,
  Plus,
  Search,
  Eye,
  Trash2,
  Loader2,
  Tag,
  ChevronDown,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useAuth } from '@/hooks/useAuth';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { menuService } from '@/services/menuService';
import type { AddOnGroup, AddOn } from '@/types/menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PaginationControl } from '@/components/common/PaginationControl';
import { formatCurrency } from '@/utils/format';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AddOnsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentRestaurant, can } = useRestaurant();
  const { user } = useAuth();

  const activeTab = searchParams.get('tab') === 'items' ? 'items' : 'groups';

  const {
    page,
    pageSize,
    search,
    status,
    setFilter,
    setPage,
    setPageSize,
  } = useUrlFilters({ defaultPageSize: 10 });

  const [groups, setGroups] = useState<AddOnGroup[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [totalAddOns, setTotalAddOns] = useState(0);
  const [loading, setLoading] = useState(true);

  // Group Create Modal
  const isCreateGroupOpen = searchParams.get('modal') === 'new-group';
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newMinSelections, setNewMinSelections] = useState<number>(0);
  const [newMaxSelections, setNewMaxSelections] = useState<number>(1);
  const [newGroupRequired, setNewGroupRequired] = useState(false);
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);

  // AddOn Item Create Modal
  const isCreateItemOpen = searchParams.get('modal') === 'new-item';
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState<string>('0.00');
  const [newItemAvailable, setNewItemAvailable] = useState(true);
  const [newItemGroups, setNewItemGroups] = useState<string[]>([]);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  // Delete modals
  const [deleteGroup, setDeleteGroup] = useState<AddOnGroup | null>(null);
  const [deleteItem, setDeleteItem] = useState<AddOn | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManage = can('products.create') || can('restaurant_admin');

  const loadData = useCallback(async () => {
    if (!currentRestaurant) return;
    setLoading(true);
    try {
      const [groupsData, addonsData] = await Promise.all([
        menuService.getAddOnGroups(currentRestaurant.id),
        menuService.getAddOns(currentRestaurant.id, {
          search,
          status,
          page,
          pageSize,
        }),
      ]);
      setGroups(groupsData);
      setAddOns(addonsData.data);
      setTotalAddOns(addonsData.total);
    } catch {
      toast.error('Erro ao carregar adicionais.');
    } finally {
      setLoading(false);
    }
  }, [currentRestaurant, search, status, page, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (tab: 'groups' | 'items') => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      next.set('page', '1');
      return next;
    });
  };

  // Group Create Submission
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant || !newGroupName.trim()) {
      toast.error('O nome do grupo é obrigatório.');
      return;
    }

    if (newMinSelections > newMaxSelections) {
      toast.error('O mínimo de seleções não pode ser maior que o máximo.');
      return;
    }

    setIsSubmittingGroup(true);
    try {
      const res = await menuService.createAddOnGroup(
        currentRestaurant.id,
        {
          name: newGroupName.trim(),
          description: newGroupDesc.trim() || null,
          min_selections: newMinSelections,
          max_selections: newMaxSelections,
          required: newGroupRequired || newMinSelections >= 1,
        },
        user?.id
      );

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Grupo de adicionais criado com sucesso!');
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete('modal');
          return next;
        });
        setNewGroupName('');
        setNewGroupDesc('');
        setNewMinSelections(0);
        setNewMaxSelections(1);
        setNewGroupRequired(false);
        loadData();
      }
    } catch {
      toast.error('Erro ao criar grupo.');
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  // Add-on Item Create Submission
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant || !newItemName.trim()) {
      toast.error('O nome do adicional é obrigatório.');
      return;
    }

    setIsSubmittingItem(true);
    try {
      const res = await menuService.createAddOn(
        currentRestaurant.id,
        {
          name: newItemName.trim(),
          description: newItemDesc.trim() || null,
          price: parseFloat(newItemPrice) || 0,
          available: newItemAvailable,
          status: 'active',
        },
        newItemGroups,
        user?.id
      );

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Adicional criado com sucesso!');
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete('modal');
          return next;
        });
        setNewItemName('');
        setNewItemDesc('');
        setNewItemPrice('0.00');
        setNewItemAvailable(true);
        setNewItemGroups([]);
        loadData();
      }
    } catch {
      toast.error('Erro ao criar adicional.');
    } finally {
      setIsSubmittingItem(false);
    }
  };

  // Toggle item availability
  const handleToggleItemAvailability = async (item: AddOn) => {
    if (!canManage) return;
    const nextAvail = !item.available;
    try {
      const res = await menuService.updateAddOn(item.id, { available: nextAvail }, undefined, user?.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Adicional marcado como ${nextAvail ? 'disponível' : 'indisponível'}.`);
        setAddOns((prev) =>
          prev.map((a) => (a.id === item.id ? { ...a, available: nextAvail } : a))
        );
      }
    } catch {
      toast.error('Erro ao atualizar disponibilidade.');
    }
  };

  // Confirm delete group
  const handleConfirmDeleteGroup = async () => {
    if (!deleteGroup) return;
    setIsDeleting(true);
    try {
      const res = await menuService.deleteAddOnGroup(deleteGroup.id, user?.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Grupo de adicionais excluído com sucesso.');
        setDeleteGroup(null);
        loadData();
      }
    } catch {
      toast.error('Erro ao excluir grupo.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Confirm delete item
  const handleConfirmDeleteItem = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      const res = await menuService.deleteAddOn(deleteItem.id, user?.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Adicional excluído com sucesso.');
        setDeleteItem(null);
        loadData();
      }
    } catch {
      toast.error('Erro ao excluir adicional.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/app/menu"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Cardápio
            </Link>
            <span className="text-xs text-muted-foreground">/</span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Adicionais & Personalização
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Configure grupos de escolhas obrigatórias ou opcionais e os itens adicionais de cada prato.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            {activeTab === 'groups' ? (
              <Button
                size="sm"
                onClick={() =>
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.set('modal', 'new-group');
                    return next;
                  })
                }
                className="gap-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Novo Grupo
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() =>
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.set('modal', 'new-item');
                    return next;
                  })
                }
                className="gap-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Novo Item Adicional
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => handleTabChange('groups')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'groups'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="h-4 w-4" />
          Grupos de Adicionais
          <Badge variant="outline" className="text-[10px] ml-1">
            {groups.length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('items')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'items'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Tag className="h-4 w-4" />
          Itens Adicionais
          <Badge variant="outline" className="text-[10px] ml-1">
            {totalAddOns}
          </Badge>
        </button>
      </div>

      {/* TAB 1: ADD-ON GROUPS */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-xs font-medium">Carregando grupos de adicionais...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border rounded-xl bg-card/30">
              <Layers className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-foreground">Nenhum grupo cadastrado</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Crie grupos para reunir opções como "Ponto da Carne", "Molhos" ou "Adicionais Extras".
              </p>
              {canManage && (
                <Button
                  size="sm"
                  onClick={() =>
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      next.set('modal', 'new-group');
                      return next;
                    })
                  }
                  className="mt-4 gap-2 text-xs"
                >
                  <Plus className="h-4 w-4" /> Criar Primeiro Grupo
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((grp) => (
                <div
                  key={grp.id}
                  className="p-5 rounded-xl border border-border bg-card flex flex-col justify-between space-y-4 hover:border-border/80 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{grp.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {grp.description || 'Sem descrição cadastrada'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {grp.required ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20"
                          >
                            Obrigatório
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            Opcional
                          </Badge>
                        )}
                        {canManage && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs flex items-center gap-1 data-[state=open]:bg-accent"
                              >
                                <span>Ações</span>
                                <ChevronDown className="h-3 w-3 opacity-60" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Ações do Grupo</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => setFilter('tab', 'items')}
                                className="cursor-pointer"
                              >
                                <Tag className="h-3.5 w-3.5 mr-2 text-primary" />
                                <span>Ver Itens Vinculados</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteGroup(grp)}
                                className="cursor-pointer text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                <span>Excluir Grupo</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-mono bg-muted px-2 py-0.5 rounded text-[11px]">
                        Mínimo: {grp.min_selections}
                      </span>
                      <span className="font-mono bg-muted px-2 py-0.5 rounded text-[11px]">
                        Máximo: {grp.max_selections}
                      </span>
                    </div>
                  </div>

                  {/* Attached Addon Items Pills */}
                  <div className="pt-3 border-t border-border">
                    <p className="text-[11px] font-semibold text-muted-foreground mb-2">
                      Itens neste grupo ({grp.add_ons?.length ?? 0}):
                    </p>
                    {grp.add_ons && grp.add_ons.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {grp.add_ons.map((item) => (
                          <span
                            key={item.id}
                            className="text-[11px] px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground border border-border/40 font-medium flex items-center gap-1.5"
                          >
                            {item.name}
                            {item.price > 0 && (
                              <span className="text-foreground/70 font-mono text-[10px]">
                                (+{formatCurrency(item.price, currentRestaurant?.currency)})
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground/60 italic">
                        Nenhum item associado. Adicione itens na aba "Itens Adicionais".
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ADD-ON ITEMS */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar adicional por nome..."
              value={search}
              onChange={(e) => setFilter('search', e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-xs font-medium">Carregando itens adicionais...</p>
            </div>
          ) : addOns.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border rounded-xl bg-card/30">
              <Tag className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-foreground">Nenhum adicional encontrado</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {search
                  ? 'Nenhum adicional corresponde à busca.'
                  : 'Cadastre itens adicionais como Bacon, Queijo Extra, Ponto da Carne, etc.'}
              </p>
              {canManage && (
                <Button
                  size="sm"
                  onClick={() =>
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      next.set('modal', 'new-item');
                      return next;
                    })
                  }
                  className="mt-4 gap-2 text-xs"
                >
                  <Plus className="h-4 w-4" /> Criar Adicional
                </Button>
              )}
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Item Adicional</th>
                      <th className="py-3 px-4">Grupos Vinculados</th>
                      <th className="py-3 px-4 text-right">Preço Adicional</th>
                      <th className="py-3 px-4 text-center">Disponibilidade</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {addOns.map((item) => {
                      const linkedGroups = groups.filter((g) => item.group_ids?.includes(g.id));
                      return (
                        <tr key={item.id} className="hover:bg-accent/40 transition-colors">
                          <td className="py-3 px-4 font-semibold text-foreground">
                            <Link
                              to={`/app/menu/add-ons/${item.id}`}
                              className="hover:text-primary transition-colors block"
                            >
                              {item.name}
                            </Link>
                            {item.description && (
                              <p className="text-[11px] text-muted-foreground line-clamp-1">
                                {item.description}
                              </p>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {linkedGroups.length > 0 ? (
                                linkedGroups.map((g) => (
                                  <Badge
                                    key={g.id}
                                    variant="outline"
                                    className="text-[10px] font-normal"
                                  >
                                    {g.name}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-muted-foreground/60 text-[11px]">—</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                            {item.price > 0
                              ? `+ ${formatCurrency(item.price, currentRestaurant?.currency)}`
                              : 'Grátis'}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              disabled={!canManage}
                              onClick={() => handleToggleItemAvailability(item)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                                item.available
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {item.available ? 'Disponível' : 'Indisponível'}
                            </button>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs flex items-center gap-1.5 ml-auto data-[state=open]:bg-accent"
                                >
                                  <span>Ações</span>
                                  <ChevronDown className="h-3 w-3 opacity-60" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel>Ações do Adicional</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => navigate(`/app/menu/add-ons/${item.id}`)}
                                  className="cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5 mr-2 text-primary" />
                                  <span>Ver / Editar Detalhes</span>
                                </DropdownMenuItem>

                                {canManage && (
                                  <DropdownMenuItem
                                    onClick={() => handleToggleItemAvailability(item)}
                                    className="cursor-pointer"
                                  >
                                    {item.available ? (
                                      <>
                                        <XCircle className="h-3.5 w-3.5 mr-2 text-amber-500" />
                                        <span>Tornar Indisponível</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                                        <span>Tornar Disponível</span>
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                )}

                                {canManage && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => setDeleteItem(item)}
                                      className="cursor-pointer text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                                      <span>Excluir Adicional</span>
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-3 border-t border-border">
                <PaginationControl
                  page={page}
                  pageSize={pageSize}
                  total={totalAddOns}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Novo Grupo */}
      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Novo Grupo de Adicionais</h3>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.delete('modal');
                    return next;
                  })
                }
                className="text-muted-foreground hover:text-foreground text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nome do Grupo *
                </label>
                <Input
                  required
                  placeholder="Ex: Ponto da Carne, Molhos, Extras..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Descrição (Instrução para o cliente)
                </label>
                <Input
                  placeholder="Ex: Escolha até 2 opções de molho..."
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Mínimo de Escolhas
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={newMinSelections}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10) || 0;
                      setNewMinSelections(v);
                      if (v >= 1) setNewGroupRequired(true);
                    }}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Máximo de Escolhas
                  </label>
                  <Input
                    type="number"
                    min={newMinSelections}
                    value={newMaxSelections}
                    onChange={(e) => setNewMaxSelections(parseInt(e.target.value, 10) || 1)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newGroupRequired}
                    onChange={(e) => setNewGroupRequired(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <div>
                    <span className="text-xs font-semibold text-foreground">
                      Seleção Obrigatória
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      O cliente deve escolher ao menos uma opção antes de enviar o pedido.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      next.delete('modal');
                      return next;
                    })
                  }
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingGroup}
                  className="gap-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isSubmittingGroup && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Salvar Grupo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Item Adicional */}
      {isCreateItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Novo Item Adicional</h3>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.delete('modal');
                    return next;
                  })
                }
                className="text-muted-foreground hover:text-foreground text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nome do Adicional *
                </label>
                <Input
                  required
                  placeholder="Ex: Bacon Crocante (80g), Queijo Extra..."
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Descrição (Opcional)
                </label>
                <Input
                  placeholder="Ex: Fatias crocantes defumadas na lenha..."
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Preço Adicional ({currentRestaurant?.currency || 'BRL'}) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  placeholder="0.00 para opções gratuitas"
                  className="text-xs font-mono"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Deixe 0.00 para opções sem acréscimo (ex: ponto da carne).
                </p>
              </div>

              {/* Group associations */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Vincular aos Grupos:
                </label>
                {groups.length === 0 ? (
                  <p className="text-xs text-amber-500">
                    Nenhum grupo criado ainda. Crie um grupo na aba anterior.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto border border-border rounded-md p-2">
                    {groups.map((g) => {
                      const checked = newItemGroups.includes(g.id);
                      return (
                        <label
                          key={g.id}
                          className="flex items-center gap-2 p-1.5 rounded hover:bg-accent/40 cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setNewItemGroups((prev) =>
                                checked ? prev.filter((id) => id !== g.id) : [...prev, g.id]
                              );
                            }}
                            className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                          />
                          <span className="font-medium text-foreground">{g.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      next.delete('modal');
                      return next;
                    })
                  }
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingItem}
                  className="gap-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isSubmittingItem && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Cadastrar Adicional
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Group Modal */}
      {deleteGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-sm text-foreground">Excluir Grupo?</h3>
              <p className="text-xs text-muted-foreground mt-1.5">
                Deseja excluir o grupo{' '}
                <span className="font-semibold text-foreground">"{deleteGroup.name}"</span>?
                Os itens adicionais continuarão cadastrados, mas este grupo será desvinculado dos pratos.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteGroup(null)}
                disabled={isDeleting}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDeleteGroup}
                disabled={isDeleting}
                className="gap-2 text-xs"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirmar Exclusão
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Modal */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-sm text-foreground">Excluir Adicional?</h3>
              <p className="text-xs text-muted-foreground mt-1.5">
                Deseja excluir o item adicional{' '}
                <span className="font-semibold text-foreground">"{deleteItem.name}"</span>?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteItem(null)}
                disabled={isDeleting}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDeleteItem}
                disabled={isDeleting}
                className="gap-2 text-xs"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirmar Exclusão
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
