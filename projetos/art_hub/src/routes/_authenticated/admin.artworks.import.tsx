import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { ImportHeader } from "@/components/import/import-header";
import { ImportSettings } from "@/components/import/import-settings";
import { UploadDropzone } from "@/components/import/upload-dropzone";
import { ProcessingDashboard } from "@/components/import/processing-dashboard";
import { UploadGrid } from "@/components/import/upload-grid";
import { BatchActionsToolbar } from "@/components/import/batch-actions-toolbar";
import { ImageDetailsDrawer } from "@/components/import/image-details-drawer";
import { importStore, useImportStore, type ImportItem } from "@/lib/upload/import-store";

export const Route = createFileRoute("/_authenticated/admin/artworks/import")({
  component: ImportPage,
});

function ImportPage() {
  const { items } = useImportStore();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openItem, setOpenItem] = useState<ImportItem | null>(null);
  const [notification, setNotification] = useState<{ message: string; count: number } | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const hasItems = items.length > 0;
  const allDone = hasItems && items.every((i) => i.status === "done" || i.status === "error");
  const allSuccess = hasItems && items.every((i) => i.status === "done");

  useEffect(() => {
    if (allSuccess && !clearTimer.current) {
      const count = items.length;
      clearTimer.current = setTimeout(() => {
        setNotification({ message: `${count} imagem(ns) processada(s) com sucesso`, count });
        importStore.clearAll();
        setSelected(new Set());
        clearTimer.current = undefined;
      }, 3000);
    }
    if (!allDone && clearTimer.current) {
      clearTimeout(clearTimer.current);
      clearTimer.current = undefined;
    }
  }, [allDone, allSuccess, items]);

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 pb-28">
      <ImportHeader />
      <ImportSettings />

      {hasItems ? (
        <section className="space-y-6">
          <ProcessingDashboard />
          <UploadGrid selected={selected} onToggle={toggle} onOpen={setOpenItem} />
        </section>
      ) : (
        <UploadDropzone />
      )}

      <BatchActionsToolbar
        selectedIds={Array.from(selected)}
        onClear={() => setSelected(new Set())}
      />
      <ImageDetailsDrawer item={openItem} onClose={() => setOpenItem(null)} />

      <AnimatePresence>
        {notification ? (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 shadow-lg dark:border-emerald-800 dark:bg-emerald-950"
          >
            <div className="flex items-center gap-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              <span>{notification.message}</span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
