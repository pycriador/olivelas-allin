import { createFileRoute } from "@tanstack/react-router";
import { useFavorites } from "@/hooks/data";
import { SpecList } from "@/components/specs/spec-list";

export const Route = createFileRoute("/favorites")({
  component: FavoritesPage,
});

function FavoritesPage() {
  const { data, isLoading } = useFavorites();
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Favorites</h1>
        <p className="text-sm text-muted-foreground">Specifications you marked as favorite.</p>
      </div>
      <SpecList specs={data} isLoading={isLoading} emptyTitle="No favorites yet" />
    </div>
  );
}
