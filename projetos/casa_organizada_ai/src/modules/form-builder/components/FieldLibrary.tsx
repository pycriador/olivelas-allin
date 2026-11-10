import { useDraggable } from "@dnd-kit/core";
import { FIELD_LIST, type FieldDefinition } from "@/modules/form-fields/registry";
import { useBuilder } from "@/modules/form-builder/store";

export function FieldLibrary() {
  const groups: Record<string, FieldDefinition[]> = { basic: [], layout: [] };
  for (const f of FIELD_LIST) groups[f.category].push(f);
  const labels: Record<string, string> = { basic: "Campos básicos", layout: "Layout" };

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      {Object.entries(groups).map(([key, list]) => (
        <div key={key}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {labels[key]}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {list.map((f) => <PaletteItem key={f.type} def={f} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function PaletteItem({ def }: { def: FieldDefinition }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${def.type}`,
    data: { source: "palette", type: def.type },
  });
  const addField = useBuilder((s) => s.addField);
  const Icon = def.icon;
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      onClick={() => addField(def.type)}
      className={`flex flex-col items-start gap-1 rounded-lg border border-border bg-card p-3 text-left text-xs transition hover:border-primary/40 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/40 ${isDragging ? "opacity-40" : ""}`}
    >
      <Icon className="h-4 w-4 text-primary" />
      <span className="font-medium leading-tight">{def.label}</span>
    </button>
  );
}