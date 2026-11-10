import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, GripVertical, Trash2 } from "lucide-react";
import { useBuilder } from "@/modules/form-builder/store";
import { REGISTRY } from "@/modules/form-fields/registry";
import type { Field } from "@/modules/form-builder/types";
import { Button } from "@/components/ui/button";

export function Canvas() {
  const activePageId = useBuilder((s) => s.activePageId);
  const page = useBuilder((s) => s.schema.pages.find((p) => p.id === s.activePageId) ?? s.schema.pages[0]);
  const selected = useBuilder((s) => s.selectedFieldId);
  const selectField = useBuilder((s) => s.selectField);

  const { setNodeRef, isOver } = useDroppable({ id: `page:${activePageId}` });

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div
        ref={setNodeRef}
        className={`rounded-2xl border ${isOver ? "border-primary bg-primary/5" : "border-border bg-card"} p-4 min-h-[60vh]`}
        onClick={() => selectField(null)}
      >
        {page.fields.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 p-16 text-center text-sm text-muted-foreground">
            Arraste um campo da esquerda ou clique em qualquer item da biblioteca.
          </div>
        ) : (
          <SortableContext items={page.fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3">
              {page.fields.map((f) => (
                <SortableFieldCard key={f.id} field={f} selected={selected === f.id} />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
}

function SortableFieldCard({ field, selected }: { field: Field; selected: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
    data: { source: "canvas", fieldId: field.id },
  });
  const selectField = useBuilder((s) => s.selectField);
  const duplicateField = useBuilder((s) => s.duplicateField);
  const removeField = useBuilder((s) => s.removeField);

  const def = REGISTRY[field.type];
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        selectField(field.id);
      }}
      className={`group relative rounded-xl border bg-background p-4 transition ${selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"} ${isDragging ? "opacity-60" : ""}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab rounded p-1 text-muted-foreground hover:bg-muted"
          aria-label="Arrastar"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {def.label}
        </span>
        {field.required && <span className="text-xs text-destructive">*</span>}
        <div className="ml-auto flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); duplicateField(field.id); }}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); removeField(field.id); }}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>
      {field.type !== "heading" && field.type !== "paragraph" && field.type !== "divider" && field.type !== "spacer" && (
        <label className="mb-1 block text-sm font-medium">{field.label}</label>
      )}
      {field.description && <p className="mb-2 text-xs text-muted-foreground">{field.description}</p>}
      <div className="pointer-events-none opacity-90">{def.render(field, field.defaultValue, () => {})}</div>
    </div>
  );
}