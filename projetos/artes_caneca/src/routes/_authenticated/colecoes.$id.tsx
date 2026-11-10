import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/colecoes/$id")({ component: ColecaoDetail });

function ColecaoDetail() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["collection", id],
    queryFn: async () => {
      const [{ data: c }, { data: arts }] = await Promise.all([
        supabase.from("collections").select("*").eq("id", id).maybeSingle(),
        supabase.from("arts").select("id, name, image_url, tags").eq("collection_id", id).order("created_at", { ascending: false }),
      ]);
      return { collection: c, arts: arts ?? [] };
    },
  });

  if (isLoading) return <div className="h-40 rounded-xl bg-muted animate-pulse" />;
  if (!data?.collection) return <p>Coleção não encontrada.</p>;

  const c = data.collection;
  return (
    <div className="space-y-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2"><Link to="/colecoes"><ArrowLeft className="h-4 w-4 mr-1" /> Coleções</Link></Button>

      <header className="grid md:grid-cols-[1fr_2fr] gap-6 items-end">
        <div className="aspect-[4/3] rounded-2xl overflow-hidden border bg-muted shadow-card">
          {c.cover_url ? (
            <img src={c.cover_url} alt={c.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-surface flex items-center justify-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Coleção</p>
          <h1 className="text-4xl font-display font-semibold mt-1">{c.name}</h1>
          {c.description && <p className="mt-3 text-muted-foreground">{c.description}</p>}
          <p className="mt-4 text-sm text-muted-foreground">{data.arts.length} arte(s)</p>
        </div>
      </header>

      {data.arts.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">Nenhuma arte nesta coleção.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {data.arts.map((a: any) => (
            <Link key={a.id} to="/artes/$id" params={{ id: a.id }} className="group">
              <div className="aspect-square rounded-xl overflow-hidden border bg-muted shadow-card group-hover:shadow-elegant transition-smooth">
                <img src={a.image_url} alt={a.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <p className="mt-2 text-sm font-medium truncate">{a.name}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
