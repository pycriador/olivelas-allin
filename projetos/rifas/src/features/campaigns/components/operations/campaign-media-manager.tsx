import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowUpDown,
  Camera,
  CheckCircle2,
  Download,
  Eye,
  Globe,
  ImageOff,
  Pencil,
  Share2,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/common/confirm-dialog";

import { campaignMediaPublicUrl, campaignService } from "@/services/campaign.service";
import { formatBytes } from "@/services/storage.service";
import {
  useUploadCampaignImages,
  useRemoveCampaignImage,
  useSetCampaignCover,
  useReorderCampaignImages,
} from "@/features/campaigns/hooks/use-campaigns";
import {
  CAMPAIGN_IMAGE_TYPE_LABELS,
  type CampaignImage,
  type CampaignImageType,
} from "@/types/campaign";

export interface CampaignMediaManagerProps {
  campaignId: string;
  images: CampaignImage[];
}

export function CampaignMediaManager({ campaignId, images }: CampaignMediaManagerProps) {
  const [dragover, setDragover] = useState(false);
  const [previewImage, setPreviewImage] = useState<CampaignImage | null>(null);
  const [editingImage, setEditingImage] = useState<CampaignImage | null>(null);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  const upload = useUploadCampaignImages();
  const remove = useRemoveCampaignImage();
  const setCover = useSetCampaignCover();
  const reorder = useReorderCampaignImages();

  const sorted = [...images].sort((a, b) => a.display_order - b.display_order);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const imageFiles = [...files].filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast.error("Selecione apenas arquivos de imagem (PNG, JPG, WebP).");
      return;
    }
    upload.mutate(
      { campaignId, files: imageFiles },
      {
        onSuccess: () => toast.success(`${imageFiles.length} imagem(ns) enviada(s)`),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  async function handleSetImageType(imageId: string, imageType: CampaignImageType) {
    try {
      await campaignService.setImageType(campaignId, imageId, imageType);
      toast.success(`Imagem definida como ${CAMPAIGN_IMAGE_TYPE_LABELS[imageType]}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao alterar tipo");
    }
  }

  const coverImage = sorted.find((img) => img.image_type === "COVER");
  const shareImage = sorted.find((img) => img.image_type === "SHARE");
  const totalSize = sorted.reduce((sum, img) => sum + (img.size ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Imagens</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{sorted.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Espaço</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{formatBytes(totalSize)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Capa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {coverImage ? (
                <>
                  <CheckCircle2 aria-hidden="true" className="size-5 text-success" />
                  <span className="text-sm font-medium">Configurada</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Não definida</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Compartilhamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {shareImage ? (
                <>
                  <CheckCircle2 aria-hidden="true" className="size-5 text-success" />
                  <span className="text-sm font-medium">Configurada</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Não definida</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragover ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragover(true);
        }}
        onDragLeave={() => setDragover(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragover(false);
          handleFiles(event.dataTransfer.files);
        }}
      >
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          id="media-upload"
          onChange={(event) => handleFiles(event.target.files)}
        />
        <label htmlFor="media-upload" className="cursor-pointer">
          <UploadCloud aria-hidden="true" className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="text-sm font-medium">Arraste imagens ou clique para enviar</p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG ou WebP. Máximo recomendado: 1600px.
          </p>
        </label>
      </div>

      {upload.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="aspect-square rounded-lg" />
          <Skeleton className="aspect-square rounded-lg" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <ImageOff aria-hidden="true" className="mb-3 size-12" />
          <p className="text-sm font-medium">Nenhuma imagem cadastrada</p>
          <p className="text-xs">Envie a primeira imagem da campanha.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sorted.map((image) => (
            <MediaCard
              key={image.id}
              image={image}
              onPreview={() => setPreviewImage(image)}
              onEdit={() => setEditingImage(image)}
              onSetType={(type) => handleSetImageType(image.id, type)}
              onSetCover={() =>
                setCover.mutate(
                  { campaignId, imageId: image.id },
                  {
                    onSuccess: () => toast.success("Capa definida"),
                    onError: (error) => toast.error(error.message),
                  },
                )
              }
              onRemove={() => setRemoveTarget(image.id)}
            />
          ))}
        </div>
      )}

      {previewImage ? (
        <Sheet open={Boolean(previewImage)} onOpenChange={() => setPreviewImage(null)}>
          <SheetContent className="w-full sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>{previewImage.filename}</SheetTitle>
              <SheetDescription>
                {previewImage.width}×{previewImage.height} · {formatBytes(previewImage.size ?? 0)} ·{" "}
                {previewImage.mime_type ?? "desconhecido"}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4">
              <img
                src={campaignMediaPublicUrl(previewImage.storage_path) ?? ""}
                alt={previewImage.alt_text ?? ""}
                className="w-full rounded-lg object-contain"
              />
            </div>
          </SheetContent>
        </Sheet>
      ) : null}

      {editingImage ? (
        <ImageEditSheet
          image={editingImage}
          open={Boolean(editingImage)}
          onOpenChange={() => setEditingImage(null)}
        />
      ) : null}

      {removeTarget ? (
        <ConfirmDialog
          open={Boolean(removeTarget)}
          onOpenChange={() => setRemoveTarget(null)}
          title="Remover imagem"
          description="A imagem será excluída permanentemente da campanha."
          confirmLabel="Remover"
          onConfirm={() =>
            remove.mutate(
              { campaignId, imageId: removeTarget },
              {
                onSuccess: () => {
                  toast.success("Imagem removida");
                  setRemoveTarget(null);
                },
                onError: (error) => {
                  toast.error(error.message);
                  setRemoveTarget(null);
                },
              },
            )
          }
        />
      ) : null}
    </div>
  );
}

function MediaCard({
  image,
  onPreview,
  onEdit,
  onSetType,
  onSetCover,
  onRemove,
}: {
  image: CampaignImage;
  onPreview: () => void;
  onEdit: () => void;
  onSetType: (type: CampaignImageType) => void;
  onSetCover: () => void;
  onRemove: () => void;
}) {
  const url = campaignMediaPublicUrl(image.storage_path);

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card">
      {url ? (
        <img
          src={url}
          alt={image.alt_text ?? ""}
          loading="lazy"
          className="aspect-square w-full object-cover"
        />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center bg-muted">
          <ImageOff aria-hidden="true" className="size-8 text-muted-foreground" />
        </div>
      )}

      <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {image.image_type !== "COVER" ? (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-7"
            onClick={onSetCover}
            aria-label="Definir como capa"
          >
            <Star aria-hidden="true" className="size-3.5" />
          </Button>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-7"
          onClick={onEdit}
          aria-label="Editar"
        >
          <Pencil aria-hidden="true" className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-7"
          onClick={onPreview}
          aria-label="Visualizar"
        >
          <Eye aria-hidden="true" className="size-3.5" />
        </Button>
      </div>

      <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Badge variant="secondary" className="cursor-pointer text-xs" onClick={onSetCover}>
          {image.image_type === "COVER"
            ? "Capa"
            : image.image_type === "SHARE"
              ? "Share"
              : "Galeria"}
        </Badge>
      </div>

      <div className="p-2">
        <div className="flex items-center justify-between gap-1">
          <p className="truncate text-xs font-medium">{image.filename}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6 text-destructive"
            onClick={onRemove}
            aria-label="Remover"
          >
            <Trash2 aria-hidden="true" className="size-3.5" />
          </Button>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <Select
            value={image.image_type}
            onValueChange={(value) => onSetType(value as CampaignImageType)}
          >
            <SelectTrigger className="h-6 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="COVER">Capa</SelectItem>
              <SelectItem value="GALLERY">Galeria</SelectItem>
              <SelectItem value="SHARE">Compartilhamento</SelectItem>
            </SelectContent>
          </Select>
          {image.width && image.height ? (
            <span className="text-xs text-muted-foreground">
              {image.width}×{image.height}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ImageEditSheet({
  image,
  open,
  onOpenChange,
}: {
  image: CampaignImage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [altText, setAltText] = useState(image.alt_text ?? "");
  const [caption, setCaption] = useState(image.caption ?? "");

  async function handleSave() {
    try {
      await campaignService.updateImage(image.id, { altText, caption });
      toast.success("Imagem atualizada");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Editar imagem</SheetTitle>
          <SheetDescription>{image.filename}</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <img
            src={campaignMediaPublicUrl(image.storage_path) ?? ""}
            alt={image.alt_text ?? ""}
            className="w-full rounded-lg object-contain"
          />
          <div className="space-y-2">
            <Label htmlFor="img-alt">Texto alternativo (SEO)</Label>
            <Input
              id="img-alt"
              value={altText}
              onChange={(event) => setAltText(event.target.value)}
              placeholder="Descrição da imagem para acessibilidade"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="img-caption">Legenda</Label>
            <Textarea
              id="img-caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Legenda exibida na galeria pública"
              rows={2}
            />
          </div>
          <Button type="button" className="w-full" onClick={handleSave}>
            Salvar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
