import { google } from 'googleapis';
import * as XLSX from 'xlsx';
import type {
  SpreadsheetData,
  SpreadsheetMetadata,
  SheetMetadata,
} from '../../../src/types/spreadsheet';
import {
  getDriveFileMetadata,
  downloadDriveFileBuffer,
  SUPPORTED_MIME_TYPES,
} from './drive';

/**
 * Extracts and sanitizes column headers from the first row of tabular data.
 * Ensures headers are non-empty and unique.
 */
function processHeaders(rawHeaders: any[]): string[] {
  const seen = new Map<string, number>();
  const columns: string[] = [];

  for (let i = 0; i < rawHeaders.length; i++) {
    let colName = String(rawHeaders[i] ?? '').trim();
    if (!colName) {
      colName = `Coluna_${i + 1}`;
    }

    const count = seen.get(colName) || 0;
    if (count > 0) {
      seen.set(colName, count + 1);
      colName = `${colName}_${count + 1}`;
    } else {
      seen.set(colName, 1);
    }

    columns.push(colName);
  }

  return columns;
}

/**
 * Transforms a 2D matrix of values (first row = headers, rest = data) into standard columns & rows
 */
function matrixToColumnsAndRows(values: any[][]): {
  columns: string[];
  rows: Record<string, any>[];
} {
  if (!values || values.length === 0) {
    return { columns: [], rows: [] };
  }

  const rawHeaderRow = values[0] || [];
  const columns = processHeaders(rawHeaderRow);
  const rows: Record<string, any>[] = [];

  for (let r = 1; r < values.length; r++) {
    const rowValues = values[r] || [];
    // Check if row is completely empty
    const hasData = rowValues.some(
      (v: any) => v !== undefined && v !== null && String(v).trim() !== ''
    );
    if (!hasData) continue;

    const rowObj: Record<string, any> = {};
    for (let c = 0; c < columns.length; c++) {
      const colName = columns[c];
      const cellValue = rowValues[c];
      rowObj[colName] = cellValue !== undefined && cellValue !== null ? cellValue : null;
    }
    rows.push(rowObj);
  }

  return { columns, rows };
}

/**
 * Obtains metadata and available tabs for any supported spreadsheet (Sheets, XLSX, CSV)
 */
export async function getSpreadsheetMetadata(
  authClient: any,
  fileId: string
): Promise<SpreadsheetMetadata> {
  const fileMeta = await getDriveFileMetadata(authClient, fileId);

  // Case 1: Google Sheets native
  if (fileMeta.mimeType === SUPPORTED_MIME_TYPES.GOOGLE_SHEETS) {
    const sheetsApi = google.sheets({ version: 'v4', auth: authClient });
    const response = await sheetsApi.spreadsheets.get({
      spreadsheetId: fileId,
      fields: 'spreadsheetId,properties.title,sheets(properties(sheetId,title,index,gridProperties))',
    });

    const sheetProps = response.data.sheets || [];
    const sheets: SheetMetadata[] = sheetProps.map((s, idx) => ({
      id: s.properties?.sheetId?.toString() || `${idx}`,
      name: s.properties?.title || `Página ${idx + 1}`,
      index: s.properties?.index ?? idx,
      rowCount: s.properties?.gridProperties?.rowCount || undefined,
      columnCount: s.properties?.gridProperties?.columnCount || undefined,
    }));

    return {
      id: fileId,
      title: response.data.properties?.title || fileMeta.name,
      mimeType: fileMeta.mimeType,
      sheets,
    };
  }

  // Case 2: XLSX file stored on Drive
  if (
    fileMeta.mimeType === SUPPORTED_MIME_TYPES.XLSX ||
    fileMeta.mimeType === SUPPORTED_MIME_TYPES.XLS
  ) {
    const buffer = await downloadDriveFileBuffer(authClient, fileId);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    const sheets: SheetMetadata[] = workbook.SheetNames.map((name, index) => {
      const ws = workbook.Sheets[name];
      const range = ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']) : null;
      return {
        id: `${index}`,
        name,
        index,
        rowCount: range ? range.e.r - range.s.r + 1 : undefined,
        columnCount: range ? range.e.c - range.s.c + 1 : undefined,
      };
    });

    return {
      id: fileId,
      title: fileMeta.name,
      mimeType: fileMeta.mimeType,
      sheets,
    };
  }

  // Case 3: CSV file stored on Drive
  return {
    id: fileId,
    title: fileMeta.name,
    mimeType: fileMeta.mimeType,
    sheets: [
      {
        id: 'csv_data',
        name: 'Respostas (CSV)',
        index: 0,
      },
    ],
  };
}

/**
 * Fetches values from the selected sheet/tab and produces standard SpreadsheetData
 */
export async function getSpreadsheetData(
  authClient: any,
  fileId: string,
  sheetName?: string
): Promise<SpreadsheetData> {
  const fileMeta = await getDriveFileMetadata(authClient, fileId);

  // Case 1: Google Sheets
  if (fileMeta.mimeType === SUPPORTED_MIME_TYPES.GOOGLE_SHEETS) {
    const sheetsApi = google.sheets({ version: 'v4', auth: authClient });

    let targetSheetName = sheetName;
    let targetSheetId: string | undefined;

    if (!targetSheetName) {
      const meta = await getSpreadsheetMetadata(authClient, fileId);
      if (meta.sheets.length > 0) {
        targetSheetName = meta.sheets[0].name;
        targetSheetId = String(meta.sheets[0].id);
      } else {
        targetSheetName = 'Sheet1';
      }
    }

    const response = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: fileId,
      range: targetSheetName,
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING',
    });

    const values = response.data.values || [];
    const { columns, rows } = matrixToColumnsAndRows(values);

    return {
      source: {
        type: 'google_sheets',
        id: fileId,
        name: fileMeta.name,
        mimeType: fileMeta.mimeType,
        webViewLink: fileMeta.webViewLink,
      },
      sheet: {
        id: targetSheetId,
        name: targetSheetName || 'Sheet1',
      },
      columns,
      rows,
      rowCount: rows.length,
      columnCount: columns.length,
    };
  }

  // Case 2: XLSX
  if (
    fileMeta.mimeType === SUPPORTED_MIME_TYPES.XLSX ||
    fileMeta.mimeType === SUPPORTED_MIME_TYPES.XLS
  ) {
    const buffer = await downloadDriveFileBuffer(authClient, fileId);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    const targetSheetName = sheetName || workbook.SheetNames[0] || 'Sheet1';
    const worksheet = workbook.Sheets[targetSheetName];

    if (!worksheet) {
      throw new Error(`Aba "${targetSheetName}" não encontrada no arquivo XLSX.`);
    }

    const values = XLSX.utils.sheet_to_json<any[]>(worksheet, {
      header: 1,
      defval: null,
      blankrows: false,
    });

    const { columns, rows } = matrixToColumnsAndRows(values);

    return {
      source: {
        type: 'xlsx',
        id: fileId,
        name: fileMeta.name,
        mimeType: fileMeta.mimeType,
        webViewLink: fileMeta.webViewLink,
      },
      sheet: {
        name: targetSheetName,
      },
      columns,
      rows,
      rowCount: rows.length,
      columnCount: columns.length,
    };
  }

  // Case 3: CSV
  if (
    fileMeta.mimeType === SUPPORTED_MIME_TYPES.CSV ||
    fileMeta.mimeType.includes('csv') ||
    fileMeta.name.endsWith('.csv')
  ) {
    const buffer = await downloadDriveFileBuffer(authClient, fileId);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const values = XLSX.utils.sheet_to_json<any[]>(worksheet, {
      header: 1,
      defval: null,
      blankrows: false,
    });

    const { columns, rows } = matrixToColumnsAndRows(values);

    return {
      source: {
        type: 'csv',
        id: fileId,
        name: fileMeta.name,
        mimeType: fileMeta.mimeType,
        webViewLink: fileMeta.webViewLink,
      },
      sheet: {
        name: 'CSV Data',
      },
      columns,
      rows,
      rowCount: rows.length,
      columnCount: columns.length,
    };
  }

  throw new Error(`Tipo de arquivo não suportado: ${fileMeta.mimeType}`);
}
