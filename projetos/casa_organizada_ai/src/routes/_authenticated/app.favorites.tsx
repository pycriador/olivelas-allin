import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Star, LibraryBig, Palette } from "lucide-react";
import type { MarketTemplate, MarketTheme } from "@/modules/marketplace/api";

export const Route = createFileRoute("/_authenticated/app/favorites")({
  component: FavoritesPage,
});

async function fetchFavoriteTemplates(): Promise<MarketTemplate[]> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return [];
  const { data } = await supabase
    .from("user_template_favorites")
    .select("templates(*)")
    .eq("user_id", u.user.id);
  return ((data ?? []).map((r) => (r as unknown as { templates: MarketTemplate }).templates)).filter(Boolean) as MarketTemplate[];
}

async function fetchFavoriteThemes(): Promise<MarketTheme[]> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return [];
  const { data } = await supabase
    .from("theme_favorites")
    .select("themes(*)")
    .eq("user_id", u.user.id);
  return ((data ?? []).map((r) => (r as unknown as { themes: MarketTheme }).themes)).filter(Boolean) as MarketTheme[];
}

function FavoritesPage() {
  const tplQ = useQuery({ queryKey: ["favorites","templates"], queryFn: fetchFavoriteTemplates });
  const thQ = useQuery({ queryKey: ["favorites","themes"], queryFn: fetchFavoriteThemes });

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Meus favoritos</h1>
        <p className="text-muted-foreground">Tudo o que você marcou com <Heart className="inline h-4 w-4 fill-red-500 text-red-500" /> em um só lugar.</p>
      </div>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><LibraryBig className="h-5 w-5" />Templates favoritos</h2>
        {tplQ.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
        ) : (tplQ.data ?? []).length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">Nenhum template favoritado ainda. <Link to={"/app/marketplace" as "/app"} className="text-primary underline">Explorar</Link></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tplQ.data!.map((t) => (
              <Card key={t.id} className="flex flex-col gap-2 p-5">
                <Badge variant="secondary" className="w-fit">{t.category}</Badge>
                <Link to={"/app/marketplace/template/$id" as "/app"} params={{ id: t.id } as never} className="font-display text-lg font-semibold hover:underline">{t.title}</Link>
                <p className="line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
                <div className="mt-auto flex items-center gap-3 pt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5" />{t.rating_avg.toFixed(1)}</span>
                  <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{t.favorites_count}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><Palette className="h-5 w-5" />Temas favoritos</h2>
        {thQ.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
        ) : (thQ.data ?? []).length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">Nenhum tema favoritado. <Link to={"/app/marketplace/themes" as "/app"} className="text-primary underline">Explorar temas</Link></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {thQ.data!.map((t) => {
              const c = t.tokens?.colors ?? {};
              return (
                <Card key={t.id} className="overflow-hidden">
                  <div className="h-20 w-full" style={{ background: `linear-gradient(135deg, ${c.primary ?? "#7C5CFF"} 0%, ${c.accent ?? "#F7A5A5"} 100%)` }} />
                  <div className="space-y-1 p-5">
                    <Link to={"/app/marketplace/theme/$id" as "/app"} params={{ id: t.id } as never} className="font-display text-lg font-semibold hover:underline">{t.title}</Link>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}