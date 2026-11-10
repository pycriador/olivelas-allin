import { REGISTRY, isDisplayField } from "@/modules/form-fields/registry";
import type { FormSchema } from "@/modules/form-builder/types";
import { useState } from "react";

export function FormPreview({ schema, title }: { schema: FormSchema; title: string }) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [pageIdx, setPageIdx] = useState(0);
  const page = schema.pages[pageIdx] ?? schema.pages[0];

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      {schema.pages.length > 1 && (
        <p className="mt-1 text-xs text-muted-foreground">
          Página {pageIdx + 1} de {schema.pages.length} — {page.title}
        </p>
      )}
      <div className="mt-6 flex flex-col gap-5">
        {page.fields.filter((f) => !f.hidden).map((f) => {
          const def = REGISTRY[f.type];
          return (
            <div key={f.id}>
              {!isDisplayField(f.type) && (
                <label className="mb-1 block text-sm font-medium">
                  {f.label}
                  {f.required && <span className="ml-1 text-destructive">*</span>}
                </label>
              )}
              {f.description && <p className="mb-2 text-xs text-muted-foreground">{f.description}</p>}
              {def.render(f, values[f.name], (v) => setValues((prev) => ({ ...prev, [f.name]: v })))}
              {f.help && <p className="mt-1 text-xs text-muted-foreground">{f.help}</p>}
            </div>
          );
        })}
      </div>
      {schema.pages.length > 1 && (
        <div className="mt-6 flex justify-between">
          <button className="text-sm text-muted-foreground disabled:opacity-40"
            disabled={pageIdx === 0} onClick={() => setPageIdx((i) => i - 1)}>← Anterior</button>
          <button className="text-sm text-primary disabled:opacity-40"
            disabled={pageIdx === schema.pages.length - 1} onClick={() => setPageIdx((i) => i + 1)}>Próxima →</button>
        </div>
      )}
    </div>
  );
}