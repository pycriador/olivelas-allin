import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth, canEdit, isAdmin } from "@/hooks/use-auth";
import { toast } from "sonner";
import { uploadToBucket } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/artes/$id")({ component: ArteDetail });

function ArteDetail() {
  const { id } = Route.useParams();
  const { role, user } = useAuth();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["art", id],
    queryFn: async () => {
      const [{ data: art }, { data: mockups }, { data: collection }] = await Promise.all([
        supabase.from("arts").select("*").eq("id", id).maybeSingle(),
        supabase.from("mockups").select("*").eq("art_id", id).order("created_at", { ascending: false }),
        supabase.from("arts").select("collection_id, collections:collection_id(id,name)").eq("id", id).maybeSingle(),
      ]);
      return { art, mockups: mockups ?? [], collection: (collection as any)?.collections ?? null };
    },
  });

  async function onMockupUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const { signedUrl } = await uploadToBucket("mockups", file, user.id);
        const { error } = await supabase.from("mockups").insert({ art_id: id, image_url: signedUrl, created_by: user.id });
        if (error) throw error;
      }
      toast.success("Mockups enviados");
      qc.invalidateQueries({ queryKey: ["art", id] });
    } catch (err: any) {
      toast.error(err.message ?? "Falha no upload");
    } finally { setUploading(false); e.target.value = ""; }
  }

  async function removeMockup(mid: string) {
    if (!confirm("Remover este mockup?")) return;
    const { error } = await supabase.from("mockups").delete().eq("id", mid);
    if (error) return toast.error(error.message);
    toast.success("Removido");
    qc.invalidateQueries({ queryKey: ["art", id] });
  }

  if (isLoading) return <div className="h-40 rounded-xl bg-muted animate-pulse" />;
  if (!data?.art) return <p>Arte não encontrada.</p>;
  const a = data.art;

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2"><Link to="/artes"><ArrowLeft className="h-4 w-4 mr-1" /> Artes</Link></Button>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8">
        <div className="aspect-square rounded-2xl overflow-hidden border bg-muted shadow-card">
          <img src={a.image_url} alt={a.name} className="h-full w-full object-cover" />
        </div>
        <div className="space-y-5">
          {data.collection && (
            <Link to="/colecoes/$id" params={{ id: data.collection.id }} className="text-xs uppercase tracking-wider text-primary hover:underline">
              {data.collection.name}
            </Link>
          )}
          <h1 className="text-4xl font-display font-semibold">{a.name}</h1>

          {a.description && (
            <Card className="bg-accent/30 border-accent">
              <CardContent className="pt-4">
                <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5" /> Descrição por IA
                </div>
                <p className="text-sm leading-relaxed">{a.description}</p>
              </CardContent>
            </Card>
          )}

          {a.colors?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Cores predominantes</h3>
              <div className="flex flex-wrap gap-2">
                {a.colors.map((c: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 rounded-full border pl-1.5 pr-3 py-1">
                    <span className="h-5 w-5 rounded-full border" style={{ backgroundColor: c }} />
                    <span className="font-mono text-xs">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {a.tags?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {a.tags.map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
              </div>
            </div>
          )}

          {a.category && (
            <div><h3 className="text-sm font-medium mb-1">Categoria</h3><p className="text-sm text-muted-foreground">{a.category}</p></div>
          )}
          {a.notes && (
            <div><h3 className="text-sm font-medium mb-1">Observações</h3><p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.notes}</p></div>
          )}
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-display font-semibold">Mockups</h2>
            <p className="text-sm text-muted-foreground">Variações e simulações desta arte.</p>
          </div>
          {canEdit(role) && (
            <label>
              <input type="file" multiple accept="image/*" className="hidden" onChange={onMockupUpload} disabled={uploading} />
              <Button asChild disabled={uploading}><span><Upload className="h-4 w-4 mr-2" /> {uploading ? "Enviando..." : "Enviar mockups"}</span></Button>
            </label>
          )}
        </div>
        {data.mockups.length === 0 ? (
          <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">Nenhum mockup adicionado.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.mockups.map((m: any) => (
              <div key={m.id} className="group relative">
                <a href={m.image_url} target="_blank" rel="noreferrer">
                  <div className="aspect-square rounded-xl overflow-hidden border bg-muted shadow-card group-hover:shadow-elegant transition-smooth">
                    <img src={m.image_url} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                </a>
                {(canEdit(role) || isAdmin(role)) && (
                  <Button size="icon" variant="destructive" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-smooth" onClick={() => removeMockup(m.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
