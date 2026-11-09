import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Plus, Trash2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { deviceService } from "@/modules/devices/service";
import type { DevicePhoto } from "@/modules/devices/types";

export const Route = createFileRoute("/_app/service-orders/assets/equipment/$id/photos")({
  head: () => ({ meta: [{ title: "Fotos — ServiceForge" }] }),
  component: EquipmentPhotosTab,
});

const categoryLabels: Record<string, string> = {
  front: "Frente", back: "Trás", sides: "Laterais", label: "Etiqueta",
  serial: "Serial", defect: "Defeito", accessories: "Acessórios", general: "Geral",
};

const categoryColors: Record<string, string> = {
  front: "bg-blue-100 text-blue-700", back: "bg-purple-100 text-purple-700",
  sides: "bg-amber-100 text-amber-700", label: "bg-green-100 text-green-700",
  serial: "bg-teal-100 text-teal-700", defect: "bg-red-100 text-red-700",
  accessories: "bg-pink-100 text-pink-700", general: "bg-gray-100 text-gray-700",
};

function EquipmentPhotosTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [photoCategory, setPhotoCategory] = useState<DevicePhoto["category"]>("general");

  const { data: device, isLoading } = useQuery({
    queryKey: ["device", id],
    queryFn: () => deviceService.get(id),
  });

  const addPhotoMut = useMutation({
    mutationFn: async () => {
      const file = fileRef.current?.files?.[0];
      if (!file) throw new Error("Nenhum arquivo selecionado");
      const url = URL.createObjectURL(file);
      return deviceService.addPhoto(id, {
        deviceId: id, category: photoCategory, url, uploadedAt: new Date().toISOString(), uploadedBy: "Sistema",
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["device", id] }); setOpen(false); setPhotoCategory("general"); if (fileRef.current) fileRef.current.value = ""; toast.success("Foto adicionada"); },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro ao adicionar foto"),
  });

  const removePhotoMut = useMutation({
    mutationFn: (photoId: string) => deviceService.removePhoto(id, photoId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["device", id] }); toast.success("Foto removida"); },
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;
  if (!device) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Equipamento não encontrado</p></div>;

  const photos = device.photos ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Fotos</h2>
          <p className="text-sm text-muted-foreground">{photos.length} foto(s) cadastrada(s)</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Adicionar Foto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Adicionar Foto</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1"><Label>Arquivo</Label>
                <input ref={fileRef} type="file" accept="image/*" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-primary/10 file:text-primary" />
              </div>
              <div className="space-y-1"><Label>Categoria</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={photoCategory} onChange={(e) => setPhotoCategory(e.target.value as any)}>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={() => addPhotoMut.mutate()} disabled={addPhotoMut.isPending}>{addPhotoMut.isPending ? "Adicionando..." : "Adicionar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {photos.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Camera className="h-10 w-10" />
              <p className="text-sm">Nenhuma foto cadastrada</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {photos.map((photo) => (
            <Card key={photo.id}>
              <CardContent className="p-2">
                <div className="aspect-square rounded-md bg-muted flex items-center justify-center mb-2 overflow-hidden">
                  <img src={photo.url} alt={categoryLabels[photo.category]} className="w-full h-full object-cover" />
                </div>
                <div className="px-1 pb-1 flex items-center justify-between">
                  <Badge className={categoryColors[photo.category]} variant="outline">{categoryLabels[photo.category]}</Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removePhotoMut.mutate(photo.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
