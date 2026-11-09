import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, FileImage, Grid3x3, List, Palette, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  useRealtimeCampaign,
  resolveNumberStatus,
} from "@/features/campaigns/hooks/use-realtime-campaign";
import { useNow } from "@/features/campaigns/hooks/use-countdown";
import { campaignMediaPublicUrl, siteUrl } from "@/services/campaign.service";
import { NumberGridRenderer } from "./number-grid-renderer";
import type {
  ArtworkFormat,
  ArtworkSettings,
  ArtworkTheme,
  GridViewMode,
} from "./number-grid-renderer";
import type { CampaignWithRelations } from "@/types/campaign";

export interface ArtworkGeneratorProps {
  campaign: CampaignWithRelations;
}

const SIZES = [
  { label: "Quadrado (1080×1080)", w: 1080, h: 1080 },
  { label: "Story (1080×1920)", w: 1080, h: 1920 },
  { label: "Post (1080×1350)", w: 1080, h: 1350 },
  { label: "Paisagem (1920×1080)", w: 1920, h: 1080 },
] as const;

export function ArtworkGenerator({ campaign }: ArtworkGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const numbersQuery = useRealtimeCampaign(campaign.id);
  const numbers = useMemo(() => numbersQuery.data ?? [], [numbersQuery.data]);
  const now = useNow();

  const storageKey = `artwork-prefs-${campaign.id}`;

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore */
    }
    return {};
  }

  const saved = loadPrefs();

  const [viewMode, setViewMode] = useState<GridViewMode>(saved.viewMode ?? "grid");
  const [theme, setTheme] = useState<ArtworkTheme>(saved.theme ?? "light");
  const [columns, setColumns] = useState(saved.columns ?? 10);
  const [format, setFormat] = useState<ArtworkFormat>(saved.format ?? "png");
  const [sizeIndex, setSizeIndex] = useState(saved.sizeIndex ?? 0);
  const [showHeader, setShowHeader] = useState(saved.showHeader ?? true);
  const [showTitle, setShowTitle] = useState(saved.showTitle ?? true);
  const [showFooter, setShowFooter] = useState(saved.showFooter ?? true);
  const [showLegend, setShowLegend] = useState(saved.showLegend ?? true);
  const [showNumbers, setShowNumbers] = useState(saved.showNumbers ?? true);
  const [showStats, setShowStats] = useState(saved.showStats ?? true);
  const [highlightPaid, setHighlightPaid] = useState(saved.highlightPaid ?? false);
  const [highlightReserved, setHighlightReserved] = useState(saved.highlightReserved ?? false);
  const [highlightWinner, setHighlightWinner] = useState(saved.highlightWinner ?? false);

  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        viewMode,
        theme,
        columns,
        format,
        sizeIndex,
        showHeader,
        showTitle,
        showFooter,
        showLegend,
        showNumbers,
        showStats,
        highlightPaid,
        highlightReserved,
        highlightWinner,
      }),
    );
  }, [
    storageKey,
    viewMode,
    theme,
    columns,
    format,
    sizeIndex,
    showHeader,
    showTitle,
    showFooter,
    showLegend,
    showNumbers,
    showStats,
    highlightPaid,
    highlightReserved,
    highlightWinner,
  ]);

  const size = SIZES[sizeIndex] ?? SIZES[0];

  const settings = useMemo<ArtworkSettings>(
    () => ({
      viewMode,
      columns,
      theme,
      showLegend,
      showNumbers,
      showStats,
      showHeader,
      showTitle,
      showFooter,
      highlightPaid,
      highlightReserved,
      highlightWinner,
      width: size.w,
      height: size.h,
    }),
    [
      viewMode,
      columns,
      theme,
      showLegend,
      showNumbers,
      showStats,
      showHeader,
      showTitle,
      showFooter,
      highlightPaid,
      highlightReserved,
      highlightWinner,
      size.w,
      size.h,
    ],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderer = new NumberGridRenderer(ctx, 2);
    void renderer
      .render({
        campaign,
        numbers,
        now,
        settings,
        coverUrl: campaignMediaPublicUrl(campaign.cover_image),
      })
      .then(() => {
        canvas.style.width = "100%";
        canvas.style.height = "auto";
        canvas.style.maxWidth = `${settings.width}px`;
      });
  }, [campaign, numbers, now, settings]);

  function handleExport() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mime = NumberGridRenderer.getMime(format);
    const ext = NumberGridRenderer.getExtension(format);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${campaign.slug}-grade.${ext}`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Arte exportada com sucesso");
      },
      mime,
      0.95,
    );
  }

  function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const shareUrl = `${siteUrl()}/r/${campaign.slug}`;
    const text = `${campaign.title}\n${shareUrl}`;

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        const file = new File([blob], `${campaign.slug}-grade.png`, { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ title: campaign.title, text, files: [file] });
            return;
          } catch {
            // Usuario cancelou o compartilhamento.
            return;
          }
        }

        // Fallback: baixa a imagem e abre o WhatsApp com o link para anexar.
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(url);
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
        toast.success("Imagem baixada. No WhatsApp, anexe a imagem para compartilhar");
      },
      "image/png",
      0.95,
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visualizacao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as GridViewMode)}>
              <TabsList className="w-full">
                <TabsTrigger value="grid" className="flex-1">
                  <Grid3x3 className="size-4" />
                  Grade
                </TabsTrigger>
                <TabsTrigger value="sold-list" className="flex-1">
                  <List className="size-4" />
                  Vendidos
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <Label>Tema</Label>
              <Select value={theme} onValueChange={(v) => setTheme(v as ArtworkTheme)}>
                <SelectTrigger>
                  <Palette className="size-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Escuro</SelectItem>
                  <SelectItem value="corporate">Corporativo</SelectItem>
                  <SelectItem value="minimal">Minimalista</SelectItem>
                  <SelectItem value="colorful">Colorido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dimensao</Label>
              <Select value={String(sizeIndex)} onValueChange={(v) => setSizeIndex(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZES.map((s, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {viewMode === "grid" ? (
              <div className="space-y-2">
                <Label>Colunas: {columns}</Label>
                <Slider
                  value={[columns]}
                  min={5}
                  max={20}
                  step={1}
                  onValueChange={([v]) => v != null && setColumns(v)}
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Formato</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as ArtworkFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG (alta qualidade)</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exibicao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Cabecalho" checked={showHeader} onChange={setShowHeader} />
            <Row label="Titulo" checked={showTitle} onChange={setShowTitle} />
            <Row label="Estatisticas" checked={showStats} onChange={setShowStats} />
            <Row label="Numeros" checked={showNumbers} onChange={setShowNumbers} />
            <Row label="Legenda" checked={showLegend} onChange={setShowLegend} />
            <Row label="Rodape" checked={showFooter} onChange={setShowFooter} />
            {viewMode === "grid" ? (
              <>
                <Row label="Destacar pagos" checked={highlightPaid} onChange={setHighlightPaid} />
                <Row
                  label="Destacar reservados"
                  checked={highlightReserved}
                  onChange={setHighlightReserved}
                />
                <Row
                  label="Destacar premiados"
                  checked={highlightWinner}
                  onChange={setHighlightWinner}
                />
              </>
            ) : null}
          </CardContent>
        </Card>

        <Button type="button" className="w-full" onClick={handleExport}>
          <Download className="size-4" />
          Exportar {format.toUpperCase()}
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={handleShare}>
          <Share2 className="size-4" />
          Compartilhar no WhatsApp
        </Button>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileImage className="size-4" />
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center bg-muted/30 p-4">
            <div ref={previewRef} className="overflow-auto w-full" style={{ maxHeight: "70vh" }}>
              <canvas ref={canvasRef} className="w-full border shadow-lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="cursor-pointer text-sm">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
