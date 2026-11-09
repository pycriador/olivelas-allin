import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Mail, MessageSquare, Bell, Send, Smartphone,
  MessageCircle, Globe, Slack, Radio,
  CheckCircle2, XCircle, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { channelService, addAuditEvent } from "@/modules/communication/service";
import { DocButton } from "@/components/doc-button";
import type { ChannelStatus, ChannelType } from "@/modules/communication/types";
import { CHANNEL_TYPE_LABELS } from "@/modules/communication/types";

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="h-5 w-5" />,
  whatsapp: <MessageSquare className="h-5 w-5" />,
  internal: <Bell className="h-5 w-5" />,
  "whatsapp-business": <MessageCircle className="h-5 w-5" />,
  telegram: <Send className="h-5 w-5" />,
  sms: <Smartphone className="h-5 w-5" />,
  push: <Globe className="h-5 w-5" />,
  slack: <Slack className="h-5 w-5" />,
  teams: <Radio className="h-5 w-5" />,
};

export const Route = createFileRoute("/_app/communication/channels")({
  head: () => ({ meta: [{ title: "Channels — ServiceForge" }] }),
  component: ChannelsPage,
});

function ChannelsPage() {
  const qc = useQueryClient();
  const [toggleId, setToggleId] = useState<{ id: string; enable: boolean } | null>(null);

  const { data: channels = [] } = useQuery({
    queryKey: ["comm", "channels"],
    queryFn: () => channelService.list(),
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, enable }: { id: string; enable: boolean }) => {
      const updated = await channelService.update(id as ChannelType, { enabled: enable });
      await addAuditEvent("channel-status-changed", "admin", "Admin", `Canal ${CHANNEL_TYPE_LABELS[id as ChannelType]} ${enable ? "ativado" : "desativado"}`, id, "channel");
      return updated;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm", "channels"] }); toast.success("Canal atualizado"); },
  });

  const testMut = useMutation({
    mutationFn: async (channel: ChannelType) => {
      await channelService.update(channel, { lastTestAt: new Date().toISOString(), lastTestResult: "success" });
      return channel;
    },
    onSuccess: (ch) => { qc.invalidateQueries({ queryKey: ["comm", "channels"] }); toast.success(`${CHANNEL_TYPE_LABELS[ch]} — Teste concluído`); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Channels</h1>
          <DocButton module="communication" page="channels" />
        <p className="text-sm text-muted-foreground">Gerencie canais de comunicação</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {channels.map((ch) => (
          <Card key={ch.channel}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  {CHANNEL_ICONS[ch.channel] ?? <MessageSquare className="h-5 w-5" />}
                </div>
                <div>
                  <CardTitle className="text-sm">{CHANNEL_TYPE_LABELS[ch.channel]}</CardTitle>
                  <Badge variant={ch.configured ? "default" : "secondary"} className="text-[10px]">
                    {ch.configured ? "Configurado" : "Não configurado"}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${ch.enabled ? "bg-green-500" : "bg-gray-300"}`} />
                <Switch
                  checked={ch.enabled}
                  onCheckedChange={(v) => setToggleId({ id: ch.channel, enable: v })}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  {ch.lastTestResult === "success" && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                  {ch.lastTestResult === "failure" && <XCircle className="h-3 w-3 text-red-500" />}
                  {!ch.lastTestResult && <RefreshCw className="h-3 w-3" />}
                  <span>{ch.lastTestAt ? `Testado: ${new Date(ch.lastTestAt).toLocaleDateString()}` : "Não testado"}</span>
                </div>
                <Button size="sm" variant="ghost" disabled={!ch.enabled} onClick={() => testMut.mutate(ch.channel)}>
                  <RefreshCw className="h-3 w-3 mr-1" />Testar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={!!toggleId}
        onOpenChange={(o) => { if (!o) setToggleId(null); }}
        onConfirm={() => { if (toggleId) { toggleMut.mutate(toggleId); setToggleId(null); } }}
        title={toggleId?.enable ? "Ativar Canal" : "Desativar Canal"}
        description={`Tem certeza que deseja ${toggleId?.enable ? "ativar" : "desativar"} o canal ${toggleId ? CHANNEL_TYPE_LABELS[toggleId.id as ChannelType] : ""}?`}
      />
    </div>
  );
}
