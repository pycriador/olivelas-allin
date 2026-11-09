import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";
import { useMemo } from "react";
import { useT } from "@/stores/i18n.store";

const labels: Record<string, string> = {
  projects: "Projects",
  favorites: "Favorites",
  templates: "Templates",
  library: "Library",
  trash: "Trash",
  settings: "Settings",
  admin: "Admin",
  search: "Search",
};

export function Breadcrumb() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const t = useT();

  const parts = useMemo(() => pathname.split("/").filter(Boolean), [pathname]);

  return (
    <nav className="flex items-center gap-1 text-xs text-muted-foreground">
      <Link to="/" className="flex items-center gap-1 hover:text-foreground">
        <Home className="h-3.5 w-3.5" />
        <span>{t("nav.dashboard")}</span>
      </Link>
      {parts.map((p, i) => {
        const isLast = i === parts.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 opacity-50" />
            <span className={isLast ? "font-medium text-foreground" : ""}>
              {labels[p] ?? decodeURIComponent(p)}
            </span>
          </span>
        );
      })}
    </nav>
  );
}
