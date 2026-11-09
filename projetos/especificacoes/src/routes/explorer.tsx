import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  FolderTree,
  FilePlus2,
  FolderPlus,
  Search,
  Info,
  X,
  PanelLeftClose,
  PanelLeft,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/common/empty-state";
import { ListSkeleton } from "@/components/common/skeletons";
import { ProjectDialog } from "@/components/dialogs/project-dialog";
import { ExplorerTree, type TreeActions } from "@/components/explorer/explorer-tree";
import { FileEditor } from "@/components/explorer/file-editor";
import { InfoPanel } from "@/components/explorer/info-panel";
import { useProjects } from "@/hooks/data";
import {
  useProjectNodes,
  useCreateFile,
  useCreateFolder,
  useCreateShortcut,
  useRenameNode,
  useDuplicateNode,
  useArchiveNode,
  useDeleteNode,
  useMoveNode,
  useSaveNodeContent,
  useToggleNodeLink,
} from "@/hooks/explorer";
import { buildTree, pathOf, searchNodes } from "@/services/explorer.service";
import { DOC_TEMPLATES } from "@/lib/explorer-templates";
import { EXTENSIONS, displayName, nodeColor, nodeIcon, splitName } from "@/lib/file-types";
import { cn } from "@/lib/utils";
import type { ExplorerNode } from "@/types/explorer";

export const Route = createFileRoute("/explorer")({
  head: () => ({
    meta: [
      { title: "Project Explorer — SpecForge" },
      {
        name: "description",
        content:
          "Navegue e organize documentos, código, diagramas e specs em uma árvore hierárquica offline e criptografada.",
      },
      { property: "og:title", content: "Project Explorer — SpecForge" },
      {
        property: "og:description",
        content: "Árvore hierárquica de projetos, editor com abas e busca instantânea no SpecForge.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExplorerPage,
});

function ExplorerPage() {
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const [projectId, setProjectId] = useState<string | undefined>();
  const { data: nodes, isLoading } = useProjectNodes(projectId);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tabs, setTabs] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>();
  const [query, setQuery] = useState("");
  const [showTree, setShowTree] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  const [fileDialog, setFileDialog] = useState<{ open: boolean; parentId: string | null }>({ open: false, parentId: null });
  const [folderDialog, setFolderDialog] = useState<{ open: boolean; parentId: string | null }>({ open: false, parentId: null });
  const [linkDialog, setLinkDialog] = useState(false);

  const [projectDialog, setProjectDialog] = useState(false);

  const createFile = useCreateFile();
  const createFolder = useCreateFolder();
  const createShortcut = useCreateShortcut();
  const rename = useRenameNode();
  const duplicate = useDuplicateNode();
  const archive = useArchiveNode();
  const del = useDeleteNode();
  const move = useMoveNode();
  const saveContent = useSaveNodeContent();
  const toggleLink = useToggleNodeLink();

  useEffect(() => {
    if (!projectId && projects?.length) setProjectId(projects[0].id);
  }, [projects, projectId]);

  const all = useMemo(() => nodes ?? [], [nodes]);
  const tree = useMemo(() => buildTree(all, { includeArchived: true }), [all]);
  const hits = useMemo(() => searchNodes(all, query), [all, query]);
  const activeNode = all.find((n) => n.id === activeId);
  const breadcrumb = activeId ? pathOf(all, activeId) : [];
  const projectName = projects?.find((p) => p.id === projectId)?.name ?? "";

  const openNode = (id: string) => {
    const node = all.find((n) => n.id === id);
    if (!node) return;
    const target = node.kind === "shortcut" && node.targetId ? node.targetId : node.id;
    const resolved = all.find((n) => n.id === target);
    if (!resolved) return;
    if (resolved.kind === "link" && resolved.url) {
      window.open(resolved.url, "_blank", "noopener,noreferrer");
      return;
    }
    if (resolved.kind !== "file") return;
    setTabs((t) => (t.includes(resolved.id) ? t : [...t, resolved.id]));
    setActiveId(resolved.id);
    // Expand ancestors
    setExpanded((prev) => {
      const next = new Set(prev);
      pathOf(all, resolved.id).forEach((p) => p.kind === "folder" && next.add(p.id));
      return next;
    });
  };

  const closeTab = (id: string) => {
    setTabs((t) => {
      const next = t.filter((x) => x !== id);
      if (activeId === id) setActiveId(next[next.length - 1]);
      return next;
    });
  };

  const toggleFolder = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setShowTree((s) => !s);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        document.getElementById("explorer-search")?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
        e.preventDefault();
        setShowInfo((s) => !s);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const actions: TreeActions = {
    onSelect: (id, { multi }) =>
      setSelected((prev) => {
        const next = multi ? new Set(prev) : new Set<string>();
        if (multi && prev.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    onOpen: openNode,
    onNewFile: (parentId) => setFileDialog({ open: true, parentId }),
    onNewFolder: (parentId) => setFolderDialog({ open: true, parentId }),
    onRename: (id, name) => rename.mutate({ id, name }),
    onDuplicate: (id) => duplicate.mutate(id, { onSuccess: () => toast.success("Item duplicado") }),
    onArchive: (id, archived) => archive.mutate({ id, archived }),
    onDelete: (id) => del.mutate(id, { onSuccess: () => { closeTab(id); toast.success("Item excluído"); } }),
    onMove: (id, parentId) => move.mutate({ id, parentId }),
    onShortcut: (targetId, parentId) => createShortcut.mutate({ targetId, parentId }),
  };

  if (loadingProjects) {
    return (
      <div className="p-6">
        <ListSkeleton rows={8} />
      </div>
    );
  }

  if (!projects?.length) {
    return (
      <div className="p-6">
        <EmptyState
          title="Nenhum projeto ainda"
          description="Crie um projeto para começar a organizar documentos no explorer."
          icon={<FolderTree className="h-6 w-6" />}
          action={<Button size="sm" onClick={() => setProjectDialog(true)}>Criar projeto</Button>}
        />
        <ProjectDialog open={projectDialog} onOpenChange={setProjectDialog} />
      </div>
    );
  }


  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-h-0 flex-col">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border px-3 py-2 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setShowTree((s) => !s)} title="Alternar árvore (⌘B)">
            {showTree ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </Button>
          <Select value={projectId} onValueChange={(v) => { setProjectId(v); setTabs([]); setActiveId(undefined); }}>
            <SelectTrigger className="h-8 w-[180px]">
              <SelectValue placeholder="Projeto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative hidden min-w-0 flex-1 sm:block">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="explorer-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar nome, conteúdo, tag ou extensão…"
              className="h-8 pl-7 text-xs"
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setFileDialog({ open: true, parentId: null })}>
            <FilePlus2 className="h-4 w-4" />
            <span className="ml-1 hidden text-xs sm:inline">Arquivo</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFolderDialog({ open: true, parentId: null })}>
            <FolderPlus className="h-4 w-4" />
            <span className="ml-1 hidden text-xs sm:inline">Pasta</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowInfo((s) => !s)} title="Painel de informações (⌘I)">
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {showTree && (
          <aside className="w-60 shrink-0 overflow-y-auto border-r border-border bg-sidebar/40">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {projectName || "Workspace"}
            </div>
            {isLoading ? (
              <div className="p-3">
                <ListSkeleton rows={6} />
              </div>
            ) : query ? (
              <ul className="px-1 pb-6">
                {hits.length === 0 && (
                  <li className="px-3 py-6 text-center text-xs text-muted-foreground">Nenhum resultado</li>
                )}
                {hits.map((h) => {
                  const Icon = nodeIcon(h.node.kind, h.node.extension);
                  return (
                    <li key={h.node.id}>
                      <button
                        onClick={() => openNode(h.node.id)}
                        className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-sidebar-accent"
                      >
                        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", nodeColor(h.node.kind, h.node.extension))} />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-medium">
                            {displayName(h.node.name, h.node.kind, h.node.extension)}
                          </span>
                          {h.excerpt && (
                            <span className="block truncate text-[10px] text-muted-foreground">…{h.excerpt}…</span>
                          )}
                          <span className="mt-0.5 flex gap-1">
                            {h.matchedIn.map((m) => (
                              <Badge key={m} variant="secondary" className="px-1 py-0 text-[9px]">
                                {m}
                              </Badge>
                            ))}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ExplorerTree
                items={tree}
                selected={selected}
                activeId={activeId}
                expanded={expanded}
                toggle={toggleFolder}
                actions={actions}
                query={query}
              />
            )}
          </aside>
        )}

        <section className="flex min-w-0 flex-1 flex-col">
          {tabs.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto border-b border-border px-2 py-1">
              {tabs.map((id) => {
                const n = all.find((x) => x.id === id);
                if (!n) return null;
                const Icon = nodeIcon(n.kind, n.extension);
                return (
                  <div
                    key={id}
                    onClick={() => setActiveId(id)}
                    className={cn(
                      "flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs",
                      activeId === id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50",
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", nodeColor(n.kind, n.extension))} />
                    <span className="max-w-[140px] truncate">{displayName(n.name, n.kind, n.extension)}</span>
                    <button onClick={(e) => { e.stopPropagation(); closeTab(id); }} className="rounded p-0.5 hover:bg-muted">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {breadcrumb.length > 0 && (
            <nav className="flex items-center gap-1 overflow-x-auto border-b border-border px-3 py-1.5 text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">{projectName}</span>
              {breadcrumb.map((b) => (
                <span key={b.id} className="flex items-center gap-1">
                  <span>›</span>
                  <span className={b.id === activeId ? "text-foreground" : ""}>
                    {displayName(b.name, b.kind, b.extension)}
                  </span>
                </span>
              ))}
            </nav>
          )}

          <div className="min-h-0 flex-1">
            {activeNode ? (
              <FileEditor
                node={activeNode}
                onSave={(content, opts) => saveContent.mutateAsync({ id: activeNode.id, content, ...opts })}
              />
            ) : (
              <div className="p-6">
                <EmptyState
                  title="Nenhum arquivo aberto"
                  description="Selecione um arquivo na árvore ou crie um novo a partir de um template."
                  icon={<FolderTree className="h-6 w-6" />}
                  action={
                    <Button size="sm" onClick={() => setFileDialog({ open: true, parentId: null })}>
                      <FilePlus2 className="mr-1 h-4 w-4" /> Novo arquivo
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        </section>

        {showInfo && activeNode && (
          <aside className="hidden w-64 shrink-0 border-l border-border lg:block">
            <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Informações</span>
              <Button variant="ghost" size="sm" className="h-6 px-1" onClick={() => setLinkDialog(true)}>
                <Link2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <InfoPanel
              node={activeNode}
              nodes={all}
              onOpen={openNode}
              onUnlink={(targetId) => toggleLink.mutate({ sourceId: activeNode.id, targetId })}
            />
          </aside>
        )}
      </div>

      <NewFileDialog
        open={fileDialog.open}
        onOpenChange={(open) => setFileDialog((s) => ({ ...s, open }))}
        onCreate={(values) => {
          if (!projectId) return;
          createFile.mutate(
            { projectId, parentId: fileDialog.parentId, ...values },
            {
              onSuccess: (node) => {
                setFileDialog({ open: false, parentId: null });
                if (node) openNode(node.id);
                toast.success("Arquivo criado");
              },
            },
          );
        }}
      />

      <NewFolderDialog
        open={folderDialog.open}
        onOpenChange={(open) => setFolderDialog((s) => ({ ...s, open }))}
        onCreate={(name) => {
          if (!projectId) return;
          createFolder.mutate(
            { projectId, parentId: folderDialog.parentId, name },
            { onSuccess: () => { setFolderDialog({ open: false, parentId: null }); toast.success("Pasta criada"); } },
          );
        }}
      />

      <RelateDialog
        open={linkDialog}
        onOpenChange={setLinkDialog}
        nodes={all.filter((n) => n.kind === "file" && !n.deleted && n.id !== activeId)}
        linked={activeNode?.links ?? []}
        onToggle={(targetId) => activeNode && toggleLink.mutate({ sourceId: activeNode.id, targetId })}
      />
    </div>
  );
}

function NewFileDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (v: { name: string; extension: string; templateId?: string; description?: string; tags?: string[] }) => void;
}) {
  const [name, setName] = useState("");
  const [extension, setExtension] = useState("md");
  const [templateId, setTemplateId] = useState("blank");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setExtension("md");
      setTemplateId("blank");
      setDescription("");
      setTags("");
    }
  }, [open]);

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const tpl = DOC_TEMPLATES.find((t) => t.id === id);
    if (tpl) {
      if (!name) setName(tpl.fileName);
      setExtension(tpl.extension);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo arquivo</DialogTitle>
          <DialogDescription>Crie um documento vazio ou a partir de um template.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-2">
            <div>
              <Label className="text-xs">Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="documento" />
            </div>
            <div>
              <Label className="text-xs">Extensão</Label>
              <Select value={extension} onValueChange={setExtension}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {EXTENSIONS.map((e) => (
                    <SelectItem key={e} value={e}>
                      .{e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Template</Label>
            <Select value={templateId} onValueChange={applyTemplate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="blank">Documento vazio</SelectItem>
                {DOC_TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div>
            <Label className="text-xs">Tags (separadas por vírgula)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="api, backend" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!name.trim()}
            onClick={() => {
              const parsed = splitName(name.trim());
              onCreate({
                name: parsed.name,
                extension: parsed.extension ?? extension,
                templateId: templateId === "blank" ? undefined : templateId,
                description: description.trim() || undefined,
                tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
              });
            }}
          >
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewFolderDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState("");
  useEffect(() => {
    if (open) setName("");
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nova pasta</DialogTitle>
        </DialogHeader>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Backend" autoFocus />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={!name.trim()} onClick={() => onCreate(name.trim())}>
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RelateDialog({
  open,
  onOpenChange,
  nodes,
  linked,
  onToggle,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  nodes: ExplorerNode[];
  linked: string[];
  onToggle: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const list = nodes.filter((n) => n.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Relacionar documentos</DialogTitle>
          <DialogDescription>Conecte este documento a outros artefatos do projeto.</DialogDescription>
        </DialogHeader>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar documento…" />
        <ul className="max-h-72 space-y-1 overflow-y-auto">
          {list.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => onToggle(n.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md border border-border px-2 py-1.5 text-xs hover:bg-accent",
                  linked.includes(n.id) && "border-primary bg-primary/10",
                )}
              >
                <span className="truncate">{displayName(n.name, n.kind, n.extension)}</span>
                {linked.includes(n.id) && <Badge variant="secondary" className="text-[10px]">vinculado</Badge>}
              </button>
            </li>
          ))}
          {!list.length && <li className="py-6 text-center text-xs text-muted-foreground">Nenhum documento</li>}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
