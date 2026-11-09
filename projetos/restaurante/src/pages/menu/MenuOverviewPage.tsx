import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderTree,
  ShoppingBag,
  Plus,
  ArrowRight,
  AlertTriangle,
  ImageOff,
  CheckCircle2,
  XCircle,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useRestaurant } from '@/hooks/useRestaurant';
import { menuService } from '@/services/menuService';
import type { MenuOverviewMetrics } from '@/types/menu';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function MenuOverviewPage() {
  const navigate = useNavigate();
  const { currentRestaurant, can } = useRestaurant();
  const [metrics, setMetrics] = useState<MenuOverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const canManage = can('products.create') || can('restaurant_admin');

  useEffect(() => {
    let isMounted = true;
    if (!currentRestaurant) return;

    setLoading(true);
    menuService
      .getMenuMetrics(currentRestaurant.id)
      .then((data) => {
        if (isMounted) setMetrics(data);
      })
      .catch((err) => console.error('Error fetching menu metrics:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentRestaurant]);

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestão do Cardápio</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
              Fase 03
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Organize categorias, produtos, fotos, preços e grupos de adicionais para o{' '}
            <span className="font-semibold text-foreground">{currentRestaurant?.name}</span>.
          </p>
        </div>

        {canManage && (
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/menu/categories?modal=new')}
              className="gap-2 text-xs"
            >
              <FolderTree className="h-4 w-4 text-primary" />
              Nova Categoria
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/app/menu/products?modal=new')}
              className="gap-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Novo Produto
            </Button>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Categorias
            </CardTitle>
            <FolderTree className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {loading ? '—' : metrics?.totalCategories ?? 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Seções do seu cardápio</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Produtos
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {loading ? '—' : metrics?.totalProducts ?? 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Pratos, bebidas e itens</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Disponíveis
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {loading ? '—' : metrics?.activeProducts ?? 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Prontos para pedidos</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Indisponíveis
            </CardTitle>
            <XCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {loading ? '—' : metrics?.unavailableProducts ?? 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Pausados ou esgotados</p>
          </CardContent>
        </Card>
      </div>

      {/* Operational Alerts */}
      {!loading && metrics && (metrics.productsWithoutImage > 0 || metrics.emptyCategories > 0) && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Avisos de Otimização do Cardápio
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {metrics.productsWithoutImage > 0 && (
              <div className="flex items-start gap-3 p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-foreground">
                <ImageOff className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs flex-1">
                  <p className="font-semibold text-amber-600 dark:text-amber-400">
                    {metrics.productsWithoutImage} produto(s) sem imagem
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    Pratos com fotografias de qualidade convertem até 40% mais pedidos no tablet ou app.
                  </p>
                  <Link
                    to="/app/menu/products"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:underline mt-2"
                  >
                    Ver produtos sem foto <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}

            {metrics.emptyCategories > 0 && (
              <div className="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-card/60 text-foreground">
                <AlertTriangle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-xs flex-1">
                  <p className="font-semibold text-foreground">
                    {metrics.emptyCategories} categoria(s) vazia(s)
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    Categorias sem nenhum produto cadastrado não aparecem nos pedidos dos clientes.
                  </p>
                  <Link
                    to="/app/menu/categories"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline mt-2"
                  >
                    Gerenciar categorias <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Module Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
        <Link
          to="/app/menu/categories"
          className="group block rounded-xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all"
        >
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <FolderTree className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
            Categorias
            <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
          </h3>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Estruture as divisões do cardápio como Entradas, Pratos Principais, Bebidas e Sobremesas.
          </p>
          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>{metrics?.totalCategories ?? 0} cadastradas</span>
            <span className="text-primary flex items-center gap-1">Acessar <ExternalLink className="h-3 w-3" /></span>
          </div>
        </Link>

        <Link
          to="/app/menu/products"
          className="group block rounded-xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all"
        >
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
            Produtos
            <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
          </h3>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Cadastre os itens para venda, defina preço, custo, descrição, SKU, disponibilidade e fotos.
          </p>
          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>{metrics?.totalProducts ?? 0} produtos</span>
            <span className="text-primary flex items-center gap-1">Acessar <ExternalLink className="h-3 w-3" /></span>
          </div>
        </Link>

        <Link
          to="/app/menu/add-ons"
          className="group block rounded-xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all"
        >
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Layers className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
            Adicionais & Grupos
            <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
          </h3>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Configure opções de personalização como ponto da carne, molhos extras e acompanhamentos.
          </p>
          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>{metrics?.totalAddOnGroups ?? 0} grupos / {metrics?.totalAddOns ?? 0} itens</span>
            <span className="text-primary flex items-center gap-1">Acessar <ExternalLink className="h-3 w-3" /></span>
          </div>
        </Link>
      </div>

      {/* Foundation Ready Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 via-card to-card border border-primary/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-foreground">
              Estrutura de Cardápio Conectada ao Multi-Tenant
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Todos os preços seguem a moeda ({currentRestaurant?.currency || 'BRL'}) e as ações contam com trilha de auditoria completa.
            </p>
          </div>
        </div>
        <div className="hidden sm:block font-mono text-[10px] text-muted-foreground bg-muted/50 px-2.5 py-1 rounded border border-border">
          Fase 03 Concluída com Sucesso
        </div>
      </div>
    </div>
  );
}
