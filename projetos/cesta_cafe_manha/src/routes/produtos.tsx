import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/platform/AppShell";
import { CategoryDialog } from "@/components/platform/CategoryDialog";
import { ProductDialog } from "@/components/platform/ProductDialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateBlocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { hasRole, useAuthSession, useCurrentMember } from "@/hooks/useAuthSession";
import { supabase } from "@/integrations/supabase/client";
import {
  createCategory,
  createProduct,
  deleteProduct,
  fetchCategories,
  fetchProducts,
  formatCurrency,
  updateCategory,
  updateProduct,
  type CategoryInput,
  type ProductInput,
} from "@/services/catalog";
import type { Category, Product } from "@/types/domain";

export const Route = createFileRoute("/produtos")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  head: () => ({ meta: [{ title: "Produtos | Olivelas" }] }),
  component: ProductsPage,
});

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Tente novamente.";
}

function ProductsPage() {
  const { user, loading } = useAuthSession();
  const current = useCurrentMember(user?.id);
  const approved = current.data?.profile?.status === "aprovado";
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts, enabled: approved });
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories, enabled: approved });
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [productDialog, setProductDialog] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });
  const [categoryDialog, setCategoryDialog] = useState<{ open: boolean; category: Category | null }>({
    open: false,
    category: null,
  });
  const [saving, setSaving] = useState(false);

  const categoryName = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.id, c.name])),
    [categories.data],
  );
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (products.data ?? []).filter(
      (p) =>
        (!categoryFilter || p.category_id === categoryFilter) &&
        (!term || p.name.toLowerCase().includes(term) || (p.sku ?? "").toLowerCase().includes(term)),
    );
  }, [products.data, search, categoryFilter]);

  if (loading || current.isLoading)
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Carregando produtos...
      </div>
    );
  if (!current.data?.profile || !approved)
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
        <div>
          <p className="font-semibold">Acesso indisponível</p>
          <Link to="/auth" className="mt-4 inline-block text-sm text-primary underline">
            Ver status
          </Link>
        </div>
      </div>
    );

  const { profile, roles } = current.data;
  const canWrite = hasRole(roles, "administrador", "estoque");
  const canDelete = hasRole(roles, "administrador");

  async function run(task: () => Promise<unknown>, success: string, keys: string[]) {
    setSaving(true);
    try {
      await task();
      await Promise.all(keys.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
      toast.success(success);
      return true;
    } catch (error) {
      toast.error("Não foi possível salvar", { description: errorMessage(error) });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function submitProduct(input: ProductInput) {
    const target = productDialog.product;
    const ok = await run(
      () => (target ? updateProduct(target, input, profile.id) : createProduct(input, profile.id)),
      target ? "Produto atualizado" : "Produto cadastrado",
      ["products"],
    );
    if (ok) setProductDialog({ open: false, product: null });
  }

  async function submitCategory(input: CategoryInput) {
    const target = categoryDialog.category;
    const ok = await run(
      () => (target ? updateCategory(target, input, profile.id) : createCategory(input, profile.id)),
      target ? "Categoria atualizada" : "Categoria criada",
      ["categories"],
    );
    if (ok) setCategoryDialog({ open: false, category: null });
  }

  async function removeProduct(product: Product) {
    if (!window.confirm(`Remover "${product.name}"? Essa ação não pode ser desfeita.`)) return;
    await run(() => deleteProduct(product, profile.id), "Produto removido", ["products"]);
  }

  return (
    <AppShell
      profile={profile}
      roles={roles}
      title="Produtos"
      description="Itens que compõem suas cestas de café."
    >
      <Toaster richColors position="top-right" />
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Produtos e categorias</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {products.data?.length ?? 0} produtos · {categories.data?.length ?? 0} categorias
            </p>
          </div>
          {canWrite && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setCategoryDialog({ open: true, category: null })}
              >
                <Tags className="size-4" /> Nova categoria
              </Button>
              <Button className="gap-2" onClick={() => setProductDialog({ open: true, product: null })}>
                <Plus className="size-4" /> Novo produto
              </Button>
            </div>
          )}
        </section>

        <section className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={categoryFilter === null ? "default" : "outline"}
            onClick={() => setCategoryFilter(null)}
          >
            Todas
          </Button>
          {(categories.data ?? []).map((category) => (
            <span key={category.id} className="inline-flex items-center">
              <Button
                size="sm"
                variant={categoryFilter === category.id ? "default" : "outline"}
                onClick={() => setCategoryFilter(category.id)}
                className={canWrite ? "rounded-r-none" : undefined}
              >
                {category.name}
                {!category.active && <span className="ml-1 opacity-60">(inativa)</span>}
              </Button>
              {canWrite && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-l-none border-l-0 px-2"
                  aria-label={`Editar ${category.name}`}
                  onClick={() => setCategoryDialog({ open: true, category })}
                >
                  <Pencil className="size-3" />
                </Button>
              )}
            </span>
          ))}
        </section>

        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou código"
            className="pl-9"
          />
        </div>

        {(products.isLoading || categories.isLoading) && <LoadingState rows={5} />}
        {(products.isError || categories.isError) && (
          <ErrorState
            message={errorMessage(products.error ?? categories.error)}
            onRetry={() => {
              products.refetch();
              categories.refetch();
            }}
          />
        )}
        {products.data && products.data.length === 0 && (
          <EmptyState
            title="Nenhum produto cadastrado"
            description="Cadastre o primeiro item que vai compor suas cestas."
            action={
              canWrite && (
                <Button size="sm" onClick={() => setProductDialog({ open: true, product: null })}>
                  Cadastrar produto
                </Button>
              )
            }
          />
        )}
        {products.data && products.data.length > 0 && filtered.length === 0 && (
          <EmptyState title="Nada encontrado" description="Ajuste a busca ou o filtro de categoria." />
        )}
        {filtered.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Produto</th>
                  <th className="px-5 py-3 font-medium">Categoria</th>
                  <th className="px-5 py-3 text-right font-medium">Custo</th>
                  <th className="px-5 py-3 text-right font-medium">Venda</th>
                  <th className="px-5 py-3 text-right font-medium">Estoque</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  {canWrite && <th className="px-5 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((product) => {
                  const low = Number(product.stock_quantity) <= Number(product.min_stock);
                  return (
                    <tr key={product.id} className="hover:bg-foreground/5">
                      <td className="px-5 py-3">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku ?? "Sem código"}</p>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {product.category_id ? categoryName.get(product.category_id) ?? "—" : "—"}
                      </td>
                      <td className="px-5 py-3 text-right">{formatCurrency(Number(product.cost_price))}</td>
                      <td className="px-5 py-3 text-right">{formatCurrency(Number(product.sale_price))}</td>
                      <td className={`px-5 py-3 text-right ${low ? "text-destructive" : ""}`}>
                        {Number(product.stock_quantity)} {product.unit}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={product.active ? "outline" : "secondary"}>
                          {product.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      {canWrite && (
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Editar produto"
                              onClick={() => setProductDialog({ open: true, product })}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            {canDelete && (
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label="Remover produto"
                                onClick={() => removeProduct(product)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProductDialog
        open={productDialog.open}
        product={productDialog.product}
        categories={categories.data ?? []}
        saving={saving}
        onOpenChange={(open) => setProductDialog((s) => ({ ...s, open }))}
        onSubmit={submitProduct}
      />
      <CategoryDialog
        open={categoryDialog.open}
        category={categoryDialog.category}
        saving={saving}
        onOpenChange={(open) => setCategoryDialog((s) => ({ ...s, open }))}
        onSubmit={submitCategory}
      />
    </AppShell>
  );
}
