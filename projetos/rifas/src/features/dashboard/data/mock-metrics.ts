export interface SeriesPoint {
  label: string;
  value: number;
}

export interface DashboardMetrics {
  users: number;
  campaigns: number;
  revenue: number;
  payments: number;
  revenueSeries: SeriesPoint[];
  paymentsSeries: SeriesPoint[];
}

// Dados temporários de demonstração — serão substituídos pelos módulos das próximas sprints.
export const MOCK_DASHBOARD: DashboardMetrics = {
  users: 1284,
  campaigns: 36,
  revenue: 184320,
  payments: 2471,
  revenueSeries: [
    { label: "Jan", value: 12400 },
    { label: "Fev", value: 15800 },
    { label: "Mar", value: 14200 },
    { label: "Abr", value: 19600 },
    { label: "Mai", value: 22400 },
    { label: "Jun", value: 27100 },
    { label: "Jul", value: 31200 },
  ],
  paymentsSeries: [
    { label: "Seg", value: 180 },
    { label: "Ter", value: 240 },
    { label: "Qua", value: 210 },
    { label: "Qui", value: 320 },
    { label: "Sex", value: 410 },
    { label: "Sáb", value: 360 },
    { label: "Dom", value: 280 },
  ],
};

export const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export const compact = new Intl.NumberFormat("pt-BR");
