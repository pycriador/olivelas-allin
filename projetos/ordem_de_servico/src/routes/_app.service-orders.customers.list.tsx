import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, LayoutGrid, List, Copy, Eye, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { customerService } from "@/modules/customers/service";
import type { Customer } from "@/modules/customers/types";

export const Route = createFileRoute("/_app/service-orders/customers/list")({
  head: () => ({ meta: [{ title: "Clientes — ServiceForge" }] }),
  component: CustomerListPage,
});

type ViewMode = "table" | "grid";
type CustomerForm = {
  name: string; type: "individual" | "legal";
  cpf?: string; rg?: string; birthDate?: string;
  cnpj?: string; companyName?: string; fantasyName?: string; stateRegistration?: string; municipalRegistration?: string;
  email?: string; secondaryEmail?: string; phone?: string; cellphone?: string; whatsapp?: string;
  website?: string; profession?: string; status: "active" | "inactive" | "blocked";
  tags?: string; classification?: string; notes?: string;
};

const emptyForm: CustomerForm = { name: "", type: "individual", status: "active" };

type SortField = "name" | "type" | "document" | "email" | "whatsapp" | "city" | "status";
type SortDir = "asc" | "desc";

function CustomerListPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [form, setForm] = useState<CustomerForm>(emptyForm);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("action") === "new" || params.get("new") === "true") {
        setEditingId(null);
        setForm(emptyForm);
        setOpen(true);
      }
    }
  }, []);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => customerService.list(),
  });

  const createMut = useMutation({
    mutationFn: () => customerService.create({ ...form, tags: form.tags ? form.tags.split(",").map((s) => s.trim()).filter(Boolean) : undefined } as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); setOpen(false); setForm(emptyForm); toast.success("Cliente criado"); },
  });

  const updateMut = useMutation({
    mutationFn: () => customerService.update(editingId!, { ...form, tags: form.tags ? form.tags.split(",").map((s) => s.trim()).filter(Boolean) : undefined } as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); setOpen(false); setEditingId(null); setForm(emptyForm); toast.success("Cliente atualizado"); },
  });

  const deleteMut = useMutation({
    mutationFn: () => customerService.remove(deleteId!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); setDeleteId(null); toast.success("Cliente excluído"); },
  });

  const copyMut = useMutation({
    mutationFn: (id: string) => customerService.copyCustomer(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); toast.success("Cliente duplicado"); },
  });

  const openEdit = (customer: Customer) => {
    setForm({
      name: customer.name, type: customer.type,
      cpf: customer.cpf, rg: customer.rg, birthDate: customer.birthDate,
      cnpj: customer.cnpj, companyName: customer.companyName, fantasyName: customer.fantasyName,
      stateRegistration: customer.stateRegistration, municipalRegistration: customer.municipalRegistration,
      email: customer.email, secondaryEmail: customer.secondaryEmail, phone: customer.phone,
      cellphone: customer.cellphone, whatsapp: customer.whatsapp, website: customer.website,
      profession: customer.profession, status: customer.status,
      tags: (customer.tags ?? []).join(", "), classification: customer.classification, notes: customer.notes,
    });
    setEditingId(customer.id);
    setOpen(true);
  };

  const filtered = useMemo(() => {
    let list = items.filter((c) => !c.deletedAt);
    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter((c) => 
        (c.name && c.name.toLowerCase().includes(q)) || 
        (c.cpf && c.cpf.toLowerCase().includes(q)) || 
        (c.cnpj && c.cnpj.toLowerCase().includes(q)) || 
        (c.email && c.email.toLowerCase().includes(q)) || 
        (c.phone && c.phone.toLowerCase().includes(q)) || 
        (c.cellphone && c.cellphone.toLowerCase().includes(q)) || 
        (c.whatsapp && c.whatsapp.toLowerCase().includes(q)) || 
        (c.addresses && c.addresses.some((a) => a.city && a.city.toLowerCase().includes(q)))
      );
    }
    if (statusFilter !== "all") list = list.filter((c) => c.status === statusFilter);
    if (typeFilter !== "all") list = list.filter((c) => c.type === typeFilter);

    // Apply sorting
    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = (a.name || "").localeCompare(b.name || "", "pt-BR");
          break;
        case "type":
          cmp = (a.type || "").localeCompare(b.type || "");
          break;
        case "document":
          const docA = a.cpf || a.cnpj || "";
          const docB = b.cpf || b.cnpj || "";
          cmp = docA.localeCompare(docB);
          break;
        case "email":
          cmp = (a.email || "").localeCompare(b.email || "");
          break;
        case "whatsapp":
          cmp = (a.whatsapp || a.cellphone || a.phone || "").localeCompare(b.whatsapp || b.cellphone || b.phone || "");
          break;
        case "city":
          const cityA = a.addresses?.find((x) => x.isDefault)?.city || a.addresses?.[0]?.city || "";
          const cityB = b.addresses?.find((x) => x.isDefault)?.city || b.addresses?.[0]?.city || "";
          cmp = cityA.localeCompare(cityB, "pt-BR");
          break;
        case "status":
          cmp = (a.status || "").localeCompare(b.status || "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [items, search, statusFilter, typeFilter, sortField, sortDir]);

  const isPF = form.type === "individual";
  const isPJ = form.type === "legal";
  const statusColors: Record<string, string> = { active: "bg-green-100 text-green-700", inactive: "bg-gray-100 text-gray-700", blocked: "bg-red-100 text-red-700" };
  const typeLabels: Record<string, string> = { individual: "PF", legal: "PJ" };

  const saveMutation = editingId ? updateMut : createMut;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus clientes cadastrados</p>
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
                <Plus className="mr-2 h-4 w-4" />Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader><DialogTitle>{editingId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-1"><Label>Tipo</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
                    <option value="individual">PF</option>
                    <option value="legal">PJ</option>
                  </select>
                </div>
                <div className="space-y-1"><Label>Status</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="blocked">Bloqueado</option>
                  </select>
                </div>
                {isPF && <><div className="space-y-1"><Label>CPF</Label><Input value={form.cpf ?? ""} onChange={(e) => setForm({ ...form, cpf: e.target.value })} /></div>
                  <div className="space-y-1"><Label>RG</Label><Input value={form.rg ?? ""} onChange={(e) => setForm({ ...form, rg: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Data de Nascimento</Label><Input type="date" value={form.birthDate ?? ""} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} /></div></>}
                {isPJ && <><div className="space-y-1"><Label>CNPJ</Label><Input value={form.cnpj ?? ""} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Razão Social</Label><Input value={form.companyName ?? ""} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Nome Fantasia</Label><Input value={form.fantasyName ?? ""} onChange={(e) => setForm({ ...form, fantasyName: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Inscrição Estadual</Label><Input value={form.stateRegistration ?? ""} onChange={(e) => setForm({ ...form, stateRegistration: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Inscrição Municipal</Label><Input value={form.municipalRegistration ?? ""} onChange={(e) => setForm({ ...form, municipalRegistration: e.target.value })} /></div></>}
                <div className="space-y-1"><Label>Email Principal</Label><Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-1"><Label>Email Secundário</Label><Input type="email" value={form.secondaryEmail ?? ""} onChange={(e) => setForm({ ...form, secondaryEmail: e.target.value })} /></div>
                <div className="space-y-1"><Label>Telefone</Label><Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="space-y-1"><Label>Celular</Label><Input value={form.cellphone ?? ""} onChange={(e) => setForm({ ...form, cellphone: e.target.value })} /></div>
                <div className="space-y-1"><Label>WhatsApp</Label><Input value={form.whatsapp ?? ""} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
                <div className="space-y-1"><Label>Site</Label><Input value={form.website ?? ""} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
                <div className="space-y-1"><Label>Profissão</Label><Input value={form.profession ?? ""} onChange={(e) => setForm({ ...form, profession: e.target.value })} /></div>
                <div className="space-y-1"><Label>Tags (separadas por vírgula)</Label><Input value={form.tags ?? ""} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
                <div className="space-y-1"><Label>Classificação</Label><Input value={form.classification ?? ""} onChange={(e) => setForm({ ...form, classification: e.target.value })} /></div>
                <div className="space-y-1 col-span-3"><Label>Observações</Label><textarea className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => { setOpen(false); setEditingId(null); setForm(emptyForm); }}>Cancelar</Button>
                <Button onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}>{saveMutation.isPending ? "Salvando..." : "Salvar"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nome, CPF, CNPJ, email, telefone, cidade..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Todos os Status</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
          <option value="blocked">Bloqueado</option>
        </select>
        <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">Todos os Tipos</option>
          <option value="individual">PF</option>
          <option value="legal">PJ</option>
        </select>
        <Badge variant="secondary">{filtered.length} clientes</Badge>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent><p className="py-12 text-center text-sm text-muted-foreground">Nenhum cliente encontrado</p></CardContent></Card>
      ) : viewMode === "table" ? (
        <Card className="min-w-0 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto min-w-0 w-full custom-scrollbar">
              <table className="w-full text-sm min-w-[850px]">
                <thead>
                  <tr className="border-b text-left text-muted-foreground bg-muted/30">
                    <th className="px-3.5 py-3 font-medium first:pl-4 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort("name")}>
                      <div className="flex items-center gap-1.5">
                        <span>Nome</span>
                        {sortField === "name" ? (sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                      </div>
                    </th>
                    <th className="px-3.5 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort("type")}>
                      <div className="flex items-center gap-1.5">
                        <span>Tipo</span>
                        {sortField === "type" ? (sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                      </div>
                    </th>
                    <th className="px-3.5 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort("document")}>
                      <div className="flex items-center gap-1.5">
                        <span>Documento</span>
                        {sortField === "document" ? (sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                      </div>
                    </th>
                    <th className="px-3.5 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort("email")}>
                      <div className="flex items-center gap-1.5">
                        <span>Email</span>
                        {sortField === "email" ? (sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                      </div>
                    </th>
                    <th className="px-3.5 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort("whatsapp")}>
                      <div className="flex items-center gap-1.5">
                        <span>WhatsApp</span>
                        {sortField === "whatsapp" ? (sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                      </div>
                    </th>
                    <th className="px-3.5 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort("city")}>
                      <div className="flex items-center gap-1.5">
                        <span>Cidade</span>
                        {sortField === "city" ? (sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                      </div>
                    </th>
                    <th className="px-3.5 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort("status")}>
                      <div className="flex items-center gap-1.5">
                        <span>Status</span>
                        {sortField === "status" ? (sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                      </div>
                    </th>
                    <th className="px-3.5 py-3 font-medium w-36 text-right last:pr-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-3.5 py-3 first:pl-4 font-medium">
                        <Link to="/service-orders/customers/$id" params={{ id: c.id }} className="text-primary hover:underline">{c.name}</Link>
                      </td>
                      <td className="px-3.5 py-3"><Badge variant="outline">{typeLabels[c.type]}</Badge></td>
                      <td className="px-3.5 py-3">{c.cpf ?? c.cnpj ?? "-"}</td>
                      <td className="px-3.5 py-3">{c.email ?? "-"}</td>
                      <td className="px-3.5 py-3">{c.whatsapp ?? c.cellphone ?? c.phone ?? "-"}</td>
                      <td className="px-3.5 py-3">{c.addresses?.find((a) => a.isDefault)?.city ?? c.addresses?.[0]?.city ?? "-"}</td>
                      <td className="px-3.5 py-3"><Badge className={statusColors[c.status]} variant="outline">{c.status === "active" ? "Ativo" : c.status === "inactive" ? "Inativo" : "Bloqueado"}</Badge></td>
                      <td className="px-3.5 py-3 last:pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)} title="Editar"><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Visualizar">
                            <Link to="/service-orders/customers/$id" params={{ id: c.id }}><Eye className="h-3.5 w-3.5" /></Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyMut.mutate(c.id)} title="Duplicar"><Copy className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(c.id)} title="Excluir"><Trash2 className="h-3.5 w-3.5" /></Button>
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
          {filtered.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Link to="/service-orders/customers/$id" params={{ id: c.id }} className="font-medium hover:underline">{c.name}</Link>
                  <Badge className={statusColors[c.status]} variant="outline">{c.status === "active" ? "Ativo" : c.status === "inactive" ? "Inativo" : "Bloqueado"}</Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>{c.cpf ?? c.cnpj ?? "-"} · {typeLabels[c.type]}</p>
                  <p>{c.email ?? "-"}</p>
                  <p>{c.cellphone ?? c.phone ?? "-"}</p>
                </div>
                <div className="flex gap-1 pt-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil className="h-3 w-3 mr-1" />Editar</Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(c.id)}><Trash2 className="h-3 w-3 mr-1" />Excluir</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar Exclusão</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir este cliente? Esta ação pode ser desfeita através da restauração.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteMut.mutate()}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
