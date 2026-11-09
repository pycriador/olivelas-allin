export const STORAGE_BUCKET = "files";

export const STORAGE_FOLDERS = ["uploads", "avatars", "campaigns", "documents", "temp"] as const;

export type StorageFolder = (typeof STORAGE_FOLDERS)[number];

export const STORAGE_FOLDER_LABELS: Record<StorageFolder, string> = {
  uploads: "Uploads",
  avatars: "Avatares",
  campaigns: "Campanhas",
  documents: "Documentos",
  temp: "Temporários",
};

export const DEFAULT_MAX_FILE_SIZE_MB = 10;

export const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
] as const;

export interface StorageFile {
  id: string;
  filename: string;
  path: string;
  mime_type: string;
  size: number;
  folder: string;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}
