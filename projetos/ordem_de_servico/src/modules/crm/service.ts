import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type { CRMLead, CRMOpportunity, CRMCustomerAgreement, CRMMarketingCampaign, CRMDashboardStats } from "./types";

const LEADS = "crm_leads";
const OPPORTUNITIES = "crm_opportunities";
const AGREEMENTS = "crm_agreements";
const CAMPAIGNS = "crm_campaigns";

export const crmService = {
  async getDashboard(): Promise<CRMDashboardStats> {
    const leads = await this.listLeads();
    const opps = await this.listOpportunities();
    const agreements = await this.listAgreements();
    const campaigns = await this.listCampaigns();
    const pipelineValue = opps.filter(o => o.stage !== "won" && o.stage !== "lost").reduce((s, o) => s + o.value, 0);
    const wonValue = opps.filter(o => o.stage === "won").reduce((s, o) => s + o.value, 0);
    return {
      totalLeads: leads.length,
      newLeads: leads.filter(l => l.status === "new").length,
      convertedLeads: leads.filter(l => l.status === "converted").length,
      activeOpportunities: opps.filter(o => o.stage !== "won" && o.stage !== "lost").length,
      pipelineValue,
      wonValue,
      activeAgreements: agreements.filter(a => a.active).length,
      campaignCount: campaigns.length,
    };
  },

  /* Leads */
  async listLeads(): Promise<CRMLead[]> { return getStorage().findAll<CRMLead>(LEADS); },
  async getLead(id: string): Promise<CRMLead | null> { return getStorage().find<CRMLead>(LEADS, id); },
  async createLead(data: Omit<CRMLead, "id" | "createdAt" | "updatedAt">): Promise<CRMLead> {
    const created = await getStorage().create<CRMLead>(LEADS, data);
    eventBus.publish("crm.lead.created", "entity", "crm", { id: created.id, name: created.name }).catch(() => {});
    return created;
  },
  async updateLead(id: string, patch: Partial<CRMLead>): Promise<CRMLead> {
    const updated = await getStorage().update<CRMLead>(LEADS, id, patch);
    eventBus.publish("crm.lead.updated", "entity", "crm", { id, ...patch }).catch(() => {});
    return updated;
  },
  async removeLead(id: string): Promise<void> {
    await getStorage().delete(LEADS, id);
    eventBus.publish("crm.lead.deleted", "entity", "crm", { id }).catch(() => {});
  },

  /* Opportunities */
  async listOpportunities(): Promise<CRMOpportunity[]> { return getStorage().findAll<CRMOpportunity>(OPPORTUNITIES); },
  async getOpportunity(id: string): Promise<CRMOpportunity | null> { return getStorage().find<CRMOpportunity>(OPPORTUNITIES, id); },
  async createOpportunity(data: Omit<CRMOpportunity, "id" | "createdAt" | "updatedAt">): Promise<CRMOpportunity> {
    const created = await getStorage().create<CRMOpportunity>(OPPORTUNITIES, data);
    eventBus.publish("crm.opportunity.created", "entity", "crm", { id: created.id, name: created.name }).catch(() => {});
    return created;
  },
  async updateOpportunity(id: string, patch: Partial<CRMOpportunity>): Promise<CRMOpportunity> {
    const updated = await getStorage().update<CRMOpportunity>(OPPORTUNITIES, id, patch);
    eventBus.publish("crm.opportunity.updated", "entity", "crm", { id, ...patch }).catch(() => {});
    return updated;
  },
  async removeOpportunity(id: string): Promise<void> {
    await getStorage().delete(OPPORTUNITIES, id);
    eventBus.publish("crm.opportunity.deleted", "entity", "crm", { id }).catch(() => {});
  },

  /* Customer Agreements */
  async listAgreements(): Promise<CRMCustomerAgreement[]> { return getStorage().findAll<CRMCustomerAgreement>(AGREEMENTS); },
  async getAgreement(id: string): Promise<CRMCustomerAgreement | null> { return getStorage().find<CRMCustomerAgreement>(AGREEMENTS, id); },
  async createAgreement(data: Omit<CRMCustomerAgreement, "id" | "createdAt" | "updatedAt">): Promise<CRMCustomerAgreement> {
    const created = await getStorage().create<CRMCustomerAgreement>(AGREEMENTS, data);
    eventBus.publish("crm.agreement.created", "entity", "crm", { id: created.id, customerName: created.customerName }).catch(() => {});
    return created;
  },
  async updateAgreement(id: string, patch: Partial<CRMCustomerAgreement>): Promise<CRMCustomerAgreement> {
    const updated = await getStorage().update<CRMCustomerAgreement>(AGREEMENTS, id, patch);
    eventBus.publish("crm.agreement.updated", "entity", "crm", { id, ...patch }).catch(() => {});
    return updated;
  },
  async removeAgreement(id: string): Promise<void> {
    await getStorage().delete(AGREEMENTS, id);
    eventBus.publish("crm.agreement.deleted", "entity", "crm", { id }).catch(() => {});
  },

  /* Marketing Campaigns */
  async listCampaigns(): Promise<CRMMarketingCampaign[]> { return getStorage().findAll<CRMMarketingCampaign>(CAMPAIGNS); },
  async getCampaign(id: string): Promise<CRMMarketingCampaign | null> { return getStorage().find<CRMMarketingCampaign>(CAMPAIGNS, id); },
  async createCampaign(data: Omit<CRMMarketingCampaign, "id" | "createdAt" | "updatedAt">): Promise<CRMMarketingCampaign> {
    const created = await getStorage().create<CRMMarketingCampaign>(CAMPAIGNS, data);
    eventBus.publish("crm.campaign.created", "entity", "crm", { id: created.id, name: created.name }).catch(() => {});
    return created;
  },
  async updateCampaign(id: string, patch: Partial<CRMMarketingCampaign>): Promise<CRMMarketingCampaign> {
    const updated = await getStorage().update<CRMMarketingCampaign>(CAMPAIGNS, id, patch);
    eventBus.publish("crm.campaign.updated", "entity", "crm", { id, ...patch }).catch(() => {});
    return updated;
  },
  async removeCampaign(id: string): Promise<void> {
    await getStorage().delete(CAMPAIGNS, id);
    eventBus.publish("crm.campaign.deleted", "entity", "crm", { id }).catch(() => {});
  },
};
