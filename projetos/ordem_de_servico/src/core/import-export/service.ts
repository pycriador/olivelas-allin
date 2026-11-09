import type { ExportConfig, ImportConfig, ImportResult, ExportFormat } from "./types";

export const exportService = {
  async exportData(config: ExportConfig): Promise<{ data: string; filename: string; mimeType: string }> {
    const { module, format, fields } = config;

    let items: any[] = [];
    try {
      const moduleMap: Record<string, { list: () => Promise<any[]> }> = {};
      const services: [string, string][] = [
        ["customers", "customerService"], ["devices", "deviceService"],
        ["technicians", "technicianService"], ["manufacturers", "manufacturerService"],
        ["brands", "brandService"], ["models", "modelService"],
        ["categories", "categoryService"], ["defects", "defectService"],
        ["services", "serviceService"], ["parts", "partService"],
        ["suppliers", "supplierService"], ["payment-methods", "paymentMethodService"],
        ["payment-terms", "paymentTermService"], ["warranties", "warrantyService"],
        ["measurement-units", "measurementUnitService"],
      ];
      for (const [m, s] of services) {
        if (m === module) {
          const mod = await import(`@/modules/${m}/service`);
          const svc = mod[s as keyof typeof mod] as { list: () => Promise<any[]> };
          items = await svc.list();
          break;
        }
      }
    } catch { items = []; }

    const filtered = items.map((item) => {
      const row: Record<string, unknown> = {};
      fields.forEach((f) => { row[f] = item[f]; });
      return row;
    });

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `${module}_export_${timestamp}`;

    switch (format) {
      case "json":
        return {
          data: JSON.stringify(filtered, null, 2),
          filename: `${filename}.json`,
          mimeType: "application/json",
        };
      case "csv": {
        const header = fields.join(",");
        const rows = filtered.map((r) => fields.map((f) => `"${String(r[f] ?? "").replace(/"/g, '""')}"`).join(","));
        return {
          data: [header, ...rows].join("\n"),
          filename: `${filename}.csv`,
          mimeType: "text/csv",
        };
      }
      case "xlsx":
        return {
          data: JSON.stringify({ format: "xlsx_placeholder", module, fields, rows: filtered }),
          filename: `${filename}.xlsx`,
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        };
      case "pdf":
        return {
          data: JSON.stringify({ format: "pdf_placeholder", module, fields, rows: filtered }),
          filename: `${filename}.pdf`,
          mimeType: "application/pdf",
        };
      default:
        return { data: JSON.stringify(filtered), filename: `${filename}.json`, mimeType: "application/json" };
    }
  },
};

export const importService = {
  async importData(_config: ImportConfig, _file: File): Promise<ImportResult> {
    return {
      totalRows: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
      errorDetails: ["Importação real será implementada na próxima sprint."],
    };
  },
};
