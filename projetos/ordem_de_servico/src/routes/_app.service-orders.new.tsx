import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Search, User, Monitor, ClipboardList, AlertTriangle, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { serviceOrderService } from "@/modules/service-orders/service";
import { customerService } from "@/modules/customers/service";
import { deviceService } from "@/modules/devices/service";
import type { Customer } from "@/modules/customers/types";
import type { Device } from "@/modules/devices/types";

export const Route = createFileRoute("/_app/service-orders/new")({
  head: () => ({ meta: [{ title: "Nova OS — ServiceForge" }] }),
  component: NewServiceOrderWizard,
});

const steps = [
  { id: 1, label: "Cliente" },
  { id: 2, label: "Equipamento" },
  { id: 3, label: "Recebimento" },
  { id: 4, label: "Problema" },
  { id: 5, label: "Resumo" },
];

const checklistItems = [
  "Liga?", "Tela quebrada?", "Oxidação?", "Carcaça danificada?",
  "Teclado funcionando?", "Bateria presente?", "Fonte entregue?",
  "Controle remoto?", "Cabos?", "Manual?", "Caixa?",
];

function NewServiceOrderWizard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(1);

  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [observations, setObservations] = useState("");
  const [accessories, setAccessories] = useState<{ name: string; quantity: number }[]>([]);

  const [defeitoRelatado, setDefeitoRelatado] = useState("");
  const [sintomas, setSintomas] = useState("");
  const [obsProblema, setObsProblema] = useState("");
  const [prioridade, setPrioridade] = useState("medium");
  const [origem, setOrigem] = useState("Presencial");
  const [canal, setCanal] = useState("Presencial");

  // Quick Customer Registration Modal State
  const [quickCustomerOpen, setQuickCustomerOpen] = useState(false);
  const [quickCustomerSubmitting, setQuickCustomerSubmitting] = useState(false);
  const [quickCustomerForm, setQuickCustomerForm] = useState({
    name: "",
    type: "individual" as "individual" | "legal",
    doc: "",
    phone: "",
    email: "",
    city: "",
  });

  // Quick Device Registration Modal State
  const [quickDeviceOpen, setQuickDeviceOpen] = useState(false);
  const [quickDeviceSubmitting, setQuickDeviceSubmitting] = useState(false);
  const [quickDeviceForm, setQuickDeviceForm] = useState({
    type: "Notebook",
    brand: "",
    model: "",
    serialNumber: "",
    color: "",
    notes: "",
  });

  const handleOpenQuickCustomer = (initialName = "") => {
    setQuickCustomerForm({
      name: initialName.trim(),
      type: "individual",
      doc: "",
      phone: "",
      email: "",
      city: "",
    });
    setQuickCustomerOpen(true);
  };

  const handleQuickCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustomerForm.name.trim()) {
      toast.error("Informe o nome do cliente");
      return;
    }
    setQuickCustomerSubmitting(true);
    try {
      const created = await customerService.create({
        name: quickCustomerForm.name.trim(),
        type: quickCustomerForm.type,
        cpf: quickCustomerForm.type === "individual" ? quickCustomerForm.doc.trim() : undefined,
        cnpj: quickCustomerForm.type === "legal" ? quickCustomerForm.doc.trim() : undefined,
        phone: quickCustomerForm.phone.trim(),
        whatsapp: quickCustomerForm.phone.trim(),
        email: quickCustomerForm.email.trim() || undefined,
        status: "active",
        addresses: quickCustomerForm.city.trim() ? [{
          id: `addr-${Date.now()}`,
          label: "Principal",
          street: "",
          number: "",
          neighborhood: "",
          city: quickCustomerForm.city.trim(),
          state: "SP",
          zipCode: "",
          country: "Brasil",
          isDefault: true,
          addressType: "residential",
        }] : [],
      } as any);

      await qc.invalidateQueries({ queryKey: ["customers-search"] });
      await qc.invalidateQueries({ queryKey: ["customers"] });

      setSelectedCustomer(created);
      setCustomerSearch(created.name);
      setQuickCustomerOpen(false);
      toast.success(`Cliente "${created.name}" cadastrado e selecionado!`);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao cadastrar cliente: " + (err?.message || "Tente novamente"));
    } finally {
      setQuickCustomerSubmitting(false);
    }
  };

  const handleOpenQuickDevice = () => {
    setQuickDeviceForm({
      type: "Notebook",
      brand: "",
      model: "",
      serialNumber: "",
      color: "",
      notes: "",
    });
    setQuickDeviceOpen(true);
  };

  const handleQuickDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      toast.error("Selecione um cliente primeiro.");
      return;
    }
    setQuickDeviceSubmitting(true);
    try {
      const created = await deviceService.create({
        customerId: selectedCustomer.id,
        type: quickDeviceForm.type,
        brandId: quickDeviceForm.brand.trim() || undefined,
        modelId: quickDeviceForm.model.trim() || undefined,
        serialNumber: quickDeviceForm.serialNumber.trim() || `SN-${Date.now().toString().slice(-6)}`,
        color: quickDeviceForm.color.trim() || undefined,
        notes: quickDeviceForm.notes.trim() || undefined,
        status: "active",
      } as any);

      await qc.invalidateQueries({ queryKey: ["devices-by-customer", selectedCustomer.id] });
      await qc.invalidateQueries({ queryKey: ["devices"] });

      setSelectedDevice(created);
      setQuickDeviceOpen(false);
      toast.success(`Equipamento cadastrado e vinculado ao cliente!`);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao cadastrar equipamento: " + (err?.message || "Tente novamente"));
    } finally {
      setQuickDeviceSubmitting(false);
    }
  };

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-search", customerSearch],
    queryFn: () => customerService.searchCustomers(customerSearch),
    enabled: customerSearch.length > 0,
  });

  const { data: devices = [] } = useQuery({
    queryKey: ["devices-by-customer", selectedCustomer?.id],
    queryFn: () => deviceService.getByCustomer(selectedCustomer!.id),
    enabled: !!selectedCustomer,
  });

  const { data: deviceHistory = [] } = useQuery({
    queryKey: ["device-history", selectedDevice?.id],
    queryFn: () => serviceOrderService.getDeviceHistory(selectedDevice!.id),
    enabled: !!selectedDevice,
  });

  const createMut = useMutation({
    mutationFn: () => serviceOrderService.create({
      customerId: selectedCustomer!.id,
      customerName: selectedCustomer!.name,
      deviceId: selectedDevice?.id,
      deviceInfo: selectedDevice ? `${selectedDevice.type ?? ""} ${selectedDevice.brandId ?? ""} ${selectedDevice.modelId ?? ""} S/N: ${selectedDevice.serialNumber ?? ""}`.trim() : undefined,
      description: defeitoRelatado,
      diagnosis: sintomas,
      notes: [observations, obsProblema].filter(Boolean).join("\n"),
      priority: prioridade as "low" | "medium" | "high" | "urgent",
    }, "Admin"),
    onSuccess: async (created) => {
      if (Object.keys(checklist).length > 0) {
        const checkedItems = Object.entries(checklist).filter(([_, v]) => v).map(([k]) => k);
        if (checkedItems.length > 0) {
          await serviceOrderService.createChecklist(created.id, {
            templateName: "Recebimento",
            items: checkedItems,
          }, "Admin");
        }
      }
      qc.invalidateQueries({ queryKey: ["service-orders"] });
      toast("OS criada com sucesso!");
      navigate({ to: "/service-orders/$id", params: { id: created.id } });
    },
    onError: () => toast("Erro ao criar OS"),
  });

  const canGoNext = () => {
    switch (step) {
      case 1: return !!selectedCustomer;
      case 2: return true;
      case 3: return true;
      case 4: return defeitoRelatado.trim().length > 0;
      default: return true;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-6 sm:mb-8 overflow-x-auto py-1 max-w-full">
      {steps.map((s, idx) => (
        <div key={s.id} className="flex items-center shrink-0">
          <button
            type="button"
            disabled={s.id > step && !(s.id < step)}
            onClick={() => { if (s.id < step) setStep(s.id); }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
              s.id === step ? "bg-primary text-primary-foreground font-semibold" :
              s.id < step ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 cursor-pointer hover:bg-emerald-200" :
              "bg-muted text-muted-foreground"
            }`}
          >
            {s.id < step ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <span>{s.id}</span>}
            <span className="hidden sm:inline">{s.label}</span>
          </button>
          {idx < steps.length - 1 && (
            <div className={`h-px w-3 sm:w-8 mx-0.5 sm:mx-1 ${s.id < step ? "bg-emerald-400 dark:bg-emerald-600" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        {step > 1 && (
          <Button variant="ghost" size="icon" onClick={() => setStep(step - 1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nova Ordem de Serviço</h1>
          <p className="text-sm text-muted-foreground">Passo {step} de 5 — {steps.find((s) => s.id === step)?.label}</p>
        </div>
      </div>

      {renderStepIndicator()}

      {step === 1 && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Buscar Cliente</CardTitle>
                <CardDescription>Pesquise por nome, CPF, CNPJ, e-mail ou telefone</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenQuickCustomer(customerSearch)}
                className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
              >
                <Plus className="h-4 w-4" /> Cadastro Rápido
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Digite para buscar..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
              </div>
              {customerSearch.length > 0 && customers.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {customers.map((c) => (
                    <div key={c.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedCustomer?.id === c.id ? "border-primary bg-primary/5" : "hover:bg-muted"
                    }`} onClick={() => setSelectedCustomer(c)}>
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.cpf && `CPF: ${c.cpf}`}{c.cnpj && `CNPJ: ${c.cnpj}`}
                          {c.email && ` | ${c.email}`}{c.phone && ` | ${c.phone}`}
                        </p>
                      </div>
                      {selectedCustomer?.id === c.id && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  ))}
                </div>
              )}
              {customerSearch.length > 0 && customers.length === 0 && (
                <div className="text-center py-6 space-y-3 rounded-lg border border-dashed p-4 bg-muted/20">
                  <p className="text-sm text-muted-foreground">Nenhum cliente encontrado para "{customerSearch}"</p>
                  <Button variant="default" size="sm" onClick={() => handleOpenQuickCustomer(customerSearch)} className="gap-1.5">
                    <Plus className="h-4 w-4" /> Cadastrar "{customerSearch}" Agora
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedCustomer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" /> Cliente Selecionado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Nome:</span> {selectedCustomer.name}</div>
                  {selectedCustomer.cpf && <div><span className="text-muted-foreground">CPF:</span> {selectedCustomer.cpf}</div>}
                  {selectedCustomer.cnpj && <div><span className="text-muted-foreground">CNPJ:</span> {selectedCustomer.cnpj}</div>}
                  {selectedCustomer.email && <div><span className="text-muted-foreground">Email:</span> {selectedCustomer.email}</div>}
                  {selectedCustomer.phone && <div><span className="text-muted-foreground">Telefone:</span> {selectedCustomer.phone}</div>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {!selectedCustomer ? (
            <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Selecione um cliente primeiro.</CardContent></Card>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Monitor className="h-4 w-4" /> Equipamentos de {selectedCustomer.name}
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                    onClick={handleOpenQuickDevice}
                  >
                    <Plus className="h-4 w-4" /> Novo Equipamento
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {devices.length === 0 ? (
                    <div className="text-center py-6 space-y-3 rounded-lg border border-dashed p-4 bg-muted/20">
                      <p className="text-sm text-muted-foreground">Nenhum equipamento cadastrado para este cliente.</p>
                      <Button variant="default" size="sm" className="gap-1.5" onClick={handleOpenQuickDevice}>
                        <Plus className="h-4 w-4" /> Cadastrar Equipamento Agora
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {devices.map((d) => (
                        <div key={d.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedDevice?.id === d.id ? "border-primary bg-primary/5" : "hover:bg-muted"
                        }`} onClick={() => setSelectedDevice(d)}>
                          <div>
                            <p className="text-sm font-medium">{d.type ?? "Equipamento"} {d.brandId ?? ""} {d.modelId ?? ""}</p>
                            <p className="text-xs text-muted-foreground">S/N: {d.serialNumber ?? "N/A"} | {d.status}</p>
                          </div>
                          {selectedDevice?.id === d.id && <Check className="h-4 w-4 text-primary" />}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedDevice && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Equipamento Selecionado</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Tipo:</span> {selectedDevice.type ?? "N/A"}</div>
                      <div><span className="text-muted-foreground">Serial:</span> {selectedDevice.serialNumber ?? "N/A"}</div>
                      {selectedDevice.imei && <div><span className="text-muted-foreground">IMEI:</span> {selectedDevice.imei}</div>}
                      {selectedDevice.color && <div><span className="text-muted-foreground">Cor:</span> {selectedDevice.color}</div>}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Histórico de Serviços</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {deviceHistory.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum serviço anterior.</p>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {deviceHistory.slice(0, 5).map((so) => (
                            <div key={so.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                              <span className="font-medium">{so.number}</span>
                              <span className="text-muted-foreground">{so.statusLabel}</span>
                              <span className="text-xs text-muted-foreground">{so.entryDate}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4" /> Checklist de Recebimento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {checklistItems.map((item) => (
                <label key={item} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={checklist[item] ?? false}
                    onChange={(e) => setChecklist((prev) => ({ ...prev, [item]: e.target.checked }))}
                  />
                  <span className="text-sm">{item}</span>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Observações sobre o estado físico do equipamento..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acessórios Entregues</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {accessories.map((acc, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder="Nome do acessório"
                    value={acc.name}
                    onChange={(e) => {
                      const updated = [...accessories];
                      updated[idx] = { ...updated[idx], name: e.target.value };
                      setAccessories(updated);
                    }}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Qtd"
                    value={acc.quantity}
                    onChange={(e) => {
                      const updated = [...accessories];
                      updated[idx] = { ...updated[idx], quantity: Number(e.target.value) };
                      setAccessories(updated);
                    }}
                    className="w-20"
                  />
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500" onClick={() => setAccessories(accessories.filter((_, i) => i !== idx))}>
                    &times;
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setAccessories([...accessories, { name: "", quantity: 1 }])}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar acessório
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Problema Informado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Defeito relatado *</Label>
                <Textarea
                  placeholder="Descreva o defeito relatado pelo cliente..."
                  value={defeitoRelatado}
                  onChange={(e) => setDefeitoRelatado(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>Sintomas</Label>
                <Textarea
                  placeholder="Sintomas observados..."
                  value={sintomas}
                  onChange={(e) => setSintomas(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  placeholder="Observações adicionais..."
                  value={obsProblema}
                  onChange={(e) => setObsProblema(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <Label>Prioridade</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>
                    <option value="low">Baixa</option>
                    <option value="medium">Normal</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
                <div>
                  <Label>Origem</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={origem} onChange={(e) => setOrigem(e.target.value)}>
                    <option value="Presencial">Presencial</option>
                    <option value="Telefone">Telefone</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Email">Email</option>
                    <option value="Portal">Portal</option>
                  </select>
                </div>
                <div>
                  <Label>Canal</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={canal} onChange={(e) => setCanal(e.target.value)}>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Telefone">Telefone</option>
                    <option value="Email">Email</option>
                    <option value="Presencial">Presencial</option>
                    <option value="Portal">Portal</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Resumo da OS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Cliente</h3>
                <div className="p-3 rounded-lg bg-muted/50 text-sm">
                  <p className="font-medium">{selectedCustomer?.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedCustomer?.cpf ?? selectedCustomer?.cnpj ?? ""} | {selectedCustomer?.email ?? ""}</p>
                </div>
              </div>
              {selectedDevice && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Equipamento</h3>
                  <div className="p-3 rounded-lg bg-muted/50 text-sm">
                    <p className="font-medium">{selectedDevice.type} - {selectedDevice.serialNumber}</p>
                  </div>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Recebimento</h3>
                <div className="p-3 rounded-lg bg-muted/50 text-sm">
                  <p>Itens marcados: {Object.values(checklist).filter(Boolean).length}/{checklistItems.length}</p>
                  {accessories.filter((a) => a.name).length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Acessórios: {accessories.filter((a) => a.name).map((a) => `${a.name}x${a.quantity}`).join(", ")}</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Problema</h3>
                <div className="p-3 rounded-lg bg-muted/50 text-sm">
                  <p><span className="font-medium">Defeito:</span> {defeitoRelatado}</p>
                  {sintomas && <p className="mt-1"><span className="font-medium">Sintomas:</span> {sintomas}</p>}
                  <div className="mt-1 flex items-center gap-1.5"><span className="font-medium">Prioridade:</span> <Badge variant="outline">{prioridade}</Badge></div>
                  <p className="mt-1 text-xs text-muted-foreground">Origem: {origem} | Canal: {canal}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button size="lg" onClick={() => createMut.mutate()} disabled={createMut.isPending}>
              {createMut.isPending ? "Criando..." : "Gerar Ordem de Serviço"}
            </Button>
          </div>
        </div>
      )}

      {step < 5 && (
        <div className="flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
          ) : <div />}
          <Button onClick={() => setStep(step + 1)} disabled={!canGoNext()}>
            Próximo <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Dialog: Cadastro Rápido de Cliente */}
      <Dialog open={quickCustomerOpen} onOpenChange={setQuickCustomerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Cadastro Rápido de Cliente
            </DialogTitle>
            <DialogDescription>
              Cadastre o cliente para avançar com a abertura da Ordem de Serviço.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuickCustomerSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Tipo de Pessoa</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={quickCustomerForm.type === "individual" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setQuickCustomerForm((p) => ({ ...p, type: "individual" }))}
                >
                  Pessoa Física (CPF)
                </Button>
                <Button
                  type="button"
                  variant={quickCustomerForm.type === "legal" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setQuickCustomerForm((p) => ({ ...p, type: "legal" }))}
                >
                  Pessoa Jurídica (CNPJ)
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="qc-name">
                {quickCustomerForm.type === "individual" ? "Nome Completo" : "Razão Social / Nome Fantasia"} *
              </Label>
              <Input
                id="qc-name"
                required
                placeholder="Ex: João da Silva ou Silva & Santos Ltda"
                value={quickCustomerForm.name}
                onChange={(e) => setQuickCustomerForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="qc-doc">
                  {quickCustomerForm.type === "individual" ? "CPF" : "CNPJ"}
                </Label>
                <Input
                  id="qc-doc"
                  placeholder={quickCustomerForm.type === "individual" ? "000.000.000-00" : "00.000.000/0000-00"}
                  value={quickCustomerForm.doc}
                  onChange={(e) => setQuickCustomerForm((p) => ({ ...p, doc: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qc-phone">Telefone / WhatsApp *</Label>
                <Input
                  id="qc-phone"
                  required
                  placeholder="(00) 00000-0000"
                  value={quickCustomerForm.phone}
                  onChange={(e) => setQuickCustomerForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="qc-email">E-mail (opcional)</Label>
                <Input
                  id="qc-email"
                  type="email"
                  placeholder="cliente@email.com"
                  value={quickCustomerForm.email}
                  onChange={(e) => setQuickCustomerForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qc-city">Cidade (opcional)</Label>
                <Input
                  id="qc-city"
                  placeholder="São Paulo"
                  value={quickCustomerForm.city}
                  onChange={(e) => setQuickCustomerForm((p) => ({ ...p, city: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setQuickCustomerOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={quickCustomerSubmitting}>
                {quickCustomerSubmitting ? "Salvando..." : "Cadastrar e Selecionar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Cadastro Rápido de Equipamento */}
      <Dialog open={quickDeviceOpen} onOpenChange={setQuickDeviceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" /> Cadastrar Novo Equipamento
            </DialogTitle>
            <DialogDescription>
              {selectedCustomer ? `Vincular equipamento ao cliente ${selectedCustomer.name}.` : "Vincule o equipamento à Ordem de Serviço."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuickDeviceSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="qd-type">Tipo de Equipamento *</Label>
                <Input
                  id="qd-type"
                  required
                  placeholder="Notebook, Smartphone, etc"
                  value={quickDeviceForm.type}
                  onChange={(e) => setQuickDeviceForm((p) => ({ ...p, type: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qd-brand">Marca</Label>
                <Input
                  id="qd-brand"
                  placeholder="Ex: Dell, Apple, Samsung"
                  value={quickDeviceForm.brand}
                  onChange={(e) => setQuickDeviceForm((p) => ({ ...p, brand: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="qd-model">Modelo</Label>
                <Input
                  id="qd-model"
                  placeholder="Ex: Inspiron 15, Galaxy S23"
                  value={quickDeviceForm.model}
                  onChange={(e) => setQuickDeviceForm((p) => ({ ...p, model: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qd-serial">Nº de Série</Label>
                <Input
                  id="qd-serial"
                  placeholder="Serial ou S/N"
                  value={quickDeviceForm.serialNumber}
                  onChange={(e) => setQuickDeviceForm((p) => ({ ...p, serialNumber: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="qd-color">Cor</Label>
                <Input
                  id="qd-color"
                  placeholder="Ex: Preto, Prata, Azul"
                  value={quickDeviceForm.color}
                  onChange={(e) => setQuickDeviceForm((p) => ({ ...p, color: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qd-notes">Observações</Label>
                <Input
                  id="qd-notes"
                  placeholder="Ex: Acompanha capa protetora"
                  value={quickDeviceForm.notes}
                  onChange={(e) => setQuickDeviceForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setQuickDeviceOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={quickDeviceSubmitting}>
                {quickDeviceSubmitting ? "Cadastrando..." : "Cadastrar e Vincular"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
