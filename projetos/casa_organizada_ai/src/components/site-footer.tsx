import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            Organize toda sua vida em um único lugar — casa, pets, estudos, trabalho e muito mais.
          </p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Produto</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/recursos" className="hover:text-foreground">Recursos</Link></li>
            <li><Link to="/" hash="templates" className="hover:text-foreground">Templates</Link></li>
            <li><Link to="/" hash="categorias" className="hover:text-foreground">Categorias</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Empresa</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/sobre" className="hover:text-foreground">Sobre</Link></li>
            <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
            <li><Link to="/contato" className="hover:text-foreground">Contato</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Conta</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth" className="hover:text-foreground">Entrar</Link></li>
            <li><Link to="/auth" search={{ mode: "signup" }} className="hover:text-foreground">Criar conta</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} HomeFlow. Todos os direitos reservados.</p>
          <p>Feito com carinho.</p>
        </div>
      </div>
    </footer>
  );
}