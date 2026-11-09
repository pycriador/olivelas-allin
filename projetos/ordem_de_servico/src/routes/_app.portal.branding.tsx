import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Palette } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { brandingService } from "@/modules/portal/service";
import type { PortalBranding } from "@/modules/portal/types";

export const Route = createFileRoute("/_app/portal/branding")({
  head: () => ({ meta: [{ title: "Branding — ServiceForge" }] }),
  component: PortalBrandingPage,
});

const themeLabel: Record<string, string> = {
  light: "Claro",
  dark: "Escuro",
  auto: "Automático",
};

function ColorSwatch({ color }: { color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-4 w-4 rounded-full border" style={{ backgroundColor: color }} />
      <span className="text-xs font-mono">{color}</span>
    </span>
  );
}

function PortalBrandingPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PortalBranding | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    companyName: "",
    primaryColor: "#3B82F6",
    secondaryColor: "#64748B",
    accentColor: "#8B5CF6",
    backgroundColor: "#FFFFFF",
    textColor: "#0F172A",
    fontFamily: "Inter",
    theme: "light" as "light" | "dark" | "auto",
    footerText: "",
    language: "pt-BR",
    isActive: true,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["portal", "branding", "list"],
    queryFn: () => brandingService.list(),
  });

  const createMut = useMutation({
    mutationFn: () => brandingService.create({
      companyId: "new", companyName: form.companyName,
      primaryColor: form.primaryColor, secondaryColor: form.secondaryColor,
      accentColor: form.accentColor, backgroundColor: form.backgroundColor,
      textColor: form.textColor, fontFamily: form.fontFamily,
      theme: form.theme, footerText: form.footerText || undefined,
      footerLinks: [], language: form.language, isActive: form.isActive,
      updatedAt: new Date().toISOString(),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portal", "branding"] }); setDialogOpen(false); resetForm(); toast("Branding criado"); },
  });

  const updateMut = useMutation({
    mutationFn: () => brandingService.update(editing!.id, {
      companyName: form.companyName, primaryColor: form.primaryColor,
      secondaryColor: form.secondaryColor, accentColor: form.accentColor,
      backgroundColor: form.backgroundColor, textColor: form.textColor,
      fontFamily: form.fontFamily, theme: form.theme,
      footerText: form.footerText || undefined, language: form.language,
      isActive: form.isActive, updatedAt: new Date().toISOString(),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portal", "branding"] }); setDialogOpen(false); setEditing(null); resetForm(); toast("Branding atualizado"); },
  });

  const deleteMut = useMutation({
    mutationFn: () => brandingService.remove(deleteId!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portal", "branding"] }); setDeleteId(null); toast("Branding excluído"); },
  });

  const resetForm = () => setForm({
    companyName: "", primaryColor: "#3B82F6", secondaryColor: "#64748B",
    accentColor: "#8B5CF6", backgroundColor: "#FFFFFF", textColor: "#0F172A",
    fontFamily: "Inter", theme: "light", footerText: "", language: "pt-BR", isActive: true,
  });

  const openEdit = (item: PortalBranding) => {
    setEditing(item);
    setForm({
      companyName: item.companyName, primaryColor: item.primaryColor,
      secondaryColor: item.secondaryColor, accentColor: item.accentColor,
      backgroundColor: item.backgroundColor, textColor: item.textColor,
      fontFamily: item.fontFamily, theme: item.theme,
      footerText: item.footerText ?? "", language: item.language, isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  const columns: Column<PortalBranding>[] = [
    {
      key: "companyName", header: "Empresa", sortable: true,
      sortFn: (a, b) => a.companyName.localeCompare(b.companyName),
      render: (b) => <span className="text-sm font-medium">{b.companyName}</span>,
    },
    {
      key: "theme", header: "Tema",
      render: (b) => <Badge variant="outline">{themeLabel[b.theme] ?? b.theme}</Badge>,
    },
    {
      key: "primaryColor", header: "Primary Color",
      render: (b) => <ColorSwatch color={b.primaryColor} />,
    },
    {
      key: "fontFamily", header: "Font",
      render: (b) => <span className="text-sm">{b.fontFamily}</span>,
    },
    {
      key: "language", header: "Language",
      render: (b) => <span className="text-sm">{b.language}</span>,
    },
    {
      key: "isActive", header: "Ativo",
      render: (b) => <Badge variant={b.isActive ? "default" : "secondary"}>{b.isActive ? "Sim" : "Não"}</Badge>,
    },
    {
      key: "actions", header: "Ações",
      render: (b) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteId(b.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Branding</h1>
          <p className="text-sm text-muted-foreground">Personalização visual do portal</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditing(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Novo Branding</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" /> {editing ? "Editar Branding" : "Novo Branding"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Empresa</Label><Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded border shrink-0" style={{ backgroundColor: form.primaryColor }} />
                    <Input value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded border shrink-0" style={{ backgroundColor: form.secondaryColor }} />
                    <Input value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded border shrink-0" style={{ backgroundColor: form.accentColor }} />
                    <Input value={form.accentColor} onChange={(e) => setForm({ ...form, accentColor: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Background Color</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded border shrink-0" style={{ backgroundColor: form.backgroundColor }} />
                    <Input value={form.backgroundColor} onChange={(e) => setForm({ ...form, backgroundColor: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Text Color</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded border shrink-0" style={{ backgroundColor: form.textColor }} />
                    <Input value={form.textColor} onChange={(e) => setForm({ ...form, textColor: e.target.value })} />
                  </div>
                </div>
              </div>

              <div><Label>Font Family</Label><Input value={form.fontFamily} onChange={(e) => setForm({ ...form, fontFamily: e.target.value })} /></div>

              <div>
                <Label>Tema</Label>
                <Select value={form.theme} onValueChange={(v: "light" | "dark" | "auto") => setForm({ ...form, theme: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="auto">Automático</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div><Label>Footer Text</Label><Input value={form.footerText} onChange={(e) => setForm({ ...form, footerText: e.target.value })} /></div>

              <div>
                <Label>Idioma</Label>
                <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (BR)</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                <Label>Ativo</Label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setDialogOpen(false); setEditing(null); resetForm(); }}>Cancelar</Button>
                <Button onClick={() => editing ? updateMut.mutate() : createMut.mutate()}>
                  {editing ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        data={items}
        columns={columns}
        keyExtractor={(b) => b.id}
        searchKeys={["companyName", "fontFamily", "language"]}
        pageSize={10}
        pageSizeOptions={[10, 20, 50]}
        searchPlaceholder="Pesquisar branding..."
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteMut.mutate()}
        title="Excluir Branding"
        description="Tem certeza que deseja excluir este branding?"
      />
    </div>
  );
}
