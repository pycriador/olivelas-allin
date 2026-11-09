import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit3, Palette, CheckCircle2, XCircle, Globe, Star, PaintBucket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/data-table";
import { DocButton } from "@/components/doc-button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { themeService } from "@/modules/admin/service";
import { useTranslation } from "@/core/i18n/I18nProvider";
import type { ThemeConfig } from "@/modules/admin/types";

const themeColorsSchema = z.object({
  primary: z.string().min(1, "Obrigatório"),
  secondary: z.string().min(1, "Obrigatório"),
  accent: z.string().min(1, "Obrigatório"),
  background: z.string().min(1, "Obrigatório"),
  foreground: z.string().min(1, "Obrigatório"),
  muted: z.string().min(1, "Obrigatório"),
  border: z.string().min(1, "Obrigatório"),
  destructive: z.string().min(1, "Obrigatório"),
  success: z.string().min(1, "Obrigatório"),
  warning: z.string().min(1, "Obrigatório"),
});

const themeFontsSchema = z.object({
  heading: z.string().min(1, "Obrigatório"),
  body: z.string().min(1, "Obrigatório"),
  mono: z.string().min(1, "Obrigatório"),
});

const themeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  isGlobal: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  darkMode: z.boolean().optional(),
  lightMode: z.boolean().optional(),
  colors: themeColorsSchema,
  fonts: themeFontsSchema,
});

type ThemeForm = z.infer<typeof themeSchema>;

const colorLabels: Record<string, string> = {
  primary: "Primária", secondary: "Secundária", accent: "Destaque",
  background: "Fundo", foreground: "Texto", muted: "Suave",
  border: "Borda", destructive: "Destrutivo", success: "Sucesso", warning: "Aviso",
};

export const Route = createFileRoute("/_app/admin/themes")({
  head: () => ({ meta: [{ title: "Admin Temas — ServiceForge" }] }),
  component: AdminThemesPage,
});

function AdminThemesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: themes = [] } = useQuery({ queryKey: ["admin", "themes", "list"], queryFn: () => themeService.list() });

  const form = useForm<ThemeForm>({
    resolver: zodResolver(themeSchema),
    defaultValues: {
      isGlobal: false, isDefault: false, darkMode: false, lightMode: true,
      colors: { primary: "#0066CC", secondary: "#00AA88", accent: "#FF6B35", background: "#FFFFFF", foreground: "#1A1A2E", muted: "#F1F5F9", border: "#E2E8F0", destructive: "#EF4444", success: "#22C55E", warning: "#F59E0B" },
      fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
    },
  });

  const createMut = useMutation({
    mutationFn: (data: ThemeForm) => themeService.create({
      name: data.name, description: data.description ?? "", isGlobal: data.isGlobal ?? false,
      isDefault: data.isDefault ?? false, logo: "", favicon: "",
      colors: data.colors, fonts: data.fonts, cssTokens: {},
      darkMode: data.darkMode ?? false, lightMode: data.lightMode ?? true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "themes"] }); setDialogOpen(false); form.reset(); toast.success("Tema criado"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ThemeForm }) => themeService.update(id, {
      ...data, updatedAt: new Date().toISOString(),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "themes"] }); setDialogOpen(false); setEditingId(null); form.reset(); toast.success("Tema atualizado"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => themeService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "themes"] }); toast.success("Tema excluído"); },
  });

  const setDefaultMut = useMutation({
    mutationFn: (id: string) => {
      const theme = themes.find(t => t.id === id);
      if (!theme) throw new Error("Tema não encontrado");
      return themeService.update(id, { isDefault: !theme.isDefault, updatedAt: new Date().toISOString() });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "themes"] }); toast.success("Tema padrão atualizado"); },
  });

  const openEdit = (id: string) => {
    const t = themes.find(t => t.id === id);
    if (!t) return;
    setEditingId(id);
    form.reset({
      name: t.name, description: t.description, isGlobal: t.isGlobal, isDefault: t.isDefault,
      darkMode: t.darkMode, lightMode: t.lightMode, colors: t.colors, fonts: t.fonts,
    });
    setDialogOpen(true);
  };

  const columns: Column<ThemeConfig>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (t) => (
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{t.name}</span>
      </div>
    )},
    { key: "isDefault", header: "Padrão", render: (t) => t.isDefault ? <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> : <Star className="h-4 w-4 text-muted-foreground" /> },
    { key: "isGlobal", header: "Global", render: (t) => t.isGlobal ? <Globe className="h-4 w-4 text-blue-500" /> : <XCircle className="h-4 w-4 text-muted-foreground" /> },
    { key: "darkMode", header: "Modo Escuro", render: (t) => t.darkMode ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-muted-foreground" /> },
    { key: "actions", header: "Ações", render: (t) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => setDefaultMut.mutate(t.id)} title="Marcar como padrão"><Star className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => openEdit(t.id)}><Edit3 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{t("admin.themes")}</h1>
            <DocButton module="admin" page="themes" title="Temas" />
          </div>
          <p className="text-sm text-muted-foreground">Gerencie os temas visuais da plataforma</p>
        </div>
        <Button onClick={() => { setEditingId(null); form.reset({ isGlobal: false, isDefault: false, darkMode: false, lightMode: true, colors: { primary: "#0066CC", secondary: "#00AA88", accent: "#FF6B35", background: "#FFFFFF", foreground: "#1A1A2E", muted: "#F1F5F9", border: "#E2E8F0", destructive: "#EF4444", success: "#22C55E", warning: "#F59E0B" }, fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" } }); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Novo Tema
        </Button>
      </div>

      <DataTable
        data={themes}
        columns={columns}
        keyExtractor={(t) => t.id}
        searchKeys={["name", "description"]}
        initialSortColumn="name"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Tema" : "Novo Tema"}</DialogTitle>
            <DialogDescription>Configure o tema</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((v) => editingId ? updateMut.mutate({ id: editingId, data: v }) : createMut.mutate(v))} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-2"><Label>Nome</Label><Input {...form.register("name")} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea {...form.register("description")} /></div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.watch("isGlobal")} onCheckedChange={(v) => form.setValue("isGlobal", v)} />
                <Label>Global</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.watch("darkMode")} onCheckedChange={(v) => form.setValue("darkMode", v)} />
                <Label>Modo Escuro</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.watch("lightMode")} onCheckedChange={(v) => form.setValue("lightMode", v)} />
                <Label>Modo Claro</Label>
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-1 mb-2"><PaintBucket className="h-3 w-3" /> Cores</Label>
              <div className="grid grid-cols-5 gap-3">
                {(Object.keys(colorLabels) as Array<keyof ThemeConfig["colors"]>).map((key) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{colorLabels[key]}</Label>
                    <div className="flex gap-1 items-center">
                      <input
                        type="color"
                        value={form.watch(`colors.${key}`)}
                        onChange={(e) => form.setValue(`colors.${key}`, e.target.value)}
                        className="h-8 w-8 rounded border cursor-pointer"
                      />
                      <Input
                        className="h-8 text-xs"
                        value={form.watch(`colors.${key}`)}
                        onChange={(e) => form.setValue(`colors.${key}`, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Fontes</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div className="space-y-1"><Label className="text-xs">Títulos</Label><Input {...form.register("fonts.heading")} /></div>
                <div className="space-y-1"><Label className="text-xs">Corpo</Label><Input {...form.register("fonts.body")} /></div>
                <div className="space-y-1"><Label className="text-xs">Mono</Label><Input {...form.register("fonts.mono")} /></div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" type="button" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit">{t("common.save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        onConfirm={() => { if (deleteId) { deleteMut.mutate(deleteId); setDeleteId(null); } }}
      />
    </div>
  );
}