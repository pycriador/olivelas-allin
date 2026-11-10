import { useMemo } from "react";
import { useBuilder } from "@/modules/form-builder/store";
import { REGISTRY } from "@/modules/form-fields/registry";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import type { FieldOption } from "@/modules/form-builder/types";

export function Inspector() {
  const selectedId = useBuilder((s) => s.selectedFieldId);
  const field = useBuilder((s) => {
    const page = s.schema.pages.find((p) => p.id === s.activePageId) ?? s.schema.pages[0];
    return page.fields.find((f) => f.id === selectedId) ?? null;
  });
  const updateField = useBuilder((s) => s.updateField);
  const title = useBuilder((s) => s.title);
  const setTitle = useBuilder((s) => s.setTitle);

  const supportsOptions = useMemo(
    () => !!field && ["radio", "select", "multi_select"].includes(field.type),
    [field],
  );

  if (!field) {
    return (
      <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Formulário</p>
          <Label htmlFor="form-title">Título</Label>
          <Input id="form-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <p className="text-xs text-muted-foreground">Selecione um campo no canvas para editar suas propriedades.</p>
      </div>
    );
  }

  const def = REGISTRY[field.type];

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 text-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Campo</p>
        <p className="font-medium">{def.label}</p>
      </div>

      <Section title="Básico">
        <FRow label="Rótulo">
          <Input value={field.label} onChange={(e) => updateField(field.id, { label: e.target.value })} />
        </FRow>
        <FRow label="Nome interno">
          <Input value={field.name} onChange={(e) => updateField(field.id, { name: e.target.value.replace(/\s+/g, "_") })} />
        </FRow>
        <FRow label="Descrição">
          <Textarea rows={2} value={field.description ?? ""}
            onChange={(e) => updateField(field.id, { description: e.target.value })} />
        </FRow>
        <FRow label="Placeholder">
          <Input value={field.placeholder ?? ""}
            onChange={(e) => updateField(field.id, { placeholder: e.target.value })} />
        </FRow>
        <FRow label="Ajuda">
          <Input value={field.help ?? ""}
            onChange={(e) => updateField(field.id, { help: e.target.value })} />
        </FRow>
      </Section>

      <Section title="Comportamento">
        <ToggleRow label="Obrigatório" checked={!!field.required} onChange={(v) => updateField(field.id, { required: v })} />
        <ToggleRow label="Somente leitura" checked={!!field.readOnly} onChange={(v) => updateField(field.id, { readOnly: v })} />
        <ToggleRow label="Oculto" checked={!!field.hidden} onChange={(v) => updateField(field.id, { hidden: v })} />
      </Section>

      {(field.type === "number" || field.type === "decimal") && (
        <Section title="Limites">
          <div className="grid grid-cols-2 gap-2">
            <FRow label="Mínimo">
              <Input type="number" value={field.min ?? ""}
                onChange={(e) => updateField(field.id, { min: e.target.value === "" ? undefined : Number(e.target.value) })} />
            </FRow>
            <FRow label="Máximo">
              <Input type="number" value={field.max ?? ""}
                onChange={(e) => updateField(field.id, { max: e.target.value === "" ? undefined : Number(e.target.value) })} />
            </FRow>
          </div>
        </Section>
      )}

      {(field.type === "short_text" || field.type === "long_text") && (
        <Section title="Limites">
          <FRow label="Máx. caracteres">
            <Input type="number" value={field.maxLength ?? ""}
              onChange={(e) => updateField(field.id, { maxLength: e.target.value === "" ? undefined : Number(e.target.value) })} />
          </FRow>
        </Section>
      )}

      {supportsOptions && (
        <Section title="Opções">
          <div className="flex flex-col gap-2">
            {(field.options ?? []).map((opt, i) => (
              <div key={opt.id} className="flex items-center gap-2">
                <Input value={opt.label}
                  onChange={(e) => {
                    const options = [...(field.options ?? [])];
                    options[i] = { ...opt, label: e.target.value, value: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_") };
                    updateField(field.id, { options });
                  }} />
                <Button size="icon" variant="ghost"
                  onClick={() => updateField(field.id, { options: (field.options ?? []).filter((o) => o.id !== opt.id) })}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <Button size="sm" variant="outline"
              onClick={() => {
                const opt: FieldOption = { id: nanoid(6), label: "Nova opção", value: `opcao_${(field.options?.length ?? 0) + 1}` };
                updateField(field.id, { options: [...(field.options ?? []), opt] });
              }}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar opção
            </Button>
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3 first:border-t-0 first:pt-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}
function FRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}