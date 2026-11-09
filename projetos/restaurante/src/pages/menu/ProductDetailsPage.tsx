import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag,
  ArrowLeft,
  Save,
  Loader2,
  Upload,
  Trash2,
  Image as ImageIcon,
  Clock,
  Layers,
  Check,
  TrendingUp,
  ChevronDown,
  Copy,
  UtensilsCrossed,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useAuth } from '@/hooks/useAuth';
import { menuService } from '@/services/menuService';
import type { Product, Category, AddOnGroup } from '@/types/menu';
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

export function ProductDetailsPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { currentRestaurant, userRole, isGlobalAdmin, can } = useRestaurant();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allGroups, setAllGroups] = useState<AddOnGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sku, setSku] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState<string>('0.00');
  const [costPrice, setCostPrice] = useState<string>('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [available, setAvailable] = useState<boolean>(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  // Permissions
  const canSeeCostPrice = isGlobalAdmin || userRole === 'restaurant_admin' || userRole === 'manager';
  const canManage = can('products.update') || can('restaurant_admin');

  useEffect(() => {
    let isMounted = true;
    if (!productId || !currentRestaurant) return;

    setLoading(true);
    Promise.all([
      menuService.getProductById(productId),
      menuService.getAllCategories(currentRestaurant.id),
      menuService.getAddOnGroups(currentRestaurant.id),
    ])
      .then(([prod, cats, groups]) => {
        if (!isMounted) return;
        if (!prod) {
          toast.error('Produto não encontrado.');
          navigate('/app/menu/products');
          return;
        }
        setProduct(prod);
        setName(prod.name);
        setCategoryId(prod.category_id);
        setSku(prod.sku || '');
        setShortDesc(prod.short_description || '');
        setDesc(prod.description || '');
        setPrice(prod.price ? prod.price.toFixed(2) : '0.00');
        setCostPrice(prod.cost_price !== null && prod.cost_price !== undefined ? prod.cost_price.toFixed(2) : '');
        setStatus(prod.status);
        setAvailable(prod.available);
        setImageUrl(prod.image_url || null);
        setSelectedGroupIds(prod.add_on_group_ids || []);

        setCategories(cats);
        setAllGroups(groups);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Erro ao carregar detalhes do produto.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productId, currentRestaurant, navigate]);

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

  const handleToggleGroup = (groupId: string) => {
    if (!canManage) return;
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !currentRestaurant || !name.trim()) {
      toast.error('O nome do produto é obrigatório.');
      return;
    }
    if (!categoryId) {
      toast.error('Selecione uma categoria.');
      return;
    }

    setIsSaving(true);
    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        const uploadRes = await menuService.uploadMenuImage(
          imageFile,
          currentRestaurant.id,
          'products',
          user?.id
        );
        if (uploadRes.error) {
          toast.error(uploadRes.error);
        } else {
          finalImageUrl = uploadRes.url || null;
        }
      }

      const res = await menuService.updateProduct(
        productId,
        {
          name: name.trim(),
          category_id: categoryId,
          sku: sku.trim() || null,
          short_description: shortDesc.trim() || null,
          description: desc.trim() || null,
          price: parseFloat(price) || 0,
          cost_price: canSeeCostPrice && costPrice ? parseFloat(costPrice) : null,
          status,
          available,
          image_url: finalImageUrl,
          add_on_group_ids: selectedGroupIds,
        },
        user?.id
      );

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Produto atualizado com sucesso!');
        if (res.data) {
          setProduct(res.data);
          setImageUrl(res.data.image_url || null);
          setImageFile(null);
          setImagePreview(null);
        }
      }
    } catch {
      toast.error('Erro ao salvar produto.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-xs font-medium">Carregando detalhes do produto...</p>
      </div>
    );
  }

  // Margin calculation
  const parsedPrice = parseFloat(price) || 0;
  const parsedCost = costPrice ? parseFloat(costPrice) : null;
  const marginPct = parsedCost !== null && parsedPrice > 0
    ? (((parsedPrice - parsedCost) / parsedPrice) * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/app/menu/products"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Produtos
            </Link>
            <span className="text-xs text-muted-foreground">/</span>
            <h1 className="text-xl font-bold tracking-tight text-foreground">{product?.name}</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
            <span>Criado em: {formatDateTime(product?.created_at)}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Atualizado em: {formatDateTime(product?.updated_at)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/menu/products')}
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
                <DropdownMenuLabel>Ações do Produto</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleSave} disabled={isSaving} className="cursor-pointer">
                  <Save className="h-3.5 w-3.5 mr-2 text-primary" />
                  <span>Salvar Alterações</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setAvailable(!available)}
                  className="cursor-pointer"
                >
                  {available ? (
                    <>
                      <XCircle className="h-3.5 w-3.5 mr-2 text-amber-500" />
                      <span>Marcar como Indisponível</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                      <span>Marcar como Disponível</span>
                    </>
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setStatus(status === 'active' ? 'inactive' : 'active')}
                  className="cursor-pointer"
                >
                  {status === 'active' ? (
                    <>
                      <XCircle className="h-3.5 w-3.5 mr-2 text-amber-500" />
                      <span>Definir como Inativo</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                      <span>Definir como Ativo</span>
                    </>
                  )}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => {
                    void navigator.clipboard.writeText(window.location.href);
                    toast.success('Link do produto copiado!');
                  }}
                  className="cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <span>Copiar Link do Produto</span>
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
        {/* Main Details and Add-on Groups */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="p-6 rounded-xl border border-border bg-card space-y-5">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" /> Informações do Item
            </h2>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Categoria *
              </label>
              <select
                required
                disabled={!canManage}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring disabled:opacity-60"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Name & SKU */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nome do Produto *
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
                  SKU / Código
                </label>
                <Input
                  disabled={!canManage}
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="text-xs font-mono uppercase"
                />
              </div>
            </div>

            {/* Short Description */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Descrição Curta (Exibida na listagem do cardápio)
              </label>
              <Input
                disabled={!canManage}
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                placeholder="Ex: Acompanha fritas rústicas e farofa..."
                className="text-xs"
              />
            </div>

            {/* Long Description */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Descrição Completa
              </label>
              <textarea
                rows={3}
                disabled={!canManage}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Detalhes completos sobre ingredientes, corte e modo de preparo..."
                className="w-full text-xs rounded-md border border-input bg-background p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring disabled:opacity-60"
              />
            </div>

            {/* Pricing and Gross Margin */}
            <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Precificação ({currentRestaurant?.currency || 'BRL'})
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Preço de Venda *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    disabled={!canManage}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="text-xs font-mono text-base font-bold text-foreground"
                  />
                </div>

                {canSeeCostPrice && (
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Preço de Custo (Restrito a Gestores)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={!canManage}
                      placeholder="0.00"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="text-xs font-mono"
                    />
                    {marginPct !== null && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Margem bruta estimada: {marginPct}%
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Availability & Status */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-lg border border-border bg-card flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">Disponibilidade</p>
                  <p className="text-[11px] text-muted-foreground">Pode ser pedido no salão</p>
                </div>
                <button
                  type="button"
                  disabled={!canManage}
                  onClick={() => setAvailable(!available)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    available
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {available ? 'Disponível' : 'Indisponível'}
                </button>
              </div>

              <div className="p-3.5 rounded-lg border border-border bg-card flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">Status Geral</p>
                  <p className="text-[11px] text-muted-foreground">Ativo no catálogo</p>
                </div>
                <select
                  disabled={!canManage}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="h-8 px-2 rounded border border-input bg-background text-xs text-foreground"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>
          </form>

          {/* Add-on Groups Attachment Section */}
          <div className="p-6 rounded-xl border border-border bg-card space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-500" />
                Grupos de Adicionais & Personalização
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Vincule grupos de opções a este prato (ex: Ponto da Carne, Molhos Extras, Acompanhamentos).
              </p>
            </div>

            {allGroups.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-border rounded-lg bg-card/40">
                <Layers className="h-7 w-7 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  Nenhum grupo de adicionais cadastrado ainda.
                </p>
                <Link
                  to="/app/menu/add-ons"
                  className="text-xs text-primary font-medium hover:underline mt-2 inline-block"
                >
                  Criar grupos de adicionais
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {allGroups.map((grp) => {
                  const isChecked = selectedGroupIds.includes(grp.id);
                  return (
                    <div
                      key={grp.id}
                      onClick={() => handleToggleGroup(grp.id)}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'border-primary/40 bg-primary/5'
                          : 'border-border bg-card hover:border-border/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 ${
                            isChecked
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-border bg-background'
                          }`}
                        >
                          {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{grp.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {grp.description ||
                              `Escolhas: min ${grp.min_selections}, máx ${grp.max_selections}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {grp.required ? (
                          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                            Obrigatório
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            Opcional
                          </Badge>
                        )}
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {grp.add_ons?.length ?? 0} opções
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Image Card */}
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-border bg-card space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Fotografia do Prato
            </h3>

            <div className="aspect-square w-full rounded-lg border border-border overflow-hidden bg-muted/40 flex items-center justify-center relative">
              {imagePreview || imageUrl ? (
                <img
                  src={imagePreview || imageUrl!}
                  alt="Produto"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-center p-4">
                  <ImageIcon className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Nenhuma foto enviada</p>
                </div>
              )}
            </div>

            {canManage && (
              <div className="space-y-2">
                <label className="block w-full cursor-pointer">
                  <span className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-input bg-background text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Upload className="h-3.5 w-3.5" /> Enviar Nova Foto
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
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Remover Foto
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
