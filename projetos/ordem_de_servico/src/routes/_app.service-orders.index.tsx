import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Search, Pin, PinOff, LayoutGrid, List, Columns3, Smartphone, Phone, Building2, UserCog, Filter, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { serviceOrderService } from "@/modules/service-orders/service";
import type { ServiceOrder } from "@/modules/service-orders/types";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/service-orders/")({
  head: () => ({ meta: [{ title: "Ordens de Serviço — ServiceForge" }] }),
  component: SOListPage,
});

type ViewMode = "table" | "kanban";

function SOListPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchField, setSearchField] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("entryDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [form, setForm] = useState({
    customerId: "", customerName: "", deviceId: "", deviceInfo: "",
    description: "", priority: "medium" as "low" | "medium" | "high" | "urgent",
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["service-orders"],
    queryFn: () => serviceOrderService.list(),
  });

  const statuses = useMemo(() => {
    const s = new Set(items.map((i) => i.status));
    return ["all", ...Array.from(s)];
  }, [items]);

  const createMut = useMutation({
    mutationFn: () => serviceOrderService.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["service-orders"] }); setOpen(false); setForm({ customerId: "", customerName: "", deviceId: "", deviceInfo: "", description: "", priority: "medium" }); toast("OS criada"); },
  });

  const deleteMut = useMutation({
    mutationFn: () => serviceOrderService.remove(deleteId!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["service-orders"] }); setDeleteId(null); toast("OS excluída"); },
  });

  const togglePin = useMutation({
    mutationFn: (id: string) => serviceOrderService.togglePin(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-orders"] }),
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const priorityWeight: Record<string, number> = { low: 1, medium: 2, high: 3, urgent: 4 };

  const filtered = useMemo(() => {
    let list = [...items];
    if (search) {
      const q = search.toLowerCase().trim();
      if (searchField === "all") {
        list = list.filter((so) =>
          so.number?.toLowerCase().includes(q) ||
          so.customerName?.toLowerCase().includes(q) ||
          so.description?.toLowerCase().includes(q) ||
          so.defectName?.toLowerCase().includes(q) ||
          so.deviceInfo?.toLowerCase().includes(q) ||
          so.equipmentSerial?.toLowerCase().includes(q) ||
          so.customerPhone?.toLowerCase().includes(q) ||
          so.customerDocument?.toLowerCase().includes(q) ||
          so.companyName?.toLowerCase().includes(q) ||
          so.technicianName?.toLowerCase().includes(q)
        );
      } else {
        list = list.filter((so) => {
          const val = ({
            number: so.number,
            customerName: so.customerName,
            description: so.description,
            defectName: so.defectName,
            deviceInfo: so.deviceInfo,
            equipmentSerial: so.equipmentSerial,
            customerPhone: so.customerPhone,
            customerDocument: so.customerDocument,
            companyName: so.companyName,
            technicianName: so.technicianName,
          } as Record<string, string | undefined>)[searchField] ?? "";
          return val.toLowerCase().includes(q);
        });
      }
    }
    if (statusFilter !== "all") list = list.filter((so) => so.status === statusFilter);
    if (priorityFilter !== "all") list = list.filter((so) => so.priority === priorityFilter);

    return list.sort((a, b) => {
      // Pinned items stay on top
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

      let res = 0;
      if (sortField === "number") {
        res = (a.number ?? "").localeCompare(b.number ?? "", undefined, { numeric: true });
      } else if (sortField === "customerName") {
        res = (a.customerName ?? "").localeCompare(b.customerName ?? "", "pt-BR");
      } else if (sortField === "description") {
        res = (a.description ?? "").localeCompare(b.description ?? "", "pt-BR");
      } else if (sortField === "priority") {
        res = (priorityWeight[a.priority] ?? 0) - (priorityWeight[b.priority] ?? 0);
      } else if (sortField === "status") {
        res = (a.statusLabel ?? a.status ?? "").localeCompare(b.statusLabel ?? b.status ?? "", "pt-BR");
      } else if (sortField === "entryDate") {
        const timeA = a.entryDate ? new Date(a.entryDate).getTime() : 0;
        const timeB = b.entryDate ? new Date(b.entryDate).getTime() : 0;
        res = timeA - timeB;
      }
      return sortDir === "asc" ? res : -res;
    });
  }, [items, search, searchField, statusFilter, priorityFilter, sortField, sortDir]);

  const priorityColor: Record<string, string> = { low: "bg-gray-100 text-gray-700", medium: "bg-blue-100 text-blue-700", high: "bg-amber-100 text-amber-700", urgent: "bg-red-100 text-red-700" };
  const statusColors: Record<string, string> = {
    "Em Aberto": "bg-gray-100 text-gray-700", "Em Diagnóstico": "bg-blue-100 text-blue-700",
    "Aguardando Aprovação": "bg-amber-100 text-amber-700", "Aprovada": "bg-green-100 text-green-700",
    "Em Execução": "bg-purple-100 text-purple-700", "Aguardando Peça": "bg-orange-100 text-orange-700",
    "Pronta": "bg-emerald-100 text-emerald-700", "Aguardando Retirada": "bg-teal-100 text-teal-700",
    "Entregue": "bg-green-100 text-green-700", "Cancelada": "bg-red-100 text-red-700",
  };

  const kanbanColumns = useMemo(() => {
    const cols: Record<string, ServiceOrder[]> = {};
    const allStatuses = ["Em Aberto", "Em Diagnóstico", "Aguardando Aprovação", "Aprovada", "Em Execução", "Aguardando Peça", "Pronta", "Aguardando Retirada", "Entregue", "Cancelada"];
    allStatuses.forEach((s) => { cols[s] = []; });
    filtered.forEach((so) => {
      if (cols[so.status]) cols[so.status].push(so);
      else cols["Em Aberto"].push(so);
    });
    return Object.entries(cols).filter(([_, v]) => v.length > 0 || ["Em Aberto", "Em Diagnóstico", "Pronta", "Entregue"].includes(_));
  }, [filtered]);

  const moveStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => serviceOrderService.update(id, { status, statusLabel: status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-orders"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("so.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("so.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border overflow-hidden">
            <Button variant={viewMode === "table" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("table")}><List className="h-4 w-4" /></Button>
            <Button variant={viewMode === "kanban" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("kanban")}><Columns3 className="h-4 w-4" /></Button>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />{t("so.new")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t("so.new")}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>{t("so.customer")}</Label><Input placeholder="ID do Cliente" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} /></div>
                <div><Label>Nome do Cliente</Label><Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
                <div><Label>{t("so.description")}</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div><Label>{t("so.priority")}</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as any })}>
                    <option value="low">{t("so.priority.low")}</option>
                    <option value="medium">{t("so.priority.medium")}</option>
                    <option value="high">{t("so.priority.high")}</option>
                    <option value="urgent">{t("so.priority.urgent")}</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
                  <Button onClick={() => createMut.mutate()}>{t("common.save")}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 w-full" placeholder={t("so.search")} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full sm:w-auto" value={searchField} onChange={(e) => setSearchField(e.target.value)}>
            <option value="all">{t("common.all")}</option>
            <option value="number">Número</option>
            <option value="customerName">Cliente</option>
            <option value="deviceInfo">Equipamento</option>
            <option value="equipmentSerial">Nº Série</option>
            <option value="customerPhone">Telefone</option>
            <option value="customerDocument">CPF/CNPJ</option>
            <option value="companyName">Empresa</option>
            <option value="technicianName">Técnico</option>
            <option value="description">Descrição</option>
          </select>
          <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full sm:w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{t("common.all")} Status</option>
            {statuses.filter((s) => s !== "all").map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-1" /> Filtros
          </Button>
          <Badge variant="secondary" className="ml-auto">{filtered.length} OS</Badge>
        </div>
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <label className="text-sm text-muted-foreground">Prioridade:</label>
            {(["all", "low", "medium", "high", "urgent"] as const).map((p) => (
              <button key={p} className={`px-3 py-1 text-xs rounded-full border transition-colors ${priorityFilter === p ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`}
                onClick={() => setPriorityFilter(p)}>
                {p === "all" ? "Todas" : t(`so.priority.${p}`)}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent><p className="py-12 text-center text-sm text-muted-foreground">{t("so.emptyList")}</p></CardContent></Card>
      ) : viewMode === "table" ? (
        <Card className="min-w-0 max-w-full overflow-hidden border border-border/70 rounded-xl shadow-xs">
          <CardContent className="p-0">
            <div className="overflow-x-auto min-w-0 w-full custom-scrollbar">
              <table className="w-full text-sm min-w-[850px] border-collapse">
                <thead>
                  <tr className="border-b text-left text-muted-foreground bg-muted/40 select-none">
                    <th className="p-3 w-10 first:pl-4"></th>
                    <th className="p-3 font-semibold cursor-pointer hover:text-foreground transition-colors whitespace-nowrap" onClick={() => handleSort("number")}>
                      <div className="inline-flex items-center gap-1.5 group">
                        <span>{t("so.number")}</span>
                        {sortField !== "number" ? <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground" /> : sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-primary" /> : <ChevronDown className="h-3.5 w-3.5 text-primary" />}
                      </div>
                    </th>
                    <th className="p-3 font-semibold cursor-pointer hover:text-foreground transition-colors whitespace-nowrap" onClick={() => handleSort("customerName")}>
                      <div className="inline-flex items-center gap-1.5 group">
                        <span>{t("so.customer")}</span>
                        {sortField !== "customerName" ? <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground" /> : sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-primary" /> : <ChevronDown className="h-3.5 w-3.5 text-primary" />}
                      </div>
                    </th>
                    <th className="p-3 font-semibold cursor-pointer hover:text-foreground transition-colors whitespace-nowrap" onClick={() => handleSort("description")}>
                      <div className="inline-flex items-center gap-1.5 group">
                        <span>{t("so.description")}</span>
                        {sortField !== "description" ? <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground" /> : sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-primary" /> : <ChevronDown className="h-3.5 w-3.5 text-primary" />}
                      </div>
                    </th>
                    <th className="p-3 font-semibold cursor-pointer hover:text-foreground transition-colors whitespace-nowrap" onClick={() => handleSort("priority")}>
                      <div className="inline-flex items-center gap-1.5 group">
                        <span>{t("so.priority")}</span>
                        {sortField !== "priority" ? <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground" /> : sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-primary" /> : <ChevronDown className="h-3.5 w-3.5 text-primary" />}
                      </div>
                    </th>
                    <th className="p-3 font-semibold cursor-pointer hover:text-foreground transition-colors whitespace-nowrap" onClick={() => handleSort("status")}>
                      <div className="inline-flex items-center gap-1.5 group">
                        <span>{t("so.status")}</span>
                        {sortField !== "status" ? <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground" /> : sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-primary" /> : <ChevronDown className="h-3.5 w-3.5 text-primary" />}
                      </div>
                    </th>
                    <th className="p-3 font-semibold cursor-pointer hover:text-foreground transition-colors whitespace-nowrap" onClick={() => handleSort("entryDate")}>
                      <div className="inline-flex items-center gap-1.5 group">
                        <span>{t("so.entryDate")}</span>
                        {sortField !== "entryDate" ? <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground" /> : sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-primary" /> : <ChevronDown className="h-3.5 w-3.5 text-primary" />}
                      </div>
                    </th>
                    <th className="p-3 font-semibold w-24 text-right last:pr-4 whitespace-nowrap">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((so) => (
                    <tr key={so.id} className="hover:bg-muted/40 transition-colors">
                      <td className="p-3 first:pl-4">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => togglePin.mutate(so.id)}>
                          {so.pinned ? <PinOff className="h-3.5 w-3.5 text-primary" /> : <Pin className="h-3.5 w-3.5 text-muted-foreground" />}
                        </Button>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <Link to="/service-orders/$id" params={{ id: so.id }} className="font-semibold text-primary hover:underline">{so.number}</Link>
                      </td>
                      <td className="p-3 font-medium whitespace-nowrap">{so.customerName}</td>
                      <td className="p-3 max-w-[220px] truncate text-muted-foreground">{so.description}</td>
                      <td className="p-3 whitespace-nowrap"><Badge className={priorityColor[so.priority] ?? ""} variant="outline">{t(`so.priority.${so.priority}`)}</Badge></td>
                      <td className="p-3 whitespace-nowrap"><Badge className={statusColors[so.status] ?? ""} variant="outline">{so.statusLabel}</Badge></td>
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{so.entryDate}</td>
                      <td className="p-3 text-right last:pr-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <Link to="/service-orders/$id" params={{ id: so.id }}><Pencil className="h-3.5 w-3.5" /></Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(so.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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
        /* Kanban View */
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "60vh" }}>
          {kanbanColumns.map(([status, sos]) => (
            <div key={status} className="flex-shrink-0 w-72">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-medium text-sm">{status}</h3>
                <Badge variant="secondary">{sos.length}</Badge>
              </div>
              <div className="space-y-3 min-h-[200px]">
                {sos.map((so) => (
                  <Card key={so.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Link to="/service-orders/$id" params={{ id: so.id }} className="font-medium text-sm hover:underline">{so.number}</Link>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => togglePin.mutate(so.id)}>
                          {so.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3 text-muted-foreground" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">{so.customerName}</p>
                      <p className="text-xs line-clamp-2">{so.description}</p>
                      <div className="flex items-center justify-between pt-1">
                        <Badge className={priorityColor[so.priority] ?? ""} variant="outline">{t(`so.priority.${so.priority}`)}</Badge>
                        <div className="flex gap-1">
                          {kanbanColumns.map(([st]) => (
                            st !== status && !["Entregue", "Cancelada"].includes(status) && (
                              <Button key={st} variant="ghost" size="icon" className="h-5 w-5" title={`Mover para ${st}`}
                                onClick={() => moveStatus.mutate({ id: so.id, status: st })}>
                                <Columns3 className="h-3 w-3" />
                              </Button>
                            )
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("so.confirmDelete")}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{t("so.confirmDeleteMessage")}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>{t("common.cancel")}</Button>
            <Button variant="destructive" onClick={() => deleteMut.mutate()}>{t("common.delete")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
