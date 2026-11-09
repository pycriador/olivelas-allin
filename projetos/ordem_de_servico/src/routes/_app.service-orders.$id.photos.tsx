import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Camera, Star, Trash2, Upload, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { serviceOrderService } from "@/modules/service-orders/service";
import type { SOPhoto } from "@/modules/service-orders/types";

export const Route = createFileRoute("/_app/service-orders/$id/photos")({
  head: () => ({ meta: [{ title: "Fotos — ServiceForge" }] }),
  component: PhotosTab,
});

const categories: Array<SOPhoto["category"]> = ["entry", "diagnosis", "execution", "exit", "return", "warranty"];

function PhotosTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<SOPhoto | null>(null);
  const [form, setForm] = useState({
    category: "entry" as SOPhoto["category"],
    caption: "",
    fileUrl: `/photos/placeholder-${Math.random().toString(36).slice(2, 6)}.jpg`,
    order: 0,
    favorite: false,
  });

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ["so-photos", id],
    queryFn: () => serviceOrderService.getPhotos(id),
  });

  const addPhoto = useMutation({
    mutationFn: () => serviceOrderService.addPhoto(id, { ...form, uploadedBy: "Admin" }, "Admin"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["so-photos", id] }); setOpen(false); toast.success("Foto adicionada"); },
  });

  const removePhoto = useMutation({
    mutationFn: (photoId: string) => serviceOrderService.removePhoto(id, photoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["so-photos", id] }),
  });

  const toggleFav = useMutation({
    mutationFn: (photoId: string) => serviceOrderService.togglePhotoFavorite(id, photoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["so-photos", id] }),
  });

  const grouped = categories.map((cat) => ({
    category: cat,
    items: photos.filter((p) => p.category === cat),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("so.photo.gallery")}</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Upload className="mr-2 h-4 w-4" />{t("so.photo.add")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("so.photo.add")}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t("so.photo.category")}</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })}>
                  {categories.map((cat) => <option key={cat} value={cat}>{t(`so.photo.category.${cat}`)}</option>)}
                </select>
              </div>
              <div>
                <Label>{t("so.photo.caption")}</Label>
                <Input value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
                <Button onClick={() => addPhoto.mutate()}>{t("common.save")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ category, items }) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">{t(`so.photo.category.${category}`)}</Badge>
                <span className="text-xs text-muted-foreground">{items.length} {t("so.photo.gallery")}</span>
              </div>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("common.noResults")}</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {items.map((photo) => (
                    <Card key={photo.id} className="group relative overflow-hidden cursor-pointer">
                      <CardContent className="p-2">
                        <div className="aspect-square bg-muted rounded-md flex items-center justify-center" onClick={() => setPreview(photo)}>
                          <Camera className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-xs truncate mt-1">{photo.caption || photo.category}</p>
                        <div className="flex items-center justify-between mt-1">
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => toggleFav.mutate(photo.id)}>
                            <Star className={`h-3 w-3 ${photo.favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removePhoto.mutate(photo.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{preview?.caption || t("so.photo.gallery")}</DialogTitle></DialogHeader>
          <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
            <Camera className="h-32 w-32 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{t(`so.photo.category.${preview?.category}`)} · {preview?.uploadedAt ? new Date(preview.uploadedAt).toLocaleString("pt-BR") : ""}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
