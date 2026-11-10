import * as XLSX from 'xlsx';
import type { SpreadsheetData } from '../../types/spreadsheet';
import type { Survey } from '../../types/survey';
import { SpreadsheetTransformerService } from './spreadsheetTransformer';
import { DataProfiler, DataProfilerResult } from './dataProfiler';

export interface ParseResult {
  survey: Survey;
  spreadsheetData: SpreadsheetData;
  profilerResult: DataProfilerResult;
}

export class FileParserService {
  /**
   * Parses a File object (CSV, XLSX, XLS) into SpreadsheetData and Survey
   */
  public static async parseFile(file: File): Promise<ParseResult> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('O arquivo não contém nenhuma planilha ou tabela válida.');
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert sheet to JSON rows with header
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
      defval: null,
      raw: false,
    });

    if (rawRows.length === 0) {
      throw new Error('A planilha está vazia ou não possui linhas de dados.');
    }

    // Extract columns from the first row and all rows
    const columnSet = new Set<string>();
    for (const row of rawRows) {
      Object.keys(row).forEach((k) => {
        const trimmed = k.trim();
        if (trimmed) columnSet.add(trimmed);
      });
    }

    const columns = Array.from(columnSet);
    if (columns.length === 0) {
      throw new Error('Não foi possível identificar colunas ou cabeçalhos válidos no arquivo.');
    }

    // Normalize rows to match clean column headers
    const rows = rawRows.map((r) => {
      const cleanRow: Record<string, any> = {};
      columns.forEach((col) => {
        // Find exact or trimmed match
        const val = r[col] !== undefined ? r[col] : r[col.trim()];
        cleanRow[col] = val !== undefined ? val : null;
      });
      return cleanRow;
    });

    const isCsv = file.name.toLowerCase().endsWith('.csv');
    const mimeType = isCsv
      ? 'text/csv'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    const spreadsheetData: SpreadsheetData = {
      source: {
        id: `file_${Date.now()}`,
        name: file.name,
        mimeType,
        type: isCsv ? 'csv' : 'xlsx',
      },
      sheet: {
        name: firstSheetName,
        id: '0',
      },
      columns,
      rows,
      rowCount: rows.length,
      columnCount: columns.length,
    };

    const profilerResult = DataProfiler.profileDataset(columns, rows);
    const survey = SpreadsheetTransformerService.transformToSurvey(spreadsheetData);

    return {
      survey,
      spreadsheetData,
      profilerResult,
    };
  }

  /**
   * Fetches and parses a public URL (CSV or XLSX)
   */
  public static async parseUrl(url: string): Promise<ParseResult> {
    const trimmed = url.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      throw new Error('URL inválida. A URL deve iniciar com http:// ou https://');
    }

    const response = await fetch(trimmed);
    if (!response.ok) {
      throw new Error(`Falha ao carregar URL: HTTP ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    let spreadsheetData: SpreadsheetData;

    if (contentType.includes('application/json') || trimmed.endsWith('.json')) {
      const json = await response.json();
      const rowsArray = Array.isArray(json) ? json : json.data || json.responses || [json];
      if (!Array.isArray(rowsArray) || rowsArray.length === 0) {
        throw new Error('A resposta JSON não contém uma lista de dados para análise.');
      }

      const columns = Object.keys(rowsArray[0]);
      spreadsheetData = {
        source: {
          id: `url_${Date.now()}`,
          name: 'Dados via Webhook / URL REST',
          webViewLink: trimmed,
          mimeType: 'application/json',
          type: 'url',
        },
        sheet: {
          id: '0',
          name: 'API Data',
        },
        columns,
        rows: rowsArray,
        rowCount: rowsArray.length,
        columnCount: columns.length,
      };
    } else {
      const buffer = await response.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
        defval: null,
        raw: false,
      });

      if (rows.length === 0) {
        throw new Error('O arquivo da URL não contém registros para análise.');
      }

      const columns = Object.keys(rows[0]);
      spreadsheetData = {
        source: {
          id: `url_${Date.now()}`,
          name: trimmed.split('/').pop() || 'Planilha Remota',
          webViewLink: trimmed,
          mimeType: contentType || 'text/csv',
          type: 'url',
        },
        sheet: {
          id: '0',
          name: firstSheetName || 'Respostas',
        },
        columns,
        rows,
        rowCount: rows.length,
        columnCount: columns.length,
      };
    }

    const profilerResult = DataProfiler.profileDataset(
      spreadsheetData.columns,
      spreadsheetData.rows
    );
    const survey = SpreadsheetTransformerService.transformToSurvey(spreadsheetData);

    return {
      survey,
      spreadsheetData,
      profilerResult,
    };
  }
}
