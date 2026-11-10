import { useState } from "react";
import {
  DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors,
  type DragEndEvent, closestCenter,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { PanelRightClose, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBuilder } from "@/modules/form-builder/store";
import { useAutosave } from "@/modules/form-builder/hooks/useAutosave";
import { FieldLibrary } from "./FieldLibrary";
import { Canvas } from "./Canvas";
import { Inspector } from "./Inspector";
import { PreviewFrame } from "./PreviewFrame";
import { BuilderTopbar } from "./BuilderTopbar";
import type { FieldType } from "@/modules/form-builder/types";

export function BuilderShell() {
  const { saving } = useAutosave();
  const [previewOpen, setPreviewOpen] = useState(false);
  const addField = useBuilder((s) => s.addField);
  const moveField = useBuilder((s) => s.moveField);
  const pageFields = useBuilder((s) =>
    (s.schema.pages.find((p) => p.id === s.activePageId) ?? s.schema.pages[0]).fields,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeData = active.data.current as { source?: string; type?: FieldType; fieldId?: string } | undefined;
    if (activeData?.source === "palette" && activeData.type) {
      const overId = String(over.id);
      const insertIndex = overId.startsWith("page:")
        ? pageFields.length
        : Math.max(0, pageFields.findIndex((f) => f.id === overId));
      addField(activeData.type, insertIndex);
      return;
    }
    if (activeData?.source === "canvas" && activeData.fieldId) {
      const from = pageFields.findIndex((f) => f.id === activeData.fieldId);
      const to = pageFields.findIndex((f) => f.id === String(over.id));
      if (from >= 0 && to >= 0) moveField(from, to);
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <BuilderTopbar saving={saving} />
      <div className="flex items-center justify-end gap-2 border-b border-border bg-background/80 px-4 py-1.5">
        <Button size="sm" variant="ghost" onClick={() => setPreviewOpen((v) => !v)}>
          {previewOpen ? <><PanelRightClose className="mr-1.5 h-4 w-4" /> Propriedades</>
            : <><Eye className="mr-1.5 h-4 w-4" /> Preview</>}
        </Button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="grid min-h-0 flex-1 grid-cols-[260px_1fr_320px] xl:grid-cols-[280px_1fr_360px]">
          <aside className="border-r border-border bg-card/50">
            <FieldLibrary />
          </aside>
          <main className="min-w-0 overflow-y-auto bg-muted/20">
            <Canvas />
            <PageSwitcher />
          </main>
          <aside className="border-l border-border bg-card/50">
            {previewOpen ? <PreviewFrame /> : <Inspector />}
          </aside>
        </div>
      </DndContext>
    </div>
  );
}

function PageSwitcher() {
  const pages = useBuilder((s) => s.schema.pages);
  const activePageId = useBuilder((s) => s.activePageId);
  const setActivePage = useBuilder((s) => s.setActivePage);
  const addPage = useBuilder((s) => s.addPage);
  const removePage = useBuilder((s) => s.removePage);
  if (pages.length === 0) return null;
  return (
    <div className="mx-auto max-w-3xl px-6 pb-6">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2">
        {pages.map((p) => (
          <button key={p.id}
            onClick={() => setActivePage(p.id)}
            className={`rounded-md px-2 py-1 text-xs ${p.id === activePageId ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
            {p.title}
          </button>
        ))}
        <Button size="sm" variant="ghost" onClick={addPage}>+ Página</Button>
        {pages.length > 1 && (
          <Button size="sm" variant="ghost" className="ml-auto text-destructive"
            onClick={() => removePage(activePageId)}>Remover página</Button>
        )}
      </div>
    </div>
  );
}