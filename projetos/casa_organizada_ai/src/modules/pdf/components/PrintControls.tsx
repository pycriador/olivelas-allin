import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listThemes, type MarketTheme } from "@/modules/marketplace/api";
import type { PdfLayout, PageFormat, Orientation } from "../layout";

type Props = {
  layout: PdfLayout;
  onChange: (patch: Partial<PdfLayout>) => void;
};

export function PrintControls({ layout, onChange }: Props) {
  const themesQ = useQuery({ queryKey: ["market", "themes", { sort: "popular" }], queryFn: () => listThemes({ sort: "popular" }) });
  const themes = themesQ.data ?? [];

  function applyTheme(id: string) {
    if (id === "none") {
      onChange({ themeId: null });
      return;
    }
    const t = themes.find((x: MarketTheme) => x.id === id);
    if (!t) return;
    const c = t.tokens?.colors ?? {};
    onChange({
      themeId: id,
      themeColors: {
        primary: c.primary ?? layout.themeColors.primary,
        accent: c.accent ?? layout.themeColors.accent,
        bg: c.background ?? c.bg ?? layout.themeColors.bg,
        fg: c.foreground ?? c.fg ?? layout.themeColors.fg,
      },
    });
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Página</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Formato</Label>
            <Select value={layout.format} onValueChange={(v) => onChange({ format: v as PageFormat })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4</SelectItem>
                <SelectItem value="A5">A5</SelectItem>
                <SelectItem value="Letter">Carta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Orientação</Label>
            <Select value={layout.orientation} onValueChange={(v) => onChange({ orientation: v as Orientation })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Retrato</SelectItem>
                <SelectItem value="landscape">Paisagem</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-xs">Margens (mm)</Label>
          <div className="mt-1 grid grid-cols-4 gap-2">
            {(["top", "right", "bottom", "left"] as const).map((k) => (
              <Input key={k} type="number" min={0} max={60} value={layout.margins[k]}
                onChange={(e) => onChange({ margins: { ...layout.margins, [k]: Number(e.target.value) || 0 } })} />
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs">Escala de fonte ({layout.fontScale.toFixed(2)}x)</Label>
          <Slider min={0.8} max={1.4} step={0.05} value={[layout.fontScale]}
            onValueChange={([v]) => onChange({ fontScale: v })} />
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Tema</h3>
        <Select value={layout.themeId ?? "none"} onValueChange={applyTheme}>
          <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum (padrão)</SelectItem>
            {themes.map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <ColorInput label="Primária" value={layout.themeColors.primary}
            onChange={(v) => onChange({ themeColors: { ...layout.themeColors, primary: v } })} />
          <ColorInput label="Destaque" value={layout.themeColors.accent}
            onChange={(v) => onChange({ themeColors: { ...layout.themeColors, accent: v } })} />
          <ColorInput label="Fundo" value={layout.themeColors.bg}
            onChange={(v) => onChange({ themeColors: { ...layout.themeColors, bg: v } })} />
          <ColorInput label="Texto" value={layout.themeColors.fg}
            onChange={(v) => onChange({ themeColors: { ...layout.themeColors, fg: v } })} />
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Capa</h3>
          <Switch checked={layout.cover.enabled}
            onCheckedChange={(v) => onChange({ cover: { ...layout.cover, enabled: v } })} />
        </div>
        {layout.cover.enabled && (
          <div className="space-y-2">
            <div>
              <Label className="text-xs">Subtítulo</Label>
              <Input value={layout.cover.subtitle}
                onChange={(e) => onChange({ cover: { ...layout.cover, subtitle: e.target.value } })} />
            </div>
            <div>
              <Label className="text-xs">Autor</Label>
              <Input value={layout.cover.author}
                onChange={(e) => onChange({ cover: { ...layout.cover, author: e.target.value } })} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Mostrar data</Label>
              <Switch checked={layout.cover.showDate}
                onCheckedChange={(v) => onChange({ cover: { ...layout.cover, showDate: v } })} />
            </div>
          </div>
        )}
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Cabeçalho</h3>
          <Switch checked={layout.header.enabled}
            onCheckedChange={(v) => onChange({ header: { ...layout.header, enabled: v } })} />
        </div>
        {layout.header.enabled && (
          <Input value={layout.header.text} placeholder="{title}"
            onChange={(e) => onChange({ header: { ...layout.header, text: e.target.value } })} />
        )}
        <p className="text-[10px] text-muted-foreground">Use {"{title}"}, {"{page}"}, {"{total}"}, {"{date}"}</p>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Rodapé</h3>
          <Switch checked={layout.footer.enabled}
            onCheckedChange={(v) => onChange({ footer: { ...layout.footer, enabled: v } })} />
        </div>
        {layout.footer.enabled && (
          <Input value={layout.footer.text} placeholder="Ex.: HomeFlow"
            onChange={(e) => onChange({ footer: { ...layout.footer, text: e.target.value } })} />
        )}
        <div className="flex items-center justify-between">
          <Label className="text-xs">Numerar páginas</Label>
          <Switch checked={layout.footer.showPageNumbers}
            onCheckedChange={(v) => onChange({ footer: { ...layout.footer, showPageNumbers: v } })} />
        </div>
      </Card>
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1 flex items-center gap-1">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8 text-xs" />
      </div>
    </div>
  );
}