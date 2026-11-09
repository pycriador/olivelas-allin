import * as XLSX from "xlsx";

export type DownloadFormat = "csv" | "xlsx" | "json";

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadData(
  headers: string[],
  rows: string[][],
  format: DownloadFormat,
  filename: string,
) {
  switch (format) {
    case "csv": {
      const csv = [
        headers.map(escapeCSV).join(","),
        ...rows.map((row) => row.map(escapeCSV).join(",")),
      ].join("\n");
      downloadBlob(csv, `${filename}.csv`, "text/csv;charset=utf-8");
      break;
    }
    case "xlsx": {
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      break;
    }
    case "json": {
      const data = rows.map((row) => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
          obj[h] = row[i] ?? "";
        });
        return obj;
      });
      downloadBlob(
        JSON.stringify(data, null, 2),
        `${filename}.json`,
        "application/json;charset=utf-8",
      );
      break;
    }
  }
}
