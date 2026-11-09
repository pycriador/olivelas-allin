import { useEffect, useMemo, useState } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useCampaignWhatsAppMessages } from "@/features/campaigns/hooks/use-campaigns";

export interface WhatsAppMessagePickerProps {
  campaignId: string;
  defaultContent: string | null | undefined;
  value: string;
  onChange: (content: string | null) => void;
}

/**
 * Seletor de mensagem para uso no envio (venda manual, pedido).
 * Mostra a mensagem padrão da campanha e as mensagens personalizadas salvas.
 */
export function WhatsAppMessagePicker({
  campaignId,
  defaultContent,
  value,
  onChange,
}: WhatsAppMessagePickerProps) {
  const { data: messages = [] } = useCampaignWhatsAppMessages(campaignId);

  const defaultId = "__default__";

  const initialId = useMemo(() => {
    const match = messages.find((message) => message.content === value);
    return match?.id ?? defaultId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selectedId, setSelectedId] = useState(initialId);

  useEffect(() => {
    if (messages.length === 0) return;
    const match = messages.find((message) => message.id === selectedId);
    if (match) return;
    setSelectedId(defaultId);
  }, [messages, selectedId, defaultId]);

  function resolveAndEmit(id: string) {
    setSelectedId(id);
    if (id === defaultId) {
      onChange(null);
    } else {
      const message = messages.find((m) => m.id === id);
      onChange(message?.content ?? null);
    }
  }

  const defaultLabel = defaultContent?.trim()
    ? "Mensagem padrão da campanha"
    : "Mensagem padrão do sistema";

  return (
    <div className="space-y-1.5">
      <Label htmlFor="whatsapp-message-picker">Mensagem</Label>
      <Select value={selectedId} onValueChange={resolveAndEmit}>
        <SelectTrigger id="whatsapp-message-picker" className="w-full">
          <SelectValue placeholder="Selecione a mensagem" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={defaultId}>{defaultLabel}</SelectItem>
          {messages.map((message) => (
            <SelectItem key={message.id} value={message.id}>
              {message.name}
              {message.is_default ? " (padrão da campanha)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {messages.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Você pode criar mensagens personalizadas na edição da campanha.
        </p>
      ) : null}
    </div>
  );
}