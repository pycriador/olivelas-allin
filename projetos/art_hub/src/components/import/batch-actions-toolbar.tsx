import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trash2, X, CheckCircle, XCircle, FolderSync, Tags } from "lucide-react";
import { cn } from "@/lib/utils";
import { importStore } from "@/lib/upload/import-store";
import { toast } from "sonner";

interface Props {
  selectedIds: string[];
  onClear: () => void;
}

export function BatchActionsToolbar({ selectedIds, onClear }: Props) {
  return (
    <AnimatePresence>
      {selectedIds.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 shadow-2xl shadow-black/10"
        >
          <span className="mr-1 px-2 text-sm font-medium tabular-nums">
            {selectedIds.length}
          </span>
          <div className="mx-1 h-5 w-px bg-border" />
          <BatchButton
            icon={<Sparkles className="h-3.5 w-3.5" />}
            label="Reprocessar IA"
            onClick={() => {
              importStore.reprocessAI(selectedIds);
              onClear();
            }}
          />
          <BatchButton
            icon={<CheckCircle className="h-3.5 w-3.5" />}
            label="Publicar"
            onClick={() => {
              selectedIds.forEach((id) =>
                importStore.updateItem(id, { status: "done", progress: 100 }),
              );
              onClear();
            }}
          />
          <BatchButton
            icon={<XCircle className="h-3.5 w-3.5" />}
            label="Despublicar"
            onClick={() => {
              selectedIds.forEach((id) =>
                importStore.updateItem(id, { status: "queued", progress: 0 }),
              );
              onClear();
            }}
          />
          <BatchButton
            icon={<FolderSync className="h-3.5 w-3.5" />}
            label="Mover"
            onClick={() => {
              const cid = prompt("ID da coleção:");
              if (cid) {
                selectedIds.forEach((id) => importStore.moveItemCollection(id, cid));
              }
              onClear();
            }}
          />
          <BatchButton
            icon={<Tags className="h-3.5 w-3.5" />}
            label="Tags"
            onClick={() => {
              toast.info("Edição de tags em lote em breve.");
              onClear();
            }}
          />
          <div className="mx-1 h-5 w-px bg-border" />
          <BatchButton
            icon={<Trash2 className="h-3.5 w-3.5" />}
            label="Excluir"
            destructive
            onClick={() => {
              selectedIds.forEach((id) => importStore.removeItem(id));
              onClear();
            }}
          />
          <div className="mx-1 h-5 w-px bg-border" />
          <button
            type="button"
            onClick={onClear}
            className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function BatchButton({
  icon,
  label,
  destructive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors",
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}


