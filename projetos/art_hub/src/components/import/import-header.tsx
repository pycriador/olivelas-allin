import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ImagePlus, FolderPlus, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { importStore } from "@/lib/upload/import-store";

export function ImportHeader() {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Importação Inteligente</h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          Envie múltiplas imagens de uma vez. A IA cataloga automaticamente enquanto você continua
          navegando — o processamento nunca bloqueia sua interface.
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) importStore.addFiles(files);
            e.target.value = "";
          }}
        />
        <Button onClick={() => inputRef.current?.click()}>
          <ImagePlus className="mr-2 h-4 w-4" /> Selecionar Imagens
        </Button>
        <Button variant="outline" asChild>
          <Link to="/admin/collections/new">
            <FolderPlus className="mr-2 h-4 w-4" /> Nova Coleção
          </Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link to="/admin/ai/monitor">
            <History className="mr-2 h-4 w-4" /> Histórico
          </Link>
        </Button>
      </div>
    </header>
  );
}
