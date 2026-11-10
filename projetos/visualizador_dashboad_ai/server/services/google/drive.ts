import { google } from 'googleapis';
import type { GoogleDriveFileItem } from '../../../src/types/spreadsheet';

export const SUPPORTED_MIME_TYPES = {
  GOOGLE_SHEETS: 'application/vnd.google-apps.spreadsheet',
  GOOGLE_FORMS: 'application/vnd.google-apps.form',
  CSV: 'text/csv',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  XLS: 'application/vnd.ms-excel',
};

/**
 * Lists relevant files from Google Drive (Google Sheets, Google Forms, XLSX, CSV)
 * Filters out trashed files and folders, ordered by most recently modified.
 */
export async function listDriveFiles(
  authClient: any,
  searchQuery?: string
): Promise<GoogleDriveFileItem[]> {
  const drive = google.drive({ version: 'v3', auth: authClient });

  const mimeQuery = `(mimeType = '${SUPPORTED_MIME_TYPES.GOOGLE_SHEETS}' or mimeType = '${SUPPORTED_MIME_TYPES.GOOGLE_FORMS}' or mimeType = '${SUPPORTED_MIME_TYPES.CSV}' or mimeType = '${SUPPORTED_MIME_TYPES.XLSX}' or mimeType = '${SUPPORTED_MIME_TYPES.XLS}')`;
  
  let q = `trashed = false and ${mimeQuery}`;
  if (searchQuery && searchQuery.trim().length > 0) {
    // Sanitize single quotes to prevent injection in Drive query string
    const sanitized = searchQuery.trim().replace(/'/g, "\\'");
    q += ` and name contains '${sanitized}'`;
  }

  const response = await drive.files.list({
    q,
    pageSize: 50,
    orderBy: 'modifiedTime desc',
    fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const files = response.data.files || [];

  return files.map((file) => ({
    id: file.id || '',
    name: file.name || 'Sem título',
    mimeType: file.mimeType || '',
    size: file.size ? Number(file.size) : undefined,
    modifiedTime: file.modifiedTime || undefined,
    webViewLink: file.webViewLink || undefined,
  }));
}

/**
 * Retrieves metadata for a specific Google Drive file
 */
export async function getDriveFileMetadata(
  authClient: any,
  fileId: string
): Promise<GoogleDriveFileItem> {
  const drive = google.drive({ version: 'v3', auth: authClient });

  const response = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, modifiedTime, webViewLink',
    supportsAllDrives: true,
  });

  const file = response.data;
  return {
    id: file.id || fileId,
    name: file.name || 'Sem título',
    mimeType: file.mimeType || '',
    size: file.size ? Number(file.size) : undefined,
    modifiedTime: file.modifiedTime || undefined,
    webViewLink: file.webViewLink || undefined,
  };
}

/**
 * Downloads the raw binary buffer of a file from Google Drive (for XLSX / CSV)
 */
export async function downloadDriveFileBuffer(
  authClient: any,
  fileId: string
): Promise<Buffer> {
  const drive = google.drive({ version: 'v3', auth: authClient });

  const response = await drive.files.get(
    {
      fileId,
      alt: 'media',
      supportsAllDrives: true,
    },
    {
      responseType: 'arraybuffer',
    }
  );

  return Buffer.from(response.data as ArrayBuffer);
}
