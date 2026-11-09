import { useMemo, useState } from "react";
import { Link2Off, Plus, X, History, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { displayName, fileType, formatBytes } from "@/lib/file-types";
import { backlinksOf, pathString } from "@/services/explorer.service";
import {
  useNodeHistory,
  useNodeRelations,
  useRelateNodes,
  useSetNodeStatus,
  useSetNodeTags,
  useUnrelateNodes,
  useUpdateNode,
} from "@/hooks/explorer";
import {
  CHANGE_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  DocumentStatus,
  RELATIONSHIP_LABELS,
  RelationshipType,
  type ExplorerNode,
} from "@/types/explorer";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border px-3 py-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 py-0.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] truncate text-right">{value}</span>
    </div>
  );
}

export function InfoPanel({
  node,
  nodes,
  onOpen,
  onUnlink,
}: {
  node: ExplorerNode;
  nodes: ExplorerNode[];
  onOpen: (id: string) => void;
  onUnlink: (targetId: string) => void;
}) {
  const [tagDraft, setTagDraft] = useState("");
  const [description, setDescription] = useState(node.description ?? "");
  const [relTarget, setRelTarget] = useState("");
  const [relType, setRelType] = useState<RelationshipType>(RelationshipType.Related);

  const setTags = useSetNodeTags();
  const setStatus = useSetNodeStatus();
  const updateNode = useUpdateNode();
  const relate = useRelateNodes();
  const unrelate = useUnrelateNodes();
  const { data: relations = [] } = useNodeRelations(node.projectId);
  const { data: history = [] } = useNodeHistory(node.id);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const outgoing = relations.filter((r) => r.sourceId === node.id);
  const incoming = relations.filter((r) => r.targetId === node.id);
  const links = node.links.map((id) => byId.get(id)).filter(Boolean) as ExplorerNode[];
  const backlinks = backlinksOf(nodes, node.id);
  const candidates = nodes.filter((n) => n.id !== node.id && !n.deleted && n.kind === "file");
  const info = fileType(node.extension);

  const addTag = () => {
    const t = tagDraft.trim().toLowerCase();
    if (!t) return;
    setTags.mutate({ id: node.id, tags: [...node.tags, t] });
    setTagDraft("");
  };

  return (
    <ScrollArea className="h-[calc(100vh-8rem)]">
      <Section title="Metadados">
        <Row label="Nome" value={displayName(node.name, node.kind, node.extension)} />
        <Row label="Tipo" value={info.label} />
        <Row label="Caminho" value={<span title={pathString(nodes, node.id)}>{pathString(nodes, node.id)}</span>} />
        {node.documentType && <Row label="Template" value={node.documentType} />}
        <Row label="Criado" value={new Date(node.createdAt).toLocaleString()} />
        <Row label="Atualizado" value={new Date(node.updatedAt).toLocaleString()} />
        {node.storagePath && <Row label="Tamanho" value={formatBytes(node.sizeBytes)} />}
        {!node.storagePath && node.kind === "file" && (
          <Row label="Caracteres" value={(node.content ?? "").length.toLocaleString()} />
        )}
      </Section>

      <Section title="Status">
        <Select
          value={node.status ?? DocumentStatus.Draft}
          onValueChange={(v) => setStatus.mutate({ id: node.id, status: v as DocumentStatus })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DOCUMENT_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-xs">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Section>

      <Section title="Descrição">
        <Textarea
          value={description}
          rows={3}
          placeholder="Resumo do documento"
          className="text-xs"
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => {
            if (description !== (node.description ?? "")) updateNode.mutate({ id: node.id, patch: { description } });
          }}
        />
      </Section>

      <Section title="Tags">
        <div className="mb-2 flex flex-wrap gap-1">
          {node.tags.length === 0 && <span className="text-xs text-muted-foreground">Sem tags</span>}
          {node.tags.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1 text-[10px]">
              {t}
              <button
                onClick={() => setTags.mutate({ id: node.id, tags: node.tags.filter((x) => x !== t) })}
                className="rounded hover:text-destructive"
                aria-label={`Remover tag ${t}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-1">
          <Input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTag()}
            placeholder="nova tag"
            className="h-7 text-xs"
          />
          <Button size="sm" variant="outline" className="h-7 px-2" onClick={addTag}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Section>

      <Section title="Relacionamentos">
        <div className="mb-2 space-y-1">
          {outgoing.length === 0 && <p className="text-xs text-muted-foreground">Nenhum relacionamento</p>}
          {outgoing.map((r) => {
            const target = byId.get(r.targetId);
            return (
              <div key={r.id} className="flex items-center gap-1 text-xs">
                <Badge variant="outline" className="shrink-0 text-[9px]">
                  {RELATIONSHIP_LABELS[r.relationshipType]}
                </Badge>
                <button className="min-w-0 flex-1 truncate text-left hover:underline" onClick={() => target && onOpen(target.id)}>
                  {target ? displayName(target.name, target.kind, target.extension) : "—"}
                </button>
                <button onClick={() => unrelate.mutate(r.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
        <div className="space-y-1">
          <Select value={relType} onValueChange={(v) => setRelType(v as RelationshipType)}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RELATIONSHIP_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value} className="text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            <Select value={relTarget} onValueChange={setRelTarget}>
              <SelectTrigger className="h-7 flex-1 text-xs">
                <SelectValue placeholder="Documento" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {displayName(c.name, c.kind, c.extension)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2"
              disabled={!relTarget || relate.isPending}
              onClick={() => {
                relate.mutate({ sourceId: node.id, targetId: relTarget, relationshipType: relType });
                setRelTarget("");
              }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          {relate.isError && (
            <p className="text-[10px] text-destructive">
              {relate.error instanceof Error ? relate.error.message : "Erro ao relacionar"}
            </p>
          )}
        </div>
      </Section>

      {(links.length > 0 || backlinks.length > 0 || incoming.length > 0) && (
        <Section title="Backlinks">
          {links.map((l) => (
            <div key={l.id} className="flex items-center gap-1 py-0.5 text-xs">
              <button className="min-w-0 flex-1 truncate text-left hover:underline" onClick={() => onOpen(l.id)}>
                → {displayName(l.name, l.kind, l.extension)}
              </button>
              <button onClick={() => onUnlink(l.id)} className="text-muted-foreground hover:text-destructive">
                <Link2Off className="h-3 w-3" />
              </button>
            </div>
          ))}
          {[...backlinks, ...incoming.map((r) => byId.get(r.sourceId)).filter(Boolean as unknown as (v: ExplorerNode | undefined) => v is ExplorerNode)].map((b) => (
            <button
              key={`in-${b.id}`}
              className="block w-full truncate py-0.5 text-left text-xs hover:underline"
              onClick={() => onOpen(b.id)}
            >
              ← {displayName(b.name, b.kind, b.extension)}
            </button>
          ))}
        </Section>
      )}

      <Section title="Histórico">
        {history.length === 0 && <p className="text-xs text-muted-foreground">Sem alterações registradas</p>}
        <ul className="space-y-2">
          {history.slice(0, 20).map((h) => (
            <li key={h.id} className="flex gap-2 text-[11px]">
              <History className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate">
                  v{h.version} · {CHANGE_TYPE_LABELS[h.changeType] ?? h.changeType}
                </p>
                <p className="truncate text-muted-foreground">
                  {h.changedByName} · {new Date(h.changedAt).toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </ScrollArea>
  );
}
