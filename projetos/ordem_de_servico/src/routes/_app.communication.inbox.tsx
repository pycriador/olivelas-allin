import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  MessageCircle, Mail, Bell, Inbox, Archive,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { inboxService } from "@/modules/communication/service";
import { DocButton } from "@/components/doc-button";
import type { InboxMessage } from "@/modules/communication/types";
import { CHANNEL_TYPE_LABELS } from "@/modules/communication/types";

export const Route = createFileRoute("/_app/communication/inbox")({
  head: () => ({ meta: [{ title: "Inbox — ServiceForge" }] }),
  component: InboxPage,
});

function InboxPage() {
  const [selectedMsg, setSelectedMsg] = useState<InboxMessage | null>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["comm", "inbox"],
    queryFn: () => inboxService.list(),
  });

  const unread = messages.filter((m) => m.status === "unread").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
          <DocButton module="communication" page="inbox" />
          <p className="text-sm text-muted-foreground">Mensagens recebidas</p>
          <p className="text-xs text-muted-foreground mt-1">Estrutura preparada para futura integração com canais externos</p>
        </div>
        <Badge variant="default" className="gap-1"><Inbox className="h-3 w-3" />{unread} não lidas</Badge>
      </div>

      {messages.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Inbox className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nenhuma mensagem recebida</p>
            <p className="text-xs mt-1">As mensagens recebidas aparecerão aqui quando os canais de entrada forem integrados</p>
          </CardContent>
        </Card>
      )}

      {messages.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-2">
            {messages.map((msg) => (
              <Card key={msg.id} className={`cursor-pointer transition-colors ${selectedMsg?.id === msg.id ? "ring-2 ring-primary" : ""} ${msg.status === "unread" ? "border-l-4 border-l-primary" : ""}`} onClick={() => setSelectedMsg(msg)}>
                <CardContent className="p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {msg.channel === "email" ? <Mail className="h-4 w-4" /> :
                       msg.channel === "whatsapp" ? <MessageCircle className="h-4 w-4" /> :
                       <Bell className="h-4 w-4" />}
                      <span className="font-medium text-sm">{msg.sender}</span>
                    </div>
                    <Badge variant={msg.status === "unread" ? "default" : "secondary"} className="text-[10px]">
                      {msg.status === "unread" ? "Não lida" : msg.status === "read" ? "Lida" : "Arquivada"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{msg.message}</p>
                  <p className="text-xs text-muted-foreground">{new Date(msg.receivedAt).toLocaleString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedMsg ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {selectedMsg.channel === "email" ? <Mail className="h-5 w-5" /> :
                         selectedMsg.channel === "whatsapp" ? <MessageCircle className="h-5 w-5" /> :
                         <Bell className="h-5 w-5" />}
                        {selectedMsg.sender}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{CHANNEL_TYPE_LABELS[selectedMsg.channel]}</p>
                    </div>
                    <Badge>{selectedMsg.status === "unread" ? "Não lida" : selectedMsg.status === "read" ? "Lida" : "Arquivada"}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{selectedMsg.message}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Recebido em:</span> {new Date(selectedMsg.receivedAt).toLocaleString()}</div>
                    {selectedMsg.clientName && (
                      <div className="flex items-center gap-1"><User className="h-3 w-3" /><span>{selectedMsg.clientName}</span></div>
                    )}
                    {selectedMsg.relatedEntity && <div><span className="text-muted-foreground">Relacionado a:</span> {selectedMsg.relatedEntity} #{selectedMsg.relatedId}</div>}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Selecione uma mensagem para visualizar</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
