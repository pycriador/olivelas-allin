import { useEffect, useState } from "react";
import { Check, Copy, Link2, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Campaign } from "@/types/campaign";

export interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Pick<Campaign, "slug" | "title">;
}

function buildUrl(slug: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/r/${slug}`;
}

export function ShareDialog({ open, onOpenChange, campaign }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const url = buildUrl(campaign.slug);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado para a área de transferência");
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  };

  const shareTargets = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${campaign.title}: ${url}`)}`,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      label: "X (Twitter)",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(campaign.title)}&url=${encodeURIComponent(url)}`,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartilhar campanha</DialogTitle>
          <DialogDescription>
            Compartilhe a página pública de “{campaign.title}” em suas redes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="share-url">Link da página pública</Label>
            <div className="flex gap-2">
              <Input id="share-url" value={url} readOnly />
              <Button type="button" variant="outline" size="icon" onClick={() => void copy()}>
                {copied ? (
                  <Check aria-hidden="true" className="size-4 text-success" />
                ) : (
                  <Copy aria-hidden="true" className="size-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {shareTargets.map((target) => (
              <Button key={target.label} type="button" variant="outline" asChild>
                <a href={target.href} target="_blank" rel="noopener noreferrer">
                  <Share2 aria-hidden="true" className="size-4" />
                  {target.label}
                </a>
              </Button>
            ))}
          </div>

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link2 aria-hidden="true" className="size-3.5" />A página só fica visível quando a
            campanha está pública e ativa.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
