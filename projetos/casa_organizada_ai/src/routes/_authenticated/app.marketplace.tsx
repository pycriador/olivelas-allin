import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LibraryBig, Palette, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/marketplace")({
  component: MarketplaceLayout,
});

function MarketplaceLayout() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const tabs: { to: string; label: string; icon: typeof LibraryBig; exact?: boolean }[] = [
    { to: "/app/marketplace", label: "Templates", icon: LibraryBig, exact: true },
    { to: "/app/marketplace/themes", label: "Temas", icon: Palette },
    { to: "/app/favorites", label: "Meus favoritos", icon: Heart },
  ];
  const isActive = (to: string, exact?: boolean) => (exact ? path === to : path.startsWith(to));

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Marketplace</h1>
        <p className="text-muted-foreground">
          Descubra templates e temas criados pela comunidade — favorite, avalie e reutilize.
        </p>
      </div>
      <nav className="flex flex-wrap gap-1 border-b border-border">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to as "/app/marketplace"}
            className={cn(
              "inline-flex items-center gap-2 rounded-t-md border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              isActive(t.to, t.exact)
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}