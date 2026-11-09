import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type {
  Dashboard, Widget, Report, ReportTemplate, Dataset, Query, Kpi,
  ExportJob, ExecutionLog, AnalyticsEvent, Subscription,
} from "./types";

const DASHBOARD_COL = "rpt_dashboards";
const WIDGET_COL = "rpt_widgets";
const REPORT_COL = "rpt_reports";
const TEMPLATE_COL = "rpt_templates";
const DATASET_COL = "rpt_datasets";
const QUERY_COL = "rpt_queries";
const KPI_COL = "rpt_kpis";
const EXPORT_COL = "rpt_exports";
const EXEC_COL = "rpt_executions";
const ANALYTICS_COL = "rpt_analytics";
const SUBSCRIPTION_COL = "rpt_subscriptions";

function now(): string { return new Date().toISOString(); }

function paginate<T>(items: T[], page = 1, perPage = 50) {
  const total = items.length, totalPages = Math.max(1, Math.ceil(total / perPage));
  const p = Math.max(1, Math.min(page, totalPages));
  return { data: items.slice((p - 1) * perPage, p * perPage), total, page: p, perPage, totalPages };
}

function makeService<T extends { id: string }>(collection: string, eventNames?: { created?: string; updated?: string; deleted?: string }) {
  return {
    async list(): Promise<T[]> { return getStorage().findAll<T>(collection); },
    async get(id: string): Promise<T | null> { return getStorage().find<T>(collection, id); },
    async create(data: Omit<T, "id">): Promise<T> { const c = await getStorage().create<T>(collection, data); if (eventNames?.created) eventBus.publish(eventNames.created, "system", "reporting", { id: c.id }).catch(() => {}); return c; },
    async update(id: string, patch: Partial<T>): Promise<T> { const u = await getStorage().update<T>(collection, id, patch); if (eventNames?.updated) eventBus.publish(eventNames.updated, "system", "reporting", { id, ...patch }).catch(() => {}); return u; },
    async remove(id: string): Promise<void> { await getStorage().delete(collection, id); if (eventNames?.deleted) eventBus.publish(eventNames.deleted, "system", "reporting", { id }).catch(() => {}); },
    async count(): Promise<number> { return getStorage().count(collection); },
  };
}

export const dashboardService = makeService<Dashboard>(DASHBOARD_COL, {
  created: "rpt.dashboard.created",
  updated: "rpt.dashboard.updated",
  deleted: "rpt.dashboard.deleted",
});

export const widgetService = makeService<Widget>(WIDGET_COL, {
  created: "rpt.widget.created",
  updated: "rpt.widget.updated",
  deleted: "rpt.widget.deleted",
});

export const reportService = makeService<Report>(REPORT_COL, {
  created: "rpt.report.created",
  updated: "rpt.report.updated",
  deleted: "rpt.report.deleted",
});

export const templateService = makeService<ReportTemplate>(TEMPLATE_COL, {
  created: "rpt.template.created",
  updated: "rpt.template.updated",
  deleted: "rpt.template.deleted",
});

export const datasetService = makeService<Dataset>(DATASET_COL, {
  created: "rpt.dataset.created",
  updated: "rpt.dataset.updated",
  deleted: "rpt.dataset.deleted",
});

export const queryService = makeService<Query>(QUERY_COL);
export const kpiService = makeService<Kpi>(KPI_COL, { created: "rpt.kpi.created", updated: "rpt.kpi.updated", deleted: "rpt.kpi.deleted" });
export const exportService = makeService<ExportJob>(EXPORT_COL);
export const executionService = makeService<ExecutionLog>(EXEC_COL);
export const analyticsService = makeService<AnalyticsEvent>(ANALYTICS_COL);
export const subscriptionService = makeService<Subscription>(SUBSCRIPTION_COL);

export const dashboardBuilderService = {
  async getWidgets(dashboardId: string): Promise<Widget[]> {
    const dash = await dashboardService.get(dashboardId);
    if (!dash) return [];
    const allWidgets = await widgetService.list();
    const ids = dash.widgets.map(w => w.widgetId);
    return allWidgets.filter(w => ids.includes(w.id));
  },
  async addWidget(dashboardId: string, widgetId: string, tabId: string): Promise<Dashboard> {
    const dash = await dashboardService.get(dashboardId);
    if (!dash) throw new Error("Dashboard not found");
    const ref = { widgetId, tabId, x: 0, y: dash.widgets.length * 2, width: 4, height: 3, filters: {} };
    return dashboardService.update(dashboardId, { widgets: [...dash.widgets, ref] });
  },
  async removeWidget(dashboardId: string, widgetId: string): Promise<Dashboard> {
    const dash = await dashboardService.get(dashboardId);
    if (!dash) throw new Error("Dashboard not found");
    return dashboardService.update(dashboardId, { widgets: dash.widgets.filter(w => w.widgetId !== widgetId) });
  },
  async updateWidgetPosition(dashboardId: string, widgetId: string, x: number, y: number, width: number, height: number): Promise<Dashboard> {
    const dash = await dashboardService.get(dashboardId);
    if (!dash) throw new Error("Dashboard not found");
    const widgets = dash.widgets.map(w => w.widgetId === widgetId ? { ...w, x, y, width, height } : w);
    return dashboardService.update(dashboardId, { widgets });
  },
  async duplicate(dashboardId: string, newName: string, userId: string): Promise<Dashboard> {
    const dash = await dashboardService.get(dashboardId);
    if (!dash) throw new Error("Dashboard not found");
    const { id, ...rest } = dash;
    return dashboardService.create({ ...rest, name: newName, version: 1, favorite: false, createdBy: userId, createdAt: now(), updatedAt: now() });
  },
};

export const reportBuilderService = {
  async execute(reportId: string, params?: Record<string, string>): Promise<ExecutionLog> {
    const report = await reportService.get(reportId);
    const start = Date.now();
    const duration = Math.floor(Math.random() * 3000) + 500;
    const log: Omit<ExecutionLog, "id"> = {
      type: "report", referenceId: reportId, referenceName: report?.name ?? "Relatório",
      action: "executed", status: "success", duration, details: `Executado por ${duration}ms`,
      userId: "system", userName: "Sistema", companyId: report?.companyId, timestamp: now(),
    };
    const created = await executionService.create(log);
    eventBus.publish(EVENT_NAMES.REPORT_EXECUTED, "system", "reporting", { reportId, duration }).catch(() => {});
    if (report) await reportService.update(reportId, { lastExecutedAt: now(), lastExecutionStatus: "success" });
    return created;
  },
  async exportReport(reportId: string, format: string, userId: string): Promise<ExportJob> {
    const report = await reportService.get(reportId);
    const job = await exportService.create({
      reportId, reportName: report?.name ?? "Relatório", format: format as any,
      status: "completed", fileSize: Math.floor(Math.random() * 5000000) + 10000,
      fileName: `${report?.name ?? "report"}_${Date.now()}.${format}`,
      startedAt: now(), completedAt: now(), createdBy: userId, companyId: report?.companyId,
    });
    eventBus.publish(EVENT_NAMES.REPORT_EXPORTED, "system", "reporting", { reportId, format, jobId: job.id }).catch(() => {});
    return job;
  },
};

export const analyticsService_ext = {
  async track(event: string, category: string, label: string, userId: string, companyId?: string, value?: number): Promise<AnalyticsEvent> {
    return analyticsService.create({ event, category, label, value, userId, companyId, timestamp: now() });
  },
  async getKpiSummary(): Promise<{ total: number; onTarget: number; aboveTarget: number; belowTarget: number }> {
    const kpis = await kpiService.list();
    return {
      total: kpis.length,
      onTarget: kpis.filter(k => Math.abs((k.value / k.target) * 100 - 100) <= 5).length,
      aboveTarget: kpis.filter(k => (k.value / k.target) * 100 > 105).length,
      belowTarget: kpis.filter(k => (k.value / k.target) * 100 < 95).length,
    };
  },
};

export const permissionHelper = {
  canViewGlobal(dashboard: Dashboard, isGlobalAdmin: boolean): boolean { return dashboard.isGlobal ? isGlobalAdmin : true; },
  canEdit(dashboard: Dashboard, userId: string, roles: string[]): boolean {
    if (dashboard.createdBy === userId) return true;
    return dashboard.permissions.some(p => p.canEdit && ((p.userId === userId) || (p.roleId && roles.includes(p.roleId))));
  },
};
