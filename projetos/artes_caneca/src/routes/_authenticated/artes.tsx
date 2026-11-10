import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Image as ImageIcon, Plus, Search, Pencil, Trash2, Sparkles, X } from "lucide-react";
import { useAuth, canEdit, isAdmin } from "@/hooks/use-auth";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { uploadToBucket } from "@/lib/storage";
import { analyzeArtImage } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/artes")({ component: ArtesList });

type Art = {
  id: string; name: string; image_url: string; collection_id: string | null;
  category: string | null; notes: string | null; description: string | null;
  tags: string[]; colors: string[]; ai_processed: boolean; created_at: string;
};
type Collection = { id: string; name: string };

function ArtesList() {
  const { role, user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [collectionFilter, setCollectionFilter] = useState<string>("all");

  const { data: arts, isLoading } = useQuery({
    queryKey: ["arts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("arts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Art[];
    },
  });

  const { data: collections } = useQuery({
    queryKey: ["collections-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("collections").select("id, name").order("name");
      if (error) throw error;
      return data as Collection[];
    },
  });

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return (arts ?? []).filter((a) => {
      const matchesQ = !q ||
        a.name.toLowerCase().includes(ql) ||
        (a.description ?? "").toLowerCase().includes(ql) ||
        (a.category ?? "").toLowerCase().includes(ql) ||
        a.tags.some((t) => t.toLowerCase().includes(ql)) ||
        a.colors.some((c) => c.toLowerCase().includes(ql));
      const matchesC = collectionFilter === "all" || a.collection_id === collectionFilter;
      return matchesQ && matchesC;
    });
  }, [arts, q, collectionFilter]);

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta arte?")) return;
    const { error } = await supabase.from("arts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Arte excluída");
    qc.invalidateQueries({ queryKey: ["arts"] });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display font-semibold tracking-tight">Artes</h1>
          <p className="text-sm text-muted-foreground mt-1">Capas de caneca com análise por IA, mockups e busca avançada.</p>
        </div>
        {canEdit(role) && (
          <ArtDialog userId={user!.id} collections={collections ?? []} onSaved={() => qc.invalidateQueries({ queryKey: ["arts"] })}>
            <Button><Plus className="h-4 w-4 mr-2" /> Nova arte</Button>
          </ArtDialog>
        )}
      </header>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar nome, tag, cor, descrição..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={collectionFilter} onValueChange={setCollectionFilter}>
          <SelectTrigger className="w-full md:w-64"><SelectValue placeholder="Filtrar por coleção" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as coleções</SelectItem>
            {(collections ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-16 text-center"><ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">Nenhuma arte encontrada.</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((a) => (
            <div key={a.id} className="group relative">
              <Link to="/artes/$id" params={{ id: a.id }}>
                <Card className="overflow-hidden shadow-card hover:shadow-elegant transition-smooth border-border/60">
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    <img src={a.image_url} alt={a.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {a.ai_processed && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-background/80 backdrop-blur px-2 py-0.5 text-[10px] font-medium">
                        <Sparkles className="h-3 w-3 text-primary" /> IA
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm truncate">{a.name}</h3>
                    {a.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {a.tags.slice(0, 3).map((t) => <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">{t}</Badge>)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
              {canEdit(role) && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-smooth">
                  <ArtDialog userId={user!.id} collections={collections ?? []} existing={a} onSaved={() => qc.invalidateQueries({ queryKey: ["arts"] })}>
                    <Button size="icon" variant="secondary" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>
                  </ArtDialog>
                  {isAdmin(role) && (
                    <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ArtDialog({
  children, existing, userId, collections, onSaved,
}: { children: React.ReactNode; existing?: Art; userId: string; collections: Collection[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(existing?.name ?? "");
  const [imageUrl, setImageUrl] = useState(existing?.image_url ?? "");
  const [category, setCategory] = useState(existing?.category ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [collectionId, setCollectionId] = useState<string>(existing?.collection_id ?? "none");
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [colors, setColors] = useState<string[]>(existing?.colors ?? []);
  const [description, setDescription] = useState(existing?.description ?? "");
  const [tagInput, setTagInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const analyze = useServerFn(analyzeArtImage);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const { signedUrl } = await uploadToBucket("arts", file, userId);
      setImageUrl(signedUrl);
      toast.success("Imagem enviada");
      // dispara IA automática
      runAI(signedUrl);
    } catch (err: any) {
      toast.error(err.message ?? "Falha no upload");
    } finally { setBusy(false); }
  }

  async function runAI(url?: string) {
    const target = url ?? imageUrl;
    if (!target) return toast.error("Envie uma imagem primeiro");
    setAiBusy(true);
    try {
      const r = await analyze({ data: { imageUrl: target, artName: name || undefined } });
      setDescription(r.description);
      setColors(r.colors);
      // mescla tags evitando duplicatas
      setTags((prev) => Array.from(new Set([...prev, ...r.tags])).slice(0, 12));
      toast.success("Análise concluída pela IA");
    } catch (err: any) {
      toast.error(err.message ?? "Falha na análise");
    } finally { setAiBusy(false); }
  }

  function addTag() {
    const t = tagInput.trim();
    if (!t) return;
    setTags((prev) => Array.from(new Set([...prev, t])).slice(0, 20));
    setTagInput("");
  }

  async function save() {
    if (!name.trim()) return toast.error("Informe o nome");
    if (!imageUrl) return toast.error("Envie a imagem da arte");
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        image_url: imageUrl,
        category: category.trim() || null,
        notes: notes.trim() || null,
        description: description.trim() || null,
        tags, colors,
        ai_processed: !!description,
        collection_id: collectionId === "none" ? null : collectionId,
      };
      if (existing) {
        const { error } = await supabase.from("arts").update(payload).eq("id", existing.id);
        if (error) throw error;
        toast.success("Arte atualizada");
      } else {
        const { error } = await supabase.from("arts").insert({ ...payload, created_by: userId });
        if (error) throw error;
        toast.success("Arte criada");
      }
      setOpen(false);
      onSaved();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao salvar");
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Editar arte" : "Nova arte"}</DialogTitle>
          <DialogDescription>A IA gerará descrição, cores e tags automaticamente.</DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Imagem da capa</Label>
              <Input type="file" accept="image/*" onChange={onFile} />
              {imageUrl && (
                <div className="mt-2 aspect-square rounded-md border bg-muted overflow-hidden">
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              {imageUrl && (
                <Button type="button" size="sm" variant="outline" disabled={aiBusy} onClick={() => runAI()} className="w-full">
                  <Sparkles className="h-4 w-4 mr-2" /> {aiBusy ? "Analisando..." : "Reanalisar com IA"}
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label>Coleção</Label>
              <Select value={collectionId} onValueChange={setCollectionId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem coleção</SelectItem>
                  {collections.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex.: Floral, Geek, Datas" maxLength={60} />
            </div>
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Digite e Enter" />
                <Button type="button" variant="outline" onClick={addTag}>Add</Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {tags.map((t) => (
                    <Badge key={t} variant="secondary" className="gap-1">
                      {t}
                      <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Descrição (IA)</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
          </div>
          {colors.length > 0 && (
            <div className="space-y-1.5">
              <Label>Cores predominantes</Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5 rounded-full border pl-1 pr-2 py-0.5 text-xs">
                    <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: c }} />
                    <span className="font-mono">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={save} disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
