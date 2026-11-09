export interface CRMLead {
  id: string;
  name: string;
  companyName?: string;
  phone: string;
  email: string;
  source: "website" | "referral" | "ads" | "event" | "outbound" | "other";
  status: "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "lost" | "converted";
  assignedTo?: string; // Employee Name
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CRMOpportunity {
  id: string;
  name: string;
  leadId?: string;
  customerId?: string;
  customerName: string;
  value: number;
  stage: "qualification" | "proposal" | "negotiation" | "won" | "lost";
  probability: number; // percentage
  expectedCloseDate: string;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CRMCustomerAgreement {
  id: string;
  customerId: string;
  customerName: string;
  slaHours: number;
  priority: "low" | "medium" | "high" | "critical";
  startDate: string;
  endDate: string;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CRMMarketingCampaign {
  id: string;
  name: string;
  type: "email" | "sms" | "social" | "webinar" | "event" | "other";
  budget: number;
  spent: number;
  status: "draft" | "active" | "completed" | "cancelled";
  leadsGenerated: number;
  revenue: number;
  startDate: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CRMDashboardStats {
  totalLeads: number;
  newLeads: number;
  convertedLeads: number;
  activeOpportunities: number;
  pipelineValue: number;
  wonValue: number;
  activeAgreements: number;
  campaignCount: number;
}
