/**
 * Tipagens completas do Olivelas QR Code Studio
 */

export type DotType = 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded';
export type CornerSquareType = 'dot' | 'square' | 'extra-rounded';
export type CornerDotType = 'dot' | 'square';
export type GradientType = 'linear' | 'radial';
export type FrameStyle = 'none' | 'bottom' | 'top' | 'card';
export type ContentType = 'url' | 'whatsapp' | 'pix' | 'wifi' | 'vcard' | 'text';
export type ExportFormat = 'png' | 'svg' | 'webp';
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface GradientConfig {
  type: GradientType;
  rotation: number;
  color1: string;
  color2: string;
}

export interface Preset {
  id: string;
  name: string;
  category: 'popular' | 'business' | 'creative' | 'social' | 'dark' | 'pastel';
  dotsType: DotType;
  cornersSquareType: CornerSquareType;
  cornersDotType: CornerDotType;
  dotsColor: string;
  dotsGradient: GradientConfig | null;
  cornersColor: string;
  bgColor: string;
  previewGradient: string;
  presetLogo?: string;
  isDarkBg?: boolean;
}

export interface WikipediaLogo {
  id: string;
  name: string;
  brandColor: string;
  wikipediaFile: string;
  wikipediaUrl: string;
  svg: string;
  badgeDataUrl: string;
}

export interface ShortenerProvider {
  id: string;
  name: string;
  domain: string;
  shorten: (longUrl: string) => Promise<string>;
}

export interface QRState {
  contentType: ContentType;
  data: string;
  rawUrl: string;
  
  // Customizações do QR
  dotsType: DotType;
  dotsColor: string;
  dotsGradientEnabled: boolean;
  dotsGradientType: GradientType;
  dotsGradientRotation: number;
  dotsColor2: string;

  cornersSquareType: CornerSquareType;
  cornersSquareColor: string;
  cornersDotType: CornerDotType;
  cornersDotColor: string;
  cornersSync: boolean;

  bgColor: string;
  bgTransparent: boolean;

  // Logotipo
  logoType: 'none' | 'wikipedia' | 'custom';
  selectedWikipediaLogoId: string | null;
  customLogoDataUrl: string | null;
  customLogoFileName: string | null;
  logoSize: number;
  logoMargin: number;

  // Moldura
  frameStyle: FrameStyle;
  frameText: string;
  frameBgColor: string;
  frameTextColor: string;

  // Exportação
  exportSize: number;
  errorCorrectionLevel: ErrorCorrectionLevel;
  margin: number;

  // UI
  activePresetId: string | null;
  isSidebarCollapsed: boolean;
  activeView: 'app' | 'docs';
}

export interface HistoryItem {
  id: string;
  data: string;
  type: ContentType;
  timestamp: string;
  previewColor: string;
}
