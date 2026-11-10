import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FIELD_GROUPS, FIELD_META } from "./field-library";
import { useBuilderStore } from "@/stores/builder-store";
import { useState } from "react";
import type { FieldType } from "@/types/forms";

export function FieldLibraryPanel() {
  const { t } = useTranslation();
  const addField = useBuilderStore((s) => s.addField);
  const [query, setQuery] = useState("");

  const matches = (type: FieldType) =>
    t(`forms.fieldTypes.${type}`).toLowerCase().includes(query.trim().toLowerCase());

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Input
          placeholder={t("forms.builder.searchFields")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9"
        />
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-4 px-3 pb-6">
          {FIELD_GROUPS.map((group) => {
            const types = group.types.filter(matches);
            if (types.length === 0) return null;
            return (
              <div key={group.key} className="space-y-1.5">
                <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t(`forms.fieldGroups.${group.key}`)}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {types.map((type) => {
                    const Icon = FIELD_META[type].icon;
                    return (
                      <button
                        key={type}
                        type="button"
                        draggable
                        onDragStart={(e) =>
                          e.dataTransfer.setData("application/x-field-type", type)
                        }
                        onClick={() => addField(type)}
                        className="flex cursor-grab items-center gap-2 rounded-lg border bg-card px-2.5 py-2 text-left text-xs font-medium transition hover:border-primary/50 hover:bg-accent active:cursor-grabbing"
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="truncate">{t(`forms.fieldTypes.${type}`)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
