import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { HREmployee, HRTimeSheet, HRPayroll, HRCommission, HRShiftSchedule, HRDashboardStats } from "./types";

const EMPLOYEES = "hr_employees";
const TIMESHEETS = "hr_timesheets";
const PAYROLLS = "hr_payrolls";
const COMMISSIONS = "hr_commissions";
const SHIFTS = "hr_shifts";

export const hrService = {
  async getDashboard(): Promise<HRDashboardStats> {
    const employees = await this.listEmployees();
    const timesheets = await this.listTimeSheets();
    const payrolls = await this.listPayrolls();
    const commissions = await this.listCommissions();
    const activeEmployees = employees.filter(e => e.status === "active").length;
    const vacationEmployees = employees.filter(e => e.status === "vacation").length;
    const pendingTimeSheets = timesheets.filter(t => t.status === "pending").length;
    const monthlyPayrollTotal = payrolls.filter(p => p.paymentStatus === "paid").reduce((s, p) => s + p.netSalary, 0);
    const pendingCommissions = commissions.filter(c => c.status === "pending").reduce((s, c) => s + c.value, 0);
    const paidCommissionsMonth = commissions.filter(c => c.status === "paid").reduce((s, c) => s + c.value, 0);
    return {
      totalEmployees: employees.length,
      activeEmployees,
      vacationEmployees,
      pendingTimeSheets,
      monthlyPayrollTotal,
      pendingCommissions,
      paidCommissionsMonth,
    };
  },

  /* Employees */
  async listEmployees(): Promise<HREmployee[]> { return getStorage().findAll<HREmployee>(EMPLOYEES); },
  async getEmployee(id: string): Promise<HREmployee | null> { return getStorage().find<HREmployee>(EMPLOYEES, id); },
  async createEmployee(data: Omit<HREmployee, "id" | "createdAt" | "updatedAt">): Promise<HREmployee> {
    const created = await getStorage().create<HREmployee>(EMPLOYEES, data);
    eventBus.publish("hr.employee.created", "entity", "hr", { id: created.id, name: created.name }).catch(() => {});
    return created;
  },
  async updateEmployee(id: string, patch: Partial<HREmployee>): Promise<HREmployee> {
    const updated = await getStorage().update<HREmployee>(EMPLOYEES, id, patch);
    eventBus.publish("hr.employee.updated", "entity", "hr", { id, ...patch }).catch(() => {});
    return updated;
  },
  async removeEmployee(id: string): Promise<void> {
    await getStorage().delete(EMPLOYEES, id);
    eventBus.publish("hr.employee.deleted", "entity", "hr", { id }).catch(() => {});
  },

  /* TimeSheets */
  async listTimeSheets(): Promise<HRTimeSheet[]> { return getStorage().findAll<HRTimeSheet>(TIMESHEETS); },
  async getTimeSheet(id: string): Promise<HRTimeSheet | null> { return getStorage().find<HRTimeSheet>(TIMESHEETS, id); },
  async createTimeSheet(data: Omit<HRTimeSheet, "id" | "createdAt">): Promise<HRTimeSheet> {
    const created = await getStorage().create<HRTimeSheet>(TIMESHEETS, data);
    eventBus.publish("hr.timesheet.created", "entity", "hr", { id: created.id, date: created.date }).catch(() => {});
    return created;
  },
  async updateTimeSheet(id: string, patch: Partial<HRTimeSheet>): Promise<HRTimeSheet> {
    const updated = await getStorage().update<HRTimeSheet>(TIMESHEETS, id, patch);
    eventBus.publish("hr.timesheet.updated", "entity", "hr", { id, ...patch }).catch(() => {});
    return updated;
  },

  /* Payroll */
  async listPayrolls(): Promise<HRPayroll[]> { return getStorage().findAll<HRPayroll>(PAYROLLS); },
  async getPayroll(id: string): Promise<HRPayroll | null> { return getStorage().find<HRPayroll>(PAYROLLS, id); },
  async createPayroll(data: Omit<HRPayroll, "id" | "createdAt" | "updatedAt">): Promise<HRPayroll> {
    const created = await getStorage().create<HRPayroll>(PAYROLLS, data);
    eventBus.publish("hr.payroll.created", "entity", "hr", { id: created.id, monthYear: created.monthYear }).catch(() => {});
    return created;
  },
  async updatePayroll(id: string, patch: Partial<HRPayroll>): Promise<HRPayroll> {
    const updated = await getStorage().update<HRPayroll>(PAYROLLS, id, patch);
    eventBus.publish("hr.payroll.updated", "entity", "hr", { id, ...patch }).catch(() => {});
    return updated;
  },

  /* Commissions */
  async listCommissions(): Promise<HRCommission[]> { return getStorage().findAll<HRCommission>(COMMISSIONS); },
  async getCommission(id: string): Promise<HRCommission | null> { return getStorage().find<HRCommission>(COMMISSIONS, id); },
  async createCommission(data: Omit<HRCommission, "id" | "createdAt">): Promise<HRCommission> {
    const created = await getStorage().create<HRCommission>(COMMISSIONS, data);
    eventBus.publish("hr.commission.created", "entity", "hr", { id: created.id, value: created.value }).catch(() => {});
    return created;
  },
  async updateCommission(id: string, patch: Partial<HRCommission>): Promise<HRCommission> {
    const updated = await getStorage().update<HRCommission>(COMMISSIONS, id, patch);
    eventBus.publish("hr.commission.updated", "entity", "hr", { id, ...patch }).catch(() => {});
    return updated;
  },

  /* Shifts */
  async listShifts(employeeId?: string): Promise<HRShiftSchedule[]> {
    const all = await getStorage().findAll<HRShiftSchedule>(SHIFTS);
    return employeeId ? all.filter(s => s.employeeId === employeeId) : all;
  },
  async createShift(data: Omit<HRShiftSchedule, "id" | "createdAt" | "updatedAt">): Promise<HRShiftSchedule> {
    return getStorage().create<HRShiftSchedule>(SHIFTS, data);
  },
  async updateShift(id: string, patch: Partial<HRShiftSchedule>): Promise<HRShiftSchedule> {
    return getStorage().update<HRShiftSchedule>(SHIFTS, id, patch);
  },
  async removeShift(id: string): Promise<void> { await getStorage().delete(SHIFTS, id); },
};
