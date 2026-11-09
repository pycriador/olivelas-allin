import { useState, type DragEvent } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { displayName, nodeColor, nodeIcon } from "@/lib/file-types";
import type { TreeItem } from "@/types/explorer";

export interface TreeActions {
  onSelect: (id: string, opts: { multi: boolean }) => void;
  onOpen: (id: string) => void;
  onNewFile: (parentId: string | null) => void;
  onNewFolder: (parentId: string | null) => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string, archived: boolean) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, parentId: string | null) => void;
  onShortcut: (id: string, parentId: string | null) => void;
}

interface RowProps {
  item: TreeItem;
  selected: Set<string>;
  activeId?: string;
  expanded: Set<string>;
  toggle: (id: string) => void;
  actions: TreeActions;
  query: string;
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim().toLowerCase();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q);
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-primary/25 px-0.5 text-foreground">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function TreeRow({ item, selected, activeId, expanded, toggle, actions, query }: RowProps) {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState("");
  const [dropTarget, setDropTarget] = useState(false);
  const isFolder = item.kind === "folder";
  const isOpen = expanded.has(item.id);
  const Icon = nodeIcon(item.kind, item.extension, isOpen);
  const label = displayName(item.name, item.kind, item.extension);

  const startRename = () => {
    setDraft(label);
    setRenaming(true);
  };

  const commitRename = () => {
    setRenaming(false);
    const next = draft.trim();
    if (next && next !== label) actions.onRename(item.id, next);
  };

  const onDragStart = (e: DragEvent) => {
    e.dataTransfer.setData("text/specforge-node", item.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: DragEvent) => {
    if (!isFolder) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(true);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(false);
    const id = e.dataTransfer.getData("text/specforge-node");
    if (id && id !== item.id) actions.onMove(id, isFolder ? item.id : item.parentId);
  };

  return (
    <li>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={() => setDropTarget(false)}
            onDrop={onDrop}
            onClick={(e) => {
              actions.onSelect(item.id, { multi: e.metaKey || e.ctrlKey });
              if (isFolder) toggle(item.id);
              else actions.onOpen(item.id);
            }}
            onDoubleClick={startRename}
            className={cn(
              "group flex cursor-pointer items-center gap-1.5 rounded-md py-1 pr-2 text-sm transition-colors hover:bg-sidebar-accent",
              (activeId === item.id || selected.has(item.id)) && "bg-sidebar-accent text-sidebar-accent-foreground",
              dropTarget && "ring-1 ring-primary",
              item.archived && "opacity-50",
            )}
            style={{ paddingLeft: 8 + item.depth * 12 }}
          >
            {isFolder ? (
              isOpen ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )
            ) : (
              <span className="w-3.5 shrink-0" />
            )}
            <Icon className={cn("h-4 w-4 shrink-0", nodeColor(item.kind, item.extension))} />
            {renaming ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setRenaming(false);
                }}
                className="min-w-0 flex-1 rounded border border-border bg-background px-1 text-xs outline-none"
              />
            ) : (
              <span className="min-w-0 flex-1 truncate">
                <Highlight text={label} query={query} />
              </span>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-52">
          <ContextMenuItem onSelect={() => actions.onNewFile(isFolder ? item.id : item.parentId)}>
            Novo arquivo
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => actions.onNewFolder(isFolder ? item.id : item.parentId)}>
            Nova pasta
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onSelect={() => setTimeout(startRename, 0)}>Renomear</ContextMenuItem>
          <ContextMenuItem onSelect={() => actions.onDuplicate(item.id)}>Duplicar</ContextMenuItem>
          <ContextMenuItem onSelect={() => actions.onShortcut(item.id, item.parentId)}>Criar atalho</ContextMenuItem>
          <ContextMenuItem onSelect={() => actions.onArchive(item.id, !item.archived)}>
            {item.archived ? "Restaurar" : "Arquivar"}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem className="text-destructive" onSelect={() => actions.onDelete(item.id)}>
            Excluir
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {isFolder && isOpen && item.children.length > 0 && (
        <ul>
          {item.children.map((c) => (
            <TreeRow
              key={c.id}
              item={c}
              selected={selected}
              activeId={activeId}
              expanded={expanded}
              toggle={toggle}
              actions={actions}
              query={query}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function ExplorerTree({
  items,
  selected,
  activeId,
  expanded,
  toggle,
  actions,
  query,
}: {
  items: TreeItem[];
  selected: Set<string>;
  activeId?: string;
  expanded: Set<string>;
  toggle: (id: string) => void;
  actions: TreeActions;
  query: string;
}) {
  return (
    <ul
      className="pb-8"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const id = e.dataTransfer.getData("text/specforge-node");
        if (id) actions.onMove(id, null);
      }}
    >
      {items.map((item) => (
        <TreeRow
          key={item.id}
          item={item}
          selected={selected}
          activeId={activeId}
          expanded={expanded}
          toggle={toggle}
          actions={actions}
          query={query}
        />
      ))}
    </ul>
  );
}
