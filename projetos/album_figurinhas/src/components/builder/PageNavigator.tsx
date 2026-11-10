import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PageRow } from "@/lib/types";
import { Copy, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  pages: PageRow[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDuplicate: (p: PageRow) => void;
  onDelete: (p: PageRow) => void;
  onMove: (p: PageRow, dir: -1 | 1) => void;
};

export function PageNavigator({ pages, currentId, onSelect, onAdd, onDuplicate, onDelete, onMove }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 flex items-center justify-between border-b border-border/60">
        <div className="text-sm font-semibold">Páginas ({pages.length})</div>
        <Button size="sm" onClick={onAdd}><Plus className="w-4 h-4 mr-1" /> Nova</Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {pages.map((p, i) => (
            <div key={p.id}
              onClick={() => onSelect(p.id)}
              className={cn(
                "group rounded-lg border bg-card transition-all cursor-pointer overflow-hidden",
                currentId === p.id ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-foreground/30"
              )}>
              <div className="aspect-[21/29.7] w-full bg-muted relative flex items-center justify-center text-xs text-muted-foreground"
                style={{ backgroundColor: p.background?.color ?? "#fff", backgroundImage: p.background?.imageUrl ? `url(${p.background.imageUrl})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
                <span className="px-2 py-0.5 rounded bg-black/50 text-white text-[10px] font-medium">{i + 1}</span>
              </div>
              <div className="p-2 flex items-center justify-between gap-1">
                <div className="text-xs font-medium truncate flex-1">{p.name}</div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onMove(p, -1); }}><ArrowUp className="w-3 h-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onMove(p, 1); }}><ArrowDown className="w-3 h-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDuplicate(p); }}><Copy className="w-3 h-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(p); }}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            </div>
          ))}
          {pages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              Nenhuma página ainda. Clique em <strong>Nova</strong> para começar.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}