import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { FinancialAccount, CostCenter, AccountPayable, AccountReceivable, FinancialTransaction, Invoice, FinancialDashboardStats } from "./types";

const ACCOUNTS = "fin_accounts";
const COST_CENTERS = "fin_cost_centers";
const PAYABLES = "fin_payables";
const RECEIVABLES = "fin_receivables";
const TRANSACTIONS = "fin_transactions";
const INVOICES = "fin_invoices";

export const financialService = {
  async getDashboard(): Promise<FinancialDashboardStats> {
    const accounts = await this.listAccounts();
    const payables = await this.listPayables();
    const receivables = await this.listReceivables();
    const currentBalance = accounts.reduce((s, a) => s + a.currentBalance, 0);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthlyIncome = receivables.filter(r => r.status === "received" && r.receivedAt && r.receivedAt >= monthStart).reduce((s, r) => s + (r.receivedValue || 0), 0);
    const monthlyExpense = payables.filter(p => p.status === "paid" && p.paidAt && p.paidAt >= monthStart).reduce((s, p) => s + (p.paidValue || 0), 0);
    return {
      totalAccounts: accounts.length,
      totalPayable: payables.reduce((s, p) => s + p.finalValue, 0),
      totalReceivable: receivables.reduce((s, r) => s + r.finalValue, 0),
      openPayable: payables.filter(p => p.status === "pending").reduce((s, p) => s + p.finalValue, 0),
      openReceivable: receivables.filter(r => r.status === "pending").reduce((s, r) => s + r.finalValue, 0),
      overduePayable: payables.filter(p => p.status === "overdue").reduce((s, p) => s + p.finalValue, 0),
      overdueReceivable: receivables.filter(r => r.status === "overdue").reduce((s, r) => s + r.finalValue, 0),
      monthlyIncome,
      monthlyExpense,
      currentBalance,
      cashFlow: monthlyIncome - monthlyExpense,
    };
  },

  /* Financial Accounts */
  async listAccounts(): Promise<FinancialAccount[]> { return getStorage().findAll<FinancialAccount>(ACCOUNTS); },
  async getAccount(id: string): Promise<FinancialAccount | null> { return getStorage().find<FinancialAccount>(ACCOUNTS, id); },
  async createAccount(data: Omit<FinancialAccount, "id" | "createdAt" | "updatedAt">): Promise<FinancialAccount> {
    const created = await getStorage().create<FinancialAccount>(ACCOUNTS, data);
    eventBus.publish(EVENT_NAMES.FINANCIAL_ACCOUNT_CREATED, "entity", "financial", { id: created.id, code: created.code }).catch(() => {});
    return created;
  },
  async updateAccount(id: string, patch: Partial<FinancialAccount>): Promise<FinancialAccount> {
    const updated = await getStorage().update<FinancialAccount>(ACCOUNTS, id, patch);
    eventBus.publish(EVENT_NAMES.FINANCIAL_ACCOUNT_UPDATED, "entity", "financial", { id, ...patch }).catch(() => {});
    return updated;
  },
  async removeAccount(id: string): Promise<void> {
    await getStorage().delete(ACCOUNTS, id);
    eventBus.publish(EVENT_NAMES.FINANCIAL_ACCOUNT_DELETED, "entity", "financial", { id }).catch(() => {});
  },

  /* Cost Centers */
  async listCostCenters(): Promise<CostCenter[]> { return getStorage().findAll<CostCenter>(COST_CENTERS); },
  async getCostCenter(id: string): Promise<CostCenter | null> { return getStorage().find<CostCenter>(COST_CENTERS, id); },
  async createCostCenter(data: Omit<CostCenter, "id" | "createdAt" | "updatedAt">): Promise<CostCenter> {
    const created = await getStorage().create<CostCenter>(COST_CENTERS, data);
    eventBus.publish(EVENT_NAMES.COST_CENTER_CREATED, "entity", "financial", { id: created.id, code: created.code }).catch(() => {});
    return created;
  },
  async updateCostCenter(id: string, patch: Partial<CostCenter>): Promise<CostCenter> {
    const updated = await getStorage().update<CostCenter>(COST_CENTERS, id, patch);
    eventBus.publish(EVENT_NAMES.COST_CENTER_UPDATED, "entity", "financial", { id, ...patch }).catch(() => {});
    return updated;
  },
  async removeCostCenter(id: string): Promise<void> {
    await getStorage().delete(COST_CENTERS, id);
    eventBus.publish(EVENT_NAMES.COST_CENTER_DELETED, "entity", "financial", { id }).catch(() => {});
  },

  /* Accounts Payable */
  async listPayables(): Promise<AccountPayable[]> { return getStorage().findAll<AccountPayable>(PAYABLES); },
  async getPayable(id: string): Promise<AccountPayable | null> { return getStorage().find<AccountPayable>(PAYABLES, id); },
  async createPayable(data: Omit<AccountPayable, "id" | "createdAt" | "updatedAt">): Promise<AccountPayable> {
    const created = await getStorage().create<AccountPayable>(PAYABLES, data);
    eventBus.publish(EVENT_NAMES.ACCOUNT_PAYABLE_CREATED, "entity", "financial", { id: created.id }).catch(() => {});
    return created;
  },
  async updatePayable(id: string, patch: Partial<AccountPayable>): Promise<AccountPayable> {
    const updated = await getStorage().update<AccountPayable>(PAYABLES, id, patch);
    if (patch.status === "paid") eventBus.publish(EVENT_NAMES.ACCOUNT_PAYABLE_PAID, "entity", "financial", { id }).catch(() => {});
    else if (patch.status === "cancelled") eventBus.publish(EVENT_NAMES.ACCOUNT_PAYABLE_CANCELLED, "entity", "financial", { id }).catch(() => {});
    return updated;
  },
  async removePayable(id: string): Promise<void> {
    await getStorage().delete(PAYABLES, id);
    eventBus.publish(EVENT_NAMES.ACCOUNT_PAYABLE_CANCELLED, "entity", "financial", { id }).catch(() => {});
  },

  /* Accounts Receivable */
  async listReceivables(): Promise<AccountReceivable[]> { return getStorage().findAll<AccountReceivable>(RECEIVABLES); },
  async getReceivable(id: string): Promise<AccountReceivable | null> { return getStorage().find<AccountReceivable>(RECEIVABLES, id); },
  async createReceivable(data: Omit<AccountReceivable, "id" | "createdAt" | "updatedAt">): Promise<AccountReceivable> {
    const created = await getStorage().create<AccountReceivable>(RECEIVABLES, data);
    eventBus.publish(EVENT_NAMES.ACCOUNT_RECEIVABLE_CREATED, "entity", "financial", { id: created.id }).catch(() => {});
    return created;
  },
  async updateReceivable(id: string, patch: Partial<AccountReceivable>): Promise<AccountReceivable> {
    const updated = await getStorage().update<AccountReceivable>(RECEIVABLES, id, patch);
    if (patch.status === "received") eventBus.publish(EVENT_NAMES.ACCOUNT_RECEIVABLE_RECEIVED, "entity", "financial", { id }).catch(() => {});
    else if (patch.status === "cancelled") eventBus.publish(EVENT_NAMES.ACCOUNT_RECEIVABLE_CANCELLED, "entity", "financial", { id }).catch(() => {});
    return updated;
  },
  async removeReceivable(id: string): Promise<void> {
    await getStorage().delete(RECEIVABLES, id);
    eventBus.publish(EVENT_NAMES.ACCOUNT_RECEIVABLE_CANCELLED, "entity", "financial", { id }).catch(() => {});
  },

  /* Transactions */
  async listTransactions(): Promise<FinancialTransaction[]> { return getStorage().findAll<FinancialTransaction>(TRANSACTIONS); },
  async getTransaction(id: string): Promise<FinancialTransaction | null> { return getStorage().find<FinancialTransaction>(TRANSACTIONS, id); },
  async createTransaction(data: Omit<FinancialTransaction, "id" | "createdAt">): Promise<FinancialTransaction> {
    const created = await getStorage().create<FinancialTransaction>(TRANSACTIONS, data);
    eventBus.publish(EVENT_NAMES.FINANCIAL_TRANSACTION_CREATED, "entity", "financial", { id: created.id }).catch(() => {});
    return created;
  },

  /* Invoices */
  async listInvoices(): Promise<Invoice[]> { return getStorage().findAll<Invoice>(INVOICES); },
  async getInvoice(id: string): Promise<Invoice | null> { return getStorage().find<Invoice>(INVOICES, id); },
  async createInvoice(data: Omit<Invoice, "id" | "createdAt" | "updatedAt">): Promise<Invoice> {
    const created = await getStorage().create<Invoice>(INVOICES, data);
    eventBus.publish(EVENT_NAMES.INVOICE_CREATED, "entity", "financial", { id: created.id, number: created.number }).catch(() => {});
    return created;
  },
  async updateInvoice(id: string, patch: Partial<Invoice>): Promise<Invoice> {
    const updated = await getStorage().update<Invoice>(INVOICES, id, patch);
    if (patch.status === "issued") eventBus.publish(EVENT_NAMES.INVOICE_ISSUED, "entity", "financial", { id }).catch(() => {});
    else if (patch.status === "cancelled") eventBus.publish(EVENT_NAMES.INVOICE_CANCELLED, "entity", "financial", { id }).catch(() => {});
    return updated;
  },
  async removeInvoice(id: string): Promise<void> { await getStorage().delete(INVOICES, id); },
};
