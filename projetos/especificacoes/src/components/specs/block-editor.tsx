import { useState } from "react";
import { GripVertical, Trash2, ArrowUp, ArrowDown, Plus } from "lucide-react";
import type { Block } from "@/types/domain";
import { BlockType } from "@/types/domain";
import { uid } from "@/lib/id";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BlockRenderer } from "./block-renderer";

const BLOCK_LABEL: Record<BlockType, string> = {
  markdown: "Markdown",
  code: "Code",
  table: "Table",
  checklist: "Checklist",
  image: "Image",
  mermaid: "Mermaid",
  json: "JSON",
  yaml: "YAML",
  sql: "SQL",
  text: "Text",
  prompt: "Prompt",
};

interface Props {
  value: Block[];
  onChange: (blocks: Block[]) => void;
}

export function BlockEditor({ value, onChange }: Props) {
  const [preview, setPreview] = useState<Record<string, boolean>>({});

  const update = (id: string, patch: Partial<Block>) =>
    onChange(value.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const remove = (id: string) => onChange(value.filter((b) => b.id !== id));

  const move = (id: string, dir: -1 | 1) => {
    const idx = value.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const target = idx + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const insertBelow = (type: BlockType, afterId?: string) => {
    const newBlock: Block = { id: uid(), type, content: defaultFor(type) };
    if (!afterId) {
      onChange([...value, newBlock]);
      return;
    }
    const idx = value.findIndex((b) => b.id === afterId);
    const next = [...value];
    next.splice(idx + 1, 0, newBlock);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {value.map((block) => {
        const isPreview = preview[block.id];
        return (
          <div key={block.id} className="group rounded-lg border border-border/70 bg-card">
            <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <GripVertical className="h-3.5 w-3.5" />
                <span className="uppercase tracking-wide">{BLOCK_LABEL[block.type]}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setPreview((p) => ({ ...p, [block.id]: !p[block.id] }))}>
                  {isPreview ? "Edit" : "Preview"}
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(block.id, -1)} aria-label="Move up">
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(block.id, 1)} aria-label="Move down">
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(block.id)} aria-label="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="p-3">
              {isPreview ? (
                <BlockRenderer block={block} />
              ) : block.type === BlockType.Checklist ? (
                <ChecklistEditor block={block} onChange={(patch) => update(block.id, patch)} />
              ) : (
                <Textarea
                  value={block.content}
                  onChange={(e) => update(block.id, { content: e.target.value })}
                  rows={Math.min(20, Math.max(4, block.content.split("\n").length + 1))}
                  className={
                    block.type === BlockType.Markdown || block.type === BlockType.Text
                      ? "text-sm"
                      : "font-mono text-xs"
                  }
                  placeholder={placeholderFor(block.type)}
                />
              )}
            </div>

            <div className="flex justify-center border-t border-dashed border-border/50 py-1.5 opacity-0 transition-opacity group-hover:opacity-100">
              <InsertMenu onInsert={(t) => insertBelow(t, block.id)} />
            </div>
          </div>
        );
      })}

      <div className="flex justify-center">
        <InsertMenu onInsert={(t) => insertBelow(t)} label="Add block" />
      </div>
    </div>
  );
}

function InsertMenu({ onInsert, label }: { onInsert: (t: BlockType) => void; label?: string }) {
  const types = Object.values(BlockType);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs">
          <Plus className="h-3.5 w-3.5" />
          {label ?? "Insert"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        {types.map((t) => (
          <DropdownMenuItem key={t} onClick={() => onInsert(t)}>{BLOCK_LABEL[t]}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ChecklistEditor({ block, onChange }: { block: Block; onChange: (p: Partial<Block>) => void }) {
  let items: Array<{ text: string; done: boolean }> = [];
  try {
    const parsed = JSON.parse(block.content);
    if (Array.isArray(parsed)) {
      items = parsed.filter(
        (it): it is { text: string; done: boolean } =>
          typeof it === "object" && it !== null && typeof it.text === "string" && typeof it.done === "boolean",
      );
    }
  } catch {
    items = [];
  }

  const save = (next: typeof items) => onChange({ content: JSON.stringify(next) });

  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={it.done}
            onChange={(e) => save(items.map((x, j) => (j === i ? { ...x, done: e.target.checked } : x)))}
            className="rounded"
          />
          <Input
            value={it.text}
            onChange={(e) => save(items.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
            className="h-7 text-sm"
          />
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => save(items.filter((_, j) => j !== i))}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => save([...items, { text: "New item", done: false }])}>
        <Plus className="h-3.5 w-3.5 mr-1" />Add item
      </Button>
    </div>
  );
}

function defaultFor(type: BlockType): string {
  switch (type) {
    case BlockType.Markdown: return "# Heading\n\nWrite here…";
    case BlockType.Code: return "// code\n";
    case BlockType.JSON: return "{\n  \n}";
    case BlockType.YAML: return "key: value\n";
    case BlockType.SQL: return "SELECT * FROM table;";
    case BlockType.Checklist: return JSON.stringify([{ text: "New item", done: false }]);
    case BlockType.Mermaid: return "graph TD;\n  A-->B;";
    case BlockType.Prompt: return "Prompt: …";
    default: return "";
  }
}

function placeholderFor(type: BlockType): string {
  return `Content (${BLOCK_LABEL[type]})`;
}
