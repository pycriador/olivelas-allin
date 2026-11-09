import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShoppingBag,
  Plus,
  Search,
  Eye,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Upload,
  ChevronDown,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useAuth } from '@/hooks/useAuth';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { menuService } from '@/services/menuService';
import type { Product, Category } from '@/types/menu';
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
import { ResponsiveTable } from '@/components/common/ResponsiveTable';
import { Modal } from '@/components/ui/modal';

export function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentRestaurant, userRole, isGlobalAdmin, can } = useRestaurant();
  const { user } = useAuth();

  const {
    page,
    pageSize,
    search,
    status,
    setFilter,
    setPage,
    setPageSize,
  } = useUrlFilters({ defaultPageSize: 10 });

  const categoryFilter = searchParams.get('category') || '';
  const availableFilter = searchParams.get('available') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Permission check: only admin and manager can see cost price and manage products
  const canSeeCostPrice = isGlobalAdmin || userRole === 'restaurant_admin' || userRole === 'manager';
  const canManage = can('products.create') || can('restaurant_admin');

  // Modal Create state
  const isCreateOpen = searchParams.get('modal') === 'new';
  const preselectedCategory = searchParams.get('category_id') || '';

  const [newName, setNewName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState(preselectedCategory);
  const [newSku, setNewSku] = useState('');
  const [newShortDesc, setNewShortDesc] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState<string>('0.00');
  const [newCostPrice, setNewCostPrice] = useState<string>('');
  const [newStatus, setNewStatus] = useState<'active' | 'inactive'>('active');
  const [newAvailable, setNewAvailable] = useState<boolean>(true);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load all categories for filter dropdown and modal
  useEffect(() => {
    if (!currentRestaurant) return;
    menuService.getAllCategories(currentRestaurant.id).then((cats) => {
      setCategories(cats);
      if (!newCategoryId && cats.length > 0) {
        setNewCategoryId(cats[0].id);
      }
    });
  }, [currentRestaurant]);

  // Load products list
  const loadProducts = useCallback(async () => {
    if (!currentRestaurant) return;
    setLoading(true);
    try {
      const res = await menuService.getProducts(currentRestaurant.id, {
        search,
        category: categoryFilter,
        status,
        available: availableFilter,
        page,
        pageSize,
      });
      setProducts(res.data);
      setTotalCount(res.total);
    } catch {
      toast.error('Erro ao carregar produtos.');
    } finally {
      setLoading(false);
    }
  }, [currentRestaurant, search, categoryFilter, status, availableFilter, page, pageSize]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleOpenCreateModal = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('modal', 'new');
      return next;
    });
  };

  const handleCloseCreateModal = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('modal');
      next.delete('category_id');
      return next;
    });
    setNewName('');
    setNewSku('');
    setNewShortDesc('');
    setNewDesc('');
    setNewPrice('0.00');
    setNewCostPrice('');
    setNewImageFile(null);
    setNewImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setNewImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant || !newName.trim()) {
      toast.error('Nome do produto é obrigatório.');
      return;
    }
    if (!newCategoryId) {
      toast.error('Selecione uma categoria para o produto.');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (newImageFile) {
        const uploadRes = await menuService.uploadMenuImage(
          newImageFile,
          currentRestaurant.id,
          'products',
          user?.id
        );
        if (uploadRes.error) {
          toast.error(uploadRes.error);
        } else {
          imageUrl = uploadRes.url || null;
        }
      }

      const res = await menuService.createProduct(
        currentRestaurant.id,
        {
          name: newName.trim(),
          category_id: newCategoryId,
          sku: newSku.trim() || null,
          short_description: newShortDesc.trim() || null,
          description: newDesc.trim() || null,
          price: parseFloat(newPrice) || 0,
          cost_price: newCostPrice ? parseFloat(newCostPrice) : null,
          status: newStatus,
          available: newAvailable,
          image_url: imageUrl,
        },
        user?.id
      );

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Produto criado com sucesso!');
        handleCloseCreateModal();
        loadProducts();
      }
    } catch {
      toast.error('Erro ao cadastrar produto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick 1-click availability toggle
  const handleToggleAvailability = async (prod: Product) => {
    if (!canManage) return;
    const nextAvail = !prod.available;
    try {
      const res = await menuService.toggleProductAvailability(prod.id, nextAvail, user?.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Produto marcado como ${nextAvail ? 'disponível' : 'indisponível'}.`);
        setProducts((prev) =>
          prev.map((p) => (p.id === prod.id ? { ...p, available: nextAvail } : p))
        );
      }
    } catch {
      toast.error('Erro ao atualizar disponibilidade.');
    }
  };

  // Soft deletion / inactivate
  const handleConfirmDelete = async () => {
    if (!deleteProduct) return;
    setIsDeleting(true);
    try {
      const res = await menuService.deleteProduct(deleteProduct.id, user?.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Produto desativado com segurança no cardápio.');
        setDeleteProduct(null);
        loadProducts();
      }
    } catch {
      toast.error('Erro ao desativar produto.');
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Produtos</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie itens, preços ({currentRestaurant?.currency || 'BRL'}), fotos e disponibilidade em tempo real.
          </p>
        </div>

        {canManage && (
          <Button
            size="sm"
            onClick={handleOpenCreateModal}
            className="gap-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, SKU ou descrição..."
            value={search}
            onChange={(e) => setFilter('search', e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter || 'all'}
          onChange={(e) => {
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              if (e.target.value === 'all') next.delete('category');
              else next.set('category', e.target.value);
              next.set('page', '1');
              return next;
            });
          }}
          className="h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
        >
          <option value="all">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={status || 'all'}
          onChange={(e) => setFilter('status', e.target.value === 'all' ? null : e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>

        {/* Availability filter */}
        <select
          value={availableFilter || 'all'}
          onChange={(e) => {
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              if (e.target.value === 'all') next.delete('available');
              else next.set('available', e.target.value);
              next.set('page', '1');
              return next;
            });
          }}
          className="h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
        >
          <option value="all">Toda disponibilidade</option>
          <option value="true">Apenas Disponíveis</option>
          <option value="false">Apenas Indisponíveis</option>
        </select>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-xs font-medium">Carregando catálogo de produtos...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-xl bg-card/30">
          <ShoppingBag className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-foreground">Nenhum produto encontrado</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {search || categoryFilter || status || availableFilter
              ? 'Nenhum produto corresponde aos filtros selecionados.'
              : 'Cadastre seu primeiro produto para começar a montar o cardápio.'}
          </p>
          {canManage && (
            <Button size="sm" onClick={handleOpenCreateModal} className="mt-4 gap-2 text-xs">
              <Plus className="h-4 w-4" /> Cadastrar Produto
            </Button>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <ResponsiveTable>
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4 text-right">Preço</th>
                  {canSeeCostPrice && <th className="py-3 px-4 text-right">Custo / Margem</th>}
                  <th className="py-3 px-4 text-center">Disponibilidade</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((prod) => {
                  const hasCost = prod.cost_price !== null && prod.cost_price !== undefined;
                  const margin = hasCost && prod.price > 0
                    ? (((prod.price - Number(prod.cost_price)) / prod.price) * 100).toFixed(0)
                    : null;

                  return (
                    <tr key={prod.id} className="hover:bg-accent/40 transition-colors">
                      {/* Product thumbnail + name + SKU */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border/60">
                            {prod.image_url ? (
                              <img
                                src={prod.image_url}
                                alt={prod.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ShoppingBag className="h-5 w-5 text-muted-foreground/60" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/app/menu/products/${prod.id}`}
                              className="font-semibold text-foreground hover:text-primary transition-colors block truncate"
                            >
                              {prod.name}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                              {prod.sku && (
                                <span className="font-mono bg-muted/70 px-1 rounded text-[10px]">
                                  {prod.sku}
                                </span>
                              )}
                              <span className="truncate max-w-[200px]">
                                {prod.short_description || 'Sem descrição curta'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[11px] font-normal">
                          {prod.category?.name || 'Geral'}
                        </Badge>
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-4 text-right font-bold text-foreground">
                        {formatCurrency(prod.price, currentRestaurant?.currency)}
                      </td>

                      {/* Cost Price & Margin (Protected by Role) */}
                      {canSeeCostPrice && (
                        <td className="py-3 px-4 text-right">
                          {hasCost ? (
                            <div>
                              <span className="text-muted-foreground">
                                {formatCurrency(prod.cost_price, currentRestaurant?.currency)}
                              </span>
                              {margin !== null && (
                                <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                                  +{margin}% margem
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </td>
                      )}

                      {/* Availability Quick Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          disabled={!canManage}
                          onClick={() => handleToggleAvailability(prod)}
                          title="Clique para alternar disponibilidade imediata no salão"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                            prod.available
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              prod.available ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                            }`}
                          />
                          {prod.available ? 'Disponível' : 'Indisponível'}
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            prod.status === 'active'
                              ? 'border-emerald-500/20 text-emerald-600 bg-emerald-500/5'
                              : 'border-muted text-muted-foreground bg-muted/40'
                          }`}
                        >
                          {prod.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>

                      {/* Actions */}
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
                            <DropdownMenuLabel>Ações do Produto</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => navigate(`/app/menu/products/${prod.id}`)}
                              className="cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5 mr-2 text-primary" />
                              <span>Ver / Editar Detalhes</span>
                            </DropdownMenuItem>

                            {canManage && (
                              <DropdownMenuItem
                                onClick={() => handleToggleAvailability(prod)}
                                className="cursor-pointer"
                              >
                                {prod.available ? (
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
                                  onClick={() => setDeleteProduct(prod)}
                                  className="cursor-pointer text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                                  <span>Desativar Produto</span>
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
          </ResponsiveTable>

          {/* Pagination */}
          <div className="p-3 border-t border-border">
            <PaginationControl
              page={page}
              pageSize={pageSize}
              total={totalCount}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      )}

      {/* Modal Novo Produto */}
      <Modal
        isOpen={isCreateOpen}
        onClose={handleCloseCreateModal}
        title="Novo Produto"
        asDrawerOnMobile={true}
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Categoria *
            </label>
            <select
              required
              value={newCategoryId}
              onChange={(e) => setNewCategoryId(e.target.value)}
              className="w-full h-9 sm:h-8 px-3 rounded-md border border-input bg-background text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
            >
              <option value="">Selecione a categoria...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Name & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1">
                Nome do Produto *
              </label>
              <Input
                required
                placeholder="Ex: Ancho Angus na Brasa"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-9 sm:h-8 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                SKU / Código
              </label>
              <Input
                placeholder="Ex: CAR-001"
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                className="h-9 sm:h-8 text-xs font-mono uppercase"
              />
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Descrição Curta (Aparece no cardápio)
            </label>
            <Input
              placeholder="Ex: Acompanha batatas rústicas com alecrim e farofa..."
              value={newShortDesc}
              onChange={(e) => setNewShortDesc(e.target.value)}
              className="h-9 sm:h-8 text-xs"
            />
          </div>

          {/* Pricing row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Preço de Venda ({currentRestaurant?.currency || 'BRL'}) *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                required
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="h-9 sm:h-8 text-xs font-mono"
              />
            </div>

            {canSeeCostPrice && (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Preço de Custo (Opcional)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 25.00"
                  value={newCostPrice}
                  onChange={(e) => setNewCostPrice(e.target.value)}
                  className="h-9 sm:h-8 text-xs font-mono"
                />
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Foto do Produto
            </label>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-lg border border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/40 shrink-0">
                {newImagePreview ? (
                  <img
                    src={newImagePreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                )}
              </div>
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-input bg-background text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors min-h-[44px] sm:min-h-0">
                  <Upload className="h-3.5 w-3.5" /> Escolher Imagem
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Status and Availability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
            <label className="flex items-center gap-2 cursor-pointer min-h-[44px] sm:min-h-0">
              <input
                type="checkbox"
                checked={newAvailable}
                onChange={(e) => setNewAvailable(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              <span className="text-xs font-medium text-foreground">
                Disponível imediatamente
              </span>
            </label>

            <div className="flex items-center sm:justify-end gap-2">
              <span className="text-xs text-muted-foreground">Status:</span>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="h-8 px-2 rounded border border-input bg-background text-xs text-foreground"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex flex-col-reverse sm:flex-row items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCloseCreateModal}
              disabled={isSubmitting}
              className="w-full sm:w-auto h-11 sm:h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="w-full sm:w-auto h-11 sm:h-8 gap-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Cadastrar Produto
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete / Inactivate Modal */}
      <Modal
        isOpen={Boolean(deleteProduct)}
        onClose={() => setDeleteProduct(null)}
        title="Desativar Produto"
        asDrawerOnMobile={true}
      >
        <div className="space-y-4">
          <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mt-1.5">
              Deseja desativar o produto{' '}
              <span className="font-semibold text-foreground">"{deleteProduct?.name}"</span>?
              Ele não será mais exibido no salão, mas seu histórico permanecerá seguro no sistema.
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteProduct(null)}
              disabled={isDeleting}
              className="w-full sm:w-auto h-11 sm:h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="w-full sm:w-auto h-11 sm:h-8 gap-2 text-xs"
            >
              {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirmar Desativação
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
