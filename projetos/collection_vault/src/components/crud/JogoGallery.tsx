import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Trash2, Star, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Props {
  jogoId: string;
  thumbUrl?: string | null;
  onThumbChange?: (url: string | null) => void;
}

export function JogoGallery({ jogoId, thumbUrl, onThumbChange }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const imgs = useQuery({
    queryKey: ["jogo_imagens", jogoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jogo_imagens").select("*")
        .eq("jogo_id", jogoId).order("ordem");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!jogoId && open,
  });

  const upload = useMutation({
    mutationFn: async (files: FileList) => {
      const uploaded: { url: string; path: string }[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user!.id}/${jogoId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("jogo-imagens")
          .upload(path, file, { upsert: false, contentType: file.type });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("jogo-imagens").getPublicUrl(path);
        uploaded.push({ url: pub.publicUrl, path });
      }
      const { error } = await supabase.from("jogo_imagens").insert(
        uploaded.map((u) => ({
          user_id: user!.id, jogo_id: jogoId, url: u.url, storage_path: u.path,
        })),
      );
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Upload OK"); qc.invalidateQueries({ queryKey: ["jogo_imagens", jogoId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (img: { id: string; storage_path: string | null; url: string }) => {
      if (img.storage_path) await supabase.storage.from("jogo-imagens").remove([img.storage_path]);
      const { error } = await supabase.from("jogo_imagens").delete().eq("id", img.id);
      if (error) throw error;
      if (thumbUrl === img.url) {
        await supabase.from("jogos").update({ thumb_url: null }).eq("id", jogoId);
        onThumbChange?.(null);
        qc.invalidateQueries({ queryKey: ["jogos"] });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jogo_imagens", jogoId] }),
  });

  const setThumb = useMutation({
    mutationFn: async (url: string) => {
      const { error } = await supabase.from("jogos").update({ thumb_url: url }).eq("id", jogoId);
      if (error) throw error;
      onThumbChange?.(url);
    },
    onSuccess: () => { toast.success("Thumb definida"); qc.invalidateQueries({ queryKey: ["jogos"] }); },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="font-mono text-base gap-1 h-8">
          <ImageIcon className="h-4 w-4" /> Galeria
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle className="font-display text-sm neon-text-cyan">GALERIA DO JOGO</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <input
            ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => { if (e.target.files?.length) upload.mutate(e.target.files); e.target.value = ""; }}
          />
          <Button onClick={() => fileRef.current?.click()} disabled={upload.isPending} className="font-display text-xs w-full">
            <Upload className="h-4 w-4 mr-1" /> {upload.isPending ? "ENVIANDO..." : "ENVIAR FOTOS"}
          </Button>
          <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
            {imgs.data?.map((img) => (
              <div key={img.id} className="relative border-2 border-border rounded-md overflow-hidden group">
                <img src={img.url} alt="" className="w-full h-32 object-cover" />
                {thumbUrl === img.url && (
                  <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-display px-1 py-0.5 rounded">THUMB</span>
                )}
                <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition">
                  <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => setThumb.mutate(img.url)}>
                    <Star className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-7 w-7"
                    onClick={() => remove.mutate({ id: img.id, storage_path: img.storage_path, url: img.url })}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            {imgs.data?.length === 0 && (
              <p className="col-span-3 text-center font-mono text-base text-muted-foreground py-8">Sem imagens.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
