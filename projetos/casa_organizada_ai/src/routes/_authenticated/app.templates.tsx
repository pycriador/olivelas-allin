import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/templates")({
  component: TemplatesPage,
});

type Template = {
  id: string;
  category: string;
  title: string;
  description: string;
  schema?: { pages?: unknown[] };
  planner_view?: string;
  content?: { items?: string[] };
};

const CATEGORY_LABELS: Record<string, string> = {
  casa: "Casa",
  pets: "Pets",
  criancas: "Crianças",
  estudos: "Estudos",
  trabalho: "Trabalho",
  saude: "Saúde",
  compras: "Compras",
  academia: "Academia",
  viagens: "Viagens",
};

function TemplatesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Template[] | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [duplicating, setDuplicating] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("templates")
        .select("id, category, title, description, content, schema, planner_view")
        .eq("is_public", true)
        .order("category")
        .order("title");
      setItems((data as Template[]) ?? []);
    })();
  }, []);

  const categories = useMemo(() => {
    const s = new Set<string>();
    items?.forEach((i) => s.add(i.category));
    return Array.from(s);
  }, [items]);

  const filtered = useMemo(() => {
    return (items ?? []).filter((t) => {
      if (cat !== "all" && t.category !== cat) return false;
      if (!q) return true;
      const s = q.toLowerCase();
      return t.title.toLowerCase().includes(s) || t.description.toLowerCase().includes(s);
    });
  }, [items, q, cat]);

  async function handleDuplicate(t: Template) {
    setDuplicating(t.id);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { toast.error("Você precisa estar logado"); setDuplicating(null); return; }
    const { data, error } = await supabase
      .from("forms")
      .insert({
        owner_id: u.user.id,
        title: t.title,
        description: t.description,
        category: t.category,
        planner_view: t.planner_view ?? "checklist",
        schema: (t.schema ?? { pages: [], logic: [], settings: {} }) as never,
        base_template_id: t.id,
      })
      .select("id")
      .single();
    setDuplicating(null);
    if (error) { toast.error("Erro ao duplicar template"); return; }
    toast.success("Template duplicado com sucesso!");
    navigate({ to: "/app/forms" });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Biblioteca de templates</h1>
        <p className="text-muted-foreground">Modelos prontos para acelerar seu planejamento.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar templates..." className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={cat === "all" ? "default" : "outline"} onClick={() => setCat("all")}>Todos</Button>
          {categories.map((c) => (
            <Button key={c} size="sm" variant={cat === c ? "default" : "outline"} onClick={() => setCat(c)}>
              {CATEGORY_LABELS[c] ?? c}
            </Button>
          ))}
        </div>
      </div>

      {items === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-medium">Nenhum template encontrado</p>
          <p className="text-sm text-muted-foreground">Tente outro termo ou categoria.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <Card key={t.id} className="flex flex-col p-5 transition-all hover:-translate-y-1 hover:shadow-card">
              <Badge variant="secondary" className="mb-2 w-fit">{CATEGORY_LABELS[t.category] ?? t.category}</Badge>
              <h3 className="font-display text-lg font-semibold">{t.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
              <div className="mt-4 pt-4 border-t border-border">
                <Button size="sm" variant="outline" className="w-full" onClick={() => handleDuplicate(t)} disabled={duplicating === t.id}>
                  {duplicating === t.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
                  Duplicar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}