import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { ERPCompany, ERPDepartment, ERPContract, ERPBusinessRule, ERPDashboardStats } from "./types";

const COMPANIES = "erp_companies";
const DEPARTMENTS = "erp_departments";
const CONTRACTS = "erp_contracts";
const RULES = "erp_rules";

export const erpService = {
  async getDashboard(): Promise<ERPDashboardStats> {
    const companies = await this.listCompanies();
    const departments = await this.listDepartments();
    const contracts = await this.listContracts();
    const rules = await this.listRules();
    const totalContractValue = contracts.filter(c => c.status === "active").reduce((s, c) => s + c.value, 0);
    return {
      totalCompanies: companies.length,
      activeCompanies: companies.filter(c => c.active).length,
      totalDepartments: departments.length,
      activeContracts: contracts.filter(c => c.status === "active").length,
      totalContractValue,
      expiredContracts: contracts.filter(c => c.status === "expired").length,
      activeRules: rules.length,
    };
  },

  /* Companies */
  async listCompanies(): Promise<ERPCompany[]> { return getStorage().findAll<ERPCompany>(COMPANIES); },
  async getCompany(id: string): Promise<ERPCompany | null> { return getStorage().find<ERPCompany>(COMPANIES, id); },
  async createCompany(data: Omit<ERPCompany, "id" | "createdAt" | "updatedAt">): Promise<ERPCompany> {
    const created = await getStorage().create<ERPCompany>(COMPANIES, data);
    eventBus.publish("erp.company.created", "entity", "erp", { id: created.id, name: created.name }).catch(() => {});
    return created;
  },
  async updateCompany(id: string, patch: Partial<ERPCompany>): Promise<ERPCompany> {
    const updated = await getStorage().update<ERPCompany>(COMPANIES, id, patch);
    eventBus.publish("erp.company.updated", "entity", "erp", { id, ...patch }).catch(() => {});
    return updated;
  },
  async removeCompany(id: string): Promise<void> {
    await getStorage().delete(COMPANIES, id);
    eventBus.publish("erp.company.deleted", "entity", "erp", { id }).catch(() => {});
  },

  /* Departments */
  async listDepartments(): Promise<ERPDepartment[]> { return getStorage().findAll<ERPDepartment>(DEPARTMENTS); },
  async getDepartment(id: string): Promise<ERPDepartment | null> { return getStorage().find<ERPDepartment>(DEPARTMENTS, id); },
  async createDepartment(data: Omit<ERPDepartment, "id" | "createdAt" | "updatedAt">): Promise<ERPDepartment> {
    const created = await getStorage().create<ERPDepartment>(DEPARTMENTS, data);
    eventBus.publish("erp.department.created", "entity", "erp", { id: created.id, name: created.name }).catch(() => {});
    return created;
  },
  async updateDepartment(id: string, patch: Partial<ERPDepartment>): Promise<ERPDepartment> {
    const updated = await getStorage().update<ERPDepartment>(DEPARTMENTS, id, patch);
    eventBus.publish("erp.department.updated", "entity", "erp", { id, ...patch }).catch(() => {});
    return updated;
  },
  async removeDepartment(id: string): Promise<void> {
    await getStorage().delete(DEPARTMENTS, id);
    eventBus.publish("erp.department.deleted", "entity", "erp", { id }).catch(() => {});
  },

  /* Contracts */
  async listContracts(): Promise<ERPContract[]> { return getStorage().findAll<ERPContract>(CONTRACTS); },
  async getContract(id: string): Promise<ERPContract | null> { return getStorage().find<ERPContract>(CONTRACTS, id); },
  async createContract(data: Omit<ERPContract, "id" | "createdAt" | "updatedAt">): Promise<ERPContract> {
    const created = await getStorage().create<ERPContract>(CONTRACTS, data);
    eventBus.publish("erp.contract.created", "entity", "erp", { id: created.id, number: created.number }).catch(() => {});
    return created;
  },
  async updateContract(id: string, patch: Partial<ERPContract>): Promise<ERPContract> {
    const updated = await getStorage().update<ERPContract>(CONTRACTS, id, patch);
    eventBus.publish("erp.contract.updated", "entity", "erp", { id, ...patch }).catch(() => {});
    return updated;
  },
  async removeContract(id: string): Promise<void> {
    await getStorage().delete(CONTRACTS, id);
    eventBus.publish("erp.contract.deleted", "entity", "erp", { id }).catch(() => {});
  },

  /* Business Rules */
  async listRules(): Promise<ERPBusinessRule[]> { return getStorage().findAll<ERPBusinessRule>(RULES); },
  async getRule(id: string): Promise<ERPBusinessRule | null> { return getStorage().find<ERPBusinessRule>(RULES, id); },
  async createRule(data: Omit<ERPBusinessRule, "id" | "createdAt" | "updatedAt">): Promise<ERPBusinessRule> {
    const created = await getStorage().create<ERPBusinessRule>(RULES, data);
    eventBus.publish("erp.rule.created", "entity", "erp", { id: created.id, key: created.key }).catch(() => {});
    return created;
  },
  async updateRule(id: string, patch: Partial<ERPBusinessRule>): Promise<ERPBusinessRule> {
    const updated = await getStorage().update<ERPBusinessRule>(RULES, id, patch);
    eventBus.publish("erp.rule.updated", "entity", "erp", { id, ...patch }).catch(() => {});
    return updated;
  },
  async removeRule(id: string): Promise<void> {
    await getStorage().delete(RULES, id);
    eventBus.publish("erp.rule.deleted", "entity", "erp", { id }).catch(() => {});
  },
};
