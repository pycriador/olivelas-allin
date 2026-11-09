import { useQuery } from "@tanstack/react-query";
import { Settings2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { collectionsRepo } from "@/lib/repositories/collections";
import { aiPromptsRepo } from "@/lib/repositories/ai";
import { importStore, useImportStore } from "@/lib/upload/import-store";

export function ImportSettings() {
  const { settings } = useImportStore();
  const collections = useQuery({
    queryKey: ["collections-import-select"],
    queryFn: () => collectionsRepo.listAdmin({ pageSize: 200, sort: "name", direction: "asc" }),
  });
  const prompts = useQuery({
    queryKey: ["prompts-import-select"],
    queryFn: () => aiPromptsRepo.list(),
  });

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          Configuração do lote
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-5 md:grid-cols-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Coleção</Label>
            <Select
              value={settings.collectionId ?? ""}
              onValueChange={(v) => importStore.setSettings({ collectionId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma coleção" />
              </SelectTrigger>
              <SelectContent>
                {(collections.data?.rows ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Categoria</Label>
            <Input
              placeholder="Ex: Signos, Datas..."
              value={settings.category}
              onChange={(e) => importStore.setSettings({ category: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Status</Label>
            <Select
              value={settings.status}
              onValueChange={(v) =>
                importStore.setSettings({ status: v as "active" | "draft" | "inactive" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              <Sparkles className="mr-1 inline h-3 w-3" /> Prompt IA
            </Label>
            <Select
              value={settings.promptSlug ?? "__system_default__"}
              onValueChange={(v) => importStore.setSettings({ promptSlug: v === "__system_default__" ? null : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Usar padrão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__system_default__">Padrão do sistema</SelectItem>
                {(prompts.data ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.slug}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5 grid gap-2 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <ToggleRow
            label="Publicar automaticamente"
            hint="Marca as artes como ativas."
            checked={settings.publish}
            onChange={(v) => importStore.setSettings({ publish: v })}
          />
          <ToggleRow
            label="Executar IA automaticamente"
            hint="Cataloga logo após o upload."
            checked={settings.runAI}
            onChange={(v) => importStore.setSettings({ runAI: v })}
          />
          <ToggleRow
            label="Gerar Slug automaticamente"
            hint="A partir do título da arte."
            checked={settings.autoSlug}
            onChange={(v) => importStore.setSettings({ autoSlug: v })}
          />
          <ToggleRow
            label="Gerar Código automaticamente"
            hint="Sequencial ART-XXXX."
            checked={settings.autoCode}
            onChange={(v) => importStore.setSettings({ autoCode: v })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 bg-surface/40 p-3 transition-colors hover:bg-surface">
      <Switch checked={checked} onCheckedChange={onChange} />
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </label>
  );
}
