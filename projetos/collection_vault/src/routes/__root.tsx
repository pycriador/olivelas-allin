import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 arcade-grid">
      <div className="max-w-md text-center">
        <h1 className="text-7xl neon-text-pink font-display">404</h1>
        <h2 className="mt-6 text-xl font-display neon-text-cyan">GAME OVER</h2>
        <p className="mt-4 text-muted-foreground">Esta tela não existe na cartridge.</p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-display text-primary-foreground transition-all hover:scale-105 hover:shadow-[var(--shadow-neon-pink)]"
        >
          INSERT COIN
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Olivelas - Collection Vault" },
      { name: "description", content: "Catalogue, gerencie e caçe ofertas de jogos e consoles retrô. Cole tudo num só lugar." },
      { property: "og:title", content: "RetroVault — Sua coleção retrô em alta resolução" },
      { property: "og:description", content: "Catalogue, gerencie e caçe ofertas de jogos e consoles retrô. Cole tudo num só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "RetroVault — Sua coleção retrô em alta resolução" },
      { name: "twitter:description", content: "Catalogue, gerencie e caçe ofertas de jogos e consoles retrô. Cole tudo num só lugar." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0631cee9-966f-4367-94ef-04011b468be1/id-preview-0bbd54ad--76f0741a-6754-45a2-9faa-9e7a54e4da43.lovable.app-1778041627858.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0631cee9-966f-4367-94ef-04011b468be1/id-preview-0bbd54ad--76f0741a-6754-45a2-9faa-9e7a54e4da43.lovable.app-1778041627858.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&family=Space+Grotesk:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
