import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useAuth, canEdit, isAdmin } from "@/hooks/use-auth";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { uploadToBucket } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/colecoes")({ component: Colecoes });

type Collection = {
  id: string; name: string; description: string | null; cover_url: string | null;
  created_at: string; updated_at: string;
};

function Colecoes() {
  const { role, user } = useAuth();
  const [q, setQ] = useState("");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Collection[];
    },
  });

  const filtered = (data ?? []).filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()) || (c.description ?? "").toLowerCase().includes(q.toLowerCase())
  );

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta coleção? As artes não serão removidas.")) return;
    const { error } = await supabase.from("collections").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Coleção excluída");
    qc.invalidateQueries({ queryKey: ["collections"] });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display font-semibold tracking-tight">Coleções</h1>
          <p className="text-sm text-muted-foreground mt-1">Organize suas capas por temas, clientes ou campanhas.</p>
        </div>
        {canEdit(role) && (
          <CollectionDialog userId={user!.id} onSaved={() => qc.invalidateQueries({ queryKey: ["collections"] })}>
            <Button><Plus className="h-4 w-4 mr-2" /> Nova coleção</Button>
          </CollectionDialog>
        )}
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar coleções..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[4/3] rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhuma coleção encontrada.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="group relative">
              <Link to="/colecoes/$id" params={{ id: c.id }}>
                <Card className="overflow-hidden shadow-card hover:shadow-elegant transition-smooth border-border/60">
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    {c.cover_url ? (
                      <img src={c.cover_url} alt={c.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="h-full w-full bg-gradient-surface flex items-center justify-center">
                        <FolderOpen className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{c.name}</h3>
                    {c.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{c.description}</p>}
                  </CardContent>
                </Card>
              </Link>
              {canEdit(role) && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-smooth">
                  <CollectionDialog userId={user!.id} existing={c} onSaved={() => qc.invalidateQueries({ queryKey: ["collections"] })}>
                    <Button size="icon" variant="secondary" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>
                  </CollectionDialog>
                  {isAdmin(role) && (
                    <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDelete(c.id)}>
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

function CollectionDialog({
  children, existing, userId, onSaved,
}: { children: React.ReactNode; existing?: Collection; userId: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [coverUrl, setCoverUrl] = useState(existing?.cover_url ?? "");
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const { signedUrl } = await uploadToBucket("collection-covers", file, userId);
      setCoverUrl(signedUrl);
      toast.success("Imagem enviada");
    } catch (err: any) {
      toast.error(err.message ?? "Falha no upload");
    } finally { setBusy(false); }
  }

  async function save() {
    if (!name.trim()) return toast.error("Informe um nome");
    setBusy(true);
    try {
      if (existing) {
        const { error } = await supabase.from("collections").update({
          name: name.trim(), description: description.trim() || null, cover_url: coverUrl || null,
        }).eq("id", existing.id);
        if (error) throw error;
        toast.success("Coleção atualizada");
      } else {
        const { error } = await supabase.from("collections").insert({
          name: name.trim(), description: description.trim() || null, cover_url: coverUrl || null, created_by: userId,
        });
        if (error) throw error;
        toast.success("Coleção criada");
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existing ? "Editar coleção" : "Nova coleção"}</DialogTitle>
          <DialogDescription>Organize suas capas por tema, cliente ou linha.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500} />
          </div>
          <div className="space-y-1.5">
            <Label>Capa</Label>
            <Input type="file" accept="image/*" onChange={onFile} />
            {coverUrl && <img src={coverUrl} alt="" className="mt-2 h-28 w-full object-cover rounded-md border" />}
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
