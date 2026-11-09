import { buildNumberRange } from "@/services/campaign-number.service";
import { resolveNumberStatus } from "@/features/campaigns/hooks/use-realtime-campaign";
import type { CampaignNumber, NumberGridStatus } from "@/types/campaign-number";
import type { Campaign } from "@/types/campaign";
import { formatCurrency, formatNumber } from "@/lib/format";

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export type ArtworkTheme = "light" | "dark" | "corporate" | "minimal" | "colorful";
export type ArtworkFormat = "png" | "jpeg";
export type GridViewMode = "grid" | "sold-list";

export interface ArtworkSettings {
  viewMode: GridViewMode;
  columns: number;
  theme: ArtworkTheme;
  showLegend: boolean;
  showNumbers: boolean;
  showStats: boolean;
  showHeader: boolean;
  showTitle: boolean;
  showFooter: boolean;
  highlightPaid: boolean;
  highlightReserved: boolean;
  highlightWinner: boolean;
  width: number;
  height: number;
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "#9CA3AF",
  RESERVED: "#FBBF24",
  PENDING_PAYMENT: "#3B82F6",
  PAID: "#22C55E",
  BLOCKED: "#1F2937",
  CANCELLED: "#EF4444",
  WINNER: "#F59E0B",
};

const DARK_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "#4B5563",
  RESERVED: "#D97706",
  PENDING_PAYMENT: "#2563EB",
  PAID: "#16A34A",
  BLOCKED: "#9CA3AF",
  CANCELLED: "#DC2626",
  WINNER: "#D97706",
};

const THEMES: Record<
  ArtworkTheme,
  {
    bg: string;
    text: string;
    muted: string;
    accent: string;
    border: string;
    status: Record<string, string>;
  }
> = {
  light: {
    bg: "#FFFFFF",
    text: "#111827",
    muted: "#6B7280",
    accent: "#6366F1",
    border: "#E5E7EB",
    status: STATUS_COLORS,
  },
  dark: {
    bg: "#111827",
    text: "#F9FAFB",
    muted: "#9CA3AF",
    accent: "#818CF8",
    border: "#374151",
    status: DARK_STATUS_COLORS,
  },
  corporate: {
    bg: "#F8FAFC",
    text: "#0F172A",
    muted: "#64748B",
    accent: "#2563EB",
    border: "#CBD5E1",
    status: STATUS_COLORS,
  },
  minimal: {
    bg: "#FFFFFF",
    text: "#18181B",
    muted: "#A1A1AA",
    accent: "#18181B",
    border: "#E4E4E7",
    status: STATUS_COLORS,
  },
  colorful: {
    bg: "#FFFBEB",
    text: "#1C1917",
    muted: "#78716C",
    accent: "#F59E0B",
    border: "#FDE68A",
    status: STATUS_COLORS,
  },
};

export interface RenderInput {
  campaign: Campaign;
  numbers: CampaignNumber[];
  now: number;
  settings: ArtworkSettings;
  coverUrl?: string | null;
}

export class NumberGridRenderer {
  private ctx: CanvasRenderingContext2D;
  private scale: number;
  private theme: typeof THEMES.light;

  constructor(ctx: CanvasRenderingContext2D, scale = 2) {
    this.ctx = ctx;
    this.scale = scale;
    this.theme = THEMES.light;
  }

  async render(input: RenderInput) {
    const { campaign, numbers, now, settings, coverUrl } = input;
    this.theme = THEMES[settings.theme];
    const ctx = this.ctx;
    const w = settings.width * this.scale;
    const h = settings.height * this.scale;

    ctx.canvas.width = w;
    ctx.canvas.height = h;
    ctx.scale(this.scale, this.scale);

    ctx.fillStyle = this.theme.bg;
    ctx.fillRect(0, 0, settings.width, settings.height);

    const margins = { top: 20, right: 20, bottom: 20, left: 20 };
    let y = margins.top;

    if (settings.showHeader) {
      const coverImg = coverUrl ? await loadImage(coverUrl) : null;
      y = this.drawHeader(
        ctx,
        campaign,
        numbers,
        now,
        coverImg,
        settings.width,
        margins,
        y,
        settings,
      );
    }

    if (settings.viewMode === "sold-list") {
      this.drawSoldList(ctx, campaign, numbers, now, settings, w, margins, y);
    } else {
      this.drawGrid(ctx, campaign, numbers, now, settings, margins, y);
    }

    if (settings.showFooter) {
      this.drawFooter(ctx, campaign, settings.width, settings.height, margins);
    }
  }

  private drawHeader(
    ctx: CanvasRenderingContext2D,
    campaign: Campaign,
    numbers: CampaignNumber[],
    now: number,
    coverImg: HTMLImageElement | null,
    canvasWidth: number,
    margins: { left: number; right: number; top: number },
    startY: number,
    settings: ArtworkSettings,
  ): number {
    let y = startY;

    if (coverImg) {
      // Banner no topo com imagem completa (sem cortar)
      const maxH = 350;
      const bannerW = canvasWidth - margins.left - margins.right;
      const bannerH = Math.min(bannerW * 0.45, maxH);

      // Fundo escuro para preencher espaco vazio
      ctx.fillStyle = "#1a1a2e";
      this.roundRect(ctx, margins.left, y, bannerW, bannerH, 12);
      ctx.fill();

      ctx.save();
      this.roundRect(ctx, margins.left, y, bannerW, bannerH, 12);
      ctx.clip();

      // contain: escala para caber inteiro sem cortar
      const scale = Math.min(bannerW / coverImg.naturalWidth, bannerH / coverImg.naturalHeight);
      const sw = coverImg.naturalWidth * scale;
      const sh = coverImg.naturalHeight * scale;
      const sx = margins.left + (bannerW - sw) / 2;
      const sy = y + (bannerH - sh) / 2;
      ctx.drawImage(coverImg, sx, sy, sw, sh);
      ctx.restore();

      // Overlay gradiente no rodape do banner
      const gradient = ctx.createLinearGradient(
        margins.left,
        y + bannerH - 60,
        margins.left,
        y + bannerH,
      );
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, "rgba(0,0,0,0.4)");
      ctx.fillStyle = gradient;
      this.roundRect(ctx, margins.left, y + bannerH - 60, bannerW, 60, 0);
      ctx.fill();

      // Titulo sobre o banner
      if (settings.showTitle) {
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `bold ${Math.max(22, bannerW * 0.04)}px system-ui`;
        ctx.fillText(campaign.title, margins.left + 16, y + bannerH - 18);
      }

      y += bannerH + 16;
    } else {
      if (settings.showTitle) {
        ctx.fillStyle = this.theme.text;
        ctx.font = "bold 28px system-ui";
        ctx.fillText(campaign.title, margins.left, y + 28);
        y += 36;
      }

      ctx.fillStyle = this.theme.muted;
      ctx.font = "16px system-ui";
      ctx.fillText(`${campaign.product_name}`, margins.left, y + 16);
      y += 28;
    }

    const contentWidth = canvasWidth - margins.left - margins.right;
    const totalNumbers = campaign.number_end - campaign.number_start + 1;
    const stateMap = new Map<number, CampaignNumber>();
    for (const row of numbers) stateMap.set(row.number, row);
    let paid = 0;
    let reserved = 0;
    for (const row of numbers) {
      const status = resolveNumberStatus(row, now);
      if (status === "PAID" || status === "WINNER") paid++;
      if (status === "RESERVED") reserved++;
    }
    const available = totalNumbers - paid - reserved;

    if (settings.showStats) {
      const stats = [
        { label: "Vendidos", value: String(paid), color: this.theme.status["PAID"] },
        { label: "Reservados", value: String(reserved), color: this.theme.status["RESERVED"] },
        { label: "Disponíveis", value: String(available) },
        { label: "Total", value: String(totalNumbers) },
        { label: "Valor", value: formatCurrency(campaign.price_per_number) },
      ];
      const statWidth = contentWidth / stats.length;
      ctx.font = "12px system-ui";
      stats.forEach((stat, i) => {
        const sx = margins.left + statWidth * i;
        ctx.fillStyle = stat.color ?? this.theme.muted;
        ctx.fillText(stat.label, sx, y + 12);
        ctx.fillStyle = this.theme.text;
        ctx.font = "bold 16px system-ui";
        ctx.fillText(stat.value, sx, y + 32);
        ctx.font = "12px system-ui";
      });
      y += 44;
    }

    y += 8;

    ctx.strokeStyle = this.theme.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margins.left, y);
    ctx.lineTo(canvasWidth - margins.right, y);
    ctx.stroke();
    y += 12;

    return y;
  }

  private drawGrid(
    ctx: CanvasRenderingContext2D,
    campaign: Campaign,
    numbers: CampaignNumber[],
    now: number,
    settings: ArtworkSettings,
    margins: { left: number; right: number; top: number; bottom: number },
    startY: number,
  ) {
    const stateMap = new Map<number, CampaignNumber>();
    for (const row of numbers) stateMap.set(row.number, row);

    const totalNumbers = campaign.number_end - campaign.number_start + 1;
    const range = buildNumberRange(campaign.number_start, campaign.number_end);

    const cols = settings.columns;
    const contentWidth = settings.width - margins.left - margins.right;
    const cellW = Math.floor(contentWidth / cols);
    const cellH = cellW * 0.62;
    const space = 2;

    const maxY = settings.height - margins.bottom - (settings.showFooter ? 80 : 0);
    let y = startY;

    ctx.font = `${Math.max(10, cellW * 0.2)}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < range.length; i++) {
      const number = range[i]!;
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = margins.left + col * cellW;
      y = startY + row * (cellH + space);

      if (y + cellH > maxY) break;

      const state = stateMap.get(number);
      const status = resolveNumberStatus(state ?? null, now);
      const color = this.getCellColor(status, settings);

      ctx.fillStyle = color;
      const rx = Math.min(6, cellW * 0.12);
      this.roundRect(ctx, x, y, cellW - space, cellH, rx);
      ctx.fill();

      if (settings.showNumbers) {
        ctx.fillStyle =
          status === "AVAILABLE" || status === "RESERVED" ? this.theme.text : "#FFFFFF";
        ctx.fillText(
          String(number).padStart(String(campaign.number_end).length, "0"),
          x + (cellW - space) / 2,
          y + cellH / 2,
        );
      }
    }

    if (settings.showLegend) {
      ctx.font = "16px system-ui";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const legendY = settings.height - margins.bottom - 32;
      const legendItems = [
        { label: "Disponivel", color: this.theme.status["AVAILABLE"] ?? "#9CA3AF" },
        { label: "Reservado", color: this.theme.status["RESERVED"] ?? "#FBBF24" },
        { label: "Pago", color: this.theme.status["PAID"] ?? "#22C55E" },
        { label: "Cancelado", color: this.theme.status["CANCELLED"] ?? "#EF4444" },
        { label: "Premiado", color: this.theme.status["WINNER"] ?? "#F59E0B" },
      ];
      let lx = margins.left;
      for (const item of legendItems) {
        ctx.fillStyle = item.color;
        ctx.fillRect(lx, legendY + 1, 16, 16);
        ctx.fillStyle = this.theme.text;
        ctx.fillText(item.label, lx + 22, legendY);
        lx += ctx.measureText(item.label).width + 40;
      }
    }
  }

  private drawSoldList(
    ctx: CanvasRenderingContext2D,
    campaign: Campaign,
    numbers: CampaignNumber[],
    now: number,
    settings: ArtworkSettings,
    canvasWidth: number,
    margins: { left: number; right: number; top: number; bottom: number },
    startY: number,
  ) {
    const sold = numbers
      .filter((row) => {
        const s = resolveNumberStatus(row, now);
        return s === "PAID" || s === "WINNER";
      })
      .map((row) => row.number)
      .sort((a, b) => a - b);

    if (sold.length === 0) {
      ctx.fillStyle = this.theme.muted;
      ctx.font = "14px system-ui";
      ctx.fillText("Nenhum número vendido ainda.", margins.left, startY + 20);
      return;
    }

    ctx.font = "14px system-ui";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    ctx.fillStyle = this.theme.text;
    ctx.font = "bold 14px system-ui";
    ctx.fillText(`Números vendidos (${sold.length})`, margins.left, startY);
    const contentY = startY + 22;

    const padLen = String(campaign.number_end).length;
    const cols = settings.columns;
    const colW = (settings.width - margins.left - margins.right) / cols;
    const rowH = 20;

    sold.forEach((num, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      ctx.fillStyle = this.theme.text;
      ctx.font = "13px system-ui";
      ctx.fillText(
        String(num).padStart(padLen, "0"),
        margins.left + col * colW,
        contentY + row * rowH,
      );
    });
  }

  private drawFooter(
    ctx: CanvasRenderingContext2D,
    campaign: Campaign,
    canvasWidth: number,
    canvasHeight: number,
    margins: { left: number; right: number; bottom: number },
  ) {
    const y = canvasHeight - margins.bottom - 28;
    ctx.strokeStyle = this.theme.border;
    ctx.beginPath();
    ctx.moveTo(margins.left, y);
    ctx.lineTo(canvasWidth - margins.right, y);
    ctx.stroke();

    ctx.fillStyle = this.theme.muted;
    ctx.font = "10px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(`RaffleHub · /r/${campaign.slug}`, margins.left, y + 14);
    if (campaign.contact_phone) {
      ctx.textAlign = "right";
      ctx.fillText(`WhatsApp: ${campaign.contact_phone}`, canvasWidth - margins.right, y + 14);
    }
  }

  private getCellColor(status: NumberGridStatus, settings: ArtworkSettings): string {
    if (settings.highlightPaid && (status === "PAID" || status === "WINNER")) {
      return this.theme.status["PAID"] ?? "#22C55E";
    }
    if (settings.highlightReserved && status === "RESERVED") {
      return this.theme.status["RESERVED"] ?? "#FBBF24";
    }
    if (settings.highlightWinner && status === "WINNER") {
      return this.theme.status["WINNER"] ?? "#F59E0B";
    }
    return this.theme.status[status] ?? this.theme.muted;
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  static getMime(format: ArtworkFormat): string {
    return format === "png" ? "image/png" : "image/jpeg";
  }

  static getExtension(format: ArtworkFormat): string {
    return format;
  }
}
