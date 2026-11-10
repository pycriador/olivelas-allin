import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { LayoutTemplate, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { templatesApi, type CreateFormInput } from "@/services/forms-service";
import { FORM_CATEGORIES, slugify } from "@/types/forms";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateFormInput) => void;
  pending?: boolean;
}

export function FormCreateDialog({ open, onOpenChange, onSubmit, pending }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("survey");
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [templateId, setTemplateId] = useState<string | null>(null);

  const { data: templates = [] } = useQuery({
    queryKey: ["form-templates"],
    queryFn: templatesApi.list,
  });

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setCategory("survey");
      setVisibility("private");
      setTemplateId(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("forms.create.title")}</DialogTitle>
          <DialogDescription>{t("forms.create.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("forms.fields.name")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              {name && (
                <p className="text-xs text-muted-foreground">/f/{slugify(name)}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{t("forms.fields.description")}</Label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("forms.fields.category")}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORM_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {t(`forms.categories.${c}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("forms.fields.visibility")}</Label>
                <Select
                  value={visibility}
                  onValueChange={(v) => setVisibility(v as "public" | "private")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">{t("forms.visibility.private")}</SelectItem>
                    <SelectItem value="public">{t("forms.visibility.public")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("forms.create.startFrom")}</Label>
            <ScrollArea className="h-[280px] rounded-lg border p-2">
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setTemplateId(null)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition",
                    templateId === null
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent/60",
                  )}
                >
                  <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{t("forms.create.blank")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("forms.create.blankDesc")}
                    </p>
                  </div>
                </button>
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setTemplateId(tpl.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition",
                      templateId === tpl.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-accent/60",
                    )}
                  >
                    <LayoutTemplate className="mt-0.5 h-4 w-4 text-primary" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{tpl.name}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {tpl.description}
                      </p>
                      <Badge variant="secondary" className="mt-1.5 text-[10px]">
                        {tpl.pages.reduce((acc, p) => acc + p.fields.length, 0)}{" "}
                        {t("forms.fieldsCount")}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={!name.trim() || pending}
            onClick={() =>
              onSubmit({
                name: name.trim(),
                description,
                category,
                visibility,
                templateId: templateId ?? undefined,
              })
            }
          >
            {t("forms.create.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
