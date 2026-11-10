export type PageType = "cover" | "common" | "back_cover";

export type StickerStyle = {
  borderWidth?: number;       // px
  borderColor?: string;
  borderRadius?: number;      // px
  shadow?: boolean;
  backgroundColor?: string;
  numberStyle?: "badge" | "minimal" | "ribbon";
};

export type PageBackground = {
  color?: string;
  imageUrl?: string;
  overlay?: string;
};

export interface Album {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  settings: Record<string, unknown>;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface PageRow {
  id: string;
  album_id: string;
  name: string;
  order_index: number;
  page_type: PageType;
  background: PageBackground;
  settings: Record<string, unknown>;
}

export interface StickerRow {
  id: string;
  page_id: string;
  x_cm: number;
  y_cm: number;
  width_cm: number;
  height_cm: number;
  rotation: number;
  number: number | null;
  number_enabled: boolean;
  number_position: string;
  title: string | null;
  caption: string | null;
  style: StickerStyle;
  order_index: number;
}

export interface UploadRow {
  id: string;
  sticker_id: string;
  page_id: string;
  album_id: string;
  file_url: string;
  file_path: string;
  original_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  width_px: number | null;
  height_px: number | null;
  crop: Record<string, unknown>;
  created_at: string;
}