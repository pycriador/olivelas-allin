import { Check, Eye, Globe, Image as ImageIcon, Move, Sparkles, UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ArtCreationMockup() {
  return (
    <div className="rounded-2xl border border-border bg-card/90 shadow-xl overflow-hidden backdrop-blur">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-destructive/60" />
            <span className="size-3 rounded-full bg-amber-500/60" />
            <span className="size-3 rounded-full bg-emerald-500/60" />
          </div>
          <span className="text-xs font-semibold text-foreground ml-2">
            Criação de Artes, Galeria e Configuração de SEO
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
          Supabase Storage CDN
        </Badge>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Upload Zone simulation */}
        <div className="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-6 text-center space-y-2">
          <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <UploadCloud className="size-5" />
          </div>
          <h4 className="font-bold text-sm text-foreground">Upload de Fotos & Artes da Campanha</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Arraste imagens nos formatos PNG, JPEG ou WebP (máx. 10MB). O sistema gera miniaturas e URLs públicas de alta velocidade.
          </p>
          <Button size="sm" variant="outline" className="h-8 text-xs font-semibold">
            Selecionar Arquivos
          </Button>
        </div>

        {/* Gallery Sorter Simulation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Galeria de Mídias (Arraste para Reordenar):</span>
            <span className="text-[11px] text-muted-foreground">A primeira foto é a capa oficial</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="relative rounded-xl border-2 border-primary overflow-hidden bg-muted aspect-video group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-between p-2">
                <Badge className="bg-primary text-primary-foreground text-[9px] self-start font-bold">
                  ★ CAPA PRINCIPAL
                </Badge>
                <div className="flex items-center justify-between text-white text-[10px]">
                  <span>Foto 1 (Principal)</span>
                  <Move className="size-3 opacity-80" />
                </div>
              </div>
            </div>

            <div className="relative rounded-xl border border-border overflow-hidden bg-muted aspect-video group hover:border-primary/50 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-2">
                <div className="flex items-center justify-between text-white text-[10px]">
                  <span>Foto 2 (Detalhe)</span>
                  <Move className="size-3 opacity-80" />
                </div>
              </div>
            </div>

            <div className="relative rounded-xl border border-border overflow-hidden bg-muted aspect-video group hover:border-primary/50 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-2">
                <div className="flex items-center justify-between text-white text-[10px]">
                  <span>Foto 3 (Traseira)</span>
                  <Move className="size-3 opacity-80" />
                </div>
              </div>
            </div>

            <div className="relative rounded-xl border border-border overflow-hidden bg-muted aspect-video group hover:border-primary/50 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-2">
                <div className="flex items-center justify-between text-white text-[10px]">
                  <span>Foto 4 (Acessórios)</span>
                  <Move className="size-3 opacity-80" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEO Metatags & Social Card Preview */}
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="size-4 text-primary" />
            <h5 className="font-bold text-xs text-foreground">Pré-Visualização do Link Social (WhatsApp / Instagram / Google)</h5>
          </div>

          <div className="rounded-lg border border-border bg-card p-3 flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-32 aspect-video bg-muted rounded-md flex items-center justify-center text-muted-foreground shrink-0 font-bold text-xs">
              Arte da Capa
            </div>
            <div className="space-y-1 text-xs">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">rafflehub.com.br/r/iphone-15</span>
              <h6 className="font-bold text-foreground text-sm">Rifa iPhone 15 Pro Max 256GB — Apenas R$ 25,00 a Cota!</h6>
              <p className="text-[11px] text-muted-foreground line-clamp-2">
                Participe da rifa oficial com sorteio pela Loteria Federal. Escolha seus números e reserve em tempo real direto pelo WhatsApp!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
