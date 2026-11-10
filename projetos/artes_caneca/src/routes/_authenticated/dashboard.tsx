import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FolderOpen, Image as ImageIcon, Users, Sparkles, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const [{ count: collections }, { count: arts }, { count: users }, { data: latest }] = await Promise.all([
        supabase.from("collections").select("*", { count: "exact", head: true }),
        supabase.from("arts").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("arts").select("id, name, image_url, created_at").order("created_at", { ascending: false }).limit(6),
      ]);
      return { collections: collections ?? 0, arts: arts ?? 0, users: users ?? 0, latest: latest ?? [] };
    },
  });
}

function Dashboard() {
  const { profile, user, role } = useAuth();
  const { data, isLoading } = useStats();
  const name = profile?.full_name ?? user?.email?.split("@")[0] ?? "você";

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Bem-vindo de volta</p>
          <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">Olá, {name}</h1>
        </div>
        {(role === "admin" || role === "editor") && (
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link to="/colecoes">Nova coleção</Link></Button>
            <Button asChild><Link to="/artes">Nova arte</Link></Button>
          </div>
        )}
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Coleções" value={data?.collections ?? 0} icon={FolderOpen} loading={isLoading} to="/colecoes" />
        <StatCard label="Artes" value={data?.arts ?? 0} icon={ImageIcon} loading={isLoading} to="/artes" />
        <StatCard label="Usuários" value={data?.users ?? 0} icon={Users} loading={isLoading} to={role === "admin" ? "/usuarios" : "/perfil"} />
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Artes recentes</h2>
          <Link to="/artes" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            Ver todas <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : data!.latest.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {data!.latest.map((a) => (
              <Link key={a.id} to="/artes/$id" params={{ id: a.id }} className="group">
                <div className="aspect-square rounded-xl overflow-hidden border bg-muted shadow-card group-hover:shadow-elegant transition-smooth">
                  <img src={a.image_url} alt={a.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <p className="mt-2 text-sm font-medium truncate">{a.name}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, loading, to }: { label: string; value: number; icon: any; loading: boolean; to: string }) {
  return (
    <Link to={to}>
      <Card className="shadow-card hover:shadow-elegant transition-smooth border-border/60 group">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center group-hover:bg-gradient-primary transition-smooth">
            <Icon className="h-4 w-4 text-accent-foreground group-hover:text-primary-foreground transition-smooth" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-display font-semibold tabular-nums">
            {loading ? <span className="inline-block h-9 w-16 bg-muted rounded animate-pulse" /> : value}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-12 w-12 rounded-xl bg-gradient-primary shadow-elegant flex items-center justify-center mb-4">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <h3 className="font-semibold">Comece adicionando uma arte</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">Faça upload de capas, organize em coleções e deixe a IA gerar descrições, cores e tags.</p>
        <Button asChild className="mt-4"><Link to="/artes">Adicionar arte</Link></Button>
      </CardContent>
    </Card>
  );
}
