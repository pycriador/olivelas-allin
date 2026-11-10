import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Building2, Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useOrgStore } from "@/stores/org-store";
import { organizationsApi } from "@/services/org-service";
import { cn } from "@/lib/utils";

export function OrgSwitcher({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const { organizations, currentId, loaded, load, setCurrent, reload } = useOrgStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  const current = organizations.find((o) => o.id === currentId);

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const org = await organizationsApi.create({ name: name.trim(), legalName: legalName.trim() || undefined });
      await reload();
      await setCurrent(org.id);
      toast.success(t("org.create.created"));
      setOpen(false);
      setName("");
      setLegalName("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm transition hover:bg-accent",
              compact && "px-2",
            )}
          >
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="max-w-[140px] truncate font-medium">
              {current?.name ?? t("org.switcher.empty")}
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>{t("org.switcher.label")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {organizations.map((o) => (
            <DropdownMenuItem key={o.id} onClick={() => void setCurrent(o.id)}>
              <span className="flex-1 truncate">{o.name}</span>
              {o.id === currentId && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
          {organizations.length > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> {t("org.switcher.create")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("org.create.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="org-name">{t("org.create.name")}</Label>
              <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-legal">{t("org.create.legalName")}</Label>
              <Input id="org-legal" value={legalName} onChange={(e) => setLegalName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => void submit()} disabled={saving || !name.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("org.create.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
