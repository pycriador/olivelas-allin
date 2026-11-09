import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  UserCheck, Building2, Save, Smartphone, Mail, MessageSquare, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, type Column } from "@/components/data-table";
import { clientPreferencesService, companyPreferencesService, addAuditEvent } from "@/modules/communication/service";
import { DocButton } from "@/components/doc-button";
import type { ClientPreferences, ChannelType } from "@/modules/communication/types";
import { CHANNEL_TYPE_LABELS } from "@/modules/communication/types";

export const Route = createFileRoute("/_app/communication/preferences")({
  head: () => ({ meta: [{ title: "Preferences — ServiceForge" }] }),
  component: PreferencesPage,
});

function PreferencesPage() {
  const qc = useQueryClient();

  const { data: clientPrefs = [] } = useQuery({
    queryKey: ["comm", "client-prefs"],
    queryFn: () => clientPreferencesService.list(),
  });

  const { data: companyPref } = useQuery({
    queryKey: ["comm", "company-prefs", "company-1"],
    queryFn: () => companyPreferencesService.get("company-1"),
  });

  const [editClientId, setEditClientId] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState(true);
  const [email, setEmail] = useState(true);
  const [sms, setSms] = useState(false);
  const [notif, setNotif] = useState(true);

  const [compChannel, setCompChannel] = useState<ChannelType>(companyPref?.defaultChannel ?? "email");
  const [startHour, setStartHour] = useState(companyPref?.allowStartHour ?? "08:00");
  const [endHour, setEndHour] = useState(companyPref?.allowEndHour ?? "18:00");
  const [signature, setSignature] = useState(companyPref?.defaultSignature ?? "");
  const [maxRetries, setMaxRetries] = useState(companyPref?.maxRetries ?? 3);
  const [retryInterval, setRetryInterval] = useState(companyPref?.retryIntervalMinutes ?? 30);

  const clientMut = useMutation({
    mutationFn: async ({ clientId, clientName, data }: { clientId: string; clientName: string; data: Partial<ClientPreferences> }) => {
      const result = await clientPreferencesService.upsert(clientId, { ...data, clientName });
      await addAuditEvent("preferences-updated", "admin", "Admin", `Preferências do cliente ${clientName} alteradas`, clientId, "client-preferences");
      return result;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm", "client-prefs"] }); setEditClientId(null); toast.success("Preferências salvas"); },
  });

  const companyMut = useMutation({
    mutationFn: async () => {
      const result = await companyPreferencesService.upsert("company-1", {
        defaultChannel: compChannel, allowStartHour: startHour, allowEndHour: endHour,
        defaultSignature: signature, maxRetries, retryIntervalMinutes: retryInterval,
      });
      await addAuditEvent("preferences-updated", "admin", "Admin", "Preferências da empresa alteradas", "company-1", "company-preferences");
      return result;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm", "company-prefs"] }); toast.success("Preferências da empresa salvas"); },
  });

  const columns: Column<ClientPreferences>[] = [
    { key: "clientName", header: "Cliente", render: (e) => (
      <div className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{e.clientName}</span></div>
    )},
    { key: "receiveEmail", header: "E-mail", render: (e) => <Badge variant={e.receiveEmail ? "default" : "secondary"}>{e.receiveEmail ? "Sim" : "Não"}</Badge> },
    { key: "receiveWhatsApp", header: "WhatsApp", render: (e) => <Badge variant={e.receiveWhatsApp ? "default" : "secondary"}>{e.receiveWhatsApp ? "Sim" : "Não"}</Badge> },
    { key: "receiveSMS", header: "SMS", render: (e) => <Badge variant={e.receiveSMS ? "default" : "secondary"}>{e.receiveSMS ? "Sim" : "Não"}</Badge> },
    { key: "receiveNotifications", header: "Notificações", render: (e) => <Badge variant={e.receiveNotifications ? "default" : "secondary"}>{e.receiveNotifications ? "Sim" : "Não"}</Badge> },
    { key: "actions", header: "", render: (e) => (
      <Button size="sm" variant="ghost" onClick={() => { setEditClientId(e.clientId); setWhatsapp(e.receiveWhatsApp); setEmail(e.receiveEmail); setSms(e.receiveSMS); setNotif(e.receiveNotifications); }}>
        <Save className="h-4 w-4" />
      </Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Preferences</h1>
        <p className="text-sm text-muted-foreground">Preferências de comunicação</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-5 w-5" />Preferências da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Canal Padrão</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={compChannel} onChange={(e) => setCompChannel(e.target.value as ChannelType)}>
                {(["email", "whatsapp", "internal"] as ChannelType[]).map((c) => <option key={c} value={c}>{CHANNEL_TYPE_LABELS[c]}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Horário Início</Label>
                <Input type="time" value={startHour} onChange={(e) => setStartHour(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Horário Fim</Label>
                <Input type="time" value={endHour} onChange={(e) => setEndHour(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Máximo de Tentativas</Label>
              <Input type="number" min={1} max={10} value={maxRetries} onChange={(e) => setMaxRetries(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>Intervalo entre Tentativas (min)</Label>
              <Input type="number" min={5} max={1440} value={retryInterval} onChange={(e) => setRetryInterval(Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Assinatura Padrão</Label>
            <Textarea value={signature} onChange={(e) => setSignature(e.target.value)} rows={3} />
          </div>
          <Button onClick={() => companyMut.mutate()} disabled={companyMut.isPending}><Save className="mr-2 h-4 w-4" />Salvar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><UserCheck className="h-5 w-5" />Preferências dos Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={clientPrefs}
            columns={columns}
            keyExtractor={(e) => e.clientId}
            searchKeys={["clientName"]}
          />
        </CardContent>
      </Card>

      {editClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditClientId(null)}>
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Editar Preferências</h2>
        <DocButton module="communication" page="preferences" />
      </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2"><Mail className="h-4 w-4" />Receber E-mail</Label>
                <Switch checked={email} onCheckedChange={setEmail} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2"><MessageSquare className="h-4 w-4" />Receber WhatsApp</Label>
                <Switch checked={whatsapp} onCheckedChange={setWhatsapp} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2"><Smartphone className="h-4 w-4" />Receber SMS</Label>
                <Switch checked={sms} onCheckedChange={setSms} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2"><Bell className="h-4 w-4" />Receber Notificações</Label>
                <Switch checked={notif} onCheckedChange={setNotif} />
              </div>
            </div>
            <div className="border-t pt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditClientId(null)}>Cancelar</Button>
              <Button onClick={() => {
                const pref = clientPrefs.find((p) => p.clientId === editClientId);
                if (pref) clientMut.mutate({ clientId: editClientId, clientName: pref.clientName, data: { receiveWhatsApp: whatsapp, receiveEmail: email, receiveSMS: sms, receiveNotifications: notif } });
              }}><Save className="mr-2 h-4 w-4" />Salvar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
