import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Tag,
  ArrowLeft,
  Save,
  Loader2,
  Layers,
  Clock,
  Check,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Copy,
  UtensilsCrossed,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useAuth } from '@/hooks/useAuth';
import { menuService } from '@/services/menuService';
import type { AddOn, AddOnGroup } from '@/types/menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/utils/format';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AddOnDetailsPage() {
  const { addOnId } = useParams<{ addOnId: string }>();
  const navigate = useNavigate();
  const { currentRestaurant, can } = useRestaurant();
  const { user } = useAuth();

  const [addOn, setAddOn] = useState<AddOn | null>(null);
  const [allGroups, setAllGroups] = useState<AddOnGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('0.00');
  const [available, setAvailable] = useState<boolean>(true);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  const canManage = can('products.create') || can('restaurant_admin');

  useEffect(() => {
    let isMounted = true;
    if (!addOnId || !currentRestaurant) return;

    setLoading(true);
    Promise.all([
      menuService.getAddOnById(addOnId),
      menuService.getAddOnGroups(currentRestaurant.id),
    ])
      .then(([item, groups]) => {
        if (!isMounted) return;
        if (!item) {
          toast.error('Adicional não encontrado.');
          navigate('/app/menu/add-ons?tab=items');
          return;
        }
        setAddOn(item);
        setName(item.name);
        setDescription(item.description || '');
        setPrice(item.price ? item.price.toFixed(2) : '0.00');
        setAvailable(item.available);
        setStatus(item.status);
        setSelectedGroupIds(item.group_ids || []);
        setAllGroups(groups);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Erro ao carregar adicional.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [addOnId, currentRestaurant, navigate]);

  const handleToggleGroup = (groupId: string) => {
    if (!canManage) return;
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addOnId || !currentRestaurant || !name.trim()) {
      toast.error('O nome do adicional é obrigatório.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await menuService.updateAddOn(
        addOnId,
        {
          name: name.trim(),
          description: description.trim() || null,
          price: parseFloat(price) || 0,
          available,
          status,
        },
        selectedGroupIds,
        user?.id
      );

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Adicional atualizado com sucesso!');
        if (res.data) {
          setAddOn(res.data);
        }
      }
    } catch {
      toast.error('Erro ao salvar adicional.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-xs font-medium">Carregando detalhes do adicional...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/app/menu/add-ons?tab=items"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Adicionais
            </Link>
            <span className="text-xs text-muted-foreground">/</span>
            <h1 className="text-xl font-bold tracking-tight text-foreground">{addOn?.name}</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
            <span>Criado em: {formatDateTime(addOn?.created_at)}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Atualizado em: {formatDateTime(addOn?.updated_at)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/menu/add-ons?tab=items')}
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
                <DropdownMenuLabel>Ações do Adicional</DropdownMenuLabel>
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
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                      <span>Marcar como Disponível</span>
                    </>
                  )}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => {
                    void navigator.clipboard.writeText(window.location.href);
                    toast.success('Link do adicional copiado!');
                  }}
                  className="cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <span>Copiar Link</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => navigate('/app/menu/add-ons?tab=items')}
                  className="cursor-pointer"
                >
                  <Tag className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <span>Ver Todos os Adicionais</span>
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

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic fields */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" /> Informações do Adicional
          </h2>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Nome do Item *
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
              Descrição (Opcional)
            </label>
            <textarea
              rows={2}
              disabled={!canManage}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes sobre a porção ou preparo..."
              className="w-full text-xs rounded-md border border-input bg-background p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Preço Adicional ({currentRestaurant?.currency || 'BRL'}) *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                required
                disabled={!canManage}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Coloque 0.00 para opções sem custo adicional (ex: ponto da carne).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Disponibilidade
              </label>
              <button
                type="button"
                disabled={!canManage}
                onClick={() => setAvailable(!available)}
                className={`w-full h-9 rounded-md text-xs font-semibold border transition-all ${
                  available
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
              >
                {available ? 'Disponível no Cardápio' : 'Indisponível (Pausado)'}
              </button>
            </div>
          </div>
        </div>

        {/* Group membership */}
        <div className="p-6 rounded-xl border border-border bg-card space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-500" />
              Grupos que contêm este adicional
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Marque os grupos de adicionais nos quais este item deve aparecer.
            </p>
          </div>

          {allGroups.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum grupo cadastrado.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allGroups.map((grp) => {
                const isSelected = selectedGroupIds.includes(grp.id);
                return (
                  <div
                    key={grp.id}
                    onClick={() => handleToggleGroup(grp.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border bg-card hover:border-border/80'
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border bg-background'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{grp.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {grp.required ? 'Obrigatório' : 'Opcional'} • Máx: {grp.max_selections}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
