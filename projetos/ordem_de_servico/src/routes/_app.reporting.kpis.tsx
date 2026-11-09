import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Edit3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { kpiService, analyticsService_ext } from "@/modules/reporting/service";
import type { Kpi, KpiCategory } from "@/modules/reporting/types";

export const Route = createFileRoute("/_app/reporting/kpis")({
  head: () => ({ meta: [{ title: "Reporting KPIs — ServiceForge" }] }),
  component: ReportingKpisPage,
});

const categoryOptions = [
  { value: "productivity", label: "Produtividade" },
  { value: "quality", label: "Qualidade" },
  { value: "financial", label: "Financeiro" },
  { value: "operational", label: "Operacional" },
  { value: "commercial", label: "Comercial" },
  { value: "technical", label: "Técnico" },
  { value: "administrative", label: "Administrativo" },
  { value: "custom", label: "Personalizado" },
];

const periodOptions = [
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "quarterly", label: "Trimestral" },
  { value: "yearly", label: "Anual" },
];

function ReportingKpisPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPeriod, setFilterPeriod] = useState<string>("all");

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("productivity");
  const [formValue, setFormValue] = useState("0");
  const [formTarget, setFormTarget] = useState("0");
  const [formUnit, setFormUnit] = useState("");
  const [formPeriod, setFormPeriod] = useState("monthly");
  const [formTrend, setFormTrend] = useState("stable");

  const { data: kpis = [] } = useQuery({
    queryKey: ["reporting", "kpis"],
    queryFn: () => kpiService.list(),
  });

  const { data: summary } = useQuery({
    queryKey: ["reporting", "kpis", "summary"],
    queryFn: () => analyticsService_ext.getKpiSummary(),
  });

  const createMut = useMutation({
    mutationFn: () =>
      kpiService.create({
        name: formName,
        description: formDescription,
        category: formCategory as KpiCategory,
        value: Number(formValue),
        target: Number(formTarget),
        unit: formUnit,
        period: formPeriod as Kpi["period"],
        trend: formTrend as "up" | "down" | "stable",
        trendPercentage: Number(formTarget) > 0 ? ((Number(formValue) - Number(formTarget)) / Number(formTarget)) * 100 : 0,
        icon: "trending-up",
        color: "#22c55e",
        format: "number",
        precision: 2,
        companyId: undefined,
        isGlobal: true,
        favorite: false,
        history: [],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "system",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reporting", "kpis"] });
      qc.invalidateQueries({ queryKey: ["reporting", "kpis", "summary"] });
      setDialogOpen(false);
      resetForm();
      toast.success("KPI criado com sucesso");
    },
    onError: () => toast.error("Erro ao criar KPI"),
  });

  const updateMut = useMutation({
    mutationFn: () =>
      kpiService.update(editingId!, {
        name: formName,
        description: formDescription,
        category: formCategory as KpiCategory,
        value: Number(formValue),
        target: Number(formTarget),
        unit: formUnit,
        period: formPeriod as Kpi["period"],
        trend: formTrend as "up" | "down" | "stable",
        trendPercentage: Number(formTarget) > 0 ? ((Number(formValue) - Number(formTarget)) / Number(formTarget)) * 100 : 0,
        updatedAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reporting", "kpis"] });
      qc.invalidateQueries({ queryKey: ["reporting", "kpis", "summary"] });
      setDialogOpen(false);
      setEditingId(null);
      resetForm();
      toast.success("KPI atualizado com sucesso");
    },
    onError: () => toast.error("Erro ao atualizar KPI"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => kpiService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reporting", "kpis"] });
      qc.invalidateQueries({ queryKey: ["reporting", "kpis", "summary"] });
      toast.success("KPI excluído com sucesso");
    },
    onError: () => toast.error("Erro ao excluir KPI"),
  });

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormCategory("productivity");
    setFormValue("0");
    setFormTarget("0");
    setFormUnit("");
    setFormPeriod("monthly");
    setFormTrend("stable");
  };

  const openEdit = (id: string) => {
    const k = kpis.find((kp) => kp.id === id);
    if (!k) return;
    setEditingId(id);
    setFormName(k.name);
    setFormDescription(k.description);
    setFormCategory(k.category);
    setFormValue(String(k.value));
    setFormTarget(String(k.target));
    setFormUnit(k.unit);
    setFormPeriod(k.period);
    setFormTrend(k.trend);
    setDialogOpen(true);
  };

  const getPercentage = (k: Kpi) => (k.target > 0 ? Math.round((k.value / k.target) * 100) : 0);
  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-amber-500" />;
  };
  const getProgressColor = (pct: number) => (pct >= 100 ? "bg-green-500" : pct >= 90 ? "bg-amber-500" : "bg-red-500");

  const categoryLabel = (cat: string) => categoryOptions.find((o) => o.value === cat)?.label ?? cat;
  const periodLabel = (per: string) => periodOptions.find((o) => o.value === per)?.label ?? per;

  const filtered = kpis.filter((k) => {
    if (filterCategory !== "all" && k.category !== filterCategory) return false;
    if (filterPeriod !== "all" && k.period !== filterPeriod) return false;
    return true;
  });

  const columns: Column<Kpi>[] = [
    {
      key: "name",
      header: "Nome",
      sortable: true,
      sortFn: (a, b) => a.name.localeCompare(b.name),
      render: (k) => <span className="font-medium">{k.name}</span>,
    },
    { key: "value", header: "Valor", render: (k) => <span className="font-semibold">{k.value}</span> },
    { key: "target", header: "Meta", render: (k) => <span className="text-muted-foreground">{k.target}</span> },
    {
      key: "percentage",
      header: "Percentual",
      render: (k) => {
        const pct = getPercentage(k);
        return (
          <div className="flex items-center gap-2 min-w-[120px]">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
              <div
                className={`h-full rounded-full transition-all ${getProgressColor(pct)}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`text-xs font-medium ${pct >= 100 ? "text-green-600" : pct >= 90 ? "text-amber-600" : "text-red-600"}`}>
              {pct}%
            </span>
          </div>
        );
      },
    },
    {
      key: "trend",
      header: "Tendência",
      render: (k) => getTrendIcon(k.trend),
    },
    { key: "period", header: "Período", render: (k) => <span className="text-sm">{periodLabel(k.period)}</span> },
    {
      key: "category",
      header: "Categoria",
      render: (k) => <Badge variant="outline">{categoryLabel(k.category)}</Badge>,
    },
    {
      key: "actions",
      header: "Ações",
      render: (k) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(k.id)}>
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleteId(k.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">KPIs</h1>
          <p className="text-sm text-muted-foreground">Gerencie os indicadores de performance</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />Novo KPI
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total de KPIs</p>
            <p className="text-2xl font-bold">{summary?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Na Meta</p>
            <p className="text-2xl font-bold text-green-600">{summary?.onTarget ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Acima da Meta</p>
            <p className="text-2xl font-bold text-amber-600">{summary?.aboveTarget ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Abaixo da Meta</p>
            <p className="text-2xl font-bold text-red-600">{summary?.belowTarget ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Categoria:</span>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categoryOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Período:</span>
          <Select value={filterPeriod} onValueChange={setFilterPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {periodOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(k) => k.id}
        searchKeys={["name", "description"]}
        initialSortColumn="name"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar KPI" : "Novo KPI"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nome</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nome do KPI" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Descrição</Label>
                <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Descrição opcional" />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Período</Label>
                <Select value={formPeriod} onValueChange={setFormPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input type="number" value={formValue} onChange={(e) => setFormValue(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Meta</Label>
                <Input type="number" value={formTarget} onChange={(e) => setFormTarget(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Input value={formUnit} onChange={(e) => setFormUnit(e.target.value)} placeholder="Ex: %, R$, unidades" />
              </div>
              <div className="space-y-2">
                <Label>Tendência</Label>
                <Select value={formTrend} onValueChange={setFormTrend}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="up">Crescente</SelectItem>
                    <SelectItem value="down">Decrescente</SelectItem>
                    <SelectItem value="stable">Estável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" type="button" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => (editingId ? updateMut.mutate() : createMut.mutate())}
                disabled={!formName}
              >
                {editingId ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
        onConfirm={() => {
          if (deleteId) {
            deleteMut.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        title="Excluir KPI"
        description="Tem certeza que deseja excluir este KPI? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}