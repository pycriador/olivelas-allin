import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary-light)/0.3)_0%,_transparent_70%)] flex items-center justify-center px-4">
      <div className="text-center max-w-sm animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-heading font-bold text-muted-foreground/40">404</span>
        </div>
        <h1 className="text-2xl font-heading font-bold text-foreground mb-2">Página não encontrada</h1>
        <p className="text-sm text-muted-foreground/80 mb-8 leading-relaxed">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o início
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
