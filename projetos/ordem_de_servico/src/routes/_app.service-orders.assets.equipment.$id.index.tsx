import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRightLeft, Camera, Package, FileText, User, CalendarDays, Hash, BadgeInfo, Tags, FileSignature, ShieldCheck, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { deviceService } from "@/modules/devices/service";
import { customerService } from "@/modules/customers/service";
import { brandService } from "@/modules/brands/service";
import { modelService } from "@/modules/models/service";
import { equipmentTypeService } from "@/modules/equipment-types/service";

export const Route = createFileRoute("/_app/service-orders/assets/equipment/$id/")({
  head: () => ({ meta: [{ title: "Visão Geral — ServiceForge" }] }),
  component: EquipmentOverviewTab,
});

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700", inactive: "bg-gray-100 text-gray-700",
  in_maintenance: "bg-amber-100 text-amber-700", deactivated: "bg-red-100 text-red-700",
};
const statusLabels: Record<string, string> = {
  active: "Ativo", inactive: "Inativo", in_maintenance: "Em Manutenção", deactivated: "Desativado",
};

function EquipmentOverviewTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferCustomerId, setTransferCustomerId] = useState("");
  const [transferNotes, setTransferNotes] = useState("");

  const { data: device, isLoading } = useQuery({
    queryKey: ["device", id],
    queryFn: () => deviceService.get(id),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => customerService.list(),
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

  const customerMap = Object.fromEntries(customers.map((c) => [c.id, c.name]));
  const brandMap = Object.fromEntries(brands.map((b) => [b.id, b.name]));
  const modelMap = Object.fromEntries(models.map((m) => [m.id, m.name]));
  const typeMap = Object.fromEntries(types.map((t) => [t.id, t.name]));

  const currentCustomer = device ? customers.find((c) => c.id === device.customerId) : null;

  const transferMut = useMutation({
    mutationFn: () => deviceService.transferOwner(id, transferCustomerId, customerMap[transferCustomerId] ?? "", "Sistema", transferNotes || undefined),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["device", id] }); setTransferOpen(false); setTransferCustomerId(""); setTransferNotes(""); toast.success("Transferência realizada"); },
    onError: () => toast.error("Erro ao transferir"),
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;
  if (!device) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Equipamento não encontrado</p></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Informações do Equipamento</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Tipo:</span><p className="font-medium">{device.equipmentTypeId ? typeMap[device.equipmentTypeId] ?? device.type ?? "-" : device.type ?? "-"}</p></div>
              <div><span className="text-muted-foreground">Marca:</span><p className="font-medium">{device.brandId ? brandMap[device.brandId] ?? "-" : "-"}</p></div>
              <div><span className="text-muted-foreground">Modelo:</span><p className="font-medium">{device.modelId ? modelMap[device.modelId] ?? "-" : "-"}</p></div>
              <div><span className="text-muted-foreground">Serial:</span><p className="font-medium">{device.serialNumber ?? "-"}</p></div>
              <div><span className="text-muted-foreground">IMEI:</span><p className="font-medium">{device.imei ?? "-"}</p></div>
              <div><span className="text-muted-foreground">Patrimônio:</span><p className="font-medium">{device.assetNumber ?? "-"}</p></div>
              <div><span className="text-muted-foreground">Cor:</span><p className="font-medium">{device.color ?? "-"}</p></div>
              {device.purchaseDate && <div><span className="text-muted-foreground">Data da Compra:</span><p className="font-medium">{new Date(device.purchaseDate).toLocaleDateString("pt-BR")}</p></div>}
              {device.invoiceNumber && <div><span className="text-muted-foreground">Nota Fiscal:</span><p className="font-medium">{device.invoiceNumber}</p></div>}
              <div><span className="text-muted-foreground">Garantia:</span><p className="font-medium">{device.warrantyId ?? device.manufacturerWarranty ?? "Sem garantia"}</p></div>
              <div><span className="text-muted-foreground">Status:</span><Badge className={statusColors[device.status]} variant="outline">{statusLabels[device.status]}</Badge></div>
              {device.tags && <div><span className="text-muted-foreground">Tags:</span><p className="font-medium">{device.tags}</p></div>}
              {device.notes && <div className="col-span-2"><span className="text-muted-foreground">Observações:</span><p className="font-medium whitespace-pre-wrap">{device.notes}</p></div>}
            </div>
          </CardContent>
        </Card>

        {currentCustomer && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" />Cliente</CardTitle>
              <Link to="/service-orders/customers/$id" params={{ id: currentCustomer.id }} className="text-sm text-primary hover:underline">Ver Cliente</Link>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <p className="font-medium">{currentCustomer.name}</p>
                <p className="text-muted-foreground">{currentCustomer.email ?? ""}{currentCustomer.phone ? ` · ${currentCustomer.phone}` : ""}</p>
                {(currentCustomer.addresses ?? []).length > 0 && (
                  <p className="text-muted-foreground">{currentCustomer.addresses![0].street}, {currentCustomer.addresses![0].number} - {currentCustomer.addresses![0].city}/{currentCustomer.addresses![0].state}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Ações Rápidas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start"><ArrowRightLeft className="mr-2 h-4 w-4" />Transferir</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Transferir Equipamento</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1"><Label>Cliente Destino</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={transferCustomerId} onChange={(e) => setTransferCustomerId(e.target.value)}>
                      <option value="">Selecione...</option>
                      {customers.filter((c) => c.id !== device.customerId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1"><Label>Observações</Label><textarea className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={transferNotes} onChange={(e) => setTransferNotes(e.target.value)} /></div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => { setTransferOpen(false); setTransferCustomerId(""); setTransferNotes(""); }}>Cancelar</Button>
                  <Button onClick={() => transferMut.mutate()} disabled={!transferCustomerId || transferMut.isPending}>{transferMut.isPending ? "Transferindo..." : "Transferir"}</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/service-orders/assets/equipment/$id/photos" params={{ id }}><Camera className="mr-2 h-4 w-4" />Adicionar Foto</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/service-orders/assets/equipment/$id/accessories" params={{ id }}><Package className="mr-2 h-4 w-4" />Adicionar Acessório</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/service-orders/assets/equipment/$id/documents" params={{ id }}><FileText className="mr-2 h-4 w-4" />Adicionar Documento</Link>
            </Button>
          </CardContent>
        </Card>

        {(device.transfers ?? []).length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Última Transferência</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <p>De: {device.transfers!.slice(-1)[0].fromCustomerName || "Anterior"}</p>
                <p>Para: {device.transfers!.slice(-1)[0].toCustomerName}</p>
                <p className="text-xs text-muted-foreground">{new Date(device.transfers!.slice(-1)[0].transferredAt).toLocaleDateString("pt-BR")}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
