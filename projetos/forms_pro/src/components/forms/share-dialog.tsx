import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Code2, Copy, Globe, Lock, QrCode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { FormDefinition } from "@/types/forms";

interface Props {
  form: FormDefinition;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVisibilityChange: (visibility: FormDefinition["visibility"]) => void;
}

export function ShareDialog({ form, open, onOpenChange, onVisibilityChange }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = `${origin}/f/${form.slug}`;
  const embed = `<iframe src="${publicUrl}" width="100%" height="720" frameborder="0" title="${form.name}"></iframe>`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(publicUrl)}`;

  const copy = (value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    toast.success(t("forms.share.copied"));
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("forms.share.title")}</DialogTitle>
          <DialogDescription>{t("forms.share.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2.5">
            {form.visibility === "public" ? (
              <Globe className="h-4 w-4 text-primary" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {t(`forms.visibility.${form.visibility}`)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t(`forms.share.${form.visibility}Hint`)}
              </p>
            </div>
          </div>
          <Switch
            checked={form.visibility === "public"}
            onCheckedChange={(c) => onVisibilityChange(c ? "public" : "private")}
          />
        </div>

        <Tabs defaultValue="link">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">{t("forms.share.link")}</TabsTrigger>
            <TabsTrigger value="embed">
              <Code2 className="mr-1.5 h-3.5 w-3.5" />
              {t("forms.share.embed")}
            </TabsTrigger>
            <TabsTrigger value="qr">
              <QrCode className="mr-1.5 h-3.5 w-3.5" />
              QR
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-2 pt-3">
            <Label className="text-xs">{t("forms.share.publicUrl")}</Label>
            <div className="flex gap-2">
              <Input readOnly value={publicUrl} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => copy(publicUrl, "link")}>
                {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="embed" className="space-y-2 pt-3">
            <Label className="text-xs">{t("forms.share.embedCode")}</Label>
            <div className="flex gap-2">
              <Input readOnly value={embed} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => copy(embed, "embed")}>
                {copied === "embed" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="qr" className="flex flex-col items-center gap-3 pt-4">
            <img
              src={qrUrl}
              alt={t("forms.share.qrAlt")}
              width={220}
              height={220}
              className="rounded-lg border bg-white p-2"
            />
            <p className="text-xs text-muted-foreground">{t("forms.share.qrHint")}</p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
