import { useTranslation } from "react-i18next";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FIELD_META } from "./field-library";
import { useBuilderStore } from "@/stores/builder-store";
import { OPTION_FIELDS, STATIC_FIELDS, slugify, uid } from "@/types/forms";

export function FieldProperties() {
  const { t } = useTranslation();
  const pages = useBuilderStore((s) => s.pages);
  const activePageId = useBuilderStore((s) => s.activePageId);
  const selectedFieldId = useBuilderStore((s) => s.selectedFieldId);
  const updateField = useBuilderStore((s) => s.updateField);

  const page = pages.find((p) => p.id === activePageId);
  const field = page?.fields.find((f) => f.id === selectedFieldId);

  if (!field) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        {t("forms.builder.noSelection")}
      </div>
    );
  }

  const Icon = FIELD_META[field.type].icon;
  const isStatic = STATIC_FIELDS.includes(field.type);
  const hasOptions = OPTION_FIELDS.includes(field.type) && field.type !== "checkbox";
  const isNumeric = field.type === "number" || field.type === "scale" || field.type === "rating";

  return (
    <ScrollArea className="h-full">
      <div className="space-y-5 p-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{t(`forms.fieldTypes.${field.type}`)}</span>
          <span className="ml-auto text-[11px] text-muted-foreground">
            #{field.order + 1}
          </span>
        </div>

        {field.type !== "divider" && (
          <div className="space-y-1.5">
            <Label className="text-xs">{t("forms.props.label")}</Label>
            <Input
              value={field.label}
              onChange={(e) => updateField(field.id, { label: e.target.value })}
            />
          </div>
        )}

        {!isStatic && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("forms.props.placeholder")}</Label>
              <Input
                value={field.placeholder ?? ""}
                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t("forms.props.helpText")}</Label>
              <Textarea
                rows={2}
                value={field.helpText ?? ""}
                onChange={(e) => updateField(field.id, { helpText: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <Label className="text-xs">{t("forms.props.required")}</Label>
              <Switch
                checked={field.required}
                onCheckedChange={(c) => updateField(field.id, { required: c })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t("forms.props.defaultValue")}</Label>
              <Input
                value={field.defaultValue ?? ""}
                onChange={(e) => updateField(field.id, { defaultValue: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("forms.props.min")}</Label>
                <Input
                  type="number"
                  value={field.min ?? ""}
                  onChange={(e) =>
                    updateField(field.id, {
                      min: e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("forms.props.max")}</Label>
                <Input
                  type="number"
                  value={field.max ?? ""}
                  onChange={(e) =>
                    updateField(field.id, {
                      max: e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            {!isNumeric && (
              <p className="-mt-3 text-[11px] text-muted-foreground">
                {t("forms.props.lengthHint")}
              </p>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">{t("forms.props.validation")}</Label>
              <Input
                placeholder="^[A-Za-z ]+$"
                value={field.validation ?? ""}
                onChange={(e) => updateField(field.id, { validation: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t("forms.props.mask")}</Label>
              <Input
                placeholder="(99) 99999-9999"
                value={field.mask ?? ""}
                onChange={(e) => updateField(field.id, { mask: e.target.value })}
              />
            </div>
          </>
        )}

        {hasOptions && (
          <div className="space-y-2 border-t pt-4">
            <Label className="text-xs">{t("forms.props.options")}</Label>
            {field.options.map((option, index) => (
              <div key={option.id} className="flex items-center gap-1.5">
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                <Input
                  value={option.label}
                  onChange={(e) =>
                    updateField(field.id, {
                      options: field.options.map((o, i) =>
                        i === index
                          ? { ...o, label: e.target.value, value: slugify(e.target.value) || o.value }
                          : o,
                      ),
                    })
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-destructive"
                  onClick={() =>
                    updateField(field.id, {
                      options: field.options.filter((_, i) => i !== index),
                    })
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() =>
                updateField(field.id, {
                  options: [
                    ...field.options,
                    {
                      id: uid("opt"),
                      label: `Opção ${field.options.length + 1}`,
                      value: `opcao-${field.options.length + 1}`,
                    },
                  ],
                })
              }
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {t("forms.props.addOption")}
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
