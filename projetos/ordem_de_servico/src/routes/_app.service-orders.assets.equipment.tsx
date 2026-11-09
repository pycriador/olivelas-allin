import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Search, LayoutGrid, List, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { deviceService } from "@/modules/devices/service";
import { brandService } from "@/modules/brands/service";
import { modelService } from "@/modules/models/service";
import { equipmentTypeService } from "@/modules/equipment-types/service";
import { customerService } from "@/modules/customers/service";
import type { Device } from "@/modules/devices/types";

export const Route = createFileRoute("/_app/service-orders/assets/equipment")({
  head: () => ({ meta: [{ title: "Equipamentos — ServiceForge" }] }),
  component: EquipmentListPage,
});

type ViewMode = "table" | "grid";
type DeviceForm = {
  customerId: string; serialNumber: string; assetNumber: string; type: string;
  brandId: string; modelId: string; equipmentTypeId: string; imei: string;
  color: string; status: Device["status"]; notes: string;
};
const emptyForm: DeviceForm = {
  customerId: "", serialNumber: "", assetNumber: "", type: "", brandId: "", modelId: "",
  equipmentTypeId: "", imei: "", color: "", status: "active", notes: "",
};

function EquipmentListPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState<DeviceForm>(emptyForm);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: () => deviceService.list(),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: () => brandService.list(),
  });

  const { data: models = [] } = useQuery({
    queryKey: ["models"],
    queryFn: () => modelService.list(),
  });

  const { data: types = [] } = useQuery({
    queryKey: ["equipmentTypes"],
    queryFn: () => equipmentTypeService.list(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => customerService.list(),
  });

  const customerMap = useMemo(() => Object.fromEntries(customers.map((c) => [c.id, c.name])), [customers]);
  const brandMap = useMemo(() => Object.fromEntries(brands.map((b) => [b.id, b.name])), [brands]);
  const modelMap = useMemo(() => Object.fromEntries(models.map((m) => [m.id, m.name])), [models]);
  const typeMap = useMemo(() => Object.fromEntries(types.map((t) => [t.id, t.name])), [types]);

  const createMut = useMutation({
    mutationFn: () => deviceService.create(form as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["devices"] }); setOpen(false); setForm(emptyForm); toast.success("Equipamento criado"); },
  });

  const updateMut = useMutation({
    mutationFn: () => deviceService.update(editingId!, form as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["devices"] }); setOpen(false); setEditingId(null); setForm(emptyForm); toast.success("Equipamento atualizado"); },
  });

  const deleteMut = useMutation({
    mutationFn: () => deviceService.remove(deleteId!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["devices"] }); setDeleteId(null); toast.success("Equipamento excluído"); },
  });

  const openEdit = (item: Device) => {
    setForm({
      customerId: item.customerId ?? "", serialNumber: item.serialNumber ?? "",
      assetNumber: item.assetNumber ?? "", type: item.type ?? "",
      brandId: item.brandId ?? "", modelId: item.modelId ?? "",
      equipmentTypeId: item.equipmentTypeId ?? "", imei: item.imei ?? "",
      color: item.color ?? "", status: item.status, notes: item.notes ?? "",
    });
    setEditingId(item.id);
    setOpen(true);
  };

  const filtered = useMemo(() => {
    let list = items;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) =>
        (d.serialNumber ?? "").toLowerCase().includes(q) ||
        (d.assetNumber ?? "").toLowerCase().includes(q) ||
        (customerMap[d.customerId] ?? "").toLowerCase().includes(q) ||
        (brandMap[d.brandId ?? ""] ?? "").toLowerCase().includes(q) ||
        (modelMap[d.modelId ?? ""] ?? "").toLowerCase().includes(q) ||
        (d.type ?? "").toLowerCase().includes(q) ||
        (d.imei ?? "").toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") list = list.filter((d) => d.equipmentTypeId === typeFilter);
    if (brandFilter !== "all") list = list.filter((d) => d.brandId === brandFilter);
    if (modelFilter !== "all") list = list.filter((d) => d.modelId === modelFilter);
    if (statusFilter !== "all") list = list.filter((d) => d.status === statusFilter);
    return list;
  }, [items, search, typeFilter, brandFilter, modelFilter, statusFilter, customerMap, brandMap, modelMap]);

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700", inactive: "bg-gray-100 text-gray-700",
    in_maintenance: "bg-amber-100 text-amber-700", deactivated: "bg-red-100 text-red-700",
  };
  const statusLabels: Record<string, string> = {
    active: "Ativo", inactive: "Inativo", in_maintenance: "Em Manutenção", deactivated: "Desativado",
  };

  const save = editingId ? updateMut : createMut;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Equipamentos</h1>
          <p className="text-sm text-muted-foreground">Gerencie todos os equipamentos cadastrados</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border overflow-hidden">
            <Button variant={viewMode === "table" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("table")}><List className="h-4 w-4" /></Button>
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("grid")}><LayoutGrid className="h-4 w-4" /></Button>
          </div>
          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) {
                setEditingId(null);
                setForm(emptyForm);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingId(null); setForm(emptyForm); setOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />Novo Equipamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{editingId ? "Editar Equipamento" : "Novo Equipamento"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1"><Label>Serial</Label><Input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} /></div>
                <div className="space-y-1"><Label>Patrimônio</Label><Input value={form.assetNumber} onChange={(e) => setForm({ ...form, assetNumber: e.target.value })} /></div>
                <div className="space-y-1"><Label>IMEI</Label><Input value={form.imei} onChange={(e) => setForm({ ...form, imei: e.target.value })} /></div>
                <div className="space-y-1"><Label>Cliente</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                    <option value="">Selecione...</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1"><Label>Tipo</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.equipmentTypeId} onChange={(e) => setForm({ ...form, equipmentTypeId: e.target.value })}>
                    <option value="">Selecione...</option>
                    {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1"><Label>Marca</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })}>
                    <option value="">Selecione...</option>
                    {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1"><Label>Modelo</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.modelId} onChange={(e) => setForm({ ...form, modelId: e.target.value })}>
                    <option value="">Selecione...</option>
                    {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1"><Label>Cor</Label><Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
                <div className="space-y-1"><Label>Status</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="in_maintenance">Em Manutenção</option>
                    <option value="deactivated">Desativado</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-3"><Label>Observações</Label><textarea className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => { setOpen(false); setEditingId(null); setForm(emptyForm); }}>Cancelar</Button>
                <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Salvando..." : "Salvar"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por serial, patrimônio, cliente, marca, modelo, IMEI..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">Todos os Tipos</option>
          {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
          <option value="all">Todas as Marcas</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={modelFilter} onChange={(e) => setModelFilter(e.target.value)}>
          <option value="all">Todos os Modelos</option>
          {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Todos os Status</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
          <option value="in_maintenance">Em Manutenção</option>
          <option value="deactivated">Desativado</option>
        </select>
        <Badge variant="secondary">{filtered.length} equipamentos</Badge>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent><p className="py-12 text-center text-sm text-muted-foreground">Nenhum equipamento encontrado</p></CardContent></Card>
      ) : viewMode === "table" ? (
        <Card className="min-w-0 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto min-w-0 w-full custom-scrollbar">
              <table className="w-full text-sm min-w-[750px]">
                <thead>
                  <tr className="border-b text-left text-muted-foreground bg-muted/30">
                    <th className="p-3 font-medium">Serial / Patrimônio</th>
                    <th className="p-3 font-medium">Cliente</th>
                    <th className="p-3 font-medium">Tipo</th>
                    <th className="p-3 font-medium">Marca</th>
                    <th className="p-3 font-medium">Modelo</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium w-32 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                      <td className="p-3 font-semibold text-primary">{item.serialNumber ?? item.assetNumber ?? "-"}</td>
                      <td className="p-3 font-medium">{customerMap[item.customerId] ?? "-"}</td>
                      <td className="p-3">{item.equipmentTypeId ? typeMap[item.equipmentTypeId] ?? item.type ?? "-" : item.type ?? "-"}</td>
                      <td className="p-3">{item.brandId ? brandMap[item.brandId] ?? "-" : "-"}</td>
                      <td className="p-3">{item.modelId ? modelMap[item.modelId] ?? "-" : "-"}</td>
                      <td className="p-3"><Badge className={statusColors[item.status]} variant="outline">{statusLabels[item.status]}</Badge></td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <Link to="/service-orders/assets/equipment/$id" params={{ id: item.id }}><Eye className="h-3.5 w-3.5" /></Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Link to="/service-orders/assets/equipment/$id" params={{ id: item.id }} className="font-medium hover:underline">{item.serialNumber ?? item.assetNumber ?? "Sem serial"}</Link>
                  <Badge className={statusColors[item.status]} variant="outline">{statusLabels[item.status]}</Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Cliente: {customerMap[item.customerId] ?? "-"}</p>
                  <p>Tipo: {item.equipmentTypeId ? typeMap[item.equipmentTypeId] ?? item.type ?? "-" : item.type ?? "-"}</p>
                  <p>Marca: {item.brandId ? brandMap[item.brandId] ?? "-" : "-"} / Modelo: {item.modelId ? modelMap[item.modelId] ?? "-" : "-"}</p>
                </div>
                <div className="flex gap-1 pt-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/service-orders/assets/equipment/$id" params={{ id: item.id }}>Detalhes</Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Pencil className="h-3 w-3 mr-1" />Editar</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar Exclusão</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir este equipamento?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteMut.mutate()}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
