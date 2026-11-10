// Field registry — single source of truth for every field type.
// Each entry knows: how to render (viewer & preview), its default field payload,
// its icon, its display name, and its category in the sidebar palette.
// New field types are added here; the builder discovers them automatically.

import type { ReactNode } from "react";
import { nanoid } from "nanoid";
import {
  Type, AlignLeft, Hash, Sigma, Calendar, Clock, CalendarClock,
  CheckSquare, ToggleRight, CircleDot, ListChecks, List,
  Heading1, Text as TextIcon, Minus, Move,
} from "lucide-react";
import type { Field, FieldType } from "@/modules/form-builder/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export type FieldCategory = "basic" | "layout";

export type FieldDefinition = {
  type: FieldType;
  label: string;
  icon: typeof Type;
  category: FieldCategory;
  defaults: () => Field;
  render: (field: Field, value: unknown, onChange: (v: unknown) => void) => ReactNode;
};

function base(type: FieldType, label: string, extra: Partial<Field> = {}): Field {
  return {
    id: nanoid(8),
    type,
    name: `${type}_${nanoid(4)}`,
    label,
    ...extra,
  };
}

function optDefaults(): { options: Field["options"] } {
  return {
    options: [
      { id: nanoid(6), label: "Opção 1", value: "opcao_1" },
      { id: nanoid(6), label: "Opção 2", value: "opcao_2" },
    ],
  };
}

export const REGISTRY: Record<FieldType, FieldDefinition> = {
  short_text: {
    type: "short_text", label: "Texto curto", icon: Type, category: "basic",
    defaults: () => base("short_text", "Texto curto", { placeholder: "Digite..." }),
    render: (f, v, onChange) => (
      <Input value={(v as string) ?? ""} placeholder={f.placeholder}
        readOnly={f.readOnly} maxLength={f.maxLength}
        onChange={(e) => onChange(e.target.value)} />
    ),
  },
  long_text: {
    type: "long_text", label: "Texto longo", icon: AlignLeft, category: "basic",
    defaults: () => base("long_text", "Texto longo", { placeholder: "Escreva aqui..." }),
    render: (f, v, onChange) => (
      <Textarea value={(v as string) ?? ""} placeholder={f.placeholder}
        readOnly={f.readOnly} maxLength={f.maxLength} rows={4}
        onChange={(e) => onChange(e.target.value)} />
    ),
  },
  number: {
    type: "number", label: "Número", icon: Hash, category: "basic",
    defaults: () => base("number", "Número"),
    render: (f, v, onChange) => (
      <Input type="number" step={1} value={(v as string) ?? ""} placeholder={f.placeholder}
        readOnly={f.readOnly} min={f.min} max={f.max}
        onChange={(e) => onChange(e.target.value)} />
    ),
  },
  decimal: {
    type: "decimal", label: "Decimal", icon: Sigma, category: "basic",
    defaults: () => base("decimal", "Decimal"),
    render: (f, v, onChange) => (
      <Input type="number" step="0.01" value={(v as string) ?? ""} placeholder={f.placeholder}
        readOnly={f.readOnly} min={f.min} max={f.max}
        onChange={(e) => onChange(e.target.value)} />
    ),
  },
  date: {
    type: "date", label: "Data", icon: Calendar, category: "basic",
    defaults: () => base("date", "Data"),
    render: (f, v, onChange) => (
      <Input type="date" value={(v as string) ?? ""} readOnly={f.readOnly}
        onChange={(e) => onChange(e.target.value)} />
    ),
  },
  time: {
    type: "time", label: "Hora", icon: Clock, category: "basic",
    defaults: () => base("time", "Hora"),
    render: (f, v, onChange) => (
      <Input type="time" value={(v as string) ?? ""} readOnly={f.readOnly}
        onChange={(e) => onChange(e.target.value)} />
    ),
  },
  datetime: {
    type: "datetime", label: "Data e hora", icon: CalendarClock, category: "basic",
    defaults: () => base("datetime", "Data e hora"),
    render: (f, v, onChange) => (
      <Input type="datetime-local" value={(v as string) ?? ""} readOnly={f.readOnly}
        onChange={(e) => onChange(e.target.value)} />
    ),
  },
  checkbox: {
    type: "checkbox", label: "Checkbox", icon: CheckSquare, category: "basic",
    defaults: () => base("checkbox", "Marcar opção"),
    render: (f, v, onChange) => (
      <label className="inline-flex items-center gap-2">
        <Checkbox checked={Boolean(v)} disabled={f.readOnly}
          onCheckedChange={(c) => onChange(Boolean(c))} />
        <span className="text-sm">{f.placeholder ?? "Sim"}</span>
      </label>
    ),
  },
  switch: {
    type: "switch", label: "Switch", icon: ToggleRight, category: "basic",
    defaults: () => base("switch", "Ativar"),
    render: (f, v, onChange) => (
      <div className="flex items-center gap-2">
        <Switch checked={Boolean(v)} disabled={f.readOnly}
          onCheckedChange={(c) => onChange(Boolean(c))} />
        <span className="text-sm text-muted-foreground">{f.placeholder}</span>
      </div>
    ),
  },
  radio: {
    type: "radio", label: "Radio", icon: CircleDot, category: "basic",
    defaults: () => base("radio", "Escolha uma opção", optDefaults()),
    render: (f, v, onChange) => (
      <RadioGroup value={(v as string) ?? ""} onValueChange={onChange} disabled={f.readOnly}>
        {(f.options ?? []).map((o) => (
          <div key={o.id} className="flex items-center gap-2">
            <RadioGroupItem value={o.value} id={`${f.id}-${o.id}`} />
            <Label htmlFor={`${f.id}-${o.id}`}>{o.label}</Label>
          </div>
        ))}
      </RadioGroup>
    ),
  },
  select: {
    type: "select", label: "Select", icon: List, category: "basic",
    defaults: () => base("select", "Selecione", optDefaults()),
    render: (f, v, onChange) => (
      <Select value={(v as string) ?? ""} onValueChange={onChange} disabled={f.readOnly}>
        <SelectTrigger><SelectValue placeholder={f.placeholder ?? "Selecione..."} /></SelectTrigger>
        <SelectContent>
          {(f.options ?? []).map((o) => (
            <SelectItem key={o.id} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    ),
  },
  multi_select: {
    type: "multi_select", label: "Multi select", icon: ListChecks, category: "basic",
    defaults: () => base("multi_select", "Selecione várias", optDefaults()),
    render: (f, v, onChange) => {
      const arr = Array.isArray(v) ? (v as string[]) : [];
      const toggle = (val: string) =>
        onChange(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
      return (
        <div className="grid gap-2">
          {(f.options ?? []).map((o) => (
            <label key={o.id} className="flex items-center gap-2 text-sm">
              <Checkbox checked={arr.includes(o.value)} disabled={f.readOnly}
                onCheckedChange={() => toggle(o.value)} />
              {o.label}
            </label>
          ))}
        </div>
      );
    },
  },
  heading: {
    type: "heading", label: "Título", icon: Heading1, category: "layout",
    defaults: () => base("heading", "Título da seção"),
    render: (f) => <h3 className="font-display text-xl font-semibold">{f.label}</h3>,
  },
  paragraph: {
    type: "paragraph", label: "Texto explicativo", icon: TextIcon, category: "layout",
    defaults: () => base("paragraph", "Texto explicativo do formulário."),
    render: (f) => <p className="text-sm text-muted-foreground">{f.label}</p>,
  },
  divider: {
    type: "divider", label: "Separador", icon: Minus, category: "layout",
    defaults: () => base("divider", "Separador"),
    render: () => <hr className="border-border" />,
  },
  spacer: {
    type: "spacer", label: "Espaçador", icon: Move, category: "layout",
    defaults: () => base("spacer", "Espaçador"),
    render: () => <div className="h-6" />,
  },
};

export const FIELD_LIST: FieldDefinition[] = Object.values(REGISTRY);

export function createField(type: FieldType): Field {
  return REGISTRY[type].defaults();
}

export function isDisplayField(t: FieldType) {
  return t === "heading" || t === "paragraph" || t === "divider" || t === "spacer";
}