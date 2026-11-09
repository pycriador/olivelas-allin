export type SettingCategory =
  "system" | "interface" | "security" | "payments" | "sharing" | "uploads" | "notifications";

export const SETTING_CATEGORY_LABELS: Record<SettingCategory, string> = {
  system: "Sistema",
  interface: "Interface",
  security: "Segurança",
  payments: "Pagamentos",
  sharing: "Compartilhamento",
  uploads: "Uploads",
  notifications: "Notificações",
};

export const SETTING_CATEGORY_DESCRIPTIONS: Record<SettingCategory, string> = {
  system: "Identidade, contato e disponibilidade da plataforma.",
  interface: "Tema, idioma, marca e cores padrão.",
  security: "Sessões, retenção de auditoria e aprovação de contas.",
  payments: "Preparação para os provedores de pagamento das próximas sprints.",
  sharing: "Links públicos e compartilhamento social.",
  uploads: "Limites e tipos de arquivo aceitos no Storage.",
  notifications: "Canais e frequência de comunicação.",
};

export type SettingValue = string | number | boolean | string[] | null;

export interface Setting {
  id: string;
  category: string;
  key: string;
  value: SettingValue;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
