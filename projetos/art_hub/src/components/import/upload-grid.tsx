import { AnimatePresence } from "framer-motion";
import { UploadCard } from "./upload-card";
import { useImportStore, type ImportItem } from "@/lib/upload/import-store";

interface Props {
  selected: Set<string>;
  onToggle: (id: string) => void;
  onOpen: (item: ImportItem) => void;
}

export function UploadGrid({ selected, onToggle, onOpen }: Props) {
  const { items } = useImportStore();
  if (!items.length) return null;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <UploadCard
            key={item.id}
            item={item}
            selected={selected.has(item.id)}
            onToggleSelect={() => onToggle(item.id)}
            onOpen={() => onOpen(item)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
