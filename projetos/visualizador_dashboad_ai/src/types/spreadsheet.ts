import { DataSourceType } from './survey';

/**
 * Standardized Google Drive file item returned by /api/google/drive/files
 */
export interface GoogleDriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: number | string;
  modifiedTime?: string;
  webViewLink?: string;
}

/**
 * Metadata for a sheet/tab within a spreadsheet
 */
export interface SheetMetadata {
  id?: string | number;
  name: string;
  index: number;
  rowCount?: number;
  columnCount?: number;
}

/**
 * Metadata for an entire spreadsheet
 */
export interface SpreadsheetMetadata {
  id: string;
  title: string;
  mimeType: string;
  sheets: SheetMetadata[];
}

/**
 * Standardized data structure for any spreadsheet format (Google Sheets, XLSX, CSV)
 * Requirement 10: Standardized structure agnostic of origin
 */
export interface SpreadsheetData {
  source: {
    type: 'google_sheets' | 'csv' | 'xlsx' | DataSourceType;
    id: string;
    name: string;
    mimeType?: string;
    webViewLink?: string;
  };
  sheet: {
    id?: string;
    name: string;
  };
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  columnCount: number;
}

/**
 * Google Auth status returned by /api/google/status
 */
export interface GoogleAuthStatus {
  configured: boolean;
  clientEmail?: string;
  projectId?: string;
  error?: string;
}
