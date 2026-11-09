import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FolderTree,
  ArrowLeft,
  Save,
  ShoppingBag,
  Plus,
  Loader2,
  Upload,
  Trash2,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  Copy,
  UtensilsCrossed,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useAuth } from '@/hooks/useAuth';
import { menuService } from '@/services/menuService';
import type { Category, Product } from '@/types/menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/utils/format';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function CategoryDetailsPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { currentRestaurant, can } = useRestaurant();
  const { user } = useAuth();

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const canManage = can('products.create') || can('restaurant_admin');

  useEffect(() => {
    let isMounted = true;
    if (!categoryId || !currentRestaurant) return;

    setLoading(true);
    Promise.all([
      menuService.getCategoryById(categoryId),
      menuService.getProducts(currentRestaurant.id, {
        category: categoryId,
        page: 1,
        pageSize: 50,
      }),
    ])
      .then(([cat, prodsRes]) => {
        if (!isMounted) return;
        if (!cat) {
          toast.error('Categoria não encontrada.');
          navigate('/app/menu/categories');
          return;
        }
        setCategory(cat);
        setName(cat.name);
        setDescription(cat.description || '');
        setSortOrder(cat.sort_order);
        setStatus(cat.status);
        setImageUrl(cat.image_url || null);
        setProducts(prodsRes.data);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Erro ao carregar detalhes da categoria.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [categoryId, currentRestaurant, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !currentRestaurant || !name.trim()) {
      toast.error('O nome da categoria é obrigatório.');
      return;
    }

    setIsSaving(true);
    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        const uploadRes = await menuService.uploadMenuImage(
          imageFile,
          currentRestaurant.id,
          'categories',
          user?.id
        );
        if (uploadRes.error) {
          toast.error(uploadRes.error);
        } else {
          finalImageUrl = uploadRes.url || null;
        }
      }

      const res = await menuService.updateCategory(
        categoryId,
        {
          name: name.trim(),
          description: description.trim() || null,
          sort_order: sortOrder,
          status,
          image_url: finalImageUrl,
        },
        user?.id
      );

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Categoria atualizada com sucesso!');
        if (res.data) {
          setCategory(res.data);
          setImageUrl(res.data.image_url || null);
          setImageFile(null);
          setImagePreview(null);
        }
      }
    } catch {
      toast.error('Erro ao salvar categoria.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-xs font-medium">Carregando detalhes da categoria...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/app/menu/categories"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Categorias
            </Link>
            <span className="text-xs text-muted-foreground">/</span>
            <h1 className="text-xl font-bold tracking-tight text-foreground">{category?.name}</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
            <span>Criada em: {formatDateTime(category?.created_at)}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Atualizada em: {formatDateTime(category?.updated_at)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/menu/categories')}
            className="text-xs"
          >
            Voltar
          </Button>

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs flex items-center gap-1.5 data-[state=open]:bg-accent"
                >
                  <span>Ações</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Ações da Categoria</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleSave} disabled={isSaving} className="cursor-pointer">
                  <Save className="h-3.5 w-3.5 mr-2 text-primary" />
                  <span>Salvar Alterações</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setStatus(status === 'active' ? 'inactive' : 'active')}
                  className="cursor-pointer"
                >
                  {status === 'active' ? (
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

                <DropdownMenuItem
                  onClick={() => navigate(`/app/menu/products?category=${categoryId}`)}
                  className="cursor-pointer"
                >
                  <ShoppingBag className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <span>Ver Produtos Desta Categoria</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => {
                    void navigator.clipboard.writeText(window.location.href);
                    toast.success('Link da categoria copiado!');
                  }}
                  className="cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <span>Copiar Link</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => navigate('/app/menu')}
                  className="cursor-pointer"
                >
                  <UtensilsCrossed className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <span>Ver Cardápio Geral</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {canManage && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Salvar Alterações
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="p-6 rounded-xl border border-border bg-card space-y-5">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-primary" /> Dados Principais
            </h2>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Nome da Categoria *
              </label>
              <Input
                required
                disabled={!canManage}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Descrição
              </label>
              <textarea
                rows={3}
                disabled={!canManage}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição dos itens que compõem esta categoria..."
                className="w-full text-xs rounded-md border border-input bg-background p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring disabled:opacity-60"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Ordem no Cardápio
                </label>
                <Input
                  type="number"
                  min={0}
                  disabled={!canManage}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Status
                </label>
                <select
                  disabled={!canManage}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring disabled:opacity-60"
                >
                  <option value="active">Ativa</option>
                  <option value="inactive">Inativa</option>
                </select>
              </div>
            </div>
          </form>

          {/* Products in this category */}
          <div className="p-6 rounded-xl border border-border bg-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-emerald-500" />
                  Produtos nesta Categoria ({products.length})
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Itens vinculados a esta seção do cardápio.
                </p>
              </div>

              {canManage && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/app/menu/products?modal=new&category_id=${categoryId}`)}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar Produto
                </Button>
              )}
            </div>

            {products.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-lg bg-card/40">
                <ShoppingBag className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  Nenhum produto cadastrado nesta categoria ainda.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                {products.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3 flex items-center justify-between gap-4 hover:bg-accent/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-md bg-muted overflow-hidden shrink-0 border border-border">
                        {prod.image_url ? (
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground/50 text-[10px]">
                            sem foto
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/app/menu/products/${prod.id}`}
                          className="text-xs font-semibold text-foreground hover:text-primary transition-colors truncate block"
                        >
                          {prod.name}
                        </Link>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {prod.short_description || 'Sem descrição curta'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-bold text-foreground">
                        {formatCurrency(prod.price, currentRestaurant?.currency)}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          prod.available
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        }`}
                      >
                        {prod.available ? 'Disponível' : 'Indisponível'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/app/menu/products/${prod.id}`)}
                        className="text-xs h-7 px-2"
                      >
                        Editar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Image Card */}
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-border bg-card space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Imagem de Capa
            </h3>

            <div className="aspect-video w-full rounded-lg border border-border overflow-hidden bg-muted/40 flex items-center justify-center relative group">
              {imagePreview || imageUrl ? (
                <img
                  src={imagePreview || imageUrl!}
                  alt="Categoria"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-center p-4">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-[11px] text-muted-foreground">Nenhuma imagem selecionada</p>
                </div>
              )}
            </div>

            {canManage && (
              <div className="space-y-2">
                <label className="block w-full cursor-pointer">
                  <span className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-input bg-background text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Upload className="h-3.5 w-3.5" /> Enviar Nova Imagem
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                {(imagePreview || imageUrl) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="w-full text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Remover Imagem
                  </Button>
                )}
                <p className="text-[10px] text-muted-foreground text-center">
                  Formatos aceitos: JPG, PNG, WEBP (máx. 5MB).
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
