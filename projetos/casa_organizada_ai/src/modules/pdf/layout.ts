// Print/PDF layout config — persisted as jsonb in pdf_layouts.config

export type PageFormat = "A4" | "A5" | "Letter";
export type Orientation = "portrait" | "landscape";

export const FORMAT_MM: Record<PageFormat, { w: number; h: number }> = {
  A4: { w: 210, h: 297 },
  A5: { w: 148, h: 210 },
  Letter: { w: 216, h: 279 },
};

export type PdfLayout = {
  format: PageFormat;
  orientation: Orientation;
  margins: { top: number; right: number; bottom: number; left: number }; // mm
  themeId: string | null;
  themeColors: { primary: string; accent: string; bg: string; fg: string };
  cover: {
    enabled: boolean;
    subtitle: string;
    author: string;
    showDate: boolean;
  };
  header: { enabled: boolean; text: string };
  footer: { enabled: boolean; text: string; showPageNumbers: boolean };
  fontScale: number; // 0.8 .. 1.4
};

export function defaultLayout(): PdfLayout {
  return {
    format: "A4",
    orientation: "portrait",
    margins: { top: 20, right: 18, bottom: 20, left: 18 },
    themeId: null,
    themeColors: { primary: "#7C5CFF", accent: "#F7A5A5", bg: "#FFFFFF", fg: "#1a1a1a" },
    cover: { enabled: true, subtitle: "", author: "", showDate: true },
    header: { enabled: false, text: "{title}" },
    footer: { enabled: true, text: "", showPageNumbers: true },
    fontScale: 1,
  };
}

export function pageSizeMm(layout: PdfLayout): { w: number; h: number } {
  const { w, h } = FORMAT_MM[layout.format];
  return layout.orientation === "portrait" ? { w, h } : { w: h, h: w };
}

export function fillPlaceholders(
  text: string,
  ctx: { page: number; total: number; title: string; date: string },
): string {
  return text
    .replace(/\{page\}/g, String(ctx.page))
    .replace(/\{total\}/g, String(ctx.total))
    .replace(/\{title\}/g, ctx.title)
    .replace(/\{date\}/g, ctx.date);
}