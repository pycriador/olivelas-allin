import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import type { PageRow, StickerRow } from "@/lib/types";
import { Trash2 } from "lucide-react";

type Props = {
  page: PageRow | null;
  sticker: StickerRow | null;
  onStickerChange: (patch: Partial<StickerRow>, commit?: boolean) => void;
  onPageChange: (patch: Partial<PageRow>) => void;
  onDeleteSticker: () => void;
  onPageBgUpload: (file: File) => void;
};

export function PropertiesPanel({ page, sticker, onStickerChange, onPageChange, onDeleteSticker, onPageBgUpload }: Props) {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">Página</h3>
        {page && (
          <div className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={page.name} onChange={(e) => onPageChange({ name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={page.page_type} onValueChange={(v) => onPageChange({ page_type: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">Capa</SelectItem>
                  <SelectItem value="common">Página comum</SelectItem>
                  <SelectItem value="back_cover">Contracapa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cor de fundo</Label>
              <Input type="color" value={page.background?.color ?? "#ffffff"}
                onChange={(e) => onPageChange({ background: { ...page.background, color: e.target.value } })} />
            </div>
            <div className="space-y-1.5">
              <Label>Imagem de fundo</Label>
              <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onPageBgUpload(e.target.files[0])} />
              {page.background?.imageUrl && (
                <Button size="sm" variant="ghost" onClick={() => onPageChange({ background: { ...page.background, imageUrl: undefined } })}>Remover imagem</Button>
              )}
            </div>
          </div>
        )}
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">Figurinha</h3>
        {!sticker && <p className="mt-3 text-sm text-muted-foreground">Selecione uma figurinha no canvas.</p>}
        {sticker && (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">X (cm)</Label>
                <Input type="number" step="0.1" value={sticker.x_cm}
                  onChange={(e) => onStickerChange({ x_cm: Number(e.target.value) })}
                  onBlur={() => onStickerChange({}, true)} />
              </div>
              <div>
                <Label className="text-xs">Y (cm)</Label>
                <Input type="number" step="0.1" value={sticker.y_cm}
                  onChange={(e) => onStickerChange({ y_cm: Number(e.target.value) })}
                  onBlur={() => onStickerChange({}, true)} />
              </div>
              <div>
                <Label className="text-xs">Largura (cm)</Label>
                <Input type="number" step="0.1" value={sticker.width_cm}
                  onChange={(e) => onStickerChange({ width_cm: Number(e.target.value) })}
                  onBlur={() => onStickerChange({}, true)} />
              </div>
              <div>
                <Label className="text-xs">Altura (cm)</Label>
                <Input type="number" step="0.1" value={sticker.height_cm}
                  onChange={(e) => onStickerChange({ height_cm: Number(e.target.value) })}
                  onBlur={() => onStickerChange({}, true)} />
              </div>
            </div>

            <div>
              <Label className="text-xs">Rotação</Label>
              <Slider min={-180} max={180} step={1} value={[sticker.rotation ?? 0]}
                onValueChange={(v) => onStickerChange({ rotation: v[0] })}
                onValueCommit={() => onStickerChange({}, true)} />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Numeração</Label>
                <Switch checked={sticker.number_enabled}
                  onCheckedChange={(v) => onStickerChange({ number_enabled: v }, true)} />
              </div>
              {sticker.number_enabled && (
                <>
                  <Input type="number" placeholder="Número" value={sticker.number ?? ""}
                    onChange={(e) => onStickerChange({ number: e.target.value ? Number(e.target.value) : null })}
                    onBlur={() => onStickerChange({}, true)} />
                  <Select value={sticker.number_position} onValueChange={(v) => onStickerChange({ number_position: v }, true)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-left">Superior esquerdo</SelectItem>
                      <SelectItem value="top-right">Superior direito</SelectItem>
                      <SelectItem value="bottom-left">Inferior esquerdo</SelectItem>
                      <SelectItem value="bottom-right">Inferior direito</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-xs">Título</Label>
              <Input value={sticker.title ?? ""}
                onChange={(e) => onStickerChange({ title: e.target.value })}
                onBlur={() => onStickerChange({}, true)} />
              <Label className="text-xs">Legenda</Label>
              <Input value={sticker.caption ?? ""}
                onChange={(e) => onStickerChange({ caption: e.target.value })}
                onBlur={() => onStickerChange({}, true)} />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Borda (px)</Label>
                <Input type="number" value={sticker.style?.borderWidth ?? 2}
                  onChange={(e) => onStickerChange({ style: { ...sticker.style, borderWidth: Number(e.target.value) } })}
                  onBlur={() => onStickerChange({}, true)} />
              </div>
              <div>
                <Label className="text-xs">Raio (px)</Label>
                <Input type="number" value={sticker.style?.borderRadius ?? 12}
                  onChange={(e) => onStickerChange({ style: { ...sticker.style, borderRadius: Number(e.target.value) } })}
                  onBlur={() => onStickerChange({}, true)} />
              </div>
              <div>
                <Label className="text-xs">Cor borda</Label>
                <Input type="color" value={sticker.style?.borderColor ?? "#ffffff"}
                  onChange={(e) => onStickerChange({ style: { ...sticker.style, borderColor: e.target.value } }, true)} />
              </div>
              <div className="flex items-end gap-2">
                <Label className="text-xs">Sombra</Label>
                <Switch checked={sticker.style?.shadow !== false}
                  onCheckedChange={(v) => onStickerChange({ style: { ...sticker.style, shadow: v } }, true)} />
              </div>
            </div>

            <Button variant="destructive" className="w-full" onClick={onDeleteSticker}>
              <Trash2 className="w-4 h-4 mr-2" /> Excluir figurinha
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}