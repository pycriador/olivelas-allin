import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  FileText, Tag, Clock, CheckCircle2, Archive,
  Copy, Plus, Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { templateService, addAuditEvent } from "@/modules/communication/service";
import { DocButton } from "@/components/doc-button";
import type { MessageTemplate, TemplateStatus } from "@/modules/communication/types";
import { MESSAGE_CATEGORIES, MESSAGE_CATEGORY_LABELS } from "@/modules/communication/types";
import { CHANNEL_TYPES, CHANNEL_TYPE_LABELS } from "@/modules/communication/types";

export const Route = createFileRoute("/_app/communication/templates")({
  head: () => ({ meta: [{ title: "Message Templates — ServiceForge" }] }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const qc = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<string | null>(null);
  const [selectedTpl, setSelectedTpl] = useState<MessageTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editTpl, setEditTpl] = useState<MessageTemplate | null>(null);

  const { data: templates = [] } = useQuery({
    queryKey: ["comm", "templates"],
    queryFn: () => templateService.list(),
  });

  const filtered = templates.filter((t) => {
    if (categoryFilter && t.category !== categoryFilter) return false;
    if (channelFilter && t.channel !== channelFilter) return false;
    return true;
  });

  const archiveMut = useMutation({
    mutationFn: (id: string) => templateService.update(id, { status: "archived" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm", "templates"] }); toast.success("Template arquivado"); },
  });

  const saveMut = useMutation({
    mutationFn: async (data: { id?: string; name: string; category: MessageTemplate["category"]; channel: MessageTemplate["channel"]; subject: string; content: string; variables: string[] }) => {
      const now = new Date().toISOString();
      if (data.id) {
        const updated = await templateService.update(data.id, { ...data, updatedBy: "admin", updatedAt: now });
        await addAuditEvent("template-edited", "admin", "Admin", `Template editado: ${data.name}`, data.id, "template");
        return updated;
      }
      const created = await templateService.create({
        ...data, status: "active", companyId: null,
        version: 1, createdBy: "admin", updatedBy: "admin", createdAt: now, updatedAt: now,
      });
      await addAuditEvent("template-created", "admin", "Admin", `Template criado: ${data.name}`, created.id, "template");
      return created;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comm", "templates"] }); setShowEditor(false); setEditTpl(null); toast.success("Template salvo"); },
  });

  const columns: Column<MessageTemplate>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (e) => (
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedTpl(selectedTpl?.id === e.id ? null : e)}>
        <FileText className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">{e.name}</div>
          <div className="text-xs text-muted-foreground">{MESSAGE_CATEGORY_LABELS[e.category]}</div>
        </div>
      </div>
    )},
    { key: "channel", header: "Canal", render: (e) => <Badge variant="outline">{CHANNEL_TYPE_LABELS[e.channel]}</Badge> },
    { key: "version", header: "Versão", render: (e) => <span className="text-sm">v{e.version}</span> },
    { key: "status", header: "Status", render: (e) => (
      <Badge variant={e.status === "active" ? "default" : e.status === "archived" ? "secondary" : "outline"} className="gap-1">
        {e.status === "active" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
        {e.status === "active" ? "Ativo" : e.status === "archived" ? "Arquivado" : "Inativo"}
      </Badge>
    )},
    { key: "variables", header: "Variáveis", render: (e) => (
      <div className="flex gap-1 flex-wrap max-w-[200px]">
        {e.variables.slice(0, 3).map((v) => <Badge key={v} variant="outline" className="text-[10px] font-mono"><Tag className="h-3 w-3 mr-1" />{v}</Badge>)}
        {e.variables.length > 3 && <span className="text-xs text-muted-foreground">+{e.variables.length - 3}</span>}
      </div>
    )},
    { key: "actions", header: "", render: (e) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => { setEditTpl(e); setShowEditor(true); }}><Copy className="h-4 w-4" /></Button>
        {e.status !== "archived" && <Button size="sm" variant="ghost" onClick={() => archiveMut.mutate(e.id)}><Archive className="h-4 w-4" /></Button>}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Message Templates</h1>
          <DocButton module="communication" page="templates" />
          <p className="text-sm text-muted-foreground">Gerencie modelos de mensagens</p>
        </div>
        <Button onClick={() => { setEditTpl(null); setShowEditor(true); }}><Plus className="mr-2 h-4 w-4" />Novo Template</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={categoryFilter === null ? "default" : "outline"} onClick={() => setCategoryFilter(null)}>Todas</Button>
        {MESSAGE_CATEGORIES.map((cat) => (
          <Button key={cat} size="sm" variant={categoryFilter === cat ? "default" : "outline"} onClick={() => setCategoryFilter(cat)}>
            {MESSAGE_CATEGORY_LABELS[cat]}
          </Button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={channelFilter === null ? "default" : "outline"} onClick={() => setChannelFilter(null)}>Todos os Canais</Button>
        {CHANNEL_TYPES.filter((c) => c === "email" || c === "whatsapp" || c === "internal").map((ch) => (
          <Button key={ch} size="sm" variant={channelFilter === ch ? "default" : "outline"} onClick={() => setChannelFilter(ch)}>
            {CHANNEL_TYPE_LABELS[ch]}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <DataTable
            data={filtered}
            columns={columns}
            keyExtractor={(e) => e.id}
            searchKeys={["name", "subject", "content"]}
            initialSortColumn="name"
          />
        </div>

        {selectedTpl && (
          <div className="xl:col-span-1">
            <Card className="p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4" />{selectedTpl.name}</h3>
                  <p className="text-xs text-muted-foreground">{MESSAGE_CATEGORY_LABELS[selectedTpl.category]}</p>
                </div>
                <Badge>{selectedTpl.status}</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Canal</span><span>{CHANNEL_TYPE_LABELS[selectedTpl.channel]}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Versão</span><span>v{selectedTpl.version}</span></div>
              </div>
              <div className="border-t pt-2">
                <p className="text-sm font-medium mb-1">Assunto</p>
                <p className="text-sm text-muted-foreground">{selectedTpl.subject}</p>
              </div>
              <div className="border-t pt-2">
                <p className="text-sm font-medium mb-1">Conteúdo</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedTpl.content}</p>
              </div>
              <div className="border-t pt-2">
                <p className="text-sm font-medium mb-1">Variáveis</p>
                <div className="flex gap-1 flex-wrap">
                  {selectedTpl.variables.map((v) => <Badge key={v} variant="outline" className="text-[10px] font-mono">{v}</Badge>)}
                </div>
              </div>
              <div className="border-t pt-2 flex justify-between text-xs text-muted-foreground">
                <span>Criado por {selectedTpl.createdBy}</span>
                <span>{new Date(selectedTpl.createdAt).toLocaleDateString()}</span>
              </div>
            </Card>
          </div>
        )}
      </div>

      {showEditor && (
        <EditorModal
          template={editTpl}
          onSave={(data) => saveMut.mutate(data)}
          onClose={() => { setShowEditor(false); setEditTpl(null); }}
          saving={saveMut.isPending}
        />
      )}
    </div>
  );
}

function EditorModal({ template, onSave, onClose, saving }: {
  template: MessageTemplate | null;
  onSave: (data: { id?: string; name: string; category: MessageTemplate["category"]; channel: MessageTemplate["channel"]; subject: string; content: string; variables: string[] }) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(template?.name ?? "");
  const [category, setCategory] = useState<MessageTemplate["category"]>(template?.category ?? "sistema");
  const [channel, setChannel] = useState<MessageTemplate["channel"]>(template?.channel ?? "email");
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [content, setContent] = useState(template?.content ?? "");
  const [varInput, setVarInput] = useState(template?.variables.join(", ") ?? "");

  const handleSave = () => {
    const variables = varInput.split(",").map((v) => v.trim()).filter(Boolean);
    onSave({ id: template?.id, name, category, channel, subject, content, variables });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">{template ? "Editar Template" : "Novo Template"}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do template" />
          </div>
          <div className="space-y-1">
            <Label>Categoria</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value as any)}>
              {MESSAGE_CATEGORIES.map((c) => <option key={c} value={c}>{MESSAGE_CATEGORY_LABELS[c]}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Canal</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={channel} onChange={(e) => setChannel(e.target.value as any)}>
              {CHANNEL_TYPES.filter((c) => c === "email" || c === "whatsapp" || c === "internal").map((c) => <option key={c} value={c}>{CHANNEL_TYPE_LABELS[c]}</option>)}
            </select>
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Assunto</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Assunto da mensagem" />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Conteúdo</Label>
            <div className="flex gap-1 mb-2">
              {["cliente.nome", "cliente.telefone", "os.numero", "os.status", "empresa.nome", "documento.link", "pagamento.valor"].map((v) => (
                <Button key={v} size="sm" variant="outline" className="text-[10px] font-mono" onClick={() => setContent((prev) => prev + `{{${v}}}`)}>
                  {`{{${v}}}`}
                </Button>
              ))}
            </div>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder="Conteúdo da mensagem. Use {{variavel}} para variáveis dinâmicas." />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Variáveis (separadas por vírgula)</Label>
            <Input value={varInput} onChange={(e) => setVarInput(e.target.value)} placeholder="cliente.nome, os.numero, empresa.nome" />
          </div>
        </div>
        <div className="border-t pt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !name || !subject || !content}><Save className="mr-2 h-4 w-4" />{saving ? "Salvando..." : "Salvar"}</Button>
        </div>
      </div>
    </div>
  );
}
