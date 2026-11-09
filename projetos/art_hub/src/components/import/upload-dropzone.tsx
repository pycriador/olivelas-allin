import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { importStore, useImportStore } from "@/lib/upload/import-store";
import { toast } from "sonner";

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";
const MAX_FILES = 500;

export function UploadDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const { settings } = useImportStore();

  const onFiles = useCallback(
    (files: File[]) => {
      if (!settings.collectionId) {
        toast.error("Selecione uma coleção nas configurações antes de enviar.");
        return;
      }
      if (files.length > MAX_FILES) {
        toast.warning(`Máximo de ${MAX_FILES} imagens por lote.`);
        files = files.slice(0, MAX_FILES);
      }
      importStore.addFiles(files);
    },
    [settings.collectionId],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
        if (files.length) onFiles(files);
      }}
      className={cn(
        "relative flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-surface/30 p-12 text-center transition-all duration-300",
        drag && "scale-[1.02] border-primary bg-primary/5",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="grid h-20 w-20 place-items-center rounded-3xl bg-primary/10 text-primary"
      >
        <UploadCloud className="h-10 w-10" />
      </motion.div>
      <h3 className="mt-6 font-display text-2xl tracking-tight">Arraste suas imagens aqui</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        ou clique para selecionar arquivos do seu computador
      </p>
      <Button className="mt-6" onClick={() => inputRef.current?.click()} size="lg">
        <ImagePlus className="mr-2 h-4 w-4" /> Selecionar arquivos
      </Button>
      <p className="mt-6 text-xs text-muted-foreground/70">
        PNG &middot; JPG &middot; WEBP &middot; GIF &mdash; até {MAX_FILES} imagens por vez
      </p>
    </motion.div>
  );
}
