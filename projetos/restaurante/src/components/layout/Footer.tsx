import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/logo';

export function Footer() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="border-t border-border bg-card/40 text-foreground transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <Logo />
            <p className="text-sm text-muted-foreground max-w-sm">
              Gestão de restaurantes, mesas e pedidos.
            </p>
            <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-md">
              Gerencie mesas, cardápio, pedidos, cozinha e equipe em um único sistema, criado para funcionar tanto online quanto offline.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">
              Produto
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo('recursos')}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Recursos
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo('como-funciona')}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Como funciona
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo('para-restaurantes')}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Para restaurantes
                </button>
              </li>
              <li>
                <Link
                  to="/evidence"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Evidências de Testes E2E
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">
              Conta
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/login"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Entrar
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Criar conta
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2026 Olivelas Restaurant. Todos os direitos reservados.</p>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>Sistema operacional e sincronização ativa</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
