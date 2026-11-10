import { useState } from "react";
import { Link2, FileText, History, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProductScraper } from "@/components/ProductScraper";
import { ProductHistory } from "@/components/ProductHistory";
import { TemplateManager } from "@/components/TemplateManager";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

type Tab = "scraper" | "history" | "templates";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "scraper", label: "Coletar", icon: <Link2 className="h-4 w-4" /> },
  { id: "history", label: "Histórico", icon: <History className="h-4 w-4" /> },
  { id: "templates", label: "Templates", icon: <FileText className="h-4 w-4" /> },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("scraper");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center glow-primary">
              <Link2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground tracking-tight">Olivelas - Link Promo & Afiliados</h1>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="border-b border-border bg-card/30">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {activeTab === "scraper" && <ProductScraper />}
        {activeTab === "history" && <ProductHistory />}
        {activeTab === "templates" && <TemplateManager />}
      </main>
    </div>
  );
};

export default Index;
