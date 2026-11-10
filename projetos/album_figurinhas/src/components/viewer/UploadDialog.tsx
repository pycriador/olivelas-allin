import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import type { StickerRow } from "@/lib/types";
import { uploadStickerPhoto } from "@/lib/db";
import { toast } from "sonner";
import { Loader2, UploadCloud } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sticker: StickerRow | null;
  albumId: string;
  onUploaded: () => void;
};

export function UploadDialog({ open, onOpenChange, sticker, albumId, onUploaded }: Props) {
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [scale, setScale] = React.useState(1);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) { setFile(null); setPreviewUrl(null); setScale(1); }
  }, [open]);

  const onFile = (f: File) => {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!file || !sticker) return;
    setBusy(true);
    try {
      await uploadStickerPhoto(file, { albumId, pageId: sticker.page_id, stickerId: sticker.id });
      toast.success("Foto enviada!");
      onUploaded();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao enviar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar foto {sticker?.title ? `· ${sticker.title}` : ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!previewUrl ? (
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:bg-muted/40 transition">
              <UploadCloud className="w-8 h-8 text-muted-foreground" />
              <div className="text-sm">Clique ou arraste uma foto (JPG, PNG, WEBP)</div>
              <Input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            </label>
          ) : (
            <div className="space-y-3">
              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted relative">
                <img src={previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})` }} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Zoom</div>
                <Slider min={1} max={3} step={0.05} value={[scale]} onValueChange={(v) => setScale(v[0])} />
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => { setFile(null); setPreviewUrl(null); }}>Trocar</Button>
                <Button onClick={submit} disabled={busy}>
                  {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando</> : "Confirmar"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}