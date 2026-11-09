import { Link } from 'react-router-dom';
import { ArrowLeft, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground text-center">
      <div className="mb-8">
        <Logo to="/" />
      </div>

      <div className="h-16 w-16 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mb-6">
        <FileQuestion className="h-8 w-8" />
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-2">Página não encontrada</h1>
      <p className="text-sm text-muted-foreground max-w-sm mb-8">
        O endereço solicitado não existe ou foi movido. Verifique o link ou retorne à página inicial.
      </p>

      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Página inicial
          </Link>
        </Button>
        <Button asChild>
          <Link to="/app">Ir para o painel</Link>
        </Button>
      </div>
    </div>
  );
}
