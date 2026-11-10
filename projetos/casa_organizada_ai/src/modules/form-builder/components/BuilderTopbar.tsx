import { useStore } from "zustand";
import { ArrowLeft, Redo2, Undo2, CloudUpload, CheckCircle2, Loader2, Printer } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBuilder, useBuilderTemporal } from "@/modules/form-builder/store";

export function BuilderTopbar({ saving }: { saving: boolean }) {
  const title = useBuilder((s) => s.title);
  const setTitle = useBuilder((s) => s.setTitle);
  const dirty = useBuilder((s) => s.dirty);

  const undo = useStore(useBuilderTemporal, (s) => s.undo);
  const redo = useStore(useBuilderTemporal, (s) => s.redo);
  const pastStates = useStore(useBuilderTemporal, (s) => s.pastStates);
  const futureStates = useStore(useBuilderTemporal, (s) => s.futureStates);
  const formId = useBuilder((s) => s.formId);

  return (
    <div className="flex h-14 items-center gap-3 border-b border-border bg-background px-4">
      <Button asChild variant="ghost" size="icon">
        <Link to="/app/forms"><ArrowLeft className="h-4 w-4" /></Link>
      </Button>
      <Input value={title} onChange={(e) => setTitle(e.target.value)}
        className="max-w-sm border-transparent bg-transparent text-base font-semibold focus-visible:bg-muted" />
      <div className="ml-auto flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando...</>
            : dirty ? <>Alterações não salvas</>
            : <><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Salvo</>}
        </span>
        <Button size="icon" variant="ghost" disabled={pastStates.length === 0}
          onClick={() => undo()} aria-label="Desfazer"><Undo2 className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" disabled={futureStates.length === 0}
          onClick={() => redo()} aria-label="Refazer"><Redo2 className="h-4 w-4" /></Button>
        {formId && (
          <Button asChild size="sm" variant="outline">
            <Link to="/app/forms/$id/print" params={{ id: formId }}>
              <Printer className="mr-1.5 h-4 w-4" /> Imprimir / PDF
            </Link>
          </Button>
        )}
        <Button size="sm" variant="outline" disabled>
          <CloudUpload className="mr-1.5 h-4 w-4" /> Publicar
        </Button>
      </div>
    </div>
  );
}