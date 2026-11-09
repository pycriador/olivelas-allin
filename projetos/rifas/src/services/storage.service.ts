import { supabase } from "@/integrations/supabase/client";
import { auditService } from "@/services/audit.service";
import {
  ALLOWED_MIME_TYPES,
  DEFAULT_MAX_FILE_SIZE_MB,
  STORAGE_BUCKET,
  type StorageFile,
  type StorageFolder,
} from "@/types/storage";

const COLUMNS = "id, filename, path, mime_type, size, folder, uploaded_by, created_at, updated_at";

const SIGNED_URL_TTL = 60 * 60; // 1 hora
const LONG_SIGNED_URL_TTL = 60 * 60 * 24 * 365; // 1 ano (avatares)

export interface FileListParams {
  page: number;
  pageSize: number;
  search?: string;
  folder?: StorageFolder | undefined;
}

export interface FileListResult {
  rows: StorageFile[];
  total: number;
}

export function sanitizeFilename(name: string): string {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return (normalized || "arquivo").slice(0, 120).toLowerCase();
}

export function validateFile(
  file: File,
  options?: { maxSizeMb?: number; allowedTypes?: readonly string[] },
): string | null {
  const maxSizeMb = options?.maxSizeMb ?? DEFAULT_MAX_FILE_SIZE_MB;
  const allowed = options?.allowedTypes ?? ALLOWED_MIME_TYPES;

  if (!allowed.includes(file.type))
    return `Tipo de arquivo não permitido: ${file.type || "desconhecido"}`;
  if (file.size > maxSizeMb * 1024 * 1024) return `Arquivo maior que ${maxSizeMb} MB`;
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const storageService = {
  async upload(file: File, folder: StorageFolder, userId: string): Promise<StorageFile> {
    const path = `${userId}/${folder}/${Date.now()}-${sanitizeFilename(file.name)}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("storage_files")
      .insert({
        filename: file.name,
        path,
        mime_type: file.type || "application/octet-stream",
        size: file.size,
        folder,
        uploaded_by: userId,
      })
      .select(COLUMNS)
      .single();
    if (error) throw error;

    await auditService.log({
      action: "UPLOAD",
      entity: "storage_file",
      entityId: path,
      newValue: { filename: file.name, size: file.size, folder },
    });

    return data as unknown as StorageFile;
  },

  async list(params: FileListParams): Promise<FileListResult> {
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;

    let query = supabase
      .from("storage_files")
      .select(COLUMNS, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (params.folder) query = query.eq("folder", params.folder);
    if (params.search) query = query.ilike("filename", `%${params.search}%`);

    const { data, error, count } = await query;
    if (error) throw error;
    return { rows: (data ?? []) as unknown as StorageFile[], total: count ?? 0 };
  },

  async remove(file: StorageFile): Promise<void> {
    const { error: storageError } = await supabase.storage.from(STORAGE_BUCKET).remove([file.path]);
    if (storageError) throw storageError;

    const { error } = await supabase.from("storage_files").delete().eq("id", file.id);
    if (error) throw error;

    await auditService.log({
      action: "DELETE",
      entity: "storage_file",
      entityId: file.path,
      oldValue: { filename: file.filename, size: file.size },
    });
  },

  async signedUrl(path: string, expiresIn: number = SIGNED_URL_TTL): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, expiresIn);
    if (error) return null;
    return data.signedUrl;
  },

  async longSignedUrl(path: string): Promise<string | null> {
    return storageService.signedUrl(path, LONG_SIGNED_URL_TTL);
  },

  async download(file: StorageFile): Promise<string | null> {
    const url = await storageService.signedUrl(file.path);
    if (url) {
      await auditService.log({
        action: "DOWNLOAD",
        entity: "storage_file",
        entityId: file.path,
      });
    }
    return url;
  },

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from("storage_files")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    return count ?? 0;
  },
};
