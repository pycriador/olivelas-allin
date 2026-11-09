import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FolderTree,
  Plus,
  Search,
  Trash2,
  Image as ImageIcon,
  Loader2,
  ShoppingBag,
  Upload,
  CheckCircle,
  XCircle,
  Eye,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useAuth } from '@/hooks/useAuth';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { menuService } from '@/services/menuService';
import type { Category } from '@/types/menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PaginationControl } from '@/components/common/PaginationControl';
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

export function CategoriesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentRestaurant, can } = useRestaurant();
  const { user } = useAuth();

  const { page, pageSize, search, status, setFilter, setPage, setPageSize } = useUrlFilters({
    defaultPageSize: 10,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal create state
  const isCreateOpen = searchParams.get('modal') === 'new';
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createSortOrder, setCreateSortOrder] = useState<number>(1);
  const [createStatus, setCreateStatus] = useState<'active' | 'inactive'>('active');
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [createImagePreview, setCreateImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManage = can('products.create') || can('restaurant_admin');

  const loadData = useCallback(async () => {
    if (!currentRestaurant) return;
    setLoading(true);
    try {
      const res = await menuService.getCategories(currentRestaurant.id, {
        search,
        status,
        page,
        pageSize,
      });
      setCategories(res.data);
      setTotalCount(res.total);
    } catch {
      toast.error('Erro ao carregar categorias.');
    } finally {
      setLoading(false);
    }
  }, [currentRestaurant, search, status, page, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      return next;
    });
    setCreateName('');
    setCreateDescription('');
    setCreateSortOrder(categories.length + 1);
    setCreateImageFile(null);
    setCreateImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCreateImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setCreateImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant || !createName.trim()) {
      toast.error('O nome da categoria é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (createImageFile) {
        const uploadRes = await menuService.uploadMenuImage(
          createImageFile,
          currentRestaurant.id,
          'categories',
          user?.id
        );
        if (uploadRes.error) {
          toast.error(uploadRes.error);
        } else {
          imageUrl = uploadRes.url || null;
        }
      }

      const res = await menuService.createCategory(
        currentRestaurant.id,
        {
          name: createName.trim(),
          description: createDescription.trim() || null,
          sort_order: createSortOrder,
          status: createStatus,
          image_url: imageUrl,
        },
        user?.id
      );

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Categoria criada com sucesso!');
        handleCloseCreateModal();
        loadData();
      }
    } catch {
      toast.error('Erro ao salvar categoria.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (cat: Category) => {
    if (!canManage) return;
    const nextStatus = cat.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await menuService.updateCategory(
        cat.id,
        { status: nextStatus },
        user?.id
      );
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Categoria ${nextStatus === 'active' ? 'ativada' : 'desativada'}.`);
        setCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, status: nextStatus } : c))
        );
      }
    } catch {
      toast.error('Erro ao atualizar status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCategory) return;
    setIsDeleting(true);
    try {
      const res = await menuService.deleteCategory(deleteCategory.id, user?.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          deleteCategory.product_count && deleteCategory.product_count > 0
            ? 'Categoria possui produtos vinculados e foi desativada com segurança.'
            : 'Categoria removida com sucesso.'
        );
        setDeleteCategory(null);
        loadData();
      }
    } catch {
      toast.error('Erro ao excluir categoria.');
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Categorias</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Organize os grupos de itens do seu cardápio como Pratos, Entradas, Bebidas e Sobremesas.
          </p>
        </div>

        {canManage && (
          <Button
            size="sm"
            onClick={handleOpenCreateModal}
            className="gap-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Nova Categoria
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar categoria por nome..."
            value={search}
            onChange={(e) => setFilter('search', e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={status || 'all'}
            onChange={(e) => setFilter('status', e.target.value === 'all' ? null : e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativas</option>
            <option value="inactive">Inativas</option>
          </select>
        </div>
      </div>

      {/* Content Table / List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-xs font-medium">Carregando categorias...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-xl bg-card/30">
          <FolderTree className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-foreground">Nenhuma categoria encontrada</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {search || status
              ? 'Nenhum resultado corresponde aos filtros aplicados.'
              : 'Comece criando a primeira seção do seu cardápio, como Entradas ou Pratos Principais.'}
          </p>
          {canManage && !search && (
            <Button size="sm" onClick={handleOpenCreateModal} className="mt-4 gap-2 text-xs">
              <Plus className="h-4 w-4" /> Criar Categoria
            </Button>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <ResponsiveTable>
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Ordem</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4 hidden md:table-cell">Descrição</th>
                  <th className="py-3 px-4 text-center">Produtos</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-accent/40 transition-colors">
                    {/* Sort Order */}
                    <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                      {cat.sort_order}
                    </td>

                    {/* Category Title + Image */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border/60">
                          {cat.image_url ? (
                            <img
                              src={cat.image_url}
                              alt={cat.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FolderTree className="h-5 w-5 text-muted-foreground/60" />
                          )}
                        </div>
                        <div>
                          <Link
                            to={`/app/menu/categories/${cat.id}`}
                            className="font-semibold text-foreground hover:text-primary transition-colors"
                          >
                            {cat.name}
                          </Link>
                          <p className="text-[11px] text-muted-foreground md:hidden line-clamp-1 mt-0.5">
                            {cat.description || 'Sem descrição'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground max-w-xs truncate">
                      {cat.description || '—'}
                    </td>

                    {/* Products count with quick link to filter */}
                    <td className="py-3 px-4 text-center">
                      <Link
                        to={`/app/menu/products?category=${cat.id}`}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary transition-colors font-medium text-[11px]"
                        title="Ver produtos desta categoria"
                      >
                        <ShoppingBag className="h-3 w-3" />
                        <span>{cat.product_count ?? 0}</span>
                      </Link>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        disabled={!canManage}
                        onClick={() => handleToggleStatus(cat)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                          cat.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {cat.status === 'active' ? (
                          <>
                            <CheckCircle className="h-3 w-3" /> Ativa
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" /> Inativa
                          </>
                        )}
                      </button>
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
                          <DropdownMenuLabel>Ações da Categoria</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => navigate(`/app/menu/categories/${cat.id}`)}
                            className="cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 mr-2 text-primary" />
                            <span>Ver / Editar Detalhes</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => navigate(`/app/menu/products?category=${cat.id}`)}
                            className="cursor-pointer"
                          >
                            <ShoppingBag className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            <span>Ver Produtos ({cat.product_count ?? 0})</span>
                          </DropdownMenuItem>

                          {canManage && (
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(cat)}
                              className="cursor-pointer"
                            >
                              {cat.status === 'active' ? (
                                <>
                                  <XCircle className="h-3.5 w-3.5 mr-2 text-amber-500" />
                                  <span>Desativar Categoria</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                                  <span>Ativar Categoria</span>
                                </>
                              )}
                            </DropdownMenuItem>
                          )}

                          {canManage && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteCategory(cat)}
                                className="cursor-pointer text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                <span>Excluir Categoria</span>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
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

      {/* Modal Nova Categoria */}
      <Modal
        isOpen={isCreateOpen}
        onClose={handleCloseCreateModal}
        title="Nova Categoria"
        asDrawerOnMobile={true}
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Nome da Categoria *
            </label>
            <Input
              required
              placeholder="Ex: Pratos Principais, Bebidas..."
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="h-9 sm:h-8 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Descrição (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Breve descrição dos itens desta seção..."
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              className="w-full text-xs rounded-md border border-input bg-background p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Ordem de Exibição
              </label>
              <Input
                type="number"
                min={0}
                value={createSortOrder}
                onChange={(e) => setCreateSortOrder(parseInt(e.target.value, 10) || 0)}
                className="h-9 sm:h-8 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Status
              </label>
              <select
                value={createStatus}
                onChange={(e) => setCreateStatus(e.target.value as any)}
                className="w-full h-9 sm:h-8 px-3 rounded-md border border-input bg-background text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
              >
                <option value="active">Ativa</option>
                <option value="inactive">Inativa</option>
              </select>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Imagem de Capa (Opcional)
            </label>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-lg border border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/40 shrink-0">
                {createImagePreview ? (
                  <img
                    src={createImagePreview}
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

          <div className="pt-3 border-t border-border flex flex-col-reverse sm:flex-row items-center justify-end gap-2">
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
              Criar Categoria
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteCategory)}
        onClose={() => setDeleteCategory(null)}
        title="Excluir Categoria"
        asDrawerOnMobile={true}
      >
        <div className="space-y-4">
          <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mt-1.5">
              Deseja realmente excluir a categoria{' '}
              <span className="font-semibold text-foreground">"{deleteCategory?.name}"</span>?
              {deleteCategory?.product_count && deleteCategory.product_count > 0 ? (
                <span className="block text-amber-500 font-medium mt-1">
                  Aviso: Como existem {deleteCategory.product_count} produto(s) associados, ela será desativada para manter a integridade dos itens.
                </span>
              ) : (
                ' Esta ação não poderá ser desfeita.'
              )}
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteCategory(null)}
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
              Confirmar Exclusão
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
