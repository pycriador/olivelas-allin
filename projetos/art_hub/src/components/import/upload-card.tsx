import { motion } from "framer-motion";
import { MoreHorizontal, Sparkles, AlertCircle, Check, Copy, FolderSync, Trash2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { importStore, type ImportItem } from "@/lib/upload/import-store";

const STATUS: Record<
  ImportItem["status"],
  { label: string; className: string }
> = {
  queued: { label: "Na fila", className: "bg-muted text-muted-foreground" },
  uploading: { label: "Enviando", className: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
  uploaded: { label: "Upload OK", className: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
  analyzing: { label: "IA", className: "bg-primary/15 text-primary" },
  done: { label: "Concluído", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  error: { label: "Erro", className: "bg-destructive/15 text-destructive" },
};

interface Props {
  item: ImportItem;
  selected: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
}

export function UploadCard({ item, selected, onToggleSelect, onOpen }: Props) {
  const s = STATUS[item.status];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-all duration-200 hover:border-primary/40 hover:shadow-lg",
        selected && "border-primary ring-2 ring-primary/30",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="relative block aspect-square overflow-hidden bg-muted"
      >
        <img
          src={item.previewUrl}
          alt={item.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {item.status === "analyzing" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
        ) : null}
        {item.status === "error" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/20">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
        ) : null}
        {item.status === "done" ? (
          <div className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white shadow">
            <Check className="h-3.5 w-3.5" />
          </div>
        ) : null}
      </button>

      <div
        className="absolute left-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <div
          className="grid h-6 w-6 place-items-center rounded-md bg-background/80"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
        >
          <Checkbox checked={selected} onCheckedChange={onToggleSelect} />
        </div>
      </div>

      <Badge
        variant="outline"
        className={cn(
          "absolute bottom-14 left-2 border-0 px-1.5 py-0 text-[10px] font-medium",
          s.className,
        )}
      >
        {s.label}
      </Badge>

      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">{item.title}</p>
          {item.code ? (
            <p className="truncate text-[11px] text-muted-foreground">{item.code}</p>
          ) : null}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4}>
            <DropdownMenuItem onClick={onOpen}>
              <Copy className="mr-2 h-3.5 w-3.5" /> Editar
            </DropdownMenuItem>
            {item.artworkId ? (
              <DropdownMenuItem onClick={() => importStore.reprocessAI([item.id])}>
                <Sparkles className="mr-2 h-3.5 w-3.5" /> Reprocessar IA
              </DropdownMenuItem>
            ) : null}
            {item.status === "error" ? (
              <DropdownMenuItem onClick={() => importStore.retryItem(item.id)}>
                <RotateCcw className="mr-2 h-3.5 w-3.5" /> Tentar novamente
              </DropdownMenuItem>
            ) : null}
            {item.artworkId ? (
              <DropdownMenuItem
                onClick={() => {
                  const cid = prompt("Novo ID da coleção:");
                  if (cid) importStore.moveItemCollection(item.id, cid);
                }}
              >
                <FolderSync className="mr-2 h-3.5 w-3.5" /> Mover coleção
              </DropdownMenuItem>
            ) : null}
            {item.artworkId || item.status === "done" ? (
              <DropdownMenuItem onClick={() => importStore.duplicateItem(item.id)}>
                <Copy className="mr-2 h-3.5 w-3.5" /> Duplicar
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => importStore.removeItem(item.id)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {item.status === "uploading" || item.status === "analyzing" ? (
        <Progress value={item.progress} className="h-1 rounded-none" />
      ) : null}
    </motion.div>
  );
}
