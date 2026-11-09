import { useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, MessageSquareText, Pencil, Plus, Star, Trash2 } from "lucide-react";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  useCampaignWhatsAppMessages,
  useCreateCampaignWhatsAppMessage,
  useDeleteCampaignWhatsAppMessage,
  useSetDefaultCampaignWhatsAppMessage,
  useUpdateCampaignWhatsAppMessage,
} from "@/features/campaigns/hooks/use-campaigns";
import { campaignWhatsAppMessageSchema } from "@/schemas/campaign.schema";
import { renderWhatsAppTemplate, type CampaignWhatsAppMessage } from "@/types/campaign";

const PLACEHOLDERS = [
  { token: "{name}", label: "Nome do cliente" },
  { token: "{campaign}", label: "Nome da rifa" },
  { token: "{numbers}", label: "Números escolhidos" },
  { token: "{total}", label: "Valor total" },
];

export interface WhatsAppMessagesManagerProps {
  campaignId: string;
  initialContent?: string | null | undefined;
  onTemplateChange: (content: string) => void;
}

export function WhatsAppMessagesManager({
  campaignId,
  initialContent,
  onTemplateChange,
}: WhatsAppMessagesManagerProps) {
  const { data: messages = [], isPending } = useCampaignWhatsAppMessages(campaignId);
  const createMessage = useCreateCampaignWhatsAppMessage(campaignId);
  const updateMessage = useUpdateCampaignWhatsAppMessage(campaignId);
  const deleteMessage = useDeleteCampaignWhatsAppMessage(campaignId);
  const setDefaultMessage = useSetDefaultCampaignWhatsAppMessage(campaignId);

  const [editing, setEditing] = useState<CampaignWhatsAppMessage | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<CampaignWhatsAppMessage | null>(null);

  function handleCreated(message: CampaignWhatsAppMessage) {
    setCreating(false);
    if (message.is_default) onTemplateChange(message.content);
  }

  function handleUpdated(message: CampaignWhatsAppMessage) {
    setEditing(null);
    if (message.is_default) onTemplateChange(message.content);
  }

  function handleDeleted(nextTemplate: string | null) {
    setDeleting(null);
    if (nextTemplate != null) onTemplateChange(nextTemplate);
    else onTemplateChange("");
  }

  const busy =
    createMessage.isPending ||
    updateMessage.isPending ||
    deleteMessage.isPending ||
    setDefaultMessage.isPending;

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/40 p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Marcadores disponíveis
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PLACEHOLDERS.map(({ token, label }) => (
            <span
              key={token}
              className="inline-flex items-center gap-1 rounded bg-background px-2 py-1 text-xs tabular-nums ring-1 ring-border"
              title={label}
            >
              <code>{token}</code>
              <span className="text-muted-foreground">· {label}</span>
            </span>
          ))}
        </div>
      </div>

      {isPending ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando mensagens…</span>
        </div>
      ) : null}

      {!isPending && messages.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          Nenhuma mensagem personalizada cadastrada ainda.
        </div>
      ) : null}

      {!isPending && messages.length > 0 ? (
        <ul className="space-y-2">
          {messages.map((message) => (
            <li
              key={message.id}
              className="flex items-start justify-between gap-3 rounded-md border p-3"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{message.name}</p>
                  {message.is_default ? (
                    <Badge variant="secondary" className="gap-1">
                      <Star aria-hidden="true" className="size-3" />
                      Padrão
                    </Badge>
                  ) : null}
                </div>
                <p className="line-clamp-2 break-words whitespace-pre-wrap text-xs text-muted-foreground">
                  {message.content}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {!message.is_default ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    title="Definir como padrão"
                    onClick={() => {
                      setDefaultMessage.mutate(message.id, {
                        onSuccess: (updated) => {
                          toast.success("Mensagem definida como padrão");
                          onTemplateChange(updated.content);
                        },
                        onError: (error) => toast.error(error.message),
                      });
                    }}
                  >
                    <Star aria-hidden="true" className="size-4" />
                    <span className="sr-only">Definir como padrão</span>
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  title="Editar mensagem"
                  onClick={() => setEditing(message)}
                >
                  <Pencil aria-hidden="true" className="size-4" />
                  <span className="sr-only">Editar</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  disabled={busy}
                  title="Excluir mensagem"
                  onClick={() => setDeleting(message)}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                  <span className="sr-only">Excluir</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => setCreating(true)}
      >
        <Plus aria-hidden="true" className="size-4" />
        Adicionar mensagem
      </Button>

      {creating ? (
        <MessageFormDialog
          title="Nova mensagem"
          description="Cadastre uma mensagem personalizada de WhatsApp."
          campaignId={campaignId}
          initialName=""
          initialContent={initialContent ?? ""}
          initialDefault={messages.length === 0}
          submitLabel="Cadastrar"
          isPending={createMessage.isPending}
          onSubmit={(input) => {
            createMessage.mutate(
              { ...input, is_default: messages.length === 0 ? true : input.is_default },
              {
                onSuccess: handleCreated,
                onError: (error) => toast.error(error.message),
              },
            );
          }}
          onCancel={() => setCreating(false)}
        />
      ) : null}

      {editing ? (
        <MessageFormDialog
          title="Editar mensagem"
          description="Atualize a mensagem personalizada de WhatsApp."
          campaignId={campaignId}
          initialName={editing.name}
          initialContent={editing.content}
          initialDefault={editing.is_default}
          submitLabel="Salvar"
          isPending={updateMessage.isPending}
          onSubmit={(input) => {
            updateMessage.mutate(
              { messageId: editing.id, data: input },
              {
                onSuccess: (updated) => handleUpdated(updated),
                onError: (error) => toast.error(error.message),
              },
            );
          }}
          onCancel={() => setEditing(null)}
        />
      ) : null}

      {deleting ? (
        <AlertDialog open onOpenChange={(open) => !open && setDeleting(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir mensagem?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. A mensagem “{deleting.name}” será removida da rifa.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                disabled={busy}
                onClick={(event) => {
                  event.preventDefault();
                  deleteMessage.mutate(deleting.id, {
                    onSuccess: ({ nextTemplate }) => {
                      toast.success("Mensagem excluída");
                      handleDeleted(nextTemplate);
                    },
                    onError: (error) => toast.error(error.message),
                  });
                }}
              >
                {deleteMessage.isPending ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Trash2 aria-hidden="true" className="size-4" />
                )}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}

interface MessageFormDialogProps {
  title: string;
  description: string;
  campaignId: string;
  initialName: string;
  initialContent: string;
  initialDefault: boolean;
  submitLabel: string;
  isPending: boolean;
  onSubmit: (input: { name: string; content: string; is_default: boolean }) => void;
  onCancel: () => void;
}

function MessageFormDialog({
  title,
  description,
  campaignId,
  initialName,
  initialContent,
  initialDefault,
  submitLabel,
  isPending,
  onSubmit,
  onCancel,
}: MessageFormDialogProps) {
  const [name, setName] = useState(initialName);
  const [content, setContent] = useState(initialContent);
  const [isDefault, setIsDefault] = useState(initialDefault);
  const [error, setError] = useState<string | null>(null);

  const preview = renderWhatsAppTemplate(content, {
    name: "Maria",
    campaign: "Rifa do Celular",
    numbers: "1, 2, 3",
    total: "R$ 150,00",
  });

  function handleSubmit() {
    const result = campaignWhatsAppMessageSchema.safeParse({ name, content, is_default: isDefault });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Verifique os dados informados");
      return;
    }
    setError(null);
    onSubmit(result.data);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !isPending && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`message-name-${campaignId}`}>Nome</Label>
            <Input
              id={`message-name-${campaignId}`}
              value={name}
              maxLength={80}
              placeholder="Ex.: Mensagem de venda, Mensagem de pagamento…"
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`message-content-${campaignId}`}>Conteúdo da mensagem</Label>
            <Textarea
              id={`message-content-${campaignId}`}
              rows={5}
              maxLength={2000}
              value={content}
              placeholder="Olá {name}! Tudo bem?…"
              onChange={(event) => setContent(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use os marcadores {`{name}`}, {`{campaign}`}, {`{numbers}`} e {`{total}`}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`message-default-${campaignId}`}
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(checked === true)}
            />
            <Label htmlFor={`message-default-${campaignId}`} className="cursor-pointer text-sm">
              Definir como mensagem padrão
            </Label>
          </div>
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <MessageSquareText aria-hidden="true" className="size-3.5" />
              Prévia
            </p>
            <p className="whitespace-pre-wrap break-words text-sm">{preview}</p>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="button" disabled={isPending || !name.trim() || !content.trim()} onClick={handleSubmit}>
            {isPending ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Check aria-hidden="true" className="size-4" />
            )}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}