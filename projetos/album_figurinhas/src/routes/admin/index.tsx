import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createAlbum, deleteAlbum, listAlbums } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Album as AlbumIcon, FileImage, FileText, Plus, Trash2, Pencil, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard · Admin" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
    if (!loading && user && !isAdmin) toast.error("Acesso restrito a administradores.");
  }, [loading, user, isAdmin, nav]);

  const { data: albums = [] } = useQuery({ queryKey: ["albums"], queryFn: listAlbums });

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [pages, uploads, stickers] = await Promise.all([
        supabase.from("pages").select("id", { count: "exact", head: true }),
        supabase.from("uploads").select("size_bytes", { count: "exact" }),
        supabase.from("stickers").select("id", { count: "exact", head: true }),
      ]);
      const totalBytes = (uploads.data ?? []).reduce((acc: number, r: any) => acc + (r.size_bytes ?? 0), 0);
      return {
        pages: pages.count ?? 0,
        uploads: uploads.count ?? 0,
        stickers: stickers.count ?? 0,
        bytes: totalBytes,
      };
    },
  });

  const onCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "");
    const slug = String(fd.get("slug") ?? "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
    const description = String(fd.get("description") ?? "");
    try {
      const a = await createAlbum({ name, slug, description });
      toast.success("Álbum criado");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["albums"] });
      nav({ to: "/admin/albums/$albumId", params: { albumId: a.id } });
    } catch (err: any) {
      toast.error(err.message);
    } finally { setBusy(false); }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Excluir este álbum?")) return;
    await deleteAlbum(id);
    qc.invalidateQueries({ queryKey: ["albums"] });
    toast.success("Excluído");
  };

  if (!isAdmin) return null;

  const fmtBytes = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
    if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`;
    return `${(b / 1024 ** 3).toFixed(2)} GB`;
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Gerencie álbuns, páginas e exportações.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" /> Novo álbum</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo álbum</DialogTitle></DialogHeader>
              <form onSubmit={onCreate} className="space-y-3">
                <div><Label>Nome</Label><Input name="name" required /></div>
                <div><Label>Slug (URL)</Label><Input name="slug" required placeholder="copa-2026" /></div>
                <div><Label>Descrição</Label><Textarea name="description" rows={3} /></div>
                <Button type="submit" className="w-full" disabled={busy}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={AlbumIcon} label="Álbuns" value={albums.length} />
          <StatCard icon={FileText} label="Páginas" value={stats?.pages ?? 0} />
          <StatCard icon={FileImage} label="Figurinhas" value={stats?.stickers ?? 0} />
          <StatCard icon={FileImage} label="Uploads" value={stats?.uploads ?? 0} sub={stats ? fmtBytes(stats.bytes) : ""} />
        </div>

        <h2 className="text-xl font-semibold mb-3">Seus álbuns</h2>
        {albums.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum álbum criado. Comece pelo botão <strong>Novo álbum</strong>.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {albums.map((a) => (
              <Card key={a.id} className="overflow-hidden">
                <div className="aspect-[21/8] bg-gradient-to-br from-primary/20 to-accent/20" style={{ backgroundImage: a.cover_url ? `url(${a.cover_url})` : undefined, backgroundSize: "cover" }} />
                <CardContent className="p-4">
                  <div className="font-semibold">{a.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2 mb-3 min-h-[2rem]">{a.description}</div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" className="flex-1"><Link to="/admin/albums/$albumId" params={{ albumId: a.id }}><Pencil className="w-3.5 h-3.5 mr-1" /> Editar</Link></Button>
                    <Button asChild size="sm" variant="outline"><Link to="/album/$slug" params={{ slug: a.slug }}>Ver</Link></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(a.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: number; sub?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground font-medium flex items-center gap-2"><Icon className="w-4 h-4" /> {label}</CardTitle></CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tabular-nums">{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}