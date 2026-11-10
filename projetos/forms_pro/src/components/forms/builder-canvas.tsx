import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { FieldRenderer } from "./field-renderer";
import { FIELD_META } from "./field-library";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/stores/builder-store";
import type { FieldType, FormField } from "@/types/forms";

interface CanvasProps {
  onQuickAdd: () => void;
}

export function BuilderCanvas({ onQuickAdd }: CanvasProps) {
  const { t } = useTranslation();
  const pages = useBuilderStore((s) => s.pages);
  const activePageId = useBuilderStore((s) => s.activePageId);
  const selectedFieldId = useBuilderStore((s) => s.selectedFieldId);
  const selectField = useBuilderStore((s) => s.selectField);
  const moveField = useBuilderStore((s) => s.moveField);
  const addField = useBuilderStore((s) => s.addField);
  const duplicateField = useBuilderStore((s) => s.duplicateField);
  const removeField = useBuilderStore((s) => s.removeField);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const page = pages.find((p) => p.id === activePageId);
  if (!page) return null;

  const handleDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const libraryType = e.dataTransfer.getData("application/x-field-type") as FieldType | "";
    if (libraryType) {
      addField(libraryType, index);
    } else if (dragIndex !== null) {
      moveField(dragIndex, dragIndex < index ? index - 1 : index);
    }
    setDragIndex(null);
    setOverIndex(null);
  };

  const DropZone = ({ index }: { index: number }) => (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOverIndex(index);
      }}
      onDragLeave={() => setOverIndex((v) => (v === index ? null : v))}
      onDrop={handleDrop(index)}
      className={cn(
        "-my-1 h-3 rounded-full transition-all",
        overIndex === index && "my-1 h-2 bg-primary/70",
      )}
    />
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-1 pb-24">
      <div className="mb-6 space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">{page.title}</h2>
        {page.description && (
          <p className="text-sm text-muted-foreground">{page.description}</p>
        )}
      </div>

      {page.fields.length === 0 && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop(0)}
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center"
        >
          <p className="text-sm text-muted-foreground">{t("forms.builder.emptyCanvas")}</p>
          <Button variant="outline" size="sm" onClick={onQuickAdd}>
            <Plus className="mr-1.5 h-4 w-4" />
            {t("forms.builder.addField")}
          </Button>
        </div>
      )}

      {page.fields.map((field: FormField, index: number) => {
        const Icon = FIELD_META[field.type].icon;
        const selected = selectedFieldId === field.id;
        return (
          <div key={field.id}>
            <DropZone index={index} />
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div
                  draggable
                  onDragStart={(e) => {
                    setDragIndex(index);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  onClick={() => selectField(field.id)}
                  className={cn(
                    "group relative rounded-xl border bg-card p-4 pl-10 transition",
                    selected
                      ? "border-primary/60 shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]"
                      : "hover:border-muted-foreground/30",
                    dragIndex === index && "opacity-50",
                  )}
                >
                  <span className="absolute left-2 top-4 cursor-grab text-muted-foreground/50 opacity-0 transition group-hover:opacity-100 active:cursor-grabbing">
                    <GripVertical className="h-4 w-4" />
                  </span>

                  <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateField(field.id);
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("forms.actions.duplicate")}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeField(field.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("common.delete")}</TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                    {t(`forms.fieldTypes.${field.type}`)}
                  </div>
                  <FieldRenderer field={field} disabled />
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => duplicateField(field.id)}>
                  <Copy className="mr-2 h-4 w-4" />
                  {t("forms.actions.duplicate")}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  className="text-destructive"
                  onClick={() => removeField(field.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("common.delete")}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </div>
        );
      })}

      {page.fields.length > 0 && (
        <>
          <DropZone index={page.fields.length} />
          <Button
            variant="ghost"
            className="mt-3 w-full border border-dashed text-muted-foreground"
            onClick={onQuickAdd}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {t("forms.builder.addField")}
          </Button>
        </>
      )}
    </div>
  );
}
