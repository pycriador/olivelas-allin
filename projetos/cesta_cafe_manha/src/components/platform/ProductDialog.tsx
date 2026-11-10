import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ProductInput } from "@/services/catalog";
import type { Category, Product } from "@/types/domain";

const NO_CATEGORY = "sem-categoria";

const EMPTY: ProductInput = {
  name: "",
  sku: null,
  category_id: null,
  unit: "un",
  cost_price: 0,
  sale_price: 0,
  min_stock: 0,
  description: null,
  active: true,
};

export function ProductDialog({
  open,
  product,
  categories,
  saving,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  product: Product | null;
  categories: Category[];
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: ProductInput) => Promise<void>;
}) {
  const [form, setForm] = useState<ProductInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      product
        ? {
            name: product.name,
            sku: product.sku,
            category_id: product.category_id,
            unit: product.unit,
            cost_price: Number(product.cost_price),
            sale_price: Number(product.sale_price),
            min_stock: Number(product.min_stock),
            description: product.description,
            active: product.active,
          }
        : EMPTY,
    );
  }, [open, product]);

  function update<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      setError("Informe um nome com pelo menos 2 caracteres.");
      return;
    }
    if (form.cost_price < 0 || form.sale_price < 0 || form.min_stock < 0) {
      setError("Valores não podem ser negativos.");
      return;
    }
    setError(null);
    await onSubmit({
      ...form,
      name: form.name.trim(),
      sku: form.sku?.trim() ? form.sku.trim() : null,
      description: form.description?.trim() ? form.description.trim() : null,
      unit: form.unit.trim() || "un",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription>
            Dados usados no estoque, nos custos e no catálogo das cestas.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Café torrado 250g"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sku">Código (SKU)</Label>
              <Input
                id="sku"
                value={form.sku ?? ""}
                onChange={(event) => update("sku", event.target.value)}
                placeholder="CAF-250"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unidade</Label>
              <Input
                id="unit"
                value={form.unit}
                onChange={(event) => update("unit", event.target.value)}
                placeholder="un, kg, cx"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={form.category_id ?? NO_CATEGORY}
              onValueChange={(value) =>
                update("category_id", value === NO_CATEGORY ? null : value)
              }
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CATEGORY}>Sem categoria</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="cost">Custo (R$)</Label>
              <Input
                id="cost"
                type="number"
                min={0}
                step="0.01"
                value={form.cost_price}
                onChange={(event) => update("cost_price", Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale">Venda (R$)</Label>
              <Input
                id="sale"
                type="number"
                min={0}
                step="0.01"
                value={form.sale_price}
                onChange={(event) => update("sale_price", Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min">Estoque mínimo</Label>
              <Input
                id="min"
                type="number"
                min={0}
                step="1"
                value={form.min_stock}
                onChange={(event) => update("min_stock", Number(event.target.value))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              rows={3}
              value={form.description ?? ""}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Notas de sabor, marca, observações da cesta..."
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Produto ativo</p>
              <p className="text-xs text-muted-foreground">Itens inativos ficam fora do catálogo.</p>
            </div>
            <Switch checked={form.active} onCheckedChange={(value) => update("active", value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar produto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
