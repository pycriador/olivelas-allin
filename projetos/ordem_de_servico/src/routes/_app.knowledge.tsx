import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { BookOpen, LayoutDashboard, Library, Tags, Search, BarChart3, Upload, Settings } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nProvider";

export const Route = createFileRoute("/_app/knowledge")({
  head: () => ({ meta: [{ title: "Knowledge Platform — ServiceForge" }] }),
  component: KnowledgeLayout,
});

const tabs = [
  { id: "dashboard", label: "Dashboard", path: "/knowledge", icon: LayoutDashboard, exact: true },
  { id: "library", label: "Biblioteca", path: "/knowledge/library", icon: Library },
  { id: "categories", label: "Categorias", path: "/knowledge/categories", icon: Tags },
  { id: "search", label: "Pesquisa", path: "/knowledge/search", icon: Search },
  { id: "analytics", label: "Analytics", path: "/knowledge/analytics", icon: BarChart3 },
  { id: "import", label: "Importar", path: "/knowledge/import", icon: Upload },
];

function KnowledgeLayout() {
  const location = useLocation();
  const { t } = useTranslation();

  const currentTab = tabs.find((tab) => tab.exact ? location.pathname === "/knowledge" : location.pathname.startsWith(`/knowledge/${tab.id}`)) ?? tabs[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Knowledge Platform</h1>
            <p className="text-sm text-muted-foreground">Gestão do Conhecimento Técnico</p>
          </div>
        </div>
      </div>

      <div className="border-b">
        <nav className="flex gap-1 min-w-max">
          {tabs.map((tab) => {
            const isActive = tab.exact
              ? location.pathname === "/knowledge"
              : location.pathname.startsWith(`/knowledge/${tab.id}`);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                to={tab.path as any}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
