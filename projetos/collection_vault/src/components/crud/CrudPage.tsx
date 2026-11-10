import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Pencil, Trash2, Download, Upload, FileDown, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Combobox } from "@/components/ui/combobox";
import { useAuth } from "@/lib/auth";
import { FilterBuilder, applyFilters } from "./FilterBuilder";
import { downloadTemplate, downloadData, parseCsv, coerceRow } from "@/lib/csv";
import type { FieldDef, FilterConfig } from "./types";

export type { FieldDef, FieldType } from "./types";

interface Props {
  table: string;
  title: string;
  subtitle?: string;
  fields: FieldDef[];
  columns?: string[];
  // optional row-level extras (e.g. gallery for jogos)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rowExtras?: (row: any) => ReactNode;
  // optional thumb column (shows image preview before columns)
  thumbField?: string;
}

const PAGE_SIZES = [10, 20, 50, 100];

export function CrudPage({ table, title, subtitle, fields, columns, rowExtras, thumbField }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = useState<any | null>(null);

  const storageKey = `lastFilter:${table}:${user?.id ?? ""}`;
  const [filters, setFilters] = useState<FilterConfig>({ rules: [] });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Auto-restore last filter
  useEffect(() => {
    if (!user) return;
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try { setFilters(JSON.parse(raw)); } catch { /* ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  useEffect(() => {
    if (!user) return;
    localStorage.setItem(storageKey, JSON.stringify(filters));
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const query = useQuery({
    queryKey: [table, user?.id, filters, page, pageSize],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = (supabase.from as any)(table).select("*", { count: "exact" });
      q = applyFilters(q, filters, fields);
      q = q.order("created_at", { ascending: false }).range(page * pageSize, page * pageSize + pageSize - 1);
      const { data, error, count } = await q;
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { rows: (data ?? []) as any[], count: count ?? 0 };
    },
    enabled: !!user,
  });

  const upsert = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (payload: any) => {
      const cleaned = { ...payload, user_id: user!.id };
      if (editing?.id) {
        const { error } = await (supabase.from as any)(table).update(cleaned).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from as any)(table).insert(cleaned);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Atualizado!" : "Criado!");
      qc.invalidateQueries({ queryKey: [table] });
      setOpen(false); setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: [table] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const cols = columns ?? fields.map((f) => f.name);
  const totalPages = Math.max(1, Math.ceil((query.data?.count ?? 0) / pageSize));

  // CSV
  const fileRef = useRef<HTMLInputElement>(null);
  const importCsv = useMutation({
    mutationFn: async (file: File) => {
      const rows = await parseCsv(file);
      const payload: Record<string, unknown>[] = rows.map((r) => ({
        ...coerceRow(r, fields),
        user_id: user!.id,
      }));
      // upsert by id when present, else insert
      const withId = payload.filter((p) => p.id);
      const noId = payload.filter((p) => !p.id);
      if (withId.length) {
        const { error } = await (supabase.from as any)(table).upsert(withId);
        if (error) throw error;
      }
      if (noId.length) {
        const { error } = await (supabase.from as any)(table).insert(noId);
        if (error) throw error;
      }
      return payload.length;
    },
    onSuccess: (n) => { toast.success(`${n} linhas importadas`); qc.invalidateQueries({ queryKey: [table] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const exportAll = async (filtered: boolean) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = (supabase.from as any)(table).select("*").limit(10000);
    if (filtered) q = applyFilters(q, filters, fields);
    const { data, error } = await q;
    if (error) return toast.error(error.message);
    downloadData(`${table}.csv`, fields, (data ?? []) as Record<string, unknown>[]);
  };

  return (
    <div>
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-xl neon-text-pink">{title}</h1>
          {subtitle && <p className="text-muted-foreground font-mono text-xl mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <FilterBuilder table={table} fields={fields} config={filters} onChange={setFilters} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="font-display text-[10px] gap-1">
                <Download className="h-3 w-3" /> CSV
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => downloadTemplate(`${table}_template.csv`, fields)}>
                <FileDown className="h-3 w-3 mr-2" /> Template em branco
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportAll(true)}>
                <Download className="h-3 w-3 mr-2" /> Exportar (filtrado)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportAll(false)}>
                <Download className="h-3 w-3 mr-2" /> Exportar tudo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileRef.current?.click()}>
                <Upload className="h-3 w-3 mr-2" /> Importar CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            ref={fileRef} type="file" accept=".csv" className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) importCsv.mutate(e.target.files[0]); e.target.value = ""; }}
          />

          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button className="font-display text-xs"><Plus className="h-4 w-4 mr-1" /> NOVO</Button>
            </DialogTrigger>
            <CrudDialog
              fields={fields} editing={editing}
              onSubmit={(data) => upsert.mutate(data)}
              loading={upsert.isPending}
              title={editing ? `Editar ${title}` : `Novo em ${title}`}
            />
          </Dialog>
        </div>
      </div>

      <div className="rounded-lg border-2 border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {thumbField && <TableHead className="w-16 font-display text-[10px]">IMG</TableHead>}
              {cols.map((c) => {
                const f = fields.find((x) => x.name === c);
                return <TableHead key={c} className="font-display text-[10px]">{f?.label ?? c}</TableHead>;
              })}
              <TableHead className="text-right font-display text-[10px]">AÇÕES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading && (
              <TableRow><TableCell colSpan={cols.length + 1 + (thumbField ? 1 : 0)} className="text-center py-8 font-mono text-xl">LOADING...</TableCell></TableRow>
            )}
            {!query.isLoading && (query.data?.rows.length ?? 0) === 0 && (
              <TableRow><TableCell colSpan={cols.length + 1 + (thumbField ? 1 : 0)} className="text-center py-8 font-mono text-xl text-muted-foreground">Nenhum registro. Pressione START.</TableCell></TableRow>
            )}
            {query.data?.rows.map((r) => (
              <TableRow key={r.id}>
                {thumbField && (
                  <TableCell>
                    {r[thumbField] ? (
                      <img src={r[thumbField]} alt="" className="w-12 h-12 object-cover rounded border-2 border-border" />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded border-2 border-border" />
                    )}
                  </TableCell>
                )}
                {cols.map((c) => {
                  const f = fields.find((x) => x.name === c);
                  const v = r[c];
                  let display: ReactNode;
                  if (f?.format) display = f.format(v);
                  else if (typeof v === "boolean") display = v ? "✓" : "—";
                  else if (f?.type === "select" && f.options) display = f.options.find((o) => o.value === v)?.label ?? v ?? "—";
                  else display = v ?? "—";
                  return <TableCell key={c} className="font-mono text-lg">{String(display ?? "—")}</TableCell>;
                })}
                <TableCell className="text-right whitespace-nowrap">
                  {rowExtras?.(r)}
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm("Remover?")) remove.mutate(r.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-base text-muted-foreground">Por página:</span>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
            <SelectTrigger className="w-20 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="font-mono text-base text-muted-foreground">
            Total: <span className="text-foreground">{query.data?.count ?? 0}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-mono text-base">{page + 1} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CrudDialog({
  fields, editing, onSubmit, loading, title,
}: {
  fields: FieldDef[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editing: any | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void;
  loading: boolean;
  title: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [form, setForm] = useState<Record<string, any>>({});
  useEffect(() => {
    const init: Record<string, unknown> = {};
    for (const f of fields) init[f.name] = editing?.[f.name] ?? (f.type === "boolean" ? false : "");
    setForm(init);
  }, [editing, fields]);

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: Record<string, any> = {};
    for (const f of fields) {
      let v = form[f.name];
      if (v === "" || v === undefined) v = null;
      if (f.type === "number" && v !== null) v = Number(v);
      payload[f.name] = v;
    }
    onSubmit(payload);
  };

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle className="font-display text-sm neon-text-cyan">{title}</DialogTitle></DialogHeader>
      <form onSubmit={handle} className="space-y-4">
        {fields.map((f) => (
          <div key={f.name} className="space-y-1.5">
            <Label className="font-mono text-lg">{f.label}{f.required && " *"}</Label>
            {renderField(f, form[f.name], (v: unknown) => setForm((s) => ({ ...s, [f.name]: v })))}
          </div>
        ))}
        <DialogFooter>
          <Button type="submit" disabled={loading} className="font-display text-xs">SALVAR</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderField(f: FieldDef, value: any, onChange: (v: unknown) => void): ReactNode {
  switch (f.type) {
    case "textarea":
      return <Textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} required={f.required} maxLength={2000} />;
    case "number":
      return <Input type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value)} required={f.required} step="any" />;
    case "date":
      return <Input type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)} required={f.required} />;
    case "boolean":
      return (
        <Select value={value ? "true" : "false"} onValueChange={(v) => onChange(v === "true")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="false">Não</SelectItem>
            <SelectItem value="true">Sim</SelectItem>
          </SelectContent>
        </Select>
      );
    case "select":
      return (
        <Combobox
          value={value ?? null}
          onChange={(v) => onChange(v)}
          options={f.options ?? []}
        />
      );
    default:
      return <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} required={f.required} maxLength={500} />;
  }
}

// Hook to fetch a related table for select options
export function useRelOptions(table: string, labelField = "nome") {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["rel", table, user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)(table).select(`id, ${labelField}`).order(labelField).limit(1000);
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any[]).map((d) => ({ value: d.id as string, label: d[labelField] as string }));
    },
    enabled: !!user,
  });
}
