import { useState } from "react";
import { Plus, X, Save, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import type { FieldDef, FilterConfig, FilterOp, FilterRule } from "./types";

const OPS: { value: FilterOp; label: string; needsValue: boolean }[] = [
  { value: "eq", label: "=", needsValue: true },
  { value: "neq", label: "≠", needsValue: true },
  { value: "contains", label: "contém", needsValue: true },
  { value: "gt", label: ">", needsValue: true },
  { value: "gte", label: "≥", needsValue: true },
  { value: "lt", label: "<", needsValue: true },
  { value: "lte", label: "≤", needsValue: true },
  { value: "is_null", label: "vazio", needsValue: false },
  { value: "not_null", label: "preenchido", needsValue: false },
];

interface Props {
  table: string;
  fields: FieldDef[];
  config: FilterConfig;
  onChange: (c: FilterConfig) => void;
}

export function FilterBuilder({ table, fields, config, onChange }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [presetName, setPresetName] = useState("");

  const presets = useQuery({
    queryKey: ["filtros_salvos", table, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filtros_salvos").select("*")
        .eq("tabela", table).eq("is_last", false)
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const savePreset = useMutation({
    mutationFn: async () => {
      if (!presetName.trim()) throw new Error("Dê um nome ao preset");
      const { error } = await supabase.from("filtros_salvos").insert({
        user_id: user!.id, tabela: table, nome: presetName.trim(),
        config: config as never, is_last: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Preset salvo");
      setPresetName("");
      qc.invalidateQueries({ queryKey: ["filtros_salvos", table] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePreset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("filtros_salvos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["filtros_salvos", table] }),
  });

  const addRule = () => {
    const first = fields[0];
    if (!first) return;
    onChange({ rules: [...config.rules, { field: first.name, op: "eq", value: "" }] });
  };
  const updateRule = (i: number, patch: Partial<FilterRule>) => {
    const rules = config.rules.map((r, idx) => idx === i ? { ...r, ...patch } : r);
    onChange({ rules });
  };
  const removeRule = (i: number) => onChange({ rules: config.rules.filter((_, idx) => idx !== i) });
  const clearAll = () => onChange({ rules: [] });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="font-display text-[10px] gap-1">
          FILTROS {config.rules.length > 0 && <span className="text-primary">[{config.rules.length}]</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[520px] p-3 space-y-3" align="end">
        <div className="flex items-center justify-between">
          <span className="font-display text-[10px] neon-text-cyan">FILTROS DINÂMICOS</span>
          {config.rules.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="font-mono text-base h-7">limpar</Button>
          )}
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {config.rules.length === 0 && (
            <p className="font-mono text-base text-muted-foreground text-center py-3">
              Nenhum filtro. Adicione um abaixo.
            </p>
          )}
          {config.rules.map((r, i) => {
            const field = fields.find((f) => f.name === r.field);
            const op = OPS.find((o) => o.value === r.op)!;
            return (
              <div key={i} className="flex items-center gap-1">
                <Combobox
                  value={r.field}
                  onChange={(v) => v && updateRule(i, { field: v })}
                  options={fields.map((f) => ({ value: f.name, label: f.label }))}
                  allowClear={false}
                  className="h-9 flex-1"
                />
                <Select value={r.op} onValueChange={(v) => updateRule(i, { op: v as FilterOp })}>
                  <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OPS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {op.needsValue && (
                  field?.type === "select" && field.options ? (
                    <Combobox
                      value={r.value ?? null}
                      onChange={(v) => updateRule(i, { value: v ?? "" })}
                      options={field.options}
                      className="h-9 flex-1"
                    />
                  ) : (
                    <Input
                      value={r.value ?? ""}
                      onChange={(e) => updateRule(i, { value: e.target.value })}
                      placeholder="valor"
                      type={field?.type === "number" ? "number" : field?.type === "date" ? "date" : "text"}
                      className="h-9 flex-1 font-mono"
                    />
                  )
                )}
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeRule(i)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>

        <Button variant="outline" size="sm" onClick={addRule} className="w-full font-mono text-base">
          <Plus className="h-4 w-4 mr-1" /> Adicionar filtro
        </Button>

        <div className="border-t border-border pt-3 space-y-2">
          <span className="font-display text-[10px] text-muted-foreground">PRESETS</span>
          <div className="flex gap-1">
            <Input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Nome do preset..."
              className="h-9 font-mono"
            />
            <Button
              size="sm"
              onClick={() => savePreset.mutate()}
              disabled={!presetName.trim() || config.rules.length === 0}
              className="font-display text-[10px]"
            >
              <Save className="h-3 w-3 mr-1" /> SALVAR
            </Button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {presets.data?.map((p) => (
              <div key={p.id} className="flex items-center gap-1 group">
                <Button
                  variant="ghost" size="sm"
                  onClick={() => onChange((p.config as unknown as FilterConfig) ?? { rules: [] })}
                  className="flex-1 justify-start font-mono text-base h-8"
                >
                  ▶ {p.nome}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100"
                  onClick={() => deletePreset.mutate(p.id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Apply filters to a Supabase query builder
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyFilters(query: any, config: FilterConfig, fields: FieldDef[]) {
  for (const r of config.rules) {
    const field = fields.find((f) => f.name === r.field);
    const v = r.value;
    switch (r.op) {
      case "eq": if (v !== undefined && v !== "") query = query.eq(r.field, coerce(v, field)); break;
      case "neq": if (v !== undefined && v !== "") query = query.neq(r.field, coerce(v, field)); break;
      case "contains": if (v) query = query.ilike(r.field, `%${v}%`); break;
      case "gt": if (v) query = query.gt(r.field, coerce(v, field)); break;
      case "gte": if (v) query = query.gte(r.field, coerce(v, field)); break;
      case "lt": if (v) query = query.lt(r.field, coerce(v, field)); break;
      case "lte": if (v) query = query.lte(r.field, coerce(v, field)); break;
      case "is_null": query = query.is(r.field, null); break;
      case "not_null": query = query.not(r.field, "is", null); break;
    }
  }
  return query;
}

function coerce(v: string, f?: FieldDef) {
  if (!f) return v;
  if (f.type === "number") return Number(v);
  if (f.type === "boolean") return v === "true";
  return v;
}
