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
import { Switch } from "@/components/ui/switch";
import { slugify, type CategoryInput } from "@/services/catalog";
import type { Category } from "@/types/domain";

const EMPTY: CategoryInput = {
  name: "",
  slug: "",
  description: null,
  sort_order: 0,
  active: true,
};

export function CategoryDialog({
  open,
  category,
  saving,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  category: Category | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CategoryInput) => Promise<void>;
}) {
  const [form, setForm] = useState<CategoryInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      category
        ? {
            name: category.name,
            slug: category.slug,
            description: category.description,
            sort_order: category.sort_order,
            active: category.active,
          }
        : EMPTY,
    );
  }, [open, category]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const name = form.name.trim();
    if (name.length < 2) {
      setError("Informe um nome com pelo menos 2 caracteres.");
      return;
    }
    const slug = slugify(form.slug || name);
    if (!slug) {
      setError("Não foi possível gerar o identificador da categoria.");
      return;
    }
    setError(null);
    await onSubmit({
      ...form,
      name,
      slug,
      description: form.description?.trim() ? form.description.trim() : null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription>
            Categorias organizam os produtos dentro do catálogo das cestas.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="cat-name">Nome</Label>
            <Input
              id="cat-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                  slug: category ? current.slug : slugify(event.target.value),
                }))
              }
              placeholder="Bebidas quentes"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-slug">Identificador</Label>
            <Input
              id="cat-slug"
              value={form.slug}
              onChange={(event) => setForm((c) => ({ ...c, slug: event.target.value }))}
              placeholder="bebidas-quentes"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-order">Ordem de exibição</Label>
            <Input
              id="cat-order"
              type="number"
              step="1"
              value={form.sort_order}
              onChange={(event) => setForm((c) => ({ ...c, sort_order: Number(event.target.value) }))}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <p className="text-sm font-medium">Categoria ativa</p>
            <Switch
              checked={form.active}
              onCheckedChange={(value) => setForm((c) => ({ ...c, active: value }))}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar categoria"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
