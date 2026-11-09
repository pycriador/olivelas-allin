import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit3, Building2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { companyService } from "@/modules/company/service";
import { DocButton } from "@/components/doc-button";
import { useTranslation } from "@/core/i18n/I18nProvider";
import type { Company } from "@/modules/company/types";

const companySchema = z.object({
  legalName: z.string().min(1, "Razão Social é obrigatória"),
  tradeName: z.string().min(1, "Nome Fantasia é obrigatório"),
  cnpj: z.string().min(1, "CNPJ é obrigatório"),
  stateRegistration: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  website: z.string().optional(),
  zipCode: z.string().optional(),
  address: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive"]),
});

type CompanyForm = z.infer<typeof companySchema>;

export const Route = createFileRoute("/_app/admin/companies")({
  head: () => ({ meta: [{ title: "Admin Empresas — ServiceForge" }] }),
  component: AdminCompaniesPage,
});

function AdminCompaniesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: companies = [] } = useQuery({
    queryKey: ["admin", "companies"],
    queryFn: () => companyService.list(),
  });

  const form = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: { status: "active", country: "Brasil" },
  });

  const createMut = useMutation({
    mutationFn: (data: CompanyForm) => {
      const now = new Date().toISOString();
      return companyService.create({
        ...data as unknown as Omit<Company, "id">,
        stateRegistration: data.stateRegistration ?? "",
        logoUrl: "",
        settings: { theme: "system", language: "pt-BR", databaseUsed: "", logoUrl: "", primaryColor: "#0066CC", secondaryColor: "#00AA88", documentFooter: "", defaultMessage: "" },
        createdBy: "admin-0",
        createdAt: now,
        updatedBy: "admin-0",
        updatedAt: now,
        deletedBy: null,
        deletedAt: null,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "companies"] }); setDialogOpen(false); form.reset(); toast.success("Empresa criada"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompanyForm }) => {
      return companyService.update(id, { ...data, updatedAt: new Date().toISOString() });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "companies"] }); setDialogOpen(false); setEditingId(null); form.reset(); toast.success("Empresa atualizada"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => companyService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "companies"] }); toast.success("Empresa excluída"); },
  });

  const openEdit = async (id: string) => {
    const c = companies.find((c) => c.id === id);
    if (!c) return;
    setEditingId(id);
    form.reset({
      legalName: c.legalName, tradeName: c.tradeName, cnpj: c.cnpj,
      stateRegistration: c.stateRegistration, phone: c.phone, whatsapp: c.whatsapp,
      email: c.email, website: c.website, zipCode: c.zipCode, address: c.address,
      number: c.number, complement: c.complement, city: c.city, state: c.state,
      country: c.country, notes: c.notes, status: c.status,
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    form.reset({ status: "active", country: "Brasil" });
    setDialogOpen(true);
  };

  const columns: Column<Company>[] = [
    { key: "tradeName", header: "Nome Fantasia", sortable: true, sortFn: (a, b) => a.tradeName.localeCompare(b.tradeName), render: (c) => (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">{c.tradeName}</div>
          <div className="text-xs text-muted-foreground">{c.legalName}</div>
        </div>
      </div>
    )},
    { key: "cnpj", header: "CNPJ", render: (c) => <span className="text-sm">{c.cnpj}</span> },
    { key: "city", header: "Cidade", sortable: true, sortFn: (a, b) => a.city.localeCompare(b.city), render: (c) => (
      <span className="text-sm">{c.city}/{c.state}</span>
    )},
    { key: "status", header: "Status", render: (c) => (
      <Badge variant={c.status === "active" ? "default" : "secondary"} className="gap-1">
        {c.status === "active" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        {c.status === "active" ? "Ativo" : "Inativo"}
      </Badge>
    )},
    { key: "phone", header: "Telefone", render: (c) => <span className="text-sm">{c.phone || "—"}</span> },
    { key: "actions", header: "Ações", render: (c) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => openEdit(c.id)}><Edit3 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{t("admin.companies")}</h1>
            <DocButton module="admin" page="companies" title="Empresas" />
          </div>
          <p className="text-sm text-muted-foreground">{t("companies.subtitle")}</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />{t("admin.newCompany")}</Button>
      </div>

      <DataTable
        data={companies}
        columns={columns}
        keyExtractor={(c) => c.id}
        searchKeys={["tradeName", "legalName", "cnpj", "city", "phone"]}
        initialSortColumn="tradeName"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? t("admin.editCompany") : t("admin.newCompany")}</DialogTitle>
            <DialogDescription>Preencha os dados da empresa</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((v) => editingId ? updateMut.mutate({ id: editingId, data: v }) : createMut.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t("admin.legalName")}</Label><Input {...form.register("legalName")} /></div>
              <div className="space-y-2"><Label>{t("admin.tradeName")}</Label><Input {...form.register("tradeName")} /></div>
              <div className="space-y-2"><Label>CNPJ</Label><Input {...form.register("cnpj")} /></div>
              <div className="space-y-2"><Label>{t("admin.stateRegistration")}</Label><Input {...form.register("stateRegistration")} /></div>
              <div className="space-y-2"><Label>{t("companies.phone")}</Label><Input {...form.register("phone")} /></div>
              <div className="space-y-2"><Label>{t("admin.whatsapp")}</Label><Input {...form.register("whatsapp")} /></div>
              <div className="space-y-2"><Label>{t("admin.email")}</Label><Input type="email" {...form.register("email")} /></div>
              <div className="space-y-2"><Label>{t("admin.website")}</Label><Input {...form.register("website")} /></div>
              <div className="space-y-2"><Label>{t("admin.zipCode")}</Label><Input {...form.register("zipCode")} /></div>
              <div className="space-y-2"><Label>{t("companies.address")}</Label><Input {...form.register("address")} /></div>
              <div className="space-y-2"><Label>{t("admin.number")}</Label><Input {...form.register("number")} /></div>
              <div className="space-y-2"><Label>{t("admin.complement")}</Label><Input {...form.register("complement")} /></div>
              <div className="space-y-2"><Label>{t("admin.city")}</Label><Input {...form.register("city")} /></div>
              <div className="space-y-2"><Label>{t("admin.state")}</Label><Input {...form.register("state")} /></div>
              <div className="space-y-2"><Label>{t("admin.country")}</Label><Input {...form.register("country")} /></div>
              <div className="space-y-2"><Label>{t("database.status")}</Label>
                <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as "active" | "inactive")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>{t("admin.notes")}</Label><Textarea {...form.register("notes")} /></div>
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
