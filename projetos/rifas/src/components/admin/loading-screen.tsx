import { Shield } from "lucide-react";

export function AdminLoadingScreen({ label = "Abrindo Admin Console..." }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex size-20 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-amber-500/20" />
          <span className="flex size-16 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg dark:bg-amber-600">
            <Shield aria-hidden="true" className="size-8" />
          </span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="size-2 animate-bounce rounded-full bg-amber-500 [animation-delay:-0.3s]" />
            <div className="size-2 animate-bounce rounded-full bg-amber-500 [animation-delay:-0.15s]" />
            <div className="size-2 animate-bounce rounded-full bg-amber-500" />
          </div>
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">{label}</p>
          <p className="text-xs text-muted-foreground">Carregando painel de administracao</p>
        </div>
      </div>
    </div>
  );
}
